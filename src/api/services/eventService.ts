import { eventParticipantRepository } from "../repositories/eventParticipantRepository";
import { Event, eventRepository } from "../repositories/eventRepository";

/**
 * 이벤트 서비스
 */
export const eventService = {
  /**
   * 활성 이벤트 목록 조회
   */
  async getActiveEvents(): Promise<Event[]> {
    try {
      return await eventRepository.getActiveEvents();
    } catch (error) {
      console.error("활성 이벤트 목록 조회 실패:", error);
      throw error;
    }
  },

  /**
   * 이벤트 상세 정보 조회
   */
  async getEventDetail(eventId: string): Promise<Event | null> {
    try {
      return await eventRepository.getEvent(eventId);
    } catch (error) {
      console.error(`이벤트 상세 정보 조회 실패 (ID: ${eventId}):`, error);
      throw error;
    }
  },

  /**
   * 새 이벤트 생성
   */
  async createEvent(
    eventData: Omit<Event, "id" | "created_at" | "status">,
    participants?: string[]
  ): Promise<Event> {
    try {
      // 1. 이벤트 생성
      const newEvent = await eventRepository.createEvent(eventData);

      // 2. 생성자를 참가자로 추가 (중복 없이)
      await eventParticipantRepository.addParticipant(
        newEvent.id,
        newEvent.created_by
      );

      // 3. 추가 참가자가 주어졌다면 추가
      if (participants && participants.length > 0) {
        // 생성자 ID와 동일한 참가자는 제외
        const filteredParticipants = participants.filter(
          (id) => id !== newEvent.created_by
        );

        if (filteredParticipants.length > 0) {
          await Promise.all(
            filteredParticipants.map((userId) =>
              eventParticipantRepository.addParticipant(newEvent.id, userId)
            )
          );
        }
      }

      return newEvent;
    } catch (error) {
      console.error("이벤트 생성 실패:", error);
      throw error;
    }
  },

  /**
   * 이벤트 상태 업데이트
   */
  async updateEventStatus(
    eventId: string,
    status: Event["status"]
  ): Promise<void> {
    try {
      await eventRepository.updateEventStatus(eventId, status);
    } catch (error) {
      console.error(`이벤트 상태 업데이트 실패 (ID: ${eventId}):`, error);
      throw error;
    }
  },

  /**
   * 이벤트 완료 처리
   */
  async completeEvent(eventId: string): Promise<void> {
    try {
      await eventRepository.completeEvent(eventId);
    } catch (error) {
      console.error(`이벤트 완료 처리 실패 (ID: ${eventId}):`, error);
      throw error;
    }
  },

  /**
   * 사용자 참여 이벤트 목록 조회
   * @param userId 사용자 ID
   * @returns 사용자가 참여 중인 이벤트 목록
   */
  async getUserEvents(userId: string): Promise<Event[]> {
    try {
      // 1. 사용자 참여 이벤트 IDs 조회
      const participations = await eventParticipantRepository.getUserEvents(
        userId
      );

      if (!participations.length) {
        return [];
      }

      // 2. 각 이벤트 상세 정보 조회
      const eventIds = participations.map((p) => p.event_id);
      const events: Event[] = [];

      for (const eventId of eventIds) {
        const event = await eventRepository.getEvent(eventId);
        if (event) {
          events.push(event);
        }
      }

      return events;
    } catch (error) {
      console.error(
        `사용자 참여 이벤트 목록 조회 실패 (User ID: ${userId}):`,
        error
      );
      throw error;
    }
  },
};

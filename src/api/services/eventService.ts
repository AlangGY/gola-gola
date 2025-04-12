import { eventParticipantRepository } from "../repositories/eventParticipantRepository";
import { Event, eventRepository } from "../repositories/eventRepository";
import { Gift } from "../repositories/giftRepository";
import { userRepository } from "../repositories/userRepository";
import { supabase } from "../supabase";

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

  /**
   * 이벤트 참가자 목록 조회 (선물 선택 정보 포함)
   */
  async getEventParticipantsWithGiftStatus(eventId: string): Promise<
    {
      id: string;
      user_id: string;
      username: string | null;
      has_selected_gift: boolean;
      selected_gift_description?: string;
      selected_gift_creator_name?: string;
    }[]
  > {
    try {
      // 1. 이벤트 참가자 목록 조회
      const participants =
        await eventParticipantRepository.getEventParticipants(eventId);

      if (!participants.length) {
        return [];
      }

      // 2. 모든 선물 정보 조회 (한 번에 가져와서 메모리에 저장)
      const { data: allGifts, error: giftsError } = await supabase
        .from("gifts")
        .select("id, event_id, description, created_by, received_by, status")
        .eq("event_id", eventId);

      if (giftsError) {
        throw giftsError;
      }

      // 3. 사용자 정보 캐시 생성
      const userCache = new Map();
      const getUserInfo = async (userId: string) => {
        if (userCache.has(userId)) {
          return userCache.get(userId);
        }
        const userInfo = await userRepository.getUser(userId);
        userCache.set(userId, userInfo);
        return userInfo;
      };

      // 4. 참가자들에 대한 선물 선택 여부 확인 및 사용자 정보 조회
      const participantsWithInfo = await Promise.all(
        participants.map(async (participant) => {
          // 4-1. 사용자 정보 조회
          const userProfile = await getUserInfo(participant.user_id);

          // 4-2. 사용자가 선택한 선물 찾기
          const selectedGift = allGifts.find(
            (
              gift: Pick<
                Gift,
                "received_by" | "event_id" | "description" | "created_by"
              >
            ) =>
              gift.received_by === participant.user_id &&
              gift.event_id === eventId
          );

          // 4-3. 선물이 있는 경우 선물 등록자 정보 조회
          let creatorName = null;
          if (selectedGift) {
            const creatorProfile = await getUserInfo(selectedGift.created_by);
            creatorName = creatorProfile?.username || "익명 사용자";
          }

          return {
            id: participant.id,
            user_id: participant.user_id,
            username: userProfile?.username || null,
            has_selected_gift: !!selectedGift,
            selected_gift_description: selectedGift?.description,
            selected_gift_creator_name: creatorName,
          };
        })
      );

      return participantsWithInfo;
    } catch (error) {
      console.error(
        `이벤트 참가자 목록 조회 실패 (Event ID: ${eventId}):`,
        error
      );
      throw error;
    }
  },
};

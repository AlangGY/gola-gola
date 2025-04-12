import { eventParticipantRepository } from "../repositories/eventParticipantRepository";
import {
  AnonymousGift,
  Gift,
  giftRepository,
} from "../repositories/giftRepository";

/**
 * 선물 서비스
 */
export const giftService = {
  /**
   * 이벤트의 선택 가능한 선물 목록 조회
   */
  async getAvailableGifts(eventId: string): Promise<AnonymousGift[]> {
    try {
      return await giftRepository.getAvailableGifts(eventId);
    } catch (error) {
      console.error(
        `이벤트 선물 목록 조회 실패 (Event ID: ${eventId}):`,
        error
      );
      throw error;
    }
  },

  /**
   * 새 선물 생성
   */
  async createGift(
    eventId: string,
    userId: string,
    description: string
  ): Promise<Gift> {
    try {
      // 1. 이벤트가 존재하고 사용자가 참가자인지 확인
      const isParticipant = await eventParticipantRepository.isParticipant(
        eventId,
        userId
      );
      if (!isParticipant) {
        throw new Error("이벤트 참가자만 선물을 등록할 수 있습니다.");
      }

      // 2. 선물 생성
      return await giftRepository.createGift({
        event_id: eventId,
        description,
        created_by: userId,
      });
    } catch (error) {
      console.error("선물 생성 실패:", error);
      throw error;
    }
  },

  /**
   * 선물 선택
   */
  async selectGift(giftId: string, userId: string): Promise<void> {
    try {
      await giftRepository.selectGift(giftId, userId);
    } catch (error) {
      console.error(`선물 선택 실패 (Gift ID: ${giftId}):`, error);
      throw error;
    }
  },

  /**
   * 사용자가 이벤트에 선물을 등록했는지 확인
   */
  async hasUserRegisteredGift(
    eventId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const { created } = await giftRepository.getUserGifts(userId);
      return created.some((gift) => gift.event_id === eventId);
    } catch (error) {
      console.error(
        `사용자 선물 등록 확인 실패 (User ID: ${userId}, Event ID: ${eventId}):`,
        error
      );
      throw error;
    }
  },

  /**
   * 사용자의 선물 목록 조회
   */
  async getUserGifts(userId: string): Promise<{
    created: Gift[];
    received: AnonymousGift[];
  }> {
    try {
      return await giftRepository.getUserGifts(userId);
    } catch (error) {
      console.error(`사용자 선물 목록 조회 실패 (User ID: ${userId}):`, error);
      throw error;
    }
  },

  /**
   * 사용자가 이벤트에서 선택한 선물 조회
   */
  async getUserSelectedGift(
    eventId: string,
    userId: string
  ): Promise<AnonymousGift | null> {
    try {
      const { received } = await giftRepository.getUserGifts(userId);
      // 해당 이벤트에서 사용자가 선택한 선물 찾기
      const selectedGift = received.find((gift) => gift.event_id === eventId);
      return selectedGift || null;
    } catch (error) {
      console.error(
        `사용자 선택 선물 조회 실패 (User ID: ${userId}, Event ID: ${eventId}):`,
        error
      );
      throw error;
    }
  },

  /**
   * 선택한 선물 취소
   */
  async cancelSelectedGift(giftId: string, userId: string): Promise<void> {
    try {
      await giftRepository.cancelGiftSelection(giftId, userId);
    } catch (error) {
      console.error(`선물 선택 취소 실패 (Gift ID: ${giftId}):`, error);
      throw error;
    }
  },
};

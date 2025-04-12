import { giftRepository } from "../repositories/giftRepository";
import {
  GiftReview,
  giftReviewRepository,
} from "../repositories/giftReviewRepository";

export interface GiftReviewWithGiftInfo extends GiftReview {
  gift_description?: string;
}

export const giftReviewService = {
  /**
   * 선물에 대한 리뷰 생성
   */
  async createReview(
    giftId: string,
    userId: string,
    content: string,
    rating: number
  ): Promise<GiftReview> {
    try {
      // 이미 리뷰를 작성했는지 확인
      const existingReview = await giftReviewRepository.getReviewForGift(
        giftId
      );
      if (existingReview && existingReview.reviewer_id === userId) {
        throw new Error("이미 이 선물에 리뷰를 작성하셨습니다.");
      }

      // 리뷰 작성
      return await giftReviewRepository.createReview({
        gift_id: giftId,
        reviewer_id: userId,
        content,
        rating,
      });
    } catch (error) {
      console.error("리뷰 작성 실패:", error);
      throw error;
    }
  },

  /**
   * 선물에 대한 리뷰 조회
   */
  async getReviewForGift(giftId: string): Promise<GiftReview | null> {
    try {
      return await giftReviewRepository.getReviewForGift(giftId);
    } catch (error) {
      console.error(`선물 리뷰 조회 실패 (Gift ID: ${giftId}):`, error);
      throw error;
    }
  },

  /**
   * 사용자가 작성한 리뷰 목록 조회
   */
  async getUserReviews(userId: string): Promise<GiftReviewWithGiftInfo[]> {
    try {
      const reviews = await giftReviewRepository.getUserReviews(userId);

      // 각 리뷰에 선물 정보 추가
      const reviewsWithGiftInfo = await Promise.all(
        reviews.map(async (review) => {
          const { data, error } = await giftRepository.getGiftById(
            review.gift_id
          );
          if (error || !data) {
            return {
              ...review,
              gift_description: "삭제된 선물",
            };
          }

          return {
            ...review,
            gift_description: data.description,
          };
        })
      );

      return reviewsWithGiftInfo;
    } catch (error) {
      console.error(`사용자 리뷰 목록 조회 실패 (User ID: ${userId}):`, error);
      throw error;
    }
  },

  /**
   * 이벤트에 대한 모든 리뷰 조회 (익명으로)
   */
  async getEventReviews(eventId: string): Promise<
    {
      gift_id: string;
      content: string;
      rating: number;
      created_at: string;
    }[]
  > {
    try {
      return await giftReviewRepository.getEventReviews(eventId);
    } catch (error) {
      console.error(
        `이벤트 리뷰 목록 조회 실패 (Event ID: ${eventId}):`,
        error
      );
      throw error;
    }
  },

  /**
   * 리뷰 수정
   */
  async updateReview(
    reviewId: string,
    userId: string,
    content: string,
    rating: number
  ): Promise<void> {
    try {
      // 먼저 선물 ID로 리뷰 정보 가져오기
      const reviews = await giftReviewRepository.getUserReviews(userId);
      const review = reviews.find((r) => r.id === reviewId);

      if (!review) {
        throw new Error("리뷰를 찾을 수 없거나 권한이 없습니다.");
      }

      // 리뷰 수정
      await giftReviewRepository.updateReview(reviewId, { content, rating });
    } catch (error) {
      console.error(`리뷰 수정 실패 (Review ID: ${reviewId}):`, error);
      throw error;
    }
  },

  /**
   * 리뷰 삭제
   */
  async deleteReview(reviewId: string, userId: string): Promise<void> {
    try {
      // 먼저 선물 ID로 리뷰 정보 가져오기
      const reviews = await giftReviewRepository.getUserReviews(userId);
      const review = reviews.find((r) => r.id === reviewId);

      if (!review) {
        throw new Error("리뷰를 찾을 수 없거나 권한이 없습니다.");
      }

      // 리뷰 삭제
      await giftReviewRepository.deleteReview(reviewId);
    } catch (error) {
      console.error(`리뷰 삭제 실패 (Review ID: ${reviewId}):`, error);
      throw error;
    }
  },
};

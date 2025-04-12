import { supabase } from "../supabase";

export interface GiftReview {
  id: string;
  gift_id: string;
  reviewer_id: string;
  content: string;
  rating: number;
  created_at: string;
}

export const giftReviewRepository = {
  /**
   * 리뷰 생성
   */
  async createReview(
    review: Omit<GiftReview, "id" | "created_at">
  ): Promise<GiftReview> {
    const { data, error } = await supabase
      .from("gift_reviews")
      .insert([review])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * 선물에 대한 리뷰 조회
   */
  async getReviewForGift(giftId: string): Promise<GiftReview | null> {
    const { data, error } = await supabase
      .from("gift_reviews")
      .select("*")
      .eq("gift_id", giftId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // 결과가 없는 경우
        return null;
      }
      throw error;
    }
    return data;
  },

  /**
   * 사용자가 작성한 리뷰 조회
   */
  async getUserReviews(userId: string): Promise<GiftReview[]> {
    const { data, error } = await supabase
      .from("gift_reviews")
      .select("*")
      .eq("reviewer_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * 이벤트의 모든 리뷰 조회 (선물 ID를 통해)
   */
  async getEventReviews(eventId: string): Promise<
    {
      gift_id: string;
      content: string;
      rating: number;
      created_at: string;
    }[]
  > {
    // 먼저 이벤트에 속한 선물 ID들을 가져옴
    const { data: giftIds, error: giftError } = await supabase
      .from("gifts")
      .select("id")
      .eq("event_id", eventId);

    if (giftError) throw giftError;
    if (!giftIds.length) return [];

    // 선물 ID 배열 추출
    const ids = giftIds.map((g) => g.id);

    // 리뷰 조회
    const { data, error } = await supabase
      .from("gift_reviews")
      .select(
        `
        gift_id,
        content,
        rating,
        created_at
      `
      )
      .in("gift_id", ids)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * 리뷰 수정
   */
  async updateReview(
    reviewId: string,
    updates: Pick<GiftReview, "content" | "rating">
  ): Promise<void> {
    const { error } = await supabase
      .from("gift_reviews")
      .update(updates)
      .eq("id", reviewId);

    if (error) throw error;
  },

  /**
   * 리뷰 삭제
   */
  async deleteReview(reviewId: string): Promise<void> {
    const { error } = await supabase
      .from("gift_reviews")
      .delete()
      .eq("id", reviewId);

    if (error) throw error;
  },
};

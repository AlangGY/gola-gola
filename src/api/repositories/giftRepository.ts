import { supabase } from "../supabase";

export interface Gift {
  id: string;
  event_id: string;
  description: string;
  created_by: string;
  received_by?: string;
  created_at: string;
  status: "available" | "selected" | "completed";
}

export interface AnonymousGift {
  id: string;
  event_id: string;
  description: string;
  created_at: string;
  status: "available" | "selected" | "completed";
}

export const giftRepository = {
  async createGift(
    gift: Omit<Gift, "id" | "created_at" | "status">
  ): Promise<Gift> {
    const { data, error } = await supabase
      .from("gifts")
      .insert([
        {
          ...gift,
          status: "available",
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getAvailableGifts(eventId: string): Promise<AnonymousGift[]> {
    const { data, error } = await supabase
      .from("gifts")
      .select("id, event_id, description, created_at, status")
      .eq("event_id", eventId)
      .eq("status", "available")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data ? shuffleArray(data) : [];
  },

  async selectGift(giftId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from("gifts")
      .update({
        received_by: userId,
        status: "selected",
      })
      .eq("id", giftId)
      .eq("status", "available");

    if (error) throw error;
  },

  async getUserGifts(userId: string): Promise<{
    created: Gift[];
    received: AnonymousGift[];
  }> {
    const { data: createdGifts, error: createdError } = await supabase
      .from("gifts")
      .select("*")
      .eq("created_by", userId);

    if (createdError) throw createdError;

    const { data: receivedGifts, error: receivedError } = await supabase
      .from("gifts")
      .select("id, event_id, description, created_at, status")
      .eq("received_by", userId);

    if (receivedError) throw receivedError;

    return {
      created: createdGifts || [],
      received: receivedGifts || [],
    };
  },

  async completeGiftsForEvent(eventId: string): Promise<void> {
    const { error } = await supabase
      .from("gifts")
      .update({ status: "completed" })
      .eq("event_id", eventId)
      .in("status", ["available", "selected"]);

    if (error) throw error;
  },

  /**
   * 선물 선택 취소
   */
  async cancelGiftSelection(giftId: string, userId: string): Promise<void> {
    // 선택한 사용자가 맞는지 확인 후 취소
    const { error } = await supabase
      .from("gifts")
      .update({
        received_by: null,
        status: "available",
      })
      .eq("id", giftId)
      .eq("received_by", userId) // 해당 사용자가 선택한 선물만 취소 가능
      .eq("status", "selected");

    if (error) throw error;
  },
};

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

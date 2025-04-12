import { supabase } from "../supabase";
import { giftRepository } from "./giftRepository";

export interface Event {
  id: string;
  title: string;
  description?: string;
  created_by: string;
  start_date: string;
  end_date: string;
  status:
    | "gift_registration"
    | "gift_selection"
    | "active"
    | "completed"
    | "cancelled";
  created_at: string;
}

export const eventRepository = {
  async createEvent(
    event: Omit<Event, "id" | "created_at" | "status" | "created_by">
  ): Promise<Event> {
    const { data: user, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    const { data, error } = await supabase
      .from("events")
      .insert([
        {
          ...event,
          status: "gift_registration",
          created_by: user.user?.id,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getEvent(eventId: string): Promise<Event | null> {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (error) throw error;
    return data;
  },

  async getActiveEvents(): Promise<Event[]> {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .in("status", ["gift_registration", "gift_selection", "active"])
      .gt("end_date", new Date().toISOString());

    if (error) throw error;
    return data || [];
  },

  async updateEventStatus(
    eventId: string,
    status: Event["status"]
  ): Promise<void> {
    const { error } = await supabase
      .from("events")
      .update({ status })
      .eq("id", eventId);

    if (error) throw error;
  },

  async completeEvent(eventId: string): Promise<void> {
    // 트랜잭션으로 처리하는 것이 좋지만, Supabase는 클라이언트 측 트랜잭션을 지원하지 않음
    // 따라서 두 단계로 처리

    // 1. 이벤트 상태를 completed로 변경
    await this.updateEventStatus(eventId, "completed");

    // 2. 이벤트의 모든 선물 상태를 completed로 변경
    await giftRepository.completeGiftsForEvent(eventId);
  },

  async checkAndCompleteExpiredEvents(): Promise<void> {
    // 종료 날짜가 지났지만 아직 active 상태인 이벤트 조회
    const { data, error } = await supabase
      .from("events")
      .select("id")
      .eq("status", "active")
      .lt("end_date", new Date().toISOString());

    if (error) throw error;

    // 각 이벤트를 completed로 변경
    for (const event of data || []) {
      await this.completeEvent(event.id);
    }
  },
};

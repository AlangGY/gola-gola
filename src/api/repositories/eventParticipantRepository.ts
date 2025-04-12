import { supabase } from "../supabase";

export interface EventParticipant {
  id: string;
  event_id: string;
  user_id: string;
  created_at: string;
}

export const eventParticipantRepository = {
  async addParticipant(
    eventId: string,
    userId: string
  ): Promise<EventParticipant> {
    const { data, error } = await supabase
      .from("event_participants")
      .insert([
        {
          event_id: eventId,
          user_id: userId,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getEventParticipants(eventId: string): Promise<EventParticipant[]> {
    const { data, error } = await supabase
      .from("event_participants")
      .select("*")
      .eq("event_id", eventId);

    if (error) throw error;
    return data || [];
  },

  async getUserEvents(userId: string): Promise<EventParticipant[]> {
    const { data, error } = await supabase
      .from("event_participants")
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;
    return data || [];
  },

  async isParticipant(eventId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("event_participants")
      .select("*")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .single();

    if (error) throw error;
    return !!data;
  },
};

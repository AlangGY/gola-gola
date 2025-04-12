import { supabase } from "../supabase";

export interface Invitation {
  id: string;
  code: string;
  created_by: string;
  used_by?: string;
  created_at: string;
  expires_at: string;
  is_valid: boolean;
}

export const invitationRepository = {
  async createInvitation(
    createdBy: string,
    expiresAt: Date
  ): Promise<Invitation> {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data, error } = await supabase
      .from("invitations")
      .insert([
        {
          code,
          created_by: createdBy,
          expires_at: expiresAt.toISOString(),
          is_valid: true,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getInvitation(code: string): Promise<Invitation | null> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("invitations")
      .select("*")
      .eq("code", code)
      .eq("is_valid", true)
      .gt("expires_at", now)
      .single();

    if (error) throw error;
    return data;
  },

  async useInvitation(code: string, usedBy: string): Promise<void> {
    const { error } = await supabase
      .from("invitations")
      .update({
        used_by: usedBy,
        is_valid: false,
      })
      .eq("code", code)
      .eq("is_valid", true);

    if (error) throw error;
  },

  async invalidateExpiredInvitations(): Promise<void> {
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("invitations")
      .update({ is_valid: false })
      .eq("is_valid", true)
      .lt("expires_at", now);

    if (error) throw error;
  },

  async getUserInvitations(userId: string): Promise<Invitation[]> {
    const { data, error } = await supabase
      .from("invitations")
      .select("*")
      .eq("created_by", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },
};

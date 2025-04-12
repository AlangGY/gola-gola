import { supabase } from "../supabase";

export interface User {
  id: string;
  username: string;
  created_at: string;
  last_login?: string;
}

export const userRepository = {
  async createUser(userId: string, username: string): Promise<User> {
    const { data, error } = await supabase
      .from("users")
      .insert([{ id: userId, username }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getUser(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data;
  },

  async updateLastLogin(userId: string): Promise<void> {
    const { error } = await supabase
      .from("users")
      .update({ last_login: new Date().toISOString() })
      .eq("id", userId);

    if (error) throw error;
  },
};

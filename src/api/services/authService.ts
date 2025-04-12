import { invitationRepository } from "../repositories/invitationRepository";
import { userRepository } from "../repositories/userRepository";
import { supabase } from "../supabase";

export interface AuthUser {
  id: string;
  email: string;
}

export const authService = {
  /**
   * 초대 코드 검증
   */
  async verifyInviteCode(code: string): Promise<boolean> {
    try {
      const invitation = await invitationRepository.getInvitation(code);
      return !!invitation;
    } catch (error) {
      console.error("초대 코드 검증 실패:", error);
      return false;
    }
  },

  /**
   * 이메일과 비밀번호로 회원가입
   */
  async signUp(
    email: string,
    password: string,
    username: string,
    inviteCode: string
  ): Promise<{ user: AuthUser | null; error: Error | null }> {
    try {
      // 1. 초대 코드 유효성 재확인
      const invitation = await invitationRepository.getInvitation(inviteCode);
      if (!invitation) {
        return {
          user: null,
          error: new Error("유효하지 않은 초대 코드입니다."),
        };
      }

      // 2. Supabase Auth로 사용자 생성
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError || !authData.user) {
        return {
          user: null,
          error: authError || new Error("회원가입 중 오류가 발생했습니다."),
        };
      }

      const { user: signedInUser } = await this.signIn(email, password);

      if (!signedInUser) {
        return {
          user: null,
          error: new Error("로그인 중 오류가 발생했습니다."),
        };
      }

      // 3. 사용자 프로필 정보 저장
      await userRepository.createUser(signedInUser.id, username);

      // 4. 초대 코드 사용 처리
      await invitationRepository.useInvitation(inviteCode, authData.user.id);

      return {
        user: {
          id: authData.user.id,
          email: authData.user.email || email,
        },
        error: null,
      };
    } catch (error) {
      console.error("회원가입 실패:", error);
      return {
        user: null,
        error:
          error instanceof Error
            ? error
            : new Error("알 수 없는 오류가 발생했습니다."),
      };
    }
  },

  /**
   * 이메일과 비밀번호로 로그인
   */
  async signIn(
    email: string,
    password: string
  ): Promise<{ user: AuthUser | null; error: Error | null }> {
    try {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (authError || !authData.user) {
        return {
          user: null,
          error: authError || new Error("로그인 중 오류가 발생했습니다."),
        };
      }

      // 마지막 로그인 시간 업데이트
      await userRepository.updateLastLogin(authData.user.id);

      return {
        user: {
          id: authData.user.id,
          email: authData.user.email || email,
        },
        error: null,
      };
    } catch (error) {
      console.error("로그인 실패:", error);
      return {
        user: null,
        error:
          error instanceof Error
            ? error
            : new Error("알 수 없는 오류가 발생했습니다."),
      };
    }
  },

  /**
   * 현재 로그인한 사용자 정보 가져오기
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return null;
      }

      return {
        id: data.user.id,
        email: data.user.email || "",
      };
    } catch (error) {
      console.error("사용자 정보 조회 실패:", error);
      return null;
    }
  },

  /**
   * 로그아웃
   */
  async signOut(): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      return { error: error || null };
    } catch (error) {
      console.error("로그아웃 실패:", error);
      return {
        error:
          error instanceof Error
            ? error
            : new Error("알 수 없는 오류가 발생했습니다."),
      };
    }
  },
};

"use client";

import { User, userRepository } from "@/api/repositories/userRepository";
import { authService, AuthUser } from "@/api/services/authService";
import { supabase } from "@/api/supabase";
import { Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface AuthContextType {
  user: (AuthUser & Partial<User>) | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
  signup: (
    email: string,
    password: string,
    username: string,
    inviteCode: string
  ) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<(AuthUser & Partial<User>) | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  // 컴포넌트 마운트 시 현재 로그인 상태 확인
  useEffect(() => {
    const checkUser = async () => {
      try {
        // 세션 확인
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) {
          console.error("세션 확인 실패:", sessionError);
          setUser(null);
          setIsLoading(false);
          return;
        }

        if (!sessionData.session) {
          // 세션이 없으면 사용자는 로그인하지 않은 상태
          setUser(null);
          setIsLoading(false);
          return;
        }

        // 현재 사용자 정보 가져오기
        const currentUser = await authService.getCurrentUser();

        if (currentUser) {
          // 사용자 프로필 정보 가져오기
          try {
            const userProfile = await userRepository.getUser(currentUser.id);
            if (userProfile) {
              setUser({
                ...currentUser,
                ...userProfile,
              });
            } else {
              setUser(currentUser);
            }
          } catch (error) {
            console.error("사용자 프로필 정보 조회 실패:", error);
            setUser(currentUser);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("사용자 인증 상태 확인 실패:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    // 초기 사용자 상태 확인
    checkUser();

    // 인증 상태 변경 리스너 설정
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        console.log("Auth state changed:", event);

        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          if (session) {
            const authUser = await authService.getCurrentUser();
            if (authUser) {
              try {
                const userProfile = await userRepository.getUser(authUser.id);
                if (userProfile) {
                  setUser({
                    ...authUser,
                    ...userProfile,
                  });
                } else {
                  setUser(authUser);
                }
              } catch (error) {
                console.error("사용자 프로필 정보 조회 실패:", error);
                setUser(authUser);
              }
            }
          }
        } else if (event === "SIGNED_OUT") {
          setUser(null);
        }
      }
    );

    // 컴포넌트 언마운트 시 리스너 제거
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { user, error } = await authService.signIn(email, password);
      if (user) {
        // 사용자 프로필 정보 가져오기
        try {
          const userProfile = await userRepository.getUser(user.id);
          if (userProfile) {
            setUser({
              ...user,
              ...userProfile,
            });
          } else {
            setUser(user);
          }
        } catch (profileError) {
          console.error("사용자 프로필 정보 조회 실패:", profileError);
          setUser(user);
        }
        router.push("/");
      }
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      const { error } = await authService.signOut();
      if (!error) {
        setUser(null);
        router.push("/");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (
    email: string,
    password: string,
    username: string,
    inviteCode: string
  ) => {
    setIsLoading(true);
    try {
      const { user, error } = await authService.signUp(
        email,
        password,
        username,
        inviteCode
      );
      if (user) {
        // 사용자 프로필 정보 포함하여 저장
        setUser({
          ...user,
          username,
        });
        router.push("/");
      }
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, signup }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth는 AuthProvider 내부에서만 사용할 수 있습니다.");
  }
  return context;
};

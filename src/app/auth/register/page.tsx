"use client";

import { authService } from "@/api/services/authService";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { getRandomNickname } from "@woowa-babble/random-nickname";
import Link from "next/link";
import { useState } from "react";

export default function Register() {
  const { signup } = useAuth();
  const [inviteCode, setInviteCode] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"code" | "register">("code");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyInviteCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const isValid = await authService.verifyInviteCode(inviteCode);

      if (isValid) {
        setStep("register");
      } else {
        setError("유효하지 않은 초대 코드입니다. 다시 확인해주세요.");
      }
    } catch (error) {
      console.error("초대 코드 검증 실패:", error);
      setError("초대 코드 검증 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await signup(email, password, username, inviteCode);

      if (error) {
        setError(error.message);
      }
      // 회원가입 성공 시 redirect는 AuthContext 내부에서 처리
    } catch (error) {
      console.error("회원가입 실패:", error);
      setError("회원가입 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const generateRandomNickname = () => {
    try {
      // animals 타입으로 랜덤 닉네임 생성
      const randomNickname = getRandomNickname("animals");
      setUsername(randomNickname);
    } catch (error) {
      console.error("랜덤 닉네임 생성 실패:", error);
    }
  };

  return (
    <div className="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          {step === "code" ? "초대 코드 입력" : "회원가입"}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          이미 계정이 있으신가요?{" "}
          <Link
            href="/auth/login"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            로그인하기
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {step === "code" ? (
            <form className="space-y-6" onSubmit={verifyInviteCode}>
              <div>
                <label
                  htmlFor="inviteCode"
                  className="block text-sm font-medium text-gray-700"
                >
                  초대 코드
                </label>
                <div className="mt-1">
                  <input
                    id="inviteCode"
                    name="inviteCode"
                    type="text"
                    required
                    value={inviteCode}
                    onChange={(e) =>
                      setInviteCode(e.target.value.toUpperCase())
                    }
                    placeholder="초대 코드를 입력하세요 (예: AB123Z)"
                    className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || !inviteCode}
                >
                  {loading ? "확인 중..." : "다음"}
                </Button>
              </div>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleRegister}>
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-700"
                >
                  사용자 이름
                </label>
                <div className="mt-1 relative">
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm pr-24"
                  />
                  <button
                    type="button"
                    onClick={generateRandomNickname}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none"
                  >
                    랜덤 생성
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  이메일
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  비밀번호
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "가입 중..." : "가입하기"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

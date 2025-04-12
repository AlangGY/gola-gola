"use client";

import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export function Navbar() {
  const pathname = usePathname();
  const { user, logout, isLoading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  };

  return (
    <nav className="bg-white shadow">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-extrabold text-indigo-600">
                골라<span className="text-pink-500">골라</span>
              </span>
            </Link>

            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/"
                className={`${
                  pathname === "/"
                    ? "border-indigo-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                홈
              </Link>
              <Link
                href="/events"
                className={`${
                  pathname.startsWith("/events")
                    ? "border-indigo-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                이벤트
              </Link>
            </div>
          </div>

          <div className="hidden sm:ml-6 sm:flex sm:items-center gap-4">
            {isLoading ? (
              <span className="text-sm text-gray-500">로딩 중...</span>
            ) : user ? (
              <div className="relative">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">
                    {user.username || user.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-sm font-medium text-gray-600 hover:text-gray-500"
                  >
                    로그아웃
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Link
                  href="/auth/register"
                  className="text-sm font-medium text-gray-600 hover:text-gray-500"
                >
                  회원가입
                </Link>
                <Link
                  href="/auth/login"
                  className="text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-md transition-colors"
                >
                  로그인
                </Link>
              </>
            )}
          </div>

          {/* 모바일 메뉴 버튼 */}
          <div className="flex items-center sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              aria-controls="mobile-menu"
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span className="sr-only">메뉴 열기</span>
              {/* 아이콘 */}
              <svg
                className={`${isMenuOpen ? "hidden" : "block"} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <svg
                className={`${isMenuOpen ? "block" : "hidden"} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      <div
        className={`${isMenuOpen ? "block" : "hidden"} sm:hidden`}
        id="mobile-menu"
      >
        <div className="pt-2 pb-3 space-y-1">
          <Link
            href="/"
            className={`${
              pathname === "/"
                ? "bg-indigo-50 border-indigo-500 text-indigo-700"
                : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
            } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
          >
            홈
          </Link>
          <Link
            href="/events"
            className={`${
              pathname.startsWith("/events")
                ? "bg-indigo-50 border-indigo-500 text-indigo-700"
                : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
            } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
          >
            이벤트
          </Link>
        </div>
        <div className="pt-4 pb-3 border-t border-gray-200">
          {isLoading ? (
            <div className="flex items-center px-4">
              <div className="text-sm font-medium text-gray-500">
                로딩 중...
              </div>
            </div>
          ) : user ? (
            <div className="px-2 space-y-1">
              <div className="px-4 py-2 text-sm text-gray-700">
                {user.username || user.email}
              </div>
              <button
                onClick={handleLogout}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 w-full text-left"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <div className="px-2 space-y-1">
              <Link
                href="/auth/login"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                로그인
              </Link>
              <Link
                href="/auth/register"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                회원가입
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

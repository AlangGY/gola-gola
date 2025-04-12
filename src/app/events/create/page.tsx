"use client";

import { eventService } from "@/api/services/eventService";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

export default function CreateEventPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
  });
  const [participants, setParticipants] = useState("");
  const [error, setError] = useState("");

  // 로그인 확인
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push(
        "/auth/login?redirect=" + encodeURIComponent("/events/create")
      );
    }
  }, [user, isAuthLoading, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    // 로그인 여부 확인
    if (!user) {
      setError("로그인이 필요합니다.");
      return;
    }

    // 유효성 검사
    if (
      !formData.title ||
      !formData.description ||
      !formData.start_date ||
      !formData.end_date
    ) {
      setError("모든 필수 항목을 입력해주세요.");
      return;
    }

    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);

    if (endDate <= startDate) {
      setError("종료일은 시작일 이후여야 합니다.");
      return;
    }

    try {
      setLoading(true);

      // 참가자 목록 처리
      const participantIds = participants
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id);

      // 이벤트 생성
      const eventData = {
        title: formData.title,
        description: formData.description,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        created_by: user.id, // 로그인한 사용자 ID 사용
      };

      await eventService.createEvent(eventData, participantIds);

      // 성공 시 이벤트 목록 페이지로 이동
      router.push("/events");
    } catch (error) {
      console.error("이벤트 생성 실패:", error);
      setError("이벤트 생성 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">로그인 정보를 확인하는 중...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/events"
          className="text-indigo-600 hover:text-indigo-900 inline-flex items-center mb-4"
        >
          ← 이벤트 목록으로
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">새 이벤트 만들기</h1>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                이벤트 제목 *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                이벤트 설명 *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="start_date"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  시작일 *
                </label>
                <input
                  type="date"
                  id="start_date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="end_date"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  종료일 *
                </label>
                <input
                  type="date"
                  id="end_date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="participants"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                추가 참가자 (쉼표로 구분된 사용자 ID)
              </label>
              <input
                type="text"
                id="participants"
                name="participants"
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="user1, user2, user3"
              />
              <p className="mt-1 text-sm text-gray-500">
                선택 사항: 생성자(나)는 자동으로 참가자로 추가됩니다.
              </p>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                className="w-full"
                disabled={loading || isAuthLoading || !user}
              >
                {loading ? "생성 중..." : "이벤트 생성하기"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

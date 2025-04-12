"use client";

import { giftService } from "@/api/services/giftService";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface RegisterGiftPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function RegisterGiftPage({ params }: RegisterGiftPageProps) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [eventId, setEventId] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // params 처리
  useEffect(() => {
    const resolveParams = async () => {
      try {
        const resolvedParams =
          params instanceof Promise ? await params : params;
        setEventId(resolvedParams.id);
      } catch (error) {
        console.error("params 처리 중 오류 발생:", error);
        setError("페이지 로드 중 오류가 발생했습니다.");
      }
    };

    resolveParams();
  }, [params]);

  useEffect(() => {
    // 이벤트 ID가 없거나 사용자 로드 중이면 실행하지 않음
    if (!eventId || isAuthLoading) return;

    // 사용자가 로그인하지 않은 경우
    if (!user) {
      router.push(
        "/auth/login?redirect=" +
          encodeURIComponent(`/events/${eventId}/register-gift`)
      );
    }
  }, [eventId, user, isAuthLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError("로그인이 필요합니다.");
      return;
    }

    if (!eventId) {
      setError("이벤트 정보를 불러올 수 없습니다.");
      return;
    }

    if (!description.trim()) {
      setError("선물 설명을 입력해주세요.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await giftService.createGift(eventId, user.id, description.trim());

      // 완료 후 이벤트 상세 페이지로 이동
      router.push(`/events/${eventId}`);
    } catch (error: unknown) {
      console.error("선물 등록 실패:", error);
      setError(
        error instanceof Error
          ? error.message
          : "선물 등록에 실패했습니다. 다시 시도해주세요."
      );
    } finally {
      setLoading(false);
    }
  };

  if (isAuthLoading || !eventId) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">로그인 정보를 확인하는 중...</p>
      </div>
    );
  }

  return (
    <div>
      <Link
        href={`/events/${eventId}`}
        className="text-indigo-600 hover:text-indigo-900 inline-flex items-center mb-6"
      >
        ← 이벤트로 돌아가기
      </Link>

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">선물 등록</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              선물 설명 (한 줄)
            </label>
            <textarea
              id="description"
              rows={3}
              maxLength={100}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="선물에 대한 간략한 설명을 입력해주세요. (최대 100자)"
              className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              {description.length}/100자
            </p>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="text-sm text-gray-500 flex-1">
                <p>
                  등록된 선물의 내용은 익명으로 처리되며, 누가 어떤 선물을
                  등록했는지 공개되지 않습니다.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Link href={`/events/${eventId}`} passHref>
              <Button variant="outline" disabled={loading}>
                취소
              </Button>
            </Link>
            <Button type="submit" disabled={loading || !description.trim()}>
              {loading ? "등록 중..." : "선물 등록하기"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { eventParticipantRepository } from "@/api/repositories/eventParticipantRepository";
import { Event } from "@/api/repositories/eventRepository";
import { AnonymousGift } from "@/api/repositories/giftRepository";
import { eventService } from "@/api/services/eventService";
import { giftService } from "@/api/services/giftService";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface EventDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EventDetailPage({ params }: EventDetailPageProps) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [eventId, setEventId] = useState<string | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [gifts, setGifts] = useState<AnonymousGift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGift, setSelectedGift] = useState<string | null>(null);
  const [userHasGift, setUserHasGift] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);
  const [userSelectedGift, setUserSelectedGift] =
    useState<AnonymousGift | null>(null);

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
        "/auth/login?redirect=" + encodeURIComponent(`/events/${eventId}`)
      );
      return;
    }

    fetchEventDetails();
  }, [eventId, user, isAuthLoading, router]);

  const fetchEventDetails = async () => {
    if (!user || !eventId) return;

    try {
      setLoading(true);
      setError(null);

      // 1. 이벤트 정보 조회
      const eventDetails = await eventService.getEventDetail(eventId);
      if (!eventDetails) {
        setError("이벤트를 찾을 수 없습니다.");
        return;
      }
      setEvent(eventDetails);

      // 2. 사용자가 이벤트 참가자인지 확인
      const participantCheck = await eventParticipantRepository.isParticipant(
        eventId,
        user.id
      );
      setIsParticipant(participantCheck);

      // 3. 사용자가 이미 선물을 등록했는지 확인
      const hasGift = await giftService.hasUserRegisteredGift(eventId, user.id);
      setUserHasGift(hasGift);

      // 4. 이벤트 선물 목록 조회
      const giftList = await giftService.getAvailableGifts(eventId);
      setGifts(giftList);

      // 5. 사용자가 이미 선택한 선물이 있는지 확인
      const selectedGift = await giftService.getUserSelectedGift(
        eventId,
        user.id
      );
      setUserSelectedGift(selectedGift);
    } catch (error) {
      console.error("이벤트 상세 정보 조회 실패:", error);
      setError("이벤트 정보를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleSelectGift = (giftId: string) => {
    // 이미 선물을 선택한 경우 새로운 선물 선택 불가
    if (userSelectedGift) return;

    setSelectedGift(giftId);
  };

  const handleConfirmSelection = async () => {
    if (!selectedGift || !user || !eventId) return;

    try {
      await giftService.selectGift(selectedGift, user.id);

      // 선택한 선물 정보 찾기
      const selectedGiftInfo = gifts.find((gift) => gift.id === selectedGift);

      // 사용자가 선택한 선물로 설정
      if (selectedGiftInfo) {
        setUserSelectedGift({
          ...selectedGiftInfo,
          status: "selected",
        });
      }

      // 선택한 선물 목록에서 제거
      setGifts(gifts.filter((gift) => gift.id !== selectedGift));
      setSelectedGift(null);
    } catch (error) {
      console.error("선물 선택 실패:", error);
      alert("선물 선택에 실패했습니다. 다시 시도해주세요.");
    }
  };

  if (loading || isAuthLoading || !eventId) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">이벤트 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="bg-white p-8 rounded-lg shadow text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {error || "이벤트를 찾을 수 없습니다."}
        </h3>
        <p className="text-gray-500 mb-4">
          요청하신 이벤트가 존재하지 않거나 접근 권한이 없습니다.
        </p>
        <Link href="/events" passHref>
          <Button>이벤트 목록으로</Button>
        </Link>
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

        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              event.status === "active"
                ? "bg-green-100 text-green-800"
                : event.status === "completed"
                ? "bg-gray-100 text-gray-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {event.status === "active"
              ? "진행중"
              : event.status === "completed"
              ? "완료됨"
              : "취소됨"}
          </span>
        </div>

        <p className="mt-2 text-gray-600">{event.description}</p>

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
          <div>시작일: {formatDate(event.start_date)}</div>
          <div>종료일: {formatDate(event.end_date)}</div>
        </div>
      </div>

      {!isParticipant ? (
        <div className="bg-white p-8 rounded-lg shadow text-center mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            이 이벤트에 참여하지 않았습니다.
          </h3>
          <p className="text-gray-500 mb-4">
            선물 교환에 참여하려면 이벤트 관리자에게 초대를 요청하세요.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="md:col-span-2">
            {/* 내가 선택한 선물 섹션 */}
            {userSelectedGift && (
              <div className="bg-white p-6 rounded-lg shadow mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  내가 선택한 선물
                </h2>
                <div className="border rounded-lg p-4 bg-indigo-50 border-indigo-200">
                  <div className="flex justify-between items-center">
                    <p className="font-medium text-gray-800">
                      {userSelectedGift.description}
                    </p>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                      선택됨
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 선물 목록 섹션 */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                선물 목록
              </h2>

              {gifts.length === 0 ? (
                <p className="text-gray-500 py-4">
                  {userSelectedGift
                    ? "모든 선물이 선택되었습니다."
                    : "현재 선택 가능한 선물이 없습니다."}
                </p>
              ) : (
                <div className="space-y-4">
                  {gifts.map((gift) => (
                    <div
                      key={gift.id}
                      className={`border rounded-lg p-4 transition-colors ${
                        selectedGift === gift.id
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-200 hover:border-indigo-300"
                      } ${
                        userSelectedGift
                          ? "opacity-60 cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                      onClick={() => handleSelectGift(gift.id)}
                    >
                      <div className="flex justify-between items-center">
                        <p className="font-medium">{gift.description}</p>
                        {userSelectedGift && (
                          <span className="text-xs text-gray-500">
                            선택 불가
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedGift && !userSelectedGift && (
                <div className="mt-6">
                  <Button className="w-full" onClick={handleConfirmSelection}>
                    선택한 선물 받기
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow h-min">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              선물 등록
            </h2>

            {userHasGift ? (
              <p className="text-gray-500">이미 선물을 등록하셨습니다.</p>
            ) : (
              <div>
                <p className="text-gray-600 mb-4">
                  본 이벤트에 선물을 등록하고 다른 참여자의 선물을 선택할 수
                  있습니다.
                </p>
                <Link href={`/events/${eventId}/register-gift`} passHref>
                  <Button className="w-full">선물 등록하기</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

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
import { useCallback, useEffect, useRef, useState } from "react";

interface EventDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

// 참가자 정보 인터페이스
interface ParticipantInfo {
  id: string;
  user_id: string;
  username: string | null;
  has_selected_gift: boolean;
  selected_gift_description?: string;
  selected_gift_creator_name?: string;
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
  const [userSelectedGift, setUserSelectedGift] = useState<
    (AnonymousGift & { creator_name?: string }) | null
  >(null);
  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const POLLING_INTERVAL = 5000; // 5초마다 폴링

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

  // 이벤트 디테일 및 관련 데이터 조회 함수를 useCallback으로 메모이제이션
  const fetchEventDetails = useCallback(
    async (showLoading = true) => {
      if (!user || !eventId) return;

      try {
        if (showLoading) {
          setLoading(true);
        }
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
        const hasGift = await giftService.hasUserRegisteredGift(
          eventId,
          user.id
        );
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

        // 6. 이벤트 참가자 목록 조회
        const participantsList =
          await eventService.getEventParticipantsWithGiftStatus(eventId);
        setParticipants(participantsList);
      } catch (error) {
        console.error("이벤트 상세 정보 조회 실패:", error);
        if (showLoading) {
          setError("이벤트 정보를 불러오는 중 오류가 발생했습니다.");
        }
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [eventId, user]
  );

  // 초기 데이터 로드
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
  }, [eventId, user, isAuthLoading, router, fetchEventDetails]);

  // 폴링 설정
  useEffect(() => {
    console.log("폴링 설정 실행");
    // 폴링 시작 조건이 맞지 않으면 함수 실행하지 않음
    console.log("user", user);
    console.log("eventId", eventId);
    console.log("isParticipant", isParticipant);
    console.log("loading", loading);
    if (!user || !eventId || !isParticipant || loading) return;

    console.log("폴링 시작 조건 확인");
    console.log("isPolling", isPolling);
    console.log("pollingIntervalRef.current", pollingIntervalRef.current);
    // 이미 폴링 중이면 새로 시작하지 않음
    if (isPolling && pollingIntervalRef.current) return;

    console.log("폴링 시작");

    // 이전 폴링이 있다면 제거
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // 폴링 상태 설정
    setIsPolling(true);

    // 새로운 폴링 시작
    pollingIntervalRef.current = setInterval(() => {
      console.log("이벤트 데이터 폴링 중...");
      // 조용히 업데이트하기 위해 fetchEventDetails 직접 호출하지 않고
      // 비동기 함수로 래핑하여 실행
      (async () => {
        try {
          if (!user || !eventId) return;

          // 1. 이벤트 정보 조회
          const eventDetails = await eventService.getEventDetail(eventId);
          if (!eventDetails) return;
          setEvent(eventDetails);

          // 2. 이벤트 선물 목록 조회
          const giftList = await giftService.getAvailableGifts(eventId);
          setGifts(giftList);

          // 3. 사용자가 이미 선택한 선물이 있는지 확인
          const selectedGift = await giftService.getUserSelectedGift(
            eventId,
            user.id
          );
          setUserSelectedGift(selectedGift);

          // 4. 이벤트 참가자 목록 조회 (선물 정보 포함)
          const participantsList =
            await eventService.getEventParticipantsWithGiftStatus(eventId);
          console.log("참가자 목록 조회 결과:", participantsList);
          setParticipants(participantsList);
        } catch (error) {
          console.log("폴링 중 오류 발생:", error);
        }
      })();
    }, POLLING_INTERVAL);

    // 클린업 함수
    return () => {
      console.log("폴링 정리");
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
        setIsPolling(false);
      }
    };
  }, [user?.id, eventId, isParticipant, loading, isPolling]);

  // 이벤트가 완료되거나 취소된 경우 폴링 중지
  useEffect(() => {
    if (
      event &&
      (event.status === "completed" || event.status === "cancelled")
    ) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
        setIsPolling(false);
      }
    }
  }, [event?.status]); // event 객체 전체가 아닌 status만 의존성에 추가

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

      // 참가자 목록에서 현재 사용자의 선물 선택 상태 업데이트
      setParticipants((prevParticipants) =>
        prevParticipants.map((p) =>
          p.user_id === user.id
            ? {
                ...p,
                has_selected_gift: true,
                selected_gift_description: selectedGiftInfo?.description,
              }
            : p
        )
      );

      // 실시간 데이터 갱신
      await fetchEventDetails(false);
    } catch (error) {
      console.error("선물 선택 실패:", error);
      alert("선물 선택에 실패했습니다. 다시 시도해주세요.");
    }
  };

  // 선물 선택 취소 확인 대화상자 표시
  const openCancelConfirm = () => {
    setShowCancelConfirm(true);
  };

  // 선물 선택 취소 확인 대화상자 닫기
  const closeCancelConfirm = () => {
    setShowCancelConfirm(false);
  };

  // 선물 선택 취소 처리 함수
  const handleCancelSelection = async () => {
    if (!userSelectedGift || !user || !eventId) return;

    try {
      await giftService.cancelSelectedGift(userSelectedGift.id, user.id);

      // 취소한 선물을 선택 가능한 목록에 다시 추가
      setGifts((prevGifts) => [
        ...prevGifts,
        { ...userSelectedGift, status: "available" },
      ]);

      // 사용자가 선택한 선물 정보 초기화
      setUserSelectedGift(null);

      // 참가자 목록에서 현재 사용자의 선물 선택 상태 업데이트
      setParticipants((prevParticipants) =>
        prevParticipants.map((p) =>
          p.user_id === user.id
            ? {
                ...p,
                has_selected_gift: false,
                selected_gift_description: undefined,
                selected_gift_creator_name: undefined,
              }
            : p
        )
      );

      // 확인 대화상자 닫기
      setShowCancelConfirm(false);

      // 실시간 데이터 갱신
      await fetchEventDetails(false);
    } catch (error) {
      console.error("선물 선택 취소 실패:", error);
      alert("선물 선택 취소에 실패했습니다. 다시 시도해주세요.");
      setShowCancelConfirm(false);
    }
  };

  // 이벤트 상태에 따른 표시 텍스트
  const getEventStatusText = (status: string) => {
    switch (status) {
      case "gift_registration":
        return "상품 등록 단계";
      case "gift_selection":
        return "상품 선택 단계";
      case "active":
        return "진행중";
      case "completed":
        return "완료됨";
      case "cancelled":
        return "취소됨";
      default:
        return "상태 미정";
    }
  };

  // 이벤트 상태에 따른 배경색
  const getEventStatusColor = (status: string) => {
    switch (status) {
      case "gift_registration":
        return "bg-blue-100 text-blue-800";
      case "gift_selection":
        return "bg-purple-100 text-purple-800";
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // 이벤트 단계 진행 함수 (관리자 전용)
  const handleMoveToNextStage = async () => {
    if (!user || !eventId || !event) return;

    // 이벤트 생성자만 단계 진행 가능
    if (event.created_by !== user.id) {
      alert("이벤트 생성자만 단계를 진행할 수 있습니다.");
      return;
    }

    try {
      let newStatus: Event["status"];

      // 현재 상태에 따라 다음 단계 결정
      if (event.status === "gift_registration") {
        newStatus = "gift_selection";
      } else if (event.status === "gift_selection") {
        newStatus = "active";
      } else {
        return; // 이미 active, completed, cancelled 상태면 더 이상 진행하지 않음
      }

      await eventService.updateEventStatus(eventId, newStatus);

      // 상태 변경 후 이벤트 새로고침
      await fetchEventDetails();

      alert(`이벤트가 ${getEventStatusText(newStatus)} 단계로 진행되었습니다.`);
    } catch (error) {
      console.error("이벤트 단계 진행 실패:", error);
      alert("이벤트 단계 진행에 실패했습니다.");
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
        <Link href="/events">
          <Button>이벤트 목록으로</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* 선물 선택 취소 확인 모달 */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-3">선물 선택 취소</h3>
            <p className="mb-4 text-gray-600">
              선택한 선물을 취소하시겠습니까? 취소 후에는 다른 선물을 선택할 수
              있습니다.
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                className="text-gray-600"
                onClick={closeCancelConfirm}
              >
                아니오
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700"
                onClick={handleCancelSelection}
              >
                예, 취소합니다
              </Button>
            </div>
          </div>
        </div>
      )}

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
            className={`px-3 py-1 rounded-full text-sm font-medium ${getEventStatusColor(
              event.status
            )}`}
          >
            {getEventStatusText(event.status)}
          </span>
        </div>

        <p className="mt-2 text-gray-600">{event.description}</p>

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
          <div>시작일: {formatDate(event.start_date)}</div>
          <div>종료일: {formatDate(event.end_date)}</div>
        </div>

        {/* 이벤트 생성자를 위한 관리 버튼 */}
        {user &&
          event.created_by === user.id &&
          (event.status === "gift_registration" ||
            event.status === "gift_selection") && (
            <div className="mt-4">
              <Button onClick={handleMoveToNextStage}>
                {event.status === "gift_registration"
                  ? "상품 선택 단계로 진행"
                  : "이벤트 활성화하기"}
              </Button>
            </div>
          )}
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
            {userSelectedGift && event.status !== "gift_registration" && (
              <div className="bg-white p-6 rounded-lg shadow mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  내가 선택한 선물
                </h2>
                <div className="border rounded-lg p-4 bg-indigo-50 border-indigo-200">
                  <div className="flex justify-between items-start">
                    <div>
                      {userSelectedGift.creator_name ? (
                        <div>
                          <p className="font-medium text-gray-800 mb-1">
                            <span className="text-indigo-700">
                              {userSelectedGift.creator_name}
                            </span>
                            님의 선물
                          </p>
                          <p className="text-sm text-gray-600">
                            {userSelectedGift.description}
                          </p>
                        </div>
                      ) : (
                        <p className="font-medium text-gray-800">
                          {userSelectedGift.description}
                        </p>
                      )}
                    </div>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                      선택됨
                    </span>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-300 hover:bg-red-50 text-xs px-3 py-1 h-auto"
                      onClick={openCancelConfirm}
                    >
                      선물 선택 취소
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* 선물 목록 섹션 */}
            {event.status !== "gift_registration" && (
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
            )}

            {/* 상품 등록 단계일 때 메시지 */}
            {event.status === "gift_registration" && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  상품 등록 단계
                </h2>
                <p className="text-gray-600 mb-4">
                  현재는 상품 등록 단계입니다. 선물을 등록해주세요. 다른
                  참가자들의 선물은 상품 선택 단계가 시작되면 볼 수 있습니다.
                </p>
                {!userHasGift && (
                  <div className="mt-4">
                    <Link href={`/events/${eventId}/register-gift`}>
                      <Button className="w-full">선물 등록하기</Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* 선물 등록 섹션 */}
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
                  <Link href={`/events/${eventId}/register-gift`}>
                    <Button className="w-full">선물 등록하기</Button>
                  </Link>
                </div>
              )}
            </div>

            {/* 참가자 목록 섹션 - 상품 등록 단계에서는 숨김 */}
            {event.status !== "gift_registration" && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  참가자 목록
                </h2>

                {participants.length === 0 ? (
                  <p className="text-gray-500">참가자가 없습니다.</p>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {participants.map((participant) => (
                      <li key={participant.id} className="py-3">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                              <span className="text-sm font-medium text-indigo-800">
                                {participant.username
                                  ? participant.username.charAt(0).toUpperCase()
                                  : "?"}
                              </span>
                            </div>
                            <span className="text-gray-800">
                              {participant.username || "익명 사용자"}
                              {participant.user_id === user?.id && " (나)"}
                            </span>
                          </div>
                          <div>
                            {participant.has_selected_gift ? (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                선물 선택 완료
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                선택 대기 중
                              </span>
                            )}
                          </div>
                        </div>

                        {participant.has_selected_gift &&
                          participant.selected_gift_description && (
                            <div className="mt-1 pl-11">
                              <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded-md">
                                {participant.selected_gift_creator_name ? (
                                  <span>
                                    <span className="font-medium">
                                      {participant.selected_gift_creator_name}
                                    </span>
                                    님의 선물을 선택하셨습니다!
                                    <br />
                                    <span className="text-xs text-gray-500 mt-1">
                                      선물 내용:{" "}
                                      {participant.selected_gift_description}
                                    </span>
                                  </span>
                                ) : (
                                  <span>
                                    <span className="font-medium">
                                      선택한 선물:
                                    </span>{" "}
                                    {participant.selected_gift_description}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* 상품 등록 단계일 때의 참가자 수 표시 */}
            {event.status === "gift_registration" && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  참가자 정보
                </h2>
                <p className="text-gray-600">
                  현재 {participants.length}명이 이벤트에 참가하고 있습니다.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  참가자 상세 정보와 선물 목록은 상품 선택 단계에서 공개됩니다.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

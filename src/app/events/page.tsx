"use client";

import { eventParticipantRepository } from "@/api/repositories/eventParticipantRepository";
import { Event } from "@/api/repositories/eventRepository";
import { eventService } from "@/api/services/eventService";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EventsPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [otherEvents, setOtherEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningLoading, setJoiningLoading] = useState(false);

  // 모달 상태 관리
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);

        // 1. 모든 활성 이벤트 가져오기
        const eventList = await eventService.getActiveEvents();
        setAllEvents(eventList);

        // 2. 로그인한 경우 사용자 참여 이벤트 가져오기
        if (user) {
          const userEvents = await eventService.getUserEvents(user.id);

          // 진행 중인 이벤트만 필터링 (gift_registration, gift_selection, active 상태)
          const activeUserEvents = userEvents.filter(
            (event) =>
              event.status === "gift_registration" ||
              event.status === "gift_selection" ||
              event.status === "active"
          );

          setMyEvents(activeUserEvents);

          // 사용자가 참여하지 않는 이벤트 구분
          const userEventIds = new Set(
            activeUserEvents.map((event) => event.id)
          );
          const eventsNotParticipating = eventList.filter(
            (event) => !userEventIds.has(event.id)
          );

          setOtherEvents(eventsNotParticipating);
        } else {
          // 로그인하지 않은 경우 모든 이벤트를 "참여하지 않는 이벤트"로 설정
          setMyEvents([]);
          setOtherEvents(eventList);
        }
      } catch (error) {
        console.error("이벤트 목록 조회 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    // 인증 상태 로딩이 완료되었을 때만 이벤트 로드
    if (!isAuthLoading) {
      fetchEvents();
    }
  }, [user, isAuthLoading]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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

  // 이벤트 참가 처리 함수
  const handleJoinEvent = async () => {
    if (!user || !selectedEvent) return;

    try {
      setJoiningLoading(true);
      // 이벤트에 참가자 추가
      await eventParticipantRepository.addParticipant(
        selectedEvent.id,
        user.id
      );

      // 이벤트 참가 후, 이벤트 상세 페이지로 이동
      router.push(`/events/${selectedEvent.id}`);
    } catch (error) {
      console.error("이벤트 참가 실패:", error);
      alert("이벤트 참가에 실패했습니다. 다시 시도해주세요.");
      setShowModal(false);
    } finally {
      setJoiningLoading(false);
    }
  };

  // 참여 중인 이벤트 카드 렌더링
  const renderMyEventCard = (event: Event) => (
    <Link href={`/events/${event.id}`} key={event.id}>
      <div className="bg-white rounded-lg shadow p-6 h-full hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
          <h2 className="text-xl font-semibold text-gray-900">{event.title}</h2>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getEventStatusColor(
              event.status
            )}`}
          >
            {getEventStatusText(event.status)}
          </span>
        </div>
        <p className="mt-2 text-gray-600 line-clamp-2">{event.description}</p>
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between text-sm text-gray-500">
            <span>시작: {formatDate(event.start_date)}</span>
            <span>종료: {formatDate(event.end_date)}</span>
          </div>
        </div>
      </div>
    </Link>
  );

  // 참여 가능한 이벤트 카드 렌더링 (클릭시 모달 표시)
  const renderOtherEventCard = (event: Event) => (
    <div
      key={event.id}
      className="bg-white rounded-lg shadow p-6 h-full hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => {
        if (!user) {
          // 로그인하지 않은 경우, 로그인 페이지로 리다이렉트
          router.push(
            `/auth/login?redirect=${encodeURIComponent(`/events/${event.id}`)}`
          );
          return;
        }
        // 모달 표시 및 선택된 이벤트 설정
        setSelectedEvent(event);
        setShowModal(true);
      }}
    >
      <div className="flex justify-between items-start">
        <h2 className="text-xl font-semibold text-gray-900">{event.title}</h2>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getEventStatusColor(
            event.status
          )}`}
        >
          {getEventStatusText(event.status)}
        </span>
      </div>
      <p className="mt-2 text-gray-600 line-clamp-2">{event.description}</p>
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex justify-between text-sm text-gray-500">
          <span>시작: {formatDate(event.start_date)}</span>
          <span>종료: {formatDate(event.end_date)}</span>
        </div>
      </div>
    </div>
  );

  if (loading || isAuthLoading) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">이벤트 목록을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">이벤트 목록</h1>
        <Link href="/events/create" passHref>
          <Button size="sm">이벤트 만들기</Button>
        </Link>
      </div>

      {allEvents.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            아직 참여할 수 있는 이벤트가 없습니다.
          </h3>
          <p className="text-gray-500 mb-4">
            이벤트가 생성되면 여기에 표시됩니다.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* 내가 참여 중인 이벤트 섹션 */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              내가 참여 중인 이벤트
            </h2>
            {myEvents.length === 0 ? (
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <p className="text-gray-500">
                  {user
                    ? "아직 참여 중인 이벤트가 없습니다."
                    : "로그인하면 참여 중인 이벤트를 확인할 수 있습니다."}
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {myEvents.map(renderMyEventCard)}
              </div>
            )}
          </div>

          {/* 다른 이벤트 섹션 */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              참여 가능한 이벤트
            </h2>
            {otherEvents.length === 0 ? (
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <p className="text-gray-500">
                  모든 이벤트에 이미 참여 중입니다.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {otherEvents.map(renderOtherEventCard)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 이벤트 참가 확인 모달 */}
      {showModal && selectedEvent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-lg max-w-md w-full">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              이벤트 참가
            </h3>
            <p className="text-gray-600 mb-6">
              <span className="font-semibold">{selectedEvent.title}</span>{" "}
              이벤트에 참가하시겠습니까?
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowModal(false)}
                disabled={joiningLoading}
              >
                취소
              </Button>
              <Button onClick={handleJoinEvent} disabled={joiningLoading}>
                {joiningLoading ? "참가 중..." : "참가하기"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { giftReviewService } from "@/api/services/giftReviewService";
import { StarIcon } from "@/components/ui/icons/StarIcon";
import { useEffect, useState } from "react";

interface EventReviewsProps {
  eventId: string;
}

interface ReviewData {
  gift_id: string;
  content: string;
  rating: number;
  created_at: string;
}

export function EventReviews({ eventId }: EventReviewsProps) {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const reviewsData = await giftReviewService.getEventReviews(eventId);
        setReviews(reviewsData);
      } catch (error) {
        console.error("이벤트 리뷰 로드 실패:", error);
        setError("리뷰를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [eventId]);

  const renderStars = (count: number) => {
    return (
      <div className="flex">
        {Array.from({ length: 5 }, (_, i) => (
          <StarIcon
            key={i}
            className={`h-4 w-4 ${
              i < count ? "text-yellow-400" : "text-gray-300"
            }`}
            filled={i < count}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-gray-500 text-center py-4">리뷰 로딩 중...</div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center py-4">{error}</div>;
  }

  if (reviews.length === 0) {
    return (
      <div className="text-gray-500 text-center py-8">
        작성된 리뷰가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        익명 선물 리뷰 ({reviews.length}개)
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reviews.map((review) => (
          <div
            key={`${review.gift_id}-${review.created_at}`}
            className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center">
                {renderStars(review.rating)}
                <span className="ml-2 text-sm text-gray-500">
                  {review.rating}/5
                </span>
              </div>
              <div className="text-xs text-gray-400">
                {new Date(review.created_at).toLocaleDateString("ko-KR")}
              </div>
            </div>
            <p className="text-gray-700">{review.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

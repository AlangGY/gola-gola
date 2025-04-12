"use client";

import { giftReviewService } from "@/api/services/giftReviewService";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { Button } from "./ui/Button";
import { StarIcon } from "./ui/icons/StarIcon";

interface GiftReviewProps {
  giftId: string;
  showForm?: boolean;
}

interface ReviewData {
  id: string;
  content: string;
  rating: number;
  created_at: string;
}

export function GiftReview({ giftId, showForm = true }: GiftReviewProps) {
  const { user } = useAuth();
  const [review, setReview] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 새 리뷰 폼 상태
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchReview = async () => {
      try {
        setLoading(true);
        const reviewData = await giftReviewService.getReviewForGift(giftId);
        setReview(reviewData);
      } catch (error) {
        console.error("리뷰 로드 실패:", error);
        setError("리뷰를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchReview();
  }, [giftId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSubmitting(true);
      setError(null);

      const newReview = await giftReviewService.createReview(
        giftId,
        user.id,
        content,
        rating
      );

      setReview(newReview);
      setContent("");
      setRating(5);
      setSuccess(true);

      // 3초 후 성공 메시지 숨기기
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("리뷰 작성 실패:", error);
      setError(
        error instanceof Error
          ? error.message
          : "리뷰 작성 중 오류가 발생했습니다."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (count: number, interactive = false) => {
    return (
      <div className="flex space-x-1">
        {Array.from({ length: 5 }, (_, i) => (
          <button
            key={i}
            type={interactive ? "button" : undefined}
            onClick={interactive ? () => setRating(i + 1) : undefined}
            className={interactive ? "cursor-pointer focus:outline-none" : ""}
            disabled={!interactive}
          >
            <StarIcon className="h-5 w-5" filled={i < count} />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return <div className="text-gray-500 text-sm">리뷰 로딩 중...</div>;
  }

  return (
    <div className="space-y-4">
      {/* 기존 리뷰 표시 */}
      {review ? (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-900">내가 작성한 리뷰</h3>
            <div className="flex items-center">
              {renderStars(review.rating)}
            </div>
          </div>
          <p className="text-gray-600">{review.content}</p>
          <div className="mt-2 text-xs text-gray-400">
            {new Date(review.created_at).toLocaleDateString("ko-KR")}
          </div>
        </div>
      ) : (
        // 리뷰 작성 폼
        showForm &&
        user && (
          <div className="bg-white border border-gray-200 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">
              이 선물에 대한 리뷰 작성
            </h3>

            {success && (
              <div className="mb-3 p-2 bg-green-50 text-green-700 text-sm rounded">
                리뷰가 성공적으로 등록되었습니다.
              </div>
            )}

            {error && (
              <div className="mb-3 p-2 bg-red-50 text-red-700 text-sm rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  평점
                </label>
                <div className="flex items-center">
                  {renderStars(rating, true)}
                  <span className="ml-2 text-sm text-gray-500">{rating}/5</span>
                </div>
              </div>

              <div className="mb-3">
                <label
                  htmlFor="review-content"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  리뷰 내용
                </label>
                <textarea
                  id="review-content"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="선물에 대한 솔직한 리뷰를 남겨주세요."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={submitting || !content.trim()}>
                  {submitting ? "제출 중..." : "리뷰 등록"}
                </Button>
              </div>
            </form>
          </div>
        )
      )}
    </div>
  );
}

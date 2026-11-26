import { useCallback, useEffect, useState, type FormEvent } from "react";
import { MessageSquare, Send, Star } from "lucide-react";
import { toast } from "react-toastify";

import apiClient from "@/shared/api/apiClient";
import type { PitchAvailabilityResponse } from "@/features/venue/types/venue.types";
import { getTokenFromStorage } from "@/shared/utils/tokenStorage";
import { getApiErrorMessage } from "@/shared/utils/apiError";

interface ReviewItem {
  review_id: number;
  rating: number;
  comment: string | null;
  client_name: string;
  created_at: string;
}

interface CommentItem {
  comment_id: number;
  content: string;
  author_name: string;
  created_at: string;
}

interface PitchReviewsAndCommentsProps {
  pitches: PitchAvailabilityResponse[];
}

export function PitchReviewsAndComments({ pitches }: PitchReviewsAndCommentsProps) {
  const [selectedPitchId, setSelectedPitchId] = useState<number>(
    () => pitches[0]?.pitchId ?? 0,
  );
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    if (pitches.length > 0 && !pitches.some((p) => p.pitchId === selectedPitchId)) {
      setSelectedPitchId(pitches[0].pitchId);
    }
  }, [pitches, selectedPitchId]);

  const fetchCommunityData = useCallback(async (pitchId: number) => {
    if (!pitchId) return;
    setIsLoading(true);
    try {
      const [reviewsRes, commentsRes] = await Promise.all([
        apiClient.get<{ data?: ReviewItem[] }>(`/pitches/${pitchId}/reviews`),
        apiClient.get<{ data?: CommentItem[] }>(`/pitches/${pitchId}/comments`),
      ]);
      setReviews(reviewsRes.data?.data ?? []);
      setComments(commentsRes.data?.data ?? []);
    } catch {
      setReviews([]);
      setComments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCommunityData(selectedPitchId);
  }, [selectedPitchId, fetchCommunityData]);

  if (pitches.length === 0) {
    return null;
  }

  const handleSubmitComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = commentText.trim();
    if (!trimmed) return;
    if (!getTokenFromStorage()) {
      toast.info("Vui lòng đăng nhập để bình luận về sân bóng.");
      return;
    }

    setIsPosting(true);
    try {
      await apiClient.post("/comments", {
        targetType: "PITCH",
        targetId: selectedPitchId,
        content: trimmed,
      });
      setCommentText("");
      toast.success("Đã gửi bình luận!");
      await fetchCommunityData(selectedPitchId);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể gửi bình luận."));
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <section className="rounded-2xl border border-white/15 bg-white/10 p-5 text-white shadow-lg backdrop-blur-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-3">
        <div>
          <h2 className="text-lg font-bold text-white">
            Đánh giá &amp; Hỏi đáp về sân
          </h2>
          <p className="text-xs text-emerald-100/80">
            Xem phản hồi từ người chơi đã đặt sân và đặt câu hỏi cho chủ sân
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {pitches.map((pitch) => (
            <button
              key={pitch.pitchId}
              type="button"
              onClick={() => setSelectedPitchId(pitch.pitchId)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                selectedPitchId === pitch.pitchId
                  ? "border-emerald-300 bg-emerald-500 text-white shadow"
                  : "border-white/20 bg-white/5 text-emerald-100 hover:bg-white/15"
              }`}
            >
              {pitch.pitchName}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Reviews column */}
        <div className="space-y-3">
          <h3 className="flex items-center gap-1.5 text-sm font-bold text-amber-200">
            <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
            Đánh giá từ khách đã đá ({reviews.length})
          </h3>
          {isLoading ? (
            <p className="text-xs text-white/70">Đang tải đánh giá...</p>
          ) : reviews.length === 0 ? (
            <p className="rounded-xl border border-white/10 bg-black/15 p-3 text-xs text-white/70">
              Chưa có đánh giá nào cho sân này.
            </p>
          ) : (
            <ul className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {reviews.map((rev) => (
                <li
                  key={rev.review_id}
                  className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs"
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-bold text-white">{rev.client_name}</span>
                    <span className="font-semibold text-amber-300">
                      {"★".repeat(Math.max(1, Math.min(5, rev.rating)))}
                    </span>
                  </div>
                  <p className="text-emerald-50/90">
                    {rev.comment || "Khách hàng hài lòng với chất lượng sân."}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Comments column */}
        <div className="space-y-3">
          <h3 className="flex items-center gap-1.5 text-sm font-bold text-emerald-200">
            <MessageSquare className="h-4 w-4" />
            Bình luận &amp; Hỏi đáp ({comments.length})
          </h3>

          <form onSubmit={handleSubmitComment} className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Hỏi về mặt cỏ, chỗ gửi xe, đèn sân..."
              className="h-10 flex-1 rounded-xl border border-white/20 bg-white px-3 text-xs text-slate-900 outline-none focus:border-emerald-400"
            />
            <button
              type="submit"
              disabled={isPosting || !commentText.trim()}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 text-xs font-bold text-white transition hover:bg-emerald-600 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              Gửi
            </button>
          </form>

          {comments.length === 0 ? (
            <p className="rounded-xl border border-white/10 bg-black/15 p-3 text-xs text-white/70">
              Chưa có bình luận nào. Hãy là người đầu tiên đặt câu hỏi!
            </p>
          ) : (
            <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {comments.map((cmt) => (
                <li
                  key={cmt.comment_id}
                  className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs"
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-bold text-white">{cmt.author_name}</span>
                    <span className="text-[10px] text-white/55">
                      {new Date(cmt.created_at).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  <p className="text-emerald-50/90">{cmt.content}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

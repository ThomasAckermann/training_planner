import { useState } from "react";
import { Trash2, CornerDownRight } from "lucide-react";
import Button from "../ui/Button.jsx";
import useAuthStore from "../../store/authStore.js";

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function CommentItem({
  comment,
  onDelete,
  onReply,
  contentOwnerId,
  depth = 0,
}) {
  const user = useAuthStore((s) => s.user);
  const canDelete =
    user && (user.id === comment.user_id || user.id === contentOwnerId);
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");

  return (
    <div
      className={depth > 0 ? "ml-6 pl-3 border-l" : ""}
      style={depth > 0 ? { borderColor: "var(--color-border)" } : {}}
    >
      <div
        className="rounded-lg p-3 mb-2"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
        }}
      >
        {/* Author row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{
                backgroundColor: "var(--color-surface-2)",
                color: "var(--color-accent)",
              }}
            >
              {comment.author?.avatar_url ? (
                <img
                  src={comment.author.avatar_url}
                  alt=""
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                (comment.author?.name?.[0] ?? "?").toUpperCase()
              )}
            </div>
            <span
              className="text-sm font-medium"
              style={{ color: "var(--color-text)" }}
            >
              {comment.author?.name ?? "Unknown"}
            </span>
            <span
              className="text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              {formatDate(comment.created_at)}
            </span>
          </div>
          {canDelete && (
            <button
              onClick={() => onDelete(comment.id)}
              className="opacity-50 hover:opacity-100 transition-opacity"
              title="Delete comment"
            >
              <Trash2
                className="w-3.5 h-3.5"
                style={{ color: "var(--color-danger)" }}
              />
            </button>
          )}
        </div>

        {/* Body */}
        <p
          className="text-sm leading-relaxed whitespace-pre-line"
          style={{ color: "var(--color-text-muted)" }}
        >
          {comment.body}
        </p>

        {/* Reply button */}
        {user && depth === 0 && (
          <button
            onClick={() => setShowReply((s) => !s)}
            className="flex items-center gap-1 text-xs mt-2 opacity-60 hover:opacity-100 transition-opacity"
            style={{ color: "var(--color-text-muted)" }}
          >
            <CornerDownRight className="w-3 h-3" />
            Reply
          </button>
        )}
      </div>

      {/* Inline reply box */}
      {showReply && (
        <div className="ml-6 mb-2">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply..."
            rows={2}
            className="w-full rounded-lg px-3 py-2 text-sm resize-none outline-none"
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text)",
            }}
          />
          <div className="flex gap-2 mt-1">
            <Button
              size="sm"
              variant="primary"
              disabled={!replyText.trim()}
              onClick={() => {
                if (replyText.trim()) {
                  onReply(comment.id, replyText.trim());
                  setReplyText("");
                  setShowReply(false);
                }
              }}
            >
              Post
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setShowReply(false);
                setReplyText("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Nested replies */}
      {comment.replies?.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          onDelete={onDelete}
          onReply={onReply}
          contentOwnerId={contentOwnerId}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

export default function CommentThread({
  comments,
  onPost,
  onDelete,
  onReply,
  isPosting,
  contentOwnerId,
}) {
  const user = useAuthStore((s) => s.user);
  const [text, setText] = useState("");

  return (
    <div>
      <h2
        className="text-xl mb-4 tracking-wide"
        style={{
          fontFamily: '"Bebas Neue", cursive',
          color: "var(--color-text)",
        }}
      >
        Comments ({comments?.length ?? 0})
      </h2>

      {/* Post a comment */}
      {user ? (
        <div className="mb-6">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share tips, variations, or feedback..."
            rows={3}
            className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none mb-2"
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text)",
            }}
          />
          <Button
            variant="primary"
            size="sm"
            disabled={!text.trim() || isPosting}
            loading={isPosting}
            onClick={() => {
              if (text.trim()) {
                onPost(text.trim());
                setText("");
              }
            }}
          >
            Post Comment
          </Button>
        </div>
      ) : (
        <p
          className="text-sm mb-4"
          style={{ color: "var(--color-text-muted)" }}
        >
          Log in to leave a comment.
        </p>
      )}

      {/* Comment list */}
      <div className="space-y-2">
        {(comments ?? []).length === 0 && (
          <p
            className="text-sm py-4 text-center"
            style={{ color: "var(--color-text-muted)" }}
          >
            No comments yet. Be the first!
          </p>
        )}
        {(comments ?? []).map((c) => (
          <CommentItem
            key={c.id}
            comment={c}
            onDelete={onDelete}
            onReply={onReply}
            contentOwnerId={contentOwnerId}
          />
        ))}
      </div>
    </div>
  );
}

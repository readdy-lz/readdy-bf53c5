import type { MomentComment } from "@/types/chat";

type CommentsBlockProps = {
  likes: string[];
  comments: MomentComment[];
};

export default function CommentsBlock({ likes, comments }: CommentsBlockProps) {
  if (likes.length === 0 && comments.length === 0) {
    return null;
  }

  return (
    <div className="wx-comment-notch relative mt-2 rounded-[3px] bg-background-100 px-2.5 py-1.5">
      {likes.length > 0 && (
        <div className="flex items-start gap-1 text-[12.5px] leading-[1.6]">
          <span className="w-4 h-[19px] flex items-center justify-center shrink-0">
            <i className="ri-heart-3-fill text-[12px] text-foreground-500"></i>
          </span>
          <p className="flex-1 min-w-0 wx-link-name break-words">{likes.join("，")}</p>
        </div>
      )}

      {likes.length > 0 && comments.length > 0 && (
        <div className="h-px ml-5 my-1 bg-background-200"></div>
      )}

      {comments.map((comment) => (
        <p
          key={comment.id}
          className="text-[12.5px] leading-[1.6] text-foreground-900 break-words"
        >
          <span className="wx-link-name">{comment.name}</span>
          <span className="text-foreground-900">：{comment.text}</span>
        </p>
      ))}
    </div>
  );
}
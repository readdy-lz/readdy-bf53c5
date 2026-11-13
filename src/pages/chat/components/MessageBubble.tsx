import { useRef, useState } from "react";
import { useProfile } from "@/context/ProfileContext";
import { downloadFile, fileIconOf, formatFileSize } from "@/lib/storage";
import type { ChatMessage } from "@/types/chat";
import MessageActionMenu, { type MessageAction } from "@/pages/chat/components/MessageActionMenu";
import VoiceBubble from "@/pages/chat/components/VoiceBubble";

type MessageBubbleProps = {
  message: ChatMessage;
  avatar: string;
  showTime: boolean;
  onOpenImage: (url: string) => void;
  onRetry: (messageId: string) => void;
  onDelete: (messageId: string) => void;
  onNotice: (text: string) => void;
};

export default function MessageBubble({
  message,
  avatar,
  showTime,
  onOpenImage,
  onRetry,
  onDelete,
  onNotice,
}: MessageBubbleProps) {
  const { profile } = useProfile();
  const [menuRect, setMenuRect] = useState<DOMRect | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const pressTimer = useRef<number | null>(null);
  const longPressed = useRef(false);
  const bodyRef = useRef<HTMLDivElement | null>(null);

  if (message.kind === "system") {
    return (
      <div className="wx-fade-up flex justify-center py-1">
        <span className="px-2 py-0.5 rounded bg-foreground-900/10 text-[11px] text-foreground-500">
          {message.text}
        </span>
      </div>
    );
  }

  const mine = message.side === "me";

  const clearPress = () => {
    if (pressTimer.current) {
      window.clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const openMenu = () => {
    const node = bodyRef.current;
    if (!node) return;
    longPressed.current = true;
    setMenuRect(node.getBoundingClientRect());
  };

  const startPress = () => {
    if (window.getSelection()?.toString()) return;
    clearPress();
    longPressed.current = false;
    pressTimer.current = window.setTimeout(openMenu, 420);
  };

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(message.text || "");
      onNotice("已复制到剪贴板");
    } catch {
      onNotice("复制失败，请长按选中文字复制");
    }
  };

  const saveAttachment = async () => {
    const url = message.kind === "image" ? message.image : message.fileUrl;
    if (!url) return;
    setDownloading(true);
    try {
      await downloadFile(url, message.fileName || (message.kind === "image" ? "chat-image.jpg" : "file"));
      setDownloaded(true);
      onNotice("已开始保存");
      window.setTimeout(() => setDownloaded(false), 2200);
    } catch {
      onNotice("保存失败，请稍后再试");
    } finally {
      setDownloading(false);
    }
  };

  const actions: MessageAction[] = [];
  if (message.status === "failed") {
    actions.push({
      id: "retry",
      label: "重新发送",
      icon: "ri-refresh-line",
      onSelect: () => onRetry(message.id),
    });
  }
  if (message.kind === "text" && message.text) {
    actions.push({ id: "copy", label: "复制", icon: "ri-file-copy-line", onSelect: copyText });
  }
  if ((message.kind === "image" && message.image) || (message.kind === "file" && message.fileUrl)) {
    actions.push({
      id: "save",
      label: message.kind === "image" ? "保存图片" : "下载文件",
      icon: "ri-download-2-line",
      onSelect: saveAttachment,
    });
  }
  if (message.kind === "voice") {
    actions.push({
      id: "voice-info",
      label: `${message.duration || 6} 秒语音`,
      icon: "ri-information-line",
      onSelect: () => onNotice("点击语音气泡可以播放"),
    });
  }
  actions.push({
    id: "forward",
    label: "转发",
    icon: "ri-share-forward-line",
    onSelect: () => onNotice("转发功能还在路上"),
  });
  actions.push({
    id: "favorite",
    label: "收藏",
    icon: "ri-star-line",
    onSelect: () => onNotice("已收藏这条消息"),
  });
  actions.push({
    id: "delete",
    label: "删除",
    icon: "ri-delete-bin-6-line",
    danger: true,
    onSelect: () => {
      onDelete(message.id);
      onNotice("消息已删除");
    },
  });

  const renderBody = () => {
    if (message.kind === "image" && message.image) {
      return (
        <button
          type="button"
          onClick={() => onOpenImage(message.image as string)}
          className="block w-[190px] h-[150px] sm:w-[210px] sm:h-[165px] rounded overflow-hidden bg-background-200 shrink-0 cursor-zoom-in"
          title="点击查看大图"
        >
          <img
            src={message.image}
            alt="聊天图片"
            className="w-full h-full object-cover object-top"
          />
        </button>
      );
    }

    if (message.kind === "voice") {
      return <VoiceBubble audioUrl={message.audioUrl} duration={message.duration} mine={mine} />;
    }

    if (message.kind === "file") {
      return (
        <button
          type="button"
          onClick={saveAttachment}
          className="w-[236px] max-w-full text-left rounded bg-background-50 p-2.5 flex items-center gap-2.5 hover:bg-background-100 transition-colors cursor-pointer"
          title="点击下载"
        >
          <span className="w-9 h-10 rounded bg-primary-100 text-primary-700 flex items-center justify-center shrink-0">
            <i className={`${fileIconOf(message.fileName)} text-[19px]`}></i>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[12.5px] text-foreground-950 truncate">
              {message.fileName || "文件"}
            </span>
            <span className="block text-[11px] text-foreground-500 mt-0.5">
              {formatFileSize(message.fileSize)}
            </span>
          </span>
          <i
            className={`${
              downloading
                ? "ri-loader-4-line animate-spin"
                : downloaded
                  ? "ri-check-line text-primary-600"
                  : "ri-download-2-line"
            } text-[16px] text-foreground-400 shrink-0`}
          ></i>
        </button>
      );
    }

    return (
      <div
        className={[
          "relative min-w-0 max-w-[calc(100%_-_52px)] md:max-w-[420px] px-3 py-2 text-[13.5px] leading-[1.7] rounded break-words whitespace-pre-line select-text",
          mine ? "bg-primary-300 text-foreground-950" : "bg-background-50 text-foreground-950",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-3 w-2 h-2 rotate-45",
            mine ? "-right-[3px] bg-primary-300" : "-left-[3px] bg-background-50",
          ].join(" ")}
        ></span>
        <span className="relative">{message.text}</span>
      </div>
    );
  };

  return (
    <div className="wx-fade-up">
      {showTime && (
        <div className="text-center text-[11px] text-foreground-500 py-2.5">{message.time}</div>
      )}
      <div
        className={`flex items-start gap-2.5 w-full min-w-0 ${mine ? "justify-end" : "justify-start"}`}
      >
        {!mine && (
          <img src={avatar} alt="对方头像" className="w-9 h-9 rounded object-cover shrink-0" />
        )}

        {mine && message.status === "failed" && (
          <button
            type="button"
            onClick={() => onRetry(message.id)}
            title="发送失败，点击重新发送"
            className="mt-2 w-5 h-5 shrink-0 flex items-center justify-center rounded-full bg-accent-500 text-background-50 cursor-pointer"
          >
            <i className="ri-error-warning-line text-[12px]"></i>
          </button>
        )}

        {mine && message.status === "sending" && (
          <i className="ri-loader-4-line animate-spin mt-2 text-[13px] text-foreground-400 shrink-0"></i>
        )}

        <div
          ref={bodyRef}
          className="min-w-0 max-w-full flex"
          onPointerDown={startPress}
          onPointerUp={clearPress}
          onPointerMove={clearPress}
          onPointerCancel={clearPress}
          onPointerLeave={clearPress}
          onContextMenu={(event) => {
            event.preventDefault();
            clearPress();
            openMenu();
          }}
          onClickCapture={(event) => {
            if (longPressed.current) {
              event.preventDefault();
              event.stopPropagation();
              longPressed.current = false;
            }
          }}
        >
          {renderBody()}
        </div>

        {mine && (
          <img
            src={profile?.avatar || ""}
            alt="我的头像"
            className="w-9 h-9 rounded object-cover shrink-0"
          />
        )}
      </div>

      {menuRect && (
        <MessageActionMenu rect={menuRect} actions={actions} onClose={() => setMenuRect(null)} />
      )}
    </div>
  );
}
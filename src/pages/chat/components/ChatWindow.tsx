import { useEffect, useRef, useState } from "react";
import MessageBubble from "@/pages/chat/components/MessageBubble";
import ChatComposer from "@/pages/chat/components/ChatComposer";
import ImageViewer from "@/pages/chat/components/ImageViewer";
import { useChat } from "@/context/ChatContext";
import type { ChatMessage, Conversation } from "@/types/chat";

type ChatWindowProps = {
  conversation?: Conversation;
  typing: boolean;
  onBack?: () => void;
};

export default function ChatWindow({ conversation, typing, onBack }: ChatWindowProps) {
  const { sendMessage, retryMessage, deleteMessage, loadHistory } = useChat();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const atBottomRef = useRef(true);
  const prevIdRef = useRef("");
  const noticeTimer = useRef<number | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [loadingOlder, setLoadingOlder] = useState(false);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    const changed = prevIdRef.current !== conversation?.id;
    prevIdRef.current = conversation?.id || "";
    if (changed || atBottomRef.current) node.scrollTop = node.scrollHeight;
  }, [conversation?.id, conversation?.messages.length, typing]);

  useEffect(
    () => () => {
      if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    },
    [],
  );

  const showNotice = (text: string) => {
    setNotice(text);
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(""), 2200);
  };

  const handleLoadHistory = async () => {
    if (!conversation || conversation.loadingHistory) return;
    const node = scrollRef.current;
    const beforeHeight = node?.scrollHeight ?? 0;
    const beforeTop = node?.scrollTop ?? 0;
    setLoadingOlder(true);
    await loadHistory(conversation.id);
    setLoadingOlder(false);
    window.setTimeout(() => {
      if (!node) return;
      node.scrollTop = node.scrollHeight - beforeHeight + beforeTop;
    }, 60);
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background-50 text-center px-6">
        <div className="w-16 h-16 flex items-center justify-center rounded-lg bg-background-100 text-foreground-300 mb-4">
          <i className="ri-chat-smile-2-line text-[30px]"></i>
        </div>
        <p className="text-[14px] text-foreground-500">还没有选择会话</p>
        <p className="text-[12px] text-foreground-400 mt-1.5">从左侧列表里挑一个联系人开始聊天</p>
      </div>
    );
  }

  const messages = conversation.messages as ChatMessage[];

  return (
    <section className="relative flex-1 min-w-0 h-full flex flex-col bg-background-100">
      <header className="h-[64px] shrink-0 px-4 md:px-5 flex items-center justify-between gap-2 border-b border-background-200/80 bg-background-100">
        <div className="flex items-center gap-2 min-w-0">
          {onBack && (
            <button
              type="button"
              title="返回会话列表"
              onClick={onBack}
              className="md:hidden w-8 h-8 shrink-0 flex items-center justify-center rounded text-foreground-600 hover:bg-background-200 cursor-pointer"
            >
              <i className="ri-arrow-left-s-line text-[20px]"></i>
            </button>
          )}
          <div className="min-w-0">
            <h2 className="text-[14.5px] text-foreground-950 truncate">
              {conversation.name}
              {conversation.members ? (
                <span className="ml-2 text-[12px] text-foreground-500">
                  {conversation.members} 人
                </span>
              ) : null}
            </h2>
            <p className="text-[11.5px] text-foreground-500 mt-0.5 truncate">
              {typing ? "对方正在输入…" : conversation.members ? "群聊 · 产品设计部" : "在线"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            title="查找聊天记录"
            onClick={() => showNotice("聊天记录搜索还在路上，先往上翻翻")}
            className="w-8 h-8 flex items-center justify-center rounded text-foreground-600 hover:bg-background-200 transition-colors cursor-pointer"
          >
            <i className="ri-search-line text-[17px]"></i>
          </button>
          <button
            type="button"
            title="聊天设置"
            onClick={() => showNotice("长按消息可以复制、转发或删除")}
            className="w-8 h-8 flex items-center justify-center rounded text-foreground-600 hover:bg-background-200 transition-colors cursor-pointer"
          >
            <i className="ri-more-2-line text-[17px]"></i>
          </button>
        </div>
      </header>

      <div
        ref={scrollRef}
        onScroll={() => {
          const node = scrollRef.current;
          if (!node) return;
          atBottomRef.current = node.scrollHeight - node.scrollTop - node.clientHeight < 120;
        }}
        className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden wx-scroll px-4 md:px-6 py-4"
      >
        <div className="mx-auto w-full max-w-[820px] space-y-3">
          {conversation.hasMore && (
            <div className="flex justify-center pb-1">
              <button
                type="button"
                onClick={() => void handleLoadHistory()}
                disabled={loadingOlder || conversation.loadingHistory}
                className="h-7 px-3 rounded-full bg-background-50 text-[11.5px] text-foreground-600 whitespace-nowrap hover:bg-background-200 transition-colors cursor-pointer disabled:opacity-60"
              >
                {loadingOlder || conversation.loadingHistory ? (
                  <span className="flex items-center gap-1.5">
                    <i className="ri-loader-4-line animate-spin text-[12px]"></i>
                    正在加载更早的消息
                  </span>
                ) : (
                  "查看更早的消息"
                )}
              </button>
            </div>
          )}

          {messages.map((message, index) => {
            const prev = messages[index - 1];
            const showTime = index === 0 || !prev || prev.time !== message.time;
            return (
              <MessageBubble
                key={message.id}
                message={message}
                avatar={conversation.avatar}
                showTime={showTime}
                onOpenImage={setViewerUrl}
                onRetry={(messageId) => retryMessage(conversation.id, messageId)}
                onDelete={(messageId) => deleteMessage(conversation.id, messageId)}
                onNotice={showNotice}
              />
            );
          })}

          {typing && (
            <div className="wx-fade-up flex items-start gap-2.5">
              <img
                src={conversation.avatar}
                alt={conversation.name}
                className="w-9 h-9 rounded-md object-cover shrink-0"
              />
              <div className="flex items-center gap-1 px-3.5 h-9 rounded rounded-tl-sm bg-background-50">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground-400 wx-typing-dot"></span>
                <span
                  className="w-1.5 h-1.5 rounded-full bg-foreground-400 wx-typing-dot"
                  style={{ animationDelay: "0.15s" }}
                ></span>
                <span
                  className="w-1.5 h-1.5 rounded-full bg-foreground-400 wx-typing-dot"
                  style={{ animationDelay: "0.3s" }}
                ></span>
              </div>
            </div>
          )}
        </div>
      </div>

      {notice && (
        <div className="wx-pop-in pointer-events-none absolute bottom-[118px] left-1/2 -translate-x-1/2 z-40 px-3.5 py-2 rounded-md bg-foreground-900/90 text-background-50 text-[12px] whitespace-nowrap">
          {notice}
        </div>
      )}

      <ChatComposer
        conversationId={conversation.id}
        onSend={(payload) => sendMessage(conversation.id, payload)}
        onNotice={showNotice}
      />

      {viewerUrl && <ImageViewer url={viewerUrl} onClose={() => setViewerUrl(null)} />}
    </section>
  );
}
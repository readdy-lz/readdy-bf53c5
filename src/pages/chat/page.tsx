import { useEffect, useState } from "react";
import { useChat } from "@/context/ChatContext";
import { DRAFT_EVENT, readChatDrafts } from "@/lib/drafts";
import ConversationList from "@/pages/chat/components/ConversationList";
import ChatWindow from "@/pages/chat/components/ChatWindow";

export default function ChatPage() {
  const {
    conversations,
    activeId,
    activeConversation,
    typingId,
    totalUnread,
    loading,
    error,
    refresh,
    selectConversation,
  } = useChat();
  const [keyword, setKeyword] = useState("");
  const [mobileThread, setMobileThread] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>(() => readChatDrafts());

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ id: string; text: string }>).detail;
      if (!detail) return;
      setDrafts((prev) => {
        const next = { ...prev };
        if (detail.text.trim()) next[detail.id] = detail.text;
        else delete next[detail.id];
        return next;
      });
    };
    window.addEventListener(DRAFT_EVENT, handler);
    return () => window.removeEventListener(DRAFT_EVENT, handler);
  }, []);

  const handleSelect = (id: string) => {
    selectConversation(id);
    setMobileThread(true);
  };

  return (
    <div className="flex h-full w-full min-w-0">
      <div
        className={`${
          mobileThread ? "hidden md:flex" : "flex"
        } w-full md:w-[316px] lg:w-[336px] shrink-0 flex-col h-full border-r border-background-200/80 bg-background-100`}
      >
        <div className="h-[64px] shrink-0 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-[15px] text-foreground-950">聊天</h1>
            {totalUnread > 0 && (
              <span className="px-1.5 h-[18px] leading-[18px] rounded-full bg-accent-100 text-accent-700 text-[10.5px]">
                {totalUnread} 条未读
              </span>
            )}
          </div>
          <button
            type="button"
            title="发起新会话"
            className="w-7 h-7 flex items-center justify-center rounded bg-background-200 text-foreground-700 hover:bg-background-300 transition-colors cursor-pointer"
          >
            <i className="ri-add-line text-[17px]"></i>
          </button>
        </div>

        <div className="px-3 pb-3 shrink-0">
          <div className="flex items-center gap-1.5 h-8 px-2.5 rounded bg-background-200/80 focus-within:bg-background-50 transition-colors">
            <i className="ri-search-line w-4 h-4 flex items-center justify-center text-[14px] text-foreground-400"></i>
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="搜索"
              className="flex-1 min-w-0 bg-transparent text-sm text-foreground-900 outline-none placeholder:text-foreground-400"
            />
            {keyword && (
              <button
                type="button"
                onClick={() => setKeyword("")}
                className="w-4 h-4 flex items-center justify-center rounded-full text-foreground-400 hover:text-foreground-700 cursor-pointer"
              >
                <i className="ri-close-line text-[13px]"></i>
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex-1 overflow-hidden px-2 py-2 space-y-1">
            {[0, 1, 2, 3, 4].map((row) => (
              <div key={row} className="flex items-center gap-3 px-2.5 py-2.5 animate-pulse">
                <div className="w-[42px] h-[42px] rounded bg-background-200 shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/2 rounded bg-background-100"></div>
                  <div className="h-3 w-3/4 rounded bg-background-100"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <div className="w-12 h-12 flex items-center justify-center rounded-md bg-accent-100 text-accent-700 mb-3">
              <i className="ri-error-warning-line text-[22px]"></i>
            </div>
            <p className="text-[12.5px] text-foreground-600 leading-relaxed">{error}</p>
            <button
              type="button"
              onClick={refresh}
              className="mt-3 h-8 px-3.5 rounded-md bg-primary-500 text-background-50 text-[12px] whitespace-nowrap hover:bg-primary-600 transition-colors cursor-pointer"
            >
              重新加载
            </button>
          </div>
        ) : (
          <ConversationList
            conversations={conversations}
            activeId={activeId}
            keyword={keyword}
            drafts={drafts}
            onSelect={handleSelect}
          />
        )}
      </div>

      <div className={`${mobileThread ? "flex" : "hidden md:flex"} flex-1 min-w-0 h-full`}>
        <ChatWindow
          conversation={activeConversation}
          typing={typingId === activeId}
          onBack={() => setMobileThread(false)}
        />
      </div>
    </div>
  );
}
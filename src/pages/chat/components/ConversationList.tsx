import type { Conversation } from "@/types/chat";

type ConversationListProps = {
  conversations: Conversation[];
  activeId: string;
  keyword: string;
  drafts: Record<string, string>;
  onSelect: (id: string) => void;
};

export default function ConversationList({
  conversations,
  activeId,
  keyword,
  drafts,
  onSelect,
}: ConversationListProps) {
  const normalized = keyword.trim().toLowerCase();
  const filtered = conversations.filter((item) => {
    if (!normalized) return true;
    return (
      item.name.toLowerCase().includes(normalized) ||
      item.lastMessage.toLowerCase().includes(normalized)
    );
  });

  if (filtered.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-12 h-12 flex items-center justify-center rounded-md bg-background-100 text-foreground-300 mb-3">
          <i className="ri-search-line text-[22px]"></i>
        </div>
        <p className="text-[13px] text-foreground-500">没有找到相关会话</p>
        <p className="text-[11.5px] text-foreground-400 mt-1">换个关键词试试</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto wx-scroll py-1.5">
      {filtered.map((item) => {
        const active = item.id === activeId;
        const draft = drafts[item.id];
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={`w-[calc(100%_-_12px)] mx-1.5 px-2.5 py-2.5 flex items-center gap-3 rounded text-left transition-colors cursor-pointer ${
              active
                ? "bg-background-300"
                : "hover:bg-background-200"
            }`}
          >
            <div className="relative shrink-0">
              <img
                src={item.avatar}
                alt={item.name}
                className="w-[42px] h-[42px] rounded object-cover"
              />
              {item.unread > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-accent-500 text-background-50 text-[10px] leading-[17px] font-medium text-center">
                  {item.unread > 99 ? "99+" : item.unread}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[13.5px] text-foreground-950 truncate">
                  {item.name}
                </span>
                {item.pinned && (
                  <i className="ri-pushpin-2-line text-[10px] text-foreground-400"></i>
                )}
                <span className="ml-auto text-[11px] text-foreground-400 shrink-0 whitespace-nowrap">
                  {item.time}
                </span>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                {draft ? (
                  <span className="text-[12px] text-accent-600 truncate">
                    [草稿] {draft}
                  </span>
                ) : (
                  <span className="text-[12px] text-foreground-500 truncate">
                    {item.members ? `${item.members} 人 · ` : ""}
                    {item.lastMessage}
                  </span>
                )}
                {item.muted && (
                  <i className="ri-notification-off-line text-[12px] text-foreground-400 shrink-0"></i>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
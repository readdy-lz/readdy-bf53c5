import type { Contact } from "@/types/chat";

type ContactListProps = {
  contacts: Contact[];
  selectedId: string;
  keyword: string;
  shortcuts: { id: string; label: string; icon: string; badge?: string }[];
  onSelect: (id: string) => void;
};

export default function ContactList({
  contacts,
  selectedId,
  keyword,
  shortcuts,
  onSelect,
}: ContactListProps) {
  const normalized = keyword.trim().toLowerCase();
  const filtered = contacts.filter((item) => {
    if (!normalized) return true;
    return (
      item.name.toLowerCase().includes(normalized) ||
      item.wechatId.toLowerCase().includes(normalized)
    );
  });

  const letters = Array.from(new Set(filtered.map((item) => item.letter))).sort();

  return (
    <div className="flex-1 overflow-y-auto wx-scroll pb-4">
      {!normalized && (
        <div className="px-1.5 pt-1">
          {shortcuts.map((item) => (
            <button
              key={item.id}
              type="button"
              className="w-full px-2 py-2 flex items-center gap-3 rounded hover:bg-background-200 transition-colors cursor-pointer"
            >
              <span className="w-8 h-8 flex items-center justify-center rounded bg-primary-500 text-background-50 shrink-0">
                <i className={`${item.icon} text-[16px]`}></i>
              </span>
              <span className="text-[13px] text-foreground-950">{item.label}</span>
              {item.badge && (
                <span className="ml-auto text-[11px] text-foreground-500">{item.badge}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {letters.length === 0 && (
        <div className="flex flex-col items-center justify-center py-14 text-center px-6">
          <div className="w-12 h-12 flex items-center justify-center rounded-md bg-background-100 text-foreground-300 mb-3">
            <i className="ri-contacts-line text-[22px]"></i>
          </div>
          <p className="text-[13px] text-foreground-500">没有找到这位联系人</p>
        </div>
      )}

      {letters.map((letter) => (
        <div key={letter} id={`letter-${letter}`}>
          <div className="px-3 pt-2.5 pb-1 text-[11px] text-foreground-500">{letter}</div>
          {filtered
            .filter((item) => item.letter === letter)
            .map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                className={`w-[calc(100%_-_12px)] mx-1.5 px-2 py-2 flex items-center gap-3 rounded text-left transition-colors cursor-pointer ${
                  item.id === selectedId ? "bg-background-300" : "hover:bg-background-200"
                }`}
              >
                <img
                  src={item.avatar}
                  alt={item.name}
                  className="w-8 h-8 rounded object-cover shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="text-[13px] text-foreground-950 truncate">{item.name}</span>
                    {item.isStarred && (
                      <i className="ri-star-fill text-[10px] text-accent-500"></i>
                    )}
                  </div>
                  <p className="text-[11.5px] text-foreground-500 truncate mt-0.5">
                    {item.signature}
                  </p>
                </div>
              </button>
            ))}
        </div>
      ))}
    </div>
  );
}
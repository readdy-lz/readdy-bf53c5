import { useEffect, useState } from "react";
import { contactShortcuts } from "@/mocks/wechat";
import { useContacts } from "@/hooks/useContacts";
import ContactList from "@/pages/contacts/components/ContactList";
import ContactDetail from "@/pages/contacts/components/ContactDetail";

type Shortcut = { id: string; label: string; icon: string; badge?: string };

export default function ContactsPage() {
  const { contacts, loading, error, reload } = useContacts();
  const shortcuts = contactShortcuts as Shortcut[];
  const [selectedId, setSelectedId] = useState("");
  const [keyword, setKeyword] = useState("");
  const [mobileDetail, setMobileDetail] = useState(false);

  useEffect(() => {
    if (contacts.length === 0) return;
    setSelectedId((prev) =>
      prev && contacts.some((item) => item.id === prev) ? prev : contacts[0].id,
    );
  }, [contacts]);

  const selected = contacts.find((item) => item.id === selectedId);

  return (
    <div className="flex h-full w-full min-w-0">
      <div
        className={`${
          mobileDetail ? "hidden md:flex" : "flex"
        } w-full md:w-[316px] lg:w-[336px] shrink-0 flex-col h-full border-r border-background-200/80 bg-background-100`}
      >
        <div className="h-[64px] shrink-0 px-4 flex items-center justify-between">
          <h1 className="text-[15px] text-foreground-950">通讯录</h1>
          <div className="flex items-center gap-1">
            <button
              type="button"
              title="添加朋友"
              className="w-7 h-7 flex items-center justify-center rounded bg-background-200 text-foreground-700 hover:bg-background-300 transition-colors cursor-pointer"
            >
              <i className="ri-user-add-line text-[16px]"></i>
            </button>
            <button
              type="button"
              title="更多"
              className="w-7 h-7 flex items-center justify-center rounded bg-background-200 text-foreground-700 hover:bg-background-300 transition-colors cursor-pointer"
            >
              <i className="ri-more-2-line text-[16px]"></i>
            </button>
          </div>
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
          <div className="flex-1 overflow-hidden px-2 py-1 space-y-1">
            {[0, 1, 2, 3, 4, 5].map((row) => (
              <div key={row} className="flex items-center gap-3 px-2.5 py-2.5 animate-pulse">
                <div className="w-9 h-9 rounded-md bg-background-100 shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/3 rounded bg-background-100"></div>
                  <div className="h-3 w-2/3 rounded bg-background-100"></div>
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
              onClick={reload}
              className="mt-3 h-8 px-3.5 rounded-md bg-primary-500 text-background-50 text-[12px] whitespace-nowrap hover:bg-primary-600 transition-colors cursor-pointer"
            >
              重新加载
            </button>
          </div>
        ) : (
          <ContactList
            contacts={contacts}
            selectedId={selectedId}
            keyword={keyword}
            shortcuts={shortcuts}
            onSelect={(id) => {
              setSelectedId(id);
              setMobileDetail(true);
            }}
          />
        )}
      </div>

      <div className={`${mobileDetail ? "flex" : "hidden md:flex"} flex-1 min-w-0 h-full`}>
        <ContactDetail contact={selected} onBack={() => setMobileDetail(false)} />
      </div>
    </div>
  );
}
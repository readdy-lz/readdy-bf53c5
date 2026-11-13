import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useChat } from "@/context/ChatContext";
import type { Contact } from "@/types/chat";

type ContactDetailProps = {
  contact?: Contact;
  onBack: () => void;
};

export default function ContactDetail({ contact, onBack }: ContactDetailProps) {
  const { selectConversation } = useChat();
  const navigate = useNavigate();
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setNotice("");
  }, [contact?.id]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(""), 2400);
    return () => window.clearTimeout(timer);
  }, [notice]);

  if (!contact) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background-50 text-center px-6">
        <div className="w-16 h-16 flex items-center justify-center rounded-lg bg-background-100 text-foreground-300 mb-4">
          <i className="ri-contacts-book-line text-[30px]"></i>
        </div>
        <p className="text-[14px] text-foreground-500">选择一位联系人查看资料</p>
      </div>
    );
  }

  const handleMessage = () => {
    if (!contact.conversationId) {
      setNotice("演示数据里还没有和 TA 的会话");
      return;
    }
    selectConversation(contact.conversationId);
    navigate("/");
  };

  return (
    <section className="flex-1 min-w-0 h-full flex flex-col bg-background-100">
      <header className="h-[64px] shrink-0 px-4 md:px-5 flex items-center gap-2 border-b border-background-200/80 bg-background-100">
        <button
          type="button"
          title="返回通讯录"
          onClick={onBack}
          className="md:hidden w-8 h-8 flex items-center justify-center rounded-md text-foreground-600 hover:bg-background-100 cursor-pointer"
        >
          <i className="ri-arrow-left-s-line text-[20px]"></i>
        </button>
        <h2 className="text-[14.5px] text-foreground-950">详细资料</h2>
        {notice && (
          <span className="wx-pop-in ml-auto px-2.5 py-1 rounded-md bg-accent-100 text-accent-800 text-[11px]">
            {notice}
          </span>
        )}
      </header>

      <div className="flex-1 overflow-y-auto wx-scroll px-4 md:px-8 py-6">
        <div className="mx-auto max-w-[720px] space-y-4">
          <div className="wx-fade-up rounded bg-background-50 p-6 flex flex-col sm:flex-row sm:items-center gap-5">
            <img
              src={contact.avatar}
              alt={contact.name}
              className="w-20 h-20 rounded object-cover shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-[20px] text-foreground-950 truncate">
                  {contact.name}
                </h3>
                {contact.isStarred && (
                  <span className="px-1.5 h-[19px] leading-[19px] rounded bg-accent-100 text-accent-800 text-[10.5px]">
                    星标好友
                  </span>
                )}
              </div>
              <p className="text-[12.5px] text-foreground-500 mt-1.5">微信号：{contact.wechatId}</p>
              <p className="text-[12.5px] text-foreground-500 mt-0.5">地区：{contact.region}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                <button
                  type="button"
                  onClick={handleMessage}
                  className="h-9 px-4 rounded-md bg-primary-500 text-background-50 text-[12.5px] font-medium whitespace-nowrap hover:bg-primary-600 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <i className="ri-chat-3-line text-[15px]"></i>
                  发消息
                </button>
                <button
                  type="button"
                  onClick={() => setNotice("音视频通话为演示占位")}
                  className="h-9 px-4 rounded-md bg-background-200 text-foreground-800 text-[12.5px] whitespace-nowrap hover:bg-background-300 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <i className="ri-vidicon-line text-[15px]"></i>
                  音视频通话
                </button>
              </div>
            </div>
          </div>

          <div className="wx-fade-up rounded bg-background-50 overflow-hidden">
            <div className="px-5 py-3 border-b border-background-200/80 flex items-center justify-between">
              <h4 className="text-[13px] font-medium text-foreground-800">个性签名</h4>
              <i className="ri-quill-pen-line text-[15px] text-foreground-300"></i>
            </div>
            <p className="px-5 py-4 text-[13px] text-foreground-600 leading-relaxed">
              {contact.signature}
            </p>
          </div>

          <div className="wx-fade-up rounded bg-background-50 overflow-hidden">
            <div className="px-5 py-3 border-b border-background-200/80">
              <h4 className="text-[13px] text-foreground-700">共同群聊</h4>
            </div>
            {contact.commonGroups && contact.commonGroups.length > 0 ? (
              <div className="px-5 py-4 flex flex-wrap gap-2">
                {contact.commonGroups.map((group) => (
                  <span
                    key={group}
                    className="px-2.5 h-7 leading-7 rounded-md bg-secondary-100 text-secondary-800 text-[12px] whitespace-nowrap"
                  >
                    {group}
                  </span>
                ))}
              </div>
            ) : (
              <p className="px-5 py-4 text-[12.5px] text-foreground-400">暂无共同群聊</p>
            )}
          </div>

          <div className="wx-fade-up rounded bg-background-50 overflow-hidden">
            <div className="px-5 py-3 border-b border-background-200/80">
              <h4 className="text-[13px] text-foreground-700">更多操作</h4>
            </div>
            <div className="divide-y divide-background-200/70">
              {[
                { label: "设置备注和标签", icon: "ri-price-tag-3-line" },
                { label: "推荐给朋友", icon: "ri-share-forward-line" },
                { label: "加入黑名单", icon: "ri-forbid-line" },
              ].map((row) => (
                <button
                  key={row.label}
                  type="button"
                  onClick={() => setNotice("演示版本暂不支持该操作")}
                  className="w-full px-5 py-3 flex items-center gap-3 hover:bg-background-100 transition-colors cursor-pointer"
                >
                  <span className="w-7 h-7 flex items-center justify-center rounded-md bg-background-100 text-foreground-500">
                    <i className={`${row.icon} text-[15px]`}></i>
                  </span>
                  <span className="text-[13px] text-foreground-700">{row.label}</span>
                  <i className="ri-arrow-right-s-line ml-auto text-[16px] text-foreground-300"></i>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
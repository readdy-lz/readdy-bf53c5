import { NavLink } from "react-router-dom";
import { useChat } from "@/context/ChatContext";

const tabs = [
  { to: "/", icon: "ri-chat-3-line", activeIcon: "ri-chat-3-fill", label: "聊天", key: "chat" },
  { to: "/contacts", icon: "ri-contacts-book-2-line", activeIcon: "ri-contacts-book-2-fill", label: "通讯录", key: "contacts" },
  { to: "/discover", icon: "ri-compass-3-line", activeIcon: "ri-compass-3-fill", label: "发现", key: "discover" },
  { to: "/me", icon: "ri-user-smile-line", activeIcon: "ri-user-smile-fill", label: "我", key: "me" },
];

export default function MobileTabBar() {
  const { totalUnread } = useChat();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[64px] bg-background-100 border-t border-background-200 flex items-stretch z-30">
      {tabs.map((tab) => (
        <NavLink
          key={tab.key}
          to={tab.to}
          end={tab.to === "/"}
          className={({ isActive }) =>
            [
              "relative flex-1 flex flex-col items-center justify-center gap-0.5 text-[11px] cursor-pointer",
              isActive ? "text-primary-600" : "text-foreground-500",
            ].join(" ")
          }
        >
          {({ isActive }) => (
            <>
              <i className={`${isActive ? tab.activeIcon : tab.icon} text-[20px]`}></i>
              <span>{tab.label}</span>
              {tab.key === "chat" && totalUnread > 0 && (
                <span className="absolute top-2 right-1/2 translate-x-4 min-w-[15px] h-[15px] px-1 rounded-full bg-accent-500 text-background-50 text-[9px] leading-[15px] text-center">
                  {totalUnread > 99 ? "99+" : totalUnread}
                </span>
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
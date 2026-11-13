import { NavLink } from "react-router-dom";
import { useChat } from "@/context/ChatContext";
import { useProfile } from "@/context/ProfileContext";

const navItems = [
  { to: "/", icon: "ri-chat-3-line", label: "聊天", key: "chat" },
  { to: "/contacts", icon: "ri-contacts-book-2-line", label: "通讯录", key: "contacts" },
  { to: "/discover", icon: "ri-compass-3-line", label: "发现", key: "discover" },
  { to: "/me", icon: "ri-user-smile-line", label: "我", key: "me" },
];

export default function AppRail() {
  const { totalUnread } = useChat();
  const { profile } = useProfile();

  return (
    <aside className="hidden md:flex w-[68px] shrink-0 flex-col items-center bg-foreground-900 h-full">
      <NavLink
        to="/me"
        title="个人资料"
        className="mt-7 mb-5 w-10 h-10 flex items-center justify-center rounded overflow-hidden cursor-pointer shrink-0"
      >
        <img
          src={profile?.avatar || ""}
          alt={profile?.name || "我"}
          className="w-10 h-10 rounded object-cover"
        />
      </NavLink>

      <nav className="flex flex-col items-center gap-1 mt-1">
        {navItems.map((item) => (
          <NavLink
            key={item.key}
            to={item.to}
            end={item.to === "/"}
            title={item.label}
            className={({ isActive }) =>
              [
                "relative w-11 h-11 flex items-center justify-center rounded-md transition-colors duration-150 cursor-pointer",
                isActive
                  ? "bg-foreground-800 text-primary-400"
                  : "text-foreground-300 hover:bg-foreground-800/70 hover:text-foreground-100",
              ].join(" ")
            }
          >
            {({ isActive }) => (
              <>
                <i
                  className={`${item.icon} text-[21px] w-[21px] h-[21px] flex items-center justify-center ${
                    isActive ? "opacity-100" : "opacity-85"
                  }`}
                ></i>
                {item.key === "chat" && totalUnread > 0 && (
                  <span className="absolute top-1 right-1 min-w-[15px] h-[15px] px-1 rounded-full bg-accent-500 text-background-50 text-[10px] leading-[15px] font-medium text-center">
                    {totalUnread > 99 ? "99+" : totalUnread}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto mb-6 flex flex-col items-center gap-2">
        <button
          type="button"
          title="设置"
          className="w-11 h-11 flex items-center justify-center rounded-md text-foreground-400 hover:bg-foreground-800/70 hover:text-foreground-100 transition-colors cursor-pointer"
        >
          <i className="ri-settings-3-line text-[20px]"></i>
        </button>
        <span className="text-[10px] text-foreground-500 tracking-wide">微聊</span>
      </div>
    </aside>
  );
}
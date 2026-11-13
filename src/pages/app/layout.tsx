import { Outlet } from "react-router-dom";
import AppRail from "@/components/feature/AppRail";
import MobileTabBar from "@/components/feature/MobileTabBar";
import { ChatProvider } from "@/context/ChatContext";
import { ProfileProvider, useProfile } from "@/context/ProfileContext";

function AppShell() {
  const { profile, loading, error, reload } = useProfile();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background-50">
        <div className="flex flex-col items-center gap-3">
          <span className="w-10 h-10 rounded-lg bg-primary-500 text-background-50 flex items-center justify-center">
            <i className="ri-chat-smile-2-line text-[21px]"></i>
          </span>
          <p className="text-[12.5px] text-foreground-500">正在同步数据…</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background-50 px-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="w-12 h-12 rounded-lg bg-accent-100 text-accent-700 flex items-center justify-center">
            <i className="ri-error-warning-line text-[24px]"></i>
          </span>
          <p className="text-[13.5px] text-foreground-800">数据没能加载出来</p>
          <p className="text-[12px] text-foreground-500 max-w-[320px] leading-relaxed">
            {error || "连接不太稳定，稍后再试一次"}
          </p>
          <button
            type="button"
            onClick={reload}
            className="mt-1 h-9 px-4 rounded-md bg-primary-500 text-background-50 text-[12.5px] whitespace-nowrap hover:bg-primary-600 transition-colors cursor-pointer"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background-50">
      <AppRail />
      <main className="flex-1 min-w-0 h-full flex flex-col overflow-hidden pb-[64px] md:pb-0">
        <Outlet />
      </main>
      <MobileTabBar />
    </div>
  );
}

export default function AppLayout() {
  return (
    <ProfileProvider>
      <ChatProvider>
        <AppShell />
      </ChatProvider>
    </ProfileProvider>
  );
}
import { useState } from "react";
import { useProfile } from "@/context/ProfileContext";
import MeSidebar, { meSections, type SectionKey } from "@/pages/me/components/MeSidebar";
import MeMobileHome from "@/pages/me/components/MeMobileHome";
import ProfilePanel from "@/pages/me/components/ProfilePanel";
import ServicesPanel from "@/pages/me/components/ServicesPanel";
import SettingsPanel from "@/pages/me/components/SettingsPanel";

const descriptions: Record<SectionKey, string> = {
  profile: "这些信息只有好友可以看到，随时可以修改",
  services: "零钱、卡券与账单都在这里",
  settings: "消息提醒、隐私与账号安全",
};

type ViewKey = "home" | SectionKey;

export default function MePage() {
  const { profile } = useProfile();
  const [view, setView] = useState<ViewKey>("home");
  const [notice, setNotice] = useState("");

  const section: SectionKey = view === "home" ? "profile" : view;
  const active = meSections.find((item) => item.id === section);
  const title = view === "home" ? "我" : active?.label || "我";

  const flash = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 1800);
  };

  const panel =
    section === "services" ? (
      <ServicesPanel />
    ) : section === "settings" ? (
      <SettingsPanel />
    ) : (
      <ProfilePanel />
    );

  return (
    <div className="flex h-full w-full min-w-0">
      <MeSidebar activeSection={section} onSelect={setView} />

      <div className="flex-1 min-w-0 h-full flex flex-col">
        {/* 移动端标题栏 / 返回条 */}
        <header className="md:hidden h-[52px] shrink-0 flex items-center px-1.5 bg-background-100 border-b border-background-200/70">
          {view === "home" ? (
            <>
              <h1 className="px-2.5 text-[16.5px] text-foreground-950">{title}</h1>
              <button
                type="button"
                onClick={() => setView("settings")}
                aria-label="设置"
                className="ml-auto w-9 h-9 flex items-center justify-center text-foreground-700 cursor-pointer"
              >
                <i className="ri-settings-3-line text-[19px]"></i>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setView("home")}
              className="flex items-center gap-0.5 h-9 pl-1 pr-2 text-foreground-950 cursor-pointer"
            >
              <i className="ri-arrow-left-s-line text-[22px]"></i>
              <span className="text-[16.5px]">{title}</span>
            </button>
          )}
        </header>

        {/* 桌面端标题栏 */}
        <header className="hidden md:flex h-[64px] shrink-0 px-5 items-center justify-between border-b border-background-200/80 bg-background-100">
          <div className="min-w-0">
            <h2 className="text-[14.5px] text-foreground-950">{active?.label || "我"}</h2>
            <p className="text-[11.5px] text-foreground-500 mt-0.5 truncate">
              {descriptions[section]}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11.5px] text-foreground-600 bg-background-200 px-2 h-[22px] leading-[22px] rounded whitespace-nowrap">
              账号已保护
            </span>
            <img
              src={profile?.avatar || ""}
              alt={profile?.name || "我"}
              className="w-7 h-7 rounded object-cover"
            />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto wx-scroll bg-background-100">
          {view === "home" ? (
            <>
              <div className="md:hidden">
                <MeMobileHome onOpen={setView} onNotice={flash} />
              </div>
              <div className="hidden md:block px-6 py-5">
                <ProfilePanel />
              </div>
            </>
          ) : (
            <div className="px-3 md:px-6 py-3 md:py-5">{panel}</div>
          )}
        </div>
      </div>

      {notice && (
        <div className="wx-pop-in fixed bottom-[78px] md:bottom-8 left-1/2 -translate-x-1/2 z-40 px-3.5 py-2 rounded-md bg-foreground-900/90 text-background-50 text-[12px] whitespace-nowrap">
          {notice}
        </div>
      )}
    </div>
  );
}
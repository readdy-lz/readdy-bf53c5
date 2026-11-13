import { useProfile } from "@/context/ProfileContext";

export type SectionKey = "profile" | "services" | "settings";

export const meSections: { id: SectionKey; label: string; icon: string }[] = [
  { id: "profile", label: "个人信息", icon: "ri-user-3-line" },
  { id: "services", label: "我的服务", icon: "ri-apps-2-line" },
  { id: "settings", label: "设置", icon: "ri-settings-3-line" },
];

type MeSidebarProps = {
  activeSection: SectionKey;
  onSelect: (id: SectionKey) => void;
};

export default function MeSidebar({ activeSection, onSelect }: MeSidebarProps) {
  const { profile } = useProfile();
  return (
    <div className="hidden md:flex w-[316px] lg:w-[336px] shrink-0 flex-col h-full border-r border-background-200/80 bg-background-100">
      <div className="h-[64px] shrink-0 px-4 flex items-center justify-between">
        <h1 className="text-[15px] text-foreground-950">我</h1>
        <button
          type="button"
          title="设置"
          className="w-7 h-7 flex items-center justify-center rounded bg-background-200 text-foreground-700 hover:bg-background-300 transition-colors cursor-pointer"
        >
          <i className="ri-settings-3-line text-[16px]"></i>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto wx-scroll px-2.5 py-2">
        <button
          type="button"
          onClick={() => onSelect("profile")}
          className="w-full rounded bg-background-50 p-3.5 flex items-center gap-3 text-left hover:bg-background-50/80 transition-colors cursor-pointer"
        >
          <img
            src={profile?.avatar || ""}
            alt={profile?.name || "我"}
            className="w-12 h-12 rounded object-cover shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[14px] text-foreground-950 truncate">
              {profile?.name || "我"}
            </p>
            <p className="text-[11.5px] text-foreground-500 mt-0.5 truncate">
              微信号：{profile?.wechatId || "-"}
            </p>
          </div>
          <span className="w-7 h-7 flex items-center justify-center rounded text-foreground-400 shrink-0">
            <i className="ri-qr-code-line text-[16px]"></i>
          </span>
        </button>

        <div className="mt-2 space-y-0.5">
          {meSections.map((section) => {
            const active = section.id === activeSection;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => onSelect(section.id)}
                className={`w-full px-2.5 py-2 flex items-center gap-3 rounded text-left transition-colors cursor-pointer ${
                  active ? "bg-background-300" : "hover:bg-background-200"
                }`}
              >
                <span
                  className={`w-8 h-8 flex items-center justify-center rounded shrink-0 text-background-50 ${
                    active ? "bg-primary-600" : "bg-primary-500"
                  }`}
                >
                  <i className={`${section.icon} text-[16px]`}></i>
                </span>
                <span className="text-[13px] text-foreground-950">{section.label}</span>
                <i className="ri-arrow-right-s-line ml-auto text-[16px] text-foreground-400"></i>
              </button>
            );
          })}
        </div>

        <div className="mt-4 px-0.5">
          <div className="rounded bg-background-50 p-3.5">
            <p className="text-[12px] text-foreground-800">账号已保护</p>
            <p className="text-[11.5px] text-foreground-500 leading-relaxed mt-1">
              登录设备 2 台，最近登录：上海 · 今天 08:12
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
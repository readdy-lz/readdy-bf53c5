import { useProfile } from "@/context/ProfileContext";
import type { SectionKey } from "@/pages/me/components/MeSidebar";

type EntryTone = "primary" | "accent" | "secondary" | "neutral";

type Entry = {
  id: string;
  label: string;
  icon: string;
  tone: EntryTone;
  target?: SectionKey;
};

const mainEntries: Entry[] = [
  { id: "services", label: "服务", icon: "ri-wallet-3-line", tone: "primary", target: "services" },
  { id: "favorites", label: "收藏", icon: "ri-bookmark-3-line", tone: "accent" },
  { id: "moments", label: "朋友圈", icon: "ri-image-2-line", tone: "secondary" },
  { id: "cards", label: "卡包", icon: "ri-bank-card-line", tone: "accent" },
  { id: "stickers", label: "表情", icon: "ri-emotion-happy-line", tone: "primary" },
];

const toneClass: Record<EntryTone, string> = {
  primary: "bg-primary-500",
  accent: "bg-accent-500",
  secondary: "bg-secondary-500",
  neutral: "bg-foreground-400",
};

type MeMobileHomeProps = {
  onOpen: (section: SectionKey) => void;
  onNotice: (message: string) => void;
};

export default function MeMobileHome({ onOpen, onNotice }: MeMobileHomeProps) {
  const { profile } = useProfile();

  const handleEntry = (entry: Entry) => {
    if (entry.target) {
      onOpen(entry.target);
      return;
    }
    onNotice(`${entry.label} 为演示占位`);
  };

  return (
    <div className="w-full pb-4">
      <button
        type="button"
        onClick={() => onOpen("profile")}
        className="w-full bg-background-50 px-4 py-4 flex items-center gap-3.5 text-left cursor-pointer active:bg-background-100 transition-colors"
      >
        <img
          src={profile?.avatar || ""}
          alt={profile?.name || "我"}
          className="w-[60px] h-[60px] rounded-[6px] object-cover shrink-0 bg-background-200"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[16.5px] text-foreground-950 truncate leading-tight">
            {profile?.name || "我"}
          </p>
          <p className="text-[13px] text-foreground-500 mt-1.5 truncate">
            微信号：{profile?.wechatId || "-"}
          </p>
        </div>
        <span className="w-6 h-6 flex items-center justify-center text-foreground-500 shrink-0">
          <i className="ri-qr-code-line text-[18px]"></i>
        </span>
        <i className="ri-arrow-right-s-line text-[18px] text-foreground-300 shrink-0"></i>
      </button>

      <div className="mt-2 bg-background-50">
        {mainEntries.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => handleEntry(entry)}
            className="w-full h-[52px] px-4 flex items-center gap-3.5 text-left cursor-pointer active:bg-background-100 transition-colors border-b border-background-100 last:border-b-0"
          >
            <span
              className={`w-[22px] h-[22px] rounded-[6px] flex items-center justify-center shrink-0 text-background-50 ${toneClass[entry.tone]}`}
            >
              <i className={`${entry.icon} text-[14px]`}></i>
            </span>
            <span className="text-[15px] text-foreground-950">{entry.label}</span>
            <i className="ri-arrow-right-s-line ml-auto text-[18px] text-foreground-300"></i>
          </button>
        ))}
      </div>

      <div className="mt-2 bg-background-50">
        <button
          type="button"
          onClick={() => onOpen("settings")}
          className="w-full h-[52px] px-4 flex items-center gap-3.5 text-left cursor-pointer active:bg-background-100 transition-colors"
        >
          <span className="w-[22px] h-[22px] rounded-[6px] flex items-center justify-center shrink-0 text-background-50 bg-foreground-400">
            <i className="ri-settings-3-line text-[14px]"></i>
          </span>
          <span className="text-[15px] text-foreground-950">设置</span>
          <i className="ri-arrow-right-s-line ml-auto text-[18px] text-foreground-300"></i>
        </button>
      </div>
    </div>
  );
}
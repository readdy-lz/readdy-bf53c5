import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { settingsList } from "@/mocks/wechat";
import { useAuth } from "@/context/AuthContext";

type SettingRow = { id: string; label: string; icon: string; value: string };

const toggles = [
  { id: "notify", label: "新消息通知", desc: "收到消息时在桌面提醒我", initial: true },
  { id: "sound", label: "声音与震动", desc: "消息到达时播放提示音", initial: true },
  { id: "autoDownload", label: "自动下载图片", desc: "仅在 Wi-Fi 环境下自动下载", initial: false },
  { id: "readReceipt", label: "显示已读状态", desc: "好友可以看到我是否已读", initial: false },
];

export default function SettingsPanel() {
  const rows = settingsList as SettingRow[];
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [state, setState] = useState<Record<string, boolean>>(
    toggles.reduce<Record<string, boolean>>((acc, item) => {
      acc[item.id] = item.initial;
      return acc;
    }, {}),
  );
  const [notice, setNotice] = useState("");

  const toggle = (id: string) => {
    setState((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const flash = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 1800);
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      navigate("/login", { replace: true });
    } finally {
      setSigningOut(false);
      setConfirmOpen(false);
    }
  };

  return (
    <div className="mx-auto max-w-[680px] space-y-4">
      {notice && (
        <div className="wx-pop-in inline-flex px-3 py-1.5 rounded-md bg-accent-100 text-accent-800 text-[11.5px]">
          {notice}
        </div>
      )}

      <div className="wx-fade-up rounded bg-background-50 overflow-hidden">
        <div className="px-4 py-3">
          <h4 className="text-[12.5px] text-foreground-500">当前账号</h4>
        </div>
        <div className="border-t border-background-100 px-4 py-3.5 flex items-center gap-3">
          <span className="w-8 h-8 flex items-center justify-center rounded bg-primary-100 text-primary-700 shrink-0">
            <i className="ri-account-circle-line text-[18px]"></i>
          </span>
          <div className="min-w-0">
            <p className="text-[13px] text-foreground-950 truncate">{user?.email || "未登录"}</p>
            <p className="text-[11.5px] text-foreground-500 mt-0.5">
              登录状态已保持，关闭页面再回来不需要重新登录
            </p>
          </div>
          <span className="ml-auto shrink-0 px-2 h-[20px] leading-[20px] rounded bg-primary-50 text-primary-700 text-[10.5px]">
            已登录
          </span>
        </div>
      </div>

      <div className="wx-fade-up rounded bg-background-50 overflow-hidden">
        <div className="px-4 py-3">
          <h4 className="text-[12.5px] text-foreground-500">消息设置</h4>
        </div>
        <div className="border-t border-background-100">
          {toggles.map((item) => (
            <div key={item.id} className="px-4 py-3.5 flex items-center gap-3">
              <div className="min-w-0">
                <p className="text-[13px] text-foreground-950">{item.label}</p>
                <p className="text-[11.5px] text-foreground-500 mt-0.5">{item.desc}</p>
              </div>
              <button
                type="button"
                onClick={() => toggle(item.id)}
                aria-label={item.label}
                className={`ml-auto w-11 h-6 rounded-full shrink-0 transition-colors cursor-pointer flex items-center px-0.5 ${
                  state[item.id] ? "bg-primary-500 justify-end" : "bg-background-300 justify-start"
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-background-50 block"></span>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="wx-fade-up rounded bg-background-50 overflow-hidden">
        <div className="px-4 py-3">
          <h4 className="text-[12.5px] text-foreground-500">账号与通用</h4>
        </div>
        <div className="border-t border-background-100">
          {rows.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => flash(`${row.label}为演示占位`)}
              className="w-full px-4 py-3.5 flex items-center gap-3 hover:bg-background-100 transition-colors cursor-pointer"
            >
              <span className="w-7 h-7 flex items-center justify-center rounded bg-background-100 text-foreground-500 shrink-0">
                <i className={`${row.icon} text-[15px]`}></i>
              </span>
              <span className="text-[13px] text-foreground-800">{row.label}</span>
              {row.value && (
                <span className="ml-auto text-[12px] text-foreground-400">{row.value}</span>
              )}
              <i className="ri-arrow-right-s-line text-[16px] text-foreground-400 ml-1"></i>
            </button>
          ))}
        </div>
      </div>

      <div className="wx-fade-up rounded bg-background-50 overflow-hidden">
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="w-full px-4 py-3.5 text-left text-[13px] text-accent-600 hover:bg-background-100 transition-colors cursor-pointer"
        >
          退出当前账号
        </button>
      </div>

      <p className="text-center text-[11.5px] text-foreground-400 pt-1">微聊 演示版 v0.9.2</p>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div
            className="absolute inset-0 bg-foreground-950/35"
            onClick={() => (signingOut ? undefined : setConfirmOpen(false))}
            aria-hidden="true"
          ></div>
          <div className="wx-pop-in relative w-full max-w-[330px] rounded-lg bg-background-50 p-5">
            <h3 className="text-[15px] text-foreground-950">退出登录？</h3>
            <p className="mt-2 text-[12px] leading-relaxed text-foreground-500">
              退出后聊天记录仍会保留，下次用同一邮箱登录就能看到。已保存的草稿也不会丢。
            </p>
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={signingOut}
                className="flex-1 h-9 rounded-md bg-background-100 text-[12.5px] text-foreground-800 whitespace-nowrap hover:bg-background-200 transition-colors cursor-pointer disabled:opacity-60"
              >
                再想想
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="flex-1 h-9 rounded-md bg-accent-500 text-background-50 text-[12.5px] whitespace-nowrap hover:bg-accent-600 transition-colors cursor-pointer disabled:opacity-60"
              >
                {signingOut ? "正在退出…" : "退出登录"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
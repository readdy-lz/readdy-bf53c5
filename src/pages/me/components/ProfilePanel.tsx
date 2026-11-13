import { useEffect, useState } from "react";
import { useProfile } from "@/context/ProfileContext";

export default function ProfilePanel() {
  const { profile, loading, updateSignature } = useProfile();
  const [signature, setSignature] = useState(profile?.signature || "");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile?.signature || "");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setSignature(profile?.signature || "");
  }, [profile?.signature]);

  const flash = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 1800);
  };

  const startEdit = () => {
    setDraft(signature);
    setEditing(true);
  };

  const save = async () => {
    const value = draft.trim();
    setSaving(true);
    const ok = await updateSignature(value);
    setSaving(false);
    if (ok) {
      setSignature(value);
      setEditing(false);
      flash("签名已更新");
    } else {
      flash("保存失败了，再试一次吧");
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-10 text-center text-[13px] text-foreground-500">
        正在读取个人信息…
      </div>
    );
  }

  return (
    <div className="w-full md:max-w-[680px] md:mx-auto">
      {notice && (
        <div className="mb-3 wx-pop-in inline-flex px-3 py-1.5 rounded-md bg-background-200/80 text-foreground-700 text-[12px]">
          {notice}
        </div>
      )}

      {/* 头像 / 名字 / 微信号 */}
      <div className="bg-background-50 md:rounded">
        <button
          type="button"
          onClick={() => flash("换头像为演示占位")}
          className="w-full min-h-[60px] px-4 flex items-center gap-3 text-left cursor-pointer active:bg-background-100 md:hover:bg-background-100 transition-colors border-b border-background-100"
        >
          <span className="text-[15px] text-foreground-950">头像</span>
          <img
            src={profile?.avatar || ""}
            alt="头像"
            className="ml-auto w-[56px] h-[56px] rounded-[5px] object-cover bg-background-200"
          />
        </button>

        <button
          type="button"
          onClick={() => flash("修改名字为演示占位")}
          className="w-full h-[52px] px-4 flex items-center gap-3 text-left cursor-pointer active:bg-background-100 md:hover:bg-background-100 transition-colors border-b border-background-100"
        >
          <span className="text-[15px] text-foreground-950">名字</span>
          <span className="ml-auto text-[14.5px] text-foreground-600 truncate max-w-[60%]">
            {profile?.name || "-"}
          </span>
          <i className="ri-arrow-right-s-line text-[18px] text-foreground-300 shrink-0"></i>
        </button>

        <div className="w-full h-[52px] px-4 flex items-center gap-3">
          <span className="text-[15px] text-foreground-950">微信号</span>
          <span className="ml-auto text-[14.5px] text-foreground-600 truncate max-w-[60%]">
            {profile?.wechatId || "-"}
          </span>
        </div>
      </div>

      {/* 我的二维码 / 更多 / 我的地址 */}
      <div className="mt-2 bg-background-50 md:rounded">
        <button
          type="button"
          onClick={() => flash("二维码为演示占位")}
          className="w-full min-h-[58px] px-4 flex items-center gap-3 text-left cursor-pointer active:bg-background-100 md:hover:bg-background-100 transition-colors border-b border-background-100"
        >
          <span className="text-[15px] text-foreground-950">我的二维码</span>
          <span className="ml-auto w-[42px] h-[42px] rounded-[3px] border border-background-200 flex items-center justify-center text-foreground-400">
            <i className="ri-qr-code-line text-[22px]"></i>
          </span>
        </button>

        <button
          type="button"
          onClick={() => flash("更多信息为演示占位")}
          className="w-full h-[52px] px-4 flex items-center gap-3 text-left cursor-pointer active:bg-background-100 md:hover:bg-background-100 transition-colors border-b border-background-100"
        >
          <span className="text-[15px] text-foreground-950">更多</span>
          <i className="ri-arrow-right-s-line ml-auto text-[18px] text-foreground-300 shrink-0"></i>
        </button>

        <button
          type="button"
          onClick={() => flash("我的地址为演示占位")}
          className="w-full h-[52px] px-4 flex items-center gap-3 text-left cursor-pointer active:bg-background-100 md:hover:bg-background-100 transition-colors"
        >
          <span className="text-[15px] text-foreground-950">我的地址</span>
          <span className="ml-auto text-[14.5px] text-foreground-600 truncate max-w-[50%]">
            {profile?.region || "-"}
          </span>
          <i className="ri-arrow-right-s-line text-[18px] text-foreground-300 shrink-0"></i>
        </button>
      </div>

      {/* 个性签名 */}
      <div className="mt-2 bg-background-50 md:rounded">
        <button
          type="button"
          onClick={startEdit}
          className="w-full min-h-[52px] px-4 py-3 flex items-center gap-3 text-left cursor-pointer active:bg-background-100 md:hover:bg-background-100 transition-colors"
        >
          <span className="text-[15px] text-foreground-950 shrink-0">个性签名</span>
          <span className="ml-auto text-[14.5px] text-foreground-600 truncate">
            {signature || "未填写"}
          </span>
          <i className="ri-arrow-right-s-line text-[18px] text-foreground-300 shrink-0"></i>
        </button>

        {editing && (
          <div className="wx-pop-in px-4 pb-4">
            <textarea
              value={draft}
              autoFocus
              onChange={(event) => setDraft(event.target.value.slice(0, 60))}
              rows={3}
              placeholder="写一句此刻的心情"
              className="w-full resize-none rounded-md bg-background-100 px-3 py-2.5 text-[14px] leading-relaxed text-foreground-900 outline-none focus:ring-2 focus:ring-primary-200"
            />
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className={`h-9 px-4 rounded-md text-[13px] whitespace-nowrap transition-colors ${
                  saving
                    ? "bg-background-200 text-foreground-400 cursor-not-allowed"
                    : "bg-primary-500 text-background-50 hover:bg-primary-600 cursor-pointer"
                }`}
              >
                {saving ? "保存中…" : "保存"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="h-9 px-4 rounded-md bg-background-100 text-[13px] text-foreground-700 whitespace-nowrap hover:bg-background-200 transition-colors cursor-pointer"
              >
                取消
              </button>
              <span className="ml-auto text-[11.5px] text-foreground-400">
                {draft.length}/60
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
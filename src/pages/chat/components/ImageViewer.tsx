import { useState } from "react";
import { downloadFile } from "@/lib/storage";

type ImageViewerProps = {
  url: string;
  onClose: () => void;
};

export default function ImageViewer({ url, onClose }: ImageViewerProps) {
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setFailed(false);
    try {
      const name = url.split("?")[0].split("/").pop() || "image";
      await downloadFile(url, name.includes(".") ? name : `${name}.jpg`);
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-foreground-950/95 flex flex-col">
      <div className="h-[56px] shrink-0 px-3 flex items-center justify-between text-background-50">
        <button
          type="button"
          onClick={onClose}
          aria-label="关闭"
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-background-50/15 transition-colors cursor-pointer"
        >
          <i className="ri-close-line text-[22px]"></i>
        </button>
        <span className="text-[12px] text-background-50/70">
          {failed ? "保存失败，长按图片可另存" : "轻触空白处关闭"}
        </span>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          aria-label="保存图片"
          className="h-9 px-3 flex items-center gap-1.5 rounded-full text-[12px] hover:bg-background-50/15 transition-colors cursor-pointer disabled:opacity-60"
        >
          <i className={`${saving ? "ri-loader-4-line animate-spin" : "ri-download-2-line"} text-[16px]`}></i>
          {saving ? "保存中" : "保存"}
        </button>
      </div>

      <div className="flex-1 min-h-0 flex items-center justify-center px-3 pb-6" onClick={onClose}>
        <img
          src={url}
          alt="聊天图片"
          onClick={(event) => event.stopPropagation()}
          className="max-w-full max-h-full object-contain rounded"
        />
      </div>
    </div>
  );
}
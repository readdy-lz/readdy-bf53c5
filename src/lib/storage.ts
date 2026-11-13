import { supabase } from "@/lib/supabase";

const BUCKET = "chat-media";
const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY as string;

const FOLDER = "chat";

/** 文件名必须是小写字母/数字/点/下划线/连字符，且以字母或数字开头 */
const safeFileName = (rawName: string) => {
  const lower = (rawName || "file").toLowerCase();
  const dotIndex = lower.lastIndexOf(".");
  const rawBase = dotIndex > 0 ? lower.slice(0, dotIndex) : lower;
  const rawExt = dotIndex > 0 ? lower.slice(dotIndex + 1) : "";
  const base = rawBase.replace(/[^a-z0-9_-]/g, "-").replace(/-+/g, "-").slice(0, 40) || "file";
  const ext = rawExt.replace(/[^a-z0-9]/g, "").slice(0, 8);
  const safeBase = /^[a-z0-9]/.test(base) ? base : `f-${base}`;
  return ext ? `${safeBase}.${ext}` : safeBase;
};

const uniquePath = (fileName: string) =>
  `${FOLDER}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${safeFileName(fileName)}`;

export type UploadOptions = {
  fileName?: string;
  onProgress?: (percent: number) => void;
};

/**
 * 带真实进度的上传：直接打存储 REST 接口，用 xhr.upload 监听进度。
 * 上传成功后换取长期可用的签名地址，避免图片/文件在页面里 401。
 */
export async function uploadChatFile(file: Blob, options: UploadOptions = {}) {
  const { fileName = "file", onProgress } = options;
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("登录状态已失效，请重新登录后再上传");

  const safeName = safeFileName(fileName);
  const path = uniquePath(safeName);

  const fallbackUrl = await new Promise<string | null>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${supabaseUrl}/storage/v1/object/${BUCKET}/${path}`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", supabaseAnonKey);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.max(1, Math.round((event.loaded / event.total) * 100)));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve(null);
      } else {
        reject(new Error(`上传失败（${xhr.status}）`));
      }
    };
    xhr.onerror = () => reject(new Error("网络中断，上传失败"));
    xhr.ontimeout = () => reject(new Error("上传超时，请重试"));

    const form = new FormData();
    form.append("file", file, safeName);
    form.append("cacheControl", "3600");
    xhr.send(form);
  }).catch(async () => {
    // 进度接口不可用时回退到标准 SDK 上传，换一个路径避免冲突
    const fallbackPath = uniquePath(safeName);
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(fallbackPath, file, { contentType: file.type || undefined, upsert: false });
    if (uploadError) throw new Error(uploadError.message || "上传失败，请重试");
    onProgress?.(100);
    const { data: fallbackSigned, error: signError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(fallbackPath, 60 * 60 * 24 * 365);
    if (signError || !fallbackSigned?.signedUrl) throw new Error("获取访问地址失败");
    return fallbackSigned.signedUrl;
  });

  if (fallbackUrl) return fallbackUrl;

  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24 * 365);
  if (error || !data?.signedUrl) throw error ?? new Error("获取访问地址失败");
  return data.signedUrl;
}

export async function downloadFile(url: string, fileName: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("下载失败");
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName || "download";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

export const formatFileSize = (size?: number) => {
  if (!size || size <= 0) return "未知大小";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export const fileIconOf = (fileName?: string) => {
  const ext = (fileName || "").split(".").pop()?.toLowerCase() || "";
  if (ext === "pdf") return "ri-file-pdf-2-line";
  if (["doc", "docx"].includes(ext)) return "ri-file-word-2-line";
  if (["xls", "xlsx", "csv"].includes(ext)) return "ri-file-excel-2-line";
  if (["ppt", "pptx"].includes(ext)) return "ri-file-ppt-2-line";
  if (["zip", "rar", "7z"].includes(ext)) return "ri-file-zip-line";
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return "ri-image-line";
  return "ri-file-text-line";
};
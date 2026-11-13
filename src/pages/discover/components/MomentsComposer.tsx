import { useEffect, useRef, useState } from "react";
import { uploadChatFile } from "@/lib/storage";

const DRAFT_KEY = "wx-moment-draft";

const presetLocations = [
  "杭州 · 西湖区",
  "上海 · 徐汇区",
  "深圳 · 南山区",
  "成都 · 太古里",
  "北京 · 朝阳区",
];

type DraftImage = {
  id: string;
  file: File;
  previewUrl: string;
};

type MomentDraft = { text: string; location: string };

const readDraft = (): MomentDraft => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return { text: "", location: "" };
    const parsed = JSON.parse(raw) as Partial<MomentDraft>;
    return { text: parsed.text || "", location: parsed.location || "" };
  } catch {
    return { text: "", location: "" };
  }
};

type MomentsComposerProps = {
  onClose: () => void;
  onPublish: (input: { text: string; images: string[]; location?: string }) => Promise<boolean>;
};

export default function MomentsComposer({ onClose, onPublish }: MomentsComposerProps) {
  const initial = useRef<MomentDraft>(readDraft());
  const [text, setText] = useState(initial.current.text);
  const [location, setLocation] = useState(initial.current.location);
  const [images, setImages] = useState<DraftImage[]>([]);
  const [locationOpen, setLocationOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const doneRef = useRef(false);
  const imagesRef = useRef<DraftImage[]>([]);
  imagesRef.current = images;

  // 文字与位置实时存成草稿，发布失败或误关页面都不会丢
  useEffect(() => {
    if (doneRef.current) return;
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ text, location }));
      } catch {
        // 隐私模式下写不进去也没关系
      }
    }, 260);
    return () => window.clearTimeout(timer);
  }, [text, location]);

  useEffect(
    () => () => {
      imagesRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    },
    [],
  );

  const addImages = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remain = 9 - images.length;
    if (remain <= 0) {
      setError("最多只能放 9 张图");
      return;
    }

    const picked = Array.from(files).slice(0, remain);
    const oversize = picked.find((file) => file.size > 20 * 1024 * 1024);
    if (oversize) {
      setError(`${oversize.name} 超过 20MB，换张小一点的图吧`);
      return;
    }

    setError("");
    setImages((prev) => [
      ...prev,
      ...picked.map((file) => ({
        id: `img-${Date.now()}-${Math.round(Math.random() * 9999)}`,
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ]);
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  };

  const detectLocation = async () => {
    if (locating) return;
    if (!navigator.geolocation) {
      setError("这个浏览器不支持定位，可以从下面的列表里选一个");
      return;
    }

    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=zh`,
          );
          const data = (await response.json()) as {
            city?: string;
            locality?: string;
            principalSubdivision?: string;
          };
          const parts = [data.city || data.principalSubdivision, data.locality].filter(
            (item, index, list) => Boolean(item) && list.indexOf(item) === index,
          );
          setLocation(parts.length > 0 ? parts.join(" · ") : "当前位置");
        } catch {
          setLocation("当前位置");
        } finally {
          setLocating(false);
          setLocationOpen(false);
        }
      },
      () => {
        setLocating(false);
        setError("没有拿到定位权限，可以从列表里选一个位置");
      },
      { timeout: 8000, maximumAge: 60000 },
    );
  };

  const handlePublish = async () => {
    if (publishing) return;
    if (!text.trim() && images.length === 0) {
      setError("写点文字或者选几张图再发布吧");
      return;
    }

    setPublishing(true);
    setError("");
    try {
      const urls: string[] = [];
      for (let index = 0; index < images.length; index += 1) {
        setProgress(`正在上传第 ${index + 1}/${images.length} 张图`);
        const url = await uploadChatFile(images[index].file, { fileName: images[index].file.name });
        urls.push(url);
      }

      setProgress("正在发布…");
      const ok = await onPublish({
        text: text.trim(),
        images: urls,
        location: location || undefined,
      });

      if (!ok) {
        setError("动态没有发出去，文字和图片都还在这里，过会儿再点一次发布");
        return;
      }

      doneRef.current = true;
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        // 忽略
      }
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? `${err.message}，内容已经保留` : "图片上传失败，内容已经帮你保留",
      );
    } finally {
      setPublishing(false);
      setProgress("");
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-background-50 flex flex-col">
      <header className="h-[52px] shrink-0 px-2 flex items-center gap-1 border-b border-background-200/70">
        <button
          type="button"
          onClick={onClose}
          className="h-9 px-2.5 flex items-center gap-0.5 text-[14px] text-foreground-800 whitespace-nowrap hover:bg-background-100 rounded transition-colors cursor-pointer"
        >
          <i className="ri-arrow-left-s-line text-[20px]"></i>
          取消
        </button>
        <h1 className="text-[15.5px] text-foreground-950">发表动态</h1>
        <button
          type="button"
          onClick={() => void handlePublish()}
          disabled={publishing}
          className={`ml-auto h-8 px-3.5 rounded-md text-[12.5px] whitespace-nowrap transition-colors ${
            publishing
              ? "bg-background-300 text-foreground-500 cursor-wait"
              : "bg-primary-500 text-background-50 hover:bg-primary-600 cursor-pointer"
          }`}
        >
          {publishing ? "发布中" : "发布"}
        </button>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto wx-scroll">
        <div className="mx-auto w-full max-w-[560px] px-4 py-4">
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value.slice(0, 1000))}
            rows={5}
            autoFocus
            placeholder="这一刻的想法…"
            className="w-full resize-none bg-transparent text-[15px] leading-[1.75] text-foreground-950 outline-none placeholder:text-foreground-400"
          />

          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {images.map((item) => (
              <div key={item.id} className="relative aspect-square rounded overflow-hidden bg-background-200">
                <img src={item.previewUrl} alt="待发布的图片" className="w-full h-full object-cover object-top" />
                <button
                  type="button"
                  onClick={() => removeImage(item.id)}
                  aria-label="移除图片"
                  className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full bg-foreground-950/65 text-background-50 cursor-pointer"
                >
                  <i className="ri-close-line text-[13px]"></i>
                </button>
              </div>
            ))}

            {images.length < 9 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded bg-background-100 flex flex-col items-center justify-center gap-1 text-foreground-500 hover:bg-background-200 transition-colors cursor-pointer"
              >
                <i className="ri-add-line text-[24px]"></i>
                <span className="text-[10.5px]">{images.length}/9</span>
              </button>
            )}
          </div>

          <div className="mt-4 rounded-md bg-background-100 overflow-hidden">
            <button
              type="button"
              onClick={() => setLocationOpen((prev) => !prev)}
              className="w-full h-11 px-3 flex items-center gap-2.5 text-left hover:bg-background-200/60 transition-colors cursor-pointer"
            >
              <i className="ri-map-pin-line text-[16px] text-primary-600"></i>
              <span className="text-[13px] text-foreground-900">所在位置</span>
              <span className="ml-auto text-[12px] text-foreground-500 truncate max-w-[180px]">
                {location || "不显示"}
              </span>
              <i
                className={`ri-arrow-down-s-line text-[16px] text-foreground-400 transition-transform ${
                  locationOpen ? "rotate-180" : ""
                }`}
              ></i>
            </button>

            {locationOpen && (
              <div className="wx-pop-in border-t border-background-200/70 p-2">
                <button
                  type="button"
                  onClick={() => void detectLocation()}
                  disabled={locating}
                  className="w-full h-9 px-2.5 rounded flex items-center gap-2 text-[12.5px] text-primary-700 hover:bg-background-50 transition-colors cursor-pointer disabled:opacity-60"
                >
                  <i className={`${locating ? "ri-loader-4-line animate-spin" : "ri-crosshair-2-line"} text-[15px]`}></i>
                  {locating ? "正在定位…" : "获取当前位置"}
                </button>
                {presetLocations.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setLocation(item);
                      setLocationOpen(false);
                    }}
                    className={`w-full h-9 px-2.5 rounded flex items-center gap-2 text-[12.5px] transition-colors cursor-pointer hover:bg-background-50 ${
                      location === item ? "text-primary-700" : "text-foreground-700"
                    }`}
                  >
                    <i className="ri-map-pin-2-line text-[14px] text-foreground-400"></i>
                    {item}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setLocation("");
                    setLocationOpen(false);
                  }}
                  className="w-full h-9 px-2.5 rounded flex items-center gap-2 text-[12.5px] text-foreground-600 hover:bg-background-50 transition-colors cursor-pointer"
                >
                  <i className="ri-eye-off-line text-[14px] text-foreground-400"></i>
                  不显示位置
                </button>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-8 px-2.5 rounded-md bg-background-100 text-[12px] text-foreground-700 flex items-center gap-1.5 whitespace-nowrap hover:bg-background-200 transition-colors cursor-pointer"
            >
              <i className="ri-image-add-line text-[15px]"></i>
              相册
            </button>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="h-8 px-2.5 rounded-md bg-background-100 text-[12px] text-foreground-700 flex items-center gap-1.5 whitespace-nowrap hover:bg-background-200 transition-colors cursor-pointer"
            >
              <i className="ri-camera-line text-[15px]"></i>
              拍照
            </button>
            <span className="ml-auto text-[11px] text-foreground-400">
              {text.length}/1000
            </span>
          </div>

          {error && (
            <div className="mt-3 flex items-start gap-2 rounded-md bg-accent-50 px-3 py-2.5">
              <i className="ri-error-warning-line text-[14px] text-accent-600 mt-0.5"></i>
              <p className="text-[11.5px] leading-relaxed text-accent-800">{error}</p>
            </div>
          )}

          <p className="mt-4 text-[11.5px] leading-relaxed text-foreground-400">
            草稿会自动保存。发布失败时文字、图片和位置都会留在原地，重新点发布就行。
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          addImages(event.target.files);
          event.target.value = "";
        }}
      />

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => {
          addImages(event.target.files);
          event.target.value = "";
        }}
      />

      {publishing && (
        <div className="absolute inset-0 z-10 flex items-center justify-center px-8">
          <div className="absolute inset-0 bg-background-50/80" aria-hidden="true"></div>
          <div className="relative flex flex-col items-center gap-3 rounded-lg bg-background-50 px-6 py-5 border border-background-200">
            <i className="ri-loader-4-line animate-spin text-[24px] text-primary-600"></i>
            <p className="text-[12.5px] text-foreground-700">{progress || "正在发布…"}</p>
            <p className="text-[11px] text-foreground-400">发布过程中请不要关掉页面</p>
          </div>
        </div>
      )}
    </div>
  );
}
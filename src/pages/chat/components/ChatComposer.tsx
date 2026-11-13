import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { uploadChatFile } from "@/lib/storage";
import { clearChatDraft, readChatDrafts, setChatDraft } from "@/lib/drafts";
import type { SendPayload } from "@/context/ChatContext";

const emojiGroups = [
  {
    id: "smile",
    label: "表情",
    items: [
      "😀", "😄", "😊", "🙂", "😉", "😍", "😘", "😜",
      "🤔", "😅", "😂", "🥳", "😭", "😴", "🙃", "😎",
      "🥺", "😇", "🤭", "😳", "😬", "😮", "🤗", "🤩",
    ],
  },
  {
    id: "gesture",
    label: "手势",
    items: [
      "👍", "👎", "👏", "🙏", "💪", "👌", "✌️", "🤝",
      "👋", "🙋", "🤙", "🫶", "👀", "🫡", "🤞", "✋",
    ],
  },
  {
    id: "life",
    label: "生活",
    items: [
      "🎉", "❤️", "🌿", "☕", "🍜", "🍰", "🌸", "🌙",
      "🔥", "✨", "🎧", "📷", "🚲", "🏔️", "🐱", "🐶",
    ],
  },
];

type PendingStatus = "uploading" | "failed";

type PendingAttachment = {
  id: string;
  name: string;
  size: number;
  isImage: boolean;
  previewUrl?: string;
  file: File;
  progress: number;
  status: PendingStatus;
};

type ChatComposerProps = {
  conversationId: string;
  onSend: (payload: SendPayload) => Promise<boolean>;
  onNotice: (text: string) => void;
};

export default function ChatComposer({ conversationId, onSend, onNotice }: ChatComposerProps) {
  const [text, setText] = useState(() => readChatDrafts()[conversationId] || "");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [emojiTab, setEmojiTab] = useState(emojiGroups[0].id);
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [voiceMode, setVoiceMode] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const [cancelHint, setCancelHint] = useState(false);
  const [pressing, setPressing] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const idRef = useRef(conversationId);
  const textRef = useRef(text);
  textRef.current = text;

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingRef = useRef(false);
  const startAtRef = useRef(0);
  const stopRequestedRef = useRef(false);
  const cancelledRef = useRef(false);
  const cancelHintRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const startYRef = useRef(0);

  // 切换会话：先把上一段内容存进草稿，再载入新会话的草稿
  useEffect(() => {
    if (idRef.current === conversationId) return;
    setChatDraft(idRef.current, textRef.current);
    const drafts = readChatDrafts();

    idRef.current = conversationId;
    setText(drafts[conversationId] || "");
    setEmojiOpen(false);
    setPanelOpen(false);
    setAttachments((prev) => {
      prev.forEach((item) => item.previewUrl && URL.revokeObjectURL(item.previewUrl));
      return [];
    });
  }, [conversationId]);

  // 草稿自动保存
  useEffect(() => {
    const id = idRef.current;
    const timer = window.setTimeout(() => {
      setChatDraft(id, text);
    }, 280);
    return () => window.clearTimeout(timer);
  }, [text]);

  // 输入框随内容长高
  useEffect(() => {
    const node = textareaRef.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight, 108)}px`;
  }, [text, voiceMode]);

  useEffect(
    () => () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      recorderRef.current = null;
    },
    [],
  );

  const submit = async () => {
    const value = text.trim();
    if (!value) return;
    setText("");
    setEmojiOpen(false);
    clearChatDraft(conversationId);
    textareaRef.current?.focus();
    const ok = await onSend({ kind: "text", text: value });
    if (!ok) {
      setText(value);
      onNotice("这条没发出去，点气泡旁边的感叹号可以重发");
    }
  };

  const insertEmoji = (emoji: string) => {
    setText((prev) => `${prev}${emoji}`);
    textareaRef.current?.focus();
  };

  const uploadItem = async (item: PendingAttachment) => {
    try {
      const url = await uploadChatFile(item.file, {
        fileName: item.name,
        onProgress: (percent) =>
          setAttachments((prev) =>
            prev.map((row) => (row.id === item.id ? { ...row, progress: percent } : row)),
          ),
      });

      const ok = await onSend(
        item.isImage
          ? { kind: "image", image: url }
          : { kind: "file", fileUrl: url, fileName: item.name, fileSize: item.size },
      );

      setAttachments((prev) => prev.filter((row) => row.id !== item.id));
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      if (!ok) onNotice("消息没发出去，在聊天里点感叹号可以重发");
    } catch (err) {
      setAttachments((prev) =>
        prev.map((row) =>
          row.id === item.id ? { ...row, status: "failed", progress: 0 } : row,
        ),
      );
      onNotice(err instanceof Error ? err.message : "上传失败了，点重试再传一次");
    }
  };

  const addFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setPanelOpen(false);

    const picked = Array.from(files);
    const oversize = picked.find((file) => file.size > 20 * 1024 * 1024);
    if (oversize) {
      onNotice(`${oversize.name} 超过 20MB，换个小一点的文件吧`);
      return;
    }

    const created = picked
      .slice(0, 9)
      .map<PendingAttachment>((file) => {
        const isImage = file.type.startsWith("image/");
        return {
          id: `att-${Date.now()}-${Math.round(Math.random() * 9999)}`,
          name: file.name,
          size: file.size,
          isImage,
          previewUrl: isImage ? URL.createObjectURL(file) : undefined,
          file,
          progress: 0,
          status: "uploading",
        };
      });

    setAttachments((prev) => [...prev, ...created]);
    created.forEach((item) => void uploadItem(item));
  };

  const retryAttachment = (item: PendingAttachment) => {
    setAttachments((prev) =>
      prev.map((row) => (row.id === item.id ? { ...row, status: "uploading", progress: 0 } : row)),
    );
    void uploadItem({ ...item, status: "uploading", progress: 0 });
  };

  const removeAttachment = (item: PendingAttachment) => {
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    setAttachments((prev) => prev.filter((row) => row.id !== item.id));
  };

  const stopTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const cleanupStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const finalizeRecording = async () => {
    const duration = Math.max(1, Math.round((Date.now() - startAtRef.current) / 1000));
    const cancelled = cancelledRef.current;
    const chunks = chunksRef.current;
    const mimeType = recorderRef.current?.mimeType || "audio/webm";

    recordingRef.current = false;
    setRecording(false);
    setPressing(false);
    setCancelHint(false);
    cancelHintRef.current = false;
    stopTimer();
    cleanupStream();
    recorderRef.current = null;
    chunksRef.current = [];

    if (cancelled) {
      onNotice("已取消这条语音");
      return;
    }
    if (chunks.length === 0 || Date.now() - startAtRef.current < 900) {
      onNotice("说话时间太短，按住多说一会儿");
      return;
    }

    const blob = new Blob(chunks, { type: mimeType });
    const ext = mimeType.includes("mp4") ? "m4a" : "webm";
    try {
      const url = await uploadChatFile(blob, { fileName: `voice-${Date.now()}.${ext}` });
      const ok = await onSend({ kind: "voice", audioUrl: url, duration });
      if (!ok) onNotice("语音发送失败，在聊天里点感叹号可以重发");
    } catch {
      onNotice("语音没能上传，网络恢复后再试一次");
    }
  };

  const stopRecording = () => {
    stopRequestedRef.current = true;
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    } else {
      recordingRef.current = false;
      setRecording(false);
      setPressing(false);
      stopTimer();
    }
  };

  const beginVoice = async () => {
    if (recordingRef.current) return;
    stopRequestedRef.current = false;
    cancelledRef.current = false;
    cancelHintRef.current = false;
    setCancelHint(false);
    setPressing(true);

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setPressing(false);
      onNotice("这个浏览器不支持录音，换个浏览器试试");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType =
        ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((type) =>
          MediaRecorder.isTypeSupported(type),
        ) || "";
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

      recorderRef.current = recorder;
      streamRef.current = stream;
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        void finalizeRecording();
      };

      recorder.start();
      recordingRef.current = true;
      setRecording(true);
      startAtRef.current = Date.now();
      setRecordSecs(0);
      timerRef.current = window.setInterval(() => {
        setRecordSecs(Math.floor((Date.now() - startAtRef.current) / 1000));
      }, 200);

      if (stopRequestedRef.current) stopRecording();
    } catch {
      setPressing(false);
      stopTimer();
      cleanupStream();
      onNotice("没拿到麦克风权限，请在地址栏允许麦克风后重试");
    }
  };

  const handleVoiceDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    startYRef.current = event.clientY;
    void beginVoice();
  };

  const handleVoiceMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!recordingRef.current) return;
    const distance = startYRef.current - event.clientY;
    const shouldCancel = distance > 56;
    cancelHintRef.current = shouldCancel;
    setCancelHint(shouldCancel);
  };

  const handleVoiceUp = () => {
    if (!recordingRef.current) {
      stopRequestedRef.current = true;
      setPressing(false);
      return;
    }
    cancelledRef.current = cancelHintRef.current;
    stopRecording();
  };

  const currentEmojis = emojiGroups.find((group) => group.id === emojiTab)?.items || [];

  return (
    <div className="relative border-t border-background-200/80 bg-background-100 px-3 sm:px-4 pt-2 pb-2.5">
      {attachments.length > 0 && (
        <div className="mb-2 flex items-end gap-2 overflow-x-auto wx-scroll pb-1">
          {attachments.map((item) => (
            <div key={item.id} className="relative shrink-0">
              {item.isImage && item.previewUrl ? (
                <div className="w-[62px] h-[62px] rounded overflow-hidden bg-background-200">
                  <img src={item.previewUrl} alt={item.name} className="w-full h-full object-cover object-top" />
                </div>
              ) : (
                <div className="w-[92px] h-[62px] rounded bg-background-50 border border-background-200 px-2 py-1.5 flex flex-col justify-center">
                  <i className="ri-file-text-line text-[15px] text-primary-600"></i>
                  <span className="mt-1 text-[10.5px] text-foreground-700 truncate">{item.name}</span>
                </div>
              )}

              {item.status === "uploading" && (
                <div className="absolute inset-0 rounded bg-foreground-950/45 flex flex-col items-center justify-center gap-1">
                  <span className="text-[11px] text-background-50 tabular-nums">{item.progress}%</span>
                  <span className="w-[70%] h-[3px] rounded-full bg-background-50/35 overflow-hidden">
                    <span
                      className="wx-upload-bar block h-full bg-background-50"
                      style={{ width: `${item.progress}%` }}
                    ></span>
                  </span>
                </div>
              )}

              {item.status === "failed" && (
                <div className="absolute inset-0 rounded bg-foreground-950/55 flex flex-col items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={() => retryAttachment(item)}
                    className="px-1.5 h-5 rounded bg-background-50 text-[10.5px] text-foreground-900 whitespace-nowrap cursor-pointer"
                  >
                    重试
                  </button>
                  <span className="text-[9.5px] text-background-50/80">上传失败</span>
                </div>
              )}

              {item.status === "uploading" && (
                <button
                  type="button"
                  onClick={() => removeAttachment(item)}
                  aria-label="移除"
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 flex items-center justify-center rounded-full bg-foreground-800 text-background-50 cursor-pointer"
                >
                  <i className="ri-close-line text-[11px]"></i>
                </button>
              )}

              {item.status === "failed" && (
                <button
                  type="button"
                  onClick={() => removeAttachment(item)}
                  aria-label="移除"
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 flex items-center justify-center rounded-full bg-foreground-800 text-background-50 cursor-pointer"
                >
                  <i className="ri-close-line text-[11px]"></i>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-1 mb-1.5">
        <button
          type="button"
          title={voiceMode ? "切换到键盘" : "切换到语音"}
          onClick={() => {
            setVoiceMode((prev) => !prev);
            setEmojiOpen(false);
            setPanelOpen(false);
            if (!voiceMode) setTimeout(() => textareaRef.current?.blur(), 0);
          }}
          className={`w-8 h-8 flex items-center justify-center rounded transition-colors cursor-pointer ${
            voiceMode ? "bg-background-300 text-foreground-900" : "text-foreground-600 hover:bg-background-200"
          }`}
        >
          <i className={`${voiceMode ? "ri-keyboard-line" : "ri-mic-line"} text-[17px]`}></i>
        </button>
        <button
          type="button"
          title="表情"
          onClick={() => {
            setEmojiOpen((prev) => !prev);
            setPanelOpen(false);
          }}
          className={`w-8 h-8 flex items-center justify-center rounded transition-colors cursor-pointer ${
            emojiOpen ? "bg-background-300 text-foreground-900" : "text-foreground-600 hover:bg-background-200"
          }`}
        >
          <i className="ri-emotion-line text-[17px]"></i>
        </button>
        <button
          type="button"
          title="图片、拍照与文件"
          onClick={() => {
            setPanelOpen((prev) => !prev);
            setEmojiOpen(false);
          }}
          className={`w-8 h-8 flex items-center justify-center rounded transition-colors cursor-pointer ${
            panelOpen ? "bg-background-300 text-foreground-900" : "text-foreground-600 hover:bg-background-200"
          }`}
        >
          <i className="ri-add-circle-line text-[18px]"></i>
        </button>

        <span className="ml-auto text-[10.5px] text-foreground-400 hidden sm:block">
          {text.trim() ? "Enter 发送 · Shift+Enter 换行" : "草稿会自动保存"}
        </span>
      </div>

      <div className="flex items-end gap-2">
        {voiceMode ? (
          <button
            type="button"
            onPointerDown={handleVoiceDown}
            onPointerMove={handleVoiceMove}
            onPointerUp={handleVoiceUp}
            onPointerCancel={handleVoiceUp}
            onContextMenu={(event) => event.preventDefault()}
            className={`flex-1 h-11 rounded-md text-[13.5px] select-none touch-none transition-colors cursor-pointer ${
              pressing
                ? "bg-background-300 text-foreground-900"
                : "bg-background-50 border border-background-200 text-foreground-800 hover:border-primary-300"
            }`}
          >
            {pressing ? (recording ? "松开 发送 · 上滑 取消" : "正在打开麦克风…") : "按住 说话"}
          </button>
        ) : (
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(event) => setText(event.target.value.slice(0, 1000))}
            onKeyDown={(event) => {
              const isMobile = window.matchMedia("(max-width: 767px)").matches;
              if (event.key === "Enter" && !event.shiftKey && !isMobile) {
                event.preventDefault();
                void submit();
              }
            }}
            rows={1}
            placeholder="输入消息"
            className="flex-1 min-w-0 resize-none rounded-md border border-background-200 bg-background-50 px-3 py-2.5 text-[13.5px] leading-relaxed text-foreground-950 placeholder:text-foreground-400 outline-none focus:border-primary-400 transition-colors"
          />
        )}

        <button
          type="button"
          onClick={() => void submit()}
          disabled={!text.trim() || voiceMode}
          className={`h-11 px-5 rounded-md text-[13px] whitespace-nowrap transition-colors ${
            text.trim() && !voiceMode
              ? "bg-primary-500 text-background-50 hover:bg-primary-600 cursor-pointer"
              : "bg-background-200 text-foreground-400 cursor-not-allowed"
          }`}
        >
          发送
        </button>
      </div>

      {!voiceMode && text.length > 800 && (
        <p className="mt-1 text-right text-[10.5px] text-foreground-400">{text.length} / 1000</p>
      )}

      {panelOpen && (
        <div className="wx-pop-in mt-2 rounded-lg bg-background-50 p-3 grid grid-cols-3 gap-2.5">
          {[
            { id: "image", label: "图片", icon: "ri-image-line", action: () => imageInputRef.current?.click() },
            { id: "camera", label: "拍照", icon: "ri-camera-line", action: () => cameraInputRef.current?.click() },
            { id: "file", label: "文件", icon: "ri-file-pdf-2-line", action: () => fileInputRef.current?.click() },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={item.action}
              className="h-[70px] rounded-md bg-background-100 flex flex-col items-center justify-center gap-1.5 hover:bg-background-200 transition-colors cursor-pointer"
            >
              <span className="w-8 h-8 flex items-center justify-center rounded bg-background-50 text-primary-600">
                <i className={`${item.icon} text-[18px]`}></i>
              </span>
              <span className="text-[11.5px] text-foreground-700">{item.label}</span>
            </button>
          ))}
          <p className="col-span-3 text-[10.5px] leading-relaxed text-foreground-400">
            图片一次最多选 9 张，文件支持 PDF、Word、Excel、PPT、压缩包，单个不超过 20MB。
          </p>
        </div>
      )}

      {emojiOpen && (
        <div className="wx-pop-in mt-2 rounded-lg bg-background-50 p-2">
          <div className="flex items-center gap-1 pb-1.5">
            {emojiGroups.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => setEmojiTab(group.id)}
                className={`px-2.5 h-6 rounded text-[11px] transition-colors cursor-pointer ${
                  emojiTab === group.id
                    ? "bg-primary-100 text-primary-700"
                    : "text-foreground-500 hover:bg-background-100"
                }`}
              >
                {group.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setEmojiOpen(false)}
              aria-label="收起表情"
              className="ml-auto w-6 h-6 flex items-center justify-center rounded text-foreground-400 hover:bg-background-100 cursor-pointer"
            >
              <i className="ri-arrow-down-s-line text-[15px]"></i>
            </button>
          </div>
          <div className="grid grid-cols-8 gap-0.5 max-h-[152px] overflow-y-auto wx-scroll">
            {currentEmojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => insertEmoji(emoji)}
                className="h-8 flex items-center justify-center rounded text-[17px] hover:bg-background-100 transition-colors cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          addFiles(event.target.files);
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
          addFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
        className="hidden"
        onChange={(event) => {
          addFiles(event.target.files);
          event.target.value = "";
        }}
      />

      {recording && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center px-8">
          <div className="absolute inset-0 bg-foreground-950/25" aria-hidden="true"></div>
          <div className="wx-pop-in relative w-full max-w-[240px] rounded-lg bg-foreground-900/92 px-5 py-6 flex flex-col items-center text-background-50">
            <span className="wx-record-dot w-12 h-12 rounded-full bg-accent-500 flex items-center justify-center">
              <i className="ri-mic-fill text-[24px] text-background-50"></i>
            </span>
            <p className="mt-3 text-[20px] tabular-nums">{recordSecs}&quot;</p>
            <p className="mt-1 text-[11.5px] text-background-50/70">
              {cancelHint ? "松开手指，取消发送" : "上滑取消 · 松开发送"}
            </p>
            <div
              className={`mt-3 w-full h-8 rounded-md flex items-center justify-center text-[11.5px] ${
                cancelHint ? "bg-accent-500/90" : "bg-background-50/10"
              }`}
            >
              {cancelHint ? "取消发送" : "正在录音…"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
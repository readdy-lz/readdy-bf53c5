import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import { autoReplies } from "@/mocks/wechat";
import type { ChatMessage, Conversation } from "@/types/chat";

const PAGE_SIZE = 10;

type ConversationRow = {
  id: string;
  name: string;
  avatar: string;
  last_message: string | null;
  last_time: string | null;
  unread: number | null;
  pinned: boolean | null;
  muted: boolean | null;
  members: number | null;
  sort_order: number | null;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  side: string;
  kind: string;
  content: string | null;
  image: string | null;
  duration: number | null;
  time_label: string | null;
  sort_order: number | null;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  audio_url: string | null;
};

export type SendPayload = {
  kind: ChatMessage["kind"];
  text?: string;
  image?: string;
  duration?: number;
  audioUrl?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
};

type ChatContextValue = {
  conversations: Conversation[];
  activeId: string;
  activeConversation: Conversation | undefined;
  typingId: string;
  totalUnread: number;
  loading: boolean;
  error: string;
  refresh: () => void;
  selectConversation: (id: string) => void;
  sendMessage: (id: string, payload: SendPayload) => Promise<boolean>;
  retryMessage: (id: string, messageId: string) => void;
  deleteMessage: (id: string, messageId: string) => void;
  loadHistory: (id: string) => Promise<void>;
};

const ChatContext = createContext<ChatContextValue | null>(null);

const formatTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
};

const previewOf = (payload: SendPayload) => {
  if (payload.kind === "image") return "[图片]";
  if (payload.kind === "voice") return "[语音]";
  if (payload.kind === "file") return `[文件] ${payload.fileName || ""}`.trim();
  return payload.text || "";
};

const mapMessage = (row: MessageRow): ChatMessage => ({
  id: row.id,
  side: row.side === "me" ? "me" : "them",
  kind: (row.kind as ChatMessage["kind"]) || "text",
  text: row.content ?? undefined,
  image: row.image ?? undefined,
  duration: row.duration ?? undefined,
  audioUrl: row.audio_url ?? undefined,
  fileUrl: row.file_url ?? undefined,
  fileName: row.file_name ?? undefined,
  fileSize: row.file_size ?? undefined,
  time: row.time_label ?? "",
  sortOrder: row.sort_order ?? undefined,
  status: "sent",
});

export function ChatProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState("");
  const [typingId, setTypingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  const timers = useRef<number[]>([]);
  const conversationsRef = useRef<Conversation[]>([]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  const refresh = useCallback(() => setTick((prev) => prev + 1), []);

  useEffect(
    () => () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
    },
    [],
  );

  useEffect(() => {
    let alive = true;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const { data, error: conversationError } = await supabase
          .from("wx_conversations")
          .select("*")
          .order("sort_order", { ascending: true });

        if (conversationError) throw conversationError;
        if (!alive) return;

        const rows = (data as ConversationRow[] | null) || [];

        const next = await Promise.all(
          rows.map(async (row) => {
            let messages: ChatMessage[] = [];
            let hasMore = false;
            try {
              const { data: messageData, error: messageError } = await supabase
                .from("wx_messages")
                .select("*")
                .eq("conversation_id", row.id)
                .order("sort_order", { ascending: false })
                .limit(PAGE_SIZE);

              if (messageError) throw messageError;
              const list = ((messageData as MessageRow[] | null) || []).reverse().map(mapMessage);
              messages = list;
              hasMore = list.length === PAGE_SIZE;
            } catch {
              hasMore = false;
            }

            return {
              id: row.id,
              name: row.name,
              avatar: row.avatar,
              lastMessage: row.last_message ?? "",
              time: row.last_time ?? "",
              unread: row.unread ?? 0,
              pinned: Boolean(row.pinned),
              muted: Boolean(row.muted),
              members: row.members ?? undefined,
              messages,
              hasMore,
              loadingHistory: false,
            } as Conversation;
          }),
        );

        if (!alive) return;
        setConversations(next);
        setActiveId((prev) => (prev && next.some((item) => item.id === prev) ? prev : next[0]?.id || ""));
      } catch (err) {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "加载聊天数据失败");
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();

    return () => {
      alive = false;
    };
  }, [tick]);

  const selectConversation = useCallback((id: string) => {
    setActiveId(id);
    setConversations((prev) =>
      prev.map((item) => (item.id === id && item.unread > 0 ? { ...item, unread: 0 } : item)),
    );

    void (async () => {
      try {
        await supabase.from("wx_conversations").update({ unread: 0 }).eq("id", id);
      } catch {
        // 未读数清零失败不影响本地阅读体验
      }
    })();
  }, []);

  const loadHistory = useCallback(async (id: string) => {
    const target = conversationsRef.current.find((item) => item.id === id);
    if (!target || target.loadingHistory || !target.hasMore) return;

    const oldest = target.messages[0]?.sortOrder;

    setConversations((prev) =>
      prev.map((item) => (item.id === id ? { ...item, loadingHistory: true } : item)),
    );

    try {
      let query = supabase.from("wx_messages").select("*").eq("conversation_id", id);
      if (oldest !== undefined) query = query.lt("sort_order", oldest);

      const { data, error: queryError } = await query
        .order("sort_order", { ascending: false })
        .limit(PAGE_SIZE);

      if (queryError) throw queryError;
      const list = ((data as MessageRow[] | null) || []).reverse().map(mapMessage);

      setConversations((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                messages: [...list, ...item.messages],
                hasMore: list.length === PAGE_SIZE,
                loadingHistory: false,
              }
            : item,
        ),
      );
    } catch {
      setConversations((prev) =>
        prev.map((item) => (item.id === id ? { ...item, loadingHistory: false } : item)),
      );
      setError("历史消息没有加载出来，稍后再试");
    }
  }, []);

  const persistMessage = useCallback(
    async (conversationId: string, message: ChatMessage, preview: string) => {
      try {
        const { error: insertError } = await supabase.from("wx_messages").insert({
          id: message.id,
          conversation_id: conversationId,
          side: message.side,
          kind: message.kind,
          content: message.text ?? null,
          image: message.image ?? null,
          duration: message.duration ?? null,
          file_url: message.fileUrl ?? null,
          file_name: message.fileName ?? null,
          file_size: message.fileSize ?? null,
          audio_url: message.audioUrl ?? null,
          time_label: message.time,
          sort_order: message.sortOrder ?? Date.now(),
        });

        if (insertError) throw insertError;

        await supabase
          .from("wx_conversations")
          .update({ last_message: preview, last_time: message.time })
          .eq("id", conversationId);

        setConversations((prev) =>
          prev.map((item) =>
            item.id === conversationId
              ? {
                  ...item,
                  messages: item.messages.map((msg) =>
                    msg.id === message.id ? { ...msg, status: "sent" } : msg,
                  ),
                }
              : item,
          ),
        );
        return true;
      } catch {
        setConversations((prev) =>
          prev.map((item) =>
            item.id === conversationId
              ? {
                  ...item,
                  messages: item.messages.map((msg) =>
                    msg.id === message.id ? { ...msg, status: "failed" } : msg,
                  ),
                }
              : item,
          ),
        );
        return false;
      }
    },
    [],
  );

  const replyLater = useCallback((conversationId: string) => {
    const reply = autoReplies[Math.floor(Math.random() * autoReplies.length)];
    const timer = window.setTimeout(() => {
      const replyTime = formatTime();
      const replySort = Date.now();
      const replyId = `reply-${replySort}-${Math.round(Math.random() * 9999)}`;

      const replyMessage: ChatMessage = {
        id: replyId,
        side: "them",
        kind: "text",
        text: reply,
        time: replyTime,
        sortOrder: replySort,
        status: "sent",
      };

      setConversations((prev) =>
        prev.map((item) =>
          item.id === conversationId
            ? {
                ...item,
                time: replyTime,
                lastMessage: reply,
                messages: [...item.messages, replyMessage],
              }
            : item,
        ),
      );
      setTypingId((prev) => (prev === conversationId ? "" : prev));

      void (async () => {
        try {
          await supabase.from("wx_messages").insert({
            id: replyId,
            conversation_id: conversationId,
            side: "them",
            kind: "text",
            content: reply,
            time_label: replyTime,
            sort_order: replySort,
          });
          await supabase
            .from("wx_conversations")
            .update({ last_message: reply, last_time: replyTime })
            .eq("id", conversationId);
        } catch {
          // 自动回复写入失败时保留本地展示
        }
      })();
    }, 1500);

    timers.current.push(timer);
  }, []);

  const sendMessage = useCallback(
    async (id: string, payload: SendPayload) => {
      const time = formatTime();
      const sortOrder = Date.now() + Math.floor(Math.random() * 1000);
      const messageId = `msg-${sortOrder}-${Math.round(Math.random() * 9999)}`;
      const preview = previewOf(payload);

      const message: ChatMessage = {
        id: messageId,
        side: "me",
        time,
        sortOrder,
        status: "sending",
        ...payload,
      };

      setConversations((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, time, lastMessage: preview, messages: [...item.messages, message] }
            : item,
        ),
      );

      const ok = await persistMessage(id, message, preview);

      if (ok && payload.kind === "text") {
        setTypingId(id);
        replyLater(id);
      }

      return ok;
    },
    [persistMessage, replyLater],
  );

  const retryMessage = useCallback(
    (id: string, messageId: string) => {
      const target = conversationsRef.current
        .find((item) => item.id === id)
        ?.messages.find((msg) => msg.id === messageId);
      if (!target) return;

      setConversations((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                messages: item.messages.map((msg) =>
                  msg.id === messageId ? { ...msg, status: "sending" } : msg,
                ),
              }
            : item,
        ),
      );

      void persistMessage(id, { ...target, status: "sending" }, previewOf(target));
    },
    [persistMessage],
  );

  const deleteMessage = useCallback((id: string, messageId: string) => {
    setConversations((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, messages: item.messages.filter((msg) => msg.id !== messageId) }
          : item,
      ),
    );

    void (async () => {
      try {
        await supabase.from("wx_messages").delete().eq("id", messageId);
      } catch {
        // 删除失败时本地已移除，不影响继续聊天
      }
    })();
  }, []);

  const totalUnread = useMemo(
    () => conversations.filter((item) => !item.muted).reduce((sum, item) => sum + item.unread, 0),
    [conversations],
  );

  const activeConversation = useMemo(
    () => conversations.find((item) => item.id === activeId),
    [conversations, activeId],
  );

  const value = useMemo<ChatContextValue>(
    () => ({
      conversations,
      activeId,
      activeConversation,
      typingId,
      totalUnread,
      loading,
      error,
      refresh,
      selectConversation,
      sendMessage,
      retryMessage,
      deleteMessage,
      loadHistory,
    }),
    [
      conversations,
      activeId,
      activeConversation,
      typingId,
      totalUnread,
      loading,
      error,
      refresh,
      selectConversation,
      sendMessage,
      retryMessage,
      deleteMessage,
      loadHistory,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used inside ChatProvider");
  }
  return context;
}
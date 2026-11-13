const DRAFT_KEY = "wx-chat-drafts";

export const DRAFT_EVENT = "wx-draft-change";

export const readChatDrafts = (): Record<string, string> => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
};

const persist = (drafts: Record<string, string>) => {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts));
  } catch {
    // 隐私模式下写不进去就算了，不影响发消息
  }
};

export const setChatDraft = (conversationId: string, text: string) => {
  const drafts = readChatDrafts();
  if (text.trim()) drafts[conversationId] = text;
  else delete drafts[conversationId];
  persist(drafts);
  window.dispatchEvent(new CustomEvent(DRAFT_EVENT, { detail: { id: conversationId, text } }));
};

export const clearChatDraft = (conversationId: string) => {
  setChatDraft(conversationId, "");
};
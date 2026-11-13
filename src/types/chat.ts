export type MessageStatus = "sending" | "sent" | "failed";

export type ChatMessage = {
  id: string;
  side: "me" | "them";
  kind: "text" | "image" | "voice" | "system" | "file";
  text?: string;
  image?: string;
  duration?: number;
  audioUrl?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  time: string;
  sortOrder?: number;
  status?: MessageStatus;
};

export type Conversation = {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  pinned?: boolean;
  muted?: boolean;
  members?: number;
  messages: ChatMessage[];
  hasMore?: boolean;
  loadingHistory?: boolean;
};

export type Contact = {
  id: string;
  name: string;
  avatar: string;
  wechatId: string;
  region: string;
  signature: string;
  letter: string;
  conversationId?: string;
  isStarred?: boolean;
  commonGroups?: string[];
};

export type MomentComment = {
  id: string;
  name: string;
  text: string;
};

export type Moment = {
  id: string;
  author: string;
  avatar: string;
  time: string;
  text: string;
  images?: string[];
  location?: string;
  likes: string[];
  comments: MomentComment[];
};

export type Profile = {
  name: string;
  avatar: string;
  wechatId: string;
  region: string;
  signature: string;
  phone: string;
};
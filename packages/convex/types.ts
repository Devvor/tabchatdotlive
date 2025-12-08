import { Id, Doc } from "./convex/_generated/dataModel";

// ============ User Types ============
export type User = Doc<"users">;
export type UserId = Id<"users">;

// ============ Link Types ============
export type Link = Doc<"links">;
export type LinkId = Id<"links">;

export type LinkStatus = "pending" | "processing" | "completed" | "failed";

export interface LinkWithTopic extends Link {
  topic: {
    _id: string;
    userId: string;
    linkId: string;
    name: string;
    description?: string;
    summary: string;
    keyPoints: string[];
    createdAt: number;
  } | null;
}

// ============ Topic Types (Legacy) ============
export type Topic = Doc<"topics">;
export type TopicId = Id<"topics">;

// ============ Conversation Types ============
export type Conversation = Doc<"conversations">;
export type ConversationId = Id<"conversations">;

export type ConversationStatus = "active" | "completed" | "archived";

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

// ============ Message Types ============
export type Message = Doc<"messages">;
export type MessageId = Id<"messages">;

export type MessageRole = "user" | "assistant";

// ============ Voice Types ============
export interface VoiceMessage {
  role: MessageRole;
  content: string;
  timestamp: number;
}

export type VoiceMode = "listening" | "speaking" | "idle";

// ============ Pagination Types ============
export interface PaginatedResult<T> {
  items: T[];
  cursor: string | null;
  hasMore: boolean;
}

export interface PaginationArgs {
  cursor?: string;
  limit?: number;
}


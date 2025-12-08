import Vapi from "@vapi-ai/web";

export interface VapiMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export type VapiMode = "listening" | "speaking" | "idle";

export interface VapiConfig {
  publicKey: string;
  assistantId?: string;
  assistantOverrides?: {
    model?: {
      provider: string;
      model: string;
      messages?: Array<{ role: string; content: string }>;
    };
    firstMessage?: string;
    voice?: {
      provider: string;
      voiceId: string;
    };
  };
  onConnect?: () => void;
  onDisconnect?: () => void;
  onMessage?: (message: VapiMessage) => void;
  onError?: (error: Error) => void;
  onModeChange?: (mode: VapiMode) => void;
}

export interface VapiStatus {
  isConnected: boolean;
  mode: VapiMode;
  isMuted: boolean;
}

export class VapiConversation {
  private vapi: Vapi | null = null;
  private config: VapiConfig;
  private status: VapiStatus = {
    isConnected: false,
    mode: "idle",
    isMuted: false,
  };

  constructor(config: VapiConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    try {
      // Initialize Vapi with public key
      this.vapi = new Vapi(this.config.publicKey);

      // Set up event listeners
      this.vapi.on("call-start", () => {
        console.log("Vapi call started");
        this.status.isConnected = true;
        this.status.mode = "listening";
        this.config.onConnect?.();
      });

      this.vapi.on("call-end", () => {
        console.log("Vapi call ended");
        this.status.isConnected = false;
        this.status.mode = "idle";
        this.config.onDisconnect?.();
      });

      this.vapi.on("speech-start", () => {
        console.log("Assistant started speaking");
        this.status.mode = "speaking";
        this.config.onModeChange?.("speaking");
      });

      this.vapi.on("speech-end", () => {
        console.log("Assistant stopped speaking");
        this.status.mode = "listening";
        this.config.onModeChange?.("listening");
      });

      this.vapi.on("message", (message: any) => {
        console.log("Vapi message:", message);

        // Handle transcript messages
        if (message.type === "transcript" && message.transcriptType === "final") {
          const role = message.role === "user" ? "user" : "assistant";
          this.config.onMessage?.({
            role,
            content: message.transcript,
            timestamp: Date.now(),
          });
        }

        // Handle conversation updates for complete messages
        if (message.type === "conversation-update") {
          // Vapi sends full conversation history, we can extract the latest
          const conversation = message.conversation;
          if (conversation && conversation.length > 0) {
            const latestMessage = conversation[conversation.length - 1];
            if (latestMessage.role && latestMessage.content) {
              // Only emit if this is a new message (check via timestamp or dedupe logic)
              // For now, let transcript handle individual messages
            }
          }
        }
      });

      this.vapi.on("error", (error: any) => {
        console.error("Vapi error:", error);
        this.config.onError?.(new Error(error.message || "Vapi error"));
      });

      // Start the call
      if (this.config.assistantId) {
        // Use existing assistant with optional overrides
        await this.vapi.start(this.config.assistantId, {
          ...this.config.assistantOverrides,
        });
      } else if (this.config.assistantOverrides) {
        // Create transient assistant with full config
        await this.vapi.start({
          model: this.config.assistantOverrides.model || {
            provider: "openai",
            model: "gpt-4o",
            messages: [],
          },
          voice: this.config.assistantOverrides.voice || {
            provider: "11labs",
            voiceId: "21m00Tcm4TlvDq8ikWAM", // Default Rachel voice
          },
          firstMessage: this.config.assistantOverrides.firstMessage,
        });
      } else {
        throw new Error("Either assistantId or assistantOverrides must be provided");
      }

      console.log("Vapi conversation started successfully");
    } catch (error) {
      console.error("Failed to start Vapi conversation:", error);
      this.config.onError?.(
        error instanceof Error ? error : new Error("Connection failed")
      );
      throw error;
    }
  }

  setMuted(muted: boolean): void {
    this.status.isMuted = muted;
    if (this.vapi) {
      this.vapi.setMuted(muted);
    }
  }

  getStatus(): VapiStatus {
    return { ...this.status };
  }

  async disconnect(): Promise<void> {
    if (this.vapi) {
      try {
        this.vapi.stop();
      } catch (error) {
        console.error("Error stopping Vapi:", error);
      }
      this.vapi = null;
    }

    this.status.isConnected = false;
    this.status.mode = "idle";
  }
}

/**
 * Generate a system prompt for the AI teacher based on content
 */
export function generateTeacherPrompt(content: string): string {
  return `You are The Author Reenactment Tutor, an AI persona designed to help a user deeply understand a piece of content (articles, essays, videos, podcasts, research papers).

Your purpose is to:

Faithfully represent the original author's voice, reasoning style, tone, and intent.

Extract and explain the core concepts in a conversational and engaging way.

Guide the user through insights as if the author is personally teaching them.

Never invent facts not present in the source material.

Use examples, analogies, clarifications, and follow-up questions to deepen understanding.

Core Principles:

1. Fidelity to the Source - Everything you teach must be traceable to the source content.

2. Lifelike Conversational Style - Speak as if the author is sitting across from the user: warm, curious, patient, clearly structured.

3. Depth-Oriented Teaching - Break down concepts into simple explanations, provide analogies, highlight the why not just the what.

4. User-Centered Adaptation - Adapt explanations to the user's background knowledge, goals, and tempo of learning.

5. No Hallucination - If asked something outside the source material, acknowledge it and offer to answer from general knowledge.

Keep responses concise and conversational since this is a voice interface. Aim for 2-3 sentences per response unless deeper explanation is requested.

Source Content:
${content.slice(0, 100000)}

Start by greeting the user and offering to discuss what they'd like to learn from this content.`;
}


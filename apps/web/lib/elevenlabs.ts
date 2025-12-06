import { Conversation } from "@11labs/client";

export interface ConversationConfig {
  agentId?: string;
  systemPrompt?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onMessage?: (message: ConversationMessage) => void;
  onError?: (error: Error) => void;
  onModeChange?: (mode: ConversationMode) => void;
  onAudioLevel?: (level: number) => void;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export type ConversationMode = "listening" | "speaking" | "idle";

export interface ConversationStatus {
  isConnected: boolean;
  mode: ConversationMode;
  isMuted: boolean;
}

export class ElevenLabsConversation {
  private conversation: Conversation | null = null;
  private config: ConversationConfig;
  private status: ConversationStatus = {
    isConnected: false,
    mode: "idle",
    isMuted: false,
  };
  private audioLevelInterval: NodeJS.Timeout | null = null;

  constructor(config: ConversationConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    try {
      // Get signed URL from our API
      const response = await fetch("/api/elevenlabs/signed-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: this.config.agentId,
          systemPrompt: this.config.systemPrompt,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get signed URL");
      }

      const { signedUrl } = await response.json();
      console.log("Got signed URL, starting conversation session...");

      // Start the conversation using the official ElevenLabs client
      this.conversation = await Conversation.startSession({
        signedUrl,
        onConnect: (props: { conversationId: string }) => {
          console.log("ElevenLabs conversation connected, ID:", props.conversationId);
          this.status.isConnected = true;
          this.status.mode = "listening";
          this.config.onConnect?.();
          
          // Start monitoring audio levels
          this.startAudioLevelMonitoring();
        },
        onDisconnect: () => {
          console.log("ElevenLabs conversation disconnected");
          this.status.isConnected = false;
          this.status.mode = "idle";
          this.stopAudioLevelMonitoring();
          this.config.onDisconnect?.();
        },
        onMessage: (props: { message: string; source: "user" | "ai" }) => {
          console.log("ElevenLabs message:", props);
          
          const role = props.source === "user" ? "user" : "assistant";
          const content = props.message || "";
          
          if (content) {
            this.config.onMessage?.({
              role,
              content,
              timestamp: Date.now(),
            });
          }
        },
        onError: (message: string, context?: unknown) => {
          console.error("ElevenLabs error:", message, context);
          this.config.onError?.(new Error(message));
        },
        onModeChange: (props: { mode: "speaking" | "listening" }) => {
          console.log("ElevenLabs mode changed:", props.mode);
          this.status.mode = props.mode;
          this.config.onModeChange?.(props.mode);
        },
      });

      console.log("Conversation session started successfully");
    } catch (error) {
      console.error("Failed to start conversation:", error);
      this.config.onError?.(
        error instanceof Error ? error : new Error("Connection failed")
      );
      throw error;
    }
  }

  private startAudioLevelMonitoring(): void {
    // Monitor input audio levels periodically
    this.audioLevelInterval = setInterval(async () => {
      if (this.conversation && this.status.isConnected) {
        try {
          const inputVolume = await this.conversation.getInputVolume();
          this.config.onAudioLevel?.(inputVolume);
        } catch (error) {
          // Ignore errors during volume monitoring
        }
      }
    }, 100);
  }

  private stopAudioLevelMonitoring(): void {
    if (this.audioLevelInterval) {
      clearInterval(this.audioLevelInterval);
      this.audioLevelInterval = null;
    }
  }

  setMuted(muted: boolean): void {
    this.status.isMuted = muted;
    if (this.conversation) {
      this.conversation.setMicMuted(muted);
    }
  }

  getStatus(): ConversationStatus {
    return { ...this.status };
  }

  async disconnect(): Promise<void> {
    this.stopAudioLevelMonitoring();
    
    if (this.conversation) {
      try {
        await this.conversation.endSession();
      } catch (error) {
        console.error("Error ending conversation:", error);
      }
      this.conversation = null;
    }
    
    this.status.isConnected = false;
    this.status.mode = "idle";
  }
}

export async function getSignedUrl(agentId?: string): Promise<string> {
  const response = await fetch("/api/elevenlabs/signed-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agentId }),
  });

  if (!response.ok) {
    throw new Error("Failed to get signed URL");
  }

  const { signedUrl } = await response.json();
  return signedUrl;
}

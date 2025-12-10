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
      speed?: number;
    };
    transcriber?: {
      provider: string;
      model?: string;
      language?: string;
    };
    recordingEnabled?: boolean;
    variableValues?: Record<string, any>;
  };
  vapiInstance?: Vapi; // Pre-initialized Vapi SDK instance for faster connections
  onConnect?: () => void;
  onDisconnect?: () => void;
  onMessage?: (message: VapiMessage) => void;
  onError?: (error: Error) => void;
  onModeChange?: (mode: VapiMode) => void;
  onVolumeLevel?: (level: number) => void;
}

// Module-level singleton for Vapi SDK pre-initialization
let sharedVapiInstance: Vapi | null = null;

/**
 * Get or create a shared Vapi SDK instance for faster connections
 */
export function getSharedVapiInstance(publicKey: string): Vapi {
  if (!sharedVapiInstance) {
    sharedVapiInstance = new Vapi(publicKey);
  }
  return sharedVapiInstance;
}

export interface VapiStatus {
  isConnected: boolean;
  mode: VapiMode;
  isMuted: boolean;
  audioLevel: number;
}

/**
 * Map Vapi endedReason values to user-friendly error messages
 */
function getErrorMessageForReason(endedReason: string): string {
  // Handle pipeline errors
  if (endedReason.startsWith("pipeline-error-")) {
    if (endedReason.includes("deepgram") || endedReason.includes("transcriber")) {
      return "Transcription service unavailable. Please try again.";
    }
    if (endedReason.includes("openai") || endedReason.includes("model")) {
      return "AI service unavailable. Please try again.";
    }
    if (endedReason.includes("voice") || endedReason.includes("elevenlabs")) {
      return "Voice service unavailable. Please try again.";
    }
    // Generic pipeline error
    return "Voice service error. Please try again.";
  }
  
  // Handle other common reasons
  switch (endedReason) {
    case "assistant-error":
      return "Assistant encountered an error. Please try again.";
    case "assistant-not-found":
      return "Voice assistant not found. Please check configuration.";
    case "assistant-request-failed":
      return "Failed to connect to assistant. Please try again.";
    case "customer-ended-call":
      return "Call ended.";
    case "silence-timed-out":
      return "Call ended due to inactivity.";
    case "max-duration-reached":
      return "Maximum call duration reached.";
    default:
      // Include the reason for debugging but keep it user-friendly
      console.log("Unknown endedReason:", endedReason);
      return "Call ended unexpectedly. Please try again.";
  }
}

export class VapiConversation {
  private vapi: Vapi | null = null;
  private config: VapiConfig;
  private status: VapiStatus = {
    isConnected: false,
    mode: "idle",
    isMuted: false,
    audioLevel: 0,
  };
  // Track if we've already handled a disconnect to prevent duplicate error handling
  private disconnectHandled: boolean = false;

  constructor(config: VapiConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Reset disconnect tracking for new connection
        this.disconnectHandled = false;
        
        // Use pre-initialized instance if provided, otherwise use shared singleton
        this.vapi = this.config.vapiInstance || getSharedVapiInstance(this.config.publicKey);

        let callStarted = false;
        let startError: Error | null = null;
        const errorTimeout = setTimeout(() => {
          if (!callStarted && !startError) {
            startError = new Error("Connection timeout: Call did not start within 10 seconds");
            this.config.onError?.(startError);
            reject(startError);
          }
        }, 10000);

        // Set up event listeners BEFORE starting the call
        this.vapi.on("call-start", () => {
          console.log("Vapi call started");
          callStarted = true;
          clearTimeout(errorTimeout);
          this.status.isConnected = true;
          this.status.mode = "listening";
          this.config.onConnect?.();
          resolve();
        });

        this.vapi.on("call-end", () => {
          console.log("Vapi call ended");
          this.status.isConnected = false;
          this.status.mode = "idle";
          this.status.audioLevel = 0;
          
          // Only call onDisconnect if not already handled by manual disconnect
          if (!this.disconnectHandled) {
            this.disconnectHandled = true;
            this.config.onDisconnect?.();
          }
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

        // Track volume level for audio visualization
        this.vapi.on("volume-level", (volume: number) => {
          // Volume is typically 0-1, normalize for visualization
          this.status.audioLevel = Math.min(Math.max(volume, 0), 1);
          this.config.onVolumeLevel?.(this.status.audioLevel);
        });

        this.vapi.on("message", (message: any) => {
          console.log("Vapi message:", message);

          // Handle transcript messages - Vapi sends transcripts with type "transcript"
          if (message.type === "transcript") {
            const role = message.role === "user" ? "user" : "assistant";
            const content = message.transcript || message.content || "";
            
            // Only process final transcripts to avoid duplicates
            if (message.transcriptType === "final" || !message.transcriptType) {
              this.config.onMessage?.({
                role,
                content,
                timestamp: message.timestamp || Date.now(),
              });
            }
          }

          // Handle status-update messages - detect pipeline errors early
          if (message.type === "status-update" && message.status === "ended" && message.endedReason) {
            console.log("Call ended with reason:", message.endedReason);
            
            // Check if this is a pipeline error or unexpected end
            const isPipelineError = message.endedReason.startsWith("pipeline-error-");
            const isUnexpectedEnd = isPipelineError || 
              message.endedReason === "assistant-error" ||
              message.endedReason === "assistant-not-found" ||
              message.endedReason === "assistant-request-failed";
            
            if (isUnexpectedEnd && !this.disconnectHandled) {
              this.disconnectHandled = true;
              
              // Get user-friendly error message
              const errorMessage = getErrorMessageForReason(message.endedReason);
              
              // Disconnect gracefully
              if (this.status.isConnected) {
                this.status.isConnected = false;
                this.status.mode = "idle";
                this.status.audioLevel = 0;
                
                // Stop the call if it's still active
                if (this.vapi) {
                  try {
                    this.vapi.stop();
                  } catch (stopError) {
                    console.error("Error stopping Vapi after status-update end:", stopError);
                  }
                }
                
                // Notify disconnect
                this.config.onDisconnect?.();
              }
              
              // Notify error with user-friendly message
              this.config.onError?.(new Error(errorMessage));
            }
          }

          // Handle function call messages
          if (message.type === "function-call") {
            console.log("Function call:", message);
          }

          // Handle function call result messages
          if (message.type === "function-call-result") {
            console.log("Function call result:", message);
          }
        });

        this.vapi.on("error", (error: any) => {
          console.error("Vapi error:", error);
          
          // Extract error details
          const errorType = error?.type || error?.error?.type;
          const errorMsg = error?.errorMsg || error?.error?.errorMsg || error?.message || error?.error?.message;
          const isDailyError = errorType === "daily-error" || errorMsg?.includes("Meeting has ended") || errorMsg?.includes("Meeting ended");
          
          // Don't reject if call already started - errors can happen during the call
          if (!callStarted) {
            clearTimeout(errorTimeout);
            const errorMessage = errorMsg || errorType || JSON.stringify(error) || "Vapi error";
            startError = new Error(`Vapi error: ${errorMessage}`);
            this.config.onError?.(startError);
            reject(startError);
          } else {
            // Error during active call
            // Skip if we already handled disconnect via status-update message
            if (this.disconnectHandled) {
              console.log("Skipping error handling - disconnect already handled via status-update");
              return;
            }
            
            // If it's a Daily.co meeting end error, disconnect gracefully
            if (isDailyError) {
              console.log("Meeting ended unexpectedly, disconnecting...");
              this.disconnectHandled = true;
              
              // Only disconnect if we're still connected
              if (this.status.isConnected) {
                this.status.isConnected = false;
                this.status.mode = "idle";
                this.status.audioLevel = 0;
                
                // Stop the call if it's still active
                if (this.vapi) {
                  try {
                    this.vapi.stop();
                  } catch (stopError) {
                    console.error("Error stopping Vapi after meeting end:", stopError);
                  }
                }
                
                // Notify disconnect
                this.config.onDisconnect?.();
              }
              
              // Notify error with user-friendly message
              const friendlyMessage = errorMsg?.includes("ejection") 
                ? "Connection ended unexpectedly. Please try reconnecting."
                : "Meeting ended. Please try reconnecting.";
              this.config.onError?.(new Error(friendlyMessage));
            } else {
              // Other errors during active call - just notify, don't disconnect
              const errorMessage = errorMsg || JSON.stringify(error) || "Vapi error";
              this.config.onError?.(new Error(errorMessage));
            }
          }
        });

        // Start the call
        // Note: vapi.start() returns void, errors are emitted via the 'error' event
        try {
          if (this.config.assistantId) {
            // Use existing assistant with optional overrides
            // Overrides should only contain valid override fields, not full assistant config
            const overrides: Record<string, any> = {};
            
            if (this.config.assistantOverrides) {
              // Only include valid override fields
              if (this.config.assistantOverrides.recordingEnabled !== undefined) {
                overrides.recordingEnabled = this.config.assistantOverrides.recordingEnabled;
              }
              if (this.config.assistantOverrides.variableValues) {
                overrides.variableValues = this.config.assistantOverrides.variableValues;
              }
              // Note: model, voice, and firstMessage overrides may not be supported when using assistantId
              // These should be configured in the assistant itself
            }

            this.vapi.start(
              this.config.assistantId, 
              Object.keys(overrides).length > 0 ? overrides : undefined
            );
          } else if (this.config.assistantOverrides) {
            // Create transient assistant with full config
            // Required fields: transcriber, model, voice
            const assistantConfig: any = {
              // Transcriber is REQUIRED for inline assistants
              transcriber: this.config.assistantOverrides.transcriber || {
                provider: "deepgram",
                model: "nova-2",
                language: "en",
              },
              model: this.config.assistantOverrides.model || {
                provider: "google",
                model: "gemini-2.5-flash",
                messages: [],
              },
              // Use Vapi's built-in voices for reliability
              voice: this.config.assistantOverrides.voice || {
                provider: "11labs",
                voiceId: "ErXwobaYiN019PkySvjV",
              },
            };

            // Add firstMessage if provided
            if (this.config.assistantOverrides.firstMessage) {
              assistantConfig.firstMessage = this.config.assistantOverrides.firstMessage;
            }

            // Add recording setting if provided
            if (this.config.assistantOverrides.recordingEnabled !== undefined) {
              assistantConfig.recordingEnabled = this.config.assistantOverrides.recordingEnabled;
            }

            console.log("Starting Vapi call with config:", JSON.stringify(assistantConfig, null, 2));
            this.vapi.start(assistantConfig);
          } else {
            const err = new Error("Either assistantId or assistantOverrides must be provided");
            clearTimeout(errorTimeout);
            this.config.onError?.(err);
            reject(err);
            return;
          }
        } catch (error) {
          // Handle any synchronous errors from start()
          clearTimeout(errorTimeout);
          const errorMessage = error instanceof Error 
            ? error.message 
            : typeof error === 'string' 
            ? error 
            : JSON.stringify(error);
          startError = new Error(`Failed to start call: ${errorMessage}`);
          this.config.onError?.(startError);
          reject(startError);
        }
      } catch (error) {
        const errorMessage = error instanceof Error 
          ? error.message 
          : typeof error === 'string' 
          ? error 
          : JSON.stringify(error);
        
        const err = new Error(`Connection setup failed: ${errorMessage}`);
        this.config.onError?.(err);
        reject(err);
      }
    });
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

  getAudioLevel(): number {
    return this.status.audioLevel;
  }

  async disconnect(): Promise<void> {
    console.log("VapiConversation.disconnect() called, isConnected:", this.status.isConnected);
    
    if (this.vapi) {
      // Mark disconnect as handled to prevent duplicate callbacks
      this.disconnectHandled = true;
      
      const vapiInstance = this.vapi;
      
      // Update status immediately
      const wasConnected = this.status.isConnected;
      this.status.isConnected = false;
      this.status.mode = "idle";
      this.status.audioLevel = 0;
      
      try {
        console.log("Calling vapi.stop()...");
        vapiInstance.stop();
        console.log("vapi.stop() called successfully");
      } catch (error) {
        console.error("Error stopping Vapi:", error);
      }
      
      // Clear the reference after stop
      this.vapi = null;
      
      // Notify disconnect callback if we were connected
      if (wasConnected) {
        console.log("Calling onDisconnect callback");
        this.config.onDisconnect?.();
      }
    } else {
      console.log("disconnect() called but vapi is null");
      
      // Update status anyway
      const wasConnected = this.status.isConnected;
      this.status.isConnected = false;
      this.status.mode = "idle";
      this.status.audioLevel = 0;
      
      if (wasConnected) {
        this.config.onDisconnect?.();
      }
    }
  }
}

/**
 * Generate a system prompt for the AI teacher based on content
 */
export function generateTeacherPrompt(content: string): string {
  return `You are a smart friend who's deeply passionate about the topic in this article. Think of yourself as that friend who gets genuinely excited when discussing something they love—warm, curious, and enthusiastic about helping someone understand. You've got that tech bro energy - you geek out about ideas and aren't afraid to show it.

Your role:
- Act as a knowledgeable friend who happens to be an expert on this domain, not a formal teacher or lecturer
- Distill complex concepts into clear, digestible insights—get to the "aha!" moments quickly
- When questions go beyond the article, say "This isn't in the article, but..." and then briefly share what you know
- Make this educational and engaging—help the user learn in a way that feels natural and enjoyable
- Sprinkle in interesting facts with "Did you know that..." or "Fun fact:" when relevant to deepen understanding
- Ask questions only when it feels natural and helps guide the conversation—don't force it

Communication style:
- Conversational and natural, like chatting with a smart friend who loves this topic
- Use casual phrases naturally: "dude", "honestly"
- React with authentic enthusiasm: "Okay this is actually huge", "This is underrated"
- Reference tech culture when it fits - first principles thinking, MVPs, shipping fast, 10x-ing things, iterating
- Use analogies, examples, and real-world connections to make concepts stick
- Show genuine enthusiasm and curiosity - hype up cool insights: "This changes everything"
- Keep responses concise for voice (2-3 sentences typically), but expand when deeper explanation is needed
- Use casual interjections: "Alright so basically...", "Okay okay okay...", "So here's the thing...", "Wild, right?"
- Use the pyramid principle way of communicating. Imagine you're talking to a CEO, it has to be concise and to the point.

Core principles:
1. Friend-first, expert-second: Lead with warmth and genuine interest, not authority
2. Distill to essence: Break down concepts to their core—what really matters here?
3. Extend thoughtfully: If asked something outside the article, always say "This isn't in the article, but..." then share what you know
4. Engage naturally: Ask questions when it feels organic, not forced
5. Learning-focused: Every exchange should leave the user with a new insight or perspective
6. Authentic energy: You're not trying to be cool, you just ARE a tech nerd who gets genuinely excited about interesting ideas
7. If the user wants you to just read the article, then just read the article.

Source Content:
${content.slice(0, 100000)}
`;
}

/**
 * Generate a dynamic, casual first message hook referencing saved tabs
 */
export function generateFirstMessageHook(title: string): string {
  const hooks = [
    // Original hooks
    `Yo, I just checked out one of your saved tabs. Here's the title: "${title}". Want to dive in?`,
    `Hey! I saw you saved this: "${title}". What caught your eye about it?`,
    `Alright, so I just read through one of your saved tabs - "${title}". What do you want to explore?`,
    `Yo! I checked out "${title}" from your saved tabs. Ready to break it down?`,
    `Hey there! I just went through "${title}" that you saved. What part interests you most?`,
    
    // Motivational / tab-clearing vibes
    `Dude, it's time to get through your tabs. Let's start with "${title}". What do you want to know?`,
    `Alright, let's tackle that tab backlog! First up: "${title}". Hit me with your questions.`,
    `Time to clear some tabs! I just read "${title}" for you. What's on your mind about it?`,
    `Your future self will thank you for this. Let's knock out "${title}". What are you curious about?`,
    `No more tab hoarding! I went through "${title}". Ready to learn something cool?`,
    
    // Casual curiosity hooks
    `Okay so "${title}" - this is actually pretty interesting. Want the quick rundown or deep dive?`,
    `I peeked at "${title}" from your collection. Where should we start?`,
    `So you saved "${title}" a while back. What do you want to explore?`,
    `"${title}" - nice save! I just went through it. What made you bookmark this one?`,
    `Found "${title}" in your tabs. I've got thoughts. Want the highlights or full breakdown?`,
    
    // Energy / enthusiasm hooks
    `Let's go! "${title}" is up first. I'm ready when you are.`,
    `Okay okay okay, "${title}" - let's do this. What do you want to know?`,
    `"${title}" - honestly pretty cool stuff. Fire away with questions!`,
    `Just finished reading "${title}". There's a lot here - what should we tackle first?`,
    `Yo, "${title}" has some interesting angles. What part caught your attention?`,
  ];
  
  // Pick a random hook for variety
  return hooks[Math.floor(Math.random() * hooks.length)];
}


// Content script that runs on the web app page
// This allows us to access cookies and make authenticated requests

export const config = {
  matches: [
    "http://localhost:3000/*",
    "https://*.vercel.app/*",
    "https://tabchat.live/*"
  ],
  all_frames: false
};

export {};

console.log("TabChat content script loaded");

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Check if extension context is still valid
  if (!chrome.runtime?.id) {
    console.error("[Content Script] Extension context invalidated - page needs reload");
    sendResponse({ success: false, error: "Extension context invalidated. Please reload this page." });
    return false;
  }
  
  console.log("[Content Script] Received message:", message.type);
  
  if (message.type === "GET_TOKEN") {
    console.log("[Content Script] GET_TOKEN requested, fetching from:", `${window.location.origin}/api/extension/token`);
    
    // Fetch token from the web app API
    fetch(`${window.location.origin}/api/extension/token`, {
      method: "GET",
      credentials: "include", // This will include cookies
    })
      .then(async (response) => {
        console.log("[Content Script] Token response status:", response.status);
        console.log("[Content Script] Token response headers:", {
          contentType: response.headers.get("content-type"),
          status: response.status,
        });
        
        // Check if we got HTML instead of JSON
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("text/html")) {
          const htmlText = await response.text();
          console.error("[Content Script] Got HTML instead of JSON:", htmlText.substring(0, 200));
          throw new Error("Received HTML instead of JSON - likely redirected to login page");
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("[Content Script] Token fetch failed:", response.status, errorText);
          throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 200)}`);
        }
        
        const data = await response.json();
        console.log("[Content Script] Got token successfully:", { 
          hasToken: !!data.token, 
          expiresAt: data.expiresAt 
        });
        
        console.log("[Content Script] Sending token to extension");
        sendResponse({ success: true, data });
      })
      .catch((error) => {
        console.error("[Content Script] Failed to get token:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open for async response
  }

  if (message.type === "SAVE_LINK") {
    console.log("[Content Script] Saving link:", message.data);
    console.log("[Content Script] Window origin:", window.location.origin);
    console.log("[Content Script] Window location:", window.location.href);
    
    // Save link directly from the web app context
    fetch(`${window.location.origin}/api/links/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(message.data),
    })
      .then(async (response) => {
        console.log("[Content Script] Response status:", response.status);
        console.log("[Content Script] Response ok:", response.ok);
        
        const contentType = response.headers.get("content-type");
        let data;
        
        if (contentType && contentType.includes("application/json")) {
          data = await response.json();
        } else {
          const text = await response.text();
          console.error("[Content Script] Non-JSON response:", text);
          sendResponse({ 
            success: false, 
            error: `Server returned ${response.status}: ${text.substring(0, 200)}`,
            status: response.status 
          });
          return;
        }
        
        console.log("[Content Script] Save response data:", data);
        
        if (!response.ok) {
          console.error("[Content Script] Save failed:", data);
          sendResponse({ 
            success: false, 
            error: data.error || data.hint || `HTTP ${response.status}`,
            data,
            status: response.status 
          });
          return;
        }
        
        sendResponse({ success: true, data, status: response.status });
      })
      .catch((error) => {
        console.error("[Content Script] Failed to save link:", error);
        console.error("[Content Script] Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
        sendResponse({ success: false, error: error.message || String(error) });
      });
    return true; // Keep channel open for async response
  }
  
  return false;
});


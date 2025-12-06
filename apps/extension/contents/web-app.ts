// Content script that runs on the web app page
// This allows us to access cookies and make authenticated requests

export {};

console.log("TabChat content script loaded");

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Content script received message:", message.type);
  
  if (message.type === "GET_TOKEN") {
    // Fetch token from the web app API
    fetch(`${window.location.origin}/api/extension/token`, {
      method: "GET",
      credentials: "include", // This will include cookies
    })
      .then(async (response) => {
        if (!response.ok) {
          const error = await response.text();
          throw new Error(`HTTP ${response.status}: ${error}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log("Got token:", data);
        sendResponse({ success: true, data });
      })
      .catch((error) => {
        console.error("Failed to get token:", error);
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


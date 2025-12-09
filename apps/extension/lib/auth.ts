/**
 * Simplified authentication for the browser extension
 * Uses Convex Auth tokens stored from the web app
 */

import { Storage } from "@plasmohq/storage";
import { getWebUrl } from "./config";

const storage = new Storage();

interface AuthToken {
  token: string;
  expiresAt: number;
}

/**
 * Get the stored Convex auth token
 */
export async function getStoredToken(): Promise<string | null> {
  const authData = await storage.get<AuthToken>("convexAuthToken");
  
  if (!authData || !authData.token) {
    console.log("[Auth] No stored token found");
    return null;
  }
  
  const now = Date.now();
  const timeUntilExpiry = authData.expiresAt - now;
  
  // Only reject if token is actually expired (no buffer - let server handle near-expiry)
  if (timeUntilExpiry <= 0) {
    console.log("[Auth] Token expired", { expiresAt: authData.expiresAt, now, diff: timeUntilExpiry });
    return null;
  }
  
  console.log("[Auth] Token valid, expires in", Math.round(timeUntilExpiry / 1000), "seconds");
  return authData.token;
}

/**
 * Store the Convex auth token
 */
export async function storeToken(token: string, expiresAt: number): Promise<void> {
  await storage.set("convexAuthToken", {
    token,
    expiresAt,
  });
  console.log("[Auth] Token stored, expires at:", new Date(expiresAt).toISOString());
}

/**
 * Clear the stored auth token
 */
export async function clearToken(): Promise<void> {
  await storage.remove("convexAuthToken");
  console.log("[Auth] Token cleared");
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getStoredToken();
  return token !== null;
}

/**
 * Open the web app login page
 */
export function openLoginPage(): void {
  const webUrl = getWebUrl();
  chrome.tabs.create({ url: `${webUrl}/sign-in?from=extension` });
}

/**
 * Make an authenticated request to the web app API
 * Uses stored Convex auth token or falls back to cookie-based auth
 */
export async function makeAuthenticatedRequest(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const webUrl = getWebUrl();
  
  // Check if this is a request to our web app
  if (url.startsWith(webUrl)) {
    // Try to get stored token
    let token = await getStoredToken();
    
    // If no token, try to fetch it first
    if (!token) {
      console.log("[Auth] No stored token, attempting to fetch from web app");
      
      // First try: fetch from existing tab (if any)
      token = await fetchTokenFromWebApp();
      
      // Second try: refresh token via background tab (this will work even if no tab is open)
      if (!token) {
        console.log("[Auth] Attempting to refresh token via background tab");
        token = await refreshToken();
      }
      
      // If we still don't have a token, the user needs to sign in
      if (!token) {
        console.log("[Auth] Could not fetch token - user needs to sign in");
      }
    }
    
    if (token) {
      const headers = new Headers(options.headers);
      headers.set("Authorization", `Bearer ${token}`);
      console.log("[Auth] Using stored token for request");
      
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: "include",
      });
      
      // If we get a 401, the token might be expired - clear it and try to get a new one
      if (response.status === 401) {
        console.log("[Auth] Got 401 response, clearing expired token");
        await clearToken();
        
        // Try to get a fresh token
        const newToken = await fetchTokenFromWebApp();
        if (newToken) {
          console.log("[Auth] Got fresh token, retrying request");
          headers.set("Authorization", `Bearer ${newToken}`);
          return fetch(url, {
            ...options,
            headers,
            credentials: "include",
          });
        }
      }
      
      return response;
    }
    
    // No token available - return error immediately instead of trying cookie-based auth
    // Cookie-based auth doesn't work when the web app tab is closed
    console.log("[Auth] No token available and couldn't fetch one");
    return new Response(
      JSON.stringify({ 
        error: "Not authenticated", 
        hint: "Please sign in to the web app first. Keep the tab open or sign in again." 
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
  
  // For non-web-app URLs, just do a regular fetch
  return fetch(url, options);
}

/**
 * Listen for auth token from web app
 * The web app can send the token via postMessage when user is on the extension page
 */
export function listenForAuthToken(): void {
  chrome.runtime.onMessageExternal.addListener(
    async (message, sender, sendResponse) => {
      if (message.type === "CONVEX_AUTH_TOKEN") {
        const { token, expiresAt } = message.data;
        await storeToken(token, expiresAt);
        sendResponse({ success: true });
      }
    }
  );
}

/**
 * Fetch token from web app using content script
 * This is more reliable than opening a tab
 */
export async function fetchTokenFromWebApp(): Promise<string | null> {
  const webUrl = getWebUrl();
  console.log("[Auth] fetchTokenFromWebApp called, webUrl:", webUrl);
  
  try {
    // Try to find an existing tab with the web app
    const tabs = await chrome.tabs.query({ url: `${webUrl}/*` });
    console.log("[Auth] Found tabs:", tabs.length);
    
    if (tabs.length > 0) {
      // Use existing tab's content script to get token
      const tabId = tabs[0].id;
      console.log("[Auth] Using tab ID:", tabId, "URL:", tabs[0].url);
      
      if (tabId) {
        try {
          console.log("[Auth] Sending GET_TOKEN message to content script");
          const response = await chrome.tabs.sendMessage(tabId, {
            type: "GET_TOKEN",
          });
          
          console.log("[Auth] Content script response:", response);
          console.log("[Auth] Response type:", typeof response);
          console.log("[Auth] Response success:", response?.success);
          console.log("[Auth] Response data:", response?.data);
          
          if (response && response.success && response.data?.token) {
            const { token, expiresAt } = response.data;
            console.log("[Auth] Storing token, expiresAt:", expiresAt);
            await storeToken(token, expiresAt);
            console.log("[Auth] Token fetched and stored successfully!");
            return token;
          } else if (response?.error) {
            console.log("[Auth] Content script returned error:", response.error);
          } else {
            console.log("[Auth] Unexpected response format:", response);
          }
        } catch (error: any) {
          // Handle "Extension context invalidated" error
          if (error?.message?.includes("Extension context invalidated") || 
              error?.message?.includes("message port closed")) {
            console.log("[Auth] Extension context invalidated - need to reload web page");
            // Try to reload the tab to get fresh content script
            try {
              await chrome.tabs.reload(tabId);
              // Wait a bit for reload, then try again
              await new Promise(resolve => setTimeout(resolve, 2000));
              const retryResponse = await chrome.tabs.sendMessage(tabId, {
                type: "GET_TOKEN",
              });
              if (retryResponse?.success && retryResponse?.data?.token) {
                const { token, expiresAt } = retryResponse.data;
                await storeToken(token, expiresAt);
                console.log("[Auth] Token fetched after tab reload");
                return token;
              }
            } catch (reloadError) {
              console.log("[Auth] Failed to reload tab or retry:", reloadError);
            }
          }
          console.error("[Auth] Failed to get token from existing tab:", error);
          // This might mean the content script isn't loaded yet
        }
      }
    } else {
      console.log("[Auth] No web app tabs found");
    }
    
    // Fallback: try direct fetch (may fail due to CORS/cookies)
    try {
      const response = await fetch(`${webUrl}/api/extension/token`, {
        method: "GET",
        credentials: "include",
      });
      
      // Check if we got HTML instead of JSON (redirected to login)
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        console.log("[Auth] Direct fetch got HTML response - cookies not accessible");
        return null;
      }
      
      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          await storeToken(data.token, data.expiresAt);
          console.log("[Auth] Token fetched via direct request");
          return data.token;
        }
      } else if (response.status === 401) {
        console.log("[Auth] Direct fetch returned 401 - not authenticated");
        return null;
      }
    } catch (error) {
      console.log("[Auth] Direct fetch failed:", error);
      // This is expected when cookies aren't accessible
    }
  } catch (error) {
    console.error("[Auth] Failed to fetch token:", error);
  }
  
  return null;
}

/**
 * Request token refresh from web app
 * Opens a background tab to the web app to refresh the token
 */
export async function refreshToken(): Promise<string | null> {
  const webUrl = getWebUrl();
  
  return new Promise((resolve) => {
    // Open a hidden tab to the web app's token refresh endpoint
    chrome.tabs.create(
      {
        url: `${webUrl}/api/extension/token`,
        active: false,
      },
      (tab) => {
        if (!tab.id) {
          resolve(null);
          return;
        }
        
        const tabId = tab.id;
        let resolved = false;
        
        // Listen for the response
        const listener = async (
          changedTabId: number,
          changeInfo: chrome.tabs.TabChangeInfo
        ) => {
          if (changedTabId === tabId && changeInfo.status === "complete") {
            // Wait a bit for the page to fully load
            setTimeout(async () => {
              if (resolved) return;
              
              try {
                // Execute script to get the token from the page
                const results = await chrome.scripting.executeScript({
                  target: { tabId },
                  func: () => {
                    const data = document.body.innerText;
                    try {
                      return JSON.parse(data);
                    } catch {
                      // Check if it's HTML (login page)
                      if (data.includes("<!DOCTYPE html") || data.includes("<html")) {
                        return { error: "HTML_RESPONSE" };
                      }
                      return null;
                    }
                  },
                });
                
                chrome.tabs.onUpdated.removeListener(listener);
                chrome.tabs.remove(tabId).catch(() => {});
                resolved = true;
                
                if (results?.[0]?.result?.token) {
                  const { token, expiresAt } = results[0].result;
                  await storeToken(token, expiresAt);
                  console.log("[Auth] Token refreshed via background tab");
                  resolve(token);
                } else if (results?.[0]?.result?.error === "HTML_RESPONSE") {
                  console.log("[Auth] Got HTML response from token endpoint - user not authenticated");
                  resolve(null);
                } else {
                  resolve(null);
                }
              } catch (error) {
                console.error("[Auth] Error refreshing token:", error);
                chrome.tabs.onUpdated.removeListener(listener);
                chrome.tabs.remove(tabId).catch(() => {});
                resolved = true;
                resolve(null);
              }
            }, 500);
          }
        };
        
        chrome.tabs.onUpdated.addListener(listener);
        
        // Timeout after 10 seconds
        setTimeout(() => {
          if (!resolved) {
            chrome.tabs.onUpdated.removeListener(listener);
            chrome.tabs.remove(tabId).catch(() => {});
            resolved = true;
            resolve(null);
          }
        }, 10000);
      }
    );
  });
}

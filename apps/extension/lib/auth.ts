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
  
  if (!authData) {
    return null;
  }
  
  // Check if token is expired (with 5 minute buffer)
  if (authData.expiresAt < Date.now() + 5 * 60 * 1000) {
    console.log("[Auth] Token expired or expiring soon");
    return null;
  }
  
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
    const token = await getStoredToken();
    
    if (token) {
      const headers = new Headers(options.headers);
      headers.set("Authorization", `Bearer ${token}`);
      console.log("[Auth] Using stored token for request");
      
      return fetch(url, {
        ...options,
        headers,
        credentials: "include",
      });
    }
    
    // Fall back to cookie-based auth (relies on web app being logged in)
    console.log("[Auth] No token, using cookie-based auth");
    return fetch(url, {
      ...options,
      credentials: "include",
    });
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
 * Request token refresh from web app
 * Opens a background tab to the web app to refresh the token
 */
export async function refreshToken(): Promise<string | null> {
  const webUrl = getWebUrl();
  
  return new Promise((resolve) => {
    // Open a hidden tab to the web app's token refresh endpoint
    chrome.tabs.create(
      {
        url: `${webUrl}/api/auth/extension-token`,
        active: false,
      },
      (tab) => {
        if (!tab.id) {
          resolve(null);
          return;
        }
        
        const tabId = tab.id;
        
        // Listen for the response
        const listener = (
          changedTabId: number,
          changeInfo: chrome.tabs.TabChangeInfo
        ) => {
          if (changedTabId === tabId && changeInfo.status === "complete") {
            // Execute script to get the token from the page
            chrome.scripting.executeScript(
              {
                target: { tabId },
                func: () => {
                  const data = document.body.innerText;
                  try {
                    return JSON.parse(data);
                  } catch {
                    return null;
                  }
                },
              },
              async (results) => {
                chrome.tabs.onUpdated.removeListener(listener);
                chrome.tabs.remove(tabId);
                
                if (results?.[0]?.result?.token) {
                  const { token, expiresAt } = results[0].result;
                  await storeToken(token, expiresAt);
                  resolve(token);
                } else {
                  resolve(null);
                }
              }
            );
          }
        };
        
        chrome.tabs.onUpdated.addListener(listener);
        
        // Timeout after 10 seconds
        setTimeout(() => {
          chrome.tabs.onUpdated.removeListener(listener);
          chrome.tabs.remove(tabId).catch(() => {});
          resolve(null);
        }, 10000);
      }
    );
  });
}

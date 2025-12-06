/**
 * Helper functions for authentication with the web app
 * Uses content script injection to access cookies
 */

import { Storage } from "@plasmohq/storage";
import { getWebUrl } from "./config";

const storage = new Storage();

interface TokenData {
  token: string;
  expiresAt: number;
}

async function findOrCreateWebAppTab(): Promise<number | null> {
  const webUrl = getWebUrl();
  
  try {
    console.log(`[Auth] Looking for web app tab at ${webUrl}`);
    
    // Try to find existing tab with web app
    const tabs = await chrome.tabs.query({ url: `${webUrl}/*` });
    console.log(`[Auth] Found ${tabs.length} existing tabs`);
    
    if (tabs.length > 0 && tabs[0].id) {
      console.log(`[Auth] Using existing tab ${tabs[0].id}`);
      return tabs[0].id;
    }
    
    // Create new tab
    console.log(`[Auth] Creating new tab for ${webUrl}`);
    const tab = await chrome.tabs.create({
      url: webUrl,
      active: false, // Open in background
    });
    
    console.log(`[Auth] Created tab ${tab.id}, waiting for load...`);
    
    // Wait for tab to load
    return new Promise((resolve) => {
      const listener = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
        if (tabId === tab.id) {
          console.log(`[Auth] Tab ${tabId} status: ${changeInfo.status}`);
          if (changeInfo.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
            console.log(`[Auth] Tab ${tabId} loaded successfully`);
            resolve(tab.id || null);
          }
        }
      };
      chrome.tabs.onUpdated.addListener(listener);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        chrome.tabs.onUpdated.removeListener(listener);
        console.warn(`[Auth] Tab load timeout after 10s`);
        resolve(tab.id || null); // Return tab ID anyway, might still work
      }, 10000);
    });
  } catch (error) {
    console.error("[Auth] Failed to find/create web app tab:", error);
    return null;
  }
}

async function sendMessageToWebApp(type: string, data?: any): Promise<any> {
  console.log(`[Auth] ===== sendMessageToWebApp START: ${type} =====`);
  
  const tabId = await findOrCreateWebAppTab();
  if (!tabId) {
    const error = "Could not access web app tab";
    console.error(`[Auth] ${error}`);
    throw new Error(error);
  }
  
  console.log(`[Auth] Sending ${type} to tab ${tabId}`);
  
  // For SAVE_LINK, inject code directly to make the fetch call
  if (type === "SAVE_LINK") {
    return new Promise((resolve, reject) => {
      // First check if tab is accessible
      chrome.tabs.get(tabId, (tab) => {
        if (chrome.runtime.lastError) {
          const error = `Tab error: ${chrome.runtime.lastError.message}`;
          console.error(`[Auth] ${error}`);
          reject(new Error(error));
          return;
        }
        
        console.log(`[Auth] Tab URL: ${tab.url}, Status: ${tab.status}`);
        
        // Verify tab URL matches our web app
        const webUrl = getWebUrl();
        if (!tab.url || !tab.url.startsWith(webUrl)) {
          const error = `Tab URL mismatch. Expected ${webUrl}*, got ${tab.url}`;
          console.error(`[Auth] ${error}`);
          reject(new Error(error));
          return;
        }
        
        // Wait for tab to be ready if it's loading
        if (tab.status === 'loading') {
          console.log(`[Auth] Tab is loading, waiting...`);
          const listener = (updatedTabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
            if (updatedTabId === tabId && changeInfo.status === 'complete') {
              chrome.tabs.onUpdated.removeListener(listener);
              console.log(`[Auth] Tab finished loading`);
              executeSaveScript();
            }
          };
          chrome.tabs.onUpdated.addListener(listener);
          setTimeout(() => {
            chrome.tabs.onUpdated.removeListener(listener);
            console.log(`[Auth] Tab load timeout, trying anyway...`);
            executeSaveScript();
          }, 5000);
        } else {
          executeSaveScript();
        }
        
        function executeSaveScript() {
          console.log(`[Auth] Executing save script in tab ${tabId}`);
          chrome.scripting.executeScript(
            {
              target: { tabId },
              func: async (linkData: any) => {
                console.log('[Injected Script] ===== SCRIPT START =====');
                console.log('[Injected Script] Starting save request:', linkData);
                console.log('[Injected Script] Window origin:', window.location.origin);
                try {
                  const url = window.location.origin + "/api/links/save";
                  console.log('[Injected Script] Fetching:', url);
                  
                  const response = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(linkData),
                  });
                  
                  console.log('[Injected Script] Response status:', response.status);
                  const result = await response.json();
                  console.log('[Injected Script] Response data:', result);
                  console.log('[Injected Script] ===== SCRIPT SUCCESS =====');
                  
                  return { success: response.ok, data: result, status: response.status };
                } catch (error: any) {
                  console.error('[Injected Script] ===== SCRIPT ERROR =====');
                  console.error('[Injected Script] Error:', error);
                  return { success: false, error: error.message };
                }
              },
              args: [data],
            },
            (results) => {
              console.log(`[Auth] Script injection callback called`);
              if (chrome.runtime.lastError) {
                console.error('[Auth] ===== SCRIPT INJECTION ERROR =====');
                console.error('[Auth] Script injection error:', chrome.runtime.lastError);
                reject(new Error(chrome.runtime.lastError.message));
                return;
              }
              console.log('[Auth] Script results:', results);
              if (results && results[0]?.result) {
                console.log('[Auth] ===== sendMessageToWebApp SUCCESS =====');
                resolve(results[0].result);
              } else {
                console.error('[Auth] ===== NO RESULT FROM SCRIPT =====');
                reject(new Error("No result from script"));
              }
            }
          );
        }
      });
    });
  }
  
  // For GET_TOKEN, inject code to get token
  if (type === "GET_TOKEN") {
    return new Promise((resolve, reject) => {
      chrome.scripting.executeScript(
        {
          target: { tabId },
          func: async () => {
            try {
              const response = await fetch(window.location.origin + "/api/extension/token", {
                method: "GET",
                credentials: "include",
              });
              const data = await response.json();
              return { success: true, data };
            } catch (error: any) {
              return { success: false, error: error.message };
            }
          },
        },
        (results) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          if (results && results[0]?.result) {
            resolve(results[0].result);
          } else {
            reject(new Error("No result from script"));
          }
        }
      );
    });
  }
  
  throw new Error(`Unknown message type: ${type}`);
}

async function getOrRefreshToken(): Promise<string | null> {
  try {
    // Check if we have a valid token in storage
    const tokenData = await storage.get<TokenData>("extensionToken");
    
    if (tokenData && tokenData.expiresAt > Date.now() + 60000) {
      // Token is still valid (with 1 minute buffer)
      console.log("Using cached token");
      return tokenData.token;
    }
    
    // Need to get a new token via content script
    console.log("Fetching new token via content script");
    
    const response = await sendMessageToWebApp("GET_TOKEN");
    
    if (!response.success) {
      console.error("Failed to get token:", response.error);
      return null;
    }
    
    const { token, expiresAt } = response.data;
    
    // Store token
    await storage.set("extensionToken", {
      token,
      expiresAt,
    });
    
    console.log("Got new token, expires at:", new Date(expiresAt).toISOString());
    return token;
  } catch (error) {
    console.error("Failed to get token:", error);
    return null;
  }
}

export async function makeAuthenticatedRequest(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const webUrl = getWebUrl();
  
  // Check if this is a request to our web app
  if (url.startsWith(webUrl)) {
    // Try to use content script for direct save (simpler)
    if (url.includes('/api/links/save') && options.method === 'POST') {
      try {
        const body = options.body ? JSON.parse(options.body as string) : {};
        console.log("Saving link via content script:", body);
        const response = await sendMessageToWebApp("SAVE_LINK", body);
        
        if (response.success) {
          console.log("Link saved successfully via content script");
          // Return a Response-like object
          return new Response(JSON.stringify(response.data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }) as any;
        } else {
          console.error("Content script save failed:", response.error);
          return new Response(JSON.stringify({ error: response.error }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }) as any;
        }
      } catch (error) {
        console.error("Content script save failed, falling back to token:", error);
        // Fall through to token-based approach
      }
    }
    
    // Use token-based approach
    const token = await getOrRefreshToken();
    
    const headers = new Headers(options.headers);
    
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
      console.log("Using token for authentication");
    } else {
      console.warn("No token available, request may fail");
    }
    
    return fetch(url, {
      ...options,
      headers,
    });
  }
  
  // For other URLs, just do a regular fetch
  return fetch(url, options);
}

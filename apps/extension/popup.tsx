/// <reference path="./images.d.ts" />
import { useState, useEffect } from "react";
import { useStorage } from "@plasmohq/storage/hook";
import { Storage } from "@plasmohq/storage";
import {
  Plus,
  ExternalLink,
  Check,
  Loader2,
  LogIn,
  BookOpen,
  Trash2,
} from "lucide-react";
import icon from "./assets/tabchat_logo.png";
import { makeAuthenticatedRequest, isAuthenticated, openLoginPage, fetchTokenFromWebApp } from "~/lib/auth";
import { getWebUrl } from "~/lib/config";
import "./style.css";

interface SavedLink {
  url: string;
  title: string;
  favicon?: string;
  savedAt: number;
  status: "pending" | "processing" | "completed" | "failed";
}

function IndexPopup() {
  const [savedLinks, setSavedLinks] = useStorage<SavedLink[]>("savedLinks", []);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [currentTab, setCurrentTab] = useState<chrome.tabs.Tab | null>(null);

  useEffect(() => {
    // Get current tab info
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        setCurrentTab(tabs[0]);
      }
    });

    // Check auth status and try to fetch token if not authenticated
    const checkAuth = async () => {
      const authenticated = await isAuthenticated();
      setIsLoggedIn(authenticated);
      
      // If not authenticated, try to fetch token from web app (user might have signed in)
      if (!authenticated) {
        console.log("[Popup] Not authenticated, attempting to fetch token");
        
        // First try: check if web app tab is open and use content script
        const token = await fetchTokenFromWebApp();
        if (token) {
          console.log("[Popup] Token fetched successfully via content script");
          setIsLoggedIn(true);
          return;
        }
        
        // Second try: open background tab to fetch token (this will have cookie access)
        console.log("[Popup] Content script failed, trying background tab method");
        const { refreshToken } = await import("~/lib/auth");
        const refreshedToken = await refreshToken();
        if (refreshedToken) {
          console.log("[Popup] Token refreshed successfully via background tab");
          setIsLoggedIn(true);
        } else {
          console.log("[Popup] Could not fetch or refresh token - user needs to sign in");
          setIsLoggedIn(false);
        }
      }
    };
    
    checkAuth();
    
    // Listen for token storage changes (when background script fetches token)
    const storage = new Storage();
    storage.watch({
      convexAuthToken: () => {
        checkAuth();
      }
    });
    
    // Also check when popup becomes visible (user might have signed in while popup was closed)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkAuth();
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const isAlreadySaved = savedLinks?.some(
    (link) => link.url === currentTab?.url
  );

  const saveCurrentPage = async (forceSync = false) => {
    if (!currentTab?.url || !currentTab?.title) {
      console.log("[Popup] No current tab or missing URL/title");
      return;
    }

    console.log("[Popup] saveCurrentPage called, forceSync:", forceSync);
    setSaving(true);

    // Add to local storage first for immediate feedback
    if (!isAlreadySaved || forceSync) {
      const newLink: SavedLink = {
        url: currentTab.url,
        title: currentTab.title,
        favicon: currentTab.favIconUrl,
        savedAt: Date.now(),
        status: "pending",
      };

      if (isAlreadySaved && forceSync) {
        setSavedLinks((links) =>
          links?.map((link) =>
            link.url === currentTab.url
              ? { ...link, status: "pending" as const }
              : link
          ) || []
        );
      } else {
        setSavedLinks([newLink, ...(savedLinks || [])]);
      }
    }

    // Sync with backend
    try {
      // Before making the request, ensure we have a token
      const authenticated = await isAuthenticated();
      console.log("[Popup] Auth status before save:", authenticated);
      
      if (!authenticated) {
        console.log("[Popup] Not authenticated before save, attempting to fetch token");
        const { fetchTokenFromWebApp, refreshToken } = await import("~/lib/auth");
        
        console.log("[Popup] Step 1: Trying fetchTokenFromWebApp");
        let token = await fetchTokenFromWebApp();
        console.log("[Popup] fetchTokenFromWebApp returned:", token ? "TOKEN" : "NULL");
        
        if (!token) {
          console.log("[Popup] Step 2: fetchTokenFromWebApp failed, trying refreshToken");
          token = await refreshToken();
          console.log("[Popup] refreshToken returned:", token ? "TOKEN" : "NULL");
        }
        
        // Verify token was actually stored by checking storage
        const verifyAuth = await isAuthenticated();
        console.log("[Popup] Auth verification after token fetch:", verifyAuth);
        
        if (token && verifyAuth) {
          console.log("[Popup] Token obtained and verified successfully, updating UI");
          setIsLoggedIn(true);
        } else {
          console.log("[Popup] All token fetch methods failed or token not stored");
          console.log("[Popup] Token value:", token);
          console.log("[Popup] Auth check:", verifyAuth);
          setIsLoggedIn(false);
          throw new Error(
            `Please sign in to the web app first. Open ${getWebUrl()} and sign in, then try again. Make sure the web app tab is open when signing in.`
          );
        }
      }
      
      // Double-check we have a token before making the request
      const tokenCheck = await isAuthenticated();
      console.log("[Popup] Final auth check before request:", tokenCheck);
      
      if (!tokenCheck) {
        throw new Error(
          `Please sign in to the web app first. Open ${getWebUrl()} and sign in, then try again. Make sure the web app tab is open when signing in.`
        );
      }
      
      const webUrl = getWebUrl();
      console.log("[Popup] Saving link to:", `${webUrl}/api/links/save`);

      const response = await makeAuthenticatedRequest(`${webUrl}/api/links/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: currentTab.url,
          title: currentTab.title,
          favicon: currentTab.favIconUrl,
        }),
      });

      console.log("[Popup] Response status:", response.status);

      // Check content type before parsing
      const contentType = response.headers.get("content-type");
      let result;

      if (contentType && contentType.includes("application/json")) {
        result = await response.json();
      } else {
        const text = await response.text();
        console.error("[Popup] Non-JSON response:", text);
        
        // If we got HTML, it means we're not authenticated
        if (contentType && contentType.includes("text/html")) {
          setIsLoggedIn(false);
          throw new Error(
            `Please sign in to the web app first. Open ${getWebUrl()} and sign in, then try again.`
          );
        }
        
        throw new Error(
          `Server returned ${response.status}: ${text.substring(0, 200)}`
        );
      }

      console.log("[Popup] Save result:", result);

      if (!response.ok) {
        console.error("[Popup] Save link failed:", result);

        if (response.status === 401) {
          // Token expired or invalid - clear it and force re-auth
          const { clearToken } = await import("~/lib/auth");
          await clearToken();
          console.log("[Popup] Cleared expired token, user needs to sign in again");
          
          setIsLoggedIn(false);
          throw new Error(
            result.error ||
              result.hint ||
              `Please sign in to the web app first. Open ${getWebUrl()} and sign in.`
          );
        }
        throw new Error(
          result.error || result.hint || `Failed to save link (${response.status})`
        );
      }

      if (result.success) {
        // Update local link status
        setSavedLinks((links) =>
          links?.map((link) =>
            link.url === currentTab.url
              ? { ...link, status: "completed" as const }
              : link
          ) || []
        );
        setIsLoggedIn(true);
        console.log("[Popup] Link saved successfully!");
      } else {
        throw new Error(result.error || "Save request returned success=false");
      }
    } catch (error: any) {
      console.error("[Popup] Failed to sync link:", error);

      // Update status to failed
      setSavedLinks((links) =>
        links?.map((link) =>
          link.url === currentTab.url
            ? { ...link, status: "failed" as const }
            : link
        ) || []
      );

      // Show error to user
      const errorMsg = `Failed to save link: ${error.message}\n\nMake sure you're logged into ${getWebUrl()}`;
      alert(errorMsg);
    } finally {
      setSaving(false);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    }
  };

  const removeLink = (url: string) => {
    setSavedLinks(savedLinks?.filter((link) => link.url !== url) || []);
  };

  const openDashboard = () => {
    chrome.tabs.create({ url: getWebUrl() });
  };

  const handleLogin = () => {
    openLoginPage();
  };

  return (
    <div className="w-[360px] min-h-[400px] bg-background text-foreground font-sans">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={icon} alt="Logo" className="w-8 h-8 rounded-lg" />
            <span className="font-bold text-lg text-foreground tracking-tight">
              Chat with your tabs
            </span>
          </div>
          {isLoggedIn === false && (
            <button
              onClick={handleLogin}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <LogIn className="w-3 h-3" />
              Sign in
            </button>
          )}
        </div>
      </div>

      {/* Auth warning */}
      {isLoggedIn === false && (
        <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20">
          <p className="text-xs text-amber-600">
            Sign in to sync links to your library
          </p>
        </div>
      )}

      {/* Save current page */}
      {currentTab && (
        <div className="p-4 border-b border-border bg-card/30">
          <div className="flex items-start gap-3">
            {currentTab.favIconUrl ? (
              <img
                src={currentTab.favIconUrl}
                alt=""
                className="w-10 h-10 rounded-lg bg-secondary object-contain p-1 border border-border"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center border border-border">
                <ExternalLink className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-foreground truncate mb-1">
                {currentTab.title}
              </h3>
              <p className="text-xs text-muted-foreground truncate font-mono">
                {currentTab.url}
              </p>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => saveCurrentPage(false)}
              disabled={saving || justSaved}
              className={`flex-1 py-2 px-4 rounded-md font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${
                justSaved
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : isAlreadySaved
                    ? "bg-secondary text-muted-foreground cursor-not-allowed"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : justSaved ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved!
                </>
              ) : isAlreadySaved ? (
                <>
                  <Check className="w-4 h-4" />
                  Already Saved
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Save to chat later
                </>
              )}
            </button>
            {isAlreadySaved && (
              <button
                onClick={() => saveCurrentPage(true)}
                disabled={saving || justSaved}
                className="px-4 py-2 rounded-md font-medium text-sm border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                title="Force sync to Convex"
              >
                Sync
              </button>
            )}
          </div>
        </div>
      )}

      {/* Saved links list */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-foreground">Recent Saves</h3>
          <span className="text-xs text-muted-foreground">
            {savedLinks?.length || 0} links
          </span>
        </div>

        {!savedLinks || savedLinks.length === 0 ? (
          <div className="py-8 text-center border-2 border-dashed border-border rounded-xl bg-muted/20">
            <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center mx-auto mb-3 shadow-sm">
              <BookOpen className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-foreground font-medium mb-1">
              No saved links yet
            </p>
            <p className="text-xs text-muted-foreground">
              Save this page to start learning
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
            {savedLinks.slice(0, 5).map((link) => (
              <div
                key={link.url}
                className="group flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent transition-colors border border-transparent hover:border-border"
              >
                {link.favicon ? (
                  <img
                    src={link.favicon}
                    alt=""
                    className="w-8 h-8 rounded bg-background border border-border object-contain p-0.5"
                  />
                ) : (
                  <div className="w-8 h-8 rounded bg-background border border-border flex items-center justify-center">
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {link.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <StatusBadge status={link.status} />
                    <span className="text-[10px] text-muted-foreground truncate">
                      {new Date(link.savedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => removeLink(link.url)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border bg-card/30 mt-auto">
        <button
          onClick={openDashboard}
          className="w-full py-2.5 rounded-lg border border-input bg-background hover:bg-accent hover:text-accent-foreground text-foreground font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <BookOpen className="w-4 h-4" />
          Open your library
        </button>
      </div>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: "pending" | "processing" | "completed" | "failed";
}) {
  const config = {
    pending: { color: "bg-zinc-500", text: "Pending" },
    processing: { color: "bg-yellow-500", text: "Processing" },
    completed: { color: "bg-green-500", text: "Ready" },
    failed: { color: "bg-red-500", text: "Failed" },
  };

  const { color } = config[status] || config.pending;

  return <div className={`w-2 h-2 rounded-full ${color}`} title={status} />;
}

export default IndexPopup;


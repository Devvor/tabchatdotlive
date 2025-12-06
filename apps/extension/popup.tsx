import { useState, useEffect } from "react";
import { useStorage } from "@plasmohq/storage/hook";
import {
  Sparkles,
  Plus,
  ExternalLink,
  Check,
  Loader2,
  LogIn,
  BookOpen,
  Trash2,
} from "lucide-react";
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
  const [isLoggedIn, setIsLoggedIn] = useStorage<boolean>("isLoggedIn", false);
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
  }, []);

  const isAlreadySaved = savedLinks?.some(
    (link) => link.url === currentTab?.url
  );

  const saveCurrentPage = async () => {
    if (!currentTab?.url || !currentTab?.title) return;

    setSaving(true);

    // Add to local storage
    const newLink: SavedLink = {
      url: currentTab.url,
      title: currentTab.title,
      favicon: currentTab.favIconUrl,
      savedAt: Date.now(),
      status: "pending",
    };

    setSavedLinks([newLink, ...(savedLinks || [])]);

    // Show success animation
    setSaving(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);

    // TODO: Sync with Convex backend
  };

  const removeLink = (url: string) => {
    setSavedLinks(savedLinks?.filter((link) => link.url !== url) || []);
  };

  const openDashboard = () => {
    chrome.tabs.create({ url: process.env.PLASMO_PUBLIC_WEB_URL || "http://localhost:3000" });
  };

  const openLogin = () => {
    chrome.tabs.create({
      url: `${process.env.PLASMO_PUBLIC_WEB_URL || "http://localhost:3000"}/sign-in`,
    });
  };

  return (
    <div className="w-[360px] min-h-[400px] bg-background text-foreground">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Learnor
            </span>
          </div>
          <button
            onClick={openDashboard}
            className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Open App
          </button>
        </div>
      </div>

      {/* Save current page */}
      {currentTab && (
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-start gap-3">
            {currentTab.favIconUrl ? (
              <img
                src={currentTab.favIconUrl}
                alt=""
                className="w-10 h-10 rounded-lg bg-zinc-800"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                <ExternalLink className="w-5 h-5 text-zinc-500" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-zinc-100 truncate mb-1">
                {currentTab.title}
              </h3>
              <p className="text-xs text-zinc-500 truncate">
                {currentTab.url}
              </p>
            </div>
          </div>

          <button
            onClick={saveCurrentPage}
            disabled={saving || isAlreadySaved || justSaved}
            className={`mt-4 w-full py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${
              justSaved
                ? "bg-green-600 text-white"
                : isAlreadySaved
                  ? "bg-zinc-800 text-zinc-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/25"
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
                Save to Learn
              </>
            )}
          </button>
        </div>
      )}

      {/* Saved links list */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-zinc-300">Recent Saves</h3>
          <span className="text-xs text-zinc-500">
            {savedLinks?.length || 0} links
          </span>
        </div>

        {!savedLinks || savedLinks.length === 0 ? (
          <div className="py-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center mx-auto mb-3">
              <BookOpen className="w-6 h-6 text-zinc-500" />
            </div>
            <p className="text-sm text-zinc-400 mb-1">No saved links yet</p>
            <p className="text-xs text-zinc-500">
              Save this page to start learning
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {savedLinks.slice(0, 5).map((link) => (
              <div
                key={link.url}
                className="group flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/50 transition-colors"
              >
                {link.favicon ? (
                  <img
                    src={link.favicon}
                    alt=""
                    className="w-6 h-6 rounded bg-zinc-800"
                  />
                ) : (
                  <div className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center">
                    <ExternalLink className="w-3 h-3 text-zinc-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-zinc-200 truncate">
                    {link.title}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <StatusBadge status={link.status} />
                  <button
                    onClick={() => removeLink(link.url)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-zinc-700 text-zinc-500 hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-zinc-800">
        <button
          onClick={openDashboard}
          className="w-full py-2.5 rounded-xl border border-zinc-700 text-zinc-300 font-medium text-sm hover:bg-zinc-800/50 transition-all flex items-center justify-center gap-2"
        >
          <BookOpen className="w-4 h-4" />
          Open Learning Dashboard
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
    pending: { color: "bg-zinc-600", text: "Pending" },
    processing: { color: "bg-yellow-600", text: "Processing" },
    completed: { color: "bg-green-600", text: "Ready" },
    failed: { color: "bg-red-600", text: "Failed" },
  };

  const { color } = config[status];

  return <div className={`w-2 h-2 rounded-full ${color}`} />;
}

export default IndexPopup;


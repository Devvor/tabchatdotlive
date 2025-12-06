import { Storage } from "@plasmohq/storage";

const storage = new Storage();

// Update badge with saved links count
async function updateBadge() {
  const savedLinks = await storage.get<any[]>("savedLinks");
  const count = savedLinks?.length || 0;

  chrome.action.setBadgeText({
    text: count > 0 ? String(count) : "",
  });
  chrome.action.setBadgeBackgroundColor({
    color: "#8b5cf6",
  });
}

// Listen for storage changes
storage.watch({
  savedLinks: () => {
    updateBadge();
  },
});

// Initialize badge on extension load
updateBadge();

// Handle messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SAVE_LINK") {
    // Handle save link from context menu or keyboard shortcut
    handleSaveLink(message.data);
    sendResponse({ success: true });
  }
  return true;
});

async function handleSaveLink(data: { url: string; title: string; favicon?: string }) {
  const savedLinks = (await storage.get<any[]>("savedLinks")) || [];

  // Check if already saved
  if (savedLinks.some((link) => link.url === data.url)) {
    return;
  }

  const newLink = {
    url: data.url,
    title: data.title,
    favicon: data.favicon,
    savedAt: Date.now(),
    status: "pending" as const,
  };

  await storage.set("savedLinks", [newLink, ...savedLinks]);
}

// Create context menu item
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "save-to-learnor",
    title: "Save to Learnor",
    contexts: ["page", "link"],
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "save-to-learnor" && tab) {
    const url = info.linkUrl || info.pageUrl;
    if (url) {
      handleSaveLink({
        url,
        title: tab.title || url,
        favicon: tab.favIconUrl,
      });
    }
  }
});

// Keyboard shortcut handler
chrome.commands.onCommand.addListener((command) => {
  if (command === "save-current-page") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url && tabs[0]?.title) {
        handleSaveLink({
          url: tabs[0].url,
          title: tabs[0].title,
          favicon: tabs[0].favIconUrl,
        });
      }
    });
  }
});

export {};


import { Storage } from "@plasmohq/storage";
import { makeAuthenticatedRequest, isAuthenticated } from "./lib/auth";
import { getWebUrl } from "./lib/config";

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
    handleSaveLink(message.data)
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error("Failed to save link:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep message channel open for async response
  }

  if (message.type === "CHECK_AUTH") {
    isAuthenticated()
      .then((authenticated) => {
        sendResponse({ authenticated });
      })
      .catch((error) => {
        sendResponse({ authenticated: false, error: error.message });
      });
    return true;
  }

  return false;
});

async function handleSaveLink(data: {
  url: string;
  title: string;
  favicon?: string;
}) {
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

  // Sync with Convex backend
  try {
    const webUrl = getWebUrl();
    console.log(
      "Background: Attempting to save link to:",
      `${webUrl}/api/links/save`
    );

    const response = await makeAuthenticatedRequest(`${webUrl}/api/links/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: data.url,
        title: data.title,
        favicon: data.favicon,
      }),
    });

    console.log("Background: Response status:", response.status);

    if (response.ok) {
      const result = await response.json();
      console.log("Background: Save successful:", result);
      if (result.success) {
        // Update local link status
        const updatedLinks = (await storage.get<any[]>("savedLinks")) || [];
        const finalLinks = updatedLinks.map((link) =>
          link.url === data.url
            ? { ...link, status: "completed" as const }
            : link
        );
        await storage.set("savedLinks", finalLinks);
      }
    } else {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      console.error("Background: Save failed:", errorData);

      if (response.status === 401) {
        // User not authenticated - mark as pending (user can login via popup)
        console.log("User not authenticated - link saved locally only");
      } else {
        // Update status to failed for other errors
        const updatedLinks = (await storage.get<any[]>("savedLinks")) || [];
        const finalLinks = updatedLinks.map((link) =>
          link.url === data.url ? { ...link, status: "failed" as const } : link
        );
        await storage.set("savedLinks", finalLinks);
      }
    }
  } catch (error) {
    console.error("Background: Failed to sync link to Convex:", error);
    // Update status to failed
    const updatedLinks = (await storage.get<any[]>("savedLinks")) || [];
    const finalLinks = updatedLinks.map((link) =>
      link.url === data.url ? { ...link, status: "failed" as const } : link
    );
    await storage.set("savedLinks", finalLinks);
  }
}

// Create context menu item
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "save-to-tabchat",
    title: "Save to TabChat",
    contexts: ["page", "link"],
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "save-to-tabchat" && tab) {
    const url = info.linkUrl || info.pageUrl;
    if (url) {
      try {
        await handleSaveLink({
          url,
          title: tab.title || url,
          favicon: tab.favIconUrl,
        });
      } catch (error) {
        console.error("Failed to save link from context menu:", error);
      }
    }
  }
});

// Keyboard shortcut handler
chrome.commands.onCommand.addListener((command) => {
  if (command === "save-current-page") {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs[0]?.url && tabs[0]?.title) {
        try {
          await handleSaveLink({
            url: tabs[0].url,
            title: tabs[0].title,
            favicon: tabs[0].favIconUrl,
          });
        } catch (error) {
          console.error("Failed to save link from keyboard shortcut:", error);
        }
      }
    });
  }
});

export {};

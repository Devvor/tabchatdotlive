/**
 * Configuration for the extension
 * Centralizes web URL configuration for both development and production
 */

/**
 * Get the web app URL
 * Defaults to production URL (https://tabchat.live) unless overridden by environment variable
 */
export function getWebUrl(): string {
  // Allow override via environment variable for local development
  if (process.env.PLASMO_PUBLIC_WEB_URL) {
    return process.env.PLASMO_PUBLIC_WEB_URL;
  }
  
  // Default to production URL
  return "https://tabchat.live";
}


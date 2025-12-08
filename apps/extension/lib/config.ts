/**
 * Configuration for the extension
 * Centralizes web URL configuration for both development and production
 */

/**
 * Get the web app URL
 * Defaults to production URL (https://tabchat.live) unless overridden by environment variable
 * In development mode, tries to detect localhost automatically
 */
export function getWebUrl(): string {
  // Allow override via environment variable for local development
  if (process.env.PLASMO_PUBLIC_WEB_URL) {
    return process.env.PLASMO_PUBLIC_WEB_URL;
  }
  
  // In development mode (when running plasmo dev), default to localhost
  // This makes local development easier without requiring .env file
  if (process.env.NODE_ENV === "development" || process.env.PLASMO_ENV === "development") {
    return "http://localhost:3000";
  }
  
  // Default to production URL
  return "https://tabchat.live";
}


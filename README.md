# TabChat - Chat with your tabs

## Problem Statement

Chances are you have 30+ tabs left opened you wanted to read but just haven't done it. You could summarize it but even then it's still too long to read. It's great content but where do we find the best time and mental bandwidth to consume them.

Introducing TabChat, simply one click save from your browser extension, then have a voice chat with it while you're on the move. And if you don't want a voice chat? Just hit TLDR and you get your fix.

## Features

- 🔗 **Browser Extension** - Save any webpage with one click
- 🎙️ **Real-time Voice Chat** - Have natural voice conversations with your AI teacher
- 📚 **Content Processing** - Automatically extracts key information curated for you
- 📱 **Mobile Optimized** - Learn on the go, even while driving

## 🎬 Demo

**[▶️ WATCH DEMO](https://youtube.com/shorts/XD0NYJOMEOA?feature=share)**

> **Note:** Demo video includes all features as of October 5th, 2025

## Installation

### Install the Chrome Extension

1. **Download the extension zip file**: [Download `chrome-mv3-prod.zip`](https://github.com/Devvor/tabchatdotlive/releases/latest/download/chrome-mv3-prod.zip) from the [latest release](https://github.com/Devvor/tabchatdotlive/releases/latest)

2. **Extract the zip file**: Unzip the downloaded file to a location on your computer

3. **Load the extension in Chrome**:
   - Open Chrome and navigate to `chrome://extensions`
   - Enable "Developer mode" (toggle in the top right corner)
   - Click "Load unpacked"
   - Select the extracted folder

The TabChat extension is now installed and ready to use!

## How to use

1. **Save a link**: Use the browser extension to save any webpage
2. **Start learning**: Open the web app and start a voice conversation
3. **Ask questions**: Speak naturally to your AI teacher about the topic

## Project Architecture

```
tabchatdotlive/
├── apps/
│   ├── web/                    # Next.js web application
│   │   ├── app/                # App router pages
│   │   ├── components/
│   │   │   ├── ui/             # shadcn/ui components
│   │   │   └── voice-chat/     # Voice chat components
│   │   ├── hooks/              # Custom React hooks
│   │   └── lib/                # Utilities and API clients
│   └── extension/              # Browser extension (Plasmo)
├── packages/
│   ├── convex/                 # Convex backend (shared)
│   └── config/                 # Shared configs
├── turbo.json
└── package.json
```

### Project Components

- **Web App** (`apps/web`): Next.js application with shadcn/ui components and voice chat interface
- **Extension** (`apps/extension`): Plasmo-based browser extension for saving links
- **Convex** (`packages/convex`): Shared backend schema and functions

## Tech Stack

- **Monorepo**: Turborepo
- **Browser Extension**: Plasmo (Manifest V3)
- **Web App**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI + Tailwind)
- **Backend/Database**: Convex
- **Authentication**: Clerk
- **Content Scraping**: Firecrawl API
- **Real-time Voice**: ElevenLabs Conversational AI
- **Deployment**: Vercel

## License

MIT License - see [LICENSE](LICENSE) for details.

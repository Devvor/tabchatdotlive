# TabChat - Chat with your tabs

Turn any webpage into an AI teacher. Save links and learn through real-time voice conversations.

## Features

- 🔗 **Browser Extension** - Save any webpage with one click
- 🎙️ **Real-time Voice Chat** - Have natural voice conversations with your AI teacher
- 📚 **Content Processing** - Automatically extracts and understands webpage content
- 💬 **Conversation History** - Review and continue past learning sessions
- 📱 **Mobile Optimized** - Learn on the go, even while driving

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

## Project Structure

### Install the Chrome Extension

1. **Download or clone the repository**:
   ```bash
   git clone https://github.com/yourusername/tabchatdotlive.git
   cd tabchatdotlive
   ```

2. **Build the extension**:
   ```bash
   npm install
   npm run build:extension
   ```

3. **Load the extension in Chrome**:
   - Open Chrome and navigate to `chrome://extensions`
   - Enable "Developer mode" (toggle in the top right corner)
   - Click "Load unpacked"
   - Select the folder: `apps/extension/build/chrome-mv3-prod`

The TabChat extension is now installed and ready to use!

## How to use

1. **Save a link**: Use the browser extension to save any webpage
2. **Process content**: The app automatically extracts key information
3. **Start learning**: Open the web app and start a voice conversation
4. **Ask questions**: Speak naturally to your AI teacher about the topic
5. **Review later**: Access conversation history to continue learning

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

## License

MIT License - see [LICENSE](LICENSE) for details.

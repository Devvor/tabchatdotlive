# Learnor - AI Teachers from Your Links

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

```
learnor/
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

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Accounts/API keys for:
  - [Clerk](https://clerk.com) - Authentication
  - [Convex](https://convex.dev) - Database
  - [ElevenLabs](https://elevenlabs.io) - Voice AI
  - [Firecrawl](https://firecrawl.dev) - Web scraping

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/learnor.git
cd learnor
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
# Copy the example env file
cp apps/web/env.example apps/web/.env.local
```

Fill in your API keys:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key  # Use pk_live_ for production
CLERK_SECRET_KEY=sk_test_your_key                    # Use sk_live_ for production
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret
# Optional: Only set if using a custom Clerk domain (e.g., clerk.yourdomain.com)
# NEXT_PUBLIC_CLERK_DOMAIN=clerk.yourdomain.com

# Convex
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
CONVEX_DEPLOY_KEY=your_deploy_key

# ElevenLabs
ELEVENLABS_API_KEY=your_elevenlabs_api_key
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_agent_id

# Firecrawl
FIRECRAWL_API_KEY=fc-your_firecrawl_key
```

4. Initialize Convex:

```bash
cd packages/convex
npx convex dev
```

5. Run the development server:

```bash
# From root directory
npm run dev
```

The web app will be available at `http://localhost:3000`.

### Adding shadcn/ui Components

The project uses shadcn/ui. To add new components:

```bash
cd apps/web
npx shadcn@latest add [component-name]
```

### Building the Extension

```bash
npm run build:extension
```

The built extension will be in `apps/extension/build/chrome-mv3-dev`.

To load in Chrome:
1. Go to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `build/chrome-mv3-dev` folder

## ElevenLabs Setup

1. Create an account at [ElevenLabs](https://elevenlabs.io)
2. Go to the Conversational AI section
3. Create a new Agent with your desired voice and personality
4. Copy the Agent ID to your environment variables

## Usage

1. **Save a link**: Use the browser extension to save any webpage
2. **Process content**: The app automatically extracts key information
3. **Start learning**: Open the web app and start a voice conversation
4. **Ask questions**: Speak naturally to your AI teacher about the topic
5. **Review later**: Access conversation history to continue learning

## Development

### Available Scripts

```bash
# Development
npm run dev           # Run all apps in development mode
npm run dev:web       # Run web app only
npm run dev:extension # Run extension only

# Building
npm run build         # Build all apps
npm run build:web     # Build web app
npm run build:extension # Build extension

# Linting
npm run lint          # Lint all packages
```

### Project Architecture

- **Web App** (`apps/web`): Next.js application with shadcn/ui components and voice chat interface
- **Extension** (`apps/extension`): Plasmo-based browser extension for saving links
- **Convex** (`packages/convex`): Shared backend schema and functions

## Troubleshooting

### Clerk Authentication Issues in Production

If you're experiencing authentication issues in production (e.g., `ERR_SSL_VERSION_OR_CIPHER_MISMATCH` errors):

1. **Verify Production API Keys**: Ensure you're using production keys (`pk_live_` and `sk_live_`) in your production environment variables, not test keys.

2. **Check Custom Domain Configuration**: 
   - If you see errors referencing `clerk.yourdomain.com`, you may have a custom Clerk domain configured
   - Option A: Remove the custom domain from your Clerk Dashboard → Domains (if not needed)
   - Option B: Properly configure the custom domain:
     - Set up DNS records as shown in Clerk Dashboard → Domains
     - Wait for SSL certificate to be issued (can take up to 48 hours)
     - Set `NEXT_PUBLIC_CLERK_DOMAIN=clerk.yourdomain.com` in your environment variables

3. **Verify Environment Variables**: Ensure all Clerk environment variables are set in your hosting provider (Vercel, etc.):
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `CLERK_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_CLERK_DOMAIN` (only if using custom domain)

4. **Check Clerk Status**: Visit [Clerk's status page](https://status.clerk.com/) to check for service outages

5. **Review Application Logs**: Check your hosting provider's logs for specific error messages

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

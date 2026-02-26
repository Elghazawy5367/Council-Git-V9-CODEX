# The Council - AI Orchestration Platform

## Overview

The Council is a React + TypeScript AI orchestration application that queries multiple AI models via OpenRouter and synthesizes their outputs into unified insights. Built as a zero-infrastructure-cost platform for a solo founder, it combines multi-AI synthesis with GitHub intelligence tools for market opportunity discovery.

**Core Capabilities:**
- Multi-AI model querying through OpenRouter API
- Synthesis of multiple AI expert perspectives into actionable insights
- GitHub intelligence extraction (Scout, Goldmine Detector, Mining Drill)
- Reddit/HackerNews community intelligence for buying intent detection
- Automated workflows via GitHub Actions ("The Phantom")

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Stack
- **Framework:** React 18 with TypeScript 5.8, bundled with Vite 6
- **UI Components:** Radix UI primitives + shadcn/ui + Tailwind CSS
- **State Management:** Zustand stores organized by feature
- **Routing:** React Router v6
- **Data Fetching:** TanStack React Query for server state

### Feature-Based Organization
The codebase follows a feature-first architecture pattern:
```
src/
├── features/
│   ├── council/          # Core AI orchestration
│   │   ├── api/          # OpenRouter integration
│   │   ├── components/   # ExpertCard, SynthesisCard, ControlPanel
│   │   ├── hooks/        # useExecuteSynthesis, useStreamingSynthesis
│   │   ├── lib/          # types, synthesis logic, persona library
│   │   └── store/        # Zustand stores (expert, execution, memory)
│   ├── settings/         # API key management
│   └── automation/       # Dashboard components
├── lib/
│   ├── scout.ts          # GitHub intelligence extraction
│   ├── goldmine-detector.ts  # Abandoned project finder
│   ├── mining-drill.ts   # Pain point extraction from issues
│   ├── reddit-sniper.ts  # Reddit buying intent detection
│   └── api-client.ts     # HTTP client with retry/cache
└── pages/                # Route components
```

### State Management Pattern
Each feature uses Zustand with a consistent pattern - stores are co-located within feature directories and use `zustand/react/shallow` for optimized re-renders.

### AI Integration
- **Provider:** OpenRouter API (single key for all models)
- **Models:** Configurable fleet of models (referenced as MAGNIFICENT_7_FLEET)
- **Synthesis Modes:** parallel, consensus, adversarial, sequential execution
- **Persona System:** Customizable AI expert personas with specialized prompts

### Data Storage
- **Primary:** Dexie (IndexedDB wrapper) for client-side persistence
- **Secondary:** idb-keyval for key-value storage
- **No backend database** - designed for zero infrastructure costs

### Error Handling
- Custom error classes (APIError, NetworkError, TimeoutError, RateLimitError)
- React Error Boundaries with feature isolation
- Recovery strategies: retry with exponential backoff, fallback patterns, circuit breaker

### Intelligence Tools
1. **Scout** - GitHub repository scanning for opportunities
2. **Goldmine Detector** - Filters abandoned high-potential projects
3. **Mining Drill** - Extracts pain points from GitHub issues
4. **Reddit Sniper** - Detects buying intent in Reddit posts
5. **Daily Brief** - Combines all tools into actionable reports

## External Dependencies

### AI Services
- **OpenRouter API** - Primary AI gateway (requires OPENROUTER_API_KEY)
- **Google AI Studio** - Fallback for unlimited AI access (manual integration)

### GitHub Integration
- **GitHub API** - Repository intelligence extraction
- **GitHub Actions** - Automated workflows (daily-scout.yml, reddit-radar.yml)
- **GITHUB_TOKEN** - Auto-provided by Actions, or personal token for private repos

### Reddit Integration
- Uses public JSON endpoints (no API key required for basic scraping)
- Optional OAuth for higher rate limits (REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET)

### HackerNews Integration
- **Algolia Search API** - Free, no authentication required
- Public API key: `8ece23f8eb07cd25d40262a1764599b1`

### Deployment Targets
- **GitHub Pages** - Primary deployment (`gh-pages -d dist`)
- **Firebase Hosting** - Alternative (`firebase deploy`)
- **Vercel** - Alternative (`vercel --prod`)

### UI Libraries
- @radix-ui/* - Accessible component primitives
- @tanstack/react-query - Server state management
- lucide-react - Icon library
- recharts - Data visualization
- cmdk - Command palette
- zod - Runtime validation
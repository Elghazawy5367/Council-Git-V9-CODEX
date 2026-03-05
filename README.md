 🧠 Council-Git-Pro

![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.4-646CFF?logo=vite&logoColor=white)
![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

> **Multi-perspective AI intelligence and decision engine for autonomous market opportunity discovery**

Transform market intelligence into competitive advantage through surgical precision analysis.

---

## 📋 Overview

Council-Git-Pro is a professional-grade intelligence and decision-making platform that combines AI experts with automated market research to identify lucrative business opportunities in overlooked niches.

The system operates on a **two-phase intelligence workflow**: parallel expert analysis followed by strategic synthesis by "The Ruthless Judge." Multiple specialized AI personas collaborate to analyze GitHub repositories, Reddit discussions, and emerging trends—scrutinizing every opportunity from technical feasibility, market demand, competition, and solo-founder fit before delivering actionable verdicts.

**Perfect for:** Entrepreneurs identifying underserved markets, SaaS founders discovering pain points, and developers finding monetization opportunities in abandoned open-source projects.

---

## ✨ Key Features

### 🧠 The Council of Experts
- **Multi-Expert Deliberation**: 7 specialized AI personas analyze opportunities from different angles
  - 📊 Data Analyst | 🎯 Market Researcher | 📈 Product Strategist  
  - 💰 Financial Analyst | 🔍 Competitive Analyst | ⚠️ Risk Assessor | 🛍️ Sales Expert
- **Flexible Execution Modes**:
  - **Parallel** 🚀 - Fast independent assessments
  - **Sequential** 📝 - Iterative building on insights
  - **Adversarial** ⚔️ - Debate and challenge conclusions
  - **Consensus** 🤝 - Find common ground
- **Ruthless Judge Synthesis**: Final decision-making engine with 3-tier analysis (Quick ⚡ | Balanced 🎯 | Deep 🔍)
- **Conversation Context**: Experts reference previous responses in iterative analysis

### 🔍 Intelligence Gathering
- **GitHub Scout** - Scans for abandoned high-potential projects using Blue Ocean detection algorithms
- **Goldmine Detector** - Filters for high-demand/low-competition opportunities with revenue estimation
- **Mining Drill** - Extracts pain points and buying intent signals from GitHub issues (28+ pain keywords, 15+ intent phrases)
- **Reddit Sniper** - Detects buying intent and pain signals across 5+ niches in real-time
- **Viral Radar** - Identifies emerging trends before mainstream adoption
- **Market Gap Identifier** - Cross-references GitHub and Reddit data to find underserved markets
- **Stargazer Intelligence** - Analyzes institutional backing and quality signals

### 📊 Multi-Niche Configuration
- Monitor 5+ target niches simultaneously via `config/target-niches.yaml`
- Niche-specific keywords, subreddits, and GitHub topics
- Automatic report generation with unified intelligence framework

### 🚀 Automated Workflows
- **GitHub Actions Integration**: Scheduled workflows (daily/weekly)
- **Parallel Execution**: Multiple tools run concurrently
- **Error Isolation**: Failures in one feature don't block others
- **Progress Tracking**: Real-time feedback on intelligence gathering

### 💾 Data Persistence & Reporting
- **Dual Output Formats**: Markdown (human-readable) + JSON (programmatic)
- **Report Management**: Search, filter, archive, and analyze historical intelligence
- **Retention Policies**: Automatic cleanup based on configurable retention days

---

## 🏗 Architecture

### System Flow

```
┌─────────────────────────────────────────────────────────┐
│          User Input (Text, Files, Configuration)        │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Intelligence Gathering Layer               │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Scout │ Mining Drill │ Goldmine │ Reddit Sniper   │  │
│  │ Viral Radar │ Market Gap │ HackerNews │ Stargazer │  │
│  └───────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│         Ruthless Judge (Report Validation)              │
│    3-Tier Analysis: Quick ⚡ | Balanced 🎯 | Deep 🔍    │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│     Phase 1: Council of Experts (Parallel Analysis)    │
│                                                         │
│  Data Analyst │ Market Researcher │ Product Strategist │
│  Financial │ Competitive │ Risk │ Sales (7 personas)  │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│        Phase 2: Synthesis & Decision-Making            │
│  Synthesize → Weigh → Decide → Actionable Verdict      │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│     Output: Markdown Report + JSON Data + Verdict      │
└─────────────────────────────────────────────────────────┘
```

### Tech Stack
- **Frontend**: React 18.3 + TypeScript 5.8 + Vite 6.4 (SWC)
- **State Management**: Zustand with persistence middleware
- **Storage**: IndexedDB (via dexie)
- **Styling**: Tailwind CSS + shadcn-ui components
- **AI Integration**: OpenRouter API (100+ models)
- **Automation**: GitHub Actions + Custom schedulers
- **APIs**: GitHub REST API v3, Reddit public JSON, HackerNews Algolia

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ ([install with nvm](https://github.com/nvm-sh/nvm))
- **npm** or **yarn** package manager
- **GitHub Token** (optional but recommended for enhanced API limits)
- **OpenRouter API Key** (required for Council features)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Elghazawy5367/Council-Git-V9.git
cd Council-Git-V9

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Create environment configuration
cp .env.example .env.local
```

### Configuration

Edit `.env.local` with your API keys:

```dotenv
# Required: OpenRouter API key for Council features
VITE_OPENROUTER_API_KEY=your_openrouter_key_here

# Recommended: GitHub token for higher API limits (5000/hour vs 60/hour)
GITHUB_TOKEN=ghp_your_github_token_here

# Optional: For enhanced Reddit/Google features
REDDIT_API_KEY=your_reddit_key
SERPER_API_KEY=your_serper_key
```

**Target Niches**: Configure in `config/target-niches.yaml`:

```yaml
niches:
  - id: "neurodivergent-products"
    name: "Neurodivergent-Focused Digital Products"
    enabled: true
    monitoring:
      keywords: ["adhd productivity", "executive function"]
      subreddits: ["r/ADHD", "r/autism"]
      github_topics: ["productivity", "neurodiversity"]
```

### Running Locally

```bash
# Start development server with hot reload
npm run dev

# Access the app at http://localhost:5173
```

---

## 📊 Intelligence Features (Reference)

| Feature | Category | Data Source | Core Output |
|---------|----------|-------------|-------------|
| **Scout** | Gathering | GitHub API | Blue Ocean Opportunities |
| **Reddit Sniper** | Gathering | Reddit API | High-Intent Buying Signals |
| **HackerNews Intel** | Gathering | Algolia HN API | Tech Trends & Pain Points |
| **Mining Drill** | Analysis | GitHub Issues | Raw Frustration Extraction |
| **Goldmine Detector** | Analysis | GitHub Repos | Abandoned High-Value Projects |
| **Market Gap ID** | Analysis | Internal Reports | Underserved Market Synthesis |
| **Ruthless Judge** | Decision | Expert Outputs | Integrated Actionable Verdicts |

### Quick Command Reference

```bash
# Generate daily intelligence brief for a niche
npm run brief developer-tools
npm run brief react-native

# Run individual intelligence tools
npm run scout                # GitHub opportunity detection
npm run goldmine            # High-ROI project filtering
npm run mining-drill        # Pain point extraction
npm run reddit-sniper       # Buying intent detection
npm run viral-radar         # Trend detection
npm run market-gaps         # Market gap identification
npm run quality-pipeline    # Filter top 10% signals
```

---

## 📁 Project Structure

```
Council-Git-V9/
├── config/                # Multi-niche YAML configurations
│   └── target-niches.yaml
├── data/                  # Intelligence storage
│   ├── reports/          # Daily feature-specific markdown reports
│   └── intelligence/     # Synthesized market gap reports
├── scripts/              # CLI utilities
│   ├── daily-brief.ts
│   └── quality-pipeline.ts
├── src/
│   ├── features/
│   │   ├── council/      # Core AI orchestration
│   │   ├── automation/   # Intelligence gathering dashboard
│   │   ├── settings/     # API key management
│   │   └── dashboard/    # Main UI
│   ├── lib/              # Core algorithms
│   │   ├── scout.ts
│   │   ├── synthesis-engine.ts
│   │   └── types.ts
│   ├── services/         # API services
│   └── stores/           # Zustand global state
├── .github/workflows/    # GitHub Actions (20+ workflows)
└── docs/                 # Comprehensive documentation
```

---

## 🔐 Environment & Configuration

### Required APIs

| API | Purpose | Limit | Cost |
|-----|---------|-------|------|
| **OpenRouter** | AI expert models | Varies by model | $0.50-$3/1M tokens |
| **GitHub** | Repository scanning | 60-5000/hour | Free with token |
| **Reddit** | Pain signal detection | ~1800/minute | Free (no auth) |
| **HackerNews** | Trend detection | Unlimited | Free (public) |

---

## 🐛 Troubleshooting

### Build Issues
```bash
# Clear cache and rebuild
npm run clean
npm run build

# Type checking
npm run type-check

# Validate architecture
npm run validate-architecture
```

### API Issues
- **GitHub rate limited?** → Add `GITHUB_TOKEN` to `.env.local`
- **OpenRouter quota?** → Check API key validity and account balance
- **Reddit timeouts?** → Check subreddit names and internet connection

### Intelligence Tools Failing
```bash
# Enable debug logging
DEBUG=* npm run [feature]

# Test individual components
npm run type-check
npm run build
```

---

## 🤝 Contributing

### Code Quality Requirements
- ✅ **TypeScript strict mode** (no `any` types)
- ✅ **Error handling** (try/catch with logging)
- ✅ **Type safety** (explicit types on all exports)
- ✅ **No circular dependencies** (validated by script)

### Architecture Rule
Features must not import directly from other features. Use shared libraries in `src/lib/` or global stores in `src/stores/`.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔗 Resources & Documentation

### Quick Start Guides
- **[Daily Intelligence Report Guide](docs/DAILY_INTELLIGENCE_REPORT.md)** - Detailed walkthrough
- **[Onboarding Guide](docs/ONBOARDING.md)** - New user orientation
- **[Architecture Update](docs/ARCHITECTURE_UPDATE.md)** - System design overview

### Feature Documentation
- **[Scout Documentation](docs/SCOUT.md)** - Blue Ocean detection
- **[Goldmine Detector](docs/GOLDMINE-DETECTOR.md)** - Opportunity filtering
- **[Mining Drill](docs/guides/mining-drill.md)** - Pain point extraction
- **[Reddit Sniper](docs/REDDIT-SNIPER.md)** - Intent detection

### Advanced Guides
- **[Store Refactoring Guide](docs/STORE_REFACTORING_GUIDE.md)** - State management
- **[Deep Logic Analysis](docs/DEEP_LOGIC_ANALYSIS.md)** - Architecture deep dive
- **[Features Automation](src/features/automation/README.md)** - Scheduling

---

## 🎯 Roadmap

### Near-Term (Q1 2026)
- ✅ Multi-niche configuration system
- ✅ Daily intelligence automation
- ⏳ Real-time HackerNews integration
- ⏳ Email report delivery

### Medium-Term (Q2 2026)
- ⏳ Semantic memory system (embeddings)
- ⏳ Long-term/short-term memory distinction
- ⏳ Custom expert persona creation

### Long-Term (Q3+ 2026)
- ⏳ Collaborative intelligence (multi-user)
- ⏳ Private deployment options
- ⏳ API for third-party integration
- ⏳ Mobile applications

---

## 📞 Support

For questions, issues, or suggestions:
1. **Check documentation** in `docs/` directory
2. **Search existing issues** on GitHub
3. **Open new issue** with detailed description
4. **Start discussion** in GitHub Discussions

---

**Built with ❤️ by the Council**  
*Transform market intelligence into competitive advantage*
```

---



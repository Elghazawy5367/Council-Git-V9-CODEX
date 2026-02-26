# Enhanced LLMResponseCard Component

## Overview

The enhanced LLMResponseCard component brings professional AI chat interface patterns inspired by:
- **Vercel AI SDK** - Streaming text with typewriter effect
- **OpenAI Playground** - Code blocks with copy buttons and syntax highlighting
- **ChatGPT** - Professional UI/UX patterns

## Features

### 1. ✨ Streaming Text with Typewriter Effect

Simulates real-time text generation with smooth character-by-character animation:

```typescript
<LLMResponseCard
  response={response}
  streaming={true}
  streamingSpeed={3} // Characters per frame (default: 3)
/>
```

**How it works:**
- `useTypewriter` hook manages the animation
- ~60fps animation speed for smooth display
- Blinking cursor indicator during streaming
- "Streaming..." badge with spinner icon
- Configurable speed (characters per chunk)

### 2. 🎨 Syntax-Highlighted Code Blocks

Professional code display using `react-syntax-highlighter`:

**Features:**
- OneDark theme for beautiful code highlighting
- 180+ languages supported via Prism
- Copy button appears on hover
- Language badge in corner
- Line numbers for multi-line code (>5 lines)
- Smooth hover transitions

**Example:**
```typescript
function example() {
  console.log("Code is beautifully highlighted!");
}
```

### 3. 📋 Copy Buttons Per Code Block

Each code block has its own copy button:
- Appears on hover (opacity transition)
- Visual feedback with checkmark
- Toast notification on copy
- 2-second confirmation before reverting to copy icon

### 4. 🎯 Enhanced Loading States

Professional loading experience:
- Skeleton placeholders for header and content
- "Loading" badge with clock icon
- Smooth transitions
- Maintains layout while loading

### 5. 🚨 Error States with Retry

Clear error handling:
- Red border and background tint
- Error badge with alert icon
- Detailed error message display
- Retry button (when onRetry provided)
- Toast notification on retry attempt

### 6. 📦 Collapsible Sections

Toggle content visibility:
- Smooth expand/collapse animation
- Chevron indicator (up/down)
- Maintains state across renders
- Clean, minimal UI

### 7. 🎨 Markdown Rendering

Complete GitHub Flavored Markdown support:
- **Headers** (H1-H4)
- **Lists** (ordered/unordered)
- **Tables** with styled headers
- **Blockquotes** with left border
- **Links** (auto new tab)
- **Code** (inline and block)
- **Bold**, *italic*, ~~strikethrough~~
- **Horizontal rules**

## API Reference

### Props

```typescript
interface LLMResponseCardProps {
  // Required: The LLM response data
  response: LLMResponse;
  
  // Optional: Callback for thumbs up/down feedback
  onFeedback?: (type: 'up' | 'down') => void;
  
  // Optional: Callback for retry button
  onRetry?: () => void;
  
  // Optional: Enable streaming typewriter effect (default: false)
  streaming?: boolean;
  
  // Optional: Characters per frame for streaming (default: 3)
  streamingSpeed?: number;
}
```

### LLMResponse Interface

```typescript
interface LLMResponse {
  llmId: string;
  llmName?: string;
  response: string;
  status: 'loading' | 'success' | 'error';
  error?: string;
  timestamp: number;
  tokens?: {
    total: number;
    prompt?: number;
    completion?: number;
  };
  cost?: number;
}
```

## Usage Examples

### Basic Usage

```typescript
import { LLMResponseCard } from '@/features/council/components/LLMResponseCard';

function MyComponent() {
  const response = {
    llmId: 'gpt-4',
    response: 'Hello! How can I help you today?',
    status: 'success',
    timestamp: Date.now(),
  };

  return <LLMResponseCard response={response} />;
}
```

### With Streaming

```typescript
<LLMResponseCard
  response={response}
  streaming={true}
  streamingSpeed={5} // Faster streaming
  onFeedback={(type) => console.log('Feedback:', type)}
  onRetry={() => refetchResponse()}
/>
```

### Loading State

```typescript
const loadingResponse = {
  llmId: 'gpt-4',
  status: 'loading',
  timestamp: Date.now(),
};

<LLMResponseCard response={loadingResponse} />
```

### Error State

```typescript
const errorResponse = {
  llmId: 'gpt-4',
  status: 'error',
  error: 'Rate limit exceeded. Please try again.',
  timestamp: Date.now(),
};

<LLMResponseCard
  response={errorResponse}
  onRetry={() => retryRequest()}
/>
```

## Component Structure

```
LLMResponseCard
├── Card (shadcn/ui)
│   ├── CardHeader
│   │   ├── LLM Icon & Name
│   │   ├── Provider Badge
│   │   ├── Metadata (time, tokens, cost)
│   │   ├── Status Badge (Loading/Streaming/Success/Error)
│   │   └── Collapse Toggle
│   └── CardContent (Collapsible)
│       ├── Response Content
│       │   ├── ReactMarkdown
│       │   ├── CodeBlock (with syntax highlighting)
│       │   └── Streaming Cursor
│       └── Action Buttons
│           ├── Feedback (thumbs up/down)
│           ├── Retry
│           ├── Copy
│           └── Export
```

## Dependencies

Already installed in the project:
- `react-markdown@^10.1.0` - Markdown rendering
- `react-syntax-highlighter@^16.1.0` - Code syntax highlighting
- `@types/react-syntax-highlighter@^15.5.13` - TypeScript types
- `remark-gfm@^4.0.1` - GitHub Flavored Markdown
- `lucide-react` - Icons
- `sonner` - Toast notifications
- shadcn/ui components (Card, Button, Badge, Skeleton, Collapsible)

## Performance Optimizations

1. **Memoization**: Component is wrapped with `React.memo` to prevent unnecessary re-renders
2. **Lazy Effects**: Typewriter effect only runs when streaming is enabled
3. **Efficient Updates**: Uses interval-based chunking for smooth streaming
4. **Code Splitting**: Syntax highlighter only imports needed styles
5. **Hover-Based UI**: Copy buttons only visible on hover (reduces visual clutter)

## Styling

The component uses Tailwind CSS and follows the shadcn/ui design system:
- Dark mode optimized (OneDark theme for code)
- Consistent spacing and typography
- Smooth transitions and animations
- Accessible color contrast
- Responsive layout

## Browser Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers

Requires:
- Clipboard API for copy functionality
- CSS Grid/Flexbox for layout
- CSS Animations for transitions

## Comparison: Before vs After

### Before (Original)
- ❌ No streaming effect
- ❌ Basic code blocks (no syntax highlighting)
- ❌ No copy buttons on code blocks
- ❌ Used SafeMarkdown wrapper
- ✅ Had collapsible sections
- ✅ Had error states
- ✅ Had action buttons

### After (Enhanced)
- ✅ Streaming typewriter effect
- ✅ Syntax-highlighted code blocks
- ✅ Copy button per code block
- ✅ Direct ReactMarkdown integration
- ✅ Enhanced loading states
- ✅ Professional polish
- ✅ Better visual hierarchy
- ✅ Hover effects and transitions

## Migration Guide

### Step 1: Update Imports

```typescript
// Before
import { LLMResponseCard } from '@/features/council/components/LLMResponseCard';

// After (same, but new features available)
import { LLMResponseCard } from '@/features/council/components/LLMResponseCard';
```

### Step 2: Enable New Features

```typescript
// Basic usage (no changes needed)
<LLMResponseCard response={response} />

// Enable streaming
<LLMResponseCard 
  response={response} 
  streaming={true}  // NEW
  streamingSpeed={3} // NEW (optional)
/>
```

### Step 3: Test

All existing usage patterns continue to work. New features are opt-in via props.

## Troubleshooting

### Streaming not working
- Ensure `streaming={true}` is set
- Check that `response.status === 'success'`
- Verify `response.response` has content

### Code blocks not highlighted
- Check language is specified in markdown (e.g., ```javascript)
- Verify react-syntax-highlighter is installed
- Check browser console for errors

### Copy button not appearing
- Hover over code block
- Check that code block is not inline
- Verify clipboard API is available (requires HTTPS or localhost)

## Future Enhancements

Potential improvements for future versions:
- [ ] Token-by-token streaming (real-time API integration)
- [ ] Custom syntax highlighting themes
- [ ] Markdown table of contents
- [ ] Response regeneration with variations
- [ ] Voice output (text-to-speech)
- [ ] Export in multiple formats (PDF, HTML)
- [ ] Diff view for comparing responses
- [ ] Interactive code execution

## Credits

Inspired by:
- **Vercel AI SDK** - [https://sdk.vercel.ai/](https://sdk.vercel.ai/)
- **OpenAI Playground** - [https://platform.openai.com/playground](https://platform.openai.com/playground)
- **ChatGPT** - [https://chat.openai.com/](https://chat.openai.com/)

Built with:
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- react-markdown
- react-syntax-highlighter

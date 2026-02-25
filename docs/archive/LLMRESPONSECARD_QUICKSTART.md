# LLMResponseCard - Quick Start Guide

## 🚀 What's New?

The LLMResponseCard has been completely replaced with a professional implementation inspired by leading AI interfaces (Vercel AI SDK, OpenAI Playground, ChatGPT).

## ⚡ Key Features

1. **Streaming Typewriter Effect** - Real-time text animation
2. **Syntax-Highlighted Code** - Beautiful code blocks with OneDark theme
3. **Copy Buttons** - Per code block + full response
4. **Professional UI** - Smooth animations and transitions

## 📝 Basic Usage (No Changes Needed!)

Your existing code continues to work without any modifications:

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

## ✨ Enable Streaming Effect

Add just two props to enable the typewriter effect:

```typescript
<LLMResponseCard
  response={response}
  streaming={true}          // ← Enable streaming
  streamingSpeed={3}        // ← Optional: chars per frame (default: 3)
/>
```

## 🎨 What You Get

### Markdown Support
```markdown
# Headers work
**Bold** and *italic* text
- Bullet lists
1. Numbered lists
> Blockquotes
[Links](https://example.com)
```

### Code Blocks with Syntax Highlighting
````markdown
```javascript
function example() {
  console.log("Beautiful syntax highlighting!");
}
```
````

### Tables
```markdown
| Feature | Status |
|---------|--------|
| Streaming | ✅ |
| Code Highlighting | ✅ |
```

## 🎯 All States Covered

### Loading State
```typescript
const loadingResponse = {
  llmId: 'gpt-4',
  status: 'loading',
  timestamp: Date.now(),
};

<LLMResponseCard response={loadingResponse} />
// Shows: Skeleton placeholders with "Loading" badge
```

### Success State (Default)
```typescript
const successResponse = {
  llmId: 'gpt-4',
  response: 'Your answer here...',
  status: 'success',
  timestamp: Date.now(),
  tokens: { total: 150 },
  cost: 0.0015,
};

<LLMResponseCard response={successResponse} />
// Shows: Full response with metadata
```

### Error State
```typescript
const errorResponse = {
  llmId: 'gpt-4',
  status: 'error',
  error: 'Rate limit exceeded',
  timestamp: Date.now(),
};

<LLMResponseCard
  response={errorResponse}
  onRetry={() => retryRequest()}
/>
// Shows: Error message with retry button
```

## 🎨 Visual Features

### Streaming Animation
- Character-by-character display (~60fps)
- Blinking cursor indicator
- "Streaming..." badge with spinner
- Configurable speed

### Code Blocks
- OneDark theme (dark mode optimized)
- 180+ languages supported
- Copy button on hover
- Language badge
- Line numbers for multi-line code

### Interactions
- Thumbs up/down feedback buttons
- Copy full response
- Export as markdown file
- Retry on error
- Collapsible sections

## 📊 Performance

- **Memoized**: Prevents unnecessary re-renders
- **Efficient**: Streaming uses interval-based chunking
- **Lazy UI**: Copy buttons only visible on hover
- **Bundle Size**: +51KB (gzipped) for syntax highlighting

## 🔧 Props Reference

```typescript
interface LLMResponseCardProps {
  response: LLMResponse;          // Required
  onFeedback?: (type: 'up' | 'down') => void;  // Optional
  onRetry?: () => void;           // Optional
  streaming?: boolean;            // NEW: default false
  streamingSpeed?: number;        // NEW: default 3
}
```

## 💡 Pro Tips

1. **Faster Streaming**: Increase `streamingSpeed` to 5-10 for quicker display
2. **Slower Streaming**: Decrease to 1-2 for more dramatic effect
3. **Disable Streaming**: Set `streaming={false}` or omit the prop
4. **Code Highlighting**: Use triple backticks with language name in markdown

## 📚 Full Documentation

See `ENHANCED_LLM_RESPONSE_CARD.md` for complete documentation including:
- Detailed feature descriptions
- API reference
- Component structure
- Troubleshooting
- Future enhancements

## ✅ Compatibility

- ✅ **Backward Compatible**: All existing code works
- ✅ **TypeScript**: Full type safety
- ✅ **Dark Mode**: Optimized theme
- ✅ **Responsive**: Works on all screen sizes
- ✅ **Accessible**: Keyboard navigation supported

## 🎊 That's It!

You're ready to use the enhanced LLMResponseCard. All existing usage continues to work, and you can opt-in to new features as needed.

**Questions?** Check the full documentation in `ENHANCED_LLM_RESPONSE_CARD.md`

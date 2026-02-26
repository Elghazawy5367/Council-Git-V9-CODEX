# Environment Variables Setup Guide

This guide explains how to set up environment variables for the Council application.

## Quick Setup

1. **Copy the example file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Edit `.env.local` and add your API key:**
   - Get your OpenRouter API key from: https://openrouter.ai/keys
   - Replace `your_key_here` with your actual key

3. **Never commit `.env.local` to git!**
   - The `.gitignore` file already excludes this file
   - Keep your API keys secure

## Required Variables

### VITE_OPENROUTER_API_KEY (Required)

The OpenRouter API key is required for the Council to function. This enables the app to:
- Execute parallel LLM queries (GPT-4, Claude, Gemini, DeepSeek)
- Run judge synthesis to combine responses
- Access multiple AI models through a single API

**How to get your key:**
1. Visit: https://openrouter.ai/keys
2. Sign up or log in
3. Create a new API key
4. Copy the key (starts with `sk-or-`)
5. Paste it in your `.env.local` file

**Format:**
```env
VITE_OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Configuration Variables

### VITE_APP_NAME

The name of your Council application.

**Default:** `Council of Experts`

**Usage:**
```env
VITE_APP_NAME=Council of Experts
```

### VITE_MAX_FILE_SIZE

Maximum file size for uploads (in bytes).

**Default:** `10485760` (10 MB)

**Usage:**
```env
VITE_MAX_FILE_SIZE=10485760
```

**Common values:**
- 5 MB: `5242880`
- 10 MB: `10485760`
- 20 MB: `20971520`
- 50 MB: `52428800`

## Optional Variables

### GITHUB_TOKEN (Optional)

GitHub Personal Access Token for enhanced API rate limits.

**Benefits:**
- Increases rate limits from 60 to 5,000 requests/hour
- Enables advanced GitHub intelligence features
- Required for Scout and repository analysis

**How to get:**
1. Visit: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `public_repo`, `read:user`
4. Generate and copy the token

**Format:**
```env
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### REDDIT_API_KEY (Optional)

Reddit API key for enhanced Reddit scraping features.

**How to get:**
1. Visit: https://www.reddit.com/prefs/apps
2. Create a new app
3. Copy your API credentials

### SERPER_API_KEY (Optional)

Serper API key for Google Search integration.

**How to get:**
1. Visit: https://serper.dev
2. Sign up for an account
3. Get your API key

## Environment File Priority

The application loads environment variables in this order (later ones override earlier ones):

1. `.env` - Default values (committed to git)
2. `.env.local` - Local overrides (NOT committed to git)
3. `.env.production` - Production values
4. `.env.production.local` - Production overrides

**Recommendation:** Always use `.env.local` for development.

## Vite Environment Variables

This project uses Vite, which requires environment variables exposed to the client to start with `VITE_`.

**Important:**
- ✅ `VITE_OPENROUTER_API_KEY` - Accessible in client
- ❌ `OPENROUTER_API_KEY` - NOT accessible in client (unless prefixed)

**In your code:**
```typescript
const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
```

## Security Best Practices

1. **Never commit `.env.local`** - Already excluded in `.gitignore`
2. **Never commit API keys** - Keep them secret
3. **Rotate keys regularly** - Update them periodically
4. **Use different keys** - Separate keys for dev/staging/production
5. **Limit key permissions** - Use minimum required scopes

## Troubleshooting

### "API key not found" error

**Problem:** The app can't find your OpenRouter API key.

**Solutions:**
1. Check that `.env.local` exists in the root directory
2. Verify the key starts with `VITE_` prefix
3. Restart the dev server after adding variables
4. Check for typos in the variable name

### Environment variables not updating

**Problem:** Changes to `.env.local` aren't reflected in the app.

**Solution:** Restart the development server:
```bash
# Stop the server (Ctrl+C)
npm run dev
```

### "Invalid API key" error

**Problem:** OpenRouter rejects your API key.

**Solutions:**
1. Verify the key is correct (copy-paste from OpenRouter)
2. Check if the key has expired
3. Ensure you have credits in your OpenRouter account
4. Try generating a new key

## Example Configuration

Here's a complete example of a working `.env.local` file:

```env
# Required: OpenRouter API Key
VITE_OPENROUTER_API_KEY=sk-or-v1-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz

# App Configuration
VITE_APP_NAME=My Council of Experts
VITE_MAX_FILE_SIZE=10485760

# Optional: Enhanced Features
GITHUB_TOKEN=ghp_ABCdefGHIjklMNOpqrSTUvwxYZ123456789012
REDDIT_API_KEY=
SERPER_API_KEY=
```

## Verification

After setting up your environment variables, verify they're loaded:

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Open the browser console and check:
   ```javascript
   console.log(import.meta.env.VITE_OPENROUTER_API_KEY ? 'API key loaded' : 'API key missing');
   ```

## Getting Help

If you're still having issues:

1. Check the [main README](./README.md) for setup instructions
2. Review the [OpenRouter documentation](https://openrouter.ai/docs)
3. Verify your `.env.local` file format matches the examples
4. Check that you're using the correct variable names with `VITE_` prefix

## Related Documentation

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [OpenRouter API Documentation](https://openrouter.ai/docs)
- [GitHub Token Documentation](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)

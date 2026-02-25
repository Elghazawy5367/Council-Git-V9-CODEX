# Council AI System - Verification Checklist

This document provides a comprehensive checklist for verifying all features of the Council AI system are working correctly.

## 🎯 Pre-Verification Setup

### Environment Setup
- [ ] Copy `.env.example` to `.env.local`
- [ ] Add your OpenRouter API key to `VITE_OPENROUTER_API_KEY`
- [ ] Start development server: `npm run dev`
- [ ] Navigate to `http://localhost:5000/#/council`
- [ ] Open browser console (F12) to view logs

### Expected Console Logs
When features are used correctly, you should see logs like:
```
[Council] Running parallel execution { inputText: "What is...", selectedLLMs: [...], filesCount: 0, phase: "idle" }
[OpenRouter] Starting parallel execution { prompt: "What is...", selectedLLMs: [...], filesCount: 0 }
[OpenRouter] Parallel execution complete { totalLLMs: 4, successful: 4, failed: 0 }
[Council] Parallel execution complete { responsesReceived: 4, successful: 4, failed: 0 }
[Council] Running judge synthesis { mode: "ruthless-judge", totalResponses: 4, successfulResponses: 4, llms: [...] }
[Judge] Running judgment { responsesCount: 4, llms: [...] }
[Judge] Judgment complete { confidence: 85, contradictions: 2, llmsScored: 4 }
```

---

## Phase 1: Input and Parallel Execution

### Input Panel Features

#### Text Input
- [ ] **Can enter text in input field**
  - Type text into the large textarea
  - Should see character counter update (e.g., "150 / 10,000")
  - Character count should be in default color when under limit

- [ ] **Character counter turns red when over limit**
  - Type more than 10,000 characters
  - Counter should turn red
  - Warning message should appear
  - "Run Council" button should be disabled

#### File Upload
- [ ] **Can upload files (shows preview)**
  - Click on upload area or drag files
  - Supported types: PNG, JPG, PDF, TXT, MD, CSV
  - Files should appear as cards below upload area
  - Each card shows: file icon, name, size

- [ ] **Can remove uploaded files**
  - Click X button on file preview card
  - File should disappear from list
  - Files count should update

- [ ] **File validation works**
  - Try uploading unsupported file type (e.g., .exe)
  - Should see error toast notification
  - File should not be added to list

- [ ] **File size limit enforced**
  - Try uploading file > 10MB
  - Should see error toast notification
  - File should not be added to list

#### LLM Selection
- [ ] **Can select/deselect LLMs**
  - See 4 checkboxes: GPT-4, Claude, Gemini, DeepSeek
  - Each has icon, name, and provider
  - Click to toggle selection
  - Selection counter updates (e.g., "3 / 4 selected")

- [ ] **All LLMs selected by default**
  - On first load, all 4 checkboxes should be checked
  - Counter should show "4 / 4 selected"

- [ ] **Error shown when no LLMs selected**
  - Deselect all LLMs
  - Should see error message in red
  - "Run Council" button should be disabled

#### Run Council Button
- [ ] **"Run Council" button disabled when no text**
  - Clear all text from input
  - Button should be grayed out and disabled
  - Hover shows no click effect

- [ ] **Button disabled when text over limit**
  - Enter more than 10,000 characters
  - Button should be disabled

- [ ] **Button disabled when no LLMs selected**
  - Deselect all LLMs
  - Button should be disabled

- [ ] **Button shows loading state when running**
  - Enter valid text and click "Run Council"
  - Button should show spinner icon
  - Text changes to "Running Council..."
  - Button should be disabled during execution

### Parallel Execution
- [ ] **All selected LLMs execute simultaneously**
  - Check browser console
  - Should see "[OpenRouter] Starting parallel execution" log
  - All LLMs should start at roughly the same time
  - Not sequential (check timestamps in console)

- [ ] **Each card shows loading spinner**
  - During execution, response cards appear with:
    - LLM icon and name
    - Clock icon with "Loading" badge
    - Animated spinner
    - "Analyzing..." message

- [ ] **Responses appear independently**
  - LLMs complete at different times
  - Each card updates independently when its LLM finishes
  - CheckCircle icon with "Success" badge when complete
  - Content renders with markdown formatting

### Response Cards
- [ ] **Response displays correctly**
  - Markdown rendering works (headers, lists, code blocks)
  - Syntax highlighting for code blocks
  - Language labels on code blocks (e.g., "TYPESCRIPT")
  - Proper spacing and formatting

- [ ] **Token count and cost displayed**
  - See timestamp in header
  - Token count shows (prompt + completion + total)
  - Cost displayed (formatted as $0.0000)

- [ ] **Card is collapsible**
  - Click chevron icon in header
  - Content and footer should collapse/expand
  - Animation is smooth
  - Header always visible

### Response Card Actions
- [ ] **Can retry individual LLM**
  - Click "Retry" button (🔄 icon)
  - Should see toast notification
  - Console log: Action logged
  - *Note: Full retry requires backend integration*

- [ ] **Feedback buttons work (toggle up/down)**
  - Click thumbs up button
  - Button highlights with primary color
  - Shows "Liked" text
  - Toast notification appears
  - Click again to deselect (toggle off)

- [ ] **Thumbs down button works**
  - Click thumbs down button
  - Button highlights
  - Shows "Disliked" text
  - Toast notification appears
  - Only one feedback active at a time (up or down)

- [ ] **Copy button works**
  - Click copy button (📋 icon)
  - Toast notification: "Response copied to clipboard!"
  - Paste in text editor - should match response text

- [ ] **Export button works**
  - Click export button (💾 icon)
  - File downloads: `{llmId}-response-{timestamp}.md`
  - Open file - should contain response in markdown format
  - Toast notification: "Response exported!"

### Error Handling
- [ ] **Errors display properly**
  - Test with invalid API key (if possible)
  - Error cards should have:
    - Red destructive border
    - AlertCircle icon with "Error" badge
    - Error message displayed clearly
    - Only retry button enabled
    - Not collapsible

- [ ] **Partial success handled**
  - If some LLMs fail and others succeed
  - Successful cards show normally
  - Failed cards show error state
  - Can still proceed to judge phase if ≥2 successful

---

## Phase 2: Judge Synthesis

### Judge Section Visibility
- [ ] **Judge section appears after responses**
  - Complete Phase 1 with at least 2 successful responses
  - Judge section should appear below response grid
  - Shows "Judge Synthesis" header
  - Shows response count badge (e.g., "3 Responses Ready")

- [ ] **Judge section hidden with <2 responses**
  - If only 1 or 0 successful responses
  - Judge section should not appear
  - No error message (just hidden)

### Judge Mode Selection
- [ ] **Can select judge mode**
  - See 4 radio button options:
    - Ruthless Judge (Default)
    - Consensus Judge
    - Debate Judge
    - Pipeline Judge
  - Each has description text
  - Click to select different mode
  - Selection persists until changed

- [ ] **Only ruthless judge enabled by default**
  - On first appearance, "Ruthless Judge" should be selected
  - Default badge visible on Ruthless Judge option
  - Other modes available but not selected

### Successful LLMs Display
- [ ] **Shows which LLMs responded successfully**
  - See badge list of successful LLMs
  - Each badge has:
    - CheckCircle icon
    - LLM name (e.g., "GPT-4 Turbo")
  - Only successful responses shown
  - Failed responses not in list

### Run Judge Button
- [ ] **"Run Judge" button disabled if <2 responses**
  - With only 1 or 0 successful responses
  - Button should be grayed out
  - Hover shows no effect

- [ ] **Button enabled with ≥2 responses**
  - With 2 or more successful responses
  - Button should be active (primary color)
  - Click initiates synthesis

- [ ] **Button shows loading state**
  - Click "Run Judge"
  - Button shows spinner icon
  - Text changes to "Running Judge..."
  - All inputs disabled during execution
  - Loading card appears below judge section

### Judge Output
- [ ] **Judge output displays correctly**
  - After synthesis completes
  - Output section expands automatically
  - Markdown rendering works
  - Syntax highlighting for code blocks
  - Citations visible (e.g., "[GPT-4]")

- [ ] **Can expand/collapse judge output**
  - Click "Expand Output" / "Collapse Output" button
  - Content smoothly expands/collapses
  - Button text updates
  - ChevronUp/ChevronDown icon changes

- [ ] **Can copy judge output**
  - Click copy button in header
  - Toast notification: "Judge output copied to clipboard!"
  - Paste in text editor - should match synthesized answer

- [ ] **Can export judge output**
  - Click export button in header
  - File downloads: `judge-synthesis-{timestamp}.md`
  - Open file - should contain synthesis in markdown
  - Toast notification: "Judge output exported!"

### Score Breakdown (Future Feature)
- [ ] **Score breakdown shows (if available)**
  - Currently shows placeholder text
  - Ready for integration with RuthlessJudgeService
  - Section is collapsible
  - *Note: Full implementation pending*

### Contradictions Display (Future Feature)
- [ ] **Contradictions section shows (if available)**
  - Currently shows placeholder text
  - Ready for integration with RuthlessJudgeService
  - Section is collapsible
  - *Note: Full implementation pending*

---

## API Verification

### OpenRouter Integration
- [ ] **OpenRouter API key is used**
  - Check browser console for API calls
  - Should see network requests to `openrouter.ai`
  - Request headers include Authorization: Bearer {key}
  - Check Network tab (F12) → Filter by "openrouter"

- [ ] **All models accessed via OpenRouter**
  - Check API request body
  - Model names should be:
    - `openai/gpt-4-turbo-preview`
    - `anthropic/claude-3.5-sonnet`
    - `google/gemini-pro`
    - `deepseek/deepseek-chat`

- [ ] **API errors handled gracefully**
  - Test with invalid API key
  - Should see clear error messages
  - Error cards display properly
  - App doesn't crash
  - Can retry after fixing key

- [ ] **Rate limits respected**
  - Multiple rapid requests should queue
  - No overwhelming the API
  - Errors displayed if rate limited
  - Console logs show request pacing

- [ ] **Responses parsed correctly**
  - Check response cards contain actual LLM output
  - No JSON or raw API responses visible
  - Token counts extracted properly
  - Costs calculated and displayed

---

## Additional Verification

### Responsive Design
- [ ] **Works on mobile (< 768px)**
  - Single column layout
  - All features accessible
  - Touch-friendly buttons
  - Scrollable content

- [ ] **Works on tablet (768px - 1023px)**
  - 2-column response grid
  - Proper spacing
  - All features work

- [ ] **Works on desktop (≥ 1024px)**
  - 3-column response grid
  - Full layout visible
  - Optimal viewing experience

### Accessibility
- [ ] **Keyboard navigation works**
  - Tab through all interactive elements
  - Enter key triggers buttons
  - Escape closes modals/tooltips
  - Focus indicators visible

- [ ] **Screen reader compatible**
  - Proper ARIA labels
  - Semantic HTML structure
  - Status messages announced
  - Loading states announced

### Performance
- [ ] **No console errors**
  - Check browser console
  - No red error messages
  - Only expected logs (with [prefixes])
  - No memory leaks

- [ ] **Smooth animations**
  - Collapsible sections animate smoothly
  - Loading spinners rotate without jank
  - Page scrolling is smooth
  - No layout shifts

### State Management
- [ ] **State persists during session**
  - Enter input and navigate away (if routing exists)
  - Come back - input should be preserved
  - LLM selections preserved
  - Responses preserved

- [ ] **Can run multiple workflows**
  - Complete full workflow
  - Clear input or reset
  - Run another workflow
  - Previous results cleared properly

---

## 🐛 Common Issues & Troubleshooting

### Issue: "API key not set" error
**Solution:** 
- Check `.env.local` file exists
- Verify `VITE_OPENROUTER_API_KEY` is set
- Restart dev server after changing `.env.local`
- Check console for environment variable loading

### Issue: Button stays disabled
**Solution:**
- Check if text input has content
- Verify at least one LLM is selected
- Check if character count is under 10,000
- Look for error messages above button

### Issue: Responses don't appear
**Solution:**
- Check browser console for errors
- Verify API key is valid
- Check Network tab for 401/403 errors
- Ensure OpenRouter account has credits

### Issue: Judge section doesn't appear
**Solution:**
- Verify at least 2 LLMs responded successfully
- Check response cards for "Success" status
- Failed responses don't count toward minimum
- Look for error responses

### Issue: Copy/Export doesn't work
**Solution:**
- Check clipboard permissions in browser
- Try different browser if issue persists
- Check for popup blockers
- Verify download permissions

### Issue: No console logs visible
**Solution:**
- Open Developer Tools (F12)
- Navigate to Console tab
- Check log level filter (should include Info)
- Refresh page and try again

---

## ✅ Success Criteria

### Phase 1 Complete
- ✅ Can enter input and select LLMs
- ✅ Run Council button works
- ✅ All LLMs execute in parallel
- ✅ Responses display correctly
- ✅ Can interact with response cards
- ✅ Errors handled gracefully

### Phase 2 Complete
- ✅ Judge section appears after ≥2 responses
- ✅ Can select judge mode
- ✅ Run Judge button works
- ✅ Synthesis displays correctly
- ✅ Can copy/export results

### API Integration Complete
- ✅ OpenRouter API is used correctly
- ✅ All models accessible
- ✅ Errors handled properly
- ✅ Responses parsed correctly

---

## 📝 Verification Log Template

Use this template to track your verification:

```
Date: _______________
Tester: _______________
Browser: _______________
API Key: Valid ✓ / Invalid ✗

Phase 1 Verification:
[ ] Input features: ___/12 passed
[ ] Execution: ___/2 passed
[ ] Response cards: ___/6 passed
Issues found: _______________

Phase 2 Verification:
[ ] Judge features: ___/7 passed
Issues found: _______________

API Verification:
[ ] API integration: ___/5 passed
Issues found: _______________

Overall Status: PASS / FAIL / PARTIAL
Notes: _______________
```

---

## 🎯 Ready for Production Checklist

Before deploying to production:

- [ ] All Phase 1 features verified
- [ ] All Phase 2 features verified
- [ ] API integration verified
- [ ] Responsive design verified
- [ ] Accessibility verified
- [ ] Performance tested
- [ ] Error handling tested
- [ ] Security review complete
- [ ] Documentation updated
- [ ] Environment variables configured for production

---

**Last Updated:** January 31, 2026
**Version:** 1.0.0
**Status:** Complete

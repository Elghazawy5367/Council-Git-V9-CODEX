# AutoGen-Style Messaging for Council Experts

## Overview

The Council system has been enhanced with AutoGen-inspired message passing capabilities, allowing experts to communicate with each other, reference previous responses, and build rich conversation contexts.

## What's New

### 1. Expert Message Passing

Experts can now send and receive messages in a structured format:

```typescript
interface ExpertMessage {
  id: string;
  sender: string; // Expert ID
  senderName: string;
  recipient?: string; // Expert ID (undefined = broadcast)
  content: string;
  timestamp: Date;
  type: 'response' | 'question' | 'critique' | 'clarification' | 'agreement';
  replyTo?: string; // Message ID this is replying to
  context?: Record<string, unknown>;
}
```

### 2. Conversation Context

Each expert maintains a conversation context with:

```typescript
interface ConversationContext {
  messages: ExpertMessage[]; // Messages relevant to this expert
  previousResponses: Record<string, string>; // All expert outputs
  conversationHistory: string; // Formatted for prompt
  round: number; // Current round in sequential execution
}
```

### 3. Enhanced Expert Interface

Experts now support messaging capabilities:

```typescript
interface Expert {
  // ... existing fields
  conversationContext?: ConversationContext;
  canSendMessages?: boolean;
  messageHandler?: (message: ExpertMessage) => void;
}
```

## Core Features

### Message Broadcasting

When an expert produces output, it's automatically broadcast to all other experts:

- In **parallel mode**: All experts see each other's outputs after execution
- In **sequential mode**: Each expert sees previous experts' outputs in order
- In **adversarial mode**: Experts build on and critique previous responses

### Conversation History

The conversation history is automatically formatted and included in expert prompts:

```markdown
## Previous Expert Responses

### Expert Name 1
Response content here

### Expert Name 2  
Response content here [critique]
```

### Message Types

- **response**: Standard expert analysis
- **question**: Expert asking for clarification
- **critique**: Expert providing critical feedback
- **clarification**: Expert clarifying their position
- **agreement**: Expert endorsing another's view

## Usage

### Basic Usage (Backward Compatible)

Message passing is disabled by default. Existing code works unchanged:

```typescript
const result = await executeCouncilExperts(
  {
    task,
    mode,
    activeExperts,
    apiKey,
    synthesisConfig,
  },
  onExpertUpdate,
  onStatusUpdate
);
```

### With Message Passing Enabled

Enable messaging to track expert-to-expert communication:

```typescript
const result = await executeCouncilExperts(
  {
    task,
    mode,
    activeExperts,
    apiKey,
    synthesisConfig,
    enableMessaging: true, // Enable AutoGen-style messaging
  },
  onExpertUpdate,
  onStatusUpdate
);

// Access message history
console.log(result.messages); // All messages exchanged
console.log(result.conversationContext); // Per-expert contexts
```

### Creating Custom Messages

```typescript
import { createExpertMessage } from '@/services/council.service';

const message = createExpertMessage(
  'expert-1',
  'Expert Name',
  'I disagree with the previous analysis because...',
  'critique',
  'expert-2', // Recipient
  'msg-123' // Reply to message ID
);
```

### Accessing Conversation Context

```typescript
// In sequential mode, experts automatically receive context
const context = result.conversationContext?.['expert-id'];

if (context) {
  console.log(`Round: ${context.round}`);
  console.log(`Messages: ${context.messages.length}`);
  console.log(`History:\n${context.conversationHistory}`);
}
```

## AutoGen Pattern Implementation

### ConversableAgent Pattern

The implementation follows AutoGen's ConversableAgent pattern:

1. **Message Loop**: Experts send and receive messages automatically
2. **Context Building**: Each expert maintains conversation state
3. **History Formatting**: Messages are formatted for LLM consumption
4. **Broadcast/Direct**: Support both broadcast and targeted messages

### Message Passing State

The `MessagePassingState` class manages:

- Message queue and history
- Per-expert conversation contexts
- Message routing (broadcast vs direct)
- Round tracking for sequential execution

### Context Propagation

In sequential/adversarial modes:
1. Expert 1 responds → Message broadcast to all
2. Expert 2 receives context with Expert 1's output
3. Expert 2 responds → Message includes both contexts
4. Expert 3 receives full conversation history
5. And so on...

## Examples

### Example 1: Sequential Analysis with Context

```typescript
const experts = [
  { id: 'analyst', name: 'Data Analyst', ... },
  { id: 'critic', name: 'Critical Thinker', ... },
  { id: 'synthesizer', name: 'Synthesizer', ... },
];

const result = await executeCouncilExperts(
  {
    task: 'Analyze market trends',
    mode: 'sequential',
    activeExperts: experts,
    apiKey,
    synthesisConfig,
    enableMessaging: true,
  },
  onExpertUpdate,
  onStatusUpdate
);

// View conversation flow
result.messages?.forEach(msg => {
  console.log(`${msg.senderName}: ${msg.content.slice(0, 100)}...`);
});
```

### Example 2: Parallel with Message History

```typescript
const result = await executeCouncilExperts(
  {
    task: 'Review code architecture',
    mode: 'parallel',
    activeExperts: experts,
    apiKey,
    synthesisConfig,
    enableMessaging: true,
  },
  onExpertUpdate,
  onStatusUpdate
);

// All experts run in parallel, messages captured
// Useful for post-execution analysis
const messageCount = result.messages?.length || 0;
console.log(`Experts exchanged ${messageCount} messages`);
```

### Example 3: Custom Message Handling

```typescript
// Enable custom message handling for an expert
const expertWithHandler: Expert = {
  ...baseExpert,
  canSendMessages: true,
  messageHandler: (message) => {
    console.log(`Expert received: ${message.type} from ${message.senderName}`);
    
    // Custom logic based on message type
    if (message.type === 'question') {
      // Handle question
    } else if (message.type === 'critique') {
      // Handle critique
    }
  },
};
```

## Integration with Synthesis

The message history can be used in synthesis to provide richer context:

```typescript
function synthesizeWithMessages(
  outputs: Record<string, string>,
  messages: ExpertMessage[]
) {
  // Group messages by type
  const critiques = messages.filter(m => m.type === 'critique');
  const agreements = messages.filter(m => m.type === 'agreement');
  
  // Use in synthesis prompt
  const synthesisPrompt = `
    Expert Outputs:
    ${formatOutputs(outputs)}
    
    Critical Analysis:
    ${critiques.map(c => `- ${c.senderName}: ${c.content}`).join('\n')}
    
    Consensus Points:
    ${agreements.map(a => `- ${a.senderName}: ${a.content}`).join('\n')}
    
    Synthesize a unified conclusion...
  `;
  
  return synthesisPrompt;
}
```

## Performance Considerations

### Memory Usage

- Message history grows with expert count and rounds
- Conversation contexts include full message lists
- Consider limiting history depth for long conversations

### Recommendations

- Enable messaging only when needed for analysis
- Use in sequential/adversarial modes for best results
- Clean up old messages in long-running sessions

### Best Practices

1. **Use in Sequential Mode**: Most effective when experts build on each other
2. **Limit Expert Count**: 3-5 experts optimal for rich conversations
3. **Monitor Message Growth**: Long conversations can consume memory
4. **Archive History**: Save messages for post-execution analysis

## Message Flow Examples

### Sequential Mode Flow

```
Round 1:
  Expert 1 → Responds to task
  ↓
  Message broadcast to all experts
  
Round 2:
  Expert 2 receives context with Expert 1's response
  Expert 2 → Responds with reference to Expert 1
  ↓
  Message broadcast to all experts
  
Round 3:
  Expert 3 receives full conversation history
  Expert 3 → Synthesizes insights from both
  ↓
  Final message broadcast
```

### Parallel Mode Flow

```
All Experts Execute Simultaneously:
  Expert 1 → Response
  Expert 2 → Response
  Expert 3 → Response
  ↓
All messages captured for post-execution analysis
Context available for synthesis phase
```

### Adversarial Mode Flow

```
Round 1:
  Expert 1 → Initial position
  
Round 2:
  Expert 2 → Counter-argument (with Expert 1 context)
  
Round 3:
  Expert 1 → Rebuttal (with full debate history)
  
Round 4:
  Expert 2 → Final argument (with complete context)
```

## Debugging

### Viewing Message History

```typescript
if (result.messages) {
  console.log('=== Message History ===');
  result.messages.forEach((msg, i) => {
    console.log(`${i + 1}. [${msg.type}] ${msg.senderName}:`);
    console.log(`   ${msg.content.slice(0, 100)}...`);
    console.log(`   Timestamp: ${msg.timestamp.toISOString()}`);
  });
}
```

### Inspecting Contexts

```typescript
if (result.conversationContext) {
  Object.entries(result.conversationContext).forEach(([expertId, ctx]) => {
    console.log(`\n=== Context for ${expertId} ===`);
    console.log(`Round: ${ctx.round}`);
    console.log(`Messages seen: ${ctx.messages.length}`);
    console.log(`Previous responses: ${Object.keys(ctx.previousResponses).length}`);
  });
}
```

## Future Enhancements

Potential additions building on this foundation:

- **Message Routing**: Advanced routing based on expert roles
- **Priority Messages**: Urgent messages processed first
- **Message Queuing**: Async message processing
- **Group Conversations**: Sub-groups of experts collaborating
- **Human-in-the-Loop**: Manual message injection
- **Message Filtering**: Filter by type, sender, relevance
- **Persistence**: Save/load conversation history
- **Analytics**: Analyze communication patterns

## API Reference

### Types

```typescript
// Exported from types.ts
export interface ExpertMessage { ... }
export interface ConversationContext { ... }

// Exported from council.service.ts
export interface ExecutionContext {
  enableMessaging?: boolean;
}

export interface ExecutionResult {
  messages?: ExpertMessage[];
  conversationContext?: Record<string, ConversationContext>;
}
```

### Functions

```typescript
// Create a message
createExpertMessage(
  expertId: string,
  expertName: string,
  content: string,
  type?: ExpertMessage['type'],
  recipient?: string,
  replyTo?: string
): ExpertMessage

// Execute with messaging
executeCouncilExperts(
  context: ExecutionContext, // Set enableMessaging: true
  onExpertUpdate: ...,
  onStatusUpdate: ...
): Promise<ExecutionResult>
```

## Migration Guide

### No Migration Needed!

The messaging system is opt-in and backward compatible:

```typescript
// Existing code works unchanged
const result = await executeCouncilExperts(context, ...);

// Enable messaging when desired
const resultWithMessages = await executeCouncilExperts(
  { ...context, enableMessaging: true },
  ...
);
```

### Gradual Adoption

1. **Start Small**: Enable for one workflow
2. **Test Sequential**: Best results in sequential mode
3. **Analyze History**: Review message patterns
4. **Expand Usage**: Apply to more workflows

## Troubleshooting

### Issue: Messages not appearing
**Solution**: Ensure `enableMessaging: true` in ExecutionContext

### Issue: Empty conversation history
**Solution**: Messages only populate in sequential/adversarial modes

### Issue: Memory usage growing
**Solution**: Disable messaging for parallel mode or reduce expert count

## References

- [AutoGen Framework](https://microsoft.github.io/autogen/)
- [ConversableAgent Documentation](https://microsoft.github.io/autogen/0.2/docs/reference/agentchat/conversable_agent/)
- [Multi-Agent Communication Patterns](https://microsoft.github.io/autogen/0.2/docs/tutorial/conversation-patterns/)

---

**Version:** 1.0 (AutoGen-Style Messaging)  
**Last Updated:** 2026-02-02  
**Backward Compatible:** Yes ✅  
**Production Ready:** Yes ✅

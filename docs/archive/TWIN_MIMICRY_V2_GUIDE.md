# Twin Mimicry V2 - MOE Pattern Extraction Guide

## Overview

Twin Mimicry V2 extracts proven Mixture of Experts (MOE) patterns from elite repositories and generates Council-specific integration recommendations.

### Target Repositories

1. **microsoft/autogen** - Multi-agent communication patterns
2. **joaomdmoura/crewAI** - Role-based architecture strategies  
3. **langchain-ai/langgraph** - State machine workflow designs
4. **open-webui/open-webui** - Chat UI component patterns

## Quick Start

```bash
# Analyze AutoGen repository
npx tsx src/lib/twin-mimicry-v2.ts /path/to/autogen

# Analyze with specific developer
npx tsx src/lib/twin-mimicry-v2.ts /path/to/crewai --dev "creator"

# Get help
npx tsx src/lib/twin-mimicry-v2.ts --help
```

## Pattern Categories

### 1. Communication Patterns

**From microsoft/autogen:**

#### ConversableAgent Message Loop
- **Description:** Agent-to-agent message passing with conversation state
- **Confidence:** 90%
- **Council Status:** ✅ Already Implemented

**Council Implementation:**
```typescript
// src/features/council/lib/types.ts
interface ExpertMessage {
  id: string;
  sender: string;
  recipient?: string; // undefined = broadcast
  content: string;
  type: 'response' | 'question' | 'critique' | 'clarification' | 'agreement';
  replyTo?: string;
}

// Usage in Council
const result = await executeCouncilExperts({
  ...context,
  enableMessaging: true, // ← Enable message passing
});

// Access messages
result.messages?.forEach(msg => {
  console.log(`${msg.senderName}: ${msg.content}`);
});
```

**What to Preserve:**
- Expert 3D scoring (accuracy, completeness, conciseness)
- Judge commentary generation
- Synthesis algorithms

#### GroupChat Orchestration
- **Description:** Multi-agent conversation with speaker selection
- **Confidence:** 85%
- **Council Status:** 🔨 Recommended

**Integration Guide:**
1. Add speaker selection to sequential mode
2. Implement round-robin or expertise-based selection
3. Track conversation turns

**Proposed Implementation:**
```typescript
function selectNextSpeaker(
  experts: Expert[], 
  context: ConversationContext
): Expert {
  // Round-robin selection
  const index = context.round % experts.length;
  return experts[index];
  
  // OR expertise-based selection
  // return selectByExpertise(experts, context.topic);
}
```

**What to Preserve:**
- Execution modes (parallel, sequential, adversarial)
- Expert output tracking
- Mode-specific behaviors

---

### 2. Role-Based Patterns

**From joaomdmoura/crewAI:**

#### Role-Based Agent Definition
- **Description:** Agents with explicit roles, goals, and backstories
- **Confidence:** 88%
- **Council Status:** 🔨 Recommended (High Priority)

**CrewAI Pattern:**
```python
Agent(
    role='Code Reviewer',
    goal='Ensure code quality and security',
    backstory='Expert in secure coding practices with 10 years experience',
    delegation=True,
    verbose=True
)
```

**Council Enhancement:**
```typescript
// Add to Expert interface (types.ts)
interface Expert {
  // Existing fields
  id: string;
  name: string;
  model: string;
  role: string;
  basePersona: string;
  
  // NEW: Add from CrewAI pattern
  specialty?: string;     // Detailed specialization
  backstory?: string;     // Context and personality
  delegation?: boolean;   // Can delegate to other experts
  goals?: string[];       // Explicit objectives
}

// Usage in persona library
const securityExpert: Expert = {
  ...baseConfig,
  role: 'Code Reviewer',
  specialty: 'Security Analysis & Vulnerability Detection',
  backstory: 'Former security researcher with expertise in OWASP Top 10',
  delegation: true,
  goals: [
    'Identify security vulnerabilities',
    'Ensure secure coding practices',
    'Provide remediation guidance'
  ]
};
```

**Integration Steps:**
1. Update Expert interface in `src/features/council/lib/types.ts`
2. Add fields to persona library in `src/features/council/lib/persona-library.ts`
3. Use in prompt generation in `src/lib/config.ts`
4. Update ExpertCard UI to display specialty

**What to Preserve:**
- Existing persona library (Blue Ocean Strategist, etc.)
- Model selection logic
- Knowledge file integration
- Expert weights calculation

#### Crew Task Coordination
- **Description:** Hierarchical task assignment and execution
- **Confidence:** 82%
- **Council Status:** 🔮 Future Enhancement

**Integration Guide:**
```typescript
interface Task {
  id: string;
  name: string;
  description: string;
  assignedTo: string; // Expert ID
  dependencies: string[]; // Task IDs
  status: 'pending' | 'in-progress' | 'complete';
  result?: string;
}

// Add to execution context
interface ExecutionContext {
  // ... existing fields
  tasks?: Task[];
  taskQueue?: TaskQueue;
}
```

**What to Preserve:**
- Synthesis engine (quick, balanced, deep tiers)
- Judge modes
- Output formatting

---

### 3. Workflow Patterns

**From langchain-ai/langgraph:**

#### StateGraph with Conditional Edges
- **Description:** State machine workflow with conditional transitions
- **Confidence:** 90%
- **Council Status:** 🔮 Future Enhancement (Medium Priority)

**LangGraph Pattern:**
```python
workflow = StateGraph(State)
workflow.add_node("analyze", analyze_func)
workflow.add_node("review", review_func)
workflow.add_node("synthesize", synthesize_func)
workflow.add_edge("analyze", "review")
workflow.add_conditional_edges(
    "review",
    should_revise,
    {True: "analyze", False: "synthesize"}
)
```

**Council Integration:**
```typescript
// Add to synthesis-engine.ts
interface SynthesisState {
  stage: 'analyze' | 'review' | 'synthesize' | 'final';
  transitions: Record<string, string[]>;
  data: {
    expertOutputs: string[];
    reviewFeedback?: string;
    synthesisResult?: string;
  };
  
  // Methods
  transition(to: string): void;
  checkpoint(): void;
  canTransition(to: string): boolean;
}

class SynthesisStateMachine {
  private state: SynthesisState;
  
  async execute(inputs: string[]): Promise<string> {
    this.state.stage = 'analyze';
    
    // Analyze phase
    const analysis = await this.runExperts(inputs);
    this.state.data.expertOutputs = analysis;
    
    // Review phase
    if (this.shouldReview(analysis)) {
      this.state.transition('review');
      const feedback = await this.reviewOutputs(analysis);
      
      if (feedback.needsRevision) {
        this.state.transition('analyze');
        return this.execute(inputs); // Recursive refinement
      }
    }
    
    // Synthesize phase
    this.state.transition('synthesize');
    const result = await this.synthesize(analysis);
    
    return result;
  }
}
```

**Integration Steps:**
1. Create `SynthesisState` interface
2. Add to synthesis-engine.ts
3. Implement conditional routing
4. Add state visualization for debugging

**What to Preserve:**
- Multi-tier synthesis (quick, balanced, deep)
- Expert weight calculation
- Contradiction detection
- Synthesis caching

#### Workflow Checkpointing
- **Description:** Save and resume workflow state
- **Confidence:** 78%
- **Council Status:** 🔮 Future Enhancement

**Integration:**
```typescript
// Add to execution-store.ts
interface Checkpoint {
  id: string;
  timestamp: Date;
  executionState: ExecutionState;
  expertOutputs: Record<string, string>;
  synthesisProgress?: Partial<SynthesisResult>;
}

// Methods
async checkpoint(): Promise<string> {
  const checkpointId = generateId();
  const checkpoint: Checkpoint = {
    id: checkpointId,
    timestamp: new Date(),
    executionState: this.getState(),
    expertOutputs: this.expertOutputs,
    synthesisProgress: this.synthesisProgress,
  };
  
  // Save to IndexedDB
  await db.checkpoints.add(checkpoint);
  return checkpointId;
}

async resume(checkpointId: string): Promise<void> {
  const checkpoint = await db.checkpoints.get(checkpointId);
  if (!checkpoint) throw new Error('Checkpoint not found');
  
  this.setState(checkpoint.executionState);
  this.expertOutputs = checkpoint.expertOutputs;
  this.synthesisProgress = checkpoint.synthesisProgress;
}
```

**What to Preserve:**
- Expert execution tracking
- Error handling
- Progress callbacks

---

### 4. UI Patterns

**From open-webui/open-webui:**

#### Streaming Chat with Typewriter Effect
- **Description:** Real-time text streaming with smooth animation
- **Confidence:** 92%
- **Council Status:** ✅ Already Implemented

**Council Implementation:**
```typescript
// src/features/council/components/LLMResponseCard.tsx
function useTypewriter(text: string, enabled: boolean, speed: number): string {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    if (!enabled) {
      setDisplayedText(text);
      return;
    }
    
    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + speed));
        index += speed;
      } else {
        clearInterval(interval);
      }
    }, 16); // 60fps
    
    return () => clearInterval(interval);
  }, [text, enabled, speed]);
  
  return displayedText;
}

// Usage
<LLMResponseCard
  response={response}
  streaming={true}
  streamingSpeed={3}
/>
```

**What to Preserve:**
- Response formatting
- Feedback collection
- Export functionality

#### Code Syntax Highlighting with Copy
- **Description:** Syntax-highlighted code blocks with copy button
- **Confidence:** 88%
- **Council Status:** ✅ Already Implemented

**Council Implementation:**
```typescript
// Uses react-syntax-highlighter
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

function CodeBlock({ language, value, inline }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="relative group">
      <button 
        onClick={handleCopy}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
      >
        {copied ? <Check /> : <Copy />}
      </button>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        showLineNumbers={value.split('\n').length > 5}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
}
```

**What to Preserve:**
- Markdown rendering (react-markdown)
- GFM support
- Code block detection

---

## Programmatic Usage

```typescript
import { analyzeMOEPatterns } from '@/lib/twin-mimicry-v2';

// Analyze a repository
const analysis = await analyzeMOEPatterns({
  repoPath: '/path/to/autogen',
  targetDeveloper: 'ekzhu', // optional
  focusOnMOE: true,
});

// Access patterns
console.log('Communication Patterns:', analysis.moePatterns.communicationPatterns);
console.log('Role Patterns:', analysis.moePatterns.rolePatterns);
console.log('Workflow Patterns:', analysis.moePatterns.workflowPatterns);
console.log('UI Patterns:', analysis.moePatterns.uiPatterns);

// Council adaptations
analysis.councilAdaptations.forEach(adaptation => {
  console.log(`${adaptation.pattern}:`);
  console.log(`  Status: ${adaptation.status}`);
  console.log(`  Priority: ${adaptation.priority}`);
  console.log(`  Description: ${adaptation.description}`);
  
  if (adaptation.codeExample) {
    console.log(`  Example:\n${adaptation.codeExample}`);
  }
});

// Integration roadmap
console.log('\nImmediate:', analysis.integrationRoadmap.immediate);
console.log('Short-term:', analysis.integrationRoadmap.shortTerm);
console.log('Long-term:', analysis.integrationRoadmap.longTerm);
```

## Output Files

### 1. `data/moe-patterns.json`
Complete pattern analysis in JSON format:
```json
{
  "repository": "autogen",
  "repositoryType": "autogen",
  "moePatterns": {
    "communicationPatterns": [...],
    "rolePatterns": [...],
    "workflowPatterns": [...],
    "uiPatterns": [...]
  },
  "councilAdaptations": [...],
  "preserveRecommendations": [...],
  "integrationRoadmap": {
    "immediate": [...],
    "shortTerm": [...],
    "longTerm": [...]
  }
}
```

### 2. `data/reports/council-adaptations.md`
Human-readable markdown report with:
- Pattern descriptions and confidence scores
- Council mapping strategies
- Integration steps
- Code examples
- Preservation recommendations
- Integration roadmap

## Preservation Guidelines

### Always Preserve These Council Algorithms:

1. **Expert 3D Scoring System**
   - Accuracy, completeness, conciseness metrics
   - Used in judge evaluation
   - Do NOT replace with external metrics

2. **Persona Library**
   - Blue Ocean Strategist, Ruthless Validator, etc.
   - Pre-configured expert personalities
   - Enhance, don't replace

3. **Multi-Tier Synthesis**
   - Quick, balanced, deep tiers
   - Each has specific prompts and models
   - Core differentiation feature

4. **Judge Modes**
   - Ruthless, consensus, debate, pipeline
   - Unique Council capability
   - Already enhanced with AutoGen patterns

5. **Knowledge Base Integration**
   - Expert-specific knowledge files
   - File upload and processing
   - Vector embedding (future)

6. **Expert Weights**
   - Dynamic weight calculation
   - Performance-based adjustment
   - Historical tracking

7. **Synthesis Caching**
   - Cache similar queries
   - Reduce API costs
   - Improve response time

8. **Error Handling**
   - Retry logic with exponential backoff
   - Fallback models
   - Graceful degradation

## Integration Priority Matrix

| Pattern | Status | Priority | Effort | Impact |
|---------|--------|----------|--------|--------|
| Message Passing | ✅ Done | High | - | High |
| Streaming UI | ✅ Done | High | - | High |
| Code Highlighting | ✅ Done | High | - | High |
| Role Enhancement | 🔨 Recommended | High | Medium | High |
| Speaker Selection | 🔨 Recommended | Medium | Low | Medium |
| State Machine | 🔮 Future | Medium | High | Medium |
| Checkpointing | 🔮 Future | Low | High | Medium |
| Task Coordination | 🔮 Future | Low | High | Low |

## Best Practices

### When Adding New Patterns:

1. **Analyze First**
   - Run twin-mimicry-v2 on target repo
   - Review confidence scores
   - Validate Council mapping

2. **Preserve Core Algorithms**
   - Never replace existing unique algorithms
   - Enhance, don't replace
   - Maintain backward compatibility

3. **Incremental Integration**
   - Start with high-confidence patterns
   - Test thoroughly
   - Add to roadmap if uncertain

4. **Document Everything**
   - Update type definitions
   - Add code examples
   - Explain reasoning

5. **Test Integration**
   - Unit tests for new functionality
   - Integration tests with existing features
   - Performance benchmarks

## Troubleshooting

### Pattern Not Detected
- Ensure repository is cloned locally
- Check repository type detection
- Verify files exist in expected locations
- Try with `--dev` flag for specific developer

### Low Confidence Scores
- Pattern may be custom implementation
- Check file paths in output
- Review code snippets manually
- May need custom pattern analyzer

### Integration Conflicts
- Review preservation recommendations
- Check for breaking changes
- Test with existing features
- Rollback if necessary

## Examples

### Example 1: Analyze AutoGen
```bash
git clone https://github.com/microsoft/autogen.git
npx tsx src/lib/twin-mimicry-v2.ts autogen

# Output:
# ✅ Detected: autogen
# ✅ Found: 15 MOE-relevant files
# ✅ Patterns: 2 communication, 0 role, 0 workflow, 0 ui
# ✅ Report: data/reports/council-adaptations.md
```

### Example 2: Analyze CrewAI
```bash
git clone https://github.com/joaomdmoura/crewAI.git
npx tsx src/lib/twin-mimicry-v2.ts crewAI

# Output:
# ✅ Detected: crewai
# ✅ Found: 12 MOE-relevant files
# ✅ Patterns: 0 communication, 2 role, 1 workflow, 0 ui
# ✅ Report: data/reports/council-adaptations.md
```

### Example 3: Analyze LangGraph
```bash
git clone https://github.com/langchain-ai/langgraph.git
npx tsx src/lib/twin-mimicry-v2.ts langgraph

# Output:
# ✅ Detected: langgraph
# ✅ Found: 18 MOE-relevant files
# ✅ Patterns: 0 communication, 0 role, 2 workflow, 0 ui
# ✅ Report: data/reports/council-adaptations.md
```

## Conclusion

Twin Mimicry V2 provides a systematic approach to learning from elite MOE implementations while preserving Council's unique algorithms. Use it to:

1. Extract proven patterns from top repositories
2. Generate Council-specific integration strategies
3. Prioritize enhancements based on confidence and impact
4. Maintain backward compatibility
5. Build an integration roadmap

Always remember: **Enhance, don't replace.** Council's algorithms are valuable and should be preserved while integrating the best patterns from the MOE ecosystem.

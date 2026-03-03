/**
 * Ruthless Judge Service - Enhanced with AutoGen Patterns
 * 
 * CORE REQUIREMENTS (PRESERVED):
 * 1. Take array of LLM responses
 * 2. Use GPT-4 (via OpenRouter) as the judge
 * 3. Extract key points from each response
 * 4. Identify contradictions
 * 5. Score each response on accuracy, completeness, conciseness
 * 6. Synthesize unified answer with citations
 * 7. Provide judge commentary explaining choices
 * 
 * AUTOGEN ENHANCEMENTS:
 * 8. Iterative refinement with multi-round judgment
 * 9. Enhanced conflict resolution with evidence-based strategies
 * 10. Conversation summarization with context tracking
 * 11. Convergence detection for optimal stopping
 */

import OpenRouterService, { LLMResponse } from './openrouter';

// Score breakdown for a single LLM
interface ScoreDetail {
  accuracy: number;       // 0-100
  completeness: number;   // 0-100
  conciseness: number;    // 0-100
  total: number;          // Average of above
}

// Conflict with severity and resolution strategy
interface Conflict {
  description: string;
  severity: 'low' | 'medium' | 'high';
  affectedResponses: string[]; // llmIds involved
  evidence: string[];
  resolution?: string;
}

// Refinement round tracking
interface RefinementRound {
  roundNumber: number;
  unifiedResponse: string;
  confidence: number;
  contradictions: Conflict[];
  improvements: string[];
  converged: boolean;
}

// Conversation context for multi-turn tracking
interface ConversationContext {
  originalQuestion?: string;
  rounds: RefinementRound[];
  keyDecisionPoints: string[];
  progressiveSummary: string;
  totalRounds: number;
}

// Judgment result interface - Enhanced with AutoGen features
export interface JudgmentResult {
  unifiedResponse: string; // Markdown formatted unified answer
  scoreBreakdown: { [llmId: string]: ScoreDetail };
  contradictions: string[]; // Kept for backward compatibility
  conflicts?: Conflict[]; // Enhanced conflict tracking
  confidence: number; // 0-100
  judgeCommentary: string;
  
  // AutoGen enhancements
  conversationContext?: ConversationContext;
  refinementRounds?: number;
  convergenceAchieved?: boolean;
  finalSummary?: string;
}

// Internal structured response from judge - Enhanced
interface JudgeStructuredResponse {
  unifiedResponse: string;
  scores: {
    [llmId: string]: {
      accuracy: number;
      completeness: number;
      conciseness: number;
      reasoning: string;
    };
  };
  contradictions: string[];
  conflicts?: Array<{
    description: string;
    severity: 'low' | 'medium' | 'high';
    affectedResponses: string[];
    evidence: string[];
    resolution?: string;
  }>;
  confidence: number;
  commentary: string;
  improvements?: string[]; // Suggested improvements for next round
  keyPoints?: string[];
}

// Options for judge execution
export interface JudgeOptions {
  enableIterativeRefinement?: boolean;
  maxRefinementRounds?: number;
  convergenceThreshold?: number; // Confidence threshold for convergence
  enableConversationTracking?: boolean;
  contextQuestion?: string;
}

class RuthlessJudgeService {
  private openRouterService: OpenRouterService;
  private judgeModel = 'openai/gpt-4-turbo-preview'; // GPT-4 for judging
  private conversationContext: ConversationContext | null = null;
  
  constructor(apiKey: string) {
    this.openRouterService = new OpenRouterService(apiKey);
    this.resetContext();
  }

  /**
   * Reset conversation context (for new conversations)
   */
  resetContext(): void {
    this.conversationContext = {
      rounds: [],
      keyDecisionPoints: [],
      progressiveSummary: '',
      totalRounds: 0,
    };
  }

  /**
   * Judge multiple LLM responses and synthesize a unified answer
   * Enhanced with AutoGen patterns
   */
  async judge(
    responses: LLMResponse[], 
    options: JudgeOptions = {}
  ): Promise<JudgmentResult> {
    const {
      enableIterativeRefinement = false,
      maxRefinementRounds = 3,
      convergenceThreshold = 85,
      enableConversationTracking = false,
      contextQuestion,
    } = options;


    // Update conversation context
    if (enableConversationTracking && contextQuestion) {
      this.conversationContext!.originalQuestion = contextQuestion;
    }

    // Handle edge cases
    if (responses.length === 0) {
            return this.handleNoResponses();
    }

    const successfulResponses = responses.filter(r => r.status === 'success' && r.response.trim());
    
    if (successfulResponses.length === 0) {
      return this.handleAllFailures(responses);
    }

    if (successfulResponses.length === 1) {
      return this.handleSingleResponse(successfulResponses[0]);
    }

    try {
      // Use iterative refinement if enabled
      if (enableIterativeRefinement) {
        return await this.judgeWithIterativeRefinement(
          successfulResponses,
          maxRefinementRounds,
          convergenceThreshold,
          enableConversationTracking
        );
      }

      // Standard single-pass judgment (original behavior)
      return await this.judgeSinglePass(successfulResponses, enableConversationTracking);
    } catch (error) {
      console.error('[Judge] Judge error:', error);
            return this.createFallbackJudgment(successfulResponses);
    }
  }

  /**
   * Single-pass judgment (original behavior, preserved)
   */
  private async judgeSinglePass(
    successfulResponses: LLMResponse[],
    trackConversation: boolean = false
  ): Promise<JudgmentResult> {
    const judgePrompt = this.createJudgePrompt(successfulResponses);
    
        const judgeResponse = await this.callJudge(judgePrompt);
    
    const parsedResult = this.parseJudgeResponse(judgeResponse, successfulResponses);
    
    // Track in conversation context if enabled
    if (trackConversation && this.conversationContext) {
      this.updateConversationContext(parsedResult, 1, true);
    }
    
    return parsedResult;
  }

  /**
   * Iterative refinement judgment (AutoGen pattern)
   */
  private async judgeWithIterativeRefinement(
    successfulResponses: LLMResponse[],
    maxRounds: number,
    convergenceThreshold: number,
    trackConversation: boolean
  ): Promise<JudgmentResult> {

    let currentResult: JudgmentResult | null = null;
    let previousConfidence = 0;
    let roundNumber = 0;
    let converged = false;

    for (roundNumber = 1; roundNumber <= maxRounds; roundNumber++) {

      // Create prompt with context from previous rounds
      const prompt = this.createRefinementPrompt(
        successfulResponses,
        currentResult,
        roundNumber
      );

      const judgeResponse = await this.callJudge(prompt);
      currentResult = this.parseJudgeResponse(judgeResponse, successfulResponses);

      // Track this round
      if (trackConversation && this.conversationContext) {
        this.updateConversationContext(currentResult, roundNumber, false);
      }

      // Check for convergence
      const confidenceImprovement = currentResult.confidence - previousConfidence;
      converged = 
        currentResult.confidence >= convergenceThreshold ||
        (roundNumber > 1 && Math.abs(confidenceImprovement) < 5);


      if (converged) {
                break;
      }

      previousConfidence = currentResult.confidence;

      // Small delay between rounds to avoid rate limiting
      if (roundNumber < maxRounds) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Mark convergence in final result
    if (currentResult) {
      currentResult.refinementRounds = roundNumber;
      currentResult.convergenceAchieved = converged;
      
      // Generate final summary if conversation tracking is enabled
      if (trackConversation && this.conversationContext) {
        currentResult.finalSummary = this.generateFinalSummary();
        currentResult.conversationContext = { ...this.conversationContext };
      }
    }

    return currentResult!;
  }

  /**
   * Create detailed prompt for the judge (original, preserved)
   */
  private createJudgePrompt(responses: LLMResponse[]): string {
    const responsesFormatted = responses.map((resp, index) => {
      return `
### Response ${index + 1}: ${resp.llmName} (ID: ${resp.llmId})
${resp.response}
`;
    }).join('\n---\n');

    return `You are a ruthless AI judge tasked with evaluating multiple AI responses to synthesize the best possible answer.

**YOUR TASK:**
1. Carefully analyze each response below
2. Extract key points from each
3. Identify any contradictions between responses
4. Score each response on three criteria (0-100 scale):
   - **Accuracy**: Factual correctness and truthfulness
   - **Completeness**: How thorough and comprehensive the answer is
   - **Conciseness**: How clear and well-organized the answer is
5. Synthesize a unified answer that combines the best elements from all responses
6. Include citations (e.g., "[Response 1]" or "[GPT-4]") when you use information from a specific response
7. Provide commentary explaining your scoring and synthesis decisions

**RESPONSES TO EVALUATE:**
${responsesFormatted}

**CRITICAL: Respond ONLY with valid JSON in this exact format:**
\`\`\`json
{
  "unifiedResponse": "# Synthesized Answer\\n\\nYour unified answer here with [citations]...",
  "scores": {
    "${responses[0].llmId}": {
      "accuracy": 85,
      "completeness": 90,
      "conciseness": 80,
      "reasoning": "Brief explanation of scores"
    }
    // ... scores for each llmId
  },
  "contradictions": [
    "Description of any contradictions found",
    "Another contradiction if any"
  ],
  "conflicts": [
    {
      "description": "Detailed conflict description",
      "severity": "high",
      "affectedResponses": ["llmId1", "llmId2"],
      "evidence": ["Evidence point 1", "Evidence point 2"],
      "resolution": "How this conflict should be resolved"
    }
  ],
  "confidence": 85,
  "commentary": "Detailed explanation of your judging process, what you considered, and why you made the choices you did in the synthesis.",
  "keyPoints": ["Key insight 1", "Key insight 2"]
}
\`\`\`

**INSTRUCTIONS:**
- Be ruthless but fair in your scoring
- The unified response should be in Markdown format
- Include specific citations to attribute ideas
- If there are no contradictions, use an empty array
- Confidence should reflect how certain you are about the unified answer
- Commentary should be thorough and explain your reasoning
- For conflicts, assess severity: "low" (minor differences), "medium" (significant disagreement), "high" (critical contradiction)

Respond with ONLY the JSON, no other text.`;
  }

  /**
   * Create refinement prompt for iterative rounds (AutoGen pattern)
   */
  private createRefinementPrompt(
    responses: LLMResponse[],
    previousResult: JudgmentResult | null,
    roundNumber: number
  ): string {
    const responsesFormatted = responses.map((resp, index) => {
      return `
### Response ${index + 1}: ${resp.llmName} (ID: ${resp.llmId})
${resp.response}
`;
    }).join('\n---\n');

    let previousContext = '';
    if (previousResult) {
      previousContext = `

**PREVIOUS ROUND RESULT (Round ${roundNumber - 1}):**
Confidence: ${previousResult.confidence}/100

Previous Unified Response:
${previousResult.unifiedResponse}

Previous Contradictions:
${previousResult.contradictions.length > 0 ? previousResult.contradictions.join('\n') : 'None identified'}

Previous Commentary:
${previousResult.judgeCommentary}

**YOUR REFINEMENT TASK:**
Building on the previous analysis, focus on:
1. Addressing any remaining contradictions or conflicts
2. Improving the confidence of the unified answer
3. Incorporating any overlooked insights from the original responses
4. Providing clearer evidence-based resolutions for conflicts
5. Identifying what improvements were made from the previous round`;
    }

    return `You are a ruthless AI judge performing ROUND ${roundNumber} of iterative refinement to synthesize the best possible answer.

**ORIGINAL RESPONSES TO EVALUATE:**
${responsesFormatted}
${previousContext}

**CRITICAL: Respond ONLY with valid JSON in this exact format:**
\`\`\`json
{
  "unifiedResponse": "# Refined Synthesized Answer\\n\\nYour improved unified answer here with [citations]...",
  "scores": {
    "${responses[0].llmId}": {
      "accuracy": 85,
      "completeness": 90,
      "conciseness": 80,
      "reasoning": "Brief explanation of scores"
    }
  },
  "contradictions": [
    "Any remaining contradictions"
  ],
  "conflicts": [
    {
      "description": "Conflict description",
      "severity": "high",
      "affectedResponses": ["llmId1", "llmId2"],
      "evidence": ["Evidence 1", "Evidence 2"],
      "resolution": "Evidence-based resolution strategy"
    }
  ],
  "confidence": 90,
  "commentary": "Explain your refinement choices and improvements from previous round",
  "improvements": ["Improvement 1", "Improvement 2"],
  "keyPoints": ["Key insight 1", "Key insight 2"]
}
\`\`\`

**REFINEMENT GUIDELINES:**
- Focus on resolving high-severity conflicts first
- Use evidence-based reasoning for conflict resolution
- Improve clarity and completeness from previous round
- Increase confidence only if genuinely more certain
- Note specific improvements made in this round
- Aim for convergence: if no significant improvements possible, reflect that in your response

Respond with ONLY the JSON, no other text.`;
  }

  /**
   * Update conversation context with current round results
   */
  private updateConversationContext(
    result: JudgmentResult,
    roundNumber: number,
    isFinal: boolean
  ): void {
    if (!this.conversationContext) return;

    const conflicts: Conflict[] = result.conflicts || 
      result.contradictions.map(desc => ({
        description: desc,
        severity: 'medium' as const,
        affectedResponses: [],
        evidence: [],
      }));

    const round: RefinementRound = {
      roundNumber,
      unifiedResponse: result.unifiedResponse,
      confidence: result.confidence,
      contradictions: conflicts,
      improvements: [], // Would be populated from parsed response
      converged: isFinal,
    };

    this.conversationContext.rounds.push(round);
    this.conversationContext.totalRounds = roundNumber;

    // Update progressive summary
    this.conversationContext.progressiveSummary = this.buildProgressiveSummary();

    // Extract key decision points
    if (conflicts.some(c => c.severity === 'high')) {
      this.conversationContext.keyDecisionPoints.push(
        `Round ${roundNumber}: Resolved high-severity conflicts`
      );
    }
  }

  /**
   * Build progressive summary across rounds
   */
  private buildProgressiveSummary(): string {
    if (!this.conversationContext || this.conversationContext.rounds.length === 0) {
      return '';
    }

    const rounds = this.conversationContext.rounds;
    const summary: string[] = [];

    summary.push(`## Judgment Summary (${rounds.length} rounds)\n`);

    if (this.conversationContext.originalQuestion) {
      summary.push(`**Question:** ${this.conversationContext.originalQuestion}\n`);
    }

    summary.push('**Progress:**');
    rounds.forEach(round => {
      summary.push(
        `- Round ${round.roundNumber}: Confidence ${round.confidence}%, ` +
        `${round.contradictions.length} conflicts`
      );
    });

    if (this.conversationContext.keyDecisionPoints.length > 0) {
      summary.push('\n**Key Decisions:**');
      this.conversationContext.keyDecisionPoints.forEach(point => {
        summary.push(`- ${point}`);
      });
    }

    return summary.join('\n');
  }

  /**
   * Generate final summary of the judgment process
   */
  private generateFinalSummary(): string {
    if (!this.conversationContext) return '';

    const context = this.conversationContext;
    const rounds = context.rounds;
    
    if (rounds.length === 0) return '';

    const firstRound = rounds[0];
    const lastRound = rounds[rounds.length - 1];
    const confidenceGain = lastRound.confidence - firstRound.confidence;

    const summary: string[] = [];
    summary.push('## Judgment Process Summary\n');
    
    summary.push(`**Refinement Rounds:** ${context.totalRounds}`);
    summary.push(`**Initial Confidence:** ${firstRound.confidence}%`);
    summary.push(`**Final Confidence:** ${lastRound.confidence}%`);
    summary.push(`**Confidence Gain:** ${confidenceGain > 0 ? '+' : ''}${confidenceGain}%\n`);

    summary.push('**Conflict Resolution:**');
    const initialConflicts = firstRound.contradictions.length;
    const finalConflicts = lastRound.contradictions.length;
    summary.push(`- Initial conflicts: ${initialConflicts}`);
    summary.push(`- Resolved: ${Math.max(0, initialConflicts - finalConflicts)}`);
    summary.push(`- Remaining: ${finalConflicts}\n`);

    if (context.keyDecisionPoints.length > 0) {
      summary.push('**Key Decision Points:**');
      context.keyDecisionPoints.forEach(point => {
        summary.push(`- ${point}`);
      });
    }

    return summary.join('\n');
  }

  /**
   * Call GPT-4 as the judge
   */
  private async callJudge(prompt: string): Promise<string> {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${(this.openRouterService as any).apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://council-app.local',
        'X-Title': 'The Council V18 - Ruthless Judge',
      },
      body: JSON.stringify({
        model: this.judgeModel,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3, // Lower temperature for more consistent judging
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Judge API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  /**
   * Parse judge response and validate structure (Enhanced)
   */
  private parseJudgeResponse(judgeResponse: string, originalResponses: LLMResponse[]): JudgmentResult {
    try {
      // Extract JSON from response (might be wrapped in ```json```)
      let jsonStr = judgeResponse.trim();
      const jsonMatch = jsonStr.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }

      const parsed: JudgeStructuredResponse = JSON.parse(jsonStr);

      // Calculate totals and create score breakdown
      const scoreBreakdown: { [llmId: string]: ScoreDetail } = {};
      
      for (const [llmId, scores] of Object.entries(parsed.scores)) {
        const total = Math.round((scores.accuracy + scores.completeness + scores.conciseness) / 3);
        scoreBreakdown[llmId] = {
          accuracy: scores.accuracy,
          completeness: scores.completeness,
          conciseness: scores.conciseness,
          total,
        };
      }

      // Ensure all original LLMs have scores (use default if missing)
      originalResponses.forEach(resp => {
        if (!scoreBreakdown[resp.llmId]) {
          scoreBreakdown[resp.llmId] = {
            accuracy: 50,
            completeness: 50,
            conciseness: 50,
            total: 50,
          };
        }
      });

      // Convert enhanced conflicts or use simple contradictions
      const conflicts: Conflict[] = parsed.conflicts || 
        (parsed.contradictions || []).map(desc => ({
          description: desc,
          severity: 'medium' as const,
          affectedResponses: [],
          evidence: [],
        }));

      return {
        unifiedResponse: parsed.unifiedResponse || 'No unified response generated.',
        scoreBreakdown,
        contradictions: parsed.contradictions || [], // Keep for backward compatibility
        conflicts, // Enhanced conflict tracking
        confidence: Math.max(0, Math.min(100, parsed.confidence || 0)),
        judgeCommentary: parsed.commentary || 'No commentary provided.',
      };
    } catch (error) {
      console.error('Failed to parse judge response:', error);
      // Return fallback if parsing fails
      return this.createFallbackJudgment(originalResponses);
    }
  }

  /**
   * Handle case with no responses
   */
  private handleNoResponses(): JudgmentResult {
    return {
      unifiedResponse: '# No Responses Available\n\nNo LLM responses were provided for evaluation.',
      scoreBreakdown: {},
      contradictions: [],
      confidence: 0,
      judgeCommentary: 'No responses were available to judge.',
    };
  }

  /**
   * Handle case where all responses failed
   */
  private handleAllFailures(responses: LLMResponse[]): JudgmentResult {
    const scoreBreakdown: { [llmId: string]: ScoreDetail } = {};
    
    responses.forEach(resp => {
      scoreBreakdown[resp.llmId] = {
        accuracy: 0,
        completeness: 0,
        conciseness: 0,
        total: 0,
      };
    });

    return {
      unifiedResponse: '# All Responses Failed\n\nUnfortunately, all LLM responses encountered errors and no valid content is available.',
      scoreBreakdown,
      contradictions: [],
      confidence: 0,
      judgeCommentary: 'All LLM responses failed or returned empty content.',
    };
  }

  /**
   * Handle case with only one successful response
   */
  private handleSingleResponse(response: LLMResponse): JudgmentResult {
    return {
      unifiedResponse: `# Response from ${response.llmName}\n\n${response.response}`,
      scoreBreakdown: {
        [response.llmId]: {
          accuracy: 75,
          completeness: 75,
          conciseness: 75,
          total: 75,
        },
      },
      contradictions: [],
      confidence: 60,
      judgeCommentary: `Only one successful response was available from ${response.llmName}. No comparison or synthesis was possible, so the single response is presented as-is with moderate scores.`,
    };
  }

  /**
   * Create fallback judgment if judge fails
   */
  private createFallbackJudgment(responses: LLMResponse[]): JudgmentResult {
    const scoreBreakdown: { [llmId: string]: ScoreDetail } = {};
    
    responses.forEach(resp => {
      scoreBreakdown[resp.llmId] = {
        accuracy: 60,
        completeness: 60,
        conciseness: 60,
        total: 60,
      };
    });

    // Simple concatenation of responses
    const unifiedResponse = `# Combined Responses\n\n${responses.map(r => 
      `## ${r.llmName}\n\n${r.response}`
    ).join('\n\n---\n\n')}`;

    return {
      unifiedResponse,
      scoreBreakdown,
      contradictions: ['Unable to analyze contradictions due to judge failure.'],
      confidence: 40,
      judgeCommentary: 'The judge failed to analyze the responses properly. This is a basic concatenation of all available responses without detailed analysis.',
    };
  }
}

export default RuthlessJudgeService;
export type { 
  JudgmentResult, 
  ScoreDetail, 
  JudgeOptions, 
  Conflict, 
  ConversationContext, 
  RefinementRound 
};

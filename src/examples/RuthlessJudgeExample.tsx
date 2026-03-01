/**
 * Example usage of Ruthless Judge Service
 * Demonstrates how to use the judge to evaluate and synthesize LLM responses
 */

import RuthlessJudgeService, { JudgmentResult } from '@/services/ruthless-judge';
import { LLMResponse } from '@/services/openrouter';

// Mock LLM responses for demonstration
const mockResponses: LLMResponse[] = [
  {
    llmId: 'gpt4',
    llmName: 'GPT-4 Turbo',
    response: `TypeScript is a strongly typed programming language that builds on JavaScript. 
It adds static type definitions which help catch errors during development. 
TypeScript compiles to JavaScript and runs anywhere JavaScript runs.
Key benefits include better IDE support, early error detection, and improved code maintainability.`,
    status: 'success',
    timestamp: Date.now(),
    tokens: { prompt: 50, completion: 100, total: 150 },
    cost: 0.002,
  },
  {
    llmId: 'claude',
    llmName: 'Claude 3.5 Sonnet',
    response: `TypeScript is a superset of JavaScript developed by Microsoft. 
It introduces optional static typing to JavaScript, making code more robust and easier to refactor.
TypeScript code is transpiled to plain JavaScript for execution.
Main advantages: type safety, better tooling, enhanced IntelliSense, and easier collaboration in large teams.`,
    status: 'success',
    timestamp: Date.now(),
    tokens: { prompt: 50, completion: 95, total: 145 },
    cost: 0.0019,
  },
  {
    llmId: 'gemini',
    llmName: 'Gemini Pro',
    response: `TypeScript extends JavaScript by adding types. It's designed for large-scale applications.
The type system helps prevent bugs and makes code more maintainable.
TypeScript is compiled to JavaScript, so it works everywhere JavaScript does.
However, it has a learning curve and requires a build step, which some developers find cumbersome.`,
    status: 'success',
    timestamp: Date.now(),
    tokens: { prompt: 50, completion: 85, total: 135 },
    cost: 0.0018,
  },
];

/**
 * Example 1: Basic Usage
 */
async function basicExample(apiKey: string): Promise<void> {

  const judge = new RuthlessJudgeService(apiKey);
  
  try {
    const result: JudgmentResult = await judge.judge(mockResponses);

        Object.entries(result.scoreBreakdown).forEach(([llmId, scores]) => {
                                  });

            result.contradictions.forEach((c, i) => {
          });


          } catch (error) {
    console.error('Error during judging:', error);
  }
}

/**
 * Example 2: Handling Single Response
 */
async function singleResponseExample(apiKey: string): Promise<void> {

  const judge = new RuthlessJudgeService(apiKey);
  const singleResponse = [mockResponses[0]];

  const result = await judge.judge(singleResponse);
    }

/**
 * Example 3: Handling Failed Responses
 */
async function failedResponsesExample(apiKey: string): Promise<void> {

  const failedResponses: LLMResponse[] = [
    {
      llmId: 'gpt4',
      llmName: 'GPT-4 Turbo',
      response: '',
      status: 'error',
      error: 'API timeout',
      timestamp: Date.now(),
    },
    {
      llmId: 'claude',
      llmName: 'Claude 3.5 Sonnet',
      response: '',
      status: 'error',
      error: 'Rate limit exceeded',
      timestamp: Date.now(),
    },
  ];

  const judge = new RuthlessJudgeService(apiKey);
  const result = await judge.judge(failedResponses);
  
      }

/**
 * Example 4: Integration with CouncilContext
 */
function integrationExample(): void {

  const exampleCode = `
import { useCouncilContext } from '@/contexts/CouncilContext';
import RuthlessJudgeService from '@/services/ruthless-judge';

function MyComponent() {
  const { execution, apiKey } = useCouncilContext();

  const handleJudge = async () => {
    if (!apiKey) {
      console.error('API key not set');
      return;
    }

    // Get LLM responses from execution state
    const responses = execution.llmResponses;

    // Create judge service
    const judge = new RuthlessJudgeService(apiKey);

    // Judge the responses
    const result = await judge.judge(responses);

    // Use the judgment result

    // Display scores
    Object.entries(result.scoreBreakdown).forEach(([llmId, scores]) => {
          });
  };

  return (
    <button onClick={handleJudge}>
      Run Ruthless Judge
    </button>
  );
}
`;

  }

/**
 * Main execution
 */
export async function runExamples(apiKey: string): Promise<void> {
  // Note: In production, you would use a real API key
  // For this example, we're just demonstrating the structure
  

  // Uncomment to run with a real API key:
  // await basicExample(apiKey);
  // await singleResponseExample(apiKey);
  // await failedResponsesExample(apiKey);
  
  integrationExample();
}

// Export for use in other files
export { basicExample, singleResponseExample, failedResponsesExample, integrationExample };

// For direct execution (if needed)
if (typeof window === 'undefined' && require.main === module) {
  const apiKey = process.env.OPENROUTER_API_KEY || '';
  if (apiKey) {
    runExamples(apiKey).catch(console.error);
  } else {
        integrationExample();
  }
}

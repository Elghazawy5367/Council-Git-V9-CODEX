/**
 * Example usage of CouncilContext
 * This demonstrates how to integrate the context into your application
 */

import React from 'react';
import { CouncilProvider, useCouncilContext } from '@/contexts/CouncilContext';

// Example component that uses the context
function CouncilDemo(): JSX.Element {
  const {
    input,
    execution,
    judge,
    llmSelection,
    setInputText,
    setInputFiles,
    toggleLLM,
    executeParallel,
    setJudgeMode,
    executeJudge,
    setApiKey,
  } = useCouncilContext();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const files = Array.from(e.target.files || []);
    setInputFiles(files);
  };

  const handleExecuteParallel = async (): Promise<void> => {
    try {
      await executeParallel();
          } catch (error) {
      console.error('Execution failed:', error);
    }
  };

  const handleExecuteJudge = async (): Promise<void> => {
    try {
      await executeJudge();
          } catch (error) {
      console.error('Judge failed:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Council Context Demo</h1>

      {/* API Key */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">OpenRouter API Key</label>
        <input
          type="password"
          placeholder="Enter your API key"
          onChange={(e) => setApiKey(e.target.value)}
          className="w-full px-3 py-2 border rounded"
        />
      </div>

      {/* Input Section */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Input Text</label>
        <textarea
          value={input.text}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Enter your question or task..."
          className="w-full px-3 py-2 border rounded min-h-[100px]"
        />
      </div>

      {/* File Upload */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Upload Files (Optional)</label>
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          className="w-full"
        />
        {input.files.length > 0 && (
          <p className="text-sm text-gray-600">
            {input.files.length} file(s) selected
          </p>
        )}
      </div>

      {/* LLM Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Select LLMs</label>
        <div className="space-y-2">
          {llmSelection.availableLLMs.map((llm) => (
            <label key={llm.id} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={llmSelection.selectedLLMs.includes(llm.id)}
                onChange={() => toggleLLM(llm.id)}
              />
              <span>
                {llm.icon} {llm.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Phase 1: Execute Parallel */}
      <div className="space-y-2">
        <button
          onClick={handleExecuteParallel}
          disabled={execution.isRunning}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {execution.isRunning ? 'Running...' : 'Phase 1: Run Council (Parallel)'}
        </button>
      </div>

      {/* LLM Responses */}
      {execution.llmResponses.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">LLM Responses</h2>
          {execution.llmResponses.map((response) => (
            <div key={response.llmId} className="p-4 border rounded">
              <h3 className="font-medium">{response.llmName}</h3>
              <p className="text-sm text-gray-600">Status: {response.status}</p>
              {response.status === 'success' && (
                <p className="mt-2">{response.response}</p>
              )}
              {response.status === 'error' && (
                <p className="mt-2 text-red-600">Error: {response.error}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Phase 2: Judge Mode */}
      {execution.llmResponses.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium">Judge Mode</label>
          <select
            value={judge.mode}
            onChange={(e) => setJudgeMode(e.target.value as any)}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="ruthless-judge">Ruthless Judge</option>
            <option value="consensus-judge">Consensus Judge</option>
            <option value="debate-judge">Debate Judge</option>
            <option value="pipeline-judge">Pipeline Judge</option>
          </select>
        </div>
      )}

      {/* Execute Judge */}
      {execution.llmResponses.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={handleExecuteJudge}
            disabled={judge.isRunning}
            className="px-4 py-2 bg-purple-500 text-white rounded disabled:opacity-50"
          >
            {judge.isRunning ? 'Synthesizing...' : 'Phase 2: Run Judge'}
          </button>
        </div>
      )}

      {/* Judge Result */}
      {judge.result && (
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Judge Synthesis</h2>
          <div className="p-4 border rounded bg-purple-50">
            <p>{judge.result}</p>
          </div>
        </div>
      )}

      {/* Judge Error */}
      {judge.error && (
        <div className="p-4 border rounded bg-red-50">
          <p className="text-red-600">Judge Error: {judge.error}</p>
        </div>
      )}
    </div>
  );
}

// App wrapper with provider
export default function CouncilContextExample(): JSX.Element {
  return (
    <CouncilProvider>
      <CouncilDemo />
    </CouncilProvider>
  );
}

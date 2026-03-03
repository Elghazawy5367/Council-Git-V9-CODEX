// Web Worker for Code Mirror analysis
// Note: analyzeBatch uses Node.js fs module and cannot run in a browser worker.
// This worker provides the interface; actual analysis requires a build-time adapter.

self.onmessage = async (_e: MessageEvent) => {
  try {
    // analyzeBatch reads from the known src/ file paths internally using Node.js fs.
    // In a browser context, we return a placeholder until a browser-compatible
    // analysis pipeline is wired in Phase 2.
    self.postMessage({
      type: 'success',
      results: []
    });
  } catch (error) {
    self.postMessage({ type: 'error', message: String(error) });
  }
};

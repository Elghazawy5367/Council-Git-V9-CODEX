import { analyzeBatch } from '../../../lib/code-mirror';

self.onmessage = async (e: MessageEvent<{ files: string[] }>) => {
  try {
    const results = await analyzeBatch(e.data.files);
    self.postMessage({ type: 'success', results });
  } catch (error) {
    self.postMessage({ type: 'error', message: String(error) });
  }
};

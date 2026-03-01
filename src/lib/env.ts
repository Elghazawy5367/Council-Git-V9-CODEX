/**
 * Environment & Runtime Utilities
 *
 * Provides a unified way to access environment variables and runtime information
 * across both Node.js (scripts) and Vite (browser) environments.
 */

export const isBrowser = typeof window !== 'undefined';
export const isNode = !isBrowser;

/**
 * Access environment variables consistently
 */
export function getEnv(key: string, defaultValue: string = ''): string {
  if (isBrowser) {
    // Vite uses import.meta.env
    // We prefix with VITE_ but also check the raw key for flexibility
    return (import.meta.env[`VITE_${key}`] || import.meta.env[key] || defaultValue) as string;
  } else {
    // Node uses process.env
    return process.env[key] || defaultValue;
  }
}

/**
 * Dynamically require a Node.js module only when in a Node environment
 * This prevents Vite from trying to bundle Node-specific modules
 */
export async function getRuntimeRequire(moduleName: string): Promise<any> {
  if (isNode) {
    // Using a dynamic import with a variable or template string
    // often helps bypass some static analysis by bundlers
    return await import(/* @vite-ignore */ moduleName);
  }
  return null;
}

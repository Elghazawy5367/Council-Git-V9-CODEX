import { createRequire } from 'module';

/**
 * Environment Utilities
 * Handles environment-specific logic and Node.js module loading
 */

/**
 * Checks if the current environment is Node.js
 */
export const isNode = typeof process !== 'undefined' &&
  process.versions != null &&
  process.versions.node != null;

/**
 * Checks if the current environment is the browser
 */
export const isBrowser = !isNode;

/**
 * Safely require a Node.js module only when running in Node.js
 * This prevents Vite from trying to bundle Node-only modules in the browser
 */
export function getRuntimeRequire() {
  if (isNode) {
    return createRequire(import.meta.url);
  }
  return null;
}

/**
 * Get environment variable value safely across environments
 */
export function getEnv(key: string, defaultValue: string = ''): string {
  if (isNode) {
    return process.env[key] || defaultValue;
  }

  // Vite env variables (must be prefixed with VITE_)
  // @ts-ignore
  return (import.meta.env[`VITE_${key}`] as string) || defaultValue;
}

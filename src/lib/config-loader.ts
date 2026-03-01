/**
 * Shared Configuration Loader for Intelligence Features
 * 
 * Provides utilities for loading YAML configuration files in both:
 * - Browser environment (for UI components)
 * - Node.js environment (for CLI scripts)
 */

import type { NicheConfig, YamlConfig } from './types';

// Dynamic imports for Node.js-only modules
let yaml: any;
let fs: any;
let path: any;

/**
 * Load Node.js-only modules dynamically
 * This prevents build failures in browser environments
 */
async function loadNodeModules(): Promise<void> {
  if (typeof window === 'undefined') {
    yaml = await import('js-yaml');
    fs = await import('fs');
    path = await import('path');
  }
}

import { isNode, getRuntimeRequire } from './env';

/**
 * Load niche configuration from YAML file (Node.js only)
 * 
 * @returns Array of niche configurations
 * @throws Error if running in browser or if config file cannot be loaded
 */
export async function loadNicheConfig(): Promise<NicheConfig[]> {
  if (!isNode) {
    throw new Error('loadNicheConfig() can only be called in Node.js environment');
  }

  await loadNodeModules();
  
  try {
    const configPath = path.join(process.cwd(), 'config', 'target-niches.yaml');
    const fileContent = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(fileContent) as YamlConfig;
    return config.niches || [];
  } catch (error: any) {
    const configPath = path.join(process.cwd(), 'config', 'target-niches.yaml');
    console.error(`Failed to load niche config from ${configPath}:`, error.message);
    throw new Error(`Configuration loading failed: ${error.message}. Ensure ${configPath} exists and is valid YAML.`);
  }
}

/**
 * Filter niches to only enabled ones
 * 
 * @param niches - Array of niche configurations
 * @returns Array of enabled niche configurations
 */
export function getEnabledNiches(niches: NicheConfig[]): NicheConfig[] {
  return niches.filter(niche => niche.enabled !== false);
}

/**
 * Find a niche by ID
 * 
 * @param niches - Array of niche configurations
 * @param nicheId - The niche ID to find
 * @returns The niche configuration or undefined if not found
 */
export function findNicheById(niches: NicheConfig[], nicheId: string): NicheConfig | undefined {
  return niches.find(niche => niche.id === nicheId);
}

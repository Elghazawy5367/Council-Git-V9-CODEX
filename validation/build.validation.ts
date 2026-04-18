import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { pathToFileURL } from 'url';

const execAsync = promisify(execFile);

/**
 * Validates the build integrity of the repository.
 * Rules:
 * 1. Type-checking must pass (`tsc --noEmit`).
 * 2. Vite build must succeed (`vite build`).
 */
export async function validateBuild() {
  console.info('🚀 Starting Build Validation Pipeline...');
  
  try {
    // 1. Validate Types
    console.info('[1/2] Running TypeScript validation...');
    await execAsync('npx', ['tsc', '--noEmit'], { cwd: process.cwd() });
    console.info('✅ Type validation passed.');

    // 2. Validate Vite Build
    console.info('[2/2] Running Vite Build validation...');
    await execAsync('npm', ['run', 'build'], { cwd: process.cwd() });
    console.info('✅ Vite Build passed.');

    console.info('\n🎉 All build validations passed successfully.');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Build validation failed!');
    if (error.stdout) console.error('STDOUT:', error.stdout);
    if (error.stderr) console.error('STDERR:', error.stderr);
    process.exit(1);
  }
}

// Execute
const isDirectExecution = !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectExecution) {
  validateBuild();
}

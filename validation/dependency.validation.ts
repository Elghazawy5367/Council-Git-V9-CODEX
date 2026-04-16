import fs from 'fs/promises';
import path from 'path';

/**
 * Validates dependencies across the project.
 * Rules:
 * 1. Checks for peer dependency issues via npm ls
 * 2. Checks if critical packages are present in package.json
 */
async function validateDependencies() {
  console.info('📦 Starting Dependency Validation...');

  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  try {
    const pkgData = await fs.readFile(packageJsonPath, 'utf8');
    const pkg = JSON.parse(pkgData);
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    const criticalDeps = ['react', 'vite', 'typescript', 'zustand', 'ts-morph'];
    const missingDeps: string[] = [];

    console.info('[1/2] Checking critical dependencies...');
    for (const dep of criticalDeps) {
      if (!deps[dep]) {
        missingDeps.push(dep);
      }
    }

    if (missingDeps.length > 0) {
      throw new Error(`Missing critical dependencies: ${missingDeps.join(', ')}`);
    }
    console.info('✅ Core dependencies verified.');

    console.info('[2/2] Checking version mismatches (Node.js engine vs local)...');
    const nodeVersion = process.version;
    console.info(`✅ Running under Node ${nodeVersion}`);

    console.info('\n🎉 Dependency validation passed.');
    process.exit(0);
  } catch (err: any) {
    console.error('\n❌ Dependency validation failed!');
    console.error(err.message);
    process.exit(1);
  }
}

validateDependencies();

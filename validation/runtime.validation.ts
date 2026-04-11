import fs from 'fs/promises';
import path from 'path';

/**
 * Validates runtime initialization configurations.
 * Rules:
 * 1. Ensure required environment variables (templates) exist.
 * 2. Verify static assets or required configuration JSONs are not missing.
 */
async function validateRuntime() {
  console.info('⚡ Starting Runtime Initialization Validation...');

  const requiredFiles = [
    '.env.example', // Should exist as template
    'src/main.tsx',
    'src/stores/council.store.ts',
    'index.html'
  ];

  let errors = 0;

  try {
    console.info('[1/1] Validating core runtime anchors...');
    for (const file of requiredFiles) {
      try {
        const filePath = path.join(process.cwd(), file);
        await fs.access(filePath);
        console.info(`  ✅ Found ${file}`);
      } catch {
        console.error(`  ❌ Missing required file: ${file}`);
        errors++;
      }
    }

    if (errors > 0) {
      throw new Error(`Runtime validation failed. ${errors} missing dependencies.`);
    }

    // Additional mock verifications (e.g., config parsing without starting server)
    console.info('\n🎉 Runtime validation passed.');
    process.exit(0);

  } catch (error: any) {
    console.error('\n❌ Runtime initialization check failed!');
    console.error(error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  validateRuntime();
}

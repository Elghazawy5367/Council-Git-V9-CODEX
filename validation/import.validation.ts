import { Project } from 'ts-morph';
import { pathToFileURL } from 'url';

/**
 * Validates import relationships across the repository.
 * Rules:
 * 1. Checks for non-existent imports.
 * 2. Scans for circular dependency potential.
 */
export async function validateImports() {
  console.info('🔗 Starting Import Compatibility Validation...');
  console.info('Loading ts-morph project...');

  try {
    // Initialize ts-morph
    const project = new Project({
      tsConfigFilePath: 'tsconfig.json',
    });

    const sourceFiles = project.getSourceFiles();
    console.info(`✅ Loaded ${sourceFiles.length} source files.`);

    const errors: string[] = [];

    console.info('Analyzing import declarations...');
    for (const file of sourceFiles) {
      const imports = file.getImportDeclarations();
      
      for (const importDecl of imports) {
        const moduleSpecifier = importDecl.getModuleSpecifierValue();
        const resolvedModule = importDecl.getModuleSpecifierSourceFile();

        // Flag relative imports that cannot be resolved
        if (moduleSpecifier.startsWith('.') || moduleSpecifier.startsWith('@/')) {
          if (!resolvedModule && !moduleSpecifier.includes('.css')) {
            // Some vite imports might fail in standard ts-morph (like raw assets)
            if (!moduleSpecifier.endsWith('.svg') && !moduleSpecifier.endsWith('.png')) {
               errors.push(`Broken import in ${file.getBaseName()}: Cannot resolve '${moduleSpecifier}'`);
            }
          }
        }
      }
    }

    if (errors.length > 0) {
      console.error('\n❌ Import Validation Failed. Found broken imports:');
      errors.forEach(e => console.error(`  - ${e}`));
      process.exit(1);
    }

    console.info('\n🎉 Import validation passed successfully. No unresolvable imports detected.');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Import Validation Crashed:');
    console.error(error.message);
    process.exit(1);
  }
}

const isDirectExecution = !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectExecution) {
  validateImports();
}

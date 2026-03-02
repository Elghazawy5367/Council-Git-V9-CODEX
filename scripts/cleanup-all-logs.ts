import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

async function cleanupLogs() {
  const files = await glob('src/**/*.{ts,tsx}');
  console.log(`Searching for console.logs in ${files.length} files...`);

  let totalRemoved = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const newContent = content.replace(/^[ \t]*console\.(log|debug)\(.*\);?[ \t]*\n?/gm, '');

    if (content !== newContent) {
      const removedCount = (content.length - newContent.length); // rough estimate
      totalRemoved++;
      fs.writeFileSync(file, newContent, 'utf8');
      console.log(`Cleaned logs from ${file}`);
    }
  }

  console.log(`Finished cleaning files.`);
}

cleanupLogs().catch(console.error);

import { Project } from 'ts-morph';
import fs from 'fs';
import path from 'path';

interface GraphNode {
  id: string;
  type: 'component' | 'service' | 'store' | 'utility' | 'config' | 'unknown';
  interfaces: string[];
  classes: string[];
}

interface GraphEdge {
  source: string;
  target: string;
  type: 'imports';
}

interface SystemGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

function categorizeFile(filePath: string): GraphNode['type'] {
  if (filePath.includes('/components/') || filePath.endsWith('.tsx')) return 'component';
  if (filePath.includes('/services/')) return 'service';
  if (filePath.includes('/stores/')) return 'store';
  if (filePath.includes('/lib/')) return 'utility';
  if (filePath.includes('config')) return 'config';
  return 'unknown';
}

async function buildGraph() {
  console.log('Loading TypeScript project manually...');
  // Initialize without relying on root tsconfig.json because it uses references containing 0 raw files
  const project = new Project();
  
  console.log('Adding source files...');
  project.addSourceFilesAtPaths('src/**/*.ts');
  project.addSourceFilesAtPaths('src/**/*.tsx');
  project.addSourceFilesAtPaths('scripts/**/*.ts');

  const sourceFiles = project.getSourceFiles();
  console.log(`Found ${sourceFiles.length} source files to index...`);

  const graph: SystemGraph = {
    nodes: [],
    edges: []
  };

  const rootPath = process.cwd();

  sourceFiles.forEach(file => {
    const relativePath = path.relative(rootPath, file.getFilePath()).replace(/\\/g, '/');
    
    // Create Node
    const node: GraphNode = {
      id: relativePath,
      type: categorizeFile(relativePath),
      interfaces: file.getInterfaces().map(i => i.getName()),
      classes: file.getClasses().map(c => c.getName() || 'Anonymous'),
    };
    graph.nodes.push(node);

    // Create Edges
    file.getImportDeclarations().forEach(importDecl => {
      const modulePath = importDecl.getModuleSpecifierValue();
      const resolved = importDecl.getModuleSpecifierSourceFile();
      
      let targetId = modulePath;
      if (resolved) {
        targetId = path.relative(rootPath, resolved.getFilePath()).replace(/\\/g, '/');
      }

      graph.edges.push({
        source: relativePath,
        target: targetId,
        type: 'imports'
      });
    });
  });

  const outputPath = path.join(rootPath, 'docs', 'SYSTEM_GRAPH.json');
  fs.writeFileSync(outputPath, JSON.stringify(graph, null, 2));
  console.log(`✅ System Graph generated successfully with ${graph.nodes.length} nodes and ${graph.edges.length} edges.`);
  console.log(`Output written to: ${outputPath}`);
}

buildGraph().catch(console.error);

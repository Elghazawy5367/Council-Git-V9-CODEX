import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import checker from "vite-plugin-checker";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Base path logic:
  //   GitHub Pages build  → GITHUB_ACTIONS=true (set by build:github script) → /Council-Git-V9/
  //   Vercel build        → GITHUB_ACTIONS not set → /  (serves from root)
  //   Local dev           → GITHUB_ACTIONS not set → /  (dev server at localhost)
  //
  // deploy.yml must use: npm run build:github  (sets GITHUB_ACTIONS=true)
  // Vercel uses:         npm run build          (GITHUB_ACTIONS not set)
  const isGitHubPages = process.env.GITHUB_ACTIONS === 'true';
  const base = isGitHubPages ? '/Council-Git-V9/' : '/';

  return {
    base,
    server: {
      host: "0.0.0.0",
      port: 5000,
      strictPort: true,
      allowedHosts: true,
      cors: true,
      middlewareMode: false,
      hmr: {
        overlay: true,
        timeout: 30000,
      },
      watch: {
        ignored: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
      },
    },
    plugins: [
      react(),
      // TypeScript checking only in dev — disabled in all production builds
      mode === 'development' && checker({
        typescript: true,
        overlay: {
          initialIsOpen: false,
        },
      }),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      sourcemap: mode === 'development',
      rollupOptions: {
        // Prevent CJS-only packages from entering the browser bundle.
        // ts-morph, @babel/* are used by CLI scripts in scripts/ (Node.js)
        // and must never be bundled for the browser — they cause
        // CJS/ESM conflicts and OOM on CI with "type":"module" in package.json.
        external: (id: string) => {
          const cliOnlyPackages = [
            'ts-morph',
            '@babel/generator',
            '@babel/parser',
            '@babel/traverse',
          ];
          return cliOnlyPackages.some(
            pkg => id === pkg || id.startsWith(`${pkg}/`)
          );
        },
        output: {
          manualChunks: {
            'vendor-mermaid': ['mermaid'],
            'vendor-charts': ['recharts'],
            'vendor-ui': [
              '@radix-ui/react-dialog',
              '@radix-ui/react-tabs',
              '@radix-ui/react-select',
              '@radix-ui/react-tooltip',
              '@radix-ui/react-avatar'
            ],
            'vendor-react': ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
            'vendor-utils': ['zustand', 'lucide-react', 'date-fns', 'clsx', 'tailwind-merge'],
          },
        },
        onwarn(warning, warn) {
          if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return;
          if (warning.code === 'MISSING_EXPORT' && warning.exporter?.includes('ts-morph')) return;
          warn(warning);
        },
      },
      minify: 'esbuild',
    },
    esbuild: {
      drop: mode === 'production' ? ['debugger'] : [],
      pure: mode === 'production' ? ['console.log', 'console.debug'] : [],
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'zustand', 'react-error-boundary'],
      exclude: [
        '@vite/client',
        '@vite/env',
        // Exclude CJS-heavy CLI packages from dep pre-bundling
        'ts-morph',
        '@babel/generator',
        '@babel/parser',
        '@babel/traverse',
      ],
    },
  };
});

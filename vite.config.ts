import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import checker from "vite-plugin-checker";

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => {
  // Use base path for all builds (GitHub Pages)
  // In development, use root path for easier local testing
  const base = command === 'build' ? '/Council-Git-V9/' : '/';
  
  return {
    // GitHub Pages base path (for production builds)
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
        // Reduce file watching overhead
        ignored: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
      },
    },
  plugins: [
    react(),
    // Check TypeScript errors in real-time during dev
    // ESLint checker disabled due to configuration incompatibility
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
        warn(warning);
      },
    },
    minify: 'esbuild',
  },
  esbuild: {
    drop: mode === 'production' ? ['debugger'] : [],
    pure: mode === 'production' ? ['console.log', 'console.debug'] : [],
  },
  // Optimize dependency pre-bundling
    optimizeDeps: {
      include: ['react', 'react-dom', 'zustand', 'react-error-boundary'],
      exclude: ['@vite/client', '@vite/env'],
    },
  };
});

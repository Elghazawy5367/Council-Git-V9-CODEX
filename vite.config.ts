import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import checker from "vite-plugin-checker";

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => {
  const base = command === 'build' ? '/Council-Git-V9/' : '/';
  
  return {
    base,
    server: {
      host: "0.0.0.0",
      port: 5000,
      strictPort: true,
      allowedHosts: true,
      cors: true,
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
      mode === 'development' && checker({
        typescript: true,
        overlay: { initialIsOpen: false },
      }),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      target: 'esnext',
      sourcemap: mode === 'development',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
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
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'zustand', 'react-error-boundary'],
      exclude: ['@vite/client', '@vite/env'],
    },
  };
});


import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // This maps process.env.API_KEY from Vercel to your code
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Increase the limit to 1000kb to suppress the warning for large libraries like Recharts
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Manual chunking splits large libraries into separate files for better caching
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts') || id.includes('d3')) {
              return 'vendor-charts';
            }
            if (id.includes('@google/genai')) {
              return 'vendor-ai';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            return 'vendor'; // all other dependencies
          }
        }
      }
    }
  }
});

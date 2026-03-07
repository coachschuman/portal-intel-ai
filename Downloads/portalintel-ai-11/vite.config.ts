
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all envs regardless of the `VITE_` prefix.
  // Added type assertion to bypass 'Property cwd does not exist on type Process' error
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    base: './', // CRITICAL: This ensures JS/CSS paths work inside the WordPress /app/ folder or Vercel subdirectories
    define: {
      // This maps the system environment variables (like those in Vercel) 
      // to the process.env object in the client-side code.
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Fix: Adding Supabase environment variables to the define block to resolve TypeScript errors with import.meta.env
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY)
    },
    server: {
      port: 3000,
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      assetsDir: 'assets',
    }
  };
});

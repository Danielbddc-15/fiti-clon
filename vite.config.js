import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/fiti-clon/',
  build: {
    outDir: 'dist',
  },
  server: {
    proxy: {
      // Proxy the Shellcatch config endpoint to avoid origin-not-allowed
      '/__shellcatch_config': {
        target: 'https://api-fiti-us-dev.shellcatch.com',
        changeOrigin: true,
        secure: true,
        // Ensure the upstream sees an Origin it accepts (best-effort)
        headers: {
          origin: 'https://api-fiti-us-dev.shellcatch.com'
        },
        rewrite: (path) => path.replace(/^\/__shellcatch_config/, '/v1/script/get-config-script')
      }
    }
  }
})
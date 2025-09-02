import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  preview: {
    host: true,
    port: 5173,
  },
  plugins: [
    tailwindcss(),
    react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_HOST, // backend adresa
        changeOrigin: true,
        secure: false,
      },
    },
  },
})

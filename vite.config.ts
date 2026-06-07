import { defineConfig, loadEnv } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const host = env.DEV_HOST || 'localhost'
  const port = parseInt(env.DEV_PORT || '5173', 10)
  const strapiTarget = env.DEV_STRAPI_TARGET || 'http://localhost:1337'

  return {
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host,
      port,
      proxy: {
        '/api': {
          target: strapiTarget,
          changeOrigin: true,
        },
      },
    },
    preview: { allowedHosts: true },
  }
})

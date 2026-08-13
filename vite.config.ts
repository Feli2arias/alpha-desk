import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { devApiPlugin } from './vite/devApiPlugin'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  // Las funciones de `api/` leen sus claves de `process.env`, igual que en
  // Vercel. Vite sólo puebla `import.meta.env`, así que en dev se copian a mano
  // desde el .env — sin esto el enriquecimiento opcional nunca se activaría.
  const env = loadEnv(mode, rootDir, '')
  for (const key of ['FINNHUB_API_KEY']) {
    if (env[key]) process.env[key] = env[key]
  }

  return {
    plugins: [react(), tailwindcss(), devApiPlugin()],
    resolve: {
      alias: { '@': path.resolve(rootDir, './src') },
    },
  }
})

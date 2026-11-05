import { fileURLToPath } from 'node:url'
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default defineConfig((configEnv) =>
  mergeConfig(viteConfig(configEnv), {
    test: {
      environment: 'jsdom',
      exclude: ['**/node_modules/**', '**/dist/**', '**/cypress/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
    },
  }),
)

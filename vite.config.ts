import { reactRouter } from "@react-router/dev/vite"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"
import compression from 'vite-plugin-compression'

export default defineConfig(({ command }) => {
  return {
    // Dynamic base path: '/' for dev server, repo subfolder for production builds
    base: command === 'serve' ? '/' : '/gaia-profile-designer/',
    
    resolve: { 
      tsconfigPaths: true 
    },
    
    plugins: [
      tailwindcss(),
      reactRouter(),
      compression({ algorithm: 'brotliCompress' })
    ],
    
  }
})
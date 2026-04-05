import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// GitHub Pages：用户站点用 `/`，项目站点用 `/仓库名/`。CI 会设置 VITE_BASE；本地默认 `/`。
const base = process.env.VITE_BASE || '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [vue()],
  build: {
    // 构建输出目录，默认就是 'dist'，这里显式写出来便于理解。
    outDir: 'dist',
  },
})

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [vue()],
  build: {
    // 构建输出目录，默认就是 'dist'，这里显式写出来便于理解。
    outDir: 'dist',
  },
})

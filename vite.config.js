import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  // 根据你的 GitHub Pages 部署路径来设置 base。
  // 如果未来仓库名是 my_home_page，对应的访问路径是
  // https://username.github.io/my_home_page/，
  // 可以把 base 改成 '/my_home_page/'。
  base: '/',
  plugins: [vue()],
  build: {
    // 构建输出目录，默认就是 'dist'，这里显式写出来便于理解。
    outDir: 'dist',
  },
})

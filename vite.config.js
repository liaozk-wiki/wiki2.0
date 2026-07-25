import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import fs from 'node:fs'
import path from 'node:path'

// GitHub Pages：用户站点用 `/`，项目站点用 `/仓库名/`（须带尾部 /）。CI 可设 VITE_BASE；本地默认 `/`。
function normalizePagesBase(raw) {
  if (raw == null || String(raw).trim() === '' || String(raw).trim() === '/') return '/'
  let s = String(raw).trim()
  if (!s.startsWith('/')) s = `/${s}`
  return s.endsWith('/') ? s : `${s}/`
}
const base = normalizePagesBase(process.env.VITE_BASE)

/**
 * 为 GitHub Pages 单页应用生成 404.html。
 * 当用户直接访问或刷新前端路由（如 /learning/...）时，GitHub Pages 会返回 404.html，
 * 随后把原始路径通过查询参数带回 index.html，再由 index.html 中的脚本恢复为正常路径。
 */
function spaGithubPages404() {
  let base = '/'
  let root = process.cwd()
  let outDir = 'dist'

  return {
    name: 'spa-github-pages-404',
    apply: 'build',
    configResolved(config) {
      base = config.base
      root = config.root
      outDir = config.build.outDir
    },
    closeBundle() {
      const target = path.resolve(root, outDir, '404.html')
      fs.mkdirSync(path.dirname(target), { recursive: true })
      fs.writeFileSync(target, render404Html(base))
    },
  }
}

function render404Html(base) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>跳转中...</title>
</head>
<body>
  <noscript>需要启用 JavaScript 才能查看此页面。</noscript>
  <script>
    (function () {
      var l = window.location;
      var base = ${JSON.stringify(base)};
      var params = new URLSearchParams();
      params.set('p', l.pathname);
      if (l.search) params.set('q', l.search.slice(1));
      if (l.hash) params.set('h', l.hash.slice(1));
      l.replace(base + '?' + params.toString());
    })();
  </script>
</body>
</html>
`
}

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [vue(), spaGithubPages404()],
  build: {
    // 构建输出目录，默认就是 'dist'，这里显式写出来便于理解。
    outDir: 'dist',
  },
})

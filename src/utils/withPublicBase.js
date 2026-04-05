/**
 * public/ 下的静态文件在 GitHub Pages「项目站」会挂在 Vite base（如 /wiki2.0/）下，
 * 不能写死以站点根开头的绝对路径。
 * @param {string} path 以 / 开头的路径，如 /content/computer/index.json
 */
export function withPublicBase(path) {
  const rel = path.startsWith('/') ? path.slice(1) : path
  const base = import.meta.env.BASE_URL || '/'
  if (base === '/') return `/${rel}`
  return `${base}${rel}`
}

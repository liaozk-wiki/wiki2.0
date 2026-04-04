/**
 * 根据 public/content 下各目录的 .md 文件生成 index.json
 * 用法：node scripts/generate-content-index.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const contentRoot = path.join(root, 'public', 'content')

function parseFrontMatter(md) {
  if (!md.startsWith('---\n')) return { body: md, meta: {} }
  const end = md.indexOf('\n---\n', 4)
  if (end === -1) return { body: md, meta: {} }
  const fm = md.slice(4, end)
  const body = md.slice(end + 5)
  const meta = {}
  for (const line of fm.split('\n')) {
    const m = line.match(/^title:\s*(.+)$/)
    if (m) {
      let t = m[1].trim()
      if (
        (t.startsWith('"') && t.endsWith('"')) ||
        (t.startsWith("'") && t.endsWith("'"))
      )
        t = t.slice(1, -1)
      meta.title = t
    }
  }
  return { body, meta }
}

function firstH1(body) {
  const m = body.match(/^#\s+(.+)$/m)
  return m ? m[1].replace(/\*\*/g, '').trim() : null
}

function dateFromFilename(name) {
  const m = name.match(/^(\d{4}-\d{2}-\d{2})/)
  return m ? m[1] : null
}

function titleForFlatFile(filename, text) {
  const id = filename.slice(0, -3)
  const { body, meta } = parseFrontMatter(text)
  if (meta.title) return meta.title
  const h1 = firstH1(body)
  if (h1) return h1
  const rest = id.replace(/^\d{4}-\d{2}-\d{2}-/, '')
  return rest || id
}

function buildFlatContent(subdir, tag) {
  const full = path.join(contentRoot, subdir)
  const files = fs.readdirSync(full).filter((f) => f.endsWith('.md'))
  const items = files.map((f) => {
    const id = f.slice(0, -3)
    const text = fs.readFileSync(path.join(full, f), 'utf8')
    const title = titleForFlatFile(f, text)
    const date = dateFromFilename(id) || '2000-01-01'
    return { id, title, date, tags: [tag] }
  })
  items.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
  return items
}

const topicTitles = {
  algorithms4th: '算法（第 4 版）',
  computernet: '计算机网络',
  csapp: 'CSAPP',
  cs61a: 'CS61A',
  cs61b: 'CS61B',
  database: '数据库',
  os: '操作系统',
}

function titleForLearningFile(text, filename) {
  const { body, meta } = parseFrontMatter(text)
  if (meta.title) return meta.title
  const h1 = firstH1(body)
  if (h1) return h1
  return filename.slice(0, -3)
}

function buildLearning() {
  const base = path.join(contentRoot, 'learning')
  const dirs = fs
    .readdirSync(base)
    .filter((d) => fs.statSync(path.join(base, d)).isDirectory())
  const topics = []
  for (const slug of dirs.sort()) {
    const dir = path.join(base, slug)
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'))
    const articles = files.map((f) => {
      const id = f.slice(0, -3)
      const text = fs.readFileSync(path.join(dir, f), 'utf8')
      const title = titleForLearningFile(text, f)
      let date = dateFromFilename(id) || dateFromFilename(f)
      if (!date) date = '2000-01-01'
      return { id, title, date }
    })
    articles.sort((a, b) => a.id.localeCompare(b.id, 'zh-CN'))
    topics.push({
      slug,
      title: topicTitles[slug] || slug,
      articles,
    })
  }
  return topics
}

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true })
}

const flatDirs = [
  ['reading', 'reading'],
  ['computer', 'computer'],
  ['bug', 'bug'],
  ['living', 'living'],
  ['writing', 'writing'],
]

for (const [subdir, tag] of flatDirs) {
  const full = path.join(contentRoot, subdir)
  ensureDir(full)
  const files = fs.existsSync(full)
    ? fs.readdirSync(full).filter((f) => f.endsWith('.md'))
    : []
  const json =
    files.length === 0
      ? '[]\n'
      : JSON.stringify(buildFlatContent(subdir, tag), null, 2) + '\n'
  fs.writeFileSync(path.join(full, 'index.json'), json)
}

fs.writeFileSync(
  path.join(contentRoot, 'learning', 'index.json'),
  JSON.stringify(buildLearning(), null, 2) + '\n'
)

console.log('已生成各目录 index.json（含 learning 主题结构）')

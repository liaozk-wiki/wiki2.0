<script setup>
import 'github-markdown-css/github-markdown-light.css' 
import 'highlight.js/styles/github.css'
import { ref, onMounted, watch, computed, nextTick, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'

const route = useRoute()
const content = ref('')
const articleBodyRef = ref(null)
const toc = ref([])
const activeTocSlug = ref('')
const expandedH1Slugs = ref(new Set())
let observer = null

/** 将扁平 toc 转为树形：一级下挂二级，一级默认展开，二级默认关闭 */
const tocTree = computed(() => {
  const list = toc.value
  const tree = []
  for (const item of list) {
    if (item.level === 1) {
      tree.push({ ...item, children: [] })
    } else if (item.level === 2 && tree.length) {
      tree[tree.length - 1].children.push(item)
    }
  }
  return tree
})

const isLearningArticle = computed(() => route.name === 'LearningArticle')

const backPath = computed(() => {
  if (isLearningArticle.value) {
    const topic = route.params.topic
    return topic ? `/learning/${topic}` : '/learning'
  }
  const { category } = route.params
  return category ? `/${category}` : '/'
})

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
})

md.renderer.rules.image = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  token.attrSet('onerror', "this.onerror=null;this.style.display='none';")
  token.attrJoin('class', 'article-image')
  return self.renderToken(tokens, idx, options)
}

let currentToc = []
let headingIndex = 0
md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  const level = parseInt(token.tag.charAt(1), 10)
  if ((level === 1 || level === 2) && currentToc[headingIndex]) {
    token.attrSet('id', currentToc[headingIndex].slug)
    headingIndex++
  }
  return self.renderToken(tokens, idx, options, env, self)
}

/** 将连续多个空行保留为多个换行（Markdown 默认会合并为一个段落间隔） */
function preserveMultipleNewlines(text) {
  return text.replace(/(\n\n)(\n+)/g, (_, pair, rest) => pair + '<br>\n'.repeat(rest.length))
}

/** 仅对代码块之外的正文做多换行保留，代码块内部不替换 */
function preserveMultipleNewlinesOutsideCodeBlocks(text) {
  const codeBlockRe = /^```[\w]*\s*\n[\s\S]*?^```\s*\n?/gm
  const parts = []
  let lastEnd = 0
  let match
  while ((match = codeBlockRe.exec(text)) !== null) {
    parts.push(preserveMultipleNewlines(text.slice(lastEnd, match.index)))
    parts.push(match[0])
    lastEnd = match.index + match[0].length
  }
  parts.push(preserveMultipleNewlines(text.slice(lastEnd)))
  return parts.join('')
}

/** 从 Markdown 原文提取 h1、h2 作为目录（忽略代码块内的 #），生成 slug 供锚点使用 */
function extractToc(text) {
  const list = []
  const seen = new Map()
  const lines = text.split('\n')
  let inCodeBlock = false
  for (const line of lines) {
    if (/^```/.test(line)) {
      inCodeBlock = !inCodeBlock
      continue
    }
    if (inCodeBlock) continue
    const m = line.match(/^(#{1,2})\s+(.+)$/)
    if (!m) continue
    const level = m[1].length
    const raw = m[2].replace(/\*\*?|`|#/g, '').trim()
    const slug =
      raw
        .replace(/\s+/g, '-')
        .replace(/[^\w\u4e00-\u9fff-]/g, '')
        .toLowerCase() || 'h'
    const count = seen.get(slug) || 0
    seen.set(slug, count + 1)
    list.push({
      level,
      text: raw,
      slug: count > 0 ? `${slug}-${count}` : slug,
    })
  }
  return list
}

async function loadArticle() {
  if (isLearningArticle.value) {
    const { topic, articleId } = route.params
    if (!topic || !articleId) return
    const res = await fetch(`/content/learning/${topic}/${articleId}.md`)
    if (!res.ok) {
      content.value = ''
      toc.value = []
      return
    }
    const text = await res.text()
    const tocList = extractToc(text)
    toc.value = tocList
    currentToc = tocList
    headingIndex = 0
    content.value = md.render(preserveMultipleNewlinesOutsideCodeBlocks(text))
    await nextTick()
    highlightCodeBlocks()
    setupHeadingObserver()
    return
  }

  const { category, id } = route.params
  if (!category || !id) return
  const res = await fetch(`/content/${category}/${id}.md`)
  const text = await res.text()
  const tocList = extractToc(text)
  toc.value = tocList
  currentToc = tocList
  headingIndex = 0
  content.value = md.render(preserveMultipleNewlinesOutsideCodeBlocks(text))
  await nextTick()
  highlightCodeBlocks()
  setupHeadingObserver()
}

/** 监听正文中 h1/h2 进入视口，高亮对应目录项 */
function setupHeadingObserver() {
  if (observer) observer.disconnect()
  const container = articleBodyRef.value
  if (!container || !toc.value.length) return
  const headings = container.querySelectorAll('h1[id], h2[id]')
  if (!headings.length) return
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const id = entry.target.id
        if (id) activeTocSlug.value = id
      }
    },
    { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
  )
  headings.forEach((el) => observer.observe(el))
  if (headings[0]) activeTocSlug.value = headings[0].id || ''
}

function toggleH1(slug) {
  const next = new Set(expandedH1Slugs.value)
  if (next.has(slug)) next.delete(slug)
  else next.add(slug)
  expandedH1Slugs.value = next
}

/** Markdown 渲染后对文章内所有 <pre><code> 做 highlight.js 高亮 */
function highlightCodeBlocks() {
  const container = articleBodyRef.value
  if (!container) return
  container.querySelectorAll('pre code').forEach((el) => {
    hljs.highlightElement(el)
  })
}

onMounted(loadArticle)

onUnmounted(() => {
  if (observer) observer.disconnect()
})

watch(
  () => [
    route.name,
    route.params.category,
    route.params.id,
    route.params.topic,
    route.params.articleId,
  ],
  () => {
    expandedH1Slugs.value = new Set()
    activeTocSlug.value = ''
    loadArticle()
  }
)
</script>

<template>
  <div class="article-page">
    <router-link :to="backPath" class="back-link">← 返回列表</router-link>
    <div class="article-layout">
      <aside v-if="tocTree.length" class="toc-sidebar">
        <div class="toc-title">目录</div>
        <nav class="toc-nav">
          <div v-for="section in tocTree" :key="section.slug" class="toc-section">
            <div class="toc-h1-row">
              <a
                :href="`#${section.slug}`"
                :class="['toc-link', 'toc-link--h1', { 'toc-link--active': activeTocSlug === section.slug }]"
              >
                {{ section.text }}
              </a>
              <button
                v-if="section.children.length"
                type="button"
                class="toc-h1-arrow"
                :class="{ 'toc-h1-arrow--open': expandedH1Slugs.has(section.slug) }"
                :aria-expanded="expandedH1Slugs.has(section.slug)"
                @click.stop="toggleH1(section.slug)"
              >
                ▼
              </button>
            </div>
            <div v-show="expandedH1Slugs.has(section.slug)" class="toc-children">
              <a
                v-for="child in section.children"
                :key="child.slug"
                :href="`#${child.slug}`"
                :class="['toc-link', 'toc-link--h2', { 'toc-link--active': activeTocSlug === child.slug }]"
              >
                {{ child.text }}
              </a>
            </div>
          </div>
        </nav>
      </aside>
      <div ref="articleBodyRef" class="article-body markdown-body" v-html="content"></div>
    </div>
  </div>
</template>

<style scoped>
.article-page {
  width: 100%;
  max-width: none;
  margin: 2rem 0;
  padding: 0;
}

.article-layout {
  display: flex;
  width: 100%;
  gap: 1.75rem;
  align-items: flex-start;
}

.article-body {
  flex: 1;
  min-width: 0;
}

.toc-sidebar {
  width: 180px;
  flex-shrink: 0;
  position: sticky;
  top: 4rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  max-height: calc(100vh - 5rem);
  overflow: auto;
}

.toc-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
}

.toc-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.toc-section {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.toc-h1-row {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.toc-h1-arrow {
  flex-shrink: 0;
  padding: 0;
  margin: 0;
  border: none;
  background: none;
  font-size: 0.55rem;
  color: #9ca3af;
  cursor: pointer;
  transition: transform 0.2s;
}

.toc-h1-arrow:hover {
  color: #6b7280;
}

.toc-h1-arrow--open {
  transform: rotate(-180deg);
}

.toc-children {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding-left: 0.75rem;
}

.toc-link {
  display: inline;
  font-size: 0.85rem;
  color: #4b5563;
  text-decoration: none;
  line-height: 1.4;
  transition: color 0.15s;
}

.toc-link:hover {
  color: #111827;
}

.toc-link--h1 {
  font-weight: 600;
}

.toc-link--h2 {
  font-size: 0.8rem;
  color: #6b7280;
  font-weight: 500;
}

.toc-link--h2:hover {
  color: #374151;
}

.toc-link--active {
  color: #000;
  font-weight: 500;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.markdown-body {
  background-color: #ffffff;
  padding: 2rem 2.25rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
  color: #24292e;
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6 {
  color: #24292e;
  font-weight: 600;
}

.back-link {
  display: inline-block;
  margin-bottom: 1rem;
  color: #4b5563;
  text-decoration: none;
  font-size: 0.9rem;
}

.back-link:hover {
  color: #111827;
}
</style>

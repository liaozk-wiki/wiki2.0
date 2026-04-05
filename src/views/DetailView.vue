<script setup>
import 'github-markdown-css/github-markdown-light.css' 
import 'highlight.js/styles/github.css'
import { ref, onMounted, watch, computed, nextTick, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { withPublicBase } from '../utils/withPublicBase'
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
    const res = await fetch(
      withPublicBase(`/content/learning/${topic}/${articleId}.md`)
    )
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
  const res = await fetch(withPublicBase(`/content/${category}/${id}.md`))
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
    <div
      class="article-layout"
      :class="{ 'article-layout--with-toc': tocTree.length > 0 }"
    >
      <div v-if="tocTree.length" class="toc-column">
        <router-link :to="backPath" class="back-link">← 返回列表</router-link>
        <aside class="toc-sidebar">
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
      </div>
      <div class="article-column">
        <router-link v-if="!tocTree.length" :to="backPath" class="back-link back-link--solo">
          ← 返回列表
        </router-link>
        <div
          ref="articleBodyRef"
          class="article-body markdown-body zhihu-article"
          v-html="content"
        ></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.article-page {
  /* 知乎 PC 正文列宽约 690px；TOC 单独定宽，与正文列宽解耦 */
  --zhihu-content-width: 690px;
  --zhihu-toc-width: 216px;
  --zhihu-layout-gap: 28px;
  /* 有 TOC 时左移半格 (目录宽+间距)/2，使正文列几何中心落在容器水平中心 */
  --article-center-shift: calc(
    -0.5 * (var(--zhihu-toc-width) + var(--zhihu-layout-gap))
  );
  width: 100%;
  max-width: none;
  margin: 1.5rem 0 2rem;
  padding: 0;
}

.article-layout {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: center;
  align-items: flex-start;
  width: 100%;
  gap: var(--zhihu-layout-gap);
}

.article-layout--with-toc {
  transform: translateX(var(--article-center-shift));
}

/* 正文列：固定目标宽度 690px，窄屏随容器收缩，有无 TOC 一致 */
.article-column {
  width: min(var(--zhihu-content-width), 100%);
  flex: 0 0 min(var(--zhihu-content-width), 100%);
  max-width: 100%;
  box-sizing: border-box;
}

.article-body {
  width: 100%;
  min-width: 0;
}

.toc-column {
  width: var(--zhihu-toc-width);
  flex: 0 0 var(--zhihu-toc-width);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
  position: sticky;
  top: calc(50px + 12px);
  align-self: flex-start;
  max-height: calc(100vh - 64px);
}

.toc-sidebar {
  width: 100%;
  flex: 1 1 auto;
  min-height: 0;
  box-sizing: border-box;
  padding: 12px 14px;
  background: #fafafa;
  border-radius: 6px;
  border: 1px solid #ebebeb;
  overflow: auto;
}

.toc-title {
  font-size: 13px;
  font-weight: 600;
  color: #8590a6;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.toc-nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.toc-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.toc-h1-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 6px;
}

.toc-h1-row .toc-link--h1 {
  flex: 1;
  min-width: 0;
}

.toc-h1-arrow {
  flex-shrink: 0;
  padding: 2px;
  margin: 0;
  border: none;
  background: none;
  font-size: 10px;
  color: #8590a6;
  cursor: pointer;
  transition: transform 0.2s;
}

.toc-h1-arrow:hover {
  color: #646464;
}

.toc-h1-arrow--open {
  transform: rotate(-180deg);
}

.toc-children {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 2px 0 4px 10px;
  margin-left: 2px;
  border-left: 1px solid #f0f0f0;
}

.toc-link {
  display: block;
  font-size: 13px;
  color: #646464;
  text-decoration: none;
  line-height: 1.5;
  transition: color 0.15s;
}

.toc-link:hover {
  color: #121212;
}

.toc-link--h1 {
  font-weight: 600;
  color: #121212;
}

.toc-link--h2 {
  font-size: 12px;
  color: #8590a6;
  font-weight: 400;
}

.toc-link--h2:hover {
  color: #646464;
}

.toc-link--active {
  color: #175199;
  font-weight: 600;
}

.toc-link--active.toc-link--h2 {
  font-weight: 500;
}

.markdown-body {
  background-color: #ffffff;
  padding: 16px 28px 40px;
  border-radius: 0;
  box-shadow: none;
  border: none;
}

/* 参考知乎正文：15px、行高约 1.67、字色 #121212 */
.zhihu-article {
  font-size: 15px;
  line-height: 1.67;
  color: #121212;
  letter-spacing: 0.02em;
}

.zhihu-article :deep(p) {
  margin: 1em 0;
  font-size: 15px;
  line-height: 1.67;
}

.zhihu-article :deep(h1) {
  font-size: 22px;
  line-height: 1.4;
  font-weight: 600;
  color: #121212;
  margin: 0 0 16px;
  padding: 0;
  border-bottom: none;
}

.zhihu-article :deep(h2) {
  font-size: 18px;
  line-height: 1.4;
  font-weight: 600;
  color: #121212;
  margin: 28px 0 12px;
  border-bottom: none;
}

.zhihu-article :deep(h3) {
  font-size: 16px;
  font-weight: 600;
  color: #121212;
  margin: 22px 0 10px;
}

.zhihu-article :deep(h4),
.zhihu-article :deep(h5),
.zhihu-article :deep(h6) {
  font-size: 15px;
  font-weight: 600;
  color: #121212;
  margin: 18px 0 8px;
}

.zhihu-article :deep(strong) {
  font-weight: 600;
  color: #121212;
}

.zhihu-article :deep(a) {
  color: #175199;
  text-decoration: none;
}

.zhihu-article :deep(a:hover) {
  border-bottom: 1px solid #175199;
}

.zhihu-article :deep(blockquote) {
  margin: 1em 0;
  padding: 0 0 0 12px;
  border-left: 4px solid #ebebeb;
  color: #646464;
}

.zhihu-article :deep(ul),
.zhihu-article :deep(ol) {
  margin: 1em 0;
  padding-left: 1.5em;
}

.zhihu-article :deep(li) {
  margin: 0.35em 0;
}

.zhihu-article :deep(hr) {
  border: none;
  border-top: 1px solid #ebebeb;
  margin: 1.5em 0;
}

.zhihu-article :deep(pre) {
  margin: 1em 0;
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.5;
}

.zhihu-article :deep(:not(pre) > code) {
  font-size: 0.9em;
  padding: 0.1em 0.35em;
  background: #f6f6f6;
  border-radius: 3px;
  color: #1a1a1a;
}

.zhihu-article :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}

.back-link {
  display: block;
  width: 100%;
  text-align: left;
  margin: 0;
  padding: 0 2px;
  color: #8590a6;
  text-decoration: none;
  font-size: 14px;
  line-height: 1.4;
  flex-shrink: 0;
}

.back-link:hover {
  color: #175199;
}

.back-link--solo {
  margin-bottom: 12px;
  width: auto;
}

@media (max-width: 900px) {
  .article-layout--with-toc {
    transform: none;
  }

  .article-layout {
    flex-direction: column-reverse;
    align-items: stretch;
  }

  .article-column {
    flex: 1 1 auto;
    width: 100%;
    max-width: 100%;
  }

  .toc-column {
    width: 100%;
    max-width: 100%;
    flex: 1 1 auto;
    position: relative;
    top: auto;
    max-height: none;
  }

  .toc-sidebar {
    max-height: none;
  }
}
</style>

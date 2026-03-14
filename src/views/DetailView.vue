<script setup>
import 'github-markdown-css/github-markdown-light.css' 
import 'highlight.js/styles/github.css'
import { ref, onMounted, watch, computed, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'

const route = useRoute()
const content = ref('')

const backPath = computed(() => {
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

async function loadArticle() {
  const { category, id } = route.params
  if (!category || !id) return
  const res = await fetch(`/content/${category}/${id}.md`)
  const text = await res.text()
  content.value = md.render(preserveMultipleNewlinesOutsideCodeBlocks(text))
  await nextTick()
}

onMounted(loadArticle)

watch(
  () => [route.params.category, route.params.id],
  () => {
    loadArticle()
  }
)
</script>

<template>
  <div class="article-page">
    <router-link :to="backPath" class="back-link">← 返回列表</router-link>
    <div class="article-body markdown-body" v-html="content"></div>
  </div>
</template>

<style scoped>
.article-page {
  max-width: 820px;
  margin: 2rem auto;
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

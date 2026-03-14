<script setup>
import 'github-markdown-css/github-markdown.css'
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
  html: false,
  linkify: true,
  typographer: true,
  breaks: true,
  highlight(code, lang) {
    let result
    if (lang && hljs.getLanguage(lang)) {
      try {
        result = hljs.highlight(code, { language: lang, ignoreIllegals: true })
      } catch (e) {
        // ignore and fall through
      }
    }
    // 自动检测语言，保证总是有高亮
    if (!result) {
      result = hljs.highlightAuto(code)
    }
    // 按行包裹，配合 CSS 显示行号
    const clean = result.value.replace(/\n$/, '')
    const lines = clean.split('\n')
    return lines
      .map((line) => `<span class="code-line">${line || '&nbsp;'}</span>`)
      .join('\n')
  },
})

md.renderer.rules.image = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  token.attrSet('onerror', "this.onerror=null;this.style.display='none';")
  token.attrJoin('class', 'article-image')
  return self.renderToken(tokens, idx, options)
}

async function loadArticle() {
  const { category, id } = route.params
  if (!category || !id) return
  const res = await fetch(`/content/${category}/${id}.md`)
  const text = await res.text()
  content.value = md.render(text)
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
  color: #24292e; /* GitHub 正文颜色 */
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

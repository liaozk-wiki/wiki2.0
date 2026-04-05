<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const topics = ref([])
const loadError = ref('')

const currentTopicSlug = computed(() => route.params.topic ?? '')

const currentTopic = computed(() => {
  const slug = currentTopicSlug.value
  if (!slug) return null
  return topics.value.find((t) => t.slug === slug) ?? null
})

const articles = computed(() => currentTopic.value?.articles ?? [])

async function loadIndex() {
  loadError.value = ''
  try {
    const res = await fetch('/content/learning/index.json')
    if (!res.ok) throw new Error(String(res.status))
    const data = await res.json()
    topics.value = Array.isArray(data) ? data : []
  } catch {
    topics.value = []
    loadError.value = '无法加载学习目录，请检查 /content/learning/index.json'
  }
}

function redirectToFirstTopic() {
  const first = topics.value[0]
  if (first) router.replace(`/learning/${first.slug}`)
}

function ensureValidTopic() {
  if (!topics.value.length) return
  if (!currentTopicSlug.value) {
    redirectToFirstTopic()
    return
  }
  if (!currentTopic.value) redirectToFirstTopic()
}

onMounted(async () => {
  await loadIndex()
  ensureValidTopic()
})

watch(currentTopicSlug, () => {
  if (topics.value.length) ensureValidTopic()
})

watch(
  topics,
  () => {
    ensureValidTopic()
  },
  { deep: true }
)
</script>

<template>
  <div class="learning-page">
    <h1 class="page-title">学习笔记</h1>
    <p v-if="loadError" class="list-error">{{ loadError }}</p>
    <div v-else-if="!topics.length" class="list-loading">暂无主题配置</div>
    <div v-else class="learning-layout">
      <nav class="topic-nav" aria-label="学习主题">
        <router-link
          v-for="t in topics"
          :key="t.slug"
          :to="`/learning/${t.slug}`"
          class="topic-link"
          :class="{ 'topic-link--active': t.slug === currentTopicSlug }"
        >
          {{ t.title }}
        </router-link>
      </nav>
      <!-- 与 computer 页相同：720px 列落在 1fr | auto | 1fr 中间，整页水平居中 -->
      <section class="article-panel" aria-label="当前主题文章">
        <div class="reading-list">
          <h2 v-if="currentTopic" class="topic-list-title">{{ currentTopic.title }}</h2>
          <ul v-if="articles.length" class="list">
            <li v-for="item in articles" :key="item.id" class="list-item">
              <router-link
                :to="`/learning/${currentTopicSlug}/${item.id}`"
                class="list-link"
              >
                <span class="list-title">{{ item.title }}</span>
                <span v-if="item.date" class="list-date">{{ item.date }}</span>
              </router-link>
            </li>
          </ul>
          <p v-else class="list-empty">该主题下暂无文章</p>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.learning-page {
  width: 100%;
  max-width: none;
}

.page-title {
  font-size: 1.75rem;
  margin-bottom: 1rem;
}

.list-loading,
.list-error,
.list-empty {
  color: #6b7280;
  font-size: 0.95rem;
}

.learning-layout {
  position: relative;
  width: 100%;
  display: grid;
  grid-template-columns: 1fr minmax(0, 720px) 1fr;
  align-items: flex-start;
  box-sizing: border-box;
}

.topic-nav {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 1;
  width: 200px;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.75rem 0;
  border-right: 1px solid #e5e7eb;
  background: #f9fafb;
}

.topic-link {
  font-size: 0.9rem;
  color: #4b5563;
  text-decoration: none;
  padding: 0.4rem 0.5rem;
  border-radius: 6px;
  transition: color 0.15s, background-color 0.15s;
}

.topic-link:hover {
  color: #111827;
  background: #f3f4f6;
}

.topic-link--active {
  color: #111827;
  font-weight: 600;
  background: #eef2ff;
}

.article-panel {
  grid-column: 2;
  grid-row: 1;
  width: 100%;
  min-width: 0;
}

/* 与 ComputerListView .reading-list 一致 */
.reading-list {
  max-width: 720px;
  width: 100%;
  margin: 0 auto;
}

.topic-list-title {
  font-size: 1.75rem;
  margin-bottom: 1rem;
  font-weight: 600;
  color: #111827;
}

.list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.list-item {
  padding: 0.75rem 0;
  border-bottom: 1px solid #e5e7eb;
}

.list-item:last-child {
  border-bottom: none;
}

.list-link {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
  text-decoration: none;
  color: #111827;
}

.list-link:hover .list-title {
  color: #4f46e5;
}

.list-title {
  font-weight: 500;
  flex: 1;
  min-width: 0;
}

.list-date {
  font-size: 0.875rem;
  color: #6b7280;
  flex-shrink: 0;
}

@media (max-width: 900px) {
  .learning-layout {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .topic-nav {
    position: relative;
    left: auto;
    top: auto;
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
    border-right: none;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 0.75rem;
  }

  .article-panel {
    grid-column: auto;
    width: 100%;
  }
}
</style>

<script setup>
import { computed, ref, watch, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const isHome = computed(() => route.path === '/' || route.path === '')

/** 学习列表（非文章详情）：避免 main 垂直居中导致切换主题时整块布局上下跳动 */
const isLearningListPage = computed(() => {
  const p = route.path.replace(/\/$/, '') || '/'
  if (!p.startsWith('/learning')) return false
  const parts = p.split('/').filter(Boolean)
  return parts.length <= 2
})

const isDetailArticle = computed(() => !!route.meta.detailArticle)
const headerNavHidden = ref(false)
let lastScrollY = 0

function onWindowScroll() {
  if (!isDetailArticle.value) return
  const y = window.scrollY || document.documentElement.scrollTop
  const delta = y - lastScrollY
  if (y < 40) {
    headerNavHidden.value = false
  } else if (delta > 6) {
    headerNavHidden.value = true
  } else if (delta < -6) {
    headerNavHidden.value = false
  }
  lastScrollY = y
}

watch(
  isDetailArticle,
  (detail) => {
    if (detail) {
      lastScrollY = window.scrollY || document.documentElement.scrollTop
      headerNavHidden.value = false
      window.addEventListener('scroll', onWindowScroll, { passive: true })
    } else {
      window.removeEventListener('scroll', onWindowScroll)
      headerNavHidden.value = false
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  window.removeEventListener('scroll', onWindowScroll)
})

// 首页背景：使用 public/bgimg 下的静态图（部署到 GitHub Pages 也可用）
const staticBgUrl = '/bgimg/9B95F230-D7F7-446E-ACB2-82B8D347A5FA_1_105_c.jpeg'
</script>

<template>
  <div
    :class="[
      'app-container',
      {
        'is-home': isHome,
        'is-learning-list': isLearningListPage,
        'has-fixed-header': isDetailArticle,
        'header-nav-hidden': headerNavHidden && isDetailArticle,
      },
    ]"
  >
    <div v-if="isHome" class="home-bg" :style="{ backgroundImage: `url(${staticBgUrl})` }"></div>
    <header>
      <div class="nav-group nav-group-left">
        <router-link to="/">Home</router-link>
        <router-link to="/reading">Reading</router-link>
        <router-link to="/living">Living</router-link>
        
      </div>
      <div class="nav-group nav-group-right">
        <router-link to="/graph">Graph</router-link>
        <router-link to="/learning">Learning</router-link>
        <router-link to="/computer">Computer</router-link>
        <router-link to="/bug">Bug</router-link>
      </div>
    </header>
    <main>
      <router-view></router-view>
    </main>
    <footer>
      <div class="footer-line">To live, to err, to fall, to triumph, to recreate life out of life</div>
    </footer>
  </div>
</template>

<style scoped>
.app-container {
  position: relative;
  min-height: 100vh;
  max-width: none;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  flex-direction: column;
}

.home-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-color: #1a3a52;
}

.app-container > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(148, 163, 184, 0.4);
}

/* 详情页：固定顶栏，随滚动方向显隐 */
.app-container.has-fixed-header > header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  height: 50px;
  box-sizing: border-box;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(229, 231, 235, 0.95);
  transition: transform 0.28s ease-out;
}

.app-container.has-fixed-header.header-nav-hidden > header {
  transform: translateY(-100%);
  pointer-events: none;
}

.app-container.has-fixed-header > main {
  padding-top: calc(50px + 2rem);
}

.nav-group {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.app-container > header a {
  font-size: 0.9rem;
  text-decoration: none;
  padding: 0;
  transition: color 0.15s ease, background-color 0.15s ease;
}

.app-container > header a:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.app-container.is-home > header a {
  color: #f9fafb;
}

.app-container:not(.is-home) > header a {
  color: #111827;
}

.app-container > main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1.5rem;
}

.app-container.is-learning-list > main {
  align-items: flex-start;
}

.app-container > footer {
  color: #6b7280;
  background: transparent;
  border-top: 1px solid rgba(148, 163, 184, 0.4);
  padding: 0.75rem 0 1.25rem;
}

footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0rem;
  text-align: center;
}

footer .footer-line {
  display: block;
}

footer .footer-line--zh {
  font-size: 0.875em;
}
</style>

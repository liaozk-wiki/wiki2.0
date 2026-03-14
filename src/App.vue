<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const isHome = computed(() => route.path === '/' || route.path === '')

// 首页背景：使用 public/bgimg 下的静态图（部署到 GitHub Pages 也可用）
const staticBgUrl = '/bgimg/9B95F230-D7F7-446E-ACB2-82B8D347A5FA_1_105_c.jpeg'
</script>

<template>
  <div class="app-container" :class="{ 'is-home': isHome }">
    <div v-if="isHome" class="home-bg" :style="{ backgroundImage: `url(${staticBgUrl})` }"></div>
    <header>
      <router-link to="/">Home</router-link>
      <router-link to="/about">About</router-link>
      <router-link to="/bug">Bug</router-link>
      <router-link to="/computer">Computer</router-link>
      <router-link to="/diary">Diary</router-link>
      <router-link to="/essays">Essays</router-link>
      <router-link to="/learning">Learning</router-link>
      <router-link to="/reading">Reading</router-link>
    </header>
    <main>
      <router-view></router-view>
    </main>
    <footer>
      <div class="footer-line">To live, to err, to fall, to triumph, to recreate life out of life</div>
      <div class="footer-line footer-line--zh">去生活，去犯错，去跌倒，去胜利，去用生命再创生命</div>
    </footer>
  </div>
</template>

<style scoped>
.app-container {
  position: relative;
  min-height: 100vh;
  max-width: 960px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  flex-direction: column;
}

.app-container.is-home {
  max-width: none;
  padding: 0 1.5rem;
  min-height: 100vh;
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

.app-container.is-home header,
.app-container.is-home main,
.app-container.is-home footer {
  position: relative;
  z-index: 1;
}

.app-container.is-home header {
  background: rgba(0, 0, 0, 0.25);
  border-bottom: none;
  backdrop-filter: blur(8px);
}

.app-container.is-home header a {
  color: rgba(255, 255, 255, 0.95);
}

.app-container.is-home header a:hover {
  color: #fff;
  background-color: rgba(255, 255, 255, 0.15);
}

.app-container.is-home main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1.5rem;
}

.app-container.is-home footer {
  color: rgba(255, 255, 255, 0.8);
  background: rgba(0, 0, 0, 0.2);
  border-top: none;
  padding: 0.75rem 1.5rem;
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

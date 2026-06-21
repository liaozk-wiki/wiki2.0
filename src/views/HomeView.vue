<template>
  <div class="home-content">
    <h1 class="home-title"></h1>
    <p class="home-subtitle"></p>
    <blockquote class="home-quote">攀登顶峰的斗争本身，足以充实人的心灵，必须想象西西弗斯是幸福的。</blockquote>
  </div>
</template>

<style scoped>
.home-content {
  text-align: center;
  color: rgba(255, 255, 255, 0.98);
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6), 0 0 20px rgba(0, 0, 0, 0.3);
}

.home-title {
  font-size: clamp(2rem, 6vw, 2.5rem);
  font-weight: 400;
  margin: 0 0 2.5rem;
  letter-spacing: 0.02em;
}

.home-subtitle {
  font-size: clamp(0.95rem, 2.5vw, 1.15rem);
  margin: 0;
  opacity: 0.9;
}

.home-quote {
  margin: 2rem auto 0;
  max-width: 32em;
  font-size: clamp(0.95rem, 2vw, 1.15rem);
  line-height: 1.75;
  opacity: 0.8;
  font-style: italic;
  letter-spacing: 0.03em;
  border: none;
  padding: 0;
}
</style>

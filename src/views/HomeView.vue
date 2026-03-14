<template>
  <div class="home-content">
    <h1 class="home-title"></h1>
    <p class="home-subtitle"></p>
  </div>
</template>

<style scoped>
.home-content {
  text-align: center;
  color: rgba(255, 255, 255, 0.98);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
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
</style>

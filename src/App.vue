
<template>
  <div class="app-container">
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
    <footer> @2026 </footer>
  </div>
</template>


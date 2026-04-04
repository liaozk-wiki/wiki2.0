<script setup>
import { ref, onMounted } from 'vue'

const list = ref([])

onMounted(
    async () => {
        const res = await fetch('/content/living/index.json')
        list.value = await res.json()
    }
)
</script>


<template>
<div class="main-list">
    <h1>生活</h1>
    <ul class="list">
      <li v-for="item in list" :key="item.id" class="list-item">
        <router-link :to="`/living/${item.id}`" class="list-link">
          <span class="list-title">{{ item.title }}</span>
          <span class="list-date">{{ item.date }}</span>
        </router-link>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.main-list {
  max-width: 720px;
}
.main-list h1 {
  font-size: 1.75rem;
  margin-bottom: 1rem;
}
.list-loading,
.list-error {
  color: #6b7280;
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
</style>
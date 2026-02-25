import { createRouter, createWebHistory } from 'vue-router'
import Home from '../components/HelloWorld.vue'
import Test from '../components/Test.vue'

// 按需导入你的页面组件

const routes = [
  { path: '/', component: Home },
  { path: '/test', component: Test },
  // 可添加更多路由
]

const base = '/'

const router = createRouter({
  history: createWebHistory(base), 
  routes,
})

export default router
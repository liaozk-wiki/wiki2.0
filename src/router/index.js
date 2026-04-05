import { createRouter, createWebHistory } from 'vue-router'
import Home from '../components/HelloWorld.vue'
import AboutView from '../views/AboutView.vue'
import BugListView from '../views/BugListView.vue'
import ComputerListview from '../views/ComputerListview.vue'
import LivingListView from '../views/LivingListView.vue'
import GraphListView from '../views/GraphListView.vue'
import HomeView from '../views/HomeView.vue'
import LearningListView from '../views/LearningListView.vue'
import ReadingListView from '../views/ReadingListView.vue'
import DetailView from '../views/DetailView.vue'

/**
 * Learning 与静态资源约定（勿改顺序：详情须在列表之前匹配）：
 * - 列表：/learning、/learning/:topic
 * - 文章：/learning/:topic/:articleId → 读取 /content/learning/<topic>/<articleId>.md
 * - :topic 与 public/content/learning 下文件夹名一致，如 1.database、5.algorithms4th
 */
const routes = [
  { path: '/', component: HomeView },
  { path: '/about', component: AboutView },
  { path: '/bug', component: BugListView },
  { path: '/computer', component: ComputerListview },
  { path: '/living', component: LivingListView },
  { path: '/graph', component: GraphListView },
  { path: '/home', component: HomeView },
  { path: '/reading', component: ReadingListView },
  {
    path: '/learning/:topic/:articleId',
    name: 'LearningArticle',
    component: DetailView,
    meta: { detailArticle: true },
  },
  { path: '/learning/:topic', component: LearningListView },
  { path: '/learning', component: LearningListView },
  { path: '/:category/:id', component: DetailView, meta: { detailArticle: true } },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
import { createRouter, createWebHistory } from 'vue-router'
import Home from '../components/HelloWorld.vue'
import AboutView from '../views/AboutView.vue'
import BugListView from '../views/BugListView.vue'
import ComputerListview from '../views/ComputerListview.vue'
import LivingListView from '../views/LivingListView.vue'
import WritingListView from '../views/WritingListView.vue'
import HomeView from '../views/HomeView.vue'
import LearningListView from '../views/LearningListView.vue'
import ReadingListView from '../views/ReadingListView.vue'
import DetailView from '../views/DetailView.vue'

const routes = [
  { path: '/', component: HomeView },
  { path: '/about', component: AboutView },
  { path: '/bug', component: BugListView },
  { path: '/computer', component: ComputerListview },
  { path: '/living', component: LivingListView },
  { path: '/writing', component: WritingListView },
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

const base = '/'

const router = createRouter({
  history: createWebHistory(base), 
  routes,
})

export default router
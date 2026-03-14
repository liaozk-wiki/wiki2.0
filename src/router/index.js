import { createRouter, createWebHistory } from 'vue-router'
import Home from '../components/HelloWorld.vue'
import AboutView from '../views/AboutView.vue'
import BugListView from '../views/BugListView.vue'
import ComputerListview from '../views/ComputerListview.vue'
import DiaryListView from '../views/DiaryListView.vue'
import EssaysListView from '../views/EssaysListView.vue'
import HomeView from '../views/HomeView.vue'
import LearningListView from '../views/LearningListView.vue'
import ReadingListView from '../views/ReadingListView.vue'
import DetailView from '../views/DetailView.vue'

const routes = [
  { path: '/', component: HomeView },
  { path: '/about', component: AboutView },
  { path: '/bug', component: BugListView },
  { path: '/computer', component: ComputerListview },
  { path: '/diary', component: DiaryListView },
  { path: '/essays', component: EssaysListView },
  { path: '/home', component: HomeView },
  { path: '/learning', component: LearningListView },
  { path: '/reading', component: ReadingListView },
  { path: '/:category/:id', component: DetailView },
]

const base = '/'

const router = createRouter({
  history: createWebHistory(base), 
  routes,
})

export default router
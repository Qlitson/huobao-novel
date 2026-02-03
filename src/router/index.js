import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomeView.vue')
  },
  {
    path: '/project/:id',
    name: 'Project',
    component: () => import('../views/ProjectView.vue')
  }
]

const router = createRouter({
  history: createWebHistory("/huobao-novel"),
  routes
})

export default router

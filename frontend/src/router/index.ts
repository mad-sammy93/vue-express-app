import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '@/views/DashboardView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
      meta: {
        title: 'Dashboard',
      },
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
      meta: {
        title: 'About',
      },
    },
    {
      path: '/sessions/:id',
      name: 'session-details',
      component: () => import('@/views/SessionDetailsView.vue'),
      meta: {
        title: 'Session details',
      },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
      meta: {
        title: 'Page not found',
      },
    },
  ],
})

router.afterEach((to, _from, failure) => {
  if (failure) return

  document.title = to.meta.title ? `${to.meta.title} | Vue Skill Lab` : 'Vue Skill Lab'
})

export default router

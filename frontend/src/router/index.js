import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/Login.vue'
import DashboardView from '../views/Dashboard.vue'
import CarteiraView from '../views/Carteira.vue'
import OrdensView from '../views/Ordens.vue'
import AcoesView from '../views/Acoes.vue'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardView,
    meta: { requiresAuth: true }
  },
  {
    path: '/carteira',
    name: 'Carteira',
    component: CarteiraView,
    meta: { requiresAuth: true }
  },
  {
    path: '/ordens',
    name: 'Ordens',
    component: OrdensView,
    meta: { requiresAuth: true }
  },
  {
    path: '/acoes',
    name: 'Acoes',
    component: AcoesView,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// Guarda de rota para verificar autenticação
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  
  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router 
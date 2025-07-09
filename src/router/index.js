import { createRouter, createWebHistory } from 'vue-router'
import { isAuthenticated, getCurrentUser } from '../utils/auth.js'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import AdminLogin from '../views/AdminLogin.vue'
import Admin from '../views/Admin.vue'
import App from '../App.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: Login,
      meta: { requiresAuth: false }
    },
    {
      path: '/register',
      name: 'register',
      component: Register,
      meta: { requiresAuth: false }
    },
    {
      path: '/admin-login',
      name: 'admin-login',
      component: AdminLogin,
      meta: { requiresAuth: false }
    },
    {
      path: '/admin',
      name: 'admin',
      component: Admin,
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/',
      name: 'home',
      component: () => import('../views/Home.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/Home.vue'),
      meta: { requiresAuth: true }
    },
    // 重定向到登录页面
    {
      path: '/logout',
      redirect: '/login'
    },
    // 404 页面
    {
      path: '/:pathMatch(.*)*',
      redirect: '/login'
    }
  ],
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const authRequired = to.meta.requiresAuth !== false
  const adminRequired = to.meta.requiresAdmin === true
  const userIsAuthenticated = isAuthenticated()
  const currentUser = getCurrentUser()

  console.log('Navigation to:', to.path)
  console.log('Auth required:', authRequired)
  console.log('Admin required:', adminRequired)
  console.log('User authenticated:', userIsAuthenticated)
  console.log('Current user:', currentUser)

  if (authRequired && !userIsAuthenticated) {
    // 需要认证但用户未登录，重定向到相应的登录页
    if (adminRequired) {
      console.log('Redirecting to admin login...')
      next('/admin-login')
    } else {
      console.log('Redirecting to login...')
      next('/login')
    }
  } else if (adminRequired && (!currentUser || currentUser.role !== 'admin')) {
    // 需要管理员权限但用户不是管理员
    console.log('Access denied: admin privileges required')
    next('/admin-login')
  } else if (to.path === '/login' && userIsAuthenticated) {
    // 已登录用户访问登录页，重定向到首页
    console.log('User already logged in, redirecting to home...')
    next('/')
  } else if (to.path === '/admin-login' && userIsAuthenticated && currentUser?.role === 'admin') {
    // 已登录管理员访问管理员登录页，重定向到管理员页面
    console.log('Admin already logged in, redirecting to admin dashboard...')
    next('/admin')
  } else {
    // 允许访问
    next()
  }
})

export default router

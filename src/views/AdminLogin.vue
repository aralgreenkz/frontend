<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { login, getCurrentUser } from '../utils/auth.js'

const router = useRouter()

// 表单数据
const formData = reactive({
  username: '@admin',
  password: ''
})

// 状态管理
const isLoading = ref(false)
const errorMessage = ref('')

// 登录处理
const handleLogin = async () => {
  if (!formData.username || !formData.password) {
    errorMessage.value = 'Please fill in all fields'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    // 调用真实API登录
    const response = await login({
      username: formData.username,
      password: formData.password
    })
    
    console.log('Login response:', response)
    
    // 获取用户信息，支持多种数据结构
    let user = null
    if (response.data?.user) {
      user = response.data.user
    } else if (response.user) {
      user = response.user
    } else {
      // 尝试从localStorage获取用户信息
      const currentUser = getCurrentUser()
      if (currentUser) {
        user = currentUser
      }
    }
    
    console.log('User data:', user)
    
    // 验证是否为管理员
    if (!user || !user.role || user.role !== 'admin') {
      console.log('Access denied. User role:', user?.role)
      errorMessage.value = 'Access denied. Administrator privileges required.'
      return
    }
    
    console.log('Admin login successful')
    // 登录成功，跳转到管理员页面
    router.push('/admin')
  } catch (error) {
    console.error('Login error:', error)
    errorMessage.value = error.message || 'Login failed. Please try again.'
  } finally {
    isLoading.value = false
  }
}

// 处理忘记密码
const handleForgotPassword = () => {
  alert('Please contact system administrator for password reset')
}

// 处理返回普通登录
const handleBackToLogin = () => {
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-white flex items-center justify-center px-4">
    <div class="max-w-md w-full">
      <!-- 登录卡片 -->
      <div class="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <!-- 标题和Logo - 左右分布 -->
        <div class="flex items-center justify-between mb-8 px-2">
          <!-- 标题 - 左侧 -->
          <div class="text-left">
            <h1 class="text-3xl font-bold text-gray-900 mb-1">Admin Login</h1>
            <p class="text-gray-600">Administrator Access</p>
          </div>
          
          <!-- Logo - 右侧 -->
          <div class="flex-shrink-0">
            <img src="/logo.png" alt="Aral Green Logo" class="h-16 w-16 mr-8 object-contain logo-scale" />
          </div>
        </div>

        <!-- 管理员提示 -->
        <div class="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-blue-600 text-sm">
          <div class="flex items-center">
            <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
            Administrator access only. Please use your admin credentials.
          </div>
        </div>

        <!-- 错误信息 -->
        <div v-if="errorMessage" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {{ errorMessage }}
        </div>

        <!-- 表单 -->
        <form @submit.prevent="handleLogin" class="space-y-6">
          <!-- 用户名输入 -->
          <div>
            <label for="username" class="block text-sm font-medium text-gray-700 mb-2">
              Admin Username
            </label>
            <div class="relative">
              <input
                id="username"
                v-model="formData.username"
                type="text"
                required
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors custom-focus"
                placeholder="@admin"
              />
              <div v-if="formData.username === '@admin'" class="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20" style="color: #80cc4d;">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
              </div>
            </div>
          </div>

          <!-- 密码输入 -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              v-model="formData.password"
              type="password"
              required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors custom-focus"
              placeholder="••••••••••"
            />
          </div>

          <!-- 忘记密码链接 -->
          <div class="text-left">
            <button
              type="button"
              @click="handleForgotPassword"
              class="text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Forgot password?
            </button>
          </div>

          <!-- 登录按钮 -->
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
            style="background-color: #80cc4d; &:hover { background-color: #70b83d; } &:disabled { background-color: #a0d66d; }"
          >
            <svg v-if="isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isLoading ? 'Logging in...' : 'Admin Login' }}
            <svg v-if="!isLoading" class="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </form>

        <!-- 返回普通登录 -->
        <div class="mt-6 text-center">
          <span class="text-gray-600 text-sm">Not an administrator? </span>
          <button
            @click="handleBackToLogin"
            class="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
          >
            User Login
          </button>
        </div>


      </div>
    </div>
  </div>
</template>

<style scoped>
/* Logo样式 */
.logo-scale {
  transform: scale(3.5);
  filter: brightness(1.1) contrast(1.1);
}

/* 自定义输入框焦点样式 */
.custom-focus:focus {
  --tw-ring-color: #80cc4d !important;
  border-color: #80cc4d !important;
  color: #80cc4d !important;
}

/* 确保ring颜色生效 */
.custom-focus:focus {
  box-shadow: 0 0 0 2px rgba(128, 204, 77, 0.2) !important;
}

/* 登录按钮样式 */
button[type="submit"] {
  background-color: #80cc4d !important;
}

button[type="submit"]:hover:not(:disabled) {
  background-color: #70b83d !important;
}

button[type="submit"]:disabled {
  background-color: #a0d66d !important;
}
</style> 
<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { register } from '../utils/auth.js'

const router = useRouter()

// 表单数据
const formData = reactive({
  username: '',
  password: '',
  confirmPassword: ''
})

// 状态管理
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// 验证密码
const validatePasswords = () => {
  if (formData.password !== formData.confirmPassword) {
    errorMessage.value = 'Passwords do not match'
    return false
  }
  if (formData.password.length < 6) {
    errorMessage.value = 'Password must be at least 6 characters long'
    return false
  }
  return true
}

// 验证用户名
const validateUsername = () => {
  if (!formData.username.startsWith('@')) {
    errorMessage.value = 'Username must start with @'
    return false
  }
  if (formData.username.length < 3) {
    errorMessage.value = 'Username must be at least 3 characters long'
    return false
  }
  return true
}

// 注册处理
const handleRegister = async () => {
  if (!formData.username || !formData.password || !formData.confirmPassword) {
    errorMessage.value = 'Please fill in all fields'
    return
  }

  if (!validateUsername() || !validatePasswords()) {
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    // 调用真实API注册
    const response = await register({
      username: formData.username,
      password: formData.password,
      confirmPassword: formData.confirmPassword
    })
    
    if (response.success) {
      successMessage.value = 'Registration successful! Redirecting to login...'
      
      // 延迟后跳转到登录页面
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } else {
      errorMessage.value = response.message || 'Registration failed'
    }
    
  } catch (error) {
    errorMessage.value = error.message || 'Registration failed. Please try again.'
    successMessage.value = ''
  } finally {
    isLoading.value = false
  }
}

// 返回登录页面
const goToLogin = () => {
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
    <div class="max-w-md w-full">
      <!-- 注册卡片 -->
      <div class="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <!-- 标题和Logo - 左右分布 -->
        <div class="flex items-center justify-between mb-8 px-2">
          <!-- 标题 - 左侧 -->
          <div class="text-left">
            <h1 class="text-3xl font-bold text-gray-900 mb-1">Sign up</h1>
            <p class="text-gray-600">create your account</p>
          </div>
          
          <!-- Logo - 右侧 -->
          <div class="flex-shrink-0">
            <img src="/logo.png" alt="Aral Green Logo" class="h-16 w-16 object-contain logo-scale" />
          </div>
        </div>

        <!-- 成功信息 -->
        <div v-if="successMessage" class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {{ successMessage }}
        </div>

        <!-- 错误信息 -->
        <div v-if="errorMessage" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {{ errorMessage }}
        </div>

        <!-- 表单 -->
        <form @submit.prevent="handleRegister" class="space-y-6">
          <!-- 用户名输入 -->
          <div>
            <label for="username" class="block text-sm font-medium text-gray-700 mb-2">
              Twitter handle
            </label>
            <div class="relative">
              <input
                id="username"
                v-model="formData.username"
                type="text"
                required
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors custom-focus"
                placeholder="@username"
              />
              <div v-if="formData.username && formData.username.startsWith('@') && formData.username.length >= 3" 
                   class="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
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
            <div class="relative">
              <input
                id="password"
                v-model="formData.password"
                type="password"
                required
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors custom-focus"
                placeholder="••••••••••"
              />
              <div v-if="formData.password && formData.password.length >= 6" 
                   class="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
              </div>
            </div>
            <p class="text-xs text-gray-500 mt-1">Password must be at least 6 characters long</p>
          </div>

          <!-- 确认密码输入 -->
          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <div class="relative">
              <input
                id="confirmPassword"
                v-model="formData.confirmPassword"
                type="password"
                required
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors custom-focus"
                placeholder="••••••••••"
              />
              <div v-if="formData.confirmPassword && formData.password === formData.confirmPassword && formData.password.length >= 6" 
                   class="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
              </div>
              <div v-else-if="formData.confirmPassword && formData.password !== formData.confirmPassword" 
                   class="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg class="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                </svg>
              </div>
            </div>
          </div>

          <!-- 注册按钮 -->
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
          >
            <svg v-if="isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isLoading ? 'Creating account...' : 'Create account' }}
            <svg v-if="!isLoading" class="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </form>

        <!-- 登录链接 -->
        <div class="mt-6 text-center">
          <span class="text-gray-600 text-sm">Already have an account? </span>
          <button
            @click="goToLogin"
            class="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
          >
            Log in here!
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Logo样式 */
.logo-scale {
  transform: scale(3.0);
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
</style> 
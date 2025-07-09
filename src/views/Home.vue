<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { dataManager } from '../utils/apiManager.js'
import { getCurrentUser, logout } from '../utils/auth.js'
import InputPanel from '../components/InputPanel.vue'
import EfficiencyPanel from '../components/EfficiencyPanel.vue'
import GraphPanel from '../components/GraphPanel.vue'
import DataManagement from '../components/DataManagement.vue'

const router = useRouter()

const data = ref([])
const activeTab = ref('input')
const dataVersion = ref(0) // Force refresh component
const currentUser = ref(null)

onMounted(async () => {
  currentUser.value = getCurrentUser()
  await loadData()
})

const loadData = async () => {
  await dataManager.initialize()
  data.value = await dataManager.getData()
  console.log('📊 Data loaded, entries:', data.value.length)
}

const onDataSaved = async (eventData) => {
  console.log('🔄 Received data save event:', eventData)
  
  // Force refresh data
  await loadData()
  
  // Increment version number to force child component re-render
  dataVersion.value++
  
  console.log('✅ Data refreshed, current version:', dataVersion.value)
}

const onDataUpdated = async () => {
  console.log('🔄 Received data update event')
  // DataManagement组件已经自己处理了数据更新，这里只需要更新其他组件的数据
  await loadData()
  dataVersion.value++
  console.log('✅ Data refreshed for other components, current version:', dataVersion.value)
}

// 登出处理
const handleLogout = async () => {
  try {
    await logout()
    router.push('/login')
  } catch (error) {
    console.error('Logout error:', error)
    // 即使出错也要跳转到登录页
    router.push('/login')
  }
}

const tabs = [
  { id: 'input', name: 'Data Entry', icon: '📊' },
  { id: 'efficiency', name: 'Efficiency Analysis', icon: '⚡' },
  { id: 'charts', name: 'Data Visualization', icon: '📈' },
  { id: 'management', name: 'Data Management', icon: '🗂️' }
]
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
    <!-- Header -->
    <header class="bg-white shadow-lg border-b-4" style="border-bottom-color: #80cc4d;">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-6">
          <div class="flex items-center">
            <div class="text-3xl font-bold text-green-600">🌱</div>
            <div class="ml-3">
              <h1 class="text-3xl font-bold text-gray-800">EcoMetrics</h1>
              <p class="text-sm text-gray-600">Water & Power Monitoring and Efficiency Analysis Platform</p>
            </div>
          </div>
          <div class="flex items-center space-x-8">
            <!-- 用户信息 -->
            <div v-if="currentUser" class="flex items-center space-x-4">
              <div class="text-right">
                <div class="text-sm font-medium text-gray-700">{{ currentUser.username }}</div>
                <div class="text-xs text-gray-500">{{ currentUser.role || 'User' }}</div>
              </div>
              <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span class="text-green-600 font-medium">{{ currentUser.username.charAt(1).toUpperCase() }}</span>
              </div>
              <button
                @click="handleLogout"
                class="text-sm text-gray-500 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-gray-100"
                title="Logout"
              >
                🚪 Logout
              </button>
            </div>
            
            <div class="w-16 h-16 flex justify-center items-center overflow-visible">
              <img src="/logo.png" alt="Logo" class="h-16 w-16 object-contain" style="transform: scale(3.0); filter: brightness(1.1) contrast(1.1);" />
            </div>
            <div class="text-sm text-gray-500 ml-4">
              {{ new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }) }}
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Navigation Tabs -->
    <nav class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex space-x-8">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200',
              activeTab === tab.id
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            <span class="mr-2">{{ tab.icon }}</span>
            {{ tab.name }}
          </button>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Input Panel -->
      <div v-show="activeTab === 'input'">
        <InputPanel @data-saved="onDataSaved" />
      </div>

      <!-- Efficiency Panel -->
      <div v-show="activeTab === 'efficiency'">
        <EfficiencyPanel :data="data" :key="`efficiency-${dataVersion}`" />
      </div>

      <!-- Charts Panel -->
      <div v-show="activeTab === 'charts'">
        <GraphPanel :data="data" :key="`charts-${dataVersion}`" />
      </div>

      <!-- Data Management Panel -->
      <div v-show="activeTab === 'management'">
        <DataManagement @data-updated="onDataUpdated" />
      </div>
    </main>

    <!-- Footer -->
    <footer class="bg-gray-800 text-white py-8 mt-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Upper Section - Main Content -->
        <div class="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8">
          <!-- Left side - Logo Area -->
          <div class="flex justify-center items-center mb-6 lg:mb-0 lg:flex-1">
            <img src="/logo.png" alt="Aral Green Logo" class="h-24 w-24 object-contain" style="transform: scale(3.0); filter: brightness(1.1) contrast(1.1);" />
          </div>
          
          <!-- Right side - Content Area -->
          <div class="text-center lg:flex-1">
            <h3 class="text-lg font-semibold mb-2">EcoMetrics Platform</h3>
            <p class="text-gray-400 text-sm">
              Monitor water and power efficiency for a sustainable future
            </p>
            <div class="mt-4 flex justify-center space-x-6 text-sm text-gray-400">
              <span>🌍 Eco-friendly</span>
              <span>📊 Data-driven</span>
              <span>⚡ Energy efficient</span>
              <span>💧 Sustainable development</span>
            </div>
          </div>
        </div>
        
        <!-- Lower Section - Copyright -->
        <div class="pt-6 border-t border-gray-600 text-center">
          <div class="text-xs text-gray-500">
            <div>© Aral Green LLP, All rights reserved.</div>
            <div>© ТОО "Aral Green", Все права защищены.</div>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Additional styles can be added here if needed */
</style> 
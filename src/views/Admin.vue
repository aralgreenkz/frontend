<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { logout, getCurrentUser } from '../utils/auth.js'
import { apiManager } from '../utils/apiManager.js'

const router = useRouter()

// 状态管理
const isLoading = ref(false)
const logs = ref([])
const currentUser = ref(null)
const errorMessage = ref('')
const expandedLogs = ref(new Set())

// 分页和过滤
const currentPage = ref(1)
const pageSize = ref(20)
const totalPages = ref(0)
const totalCount = ref(0)

// 过滤条件
const filters = reactive({
  action: '',
  username: '',
  startDate: '',
  endDate: ''
})

// 计算属性
const filteredLogs = computed(() => {
  return logs.value.filter(log => {
    const matchAction = !filters.action || log.action.toLowerCase().includes(filters.action.toLowerCase())
    const matchUsername = !filters.username || log.username.toLowerCase().includes(filters.username.toLowerCase())
    const matchStartDate = !filters.startDate || new Date(log.createdAt) >= new Date(filters.startDate)
    const matchEndDate = !filters.endDate || new Date(log.createdAt) <= new Date(filters.endDate + 'T23:59:59')
    
    return matchAction && matchUsername && matchStartDate && matchEndDate
  })
})

const paginatedLogs = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredLogs.value.slice(start, end)
})

// 获取日志数据
const fetchLogs = async () => {
  isLoading.value = true
  errorMessage.value = ''
  
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value
    }
    
    const response = await apiManager.getLogs(params)
    logs.value = response.logs || []
    totalCount.value = response.pagination?.total || 0
    totalPages.value = response.pagination?.pages || 0
  } catch (error) {
    console.error('获取日志失败:', error)
    errorMessage.value = 'Failed to load logs: ' + error.message
  } finally {
    isLoading.value = false
  }
}

// 格式化日期
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

// 获取操作类型的颜色
const getActionColor = (action) => {
  switch (action) {
    case 'CREATE':
      return 'text-green-600 bg-green-50'
    case 'UPDATE':
      return 'text-blue-600 bg-blue-50'
    case 'DELETE':
      return 'text-red-600 bg-red-50'
    case 'LOGIN':
      return 'text-purple-600 bg-purple-50'
    case 'LOGOUT':
      return 'text-gray-600 bg-gray-50'
    default:
      return 'text-gray-600 bg-gray-50'
  }
}

// 切换日志详情展开状态
const toggleLogDetails = (logId) => {
  if (expandedLogs.value.has(logId)) {
    expandedLogs.value.delete(logId)
  } else {
    expandedLogs.value.add(logId)
  }
}

// 格式化JSON数据显示
const formatJsonData = (data) => {
  if (!data) return null
  try {
    return JSON.stringify(data, null, 2)
  } catch (e) {
    return String(data)
  }
}

// 获取数据变化的对比
const getDataChanges = (oldData, newData) => {
  if (!oldData || !newData) return []
  
  const changes = []
  const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)])
  
  for (const key of allKeys) {
    const oldValue = oldData[key]
    const newValue = newData[key]
    
    if (oldValue !== newValue) {
      changes.push({
        field: key,
        oldValue: oldValue,
        newValue: newValue
      })
    }
  }
  
  return changes
}

// 获取友好的字段名称
const getFieldDisplayName = (fieldName) => {
  const fieldMap = {
    'date': 'Date',
    'powerConsumption': 'Power Consumption (kWh)',
    'drinkingWater': 'Drinking Water (L)',
    'irrigationWater': 'Irrigation Water (L)',
    'electricityPrice': 'Electricity Price (KZT/kWh)',
    'username': 'Username',
    'role': 'Role',
    'password': 'Password',
    'created_at': 'Created At',
    'updated_at': 'Updated At'
  }
  
  return fieldMap[fieldName] || fieldName
}

// 格式化显示值
const formatDisplayValue = (value, fieldName) => {
  if (value === null || value === undefined) return 'N/A'
  
  // 敏感字段处理
  if (fieldName === 'password') return '***'
  
  // 数值字段格式化
  if (typeof value === 'number') {
    if (fieldName === 'electricityPrice') {
      return `${value.toFixed(2)} KZT/kWh`
    }
    if (['powerConsumption', 'drinkingWater', 'irrigationWater'].includes(fieldName)) {
      return `${value.toFixed(1)} ${fieldName === 'powerConsumption' ? 'kWh' : 'L'}`
    }
    return value.toString()
  }
  
  return value.toString()
}

// 清空过滤条件
const clearFilters = () => {
  filters.action = ''
  filters.username = ''
  filters.startDate = ''
  filters.endDate = ''
  currentPage.value = 1
}

// 导出日志
const exportLogs = () => {
  const csvContent = [
    ['Time', 'User', 'Action', 'Table', 'Description', 'IP Address'].join(','),
    ...filteredLogs.value.map(log => [
      formatDate(log.createdAt),
      log.username,
      log.action,
      log.tableName || '',
      log.description || '',
      log.ipAddress || ''
    ].map(field => `"${field}"`).join(','))
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `admin_logs_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// 处理登出
const handleLogout = async () => {
  if (confirm('Are you sure you want to logout?')) {
    try {
      await logout()
      router.push('/admin-login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }
}

// 页面加载
onMounted(async () => {
  currentUser.value = getCurrentUser()
  
  // 验证管理员权限
  if (!currentUser.value || currentUser.value.role !== 'admin') {
    router.push('/admin-login')
    return
  }
  
  // 确保日期输入框使用英文格式
  document.documentElement.lang = 'en'
  
  await fetchLogs()
})

// 监听分页变化
const handlePageChange = (page) => {
  currentPage.value = page
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 头部导航 -->
    <nav class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- 左侧标题 -->
          <div class="flex items-center">
            <img src="/logo.png" alt="Logo" class="h-8 w-8 mr-3" />
            <div>
              <h1 class="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
              <p class="text-sm text-gray-500">System Operation Logs</p>
            </div>
          </div>
          
          <!-- 右侧用户信息 -->
          <div class="flex items-center space-x-4">
            <div class="text-sm text-gray-700">
              Welcome, <span class="font-medium">{{ currentUser?.username }}</span>
            </div>
            <button
              @click="handleLogout"
              class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- 主要内容 -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- 过滤器 -->
      <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 class="text-lg font-medium text-gray-900 mb-4">Filter Logs</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Action</label>
            <select
              v-model="filters.action"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">All Actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <input
              v-model="filters.username"
              type="text"
              placeholder="Search by username..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              v-model="filters.startDate"
              type="date"
              lang="en"
              placeholder="yyyy-mm-dd"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              v-model="filters.endDate"
              type="date"
              lang="en"
              placeholder="yyyy-mm-dd"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>
        
        <div class="flex justify-between items-center mt-4">
          <div class="flex space-x-2">
            <button
              @click="clearFilters"
              class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Clear Filters
            </button>
            <button
              @click="fetchLogs"
              class="px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700"
            >
              Refresh
            </button>
          </div>
          
          <button
            @click="exportLogs"
            class="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
          >
            Export CSV
          </button>
        </div>
      </div>

      <!-- 错误信息 -->
      <div v-if="errorMessage" class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        {{ errorMessage }}
      </div>

      <!-- 日志列表 -->
      <div class="bg-white rounded-lg shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-medium text-gray-900">
            Operation Logs
            <span class="text-sm font-normal text-gray-500 ml-2">
              ({{ filteredLogs.length }} records)
            </span>
          </h2>
        </div>

        <!-- 加载状态 -->
        <div v-if="isLoading" class="p-8 text-center">
          <div class="inline-flex items-center">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-orange-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading logs...
          </div>
        </div>

        <!-- 日志表格 -->
        <div v-else-if="paginatedLogs.length > 0" class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <template v-for="log in paginatedLogs" :key="log.id">
                <!-- 主要日志行 -->
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ formatDate(log.createdAt) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {{ log.username }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span :class="getActionColor(log.action)" class="px-2 py-1 text-xs font-medium rounded-full">
                      {{ log.action }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ log.tableName || '-' }}
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {{ log.description || '-' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ log.ipAddress || '-' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      @click="toggleLogDetails(log.id)"
                      class="text-orange-600 hover:text-orange-800 font-medium"
                      v-if="log.oldData || log.newData"
                    >
                      {{ expandedLogs.has(log.id) ? 'Hide' : 'View' }} Details
                    </button>
                    <span v-else class="text-gray-400">-</span>
                  </td>
                </tr>
                
                <!-- 详细信息行 -->
                <tr v-if="expandedLogs.has(log.id)" class="bg-gray-50">
                  <td colspan="7" class="px-6 py-4">
                    <div class="bg-white rounded-lg border border-gray-200 p-4 log-details">
                      <h4 class="text-lg font-medium text-gray-900 mb-4">Operation Details</h4>
                      
                      <!-- 基本信息 -->
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                          <h5 class="text-sm font-medium text-gray-700 mb-2">Basic Information</h5>
                          <div class="space-y-2 text-sm">
                            <div><span class="font-medium">Log ID:</span> {{ log.id }}</div>
                            <div><span class="font-medium">Record ID:</span> {{ log.recordId || 'N/A' }}</div>
                            <div><span class="font-medium">User ID:</span> {{ log.userId }}</div>
                            <div><span class="font-medium">Timestamp:</span> {{ formatDate(log.createdAt) }}</div>
                          </div>
                        </div>
                        <div>
                          <h5 class="text-sm font-medium text-gray-700 mb-2">Operation Context</h5>
                          <div class="space-y-2 text-sm">
                            <div><span class="font-medium">Action:</span> 
                              <span :class="getActionColor(log.action)" class="px-2 py-1 text-xs font-medium rounded-full ml-2">
                                {{ log.action }}
                              </span>
                            </div>
                            <div><span class="font-medium">Table:</span> {{ log.tableName || 'N/A' }}</div>
                            <div><span class="font-medium">IP Address:</span> {{ log.ipAddress || 'N/A' }}</div>
                          </div>
                        </div>
                      </div>
                      
                      <!-- 数据变化对比 (仅对UPDATE操作) -->
                      <div v-if="log.action === 'UPDATE' && log.oldData && log.newData" class="mb-6">
                        <h5 class="text-sm font-medium text-gray-700 mb-3">Data Changes</h5>
                        <div class="bg-gray-50 rounded-lg p-4">
                          <div v-for="change in getDataChanges(log.oldData, log.newData)" :key="change.field" 
                               class="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0 data-change-item">
                            <div class="font-medium text-gray-700">{{ getFieldDisplayName(change.field) }}</div>
                                                          <div class="flex items-center space-x-2">
                                <span class="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">{{ formatDisplayValue(change.oldValue, change.field) }}</span>
                                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                                </svg>
                                <span class="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">{{ formatDisplayValue(change.newValue, change.field) }}</span>
                              </div>
                          </div>
                        </div>
                      </div>
                      
                      <!-- 原始数据 -->
                      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <!-- 旧数据 -->
                        <div v-if="log.oldData">
                          <h5 class="text-sm font-medium text-gray-700 mb-2">Old Data</h5>
                          <div class="bg-red-50 border border-red-200 rounded-lg p-3">
                            <pre class="text-xs text-red-800 whitespace-pre-wrap">{{ formatJsonData(log.oldData) }}</pre>
                          </div>
                        </div>
                        
                        <!-- 新数据 -->
                        <div v-if="log.newData">
                          <h5 class="text-sm font-medium text-gray-700 mb-2">New Data</h5>
                          <div class="bg-green-50 border border-green-200 rounded-lg p-3">
                            <pre class="text-xs text-green-800 whitespace-pre-wrap">{{ formatJsonData(log.newData) }}</pre>
                          </div>
                        </div>
                      </div>
                      
                      <!-- 描述信息 -->
                      <div v-if="log.description" class="mt-4">
                        <h5 class="text-sm font-medium text-gray-700 mb-2">Description</h5>
                        <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p class="text-sm text-blue-800">{{ log.description }}</p>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <!-- 空状态 -->
        <div v-else class="p-8 text-center text-gray-500">
          No logs found matching the current filters.
        </div>

        <!-- 分页 -->
        <div v-if="totalPages > 1" class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div class="text-sm text-gray-500">
            Showing {{ (currentPage - 1) * pageSize + 1 }} to {{ Math.min(currentPage * pageSize, filteredLogs.length) }} of {{ filteredLogs.length }} results
          </div>
          <div class="flex space-x-2">
            <button
              @click="handlePageChange(1)"
              :disabled="currentPage === 1"
              class="px-3 py-1 text-sm bg-gray-200 text-gray-600 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              First
            </button>
            <button
              @click="handlePageChange(currentPage - 1)"
              :disabled="currentPage === 1"
              class="px-3 py-1 text-sm bg-gray-200 text-gray-600 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span class="px-3 py-1 text-sm text-gray-600">
              Page {{ currentPage }} of {{ totalPages }}
            </span>
            <button
              @click="handlePageChange(currentPage + 1)"
              :disabled="currentPage === totalPages"
              class="px-3 py-1 text-sm bg-gray-200 text-gray-600 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
            <button
              @click="handlePageChange(totalPages)"
              :disabled="currentPage === totalPages"
              class="px-3 py-1 text-sm bg-gray-200 text-gray-600 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Last
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 确保日期输入框使用英文格式 */
input[type="date"] {
  color-scheme: light;
  font-family: system-ui, -apple-system, sans-serif;
}

input[type="date"]::-webkit-datetime-edit-text,
input[type="date"]::-webkit-datetime-edit-month-field,
input[type="date"]::-webkit-datetime-edit-day-field,
input[type="date"]::-webkit-datetime-edit-year-field {
  color: #374151;
}

input[type="date"]::-webkit-calendar-picker-indicator {
  color: #6b7280;
  opacity: 1;
}

/* 自定义滚动条 */
.overflow-x-auto::-webkit-scrollbar {
  height: 6px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.overflow-x-auto::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 代码块样式 */
pre {
  font-family: 'Courier New', Courier, monospace;
  font-size: 11px;
  line-height: 1.4;
  max-height: 200px;
  overflow-y: auto;
}

/* 详细信息动画 */
.log-details {
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 数据变化对比样式 */
.data-change-item {
  transition: background-color 0.2s ease;
}

.data-change-item:hover {
  background-color: #f9fafb;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .grid-cols-1.md\\:grid-cols-2 {
    grid-template-columns: 1fr;
  }
  
  .log-details {
    padding: 1rem;
  }
  
  pre {
    font-size: 10px;
  }
}
</style> 
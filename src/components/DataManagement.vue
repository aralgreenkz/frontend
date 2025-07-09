<template>
  <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
    <h2 class="text-2xl font-bold text-gray-800 mb-6">Data Management</h2>
    
     <!-- Storage Info -->
     <div class="mb-4 p-4 bg-blue-50 rounded-lg">
       <h3 class="text-lg font-semibold text-blue-700 mb-2">Storage Information</h3>
       <p class="text-sm text-blue-600 mb-3">
         Data has been automatically loaded from JSON file to browser local storage. All changes will be saved in local storage, the original JSON file will not be modified.
       </p>
       <div class="flex flex-wrap gap-2">
         <button 
           @click="showStorageInfo"
           class="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
         >
           View Storage Status
         </button>
         <button 
           @click="resetLocalStorage"
           class="bg-orange-600 text-white px-3 py-1 rounded text-xs hover:bg-orange-700"
         >
           Reset Local Storage
         </button>
       </div>
     </div>

     <!-- Export Controls -->
     <div class="mb-6 flex flex-wrap gap-4">
       <button 
         @click="importFromFile"
         class="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition duration-200"
       >
         Import JSON File
       </button>
       <button 
         @click="exportData('csv')"
         class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200"
       >
         Export as CSV
       </button>
       <button 
         @click="exportData('json')"
         class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition duration-200"
       >
         Export as JSON
       </button>
       <button 
         @click="clearAllData"
         class="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition duration-200"
       >
         Clear All Data
       </button>
     </div>

    <!-- Data Table -->
    <div class="overflow-x-auto">
      <table class="min-w-full bg-white border border-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Power Consumption (kWh)</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Drinking Water (L)</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Irrigation Water (L)</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Electricity Price (KZT/kWh)</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Efficiency</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="(item, index) in paginatedData" :key="item.date" class="hover:bg-gray-50">
            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
              {{ formatDate(item.date) }}
            </td>
            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
              {{ item.powerConsumption }}
            </td>
            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
              {{ item.drinkingWater }}
            </td>
            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
              {{ item.irrigationWater }}
            </td>
            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
              {{ item.electricityPrice }}
            </td>
            <td class="px-4 py-2 whitespace-nowrap text-sm">
              <span :class="getEfficiencyColor(calculateEfficiency(item))">
                {{ calculateEfficiency(item).toFixed(4) }} kWh/L
              </span>
            </td>
            <td class="px-4 py-2 whitespace-nowrap text-sm font-medium">
              <button 
                @click="editItem(index)"
                class="text-blue-600 hover:text-blue-900 mr-2"
              >
                Edit
              </button>
              <button 
                @click="deleteItem(index)"
                class="text-red-600 hover:text-red-900"
              >
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="mt-6 flex items-center justify-between">
      <div class="text-sm text-gray-500">
        Showing {{ (currentPage - 1) * pageSize + 1 }} to {{ Math.min(currentPage * pageSize, sortedData.length) }} of {{ sortedData.length }} records
      </div>
      <div class="flex items-center space-x-2">
        <button 
          @click="currentPage = 1"
          :disabled="currentPage === 1"
          class="px-3 py-1 text-sm bg-gray-200 text-gray-600 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          First
        </button>
        <button 
          @click="currentPage--"
          :disabled="currentPage === 1"
          class="px-3 py-1 text-sm bg-gray-200 text-gray-600 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span class="px-3 py-1 text-sm text-gray-600">
          Page {{ currentPage }} / {{ totalPages }}
        </span>
        <button 
          @click="currentPage++"
          :disabled="currentPage === totalPages"
          class="px-3 py-1 text-sm bg-gray-200 text-gray-600 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
        <button 
          @click="currentPage = totalPages"
          :disabled="currentPage === totalPages"
          class="px-3 py-1 text-sm bg-gray-200 text-gray-600 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Last
        </button>
      </div>
    </div>

    <!-- No Data Message -->
    <div v-if="sortedData.length === 0" class="text-center py-8 text-gray-500">
      No data available. Please start adding records in the Data Entry panel.
    </div>

    <!-- Edit Modal -->
    <div v-if="editingItem" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold mb-4">Edit Data Entry</h3>
        
        <form @submit.prevent="saveEdit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input 
              type="date" 
              v-model="editingItem.date"
              lang="en"
              placeholder="yyyy-mm-dd"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Power Consumption (kWh)</label>
            <input 
              type="number" 
              v-model.number="editingItem.powerConsumption"
              min="0"
              step="0.01"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Drinking Water (L)</label>
            <input 
              type="number" 
              v-model.number="editingItem.drinkingWater"
              min="0"
              step="0.1"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Irrigation Water (L)</label>
            <input 
              type="number" 
              v-model.number="editingItem.irrigationWater"
              min="0"
              step="0.1"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Electricity Price (KZT/kWh)</label>
            <input 
              type="number" 
              v-model.number="editingItem.electricityPrice"
              min="0"
              step="0.01"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div class="flex space-x-4">
            <button 
              type="submit"
              class="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition duration-200"
            >
              Save Changes
            </button>
            <button 
              type="button"
              @click="cancelEdit"
              class="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { dataManager } from '../utils/apiManager.js'

const emit = defineEmits(['data-updated'])

const allData = ref([])
const editingItem = ref(null)
const editingIndex = ref(-1)

// Pagination related
const currentPage = ref(1)
const pageSize = ref(10)

onMounted(async () => {
  await loadData()
})

const loadData = async () => {
  await dataManager.initialize()
  allData.value = await dataManager.getData()
}

const sortedData = computed(() => {
  return [...allData.value].sort((a, b) => new Date(b.date) - new Date(a.date))
})

// Pagination calculations
const totalPages = computed(() => {
  return Math.ceil(sortedData.value.length / pageSize.value)
})

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return sortedData.value.slice(start, end)
})

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}

const calculateEfficiency = (item) => {
  const totalWater = (item.drinkingWater || 0) + (item.irrigationWater || 0)
  if (totalWater === 0) return 0
  return (item.powerConsumption || 0) / totalWater
}

const getEfficiencyColor = (efficiency) => {
  if (efficiency < 0.02) return 'text-green-600'
  if (efficiency > 0.05) return 'text-red-600'
  return 'text-yellow-600'
}

const editItem = (index) => {
  const item = paginatedData.value[index]
  const originalIndex = allData.value.findIndex(dataItem => dataItem.date === item.date)
  editingIndex.value = originalIndex
  editingItem.value = { ...allData.value[originalIndex] }
}

const saveEdit = async () => {
  if (editingIndex.value >= 0) {
    try {
      const item = allData.value[editingIndex.value]
      // 使用记录ID进行更新（API模式）或使用索引（本地模式）
      const identifier = item.id || editingIndex.value
      const success = await dataManager.updateEntry(identifier, { ...editingItem.value })
      if (success) {
        // 重新获取数据
        allData.value = await dataManager.getData()
        emit('data-updated')
      } else {
        alert('Failed to update data, please try again.')
      }
    } catch (error) {
      console.error('Error updating data:', error)
      alert('Error updating data: ' + error.message)
    }
  }
  cancelEdit()
}

const cancelEdit = () => {
  editingItem.value = null
  editingIndex.value = -1
}

const deleteItem = async (index) => {
  if (confirm('Are you sure you want to delete this record?')) {
    try {
      // 保存当前页码
      const currentPageBackup = currentPage.value
      
      const item = paginatedData.value[index]
      const originalIndex = allData.value.findIndex(dataItem => dataItem.date === item.date)
      const originalItem = allData.value[originalIndex]
      
      // 使用记录ID进行删除（API模式）或使用索引（本地模式）
      const identifier = originalItem.id || originalIndex
      const success = await dataManager.deleteEntry(identifier)
      if (success) {
        // 重新获取数据
        allData.value = await dataManager.getData()
        emit('data-updated')
        
        // 计算删除后的总页数
        const newTotalPages = Math.ceil(allData.value.length / pageSize.value)
        
        // 如果当前页超过了新的总页数，跳转到最后一页
        if (currentPageBackup > newTotalPages && newTotalPages > 0) {
          currentPage.value = newTotalPages
        } else {
          // 否则保持在原来的页码
          currentPage.value = currentPageBackup
        }
        
        // 如果没有数据了，重置到第一页
        if (allData.value.length === 0) {
          currentPage.value = 1
        }
      } else {
        alert('Failed to delete data, please try again.')
      }
    } catch (error) {
      console.error('Error deleting data:', error)
      alert('Error deleting data: ' + error.message)
    }
  }
}

const clearAllData = async () => {
  if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
    try {
      const success = await dataManager.clearAllData()
      if (success) {
        allData.value = await dataManager.getData()
        currentPage.value = 1  // 清空所有数据后重置到第一页
        emit('data-updated')
      } else {
        alert('Failed to clear data, please try again.')
      }
    } catch (error) {
      console.error('Error clearing data:', error)
      alert('Error clearing data: ' + error.message)
    }
  }
}

const importFromFile = async () => {
  try {
    // 创建文件输入元素
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    
    input.onchange = async (event) => {
      const file = event.target.files[0]
      if (!file) return
      
      try {
        const text = await file.text()
        const data = JSON.parse(text)
        
        let records = []
        
        // 支持两种格式：
        // 1. 直接的数组格式 [...]
        // 2. 带有records字段的对象格式 { records: [...], metadata: {...} }
        if (Array.isArray(data)) {
          records = data
        } else if (data && Array.isArray(data.records)) {
          records = data.records
        } else {
          alert('Invalid file format. Please select a valid JSON file with records array.')
          return
        }
        
        if (records.length === 0) {
          alert('No records found in the file.')
          return
        }
        
        // 转换数据格式，只保留后端需要的字段
        const formattedRecords = records.map(record => ({
          date: record.date,
          powerConsumption: record.powerConsumption,
          drinkingWater: record.drinkingWater,
          irrigationWater: record.irrigationWater,
          electricityPrice: record.electricityPrice
        }))
        
        const success = await dataManager.importData(formattedRecords, true) // 覆盖已存在的记录
        if (success) {
          allData.value = await dataManager.getData()
          currentPage.value = 1  // 导入数据后重置到第一页
          emit('data-updated')
          alert(`Data imported successfully! ${records.length} records processed.`)
        }
      } catch (error) {
        console.error('Error importing data:', error)
        alert('Error importing data: ' + error.message)
      }
    }
    
    input.click()
  } catch (error) {
    console.error('Error importing data:', error)
    alert('Error importing data: ' + error.message)
  }
}

const exportData = async (format) => {
  if (allData.value.length === 0) {
    alert('No data to export!')
    return
  }

  try {
    // Generate filename: DataManagement_YYYY-M-D.extension
    const currentDate = new Date()
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth() + 1
    const day = currentDate.getDate()
    const dateString = `${year}-${month}-${day}`
    
    const extension = format === 'json' ? '.json' : '.csv'
    const filename = `DataManagement_${dateString}${extension}`
    
    await dataManager.exportData(format, filename)
    alert(`Data exported successfully as ${format.toUpperCase()} format!`)
  } catch (error) {
    console.error('Error exporting data:', error)
    alert('Error exporting data: ' + error.message)
  }
}

const showStorageInfo = () => {
  const data = localStorage.getItem('ecoMetricsData')
  const price = localStorage.getItem('ecoMetricsElectricityPrice')
  const initialized = localStorage.getItem('ecoMetricsInitialized')
  
  let info = `🗃️ localStorage Storage Status:\n\n`
  info += `✅ Initialization Status: ${initialized === 'true' ? 'Initialized' : 'Not Initialized'}\n`
  info += `💰 Electricity Price: ${price || 'Not Set'}\n`
  info += `📊 Data Entries: ${data ? JSON.parse(data).length : 0} entries\n`
  info += `💾 Storage Size: ${data ? (new Blob([data]).size / 1024).toFixed(2) + ' KB' : '0 KB'}\n\n`
  
  if (data) {
    const parsedData = JSON.parse(data)
    if (parsedData.length > 0) {
      info += `📅 Date Range: ${parsedData[0].date} to ${parsedData[parsedData.length - 1].date}\n`
    }
  }
  
  alert(info)
}

const resetLocalStorage = async () => {
  if (confirm('Are you sure you want to reset local storage? This will clear all saved data and reload from the JSON file.')) {
    try {
      // Clear localStorage data
      localStorage.removeItem('ecoMetricsData')
      localStorage.removeItem('ecoMetricsElectricityPrice')
      localStorage.removeItem('ecoMetricsInitialized')
      
      // Re-initialize
        await dataManager.initialize()
  allData.value = await dataManager.getData()
      currentPage.value = 1  // 重置本地存储后回到第一页
      emit('data-updated')
      
      alert('Local storage has been reset and data reloaded!')
    } catch (error) {
      console.error('Error resetting localStorage:', error)
      alert('Reset failed: ' + error.message)
    }
  }
}
</script> 
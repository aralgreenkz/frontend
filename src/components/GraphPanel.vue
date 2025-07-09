<template>
  <div class="bg-white rounded-lg shadow-lg p-6">
    <h2 class="text-2xl font-bold text-gray-800 mb-6">Data Visualization</h2>
    
    <!-- Data range tip -->
    <div class="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
      <p class="text-sm text-blue-700">
        <i class="fas fa-info-circle mr-2"></i>
        Showing 30-day data window (Total {{ allData.length }} records)   
      </p>
    </div>
    
    <div class="space-y-8">
      <!-- Power Consumption Trend -->
      <div class="bg-gray-50 rounded-lg p-4">
        <h3 class="text-lg font-semibold text-gray-700 mb-4">Daily Power Consumption Trend</h3>
        <div class="h-64">
          <Line :data="powerChartData" :options="chartOptions" />
        </div>
        <!-- Navigation slider -->
        <div class="mt-4 pt-4 border-t border-gray-200">
                     <div class="flex items-center space-x-4">
             <span class="text-sm text-gray-600 whitespace-nowrap">Time Range:</span>
             <div class="flex-1">
               <input 
                 type="range" 
                 v-model="powerCurrentIndex"
                 :min="0" 
                 :max="Math.max(0, allData.length - 30)"
                 :step="1"
                 class="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer slider"
               />
             
            </div>
          </div>
        </div>
      </div>

      <!-- Water Usage Comparison -->
      <div class="bg-gray-50 rounded-lg p-4">
        <h3 class="text-lg font-semibold text-gray-700 mb-4">Water Usage Comparison: Drinking Water vs Irrigation Water</h3>
        <div class="h-64">
          <Bar :data="waterChartData" :options="chartOptions" />
        </div>
        <!-- Navigation slider -->
        <div class="mt-4 pt-4 border-t border-gray-200">
                     <div class="flex items-center space-x-4">
             <span class="text-sm text-gray-600 whitespace-nowrap">Time Range:</span>
             <div class="flex-1">
               <input 
                 type="range" 
                 v-model="waterCurrentIndex"
                 :min="0" 
                 :max="Math.max(0, allData.length - 30)"
                 :step="1"
                 class="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer slider"
               />
              
            </div>
          </div>
        </div>
      </div>

      <!-- Cumulative Cost Analysis -->
      <div class="bg-gray-50 rounded-lg p-4">
        <h3 class="text-lg font-semibold text-gray-700 mb-4">Cumulative Cost Analysis</h3>
        <div class="h-64">
          <Line :data="savingsChartData" :options="savingsChartOptions" />
        </div>
        <!-- Navigation slider -->
        <div class="mt-4 pt-4 border-t border-gray-200">
                     <div class="flex items-center space-x-4">
             <span class="text-sm text-gray-600 whitespace-nowrap">Time Range:</span>
             <div class="flex-1">
               <input 
                 type="range" 
                 v-model="savingsCurrentIndex"
                 :min="0" 
                 :max="Math.max(0, allData.length - 30)"
                 :step="1"
                 class="w-full h-2 bg-emerald-200 rounded-lg appearance-none cursor-pointer slider"
               />
               
            </div>
          </div>
        </div>
      </div>

      <!-- Efficiency Trend -->
      <div class="bg-gray-50 rounded-lg p-4">
        <h3 class="text-lg font-semibold text-gray-700 mb-4">Water Efficiency Trend</h3>
        <div class="h-64">
          <Line :data="efficiencyChartData" :options="efficiencyChartOptions" />
        </div>
        <!-- Navigation slider -->
        <div class="mt-4 pt-4 border-t border-gray-200">
                     <div class="flex items-center space-x-4">
             <span class="text-sm text-gray-600 whitespace-nowrap">Time Range:</span>
             <div class="flex-1">
               <input 
                 type="range" 
                 v-model="efficiencyCurrentIndex"
                 :min="0" 
                 :max="Math.max(0, allData.length - 30)"
                 :step="1"
                 class="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer slider"
               />
             
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { dataManager } from '../utils/apiManager.js'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line, Bar } from 'vue-chartjs'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  }
})

const allData = ref([])
// Create independent index for each chart
const powerCurrentIndex = ref(0)
const waterCurrentIndex = ref(0) 
const savingsCurrentIndex = ref(0)
const efficiencyCurrentIndex = ref(0)

// Format date display
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  })
}

// Generic function to get date range
const getDateRange = (currentIndex) => {
  if (allData.value.length === 0) return { start: '', end: '' }
  
  const startIndex = currentIndex
  const endIndex = Math.min(startIndex + 30, allData.value.length)
  
  return {
    start: formatDate(allData.value[startIndex]?.date),
    end: formatDate(allData.value[endIndex - 1]?.date)
  }
}

// Current date range displayed (for top tip)
const currentDateRange = computed(() => getDateRange(powerCurrentIndex.value))

// Create independent data filtering for each chart
const getFilteredData = (currentIndex) => {
  if (allData.value.length === 0) return []
  
  const startIndex = currentIndex
  const endIndex = Math.min(startIndex + 30, allData.value.length)
  
  return allData.value.slice(startIndex, endIndex)
}

// Independent data for each chart
const powerFilteredData = computed(() => getFilteredData(powerCurrentIndex.value))
const waterFilteredData = computed(() => getFilteredData(waterCurrentIndex.value))
const savingsFilteredData = computed(() => getFilteredData(savingsCurrentIndex.value))
const efficiencyFilteredData = computed(() => getFilteredData(efficiencyCurrentIndex.value))



onMounted(async () => {
  console.log('📈 GraphPanel component mounted, starting to load data...')
  await loadData()
  // Default to show latest 30 days data
  const defaultIndex = Math.max(0, allData.value.length - 30)
  powerCurrentIndex.value = defaultIndex
  waterCurrentIndex.value = defaultIndex
  savingsCurrentIndex.value = defaultIndex
  efficiencyCurrentIndex.value = defaultIndex
})

// Watch for changes in props.data
watch(() => props.data, (newData) => {
  console.log('📈 GraphPanel detected data change:', newData.length, 'records')
  allData.value = [...newData].sort((a, b) => new Date(a.date) - new Date(b.date)) // Sort by date in ascending order
  // Keep at latest position when data updates
  const defaultIndex = Math.max(0, allData.value.length - 30)
  powerCurrentIndex.value = defaultIndex
  waterCurrentIndex.value = defaultIndex
  savingsCurrentIndex.value = defaultIndex
  efficiencyCurrentIndex.value = defaultIndex
}, { immediate: true, deep: true })

const loadData = async () => {
  await dataManager.initialize()
  const freshData = await dataManager.getData()
  allData.value = [...freshData].sort((a, b) => new Date(a.date) - new Date(b.date)) // Sort by date in ascending order
  console.log('📈 GraphPanel data loaded:', allData.value.length, 'records')
}

// Chart options
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
    },
  },
  scales: {
    y: {
      beginAtZero: true
    }
  }
}

const savingsChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
    },
  },
  scales: {
    y: {
      beginAtZero: true
    }
  },
  elements: {
    line: {
      fill: true
    }
  }
}

const efficiencyChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'kWh/L'
      }
    }
  }
}

// Power consumption chart data
const powerChartData = computed(() => {
  const labels = powerFilteredData.value.map(item => {
    const date = new Date(item.date)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  })
  
  return {
    labels,
    datasets: [
      {
        label: 'Power Consumption (kWh)',
        data: powerFilteredData.value.map(item => item.powerConsumption || 0),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1
      }
    ]
  }
})

// Water usage chart data
const waterChartData = computed(() => {
  const labels = waterFilteredData.value.map(item => {
    const date = new Date(item.date)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  })
  
  return {
    labels,
    datasets: [
      {
        label: 'Drinking Water (L)',
        data: waterFilteredData.value.map(item => item.drinkingWater || 0),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
      },
      {
        label: 'Irrigation Water (L)',
        data: waterFilteredData.value.map(item => item.irrigationWater || 0),
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
      }
    ]
  }
})

// Cumulative cost analysis chart data
const savingsChartData = computed(() => {
  const labels = savingsFilteredData.value.map(item => {
    const date = new Date(item.date)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  })
  
  let cumulative = 0
  const cumulativeData = savingsFilteredData.value.map(item => {
    cumulative += (item.powerConsumption || 0) * (item.electricityPrice || 0)
    return cumulative
  })
  
  return {
    labels,
    datasets: [
      {
        label: 'Cumulative Cost (KZT)',
        data: cumulativeData,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        fill: true,
        tension: 0.1
      }
    ]
  }
})

// Efficiency chart data
const efficiencyChartData = computed(() => {
  const labels = efficiencyFilteredData.value.map(item => {
    const date = new Date(item.date)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  })
  
  const efficiencyData = efficiencyFilteredData.value.map(item => {
    const totalWater = (item.drinkingWater || 0) + (item.irrigationWater || 0)
    return totalWater > 0 ? (item.powerConsumption || 0) / totalWater : 0
  })
  
  return {
    labels,
    datasets: [
      {
        label: 'Water Efficiency (kWh/L)',
        data: efficiencyData,
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        tension: 0.1
      }
    ]
  }
})
</script>

<style scoped>

</style> 
<template>
  <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
    <h2 class="text-2xl font-bold text-gray-800 mb-6">Efficiency Analysis</h2>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Water Efficiency -->
      <div class="bg-gray-50 rounded-lg p-4">
        <h3 class="text-lg font-semibold text-gray-700 mb-2">Water Efficiency</h3>
        <div class="text-2xl font-bold mb-2" :class="efficiencyColor">
          {{ waterEfficiency.toFixed(4) }} kWh/L
        </div>
        <div class="text-sm" :class="efficiencyLabelColor">
          {{ efficiencyLabel }}
        </div>
        <div class="text-xs text-gray-500 mt-1">
          Power consumption per liter of water
        </div>
      </div>

      <!-- Total Water Usage -->
      <div class="bg-blue-50 rounded-lg p-4">
        <h3 class="text-lg font-semibold text-gray-700 mb-2">Total Water Usage</h3>
        <div class="text-2xl font-bold text-blue-600 mb-2">
          {{ totalWaterUsage.toFixed(1) }} L
        </div>
        <div class="text-sm text-gray-600">
          Drinking: {{ latestData?.drinkingWater || 0 }}L | 
          Irrigation: {{ latestData?.irrigationWater || 0 }}L
        </div>
      </div>

      <!-- Cost Savings -->
      <div class="bg-green-50 rounded-lg p-4">
        <h3 class="text-lg font-semibold text-gray-700 mb-2">Daily Cost Savings</h3>
        <div class="text-2xl font-bold text-green-600 mb-2">
          {{ dailyCostSavings.toFixed(2) }} KZT
        </div>
        <div class="text-sm text-gray-600">
          Solar energy savings
        </div>
      </div>

      <!-- Cumulative Savings -->
      <div class="bg-yellow-50 rounded-lg p-4">
        <h3 class="text-lg font-semibold text-gray-700 mb-2">Total Savings</h3>
        <div class="text-2xl font-bold text-yellow-600 mb-2">
          {{ cumulativeSavings.toFixed(2) }} KZT
        </div>
        <div class="text-sm text-gray-600">
          Cumulative total
        </div>
      </div>

      <!-- Power Consumption -->
      <div class="bg-purple-50 rounded-lg p-4">
        <h3 class="text-lg font-semibold text-gray-700 mb-2">Daily Power Usage</h3>
        <div class="text-2xl font-bold text-purple-600 mb-2">
          {{ latestData?.powerConsumption || 0 }} kWh
        </div>
        <div class="text-sm text-gray-600">
          Today's consumption
        </div>
      </div>

      <!-- Average Efficiency -->
      <div class="bg-indigo-50 rounded-lg p-4">
        <h3 class="text-lg font-semibold text-gray-700 mb-2">Average Efficiency</h3>
        <div class="text-2xl font-bold text-indigo-600 mb-2">
          {{ averageEfficiency.toFixed(4) }} kWh/L
        </div>
        <div class="text-sm text-gray-600">
          30-day average
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { dataManager } from '../utils/apiManager.js'

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  }
})

const allData = ref([])

onMounted(async () => {
  console.log('⚡ EfficiencyPanel component mounted, starting to load data...')
  await loadData()
})

// Watch for changes in props.data
watch(() => props.data, (newData) => {
  console.log('⚡ EfficiencyPanel detected data change:', newData.length, 'records')
  allData.value = [...newData] // Directly use data passed from parent component
}, { immediate: true, deep: true })

const loadData = async () => {
  await dataManager.initialize()
  const freshData = await dataManager.getData()
  allData.value = [...freshData] // Create new array reference
  console.log('⚡ EfficiencyPanel data loaded:', allData.value.length, 'records')
}

const latestData = computed(() => {
  if (allData.value.length === 0) return null
  return allData.value[allData.value.length - 1]
})

const totalWaterUsage = computed(() => {
  if (!latestData.value) return 0
  return (latestData.value.drinkingWater || 0) + (latestData.value.irrigationWater || 0)
})

const waterEfficiency = computed(() => {
  if (!latestData.value || totalWaterUsage.value === 0) return 0
  return (latestData.value.powerConsumption || 0) / totalWaterUsage.value
})

const efficiencyLabel = computed(() => {
  const efficiency = waterEfficiency.value
  if (efficiency < 0.02) return 'High Efficiency'
  if (efficiency > 0.05) return 'Low Efficiency'
  return 'Medium Efficiency'
})

const efficiencyColor = computed(() => {
  const efficiency = waterEfficiency.value
  if (efficiency < 0.02) return 'text-green-600'
  if (efficiency > 0.05) return 'text-red-600'
  return 'text-yellow-600'
})

const efficiencyLabelColor = computed(() => {
  const efficiency = waterEfficiency.value
  if (efficiency < 0.02) return 'text-green-500'
  if (efficiency > 0.05) return 'text-red-500'
  return 'text-yellow-500'
})

const dailyCostSavings = computed(() => {
  if (!latestData.value) return 0
  return (latestData.value.powerConsumption || 0) * (latestData.value.electricityPrice || 0)
})

const cumulativeSavings = computed(() => {
  return allData.value.reduce((sum, item) => {
    return sum + ((item.powerConsumption || 0) * (item.electricityPrice || 0))
  }, 0)
})

const averageEfficiency = computed(() => {
  if (allData.value.length === 0) return 0
  
  const recentData = allData.value.slice(-30) // Last 30 entries
  const validEntries = recentData.filter(item => {
    const totalWater = (item.drinkingWater || 0) + (item.irrigationWater || 0)
    return totalWater > 0
  })
  
  if (validEntries.length === 0) return 0
  
  const totalEfficiency = validEntries.reduce((sum, item) => {
    const totalWater = (item.drinkingWater || 0) + (item.irrigationWater || 0)
    return sum + ((item.powerConsumption || 0) / totalWater)
  }, 0)
  
  return totalEfficiency / validEntries.length
})
</script> 
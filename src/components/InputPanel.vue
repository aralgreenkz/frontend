<template>
  <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
    <h2 class="text-2xl font-bold text-gray-800 mb-6">Data Entry Panel</h2>
    
    <form @submit.prevent="saveData" class="space-y-4">
      <!-- Date Selector -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Date</label>
        <input 
          type="date" 
          v-model="formData.date"
          lang="en"
          placeholder="yyyy-mm-dd"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          required
        />
        <p class="text-xs text-gray-500 mt-1">
          💡 Only one record per date is allowed. If you select a date with existing data, the record for that date will be updated.
        </p>
        <!-- Show if it's an update operation -->
        <div v-if="existingEntryForDate" class="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
          <span class="text-yellow-800">⚠️ Existing data detected for this date. Saving will update the existing record</span>
        </div>
      </div>

      <!-- Power Consumption -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Daily Power Consumption (kWh)</label>
        <input 
          type="number" 
          v-model.number="formData.powerConsumption"
          min="0"
          step="0.01"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          required
        />
      </div>

      <!-- Drinking Water -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Drinking Water Usage (L)</label>
        <input 
          type="number" 
          v-model.number="formData.drinkingWater"
          min="0"
          step="0.1"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          required
        />
      </div>

      <!-- Irrigation Water -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Irrigation Water Usage (L)</label>
        <input 
          type="number" 
          v-model.number="formData.irrigationWater"
          min="0"
          step="0.1"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          required
        />
      </div>

      <!-- Electricity Price -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Electricity Price (KZT/kWh)</label>
        <input 
          type="number" 
          v-model.number="electricityPrice"
          min="0"
          step="0.01"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          required
        />
      </div>

      <!-- Save Button -->
      <button 
        type="submit"
        :disabled="saving"
        class="w-full text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        style="background-color: #80cc4d; border-color: #80cc4d; --tw-ring-color: #80cc4d;"
        @mouseenter="$event.target.style.backgroundColor = '#6db93f'"
        @mouseleave="$event.target.style.backgroundColor = '#80cc4d'"
      >
        <span v-if="saving">Saving...</span>
        <span v-else>Save Data</span>
      </button>
    </form>

    <!-- Success Message -->
    <div v-if="showSuccess" class="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
      {{ successMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { dataManager } from '../utils/apiManager.js'

const emit = defineEmits(['data-saved'])

const formData = ref({
  date: new Date().toISOString().split('T')[0],
  powerConsumption: 0,
  drinkingWater: 0,
  irrigationWater: 0
})

const electricityPrice = ref(25.0) // Default KZT/kWh
const showSuccess = ref(false)
const saving = ref(false)
const successMessage = ref('')
const localData = ref([]) // 本地数据副本，用于支持computed属性

// Computed property: check if the currently selected date already has data
const existingEntryForDate = computed(() => {
  if (!formData.value.date) return null
  return localData.value.find(item => item.date === formData.value.date)
})

// Initialize data manager and load electricity price
onMounted(async () => {
  await dataManager.initialize()
  electricityPrice.value = await dataManager.getElectricityPrice()
  
  // 加载本地数据副本
  localData.value = await dataManager.getData()
  
  // If the selected date already has data, load that data into the form
  if (existingEntryForDate.value) {
    loadExistingData()
  }
})

// Watch for date changes
watch(() => formData.value.date, (newDate) => {
  if (newDate) {
    const existingEntry = localData.value.find(item => item.date === newDate)
    if (existingEntry) {
      loadExistingData(existingEntry)
    } else {
      // If no existing data, clear the form (except date)
      formData.value.powerConsumption = 0
      formData.value.drinkingWater = 0
      formData.value.irrigationWater = 0
    }
  }
})

// Load existing data into the form
const loadExistingData = (entry = null) => {
  const existingEntry = entry || existingEntryForDate.value
  if (existingEntry) {
    formData.value.powerConsumption = existingEntry.powerConsumption || 0
    formData.value.drinkingWater = existingEntry.drinkingWater || 0
    formData.value.irrigationWater = existingEntry.irrigationWater || 0
    electricityPrice.value = existingEntry.electricityPrice || electricityPrice.value
  }
}

const saveData = async () => {
  // Validate data
  if (formData.value.powerConsumption < 0 || formData.value.drinkingWater < 0 || formData.value.irrigationWater < 0) {
    alert('All values must be non-negative!')
    return
  }

  saving.value = true

  try {
    // Check if it's an update operation
    const existingEntry = localData.value.find(item => item.date === formData.value.date)
    const isUpdate = !!existingEntry

    const dataEntry = {
      ...formData.value,
      electricityPrice: electricityPrice.value,
      timestamp: new Date().toISOString()
    }

    // Save data using data manager - distinguish between create and update
    let success = false
    if (isUpdate) {
      // Update existing record
      const recordId = existingEntry.id
      success = await dataManager.updateEntry(recordId, dataEntry)
    } else {
      // Create new record
      success = await dataManager.saveEntry(dataEntry)
    }

    if (success) {
      // Show success message with update info
      successMessage.value = isUpdate 
        ? `Data updated successfully! Record for ${formData.value.date} has been overwritten.`
        : `Data saved successfully! Added record for ${formData.value.date}.`
      
      showSuccess.value = true
      console.log(successMessage.value)
      
      setTimeout(() => {
        showSuccess.value = false
      }, 3000)

      // 更新本地数据副本
      localData.value = await dataManager.getData()
      
      // Emit event to parent with both the new data and update flag
      emit('data-saved', { 
        entry: dataEntry, 
        isUpdate,
        allData: localData.value 
      })

      // If it's new data, reset the form to tomorrow's date
      if (!isUpdate) {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        formData.value.date = tomorrow.toISOString().split('T')[0]
        formData.value.powerConsumption = 0
        formData.value.drinkingWater = 0
        formData.value.irrigationWater = 0
      }
    } else {
      alert('Failed to save data, please try again.')
    }
  } catch (error) {
    console.error('Error saving data:', error)
    alert('Error saving data: ' + error.message)
  } finally {
    saving.value = false
  }
}
</script> 
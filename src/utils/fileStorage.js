// localStorage 存储工具类
class LocalStorage {
  constructor() {
    this.localStorageKey = 'ecoMetricsData'
    this.priceKey = 'ecoMetricsElectricityPrice'
    this.initializedKey = 'ecoMetricsInitialized'
  }

  // 检查是否已经初始化localStorage
  isInitialized() {
    return window.localStorage.getItem(this.initializedKey) === 'true'
  }

  // 从JSON文件初始化localStorage数据
  async initializeFromJSON() {
    try {
      // 如果已经初始化过，直接返回
      if (this.isInitialized()) {
        console.log('✅ localStorage已经初始化，跳过重复初始化')
        const existingData = this.loadData()
        console.log(`📊 现有数据条目: ${existingData.length} 条`)
        return
      }

      console.log('🔄 开始从ecoMetrics.json初始化localStorage...')
      console.log('🌐 尝试获取数据文件: /data/ecoMetrics.json')
      
      // 从JSON文件读取数据
      const response = await fetch('/data/ecoMetrics.json')
      console.log('📡 Fetch响应状态:', response.status, response.statusText)
      console.log('📡 响应URL:', response.url)
      
      if (!response.ok) {
        console.warn(`⚠️ 获取ecoMetrics.json失败 (${response.status}: ${response.statusText})，使用空数据初始化`)
        window.localStorage.setItem(this.localStorageKey, JSON.stringify([]))
        window.localStorage.setItem(this.priceKey, '25.0')
        window.localStorage.setItem(this.initializedKey, 'true')
        return
      }

      console.log('📥 正在解析JSON数据...')
      const data = await response.json()
      console.log('📦 JSON解析成功，数据类型:', typeof data, '是否为数组:', Array.isArray(data))
      
      // 验证数据格式
      if (!Array.isArray(data)) {
        throw new Error('JSON文件格式错误：数据应该是数组格式')
      }
      
      // 保存数据到localStorage
      window.localStorage.setItem(this.localStorageKey, JSON.stringify(data))
      
      // 获取最新的电价
      let electricityPrice = 25.0
      if (data.length > 0) {
        const latestEntry = data[data.length - 1]
        electricityPrice = latestEntry.electricityPrice || 25.0
      }
      window.localStorage.setItem(this.priceKey, electricityPrice.toString())
      
      // 标记为已初始化
      window.localStorage.setItem(this.initializedKey, 'true')
      
      console.log(`✅ 成功从JSON加载 ${data.length} 条数据到localStorage`)
      console.log(`💰 当前电价: ${electricityPrice} KZT/kWh`)
      console.log(`📅 数据日期范围: ${data.length > 0 ? `${data[0].date} 至 ${data[data.length - 1].date}` : '无数据'}`)
      
    } catch (error) {
      console.error('❌ 从JSON初始化localStorage失败:', error)
      // 初始化空数据
      window.localStorage.setItem(this.localStorageKey, JSON.stringify([]))
      window.localStorage.setItem(this.priceKey, '25.0')
      window.localStorage.setItem(this.initializedKey, 'true')
      console.log('🔧 已初始化为空数据，应用可正常使用')
    }
  }

  // 从localStorage读取数据
  loadData() {
    try {
      const data = window.localStorage.getItem(this.localStorageKey)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Error loading data from localStorage:', error)
      return []
    }
  }

  // 保存数据到localStorage
  saveData(data) {
    try {
      window.localStorage.setItem(this.localStorageKey, JSON.stringify(data))
      return true
    } catch (error) {
      console.error('Error saving data to localStorage:', error)
      return false
    }
  }

  // 获取电价
  getElectricityPrice() {
    try {
      const price = window.localStorage.getItem(this.priceKey)
      return price ? parseFloat(price) : 25.0
    } catch (error) {
      console.error('Error getting electricity price:', error)
      return 25.0
    }
  }

  // 设置电价
  setElectricityPrice(price) {
    try {
      window.localStorage.setItem(this.priceKey, price.toString())
    } catch (error) {
      console.error('Error setting electricity price:', error)
    }
  }

  // 导出数据（用于下载）
  async exportData(format = 'json', customFilename = null) {
    const data = this.loadData()
    
    // 生成默认文件名
    const currentDate = new Date().toISOString().split('T')[0].replace(/-/g, '-')
    
    if (format === 'json') {
      const jsonString = JSON.stringify(data, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const filename = customFilename || `ecoMetrics_${currentDate}.json`
      this.downloadFile(blob, filename)
    } else if (format === 'csv') {
      const csvString = this.convertToCSV(data)
      const blob = new Blob([csvString], { type: 'text/csv' })
      const filename = customFilename || `ecoMetrics_${currentDate}.csv`
      this.downloadFile(blob, filename)
    }
  }

  // 将数据转换为CSV格式
  convertToCSV(data) {
    if (!data || data.length === 0) return ''
    
    const headers = ['Date', 'Power Consumption (kWh)', 'Drinking Water (L)', 'Irrigation Water (L)', 'Electricity Price (KZT/kWh)']
    const csvRows = [headers.join(',')]
    
    data.forEach(item => {
      const row = [
        item.date,
        item.powerConsumption,
        item.drinkingWater,
        item.irrigationWater,
        item.electricityPrice
      ]
      csvRows.push(row.join(','))
    })
    
    return csvRows.join('\n')
  }

  // 下载文件
  downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // 导入JSON文件
  async importFromFile() {
    try {
      if (!('showOpenFilePicker' in window)) {
        throw new Error('File System Access API not supported')
      }

      const [fileHandle] = await window.showOpenFilePicker({
        types: [{
          description: 'JSON files',
          accept: { 'application/json': ['.json'] }
        }]
      })

      const file = await fileHandle.getFile()
      const text = await file.text()
      const data = JSON.parse(text)
      
      if (Array.isArray(data)) {
        this.saveData(data)
        
        // 更新电价
        if (data.length > 0) {
          const latestEntry = data[data.length - 1]
          if (latestEntry.electricityPrice) {
            this.setElectricityPrice(latestEntry.electricityPrice)
          }
        }
        
        return data
      } else {
        throw new Error('Invalid JSON format: data should be an array')
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error importing file:', error)
        throw error
      }
      return null
    }
  }

  // 清除所有数据
  clearAll() {
    try {
      window.localStorage.setItem(this.localStorageKey, JSON.stringify([]))
      window.localStorage.setItem(this.priceKey, '25.0')
      return true
    } catch (error) {
      console.error('Error clearing data:', error)
      return false
    }
  }

  // 重置初始化状态（用于调试）
  resetInitialization() {
    window.localStorage.removeItem(this.initializedKey)
  }
}

// 创建单例实例
export const localStorageManager = new LocalStorage()

// 数据管理类
export class DataManager {
  constructor() {
    this.storage = localStorageManager
    this.data = []
    this.electricityPrice = 25.0
  }

  // 初始化数据
  async initialize() {
    try {
      // 首次启动时从JSON文件初始化localStorage
      await this.storage.initializeFromJSON()
      
      // 从localStorage加载数据
      this.data = this.storage.loadData()
      this.electricityPrice = this.storage.getElectricityPrice()
      
      console.log('DataManager initialized with', this.data.length, 'entries')
    } catch (error) {
      console.error('Failed to initialize data:', error)
      this.data = []
      this.electricityPrice = 25.0
    }
  }

  // 获取所有数据
  getData() {
    return [...this.data]
  }

  // 添加或更新数据条目
  async saveEntry(entry) {
    const existingIndex = this.data.findIndex(item => item.date === entry.date)
    
    if (existingIndex >= 0) {
      this.data[existingIndex] = entry
    } else {
      this.data.push(entry)
    }

    // 按日期排序
    this.data.sort((a, b) => new Date(a.date) - new Date(b.date))

    // 保存到localStorage
    const success = this.storage.saveData(this.data)
    
    // 更新电价
    if (entry.electricityPrice) {
      this.electricityPrice = entry.electricityPrice
      this.storage.setElectricityPrice(this.electricityPrice)
    }

    return success
  }

  // 删除数据条目
  async deleteEntry(index) {
    if (index >= 0 && index < this.data.length) {
      this.data.splice(index, 1)
      return this.storage.saveData(this.data)
    }
    return false
  }

  // 更新数据条目
  async updateEntry(index, entry) {
    if (index >= 0 && index < this.data.length) {
      this.data[index] = entry
      // 按日期排序
      this.data.sort((a, b) => new Date(a.date) - new Date(b.date))
      return this.storage.saveData(this.data)
    }
    return false
  }

  // 清除所有数据
  async clearAllData() {
    this.data = []
    return this.storage.clearAll()
  }

  // 从文件导入数据
  async importFromFile() {
    try {
      const importedData = await this.storage.importFromFile()
      if (importedData) {
        this.data = importedData
        // 更新电价
        if (this.data.length > 0) {
          const latestEntry = this.data[this.data.length - 1]
          this.electricityPrice = latestEntry.electricityPrice || 25.0
        }
        return true
      }
      return false
    } catch (error) {
      console.error('Error importing data:', error)
      return false
    }
  }

  // 导出数据
  async exportData(format = 'json', customFilename = null) {
    return this.storage.exportData(format, customFilename)
  }

  // 获取电价
  getElectricityPrice() {
    return this.electricityPrice
  }

  // 设置电价
  setElectricityPrice(price) {
    this.electricityPrice = price
    this.storage.setElectricityPrice(price)
  }
}

// 导出数据管理器实例
export const dataManager = new DataManager()

// 全局调试工具 - 在浏览器控制台中可用
if (typeof window !== 'undefined') {
  window.debugEcoMetrics = {
    // 查看当前localStorage状态
    checkStorage: () => {
      console.log('🔍 EcoMetrics localStorage 状态:')
      console.log('- 初始化标记:', window.localStorage.getItem('ecoMetricsInitialized'))
      console.log('- 数据存储:', window.localStorage.getItem('ecoMetricsData'))
      console.log('- 电价设置:', window.localStorage.getItem('ecoMetricsElectricityPrice'))
      
      const data = window.localStorage.getItem('ecoMetricsData')
      if (data) {
        const parsedData = JSON.parse(data)
        console.log('- 数据条目数:', parsedData.length)
        if (parsedData.length > 0) {
          console.log('- 首条数据:', parsedData[0])
          console.log('- 末条数据:', parsedData[parsedData.length - 1])
        }
      }
    },
    
    // 强制重新初始化
    forceReinit: async () => {
      console.log('🔄 强制重新初始化...')
      window.localStorage.removeItem('ecoMetricsInitialized')
      await dataManager.initialize()
      console.log('✅ 重新初始化完成')
    },
    
    // 清除所有数据
    clearAll: () => {
      console.log('🗑️ 清除所有localStorage数据...')
      window.localStorage.removeItem('ecoMetricsData')
      window.localStorage.removeItem('ecoMetricsElectricityPrice')
      window.localStorage.removeItem('ecoMetricsInitialized')
      console.log('✅ 清除完成')
    },
    
    // 获取DataManager数据
    getData: () => {
      const data = dataManager.getData()
      console.log('📊 DataManager中的数据:', data)
      return data
    }
  }
  
  console.log('🛠️ 调试工具已加载，在控制台中使用 window.debugEcoMetrics')
} 
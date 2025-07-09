// API管理器 - 替换模拟数据为真实API调用
import { getAuthHeaders } from './auth.js'

class ApiManager {
  constructor() {
    // 固定使用生产环境API地址
    this.baseURL = 'https://backend-production-f7d0e.up.railway.app/api'
    
    console.log('API Base URL:', this.baseURL)
  }

  // 通用API调用方法
  async apiCall(method, endpoint, data = null, params = {}) {
    try {
      // 构建URL
      let url = `${this.baseURL}${endpoint}`
      
      // 添加查询参数
      if (params && Object.keys(params).length > 0) {
        const searchParams = new URLSearchParams()
        Object.keys(params).forEach(key => {
          if (params[key] !== undefined && params[key] !== null) {
            searchParams.append(key, params[key])
          }
        })
        url += `?${searchParams.toString()}`
      }

      // 构建请求配置
      const config = {
        method,
        headers: getAuthHeaders()
      }

      // 添加请求体
      if (data && (method === 'POST' || method === 'PUT' || method === 'DELETE')) {
        config.body = JSON.stringify(data)
      }

      // 发送请求
      const response = await fetch(url, config)
      
      // 处理响应
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `API Error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`API Call Error [${method} ${endpoint}]:`, error)
      throw error
    }
  }

  // 获取所有数据记录
  async getData(params = {}) {
    try {
      const response = await this.apiCall('GET', '/data', null, params)
      return response.data.records || []
    } catch (error) {
      console.error('获取数据失败:', error)
      throw error
    }
  }

  // 添加数据记录
  async saveEntry(entry) {
    try {
      const response = await this.apiCall('POST', '/data', entry)
      return response.success
    } catch (error) {
      console.error('保存数据失败:', error)
      throw error
    }
  }

  // 更新数据记录
  async updateEntry(id, entry) {
    try {
      const response = await this.apiCall('PUT', `/data/${id}`, entry)
      return response.success
    } catch (error) {
      console.error('更新数据失败:', error)
      throw error
    }
  }

  // 删除数据记录
  async deleteEntry(id) {
    try {
      const response = await this.apiCall('DELETE', `/data/${id}`)
      return response.success
    } catch (error) {
      console.error('删除数据失败:', error)
      throw error
    }
  }

  // 清空所有数据
  async clearAllData() {
    try {
      const response = await this.apiCall('DELETE', '/data', { confirm: true })
      return response.success
    } catch (error) {
      console.error('清空数据失败:', error)
      throw error
    }
  }

  // 批量导入数据
  async importData(records, overwriteExisting = false) {
    try {
      const response = await this.apiCall('POST', '/data/import', {
        records,
        overwriteExisting
      })
      return response.success
    } catch (error) {
      console.error('导入数据失败:', error)
      throw error
    }
  }

  // 导出数据
  async exportData(format = 'json', filename = null, params = {}) {
    try {
      const response = await this.apiCall('GET', '/data/export', null, {
        format,
        filename,
        ...params
      })
      
      // 如果是JSON格式，直接下载
      if (format === 'json') {
        const jsonString = JSON.stringify(response.data || response, null, 2)
        this.downloadFile(jsonString, filename || `ecoMetrics_${new Date().toISOString().split('T')[0]}.json`, 'application/json')
      } else if (format === 'csv') {
        // 如果是CSV格式，转换数据并下载
        const csvString = this.convertToCSV(response.data?.records || response.records || [])
        this.downloadFile(csvString, filename || `ecoMetrics_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv')
      }
      
      return true
    } catch (error) {
      console.error('导出数据失败:', error)
      throw error
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
  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // 获取操作日志（仅管理员）
  async getLogs(params = {}) {
    try {
      const response = await this.apiCall('GET', '/logs', null, params)
      return response.data
    } catch (error) {
      console.error('获取日志失败:', error)
      throw error
    }
  }

  // 获取电价（从最新数据中获取）
  async getElectricityPrice() {
    try {
      const data = await this.getData({ limit: 1, sortBy: 'date', sortOrder: 'desc' })
      return data.length > 0 ? data[0].electricityPrice : 25.0
    } catch (error) {
      console.error('获取电价失败:', error)
      return 25.0
    }
  }

  // 初始化方法（兼容现有代码）
  async initialize() {
    // API模式下不需要特殊初始化
    console.log('API Manager initialized')
  }
}

// 导出API管理器实例
export const apiManager = new ApiManager()

// 兼容性导出（替换dataManager）
export const dataManager = apiManager 

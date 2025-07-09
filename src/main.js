import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { dataManager } from './utils/fileStorage.js'

// 设置全局语言环境为英文
document.documentElement.lang = 'en'

const app = createApp(App)

app.use(router)

// 在应用启动时初始化localStorage数据
const initializeApp = async () => {
  try {
    console.log('🚀 正在初始化应用...')
    
    // 检查localStorage当前状态
    console.log('📋 localStorage当前状态:')
    console.log('- 初始化标记:', window.localStorage.getItem('ecoMetricsInitialized'))
    console.log('- 现有数据条目:', window.localStorage.getItem('ecoMetricsData') ? JSON.parse(window.localStorage.getItem('ecoMetricsData')).length : 0)
    console.log('- 电价:', window.localStorage.getItem('ecoMetricsElectricityPrice'))
    
    // 检查是否需要强制重新初始化
    const isInitialized = window.localStorage.getItem('ecoMetricsInitialized') === 'true'
    const hasData = window.localStorage.getItem('ecoMetricsData') && JSON.parse(window.localStorage.getItem('ecoMetricsData')).length > 0
    
    if (isInitialized && !hasData) {
      console.log('🔄 检测到初始化标记存在但无数据，强制重新初始化...')
      // 清除初始化标记，强制重新加载
      window.localStorage.removeItem('ecoMetricsInitialized')
    }
    
    // 初始化数据管理器，确保ecoMetrics.json数据加载到localStorage
    await dataManager.initialize()
    
    // 验证初始化结果
    const loadedData = dataManager.getData()
    console.log('✅ 数据已成功加载到localStorage')
    console.log('📊 数据条目数量:', loadedData.length)
    console.log('💰 当前电价:', dataManager.getElectricityPrice(), 'KZT/kWh')
    
    if (loadedData.length > 0) {
      console.log('📅 数据日期范围:', `${loadedData[0].date} 至 ${loadedData[loadedData.length - 1].date}`)
      console.log('🔍 首条数据示例:', loadedData[0])
    } else {
      console.warn('⚠️ 没有加载到任何数据，请检查data/ecoMetrics.json文件')
    }
    
    // 再次验证localStorage内容
    console.log('🔍 localStorage验证:')
    console.log('- 数据存储键值存在:', !!window.localStorage.getItem('ecoMetricsData'))
    console.log('- 存储的数据长度:', window.localStorage.getItem('ecoMetricsData') ? JSON.parse(window.localStorage.getItem('ecoMetricsData')).length : 0)
    
    // 挂载应用
    app.mount('#app')
    
    console.log('🎉 应用初始化完成')
  } catch (error) {
    console.error('❌ 应用初始化失败:', error)
    
    // 显示详细错误信息
    console.error('错误详情:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    
    // 即使初始化失败也要挂载应用，确保用户能看到界面
    app.mount('#app')
    
    // 显示友好的错误提示
    setTimeout(() => {
      alert('数据初始化遇到问题，但应用仍可正常使用。详情请查看控制台。')
    }, 1000)
  }
}

// 启动应用
initializeApp()

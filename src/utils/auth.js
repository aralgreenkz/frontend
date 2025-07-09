// 认证相关工具函数

// API基础URL - 固定使用生产环境地址
const API_BASE_URL = 'https://backend-production-f7d0e.up.railway.app/api'

/**
 * 检查用户是否已登录
 * @returns {boolean}
 */
export function isAuthenticated() {
  return localStorage.getItem('isAuthenticated') === 'true'
}

/**
 * 获取当前用户信息
 * @returns {object|null}
 */
export function getCurrentUser() {
  const userStr = localStorage.getItem('currentUser')
  return userStr ? JSON.parse(userStr) : null
}

/**
 * 登录函数 - 预留API接口位置
 * @param {object} credentials - 登录凭据
 * @param {string} credentials.username - 用户名
 * @param {string} credentials.password - 密码
 * @returns {Promise<object>}
 */
export async function login(credentials) {
  try {
    // 真实API调用
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials)
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Login failed')
    }
    
    const data = await response.json()
    
    // 保存认证信息
    localStorage.setItem('isAuthenticated', 'true')
    localStorage.setItem('authToken', data.data.token)
    localStorage.setItem('currentUser', JSON.stringify(data.data.user))
    
    return data
    
  } catch (error) {
    console.error('Login error:', error)
    throw error
  }
}

/**
 * 登出函数 - 预留API接口位置
 * @returns {Promise<void>}
 */
export async function logout() {
  try {
    // 真实API调用
    const token = localStorage.getItem('authToken')
    if (token) {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })
    }
    
    // 清除本地存储的认证信息
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('authToken')
    localStorage.removeItem('currentUser')
    
  } catch (error) {
    console.error('Logout error:', error)
    // 即使API调用失败，也要清除本地存储
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('authToken')
    localStorage.removeItem('currentUser')
  }
}

/**
 * 刷新token - 简化版本（根据API文档，token有效期24小时，不需要刷新）
 * @returns {Promise<string>}
 */
export async function refreshToken() {
  // 根据API文档，JWT token有效期24小时，不需要刷新功能
  // 如果token过期，用户需要重新登录
  const token = getAuthToken()
  if (!token) {
    throw new Error('No token available')
  }
  return token
}

/**
 * 忘记密码 - 简化版本（根据API文档，暂不实现此功能）
 * @param {string} email - 邮箱地址
 * @returns {Promise<object>}
 */
export async function forgotPassword(email) {
  // 根据API文档，暂不实现忘记密码功能
  // 用户需要联系管理员重置密码
  return {
    success: false,
    message: 'Forgot password functionality will be implemented with API. Please contact administrator.'
  }
}

/**
 * 注册用户 - 预留API接口位置
 * @param {object} userData - 用户注册数据
 * @returns {Promise<object>}
 */
export async function register(userData) {
  try {
    // 真实API调用
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Registration failed')
    }
    
    return await response.json()
    
  } catch (error) {
    console.error('Registration error:', error)
    throw error
  }
}

/**
 * 获取认证token
 * @returns {string|null}
 */
export function getAuthToken() {
  return localStorage.getItem('authToken')
}

/**
 * 检查token是否有效（简单版本）
 * @returns {boolean}
 */
export function isTokenValid() {
  const token = getAuthToken()
  if (!token) return false
  
  // TODO: 实际项目中应该验证token的有效性和过期时间
  // 这里只是简单检查token是否存在
  return true
}

/**
 * 设置API请求的默认headers
 * @returns {object}
 */
export function getAuthHeaders() {
  const token = getAuthToken()
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  }
} 

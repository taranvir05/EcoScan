import axios from 'axios'

const TOKEN_STORAGE_KEY = 'ecoscan_token'

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

export const registerUser = async (data) => {
  const response = await api.post('/auth/register', data)
  return response.data
}

export const loginUser = async (data) => {
  const response = await api.post('/auth/login', data)
  return response.data
}

export const getMyResults = async () => {
  const response = await api.get('/results/my')
  return response.data
}

export const getAdminStats = async () => {
  const response = await api.get('/admin/stats')
  return response.data
}

export default api

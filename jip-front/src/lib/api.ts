import axios from 'axios'

export const api = axios.create({
  baseURL: '/api/jip',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jip_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('jip_token')
      localStorage.removeItem('jip_user')
    }
    return Promise.reject(err)
  },
)

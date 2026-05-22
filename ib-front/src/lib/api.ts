import axios from 'axios'

export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

export function unwrap<T>(res: { data: { data: T } }): T {
  return res.data.data
}

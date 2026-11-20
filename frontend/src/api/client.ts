import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { ApiValidationError } from '../types'

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '')
const CSRF_URL = `${API_ORIGIN}/sanctum/csrf-cookie`

let csrfRequest: Promise<void> | null = null

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(^|;\\s*)${name}=([^;]*)`))
  return match ? decodeURIComponent(match[2]) : null
}

export async function ensureCsrfCookie(): Promise<void> {
  if (csrfRequest) return csrfRequest

  csrfRequest = axios
    .get(CSRF_URL, { withCredentials: true })
    .then(() => undefined)
    .catch(() => undefined)
    .finally(() => {
      csrfRequest = null
    })

  return csrfRequest
}

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
})

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const method = (config.method ?? 'get').toLowerCase()
  if (!['get', 'head', 'options'].includes(method)) {
    await ensureCsrfCookie()
    const token = readCookie('XSRF-TOKEN')
    if (token) config.headers.set('X-XSRF-TOKEN', token)
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiValidationError>) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new CustomEvent('campusfind:unauthenticated'))
    }
    return Promise.reject(error)
  },
)

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiValidationError>(error)) {
    const data = error.response?.data
    if (data?.errors) {
      const first = Object.values(data.errors)[0]?.[0]
      if (first) return first
    }
    if (data?.message) return data.message
    if (error.code === 'ERR_NETWORK') {
      return 'Cannot connect to the server. Make sure the Laravel backend is running.'
    }
    return error.message || 'Something went wrong. Please try again.'
  }

  if (error instanceof Error) return error.message
  return 'Something went wrong. Please try again.'
}

export function getValidationErrors(error: unknown): Record<string, string[]> {
  if (axios.isAxiosError<ApiValidationError>(error)) {
    return error.response?.data?.errors ?? {}
  }
  return {}
}

export default api

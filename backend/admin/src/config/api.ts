import axios, { type InternalAxiosRequestConfig } from 'axios'

export const TOKEN_KEY = 'devup_admin_token'
export const REFRESH_TOKEN_KEY = 'devup_admin_refresh_token'
export const USER_KEY = 'devup_admin_user'

const baseURL = import.meta.env.VITE_API_URL || ''

const api = axios.create({ baseURL })

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/**
 * Supabase access tokens last about an hour. When one expires, trade the
 * refresh token for a new pair — once, shared by every request that hit the
 * expiry at the same moment — instead of signing the admin out.
 */
let refreshing: Promise<string | null> | null = null

function refreshAccessToken() {
  if (!refreshing) {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
    refreshing = (
      refreshToken
        ? axios
            .post(`${baseURL}/api/auth/refresh`, { refreshToken })
            .then((res) => {
              const { token, refreshToken: next } = res.data.data
              localStorage.setItem(TOKEN_KEY, token)
              localStorage.setItem(REFRESH_TOKEN_KEY, next)
              return token as string
            })
            .catch(() => null)
        : Promise.resolve(null)
    ).finally(() => {
      refreshing = null
    })
  }
  return refreshing
}

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean }

/** A 401 from these means bad credentials, not an expired session. */
const NO_REFRESH = ['/api/auth/login', '/api/auth/refresh']

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as RetriableConfig | undefined

    if (
      error.response?.status === 401 &&
      original &&
      !original._retried &&
      !NO_REFRESH.some((path) => original.url?.includes(path))
    ) {
      original._retried = true
      const token = await refreshAccessToken()
      if (token) {
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      }
    }

    if (error.response?.status === 401) {
      clearSession()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

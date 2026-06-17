import type { ApiResponse } from './types'

const BASE_URL = '/api'

const TOKEN_KEY = 'auth_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  status: number
  errors?: { field: string; message: string }[]

  constructor(message: string, status: number, errors?: { field: string; message: string }[]) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

interface RequestOptions extends RequestInit {
  params?: { [key: string]: unknown }
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, ...rest } = options

  let url = `${BASE_URL}${endpoint}`

  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value))
      }
    })
    const queryString = searchParams.toString()
    if (queryString) {
      url += `?${queryString}`
    }
  }

  const token = getToken()

  const config: RequestInit = {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  }

  try {
    const response = await fetch(url, config)

    const contentType = response.headers.get('content-type')
    let data: ApiResponse<T>

    if (contentType && contentType.includes('application/json')) {
      data = await response.json()
    } else {
      data = {
        success: response.ok,
        message: response.statusText,
      } as ApiResponse<T>
    }

    if (!response.ok || !data.success) {
      throw new ApiError(
        data.message || `请求失败 (${response.status})`,
        response.status,
        data.errors,
      )
    }

    return data.data as T
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    if (error instanceof Error) {
      throw new ApiError(error.message, 0)
    }
    throw new ApiError('未知错误', 0)
  }
}

export const apiClient = {
  get<T>(endpoint: string, options?: Omit<RequestOptions, 'method'>): Promise<T> {
    return request<T>(endpoint, { ...options, method: 'GET' })
  },

  post<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
  },

  put<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    })
  },

  patch<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    })
  },

  delete<T>(endpoint: string, options?: Omit<RequestOptions, 'method'>): Promise<T> {
    return request<T>(endpoint, { ...options, method: 'DELETE' })
  },
}

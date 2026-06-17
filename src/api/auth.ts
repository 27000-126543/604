import { apiClient } from './client'
import type { AuthResponse, LoginRequest, RegisterRequest, User } from './types'

export function login(data: LoginRequest): Promise<AuthResponse> {
  return apiClient.post<AuthResponse>('/auth/login', data)
}

export function register(data: RegisterRequest): Promise<AuthResponse> {
  return apiClient.post<AuthResponse>('/auth/register', data)
}

interface MeResponse {
  user: User
}

export async function me(): Promise<User> {
  const response = await apiClient.get<MeResponse>('/auth/me')
  return response.user
}

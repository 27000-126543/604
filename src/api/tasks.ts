import { apiClient } from './client'
import type {
  Task,
  CreateTaskRequest,
  SubmitProofRequest,
  GetTasksQuery,
  PaginatedResponse,
} from './types'

export function getTasks(params?: GetTasksQuery): Promise<PaginatedResponse<Task>> {
  return apiClient.get<PaginatedResponse<Task>>('/tasks', { params: params as { [key: string]: unknown } })
}

export function getTask(id: number): Promise<Task> {
  return apiClient.get<Task>(`/tasks/${id}`)
}

export function createTask(data: CreateTaskRequest): Promise<Task> {
  return apiClient.post<Task>('/tasks', data)
}

export function joinTask(id: number): Promise<Task> {
  return apiClient.post<Task>(`/tasks/${id}/join`)
}

export function submitProof(id: number, data: SubmitProofRequest): Promise<void> {
  return apiClient.post<void>(`/tasks/${id}/submit`, data)
}

export function getMyTasks(): Promise<{ published: Task[]; participated: Task[] }> {
  return apiClient.get<{ published: Task[]; participated: Task[] }>('/tasks/mine')
}

export interface User {
  id: number
  username: string
  role: 'user' | 'admin'
  points: number
  created_at?: string
}

export interface Task {
  id: number
  title: string
  description: string
  deadline: string
  required_people: number
  status: 'open' | 'in_progress' | 'completed' | 'expired'
  publisher_id: number
  publisher?: User
  participants?: TaskParticipant[]
  participant_count?: number
  created_at: string
}

export interface TaskParticipant {
  id: number
  task_id: number
  user_id: number
  user?: User
  status: 'joined' | 'completed' | 'expired'
  joined_at: string
  proof_submission?: ProofSubmission
}

export interface ProofSubmission {
  id: number
  participant_id: number
  participant?: TaskParticipant
  task?: Task
  user?: User
  proof_content: string
  status: 'pending' | 'approved' | 'rejected'
  reject_reason?: string
  reviewer_id?: number
  reviewer?: User
  submitted_at: string
  reviewed_at?: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  errors?: { field: string; message: string }[]
}

export interface RegisterRequest {
  username: string
  password: string
  role: 'user' | 'admin'
}

export interface LoginRequest {
  username: string
  password: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface CreateTaskRequest {
  title: string
  description: string
  deadline: string
  required_people: number
}

export interface SubmitProofRequest {
  proof: string
}

export interface ReviewProofRequest {
  approved: boolean
  reject_reason?: string
  points?: number
}

export interface GetTasksQuery {
  status?: string
  page?: number
  pageSize?: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

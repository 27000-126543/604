export type UserRole = 'user' | 'admin'

export interface User {
  id: number
  username: string
  password_hash: string
  role: UserRole
  points: number
  created_at: string
}

export type TaskStatus = 'open' | 'in_progress' | 'completed' | 'expired'

export interface Task {
  id: number
  title: string
  description: string
  deadline: string
  required_people: number
  status: TaskStatus
  publisher_id: number
  created_at: string
}

export type ParticipantStatus = 'joined' | 'submitted' | 'completed' | 'quit' | 'expired'

export interface TaskParticipant {
  id: number
  task_id: number
  user_id: number
  status: ParticipantStatus
  joined_at: string
}

export type ProofStatus = 'pending' | 'approved' | 'rejected'

export interface ProofSubmission {
  id: number
  participant_id: number
  proof_content: string
  status: ProofStatus
  reject_reason: string | null
  reviewer_id: number | null
  submitted_at: string
  reviewed_at: string | null
}

export interface TaskWithPublisher extends Task {
  publisher_username: string
  participant_count: number
}

export interface ParticipantWithDetails extends TaskParticipant {
  username: string
  task_title: string
}

export interface ProofWithDetails extends ProofSubmission {
  user?: {
    id: number
    username: string
    role: UserRole
    points: number
  }
  task?: {
    id: number
    title: string
    description: string
  }
  reviewer?: {
    id: number
    username: string
  }
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  errors?: { field: string; message: string }[]
}

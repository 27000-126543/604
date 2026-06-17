import { apiClient } from './client'
import type { ProofSubmission, ReviewProofRequest } from './types'

export function getPendingProofs(): Promise<ProofSubmission[]> {
  return apiClient.get<ProofSubmission[]>('/admin/proofs')
}

export function reviewProof(id: number, data: ReviewProofRequest): Promise<void> {
  return apiClient.post<void>(`/admin/proofs/${id}/review`, data)
}

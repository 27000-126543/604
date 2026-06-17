import { Router, type Request, type Response } from 'express'
import { body, param } from 'express-validator'
import auth from '../middleware/auth.js'
import requireRole from '../middleware/role.js'
import validate from '../middleware/validate.js'
import {
  proofQueries,
  participantQueries,
  userQueries,
  taskQueries,
} from '../db/database.js'
import type { ApiResponse, ProofWithDetails } from '../db/types.js'

const router = Router()

router.use(auth)
router.use(requireRole('admin'))

router.get(
  '/proofs',
  async (req: Request, res: Response<ApiResponse<ProofWithDetails[]>>): Promise<void> => {
    try {
      const proofs = proofQueries.findAll('pending')
      res.status(200).json({
        success: true,
        data: proofs,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取待审核凭证列表失败',
      })
    }
  },
)

router.post(
  '/proofs/:id/review',
  validate([
    param('id').isInt({ min: 1 }).withMessage('凭证ID必须为正整数'),
    body('approved').isBoolean().withMessage('approved必须为布尔值'),
    body('reject_reason')
      .optional()
      .isString()
      .withMessage('拒绝原因必须为字符串'),
    body('points')
      .optional()
      .isInt({ min: 0 })
      .withMessage('积分必须为非负整数'),
  ]),
  async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    try {
      const proofId = parseInt(req.params.id, 10)
      const { approved, reject_reason, points } = req.body
      const reviewerId = Number(req.user?.id)

      const proof = proofQueries.findById(proofId)
      if (!proof) {
        res.status(404).json({
          success: false,
          message: '凭证不存在',
        })
        return
      }

      if (proof.status !== 'pending') {
        res.status(400).json({
          success: false,
          message: '该凭证已审核，不能重复审核',
        })
        return
      }

      const participant = participantQueries.findById(proof.participant_id)
      if (!participant) {
        res.status(404).json({
          success: false,
          message: '参与者记录不存在',
        })
        return
      }

      const task = taskQueries.findById(participant.task_id)
      if (!task) {
        res.status(404).json({
          success: false,
          message: '任务不存在',
        })
        return
      }

      if (!approved && !reject_reason) {
        res.status(400).json({
          success: false,
          message: '拒绝时必须提供拒绝原因',
        })
        return
      }

      if (!approved && reject_reason.trim().length < 2) {
        res.status(400).json({
          success: false,
          message: '拒绝原因至少需要2个字符',
        })
        return
      }

      proofQueries.review(proofId, approved, reviewerId, reject_reason)

      if (approved) {
        participantQueries.updateStatus(participant.id, 'completed')
        const addPoints = points ?? 10
        userQueries.updatePoints(participant.user_id, addPoints)

        const completedCount = participantQueries.countCompletedByTask(task.id)
        if (completedCount >= task.required_people) {
          taskQueries.updateStatus(task.id, 'completed')
        }
      } else {
        participantQueries.updateStatus(participant.id, 'joined')
      }

      res.status(200).json({
        success: true,
        message: approved ? '凭证审核通过' : '凭证已拒绝',
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '审核凭证失败',
      })
    }
  },
)

export default router

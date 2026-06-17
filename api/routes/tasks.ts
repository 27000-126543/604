import { Router, type Request, type Response } from 'express'
import { body, param, query } from 'express-validator'
import dayjs from 'dayjs'
import auth from '../middleware/auth.js'
import requireRole from '../middleware/role.js'
import validate from '../middleware/validate.js'
import { taskQueries, participantQueries, proofQueries, userQueries } from '../db/database.js'
import type { TaskStatus } from '../db/types.js'

const router = Router()

router.get(
  '/',
  validate([
    query('status').optional().isIn(['open', 'in_progress', 'completed', 'expired']),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('pageSize').optional().isInt({ min: 1, max: 100 }).toInt(),
  ]),
  (req: Request, res: Response): void => {
    const status = req.query.status as TaskStatus | undefined
    const page = Number(req.query.page) || 1
    const pageSize = Number(req.query.pageSize) || 10

    const items = taskQueries.findAll(status, page, pageSize)
    const total = taskQueries.countAll(status)

    res.json({
      success: true,
      data: {
        items,
        total,
        page,
        pageSize,
      },
    })
  },
)

router.get('/mine', auth, (req: Request, res: Response): void => {
  const userId = Number(req.user?.id)

  const publishedTasks = taskQueries.findByPublisher(userId)
  const participatedTasks = taskQueries.findByParticipant(userId)

  const enrichTask = (task: any) => {
    const publisher = userQueries.findById(task.publisher_id)
    const participants = participantQueries.findByTask(task.id)
    const participantsWithDetails = participants.map((p) => ({
      ...p,
      user: userQueries.findById(p.user_id),
      proof_submission: proofQueries.findByParticipant(p.id),
    }))
    return {
      ...task,
      publisher,
      participants: participantsWithDetails,
    }
  }

  const published = publishedTasks.map(enrichTask)
  const participated = participatedTasks.map(enrichTask)

  res.json({
    success: true,
    data: {
      published,
      participated,
    },
  })
})

router.get(
  '/:id',
  auth,
  validate([param('id').isInt({ min: 1 }).toInt()]),
  (req: Request, res: Response): void => {
    const taskId = Number(req.params.id)

    const task = taskQueries.findById(taskId)
    if (!task) {
      res.status(404).json({
        success: false,
        message: '任务不存在',
      })
      return
    }

    const publisher = userQueries.findById(task.publisher_id)
    const participants = participantQueries.findByTask(taskId)

    const participantsWithUser = participants.map((p) => ({
      ...p,
      user: userQueries.findById(p.user_id),
      proof_submission: proofQueries.findByParticipant(p.id),
    }))

    res.json({
      success: true,
      data: {
        ...task,
        publisher,
        participants: participantsWithUser,
      },
    })
  },
)

router.post(
  '/',
  auth,
  requireRole('user'),
  validate([
    body('title').isLength({ min: 2, max: 100 }).withMessage('标题长度需在2-100字符之间'),
    body('description').isLength({ min: 10, max: 200 }).withMessage('描述长度需在10-200字符之间'),
    body('deadline')
      .isISO8601()
      .withMessage('截止日期格式无效')
      .custom((value: string) => {
        if (dayjs(value).isBefore(dayjs())) {
          throw new Error('截止日期不能早于当前时间')
        }
        return true
      }),
    body('required_people').isInt({ min: 1 }).withMessage('所需人数必须为正整数'),
  ]),
  (req: Request, res: Response): void => {
    const userId = Number(req.user?.id)
    const { title, description, deadline, required_people } = req.body

    const task = taskQueries.create({
      title,
      description,
      deadline: dayjs(deadline).format('YYYY-MM-DD HH:mm:ss'),
      required_people,
      publisher_id: userId,
    })

    if (task) {
      participantQueries.create(task.id, userId)
    }

    res.status(201).json({
      success: true,
      data: task,
      message: '任务发布成功',
    })
  },
)

router.post(
  '/:id/join',
  auth,
  validate([param('id').isInt({ min: 1 }).toInt()]),
  (req: Request, res: Response): void => {
    const taskId = Number(req.params.id)
    const userId = Number(req.user?.id)

    const task = taskQueries.findById(taskId)
    if (!task) {
      res.status(404).json({
        success: false,
        message: '任务不存在',
      })
      return
    }

    if (task.status !== 'open') {
      res.status(400).json({
        success: false,
        message: '任务不可加入',
      })
      return
    }

    const existing = participantQueries.findByTaskAndUser(taskId, userId)
    if (existing) {
      res.status(400).json({
        success: false,
        message: '您已加入该任务',
      })
      return
    }

    const activeCount = participantQueries.countActiveByUser(userId)
    if (activeCount >= 3) {
      res.status(400).json({
        success: false,
        message: '您的未完成任务已达上限（最多3个）',
      })
      return
    }

    const participantCount = participantQueries.countByTask(taskId)
    if (participantCount >= task.required_people) {
      res.status(400).json({
        success: false,
        message: '该任务名额已满',
      })
      return
    }

    participantQueries.create(taskId, userId)

    if (task.status === 'open') {
      taskQueries.updateStatus(taskId, 'in_progress')
    }

    const updatedTask = taskQueries.findById(taskId)
    const participants = participantQueries.findByTask(taskId)
    const participantsWithUser = participants.map((p) => ({
      ...p,
      user: userQueries.findById(p.user_id),
      proof_submission: proofQueries.findByParticipant(p.id),
    }))

    res.json({
      success: true,
      message: '加入任务成功',
      data: {
        ...updatedTask,
        publisher: userQueries.findById(updatedTask?.publisher_id ?? 0),
        participants: participantsWithUser,
      },
    })
  },
)

router.post(
  '/:id/submit',
  auth,
  validate([
    param('id').isInt({ min: 1 }).toInt(),
    body('proof').isLength({ min: 5 }).withMessage('完成凭证至少5个字符'),
  ]),
  (req: Request, res: Response): void => {
    const taskId = Number(req.params.id)
    const userId = Number(req.user?.id)
    const { proof } = req.body

    const task = taskQueries.findById(taskId)
    if (!task) {
      res.status(404).json({
        success: false,
        message: '任务不存在',
      })
      return
    }

    const participant = participantQueries.findByTaskAndUser(taskId, userId)
    if (!participant) {
      res.status(403).json({
        success: false,
        message: '您不是该任务的参与者',
      })
      return
    }

    participantQueries.updateStatus(participant.id, 'submitted')
    proofQueries.create(participant.id, proof)

    res.json({
      success: true,
      message: '凭证提交成功',
    })
  },
)

export default router

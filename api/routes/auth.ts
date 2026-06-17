import { Router, type Request, type Response } from 'express'
import { body } from 'express-validator'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { auth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { userQueries } from '../db/database.js'
import type { User } from '../db/types.js'

const router = Router()

const JWT_SECRET = process.env.JWT_SECRET || 'task-secret-key'

interface UserResponse {
  id: number
  username: string
  role: string
  points: number
  created_at: string
}

const sanitizeUser = (user: User): UserResponse => {
  const { password_hash: _passwordHash, ...rest } = user
  return rest
}

const generateToken = (user: User): string => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '24h' },
  )
}

router.post(
  '/register',
  validate([
    body('username')
      .isLength({ min: 3, max: 20 })
      .withMessage('用户名长度必须在3-20个字符之间'),
    body('password')
      .isLength({ min: 6, max: 32 })
      .withMessage('密码长度必须在6-32个字符之间'),
    body('role')
      .equals('user')
      .withMessage('角色只能是user'),
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, password, role } = req.body

      const existingUser = userQueries.findByUsername(username)
      if (existingUser) {
        res.status(400).json({
          success: false,
          message: '用户名已存在',
        })
        return
      }

      const passwordHash = await bcrypt.hash(password, 10)
      const newUser = userQueries.create(username, passwordHash, role)

      if (!newUser) {
        res.status(500).json({
          success: false,
          message: '用户创建失败',
        })
        return
      }

      const token = generateToken(newUser)
      const userData = sanitizeUser(newUser)

      res.status(201).json({
        success: true,
        data: {
          token,
          user: userData,
        },
        message: '注册成功',
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
      })
    }
  },
)

router.post(
  '/login',
  validate([
    body('username')
      .notEmpty()
      .withMessage('用户名不能为空'),
    body('password')
      .notEmpty()
      .withMessage('密码不能为空'),
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, password } = req.body

      const user = userQueries.findByUsername(username)
      if (!user) {
        res.status(401).json({
          success: false,
          message: '用户名或密码错误',
        })
        return
      }

      const isPasswordValid = await bcrypt.compare(password, user.password_hash)
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: '用户名或密码错误',
        })
        return
      }

      const token = generateToken(user)
      const userData = sanitizeUser(user)

      res.status(200).json({
        success: true,
        data: {
          token,
          user: userData,
        },
        message: '登录成功',
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
      })
    }
  },
)

router.get('/me', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id as number

    const user = userQueries.findById(userId)
    if (!user) {
      res.status(404).json({
        success: false,
        message: '用户不存在',
      })
      return
    }

    const userData = sanitizeUser(user)

    res.status(200).json({
      success: true,
      data: {
        user: userData,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    })
  }
})

export default router

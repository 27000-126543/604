import { type Request, type Response, type NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface JwtPayload {
  id: number | string
  username: string
  role: string
  [key: string]: unknown
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'task-secret-key'

export const auth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    res.status(401).json({
      success: false,
      error: 'No token provided',
    })
    return
  }

  const parts = authHeader.split(' ')

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({
      success: false,
      error: 'Invalid token format',
    })
    return
  }

  const token = parts[1]

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    req.user = decoded
    next()
  } catch {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    })
  }
}

export default auth

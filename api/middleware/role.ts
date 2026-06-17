import { type Request, type Response, type NextFunction } from 'express'
import type { JwtPayload } from './auth.js'

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user as JwtPayload | undefined

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
      return
    }

    if (!roles.includes(user.role)) {
      res.status(403).json({
        success: false,
        error: 'Forbidden: insufficient permissions',
      })
      return
    }

    next()
  }
}

export default requireRole

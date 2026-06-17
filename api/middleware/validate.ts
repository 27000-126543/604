import { type Request, type Response, type NextFunction } from 'express'
import { validationResult, type ValidationChain } from 'express-validator'

export interface ValidationError {
  field: string
  message: string
}

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await Promise.all(validations.map((validation) => validation.run(req)))

    const errors = validationResult(req)

    if (errors.isEmpty()) {
      next()
      return
    }

    const formattedErrors: ValidationError[] = errors.array().map((err) => ({
      field: 'path' in err ? String(err.path) : 'unknown',
      message: err.msg,
    }))

    res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors: formattedErrors,
    })
  }
}

export default validate

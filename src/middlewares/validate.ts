import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export const validate = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.issues.map((err: any) => ({
          field: err.path.slice(1).join('.'), // Bỏ qua phần 'body', 'query', hoặc 'params' gốc
          message: err.message,
        }));
        
        res.status(400).json({
          status: 'fail',
          message: 'Validation failed',
          errors: errorMessages,
        });
        return;
      }
      next(error);
    }
  };
};

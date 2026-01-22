import { Request, Response, NextFunction } from 'express';

export interface ErrorResponse {
  error: string;
  details?: any;
  stack?: string;
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', err);

  const response: ErrorResponse = {
    error: err.message || 'Internal server error'
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(500).json(response);
};

export const notFoundHandler = (
  req: Request,
  res: Response
): void => {
  res.status(404).json({ error: 'Route not found' });
};

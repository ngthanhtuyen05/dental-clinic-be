import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import apiRouter from './routes/index.js';
import AppError from './utils/AppError.js';
import { setupSwagger } from './config/swagger.js';

const app = express();

// 1. Bảo mật HTTP headers bằng Helmet
app.use(helmet());

// 2. Giới hạn số lượng request (Rate Limiting) để phòng chống brute-force / DDoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100, // Giới hạn tối đa 100 request từ 1 IP trong 15 phút
  message: {
    status: 'fail',
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// 3. CORS & Parsing middlewares
app.use(cors());
app.use(express.json({ limit: '10kb' })); // Giới hạn kích thước body JSON để tránh payload quá lớn
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 4. Request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 5. Swagger API Docs
setupSwagger(app);

// 6. API Routes
app.use('/api', apiRouter);

// Route cơ bản để kiểm tra server
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to Dental Clinic API!',
  });
});

// Xử lý Route không tồn tại (404 Not Found)
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Middleware xử lý lỗi tập trung chuẩn Production
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    res.status(statusCode).json({
      status,
      message: err.message,
      stack: err.stack,
      error: err,
    });
  } else {
    // Production Mode: Ẩn các stack trace hoặc thông tin nhạy cảm của lỗi hệ thống
    if (err.isOperational) {
      res.status(statusCode).json({
        status,
        message: err.message,
      });
    } else {
      console.error('[Error] Programming or unknown error:', err);
      res.status(500).json({
        status: 'error',
        message: 'Something went very wrong!',
      });
    }
  }
});

export default app;

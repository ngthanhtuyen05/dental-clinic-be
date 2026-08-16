import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import apiRouter from './routes/index.js';
import { setupSwagger } from './config/swagger.js';
import env from './config/env.js';
import HttpStatus from './constants/httpStatus.js';
import Messages from './constants/messages.js';
import { notFoundHandler, globalErrorHandler } from './middlewares/errorHandler.js';

const app = express();

// 1. Bảo mật HTTP headers bằng Helmet
app.use(helmet());

// 2. CORS
app.use(cors());

// 4. Parsing middlewares
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 5. Request logging
if (env.isDevelopment) {
  app.use(morgan('dev'));
}

// 6. Swagger API Docs
setupSwagger(app);

// 7. API Routes
app.use('/api', apiRouter);

// Route cơ bản để kiểm tra server
app.get('/', (_req, res) => {
  res.status(HttpStatus.OK).json({
    status: 'success',
    message: Messages.SERVER.WELCOME,
  });
});

// 8. Xử lý Route không tồn tại (404 Not Found)
app.use(notFoundHandler);

// 9. Middleware xử lý lỗi tập trung
app.use(globalErrorHandler);

export default app;

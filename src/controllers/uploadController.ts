import { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';
import env from '../config/env.js';
import AppError from '../utils/AppError.js';
import HttpStatus from '../constants/httpStatus.js';

// Các thư mục được phép upload. Client chỉ gửi khóa, server quyết định đường dẫn thật,
// để không ai tự ghi file vào thư mục tùy ý trong tài khoản Cloudinary.
const ALLOWED_FOLDERS: Record<string, string> = {
  xray: 'smilevia/xrays',
};

/**
 * Cấp chữ ký tạm để client upload trực tiếp lên Cloudinary.
 *
 * API secret không bao giờ rời khỏi server: client chỉ nhận timestamp + signature,
 * còn file thì đi thẳng từ trình duyệt lên Cloudinary, không đi qua server này.
 */
export const getUploadSignature = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!isCloudinaryConfigured()) {
      return next(
        new AppError(
          'Máy chủ chưa được cấu hình Cloudinary. Vui lòng khai báo CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY và CLOUDINARY_API_SECRET.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    }

    const folderKey = String(req.query.folder || 'xray');
    const folder = ALLOWED_FOLDERS[folderKey];

    if (!folder) {
      return next(
        new AppError(`Thư mục upload không hợp lệ: ${folderKey}`, HttpStatus.BAD_REQUEST),
      );
    }

    const timestamp = Math.round(Date.now() / 1000);

    // Các tham số dưới đây phải khớp tuyệt đối với form data mà client gửi lên
    // Cloudinary, nếu lệch một tham số thì chữ ký sẽ bị từ chối.
    const paramsToSign = { folder, timestamp };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      env.CLOUDINARY_API_SECRET,
    );

    res.status(HttpStatus.OK).json({
      status: 'success',
      data: {
        signature,
        timestamp,
        folder,
        apiKey: env.CLOUDINARY_API_KEY,
        cloudName: env.CLOUDINARY_CLOUD_NAME,
      },
    });
  } catch (error) {
    next(error);
  }
};

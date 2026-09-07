import { Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { Notification } from '../models/index.js';
import HttpStatus from '../constants/httpStatus.js';
import { UserRole } from '../constants/enums.js';
import type { AuthenticatedRequest } from '../middlewares/authMiddleware.js';

const getNotificationScope = (req: AuthenticatedRequest) => {
  const user = req.user;
  if (!user) return { userId: -1 };
  if (user.role === UserRole.PATIENT) {
    return { userId: user.id };
  }
  // Staff/Dentist/Admin có thể xem thông báo chung của phòng khám (userId: null) hoặc thông báo riêng
  return {
    [Op.or]: [{ userId: user.id }, { userId: null }],
  };
};

export const getNotifications = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const offset = (page - 1) * limit;
    const isUnreadOnly = req.query.unread === 'true';

    const userScope = getNotificationScope(req);
    const where: any = { ...userScope };
    if (isUnreadOnly) {
      where.isRead = false;
    }

    const [{ rows: notifications, count: total }, unreadCount] = await Promise.all([
      Notification.findAndCountAll({
        where,
        order: [['createdAt', 'DESC']],
        limit,
        offset,
      }),
      Notification.count({ where: { ...userScope, isRead: false } }),
    ]);

    res.status(HttpStatus.OK).json({
      status: 'success',
      data: notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const userScope = getNotificationScope(req);

    await Notification.update({ isRead: true }, { where: { id, ...userScope } });

    res.status(HttpStatus.OK).json({
      status: 'success',
      message: 'Đã đánh dấu thông báo đã đọc',
    });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userScope = getNotificationScope(req);

    await Notification.update({ isRead: true }, { where: { isRead: false, ...userScope } });

    res.status(HttpStatus.OK).json({
      status: 'success',
      message: 'Đã đánh dấu tất cả thông báo đã đọc',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const userScope = getNotificationScope(req);

    await Notification.destroy({ where: { id, ...userScope } });

    res.status(HttpStatus.OK).json({
      status: 'success',
      message: 'Đã xóa thông báo',
    });
  } catch (error) {
    next(error);
  }
};

export const clearAllNotifications = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userScope = getNotificationScope(req);

    // Xóa an toàn theo userScope, tuyệt đối KHÔNG truncate toàn bộ bảng
    await Notification.destroy({ where: userScope });

    res.status(HttpStatus.OK).json({
      status: 'success',
      message: 'Đã xóa toàn bộ thông báo của bạn',
    });
  } catch (error) {
    next(error);
  }
};

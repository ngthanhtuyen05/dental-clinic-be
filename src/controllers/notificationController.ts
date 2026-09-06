import { Request, Response, NextFunction } from 'express';
import { Notification } from '../models/index.js';
import HttpStatus from '../constants/httpStatus.js';

export const getNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const offset = (page - 1) * limit;
    const isUnreadOnly = req.query.unread === 'true';

    const where: any = {};
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
      Notification.count({ where: { isRead: false } }),
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

export const markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    await Notification.update({ isRead: true }, { where: { id } });

    res.status(HttpStatus.OK).json({
      status: 'success',
      message: 'Đã đánh dấu thông báo đã đọc',
    });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await Notification.update({ isRead: true }, { where: { isRead: false } });

    res.status(HttpStatus.OK).json({
      status: 'success',
      message: 'Đã đánh dấu tất cả thông báo đã đọc',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    await Notification.destroy({ where: { id } });

    res.status(HttpStatus.OK).json({
      status: 'success',
      message: 'Đã xóa thông báo',
    });
  } catch (error) {
    next(error);
  }
};

export const clearAllNotifications = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await Notification.destroy({ where: {}, truncate: true });

    res.status(HttpStatus.OK).json({
      status: 'success',
      message: 'Đã xóa toàn bộ thông báo',
    });
  } catch (error) {
    next(error);
  }
};

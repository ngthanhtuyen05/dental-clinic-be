import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt.js';
import { userRepository } from '../repositories/userRepository.js';
import { UserRole } from '../constants/enums.js';

let io: SocketIOServer | null = null;

const STAFF_ROLES = [UserRole.ADMIN, UserRole.DENTIST, UserRole.STAFF];

export const initSocket = (server: HttpServer): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:5000',
      ],
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Middleware xác thực token lúc Handshake (bảo mật kết nối WebSocket)
  io.use(async (socket: Socket, next) => {
    try {
      const authHeader = socket.handshake.headers?.authorization;
      const rawToken = socket.handshake.auth?.token || (authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined);

      if (rawToken) {
        const decoded = verifyAccessToken(rawToken);
        const user = await userRepository.findById(decoded.id);
        if (user) {
          (socket as any).user = user;
        }
      }
      next();
    } catch (err: any) {
      // Cho phép kết nối nhưng không gán user (khách chưa đăng nhập)
      console.warn(`[Socket.IO] Unauthenticated connection: ${socket.id} (${err.message})`);
      next();
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    console.log(`[Socket.IO] Client connected: ${socket.id}${user ? ` (User #${user.id} - ${user.role})` : ' (Guest)'}`);

    // CHỈ CHO PHÉP Nhân sự phòng khám (Admin/Dentist/Staff) tham gia staff_channel
    if (user && STAFF_ROLES.includes(user.role)) {
      socket.join('staff_channel');
      console.log(`[Socket.IO] Socket ${socket.id} joined 'staff_channel'`);
    }

    // Tự động tham gia kênh cá nhân nếu đã đăng nhập
    if (user) {
      socket.join(`user_${user.id}`);
    }

    socket.on('join_channel', (channel: string) => {
      // Ngăn chặn khách hoặc bệnh nhân tự ý tham gia staff_channel
      if (channel === 'staff_channel' && (!user || !STAFF_ROLES.includes(user.role))) {
        console.warn(`[Socket.IO] Unauthorized join attempt to staff_channel from socket ${socket.id}`);
        return;
      }

      // Ngăn chặn user tham gia kênh cá nhân của user khác
      if (channel.startsWith('user_') && (!user || channel !== `user_${user.id}`)) {
        console.warn(`[Socket.IO] Unauthorized join attempt to ${channel} from socket ${socket.id}`);
        return;
      }

      socket.join(channel);
      console.log(`[Socket.IO] Socket ${socket.id} joined channel: ${channel}`);
    });

    socket.on('disconnect', (reason: string) => {
      console.log(`[Socket.IO] Client disconnected (${socket.id}): ${reason}`);
    });
  });

  console.log('[Socket.IO] Service initialized successfully.');
  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('[Socket.IO] Has not been initialized yet!');
  }
  return io;
};

/**
 * Emit event to staff channel (CMS)
 */
export const emitToStaff = (event: string, data: any): void => {
  if (io) {
    io.to('staff_channel').emit(event, data);
  }
};

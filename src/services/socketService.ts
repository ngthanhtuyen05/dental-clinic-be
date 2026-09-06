import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

let io: SocketIOServer | null = null;

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

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join staff channel by default
    socket.join('staff_channel');

    socket.on('join_channel', (channel: string) => {
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

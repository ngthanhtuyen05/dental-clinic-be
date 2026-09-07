# CẨM NANG TOÀN TẬP VỀ SOCKET.IO VÀ TRIỂN KHAI REAL-TIME (FULL-STACK BE & FE)

Tài liệu này tổng hợp toàn bộ kiến thức chuyên sâu về **Socket.IO**: từ nguyên lý hoạt động tầng mạng, so sánh kiến trúc, các lỗi kinh điển trong thực tế, đến hướng dẫn triển khai từng bước chi tiết trên **Backend (Node.js/Express/TypeScript)** và **Frontend (React/Vite/TypeScript)**.

---

## MỤC LỤC
1. [Bản chất Socket.IO và Nguyên lý hoạt động](#1-bản-chất-socketio-và-nguyên-lý-hoạt-động)
2. [So sánh: HTTP Polling vs WebSocket thuần vs Socket.IO](#2-so-sánh-http-polling-vs-websocket-thuần-vs-socketio)
3. [Cơ chế Handshake và Heartbeat (Ping/Pong)](#3-cơ-chế-handshake-và-heartbeat-pingpong)
4. [Kiến trúc Rooms, Namespaces và các phương thức Emit](#4-kiến-trúc-rooms-namespaces-và-các-phương-thức-emit)
5. [Hướng dẫn triển khai chi tiết Backend (dental-clinic-be)](#5-hướng-dẫn-triển-khai-chi-tiết-backend)
6. [Hướng dẫn triển khai chi tiết Frontend (dental-clinic-cms)](#6-hướng-dẫn-triển-khai-chi-tiết-frontend)
7. [Các lỗi kinh điển thường gặp và cách khắc phục](#7-các-lỗi-kinh-điển-thường-gặp-và-cách-khắc-phục)
8. [Mở rộng trong môi trường Production (Scaling & Auth)](#8-mở-rộng-trong-môi-trường-production-scaling--auth)

---

## 1. BẢN CHẤT SOCKET.IO VÀ NGUYÊN LÝ HOẠT ĐỘNG

### 1.1 Socket.IO là gì?
Socket.IO **không phải** là một giao thức mạng đơn thuần, cũng **không phải chỉ là một wrapper bọc quanh WebSocket**. 

Socket.IO là một **thư viện giao tiếp hai chiều thời gian thực (Bidirectional, Event-driven Real-time Communication)** gồm 2 phần:
- Tầng vận chuyển cấp thấp (**Engine.IO**): Quản lý việc kết nối, cơ chế chuyển đổi giao thức (fallback/upgrade), heartbeat, và phát hiện mất mạng.
- Tầng nghiệp vụ cấp cao (**Socket.IO**): Cung cấp mô hình sự kiện (`emit`/`on`), định danh phòng (`Rooms`), phân luồng logic (`Namespaces`), tự động gửi lại (reconnection), và xác nhận nhận tin (acknowledgement).

### 1.2 Socket.IO giải quyết bài toán gì?
Trong ứng dụng truyền thống (như ứng dụng Quản lý Phòng khám):
- Khi một khách hàng đặt lịch khám từ Web (`dental-clinic-web`), dữ liệu được gửi đến Backend (`POST /api/appointments`).
- Nếu dùng HTTP thông thường, nhân viên lễ tân/bác sĩ ngồi ở CMS (`dental-clinic-cms`) **sẽ không hề biết** có đơn mới nếu không tự tay nhấn **F5** tải lại trang.
- Với Socket.IO, ngay khi Backend lưu đơn thành công, Server **chủ động đẩy (Push)** sự kiện tới CMS trong vòng vài mili-giây. CMS lập tức phát chuông, hiện popup và làm mới bảng dữ liệu mà không cần tải lại trang.

---

## 2. SO SÁNH: HTTP POLLING VS WEBSOCKET THUẦN VS SOCKET.IO

| Tiêu chí | HTTP Short/Long Polling | WebSocket Thuần (Raw WebSocket) | Socket.IO |
| :--- | :--- | :--- | :--- |
| **Giao thức** | HTTP/1.1 hoặc HTTP/2 | `ws://` hoặc `wss://` (TCP) | Engine.IO (HTTP Polling $\rightarrow$ WebSocket) |
| **Giao tiếp** | Một chiều (Client kéo dữ liệu từ Server) | Hai chiều (Full-Duplex) cùng lúc | Hai chiều (Full-Duplex) cùng lúc |
| **Overhead** | Rất nặng (Mỗi request đều kèm HTTP Headers, Cookie, Auth) | Rất nhẹ (Khung dữ liệu chỉ tốn vài bytes header) | Rất nhẹ sau khi đã upgrade lên WebSocket |
| **Độ trễ** | Cao (phụ thuộc vào chu kỳ lặp lại ví dụ 5s - 10s) | Cực thấp (< 10ms) | Cực thấp (< 10ms) |
| **Tự động Reconnect** | Không hỗ trợ sẵn, phải tự viết code vòng lặp | Không có sẵn, nếu đứt mạng kết nối sẽ đóng vĩnh viễn | **Có sẵn và rất mạnh mẽ** (Cấu hình retry, delay, backoff) |
| **Fallback khi mạng chặn** | Là HTTP nên không bị chặn | Bị từ chối nếu qua proxy/firewall chặn cổng WebSocket | **Tự động lùi về HTTP Long-Polling** |
| **Quản lý Room / Group** | Phải tự xây dựng logic phức tạp | Phải tự quản lý Set danh sách kết nối | **Có sẵn API `join()`, `leave()`, `to().emit()`** |
| **Khả năng tương thích** | Mọi trình duyệt | Hầu hết trình duyệt hiện đại | Mọi môi trường trình duyệt, mobile, node |

> 💡 **Kết luận**: WebSocket thuần phù hợp khi làm các ứng dụng yêu cầu cực kỳ tối giản về footprint (ví dụ IoT hoặc game engine chuyên biệt). Đối với ứng dụng doanh nghiệp, web quản trị CMS, e-commerce, **Socket.IO là giải pháp vượt trội** nhờ tính ổn định, tự phục hồi khi mạng chập chờn và hệ thống Room tích hợp sẵn.

---

## 3. CƠ CHẾ HANDSHAKE VÀ HEARTBEAT (PING/PONG)

### 3.1 Quá trình bắt tay (Handshake & Protocol Upgrade)
Khi client gọi `io('http://localhost:5000')`, quá trình diễn ra như sau:

```
[Client]                                                        [Server]
   |                                                                |
   |---- 1. HTTP GET /socket.io/?EIO=4&transport=polling ---------->|
   |<--- 2. HTTP 200 (Trả về Session ID "sid", pingInterval...) ---|
   |                                                                |
   |---- 3. HTTP GET Upgrade: websocket (Xin nâng cấp giao thức) -->|
   |<--- 4. HTTP 101 Switching Protocols (Đồng ý nâng cấp) --------|
   |                                                                |
   |<================= KẾT NỐI WEBSOCKET HAI CHIỀU ================>|
```

1. **Bước 1**: Client gửi request HTTP Long-polling đầu tiên để kiểm tra server có sống không và trao đổi thông số phiên.
2. **Bước 2**: Server cấp một định danh duy nhất `sid` (Session ID, ví dụ `2HYw2dplVBaKqj-rAAAA`).
3. **Bước 3 & 4**: Client gửi yêu cầu HTTP với header `Upgrade: websocket`. Server đồng ý trả về status code `101 Switching Protocols`.
4. Kể từ thời điểm này, kết nối HTTP được chuyển thành **TCP Socket mở liên tục**. Dữ liệu truyền đi dưới dạng các khung nhị phân siêu nhẹ (framing).

### 3.2 Cơ chế Heartbeat (Ping - Pong)
Để biết kết nối có còn sống hay không khi dây mạng bị rút hoặc điện thoại tắt màn hình:
- Sau mỗi khoảng thời gian `pingInterval` (mặc định 25 giây), Server gửi một gói tin `ping`.
- Client nhận được `ping` phải gửi lại ngay gói tin `pong`.
- Nếu sau thời gian `pingTimeout` (mặc định 20 giây) mà Server không nhận được `pong`, Server sẽ chủ động ngắt kết nối (`disconnect`) và giải phóng bộ nhớ.
- Phía Client cũng có bộ đếm ngược tương tự, nếu quá hạn không thấy server sẽ tự kích hoạt luồng kết nối lại (`reconnect`).

---

## 4. KIẾN TRÚC ROOMS, NAMESPACES VÀ CÁC PHƯƠNG THỨC EMIT

### 4.1 Namespaces (Không gian tên)
Namespace cho phép chia nhỏ 1 server Socket.IO thành nhiều kênh logic độc lập trên cùng 1 cổng mạng:
- Mặc định là namespace chính: `/`
- Có thể tạo namespace riêng:
  ```ts
  const adminIo = io.of('/admin');
  const chatIo = io.of('/chat');
  ```

### 4.2 Rooms (Phòng)
Room là một khái niệm thuần túy ở phía **Server**. Client không hề biết trong room có bao nhiêu người, điều này tăng tính bảo mật tối đa.
- Một socket có thể tham gia nhiều room: `socket.join('staff_channel')`, `socket.join('doctor_42')`.
- Rời room: `socket.leave('staff_channel')`.
- Khi socket ngắt kết nối, Socket.IO **tự động loại bỏ** socket đó khỏi mọi room đã tham gia.

### 4.3 Bảng so sánh các phương thức phát sóng (`emit`)

Giả sử `socket` là kết nối của Lễ tân A:

```ts
// 1. Chỉ gửi về cho chính Lễ tân A
socket.emit('order_created', data);

// 2. Gửi cho tất cả mọi người TRỪ Lễ tân A
socket.broadcast.emit('user_online', data);

// 3. Gửi cho TẤT CẢ mọi người kết nối tới server (toàn bộ hệ thống)
io.emit('system_alert', data);

// 4. Gửi cho tất cả những ai đang ở trong phòng 'staff_channel' (bao gồm cả Lễ tân A nếu đang ở trong phòng)
io.to('staff_channel').emit('new_appointment', data);

// 5. Gửi cho mọi người trong phòng 'staff_channel' TRỪ Lễ tân A
socket.to('staff_channel').emit('message', data);
```

> ⚠️ **CẢNH BÁO QUAN TRỌNG**:
> Không bao giờ gọi cả hai lệnh sau trong cùng một hàm:
> ```ts
> io.to('staff_channel').emit(event, data);
> io.emit(event, data); // LỖI: Khiến các client thuộc staff_channel bị nhận 2 tin trùng lặp!
> ```

---

## 5. HƯỚNG DẪN TRIỂN KHAI CHI TIẾT BACKEND

### Bước 1: Cài đặt thư viện
Trong thư mục `dental-clinic-be`:
```bash
npm install socket.io
npm install -D @types/socket.io
```

### Bước 2: Tạo Module Quản lý Socket (`src/services/socketService.ts`)
Tách riêng logic socket thành một Service độc lập giúp bạn có thể gọi phát thông báo từ bất kỳ Service/Controller nào mà không bị phụ thuộc vòng (circular dependency).

```typescript
// dental-clinic-be/src/services/socketService.ts
import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

let io: SocketIOServer | null = null;

export const initSocket = (server: HttpServer): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: [
        'http://localhost:5173', // Địa chỉ Frontend CMS (Vite)
        'http://localhost:3000', // Địa chỉ Frontend Web (Next.js)
        'http://localhost:5000',
      ],
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Mặc định các kết nối từ CMS sẽ được đưa vào phòng của nhân viên
    socket.join('staff_channel');

    // Hỗ trợ client tự join vào phòng chuyên biệt (ví dụ phòng riêng của bác sĩ theo ID)
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
    throw new Error('[Socket.IO] Service has not been initialized yet!');
  }
  return io;
};

/**
 * Phát sự kiện đến toàn bộ nhân viên/lễ tân đang trực trên CMS
 */
export const emitToStaff = (event: string, data: any): void => {
  if (io) {
    // Chỉ gửi duy nhất tới phòng staff_channel
    io.to('staff_channel').emit(event, data);
  }
};
```

### Bước 3: Gắn Socket.IO vào HTTP Server (`src/server.ts`)
Express `app` chỉ là một request listener function, bản thân nó không xử lý được kết nối WebSocket nâng cấp (`Upgrade: websocket`). Do đó cần gói `app` vào `http.createServer`:

```typescript
// dental-clinic-be/src/server.ts
import http from 'http';
import app from './app.js';
import { initSocket } from './services/socketService.js';

const PORT = process.env.PORT || 5000;

// 1. Tạo HTTP server bọc Express app
const httpServer = http.createServer(app);

// 2. Gắn Socket.IO vào HTTP server
initSocket(httpServer);

// 3. Cho HTTP server lắng nghe (THAY VÌ app.listen)
httpServer.listen(PORT, () => {
  console.log(`[Server] running on http://localhost:${PORT}`);
});
```

### Bước 4: Tạo Database Model & Routes cho Thông báo
Tạo bảng lưu vết thông báo (`Notifications`) để khi nhân viên mở CMS muộn hơn hoặc F5 lại trang vẫn xem được toàn bộ thông báo cũ.

```typescript
// dental-clinic-be/src/models/notificationModel.ts
import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER, allowNull: true },
  type: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'appointment' },
  title: { type: DataTypes.STRING(255), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  targetUrl: { type: DataTypes.STRING(255), allowNull: true },
  data: { type: DataTypes.TEXT, allowNull: true },
  isRead: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, {
  tableName: 'Notifications',
  timestamps: true,
});

export default Notification;
```

### Bước 5: Bắn thông báo khi nghiệp vụ hoàn tất
Trong `appointmentService.ts`, ngay sau khi đơn đặt lịch được tạo:

```typescript
// dental-clinic-be/src/services/appointmentService.ts
import { emitToStaff } from './socketService.js';
import Notification from '../models/notificationModel.js';

export const createNewAppointment = async (data: any) => {
  // 1. Tạo bản ghi lịch hẹn trong DB...
  const appointment = await Appointment.create(data);

  // 2. Tạo bản ghi thông báo trong DB để lưu vết
  try {
    const notification = await Notification.create({
      type: 'appointment',
      title: `Lịch hẹn mới: ${patientName}`,
      description: `Bệnh nhân ${patientName} vừa đặt lịch khám "${serviceName}" lúc ${startTime} ngày ${appointmentDate}`,
      targetUrl: `/appointments?code=${appointment.code}`,
      isRead: false,
    });

    // 3. PHÁT REAL-TIME ĐẾN CMS NGAY LẬP TỨC
    emitToStaff('new_appointment', {
      notification,
      appointment,
      patientName,
      patientPhone,
      serviceName,
      doctorName,
      appointmentDate,
      startTime,
      code: appointment.code,
    });
  } catch (err) {
    // Không để lỗi thông báo làm gián đoạn giao dịch chính của khách hàng
    console.error('[Notification Error]:', err);
  }

  return appointment;
};
```

---

## 6. HƯỚNG DẪN TRIỂN KHAI CHI TIẾT FRONTEND

### Bước 1: Cài đặt thư viện
Trong thư mục `dental-clinic-cms`:
```bash
npm install socket.io-client
```

### Bước 2: Tạo Socket Client Singleton (`src/services/socketClient.ts`)
Đảm bảo toàn bộ ứng dụng chỉ dùng **1 kết nối Socket duy nhất**, tự động kết nối lại khi rớt mạng:

```typescript
// dental-clinic-cms/src/services/socketClient.ts
import { io, Socket } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
  : 'http://localhost:5000';

let socket: Socket | null = null;

export const initSocketClient = (): Socket => {
  if (!socket) {
    socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.log('[Socket.IO] Đã kết nối đến server. Socket ID:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket.IO] Đã ngắt kết nối:', reason);
    });
  }
  return socket;
};

export const getSocket = (): Socket => {
  return socket || initSocketClient();
};
```

### Bước 3: Xây dựng Service Thông Báo Đa Năng (`notificationService.tsx`)
Bao gồm:
- **Âm thanh chuông báo (Web Audio API)**: Không cần file mp3 ngoài, tổng hợp sóng sin mượt mà.
- **Deduplication**: Chống kích hoạt trùng lặp.
- **Ant Design Notification Popup**: Toast nổi góc trên kèm nút hành động.
- **CustomEvent Refetch**: Tự động thông báo cho các trang đang mở tải lại bảng.

```tsx
// dental-clinic-cms/src/features/notifications/services/notificationService.tsx
import React from 'react';
import { notification, Button } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import { apiClient } from '@/services/apiClient';
import { getSocket } from '@/services/socketClient';

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  description: string;
  time: string;
  createdAt: string;
  isRead: boolean;
  targetUrl?: string;
  data?: any;
}

let NOTIFICATIONS_STORAGE: NotificationItem[] = [];
const processedNotificationIds = new Set<string>();
const listeners = new Set<() => void>();

const notifyListeners = () => listeners.forEach((l) => l());

/**
 * Tạo âm thanh chuông đôi (Ding-Dong) bằng Web Audio API
 */
export const playNotificationChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    // Nốt 1: G5 (783.99 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.frequency.setValueAtTime(783.99, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.2, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Nốt 2: C6 (1046.50 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.frequency.setValueAtTime(1046.50, now + 0.12);
    gain2.gain.setValueAtTime(0, now + 0.12);
    gain2.gain.linearRampToValueAtTime(0.25, now + 0.14);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.55);
  } catch (e) {
    console.warn('[Audio] Không thể phát chuông:', e);
  }
};

export const notificationService = {
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getNotifications: () => [...NOTIFICATIONS_STORAGE],

  fetchNotifications: async () => {
    try {
      const res: any = await apiClient.get('/notifications?limit=50');
      const items = res?.data || [];
      NOTIFICATIONS_STORAGE = items.map((item: any) => ({
        id: String(item.id),
        type: item.type,
        title: item.title,
        description: item.description,
        time: new Date(item.createdAt).toLocaleTimeString(),
        createdAt: item.createdAt,
        isRead: Boolean(item.isRead),
        targetUrl: item.targetUrl,
      }));
      items.forEach((item: any) => processedNotificationIds.add(String(item.id)));
      notifyListeners();
    } catch (e) {
      console.warn('Lỗi lấy danh sách thông báo:', e);
    }
  },

  initSocket: () => {
    const socket = getSocket();

    // 1. Dọn dẹp listener cũ trước khi đăng ký mới (tránh Hot-Reload nhân bản)
    socket.off('new_appointment');

    // 2. Đăng ký nhận sự kiện
    socket.on('new_appointment', (payload: any) => {
      const notifId = String(payload.notification?.id || payload.code || `notif_${Date.now()}`);

      // 3. CHỐNG TRÙNG LẶP: Bỏ qua nếu tin này đã xử lý
      if (processedNotificationIds.has(notifId) || NOTIFICATIONS_STORAGE.some((n) => n.id === notifId)) {
        return;
      }
      processedNotificationIds.add(notifId);

      // 4. Phát chuông
      playNotificationChime();

      // 5. Cập nhật Store nội bộ để tăng Badge chuông
      const notifItem: NotificationItem = {
        id: notifId,
        type: 'appointment',
        title: payload.notification?.title || 'Lịch hẹn mới!',
        description: `Bệnh nhân ${payload.patientName} đặt "${payload.serviceName}"`,
        time: 'Vừa xong',
        createdAt: new Date().toISOString(),
        isRead: false,
        targetUrl: payload.notification?.targetUrl || '/appointments',
      };
      NOTIFICATIONS_STORAGE = [notifItem, ...NOTIFICATIONS_STORAGE];
      notifyListeners();

      // 6. Hiển thị Popup Toast của Ant Design với key định danh
      notification.open({
        key: `notif_${notifId}`, // Đảm bảo Ant Design chỉ render tối đa 1 thẻ
        message: <span className="font-bold text-slate-800">{payload.notification?.title}</span>,
        description: (
          <div className="text-xs space-y-1">
            <div><strong>Khách hàng:</strong> {payload.patientName} ({payload.patientPhone})</div>
            <div><strong>Dịch vụ:</strong> {payload.serviceName}</div>
            <div><strong>Thời gian:</strong> {payload.startTime} - {payload.appointmentDate}</div>
          </div>
        ),
        icon: <CalendarOutlined style={{ color: '#fa8c16' }} />,
        duration: 8,
        btn: (
          <Button
            type="primary"
            size="small"
            onClick={() => {
              notification.destroy(`notif_${notifId}`);
              window.dispatchEvent(new CustomEvent('CMS_NAVIGATE', { detail: notifItem.targetUrl }));
            }}
          >
            Xem chi tiết
          </Button>
        ),
      });

      // 7. Phát sự kiện để màn hình danh sách tự tải lại dữ liệu mới nhất
      window.dispatchEvent(new CustomEvent('REFETCH_APPOINTMENTS', { detail: payload }));
    });
  },
};
```

### Bước 4: Tích hợp vào Layout và Trang Danh Sách

1. **Khởi tạo kết nối tại `DashboardLayout.tsx`**:
   ```tsx
   useEffect(() => {
     notificationService.initSocket();
     notificationService.fetchNotifications();
   }, []);
   ```

2. **Tự động làm mới bảng tại `AppointmentList.tsx`**:
   ```tsx
   useEffect(() => {
     const handleAutoRefetch = () => {
       fetchAppointments();
       fetchStats();
     };
     window.addEventListener('REFETCH_APPOINTMENTS', handleAutoRefetch);
     return () => {
       window.removeEventListener('REFETCH_APPOINTMENTS', handleAutoRefetch);
     };
   }, [fetchAppointments]);
   ```

---

## 7. CÁC LỖI KINH ĐIỂN THƯỜNG GẶP VÀ CÁCH KHẮC PHỤC

### Lỗi 1: Bắn 2 thông báo cùng lúc (Duplicate Notifications)
- **Nguyên nhân 1 (Backend)**: Gọi đồng thời `io.to('room').emit()` và `io.emit()`.
- **Nguyên nhân 2 (Frontend)**: Trong môi trường dev của React (React.StrictMode), các `useEffect` chạy 2 lần. Nếu không gọi `socket.off('event')` trước `socket.on('event')`, sẽ có 2 hàm callback cùng lắng nghe một socket.
- **Khắc phục**:
  - Backend chỉ dùng 1 lệnh `io.to('staff_channel').emit()`.
  - Frontend luôn gọi `socket.off(event)` trước khi đăng ký.
  - Sử dụng `processedNotificationIds` để deduplicate dữ liệu.
  - Sử dụng thuộc tính `key` trong Ant Design `notification.open({ key: notifId, ... })`.

### Lỗi 2: Lỗi CORS khi kết nối Socket
- **Hiện tượng**: Console trình duyệt báo lỗi `Access-Control-Allow-Origin`.
- **Nguyên nhân**: Cấu hình CORS của Express (`cors()`) **không áp dụng** tự động cho Socket.IO.
- **Khắc phục**: Khai báo rõ `cors` trong option của `new SocketIOServer(httpServer, { cors: { origin: ... } })`.

### Lỗi 3: Rò rỉ bộ nhớ (Memory Leak)
- **Hiện tượng**: Server càng chạy lâu càng chậm, RAM tăng dần.
- **Nguyên nhân**: Quên gỡ event listener khi client disconnect hoặc đăng ký anonymous function không kiểm soát.
- **Khắc phục**: Quản lý listener tập trung, hủy listener ở cleanup của component.

### Lỗi 4: Âm thanh không kêu do chính sách Autoplay của trình duyệt
- **Hiện tượng**: Không nghe thấy tiếng chuông khi có thông báo mới.
- **Nguyên nhân**: Chrome/Edge/Firefox chặn tự động phát âm thanh nếu người dùng chưa tương tác (click/gõ phím) trên trang web ít nhất 1 lần.
- **Khắc phục**: Trong `playNotificationChime()`, luôn kiểm tra `if (ctx.state === 'suspended') ctx.resume();` và đảm bảo trang web có tương tác đầu vào từ người dùng (như đăng nhập, click menu).

---

## 8. MỞ RỘNG TRONG MÔI TRƯỜNG PRODUCTION (SCALING & AUTH)

### 8.1 Xác thực kết nối Socket qua JWT Token
Không nên cho phép socket kết nối ẩn danh nếu là hệ thống nội bộ. Sử dụng Middleware của Socket.IO:

```typescript
// Backend Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.headers['authorization'];
  if (!token) {
    return next(new Error('Authentication error: Token required'));
  }
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    socket.data.user = user; // Gắn thông tin người dùng vào socket instance
    next();
  } catch (err) {
    next(new Error('Authentication error: Invalid token'));
  }
});
```

Phía Frontend:
```typescript
const socket = io('http://localhost:5000', {
  auth: {
    token: `Bearer ${getAccessToken()}`
  }
});
```

### 8.2 Mở rộng ngang đa Server (Horizontal Scaling với Redis Adapter)
Khi hệ thống có hàng ngàn bác sĩ, phòng khám cần chạy 2 hoặc nhiều Docker backend container (Server 1, Server 2) đứng sau Nginx Load Balancer:

```
[CMS Client] ----> [Server 1 (Socket.IO)] \
                                            ===> [Redis Pub/Sub Adapter]
[Web Client] ----> [Server 2 (Socket.IO)] /
```

- Nếu không có Redis: Khi bệnh nhân kết nối tới Server 2 đặt lịch, chỉ những ai đang kết nối vào Server 2 mới nhận được thông báo. Những ai ở Server 1 sẽ **bị mất thông báo**.
- Giải pháp: Cài đặt `@socket.io/redis-adapter`:
  ```bash
  npm install @socket.io/redis-adapter redis
  ```
  ```typescript
  import { createClient } from 'redis';
  import { createAdapter } from '@socket.io/redis-adapter';

  const pubClient = createClient({ url: 'redis://localhost:6379' });
  const subClient = pubClient.duplicate();

  await Promise.all([pubClient.connect(), subClient.connect()]);
  io.adapter(createAdapter(pubClient, subClient));
  ```
  Lúc này, mọi lệnh `io.to('staff_channel').emit(...)` trên bất kỳ server nào cũng sẽ được đồng bộ hóa tức thì xuyên suốt toàn bộ cụm cluster!

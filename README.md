# Socket.IO Chat Application

Một ứng dụng chat đơn giản sử dụng Node.js, Express và Socket.IO. Được thiết kế cho mục đích học Socket.IO, đặc biệt hữu ích khi phát triển client Socket.IO trên Flutter.

## 🚀 Tính Năng

- **Chat Toàn Cục** - Gửi tin nhắn cho tất cả người dùng đang kết nối
- **Tạo Nhóm Chat** - Người dùng có thể tạo các nhóm chat riêng
- **Lưu Lịch Sử** - Lưu lại 10 tin nhắn gần nhất cho mỗi phòng chat
- **Giao Diện Web** - Giao diện web đơn giản, sạch sẽ và dễ sử dụng
- **Real-time Communication** - Sử dụng WebSocket để gửi tin nhắn theo thời gian thực

## 📋 Yêu Cầu

- Node.js v14+ 
- npm hoặc yarn

## 🔧 Cài Đặt

1. Cài đặt dependencies:
```bash
npm install
```

2. Chạy server:
```bash
npm start
```

3. Mở trình duyệt: `http://localhost:3000`

Hoặc sử dụng nodemon cho development:
```bash
npm run dev
```

## 📡 Socket.IO Events

### Client → Server

**Chat Toàn Cục:**
- `join` - Tham gia với username: `{username: 'Tên'}`
- `global_message` - Gửi tin nhắn: `{text: 'Nội dung'}`

**Quản Lý Nhóm:**
- `create_group` - Tạo nhóm: `{groupName: 'Tên nhóm'}`
- `join_group` - Tham gia nhóm: `{groupId: 'group_xxx'}`
- `leave_group` - Rời nhóm: `{groupId: 'group_xxx'}`
- `group_message` - Gửi tin nhắn nhóm: `{groupId: 'group_xxx', text: 'Nội dung'}`
- `get_groups` - Lấy danh sách nhóm

### Server → Client

**Thông Báo Chung:**
- `user_joined` - Người dùng tham gia
- `user_left` - Người dùng rời đi
- `receive_global_message` - Nhận tin nhắn toàn cục
- `load_global_messages` - Tải lịch sử chat toàn cục

**Thông Báo Nhóm:**
- `group_created` - Nhóm được tạo
- `group_list` / `group_list_updated` - Danh sách nhóm cập nhật
- `receive_group_message` - Nhận tin nhắn nhóm
- `load_group_messages` - Tải lịch sử chat nhóm
- `user_joined_group` - Người dùng tham gia nhóm
- `user_left_group` - Người dùng rời nhóm

## 🎯 Sử Dụng với Flutter

### 1. Thêm package vào `pubspec.yaml`:
```yaml
dependencies:
  socket_io_client: ^2.0.0
```

### 2. Ví dụ kết nối:
```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;

class ChatService {
  late IO.Socket socket;

  void connect(String serverUrl) {
    socket = IO.io(
      'http://localhost:3000',
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .build(),
    );

    socket.connect();

    // Tham gia với username
    socket.emit('join', {'username': 'Flutter User'});

    // Lắng nghe tin nhắn toàn cục
    socket.on('receive_global_message', (data) {
      print('New message: ${data['text']} from ${data['username']}');
    });

    // Lắng nghe danh sách nhóm
    socket.on('group_list', (data) {
      print('Available groups: $data');
    });
  }

  void sendGlobalMessage(String text) {
    socket.emit('global_message', {'text': text});
  }

  void createGroup(String groupName) {
    socket.emit('create_group', {'groupName': groupName});
  }

  void joinGroup(String groupId) {
    socket.emit('join_group', {'groupId': groupId});
  }

  void sendGroupMessage(String groupId, String text) {
    socket.emit('group_message', {
      'groupId': groupId,
      'text': text
    });
  }

  void leaveGroup(String groupId) {
    socket.emit('leave_group', {'groupId': groupId});
  }

  void disconnect() {
    socket.disconnect();
  }
}
```

## 💾 Lưu Trữ Dữ Liệu

- **Lưu trong bộ nhớ** (in-memory), mất khi server restart
- Mỗi phòng chỉ lưu **10 tin nhắn gần nhất**
- **Không có cơ sở dữ liệu** - chỉ dùng cho learning purpose

## 📁 Cấu Trúc Thư Mục

```
demo_socketIO/
├── server.js           # Server Socket.IO chính
├── package.json        # Dependencies
├── public/
│   └── index.html      # Giao diện web
└── README.md           # Tài liệu này
```

## 🧪 Test Ứng Dụng

1. Cài đặt và chạy server
2. Mở nhiều tab browser
3. Nhập tên người dùng khác nhau
4. Test chat toàn cục
5. Tạo nhóm và test chat nhóm

## 🐛 Troubleshooting

| Vấn đề | Giải pháp |
|--------|-----------|
| "Connection refused" | Đảm bảo server chạy `npm start`, port 3000 |
| Tin nhắn không hiển thị | Kiểm tra console (F12), network tab |
| Không thấy nhóm | Reload trang, kiểm tra server log |

## 🔌 Luồng Dữ Liệu

**Chat Toàn Cục:**
```
Client A → Server → broadcast → Client B, C, D
```

**Chat Nhóm:**
```
Client A → Server → only to group members → Client B, C (cùng nhóm)
                                          ✗ Client D (khác nhóm)
```

---

**Mẹo Debug:** Bật debug mode trên network:
```javascript
// Browser console
localStorage.debug = 'socket.io-client:*';
```

Được tạo cho mục đích học Socket.IO và phát triển Flutter 🚀
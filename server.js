const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// In-memory storage
let globalMessages = []; // Lưu 10 tin nhắn toàn cục gần nhất
let groups = {}; // { groupId: { name, members: [], messages: [] } }
let users = {}; // { socketId: { id, username, currentRoom } }

const MAX_MESSAGES = 10;

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket.IO events
io.on('connection', (socket) => {
  console.log('🔗 User connected:', socket.id);

  // User joins
  socket.on('join', (data) => {
    const { username } = data;
    users[socket.id] = {
      id: socket.id,
      username: username,
      currentRoom: 'global'
    };

    // Gửi lịch sử tin nhắn toàn cục
    socket.emit('load_global_messages', globalMessages);

    // Thông báo user mới
    io.emit('user_joined', {
      username: username,
      message: `${username} đã tham gia`
    });

    console.log(`👤 ${username} joined`);
  });

  // Global chat message
  socket.on('global_message', (data) => {
    const user = users[socket.id];
    if (!user) return;

    const message = {
      id: Date.now(),
      username: user.username,
      text: data.text,
      timestamp: new Date().toISOString(),
      type: 'global'
    };

    // Giữ only 10 messages
    globalMessages.push(message);
    if (globalMessages.length > MAX_MESSAGES) {
      globalMessages.shift();
    }

    // Broadcast to all users
    io.emit('receive_global_message', message);
    console.log(`💬 Global: ${user.username}: ${data.text}`);
  });

  // Create group
  socket.on('create_group', (data) => {
    const { groupName } = data;
    const groupId = 'group_' + Date.now();
    const user = users[socket.id];

    groups[groupId] = {
      id: groupId,
      name: groupName,
      members: [socket.id],
      messages: []
    };

    socket.join(groupId);
    users[socket.id].currentRoom = groupId;

    // Notify thành công
    socket.emit('group_created', {
      groupId: groupId,
      groupName: groupName,
      message: `Nhóm "${groupName}" đã được tạo`
    });

    io.emit('group_list_updated', getGroupsList());
    console.log(`📁 Group created: ${groupName} (${groupId})`);
  });

  // List all groups
  socket.on('get_groups', () => {
    socket.emit('group_list', getGroupsList());
  });

  // Join group
  socket.on('join_group', (data) => {
    const { groupId } = data;
    const user = users[socket.id];
    const group = groups[groupId];

    if (!group) {
      socket.emit('error', 'Nhóm không tồn tại');
      return;
    }

    // Add member to group
    if (!group.members.includes(socket.id)) {
      group.members.push(socket.id);
    }

    socket.join(groupId);
    users[socket.id].currentRoom = groupId;

    // Gửi lịch sử tin nhắn nhóm
    socket.emit('load_group_messages', {
      groupId: groupId,
      messages: group.messages
    });

    // Thông báo member mới
    io.to(groupId).emit('user_joined_group', {
      groupId: groupId,
      username: user.username,
      message: `${user.username} đã tham gia nhóm`
    });

    console.log(`👤 ${user.username} joined group ${group.name}`);
  });

  // Group chat message
  socket.on('group_message', (data) => {
    const { groupId, text } = data;
    const user = users[socket.id];
    const group = groups[groupId];

    if (!group) {
      socket.emit('error', 'Nhóm không tồn tại');
      return;
    }

    const message = {
      id: Date.now(),
      username: user.username,
      text: text,
      timestamp: new Date().toISOString(),
      type: 'group'
    };

    // Keep only 10 messages
    group.messages.push(message);
    if (group.messages.length > MAX_MESSAGES) {
      group.messages.shift();
    }

    // Broadcast to group members
    io.to(groupId).emit('receive_group_message', {
      groupId: groupId,
      message: message
    });

    console.log(`💬 Group [${group.name}]: ${user.username}: ${text}`);
  });

  // Leave group
  socket.on('leave_group', (data) => {
    const { groupId } = data;
    const user = users[socket.id];
    const group = groups[groupId];

    if (group) {
      group.members = group.members.filter(id => id !== socket.id);
      socket.leave(groupId);
      users[socket.id].currentRoom = 'global';

      io.to(groupId).emit('user_left_group', {
        groupId: groupId,
        username: user.username,
        message: `${user.username} đã rời nhóm`
      });

      console.log(`👤 ${user.username} left group ${group.name}`);
    }
  });

  // Get online users
  socket.on('get_users', () => {
    const onlineUsers = Object.values(users).map(u => ({
      id: u.id,
      username: u.username,
      currentRoom: u.currentRoom
    }));
    socket.emit('user_list', onlineUsers);
  });

  // Disconnect
  socket.on('disconnect', () => {
    const user = users[socket.id];
    if (user) {
      console.log(`🔌 User disconnected: ${user.username}`);

      // Remove from groups
      Object.values(groups).forEach(group => {
        group.members = group.members.filter(id => id !== socket.id);
      });

      io.emit('user_left', {
        username: user.username,
        message: `${user.username} đã rời phòng`
      });

      delete users[socket.id];
    }
  });
});

function getGroupsList() {
  return Object.values(groups).map(g => ({
    id: g.id,
    name: g.name,
    memberCount: g.members.length,
    messageCount: g.messages.length
  }));
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

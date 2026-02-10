const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: '*', 
  credentials: true
}));

const io = socketIo(server, {
  cors: {
    origin: '*', 
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

app.use(express.json());

const maleQueue = [];
const femaleQueue = [];

const activeMatches = new Map();

const users = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (userData) => {
    const { name, age, gender } = userData;
    
    if (!name || !age || !gender) {
      socket.emit('error', { message: 'Invalid user data' });
      return;
    }

    users.set(socket.id, {
      id: socket.id,
      name,
      age,
      gender: gender.toLowerCase()
    });

    console.log(`User ${name} (${gender}) joined`);

    addToQueueAndMatch(socket);
  });

  socket.on('offer', (data) => {
    const match = activeMatches.get(socket.id);
    if (match && match.partnerId) {
      io.to(match.partnerId).emit('offer', {
        offer: data.offer,
        from: socket.id
      });
    }
  });

  socket.on('answer', (data) => {
    const match = activeMatches.get(socket.id);
    if (match && match.partnerId) {
      io.to(match.partnerId).emit('answer', {
        answer: data.answer,
        from: socket.id
      });
    }
  });

  socket.on('ice-candidate', (data) => {
    const match = activeMatches.get(socket.id);
    if (match && match.partnerId) {
      io.to(match.partnerId).emit('ice-candidate', {
        candidate: data.candidate,
        from: socket.id
      });
    }
  });

  socket.on('chat-message', (message) => {
    const match = activeMatches.get(socket.id);
    if (match && match.partnerId) {
      const user = users.get(socket.id);
      io.to(match.partnerId).emit('chat-message', {
        message,
        from: user.name,
        timestamp: Date.now()
      });
    }
  });

  socket.on('stop', () => {
    handleStop(socket);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    handleDisconnect(socket);
  });
});

function addToQueueAndMatch(socket) {
  const user = users.get(socket.id);
  if (!user) return;

  const queue = user.gender === 'male' ? maleQueue : femaleQueue;
  const oppositeQueue = user.gender === 'male' ? femaleQueue : maleQueue;

  removeFromQueues(socket.id);
  removeFromMatch(socket.id);

  if (oppositeQueue.length > 0) {
    const partnerId = oppositeQueue.shift();
    const partnerSocket = io.sockets.sockets.get(partnerId);
    
    if (partnerSocket) {
      createMatch(socket, partnerSocket);
    } else {
      queue.push(socket.id);
      socket.emit('waiting', { queuePosition: queue.length });
    }
  } else {
    queue.push(socket.id);
    socket.emit('waiting', { queuePosition: queue.length });
  }
}

function createMatch(socket1, socket2) {
  const user1 = users.get(socket1.id);
  const user2 = users.get(socket2.id);

  activeMatches.set(socket1.id, {
    partnerId: socket2.id,
    startTime: Date.now()
  });
  
  activeMatches.set(socket2.id, {
    partnerId: socket1.id,
    startTime: Date.now()
  });

  socket1.emit('matched', {
    partner: {
      name: user2.name,
      age: user2.age
    },
    initiator: true
  });

  socket2.emit('matched', {
    partner: {
      name: user1.name,
      age: user1.age
    },
    initiator: false
  });

  console.log(`Matched: ${user1.name} with ${user2.name}`);
}

function handleStop(socket) {
  const match = activeMatches.get(socket.id);
  
  if (match && match.partnerId) {
    const partnerSocket = io.sockets.sockets.get(match.partnerId);
    
    if (partnerSocket) {
      io.to(match.partnerId).emit('partner-disconnected');
      
      setTimeout(() => {
        if (io.sockets.sockets.get(match.partnerId)) {
          addToQueueAndMatch(partnerSocket);
        }
      }, 1000);
    }
    
    activeMatches.delete(socket.id);
    activeMatches.delete(match.partnerId);
  }
  
  addToQueueAndMatch(socket);
}

function handleDisconnect(socket) {
  const match = activeMatches.get(socket.id);
  
  if (match && match.partnerId) {
    io.to(match.partnerId).emit('partner-disconnected');
    activeMatches.delete(match.partnerId);
    
    const partnerSocket = io.sockets.sockets.get(match.partnerId);
    if (partnerSocket) {
      setTimeout(() => {
        if (io.sockets.sockets.get(match.partnerId)) {
          addToQueueAndMatch(partnerSocket);
        }
      }, 1000);
    }
  }
  
  removeFromQueues(socket.id);
  activeMatches.delete(socket.id);
  users.delete(socket.id);
}

function removeFromQueues(socketId) {
  const maleIndex = maleQueue.indexOf(socketId);
  if (maleIndex > -1) maleQueue.splice(maleIndex, 1);
  
  const femaleIndex = femaleQueue.indexOf(socketId);
  if (femaleIndex > -1) femaleQueue.splice(femaleIndex, 1);
}

function removeFromMatch(socketId) {
  const match = activeMatches.get(socketId);
  if (match && match.partnerId) {
    activeMatches.delete(match.partnerId);
  }
  activeMatches.delete(socketId);
}

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    activeUsers: users.size,
    activeMatches: activeMatches.size / 2,
    maleQueue: maleQueue.length,
    femaleQueue: femaleQueue.length,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/stats', (req, res) => {
  res.json({
    totalUsers: users.size,
    activeMatches: activeMatches.size / 2,
    queues: {
      male: maleQueue.length,
      female: femaleQueue.length
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 WebRTC Signaling Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📈 Stats API: http://localhost:${PORT}/api/stats`);
});
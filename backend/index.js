const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const multer = require('multer');
require('dotenv').config();

const { initDB } = require('./config/database');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: ['http://localhost:5173', 'https://pixematch.vercel.app', "http://localhost:8080"],
  credentials: true
}));

const io = socketIo(server, {
  cors: {
    origin: ['http://localhost:5173', 'https://pixematch.vercel.app'],
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);

const waitingQueue = [];
const activeMatches = new Map();
const videoChatUsers = new Map();
const browsingUsers = new Map();
const matchRequests = new Map(); 

io.on('connection', (socket) => {
  console.log(`\n✅ NEW CONNECTION`);
  console.log(`  🔌 Socket ID: ${socket.id}`);
  console.log(`  ⏰ Time: ${new Date().toLocaleTimeString()}`);
  console.log(`  📊 Active connections: ${io.engine.clientsCount}\n`);

  socket.on('register-presence', (userData) => {
    console.log(`\n👥 User registering presence:`);
    console.log(`  📝 Name: ${userData.name}`);
    console.log(`  🔌 Socket: ${socket.id}\n`);
    
    browsingUsers.set(socket.id, {
      ...userData,
      socketId: socket.id,
      lastSeen: Date.now()
    });
    console.log(`✅ ${userData.name} is now browsing`);
    console.log(`📊 Current browsing users: ${browsingUsers.size}`);
  });

  socket.on('send-match-request', ({ fromUser, toSocketId }) => {
    console.log(`Match request from ${fromUser.name} to ${toSocketId}`);
    
    if (browsingUsers.has(toSocketId)) {
      io.to(toSocketId).emit('match-request-received', {
        from: fromUser,
        fromSocketId: socket.id
      });
      
      if (!matchRequests.has(toSocketId)) {
        matchRequests.set(toSocketId, []);
      }
      matchRequests.get(toSocketId).push({
        from: socket.id,
        userData: fromUser,
        timestamp: Date.now()
      });
      
      socket.emit('match-request-sent', { success: true });
    } else {
      socket.emit('match-request-failed', { error: 'User not available' });
    }
  });

socket.on('accept-match-request', ({ fromSocketId }) => {
  console.log(`\n✅ MATCH REQUEST ACCEPTED`);
  console.log(`  Acceptor: ${socket.id}`);
  console.log(`  Requester: ${fromSocketId}\n`);
  
  const requesterSocket = io.sockets.sockets.get(fromSocketId);
  
  if (requesterSocket) {
    const acceptor = browsingUsers.get(socket.id);
    const requester = browsingUsers.get(fromSocketId);
    
    if (acceptor && requester) {
      console.log(`  Acceptor name: ${acceptor.name}`);
      console.log(`  Requester name: ${requester.name}`);

      browsingUsers.delete(socket.id);
      browsingUsers.delete(fromSocketId);
      
      videoChatUsers.set(socket.id, acceptor);
      videoChatUsers.set(fromSocketId, requester);
      
      activeMatches.set(socket.id, {
        partnerId: fromSocketId,
        startTime: Date.now(),
        partnerName: requester.name,
        isRequestBased: true
      });
      
      activeMatches.set(fromSocketId, {
        partnerId: socket.id,
        startTime: Date.now(),
        partnerName: acceptor.name,
        isRequestBased: true
      });
      
      matchRequests.delete(socket.id);
      matchRequests.delete(fromSocketId);

      requesterSocket.emit('match-request-accepted', { partner: acceptor, initiator: true });
      
      console.log(`✅ Requester notified of accepted match`);
    }
  }
});

socket.on('decline-match-request', ({ fromSocketId }) => {
  console.log(`${socket.id} declined match request from ${fromSocketId}`);
  
  const requests = matchRequests.get(socket.id) || [];
  const filtered = requests.filter(r => r.from !== fromSocketId);
  matchRequests.set(socket.id, filtered);
  
  io.to(fromSocketId).emit('match-request-declined', { fromSocketId: socket.id });
});

  socket.on('join', (userData) => {
    const { name, age, gender } = userData;
    
    if (!name || !age || !gender) {
      console.error('❌ Invalid user data for join:', userData);
      socket.emit('error', { message: 'Invalid user data' });
      return;
    }

    console.log(`\n🎬 User attempting to join video chat:`);
    console.log(`  📝 Name: ${name}`);
    console.log(`  🎂 Age: ${age}`);
    console.log(`  👫 Gender: ${gender}`);
    console.log(`  🔌 Socket: ${socket.id}\n`);

    browsingUsers.delete(socket.id);
    
    videoChatUsers.set(socket.id, {
      id: socket.id,
      name,
      age,
      gender: gender.toLowerCase(),
      ...userData
    });

    console.log(`✅ ${name} added to videoChatUsers`);
    console.log(`📊 Current videoChatUsers: ${videoChatUsers.size}`);
    
    addToQueueAndMatch(socket);
  });

exports.verifiedSignup = async (req, res) => {
  const { email, code, username, password, age, gender, description, interests } = req.body;
  const images = req.files; 

  if (!email || !code || !username || !password || !age || !gender) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!images || images.length !== 3) {
    return res.status(400).json({ error: 'Exactly 3 images are required' });
  }

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const codeResult = await client.query(
      'SELECT * FROM verification_codes WHERE email = $1 AND code = $2 AND expires_at > NOW()',
      [email, code]
    );

    if (codeResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    const usernameCheck = await client.query('SELECT id FROM users WHERE username = $1', [username]);
    if (usernameCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Username already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const tempUserId = `temp_${Date.now()}`;
    const imageUrls = await Promise.all([
      uploadImage(images[0], tempUserId, 1),
      uploadImage(images[1], tempUserId, 2),
      uploadImage(images[2], tempUserId, 3)
    ]);

    let interestsArray = [];
    if (interests) {
      if (typeof interests === 'string') {
        try {
          interestsArray = JSON.parse(interests);
        } catch (e) {
          interestsArray = interests.split(',').map(i => i.trim()).filter(Boolean);
        }
      } else if (Array.isArray(interests)) {
        interestsArray = interests;
      }
    }

    const userResult = await client.query(
      `INSERT INTO users (username, email, password, age, gender, description, interests, image1, image2, image3)
       VALUES ($1, $2, $3, $4, $5, $6, $7::text[], $8, $9, $10)
       RETURNING id, username, email, age, gender`,
      [
        username, 
        email, 
        hashedPassword, 
        age, 
        gender, 
        description || '', 
        interestsArray, 
        imageUrls[0], 
        imageUrls[1], 
        imageUrls[2]
      ]
    );

    await client.query('DELETE FROM verification_codes WHERE email = $1', [email]);

    await client.query('COMMIT');

    const user = userResult.rows[0];
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        age: user.age,
        gender: user.gender
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Registration failed' });
  } finally {
    client.release();
  }
};

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
      const user = videoChatUsers.get(socket.id);
      if (user) {
        io.to(match.partnerId).emit('chat-message', {
          message,
          from: user.name,
          timestamp: Date.now()
        });
      }
    }
  });

  socket.on('stop', () => handleStop(socket));
  socket.on('disconnect', () => handleDisconnect(socket));
});

function addToQueueAndMatch(socket) {
  const user = videoChatUsers.get(socket.id);
  if (!user) {
    console.log(`❌ User not found in videoChatUsers for socket ${socket.id}`);
    return;
  }

  console.log(`📋 Adding ${user.name} to queue`);
  removeFromQueues(socket.id);
  removeFromMatch(socket.id);

  if (waitingQueue.length > 0) {
    const partnerId = waitingQueue.shift();
    const partnerSocket = io.sockets.sockets.get(partnerId);
    
    console.log(`🔗 Found waiting partner: ${partnerId}`);
    if (partnerSocket) {
      createMatch(socket, partnerSocket);
    } else {
      console.log(`⚠️  Partner socket not found, re-queueing`);
      addToQueueAndMatch(socket);
    }
  } else {
    waitingQueue.push(socket.id);
    const position = waitingQueue.length;
    console.log(`⏳ ${user.name} is now at position ${position} in queue`);
    socket.emit('waiting', { queuePosition: position });
    
    io.emit('user-waiting-for-match', { 
      count: waitingQueue.length 
    });
  }
}

function createMatch(socket1, socket2) {
  const user1 = videoChatUsers.get(socket1.id);
  const user2 = videoChatUsers.get(socket2.id);

  if (!user1 || !user2) {
    console.error(`❌ Missing user data for match`);
    return;
  }

  console.log(`\n🎉 ========== MATCH CREATED ==========`);
  console.log(`  👤 ${user1.name} (${socket1.id})`);
  console.log(`  ❤️  ${user2.name} (${socket2.id})`);
  console.log(`=====================================\n`);

  activeMatches.set(socket1.id, {
    partnerId: socket2.id,
    startTime: Date.now(),
    partnerName: user2.name
  });
  
  activeMatches.set(socket2.id, {
    partnerId: socket1.id,
    startTime: Date.now(),
    partnerName: user1.name
  });

  socket1.emit('matched', {
    partner: { name: user2.name, age: user2.age },
    initiator: true
  });

  socket2.emit('matched', {
    partner: { name: user1.name, age: user1.age },
    initiator: false
  });

  console.log(`✅ Both users notified of match`);
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
  const user = videoChatUsers.get(socket.id) || browsingUsers.get(socket.id);
  console.log(`\n❌ DISCONNECT`);
  console.log(`  🔌 Socket ID: ${socket.id}`);
  if (user) console.log(`  👤 User: ${user.name}`);
  console.log(`  ⏰ Time: ${new Date().toLocaleTimeString()}\n`);

  const match = activeMatches.get(socket.id);
  
  if (match && match.partnerId) {
    console.log(`⚠️  User had active match with ${match.partnerName}`);
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
  videoChatUsers.delete(socket.id);
  browsingUsers.delete(socket.id);
  matchRequests.delete(socket.id);
}

function removeFromQueues(socketId) {
  const index = waitingQueue.indexOf(socketId);
  if (index > -1) waitingQueue.splice(index, 1);
}

function removeFromMatch(socketId) {
  const match = activeMatches.get(socketId);
  if (match && match.partnerId) {
    activeMatches.delete(match.partnerId);
  }
  activeMatches.delete(socketId);
}

app.get('/api/users', (req, res) => {
  const users = [];
  
  browsingUsers.forEach((user, socketId) => {
    users.push({
      id: socketId,
      name: user.name || user.username,
      age: user.age,
      gender: user.gender,
      online: true,
      interests: user.interests || [],
      bio: user.bio || user.description || `Hi, I'm ${user.name}!`,
      country: user.country || 'Unknown',
      socketId: socketId
    });
  });
  
  console.log(`Fetching ${users.length} browsing users`);
  res.json(users);
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    stats: {
      activeConnections: io.engine.clientsCount,
      browsingUsers: browsingUsers.size,
      videoChatUsers: videoChatUsers.size,
      waitingInQueue: waitingQueue.length,
      activeMatches: Math.floor(activeMatches.size / 2),
      pendingMatchRequests: matchRequests.size
    },
    waitingQueue: waitingQueue.map(socketId => {
      const user = videoChatUsers.get(socketId);
      return {
        socketId,
        userName: user?.name || 'Unknown'
      };
    })
  });
});

const PORT = process.env.PORT || 3001;

initDB().then(() => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`🚀 VALENTINE'S MATCHING SERVER STARTED`);
    console.log(`${'='.repeat(50)}`);
    console.log(`🌐 Server:  http://localhost:${PORT}`);
    console.log(`📊 Health:  http://localhost:${PORT}/health`);
    console.log(`🎯 API Users: http://localhost:${PORT}/api/users`);
    console.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`${'='.repeat(50)}\n`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
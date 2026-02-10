# Backend - WebRTC Signaling Server

This is the backend signaling server for the video chat application. It handles WebRTC signaling, user matching, and real-time messaging using Socket.IO.

## Features

- WebRTC signaling (offer/answer/ICE candidates)
- Gender-based matching queue system
- Real-time text messaging
- Connection state management
- Health check endpoint

## API Endpoints

### GET /health
Returns server health status and statistics
```json
{
  "status": "ok",
  "activeUsers": 10,
  "activeMatches": 5,
  "maleQueue": 2,
  "femaleQueue": 1,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### GET /api/stats
Returns current server statistics
```json
{
  "totalUsers": 10,
  "activeMatches": 5,
  "queues": {
    "male": 2,
    "female": 1
  }
}
```

## Socket.IO Events

### Client -> Server

- `join` - Join the matching queue
  ```js
  socket.emit('join', { name: 'John', age: 25, gender: 'male' })
  ```

- `offer` - Send WebRTC offer
  ```js
  socket.emit('offer', { offer: rtcOffer })
  ```

- `answer` - Send WebRTC answer
  ```js
  socket.emit('answer', { answer: rtcAnswer })
  ```

- `ice-candidate` - Send ICE candidate
  ```js
  socket.emit('ice-candidate', { candidate: iceCandidate })
  ```

- `chat-message` - Send text message
  ```js
  socket.emit('chat-message', 'Hello!')
  ```

- `stop` - Stop current chat and find new match
  ```js
  socket.emit('stop')
  ```

### Server -> Client

- `waiting` - User is in queue
  ```js
  socket.on('waiting', (data) => {
    console.log('Queue position:', data.queuePosition)
  })
  ```

- `matched` - User has been matched
  ```js
  socket.on('matched', (data) => {
    console.log('Partner:', data.partner)
    console.log('Am I initiator?', data.initiator)
  })
  ```

- `offer` - Received WebRTC offer
- `answer` - Received WebRTC answer
- `ice-candidate` - Received ICE candidate
- `chat-message` - Received text message
- `partner-disconnected` - Partner left the chat
- `error` - Error occurred

## Running the Server

```bash
npm install
npm start
```

The server will start on port 5000 by default.

## Environment Variables

- `PORT` - Server port (default: 5000)

## Notes

- The server matches users based on opposite genders
- Users are automatically re-queued if their partner disconnects
- All WebRTC media streams are peer-to-peer (not routed through server)
- The server only handles signaling and text messages

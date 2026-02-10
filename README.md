# Video Chat Application

A real-time video chat application with WebRTC and Socket.IO, featuring random matching between users.

## Features

- Real-time video and audio chat
- Random user matching based on gender
- Text chat alongside video
- Queue system for waiting users
- Responsive design with modern UI

## Tech Stack

### Frontend
- React + TypeScript
- Vite
- TailwindCSS + shadcn/ui
- Socket.IO Client
- WebRTC
- Framer Motion

### Backend
- Node.js + Express
- Socket.IO
- WebRTC Signaling Server

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd <project-directory>
```

2. Install frontend dependencies
```bash
npm install
```

3. Install backend dependencies
```bash
cd backend
npm install
cd ..
```

4. Create environment file
```bash
cp .env.example .env
```

### Running the Application

1. Start the backend server (in one terminal)
```bash
cd backend
npm start
```
The backend will run on http://localhost:5000

2. Start the frontend development server (in another terminal)
```bash
npm run dev
```
The frontend will run on http://localhost:5173

3. Open your browser and navigate to http://localhost:5173

### Usage

1. Create an account or login
2. Complete your profile
3. Go to the Matching page
4. Click "Match & Chat" to start video chatting
5. The system will find a random match for you
6. Enjoy video chatting!

## Project Structure

```
.
├── backend/
│   ├── index.js          # WebRTC signaling server
│   └── package.json
├── src/
│   ├── components/       # React components
│   ├── hooks/
│   │   ├── useAuth.tsx   # Authentication hook
│   │   └── useWebRTC.ts  # WebRTC connection hook
│   ├── pages/
│   │   ├── Index.tsx     # Landing page
│   │   ├── Login.tsx     # Login/Register
│   │   ├── Matching.tsx  # User matching
│   │   └── VideoChat.tsx # Video chat interface
│   └── App.tsx
└── package.json
```

## Environment Variables

- `VITE_BACKEND_URL`: Backend server URL (default: http://localhost:5000)

## Notes

- Make sure to allow camera and microphone permissions in your browser
- For production deployment, you'll need to configure TURN servers for WebRTC
- The backend uses STUN servers for NAT traversal (Google's public STUN servers)

## License

MIT

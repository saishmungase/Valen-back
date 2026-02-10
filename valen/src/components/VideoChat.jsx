import React, { useState, useRef, useEffect } from 'react';
import { useWebRTC } from '../hooks/useWebRTC';
import './VideoChat.css';

const VideoChat = () => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [chatMessage, setChatMessage] = useState('');

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const {
    localStream,
    remoteStream,
    isConnected,
    partner,
    queuePosition,
    error,
    messages,
    isWaiting,
    joinChat,
    sendMessage,
    stopChat,
    setError
  } = useWebRTC('http://localhost:5000');

  // Update video refs when streams change
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const handleJoin = async () => {
    if (!name || !age || !gender) {
      setError('Please fill in all fields');
      return;
    }

    if (age < 13) {
      setError('You must be at least 13 years old');
      return;
    }

    // Just join - camera will be requested when matched
    joinChat({ name, age, gender });
    setHasJoined(true);
  };

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      sendMessage(chatMessage);
      setChatMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  if (!hasJoined) {
    return (
      <div className="container">
        <div className="card">
          <h1>🎥 Random Video Chat</h1>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="join-form">
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>

            <div className="form-group">
              <label>Age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Enter your age"
                min="13"
                max="100"
              />
            </div>

            <div className="form-group">
              <label>Gender</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <button onClick={handleJoin} disabled={!isConnected}>
              {isConnected ? 'Start Chatting' : 'Connecting to server...'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isWaiting || !partner) {
    return (
      <div className="container">
        <div className="card">
          <div className="waiting-screen">
            <h2>Looking for a match...</h2>
            <div className="spinner"></div>
            <p>Waiting for a match... (Position in queue: {queuePosition})</p>
            {error && (
              <div className="error-message" style={{ marginTop: '20px' }}>
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div className="partner-info">
          <h3>Connected with: {partner.name}</h3>
          <p>Age: {partner.age}</p>
        </div>

        <div className="video-container">
          <div className="video-wrapper">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
            />
            <div className="video-label">Partner</div>
          </div>

          <div className="video-wrapper">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="local-video"
            />
            <div className="video-label">You</div>
          </div>
        </div>

        <div className="chat-container">
          <div className="chat-messages">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`message ${msg.isSent ? 'sent' : 'received'}`}
              >
                <div className="message-sender">{msg.sender}</div>
                <div>{msg.text}</div>
              </div>
            ))}
          </div>

          <div className="chat-input-container">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
            />
            <button onClick={handleSendMessage}>Send</button>
          </div>
        </div>

        <div className="controls">
          <button className="btn-stop" onClick={stopChat}>
            Next Person
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoChat;
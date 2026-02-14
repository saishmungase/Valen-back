import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useVideoChat } from "@/hooks/useVideoChat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Video, VideoOff, Mic, MicOff, Phone, Send,
  MessageSquare, Shield, Flag, X,
} from "lucide-react";

const VideoChat = () => {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [message, setMessage] = useState("");

  const routePartner = (location.state as { partner?: any; initiator?: boolean })?.partner;
  const routeInitiator = (location.state as { partner?: any; initiator?: boolean })?.initiator;

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const {
    localStream,
    remoteStream,
    isConnected,
    partner,
    queuePosition,
    error,
    messages,
    isWaiting,
    isMatchingInProgress,
    sendMessage: sendChatMessage,
    stopChat,
    setPartnerData,
  } = useVideoChat();

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

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

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
    }
  }, [isLoggedIn, navigate]);

useEffect(() => {
  if (routePartner && routeInitiator !== undefined) {
    console.log('📍 Setting partner from route state:', routePartner, 'Initiator:', routeInitiator);
    setPartnerData(routePartner, routeInitiator);
  }
}, [routePartner, routeInitiator, setPartnerData]);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    sendChatMessage(message);
    setMessage("");
  };

  const handleStopChat = () => {
    stopChat();
    navigate("/matching");
  };

  if (!isLoggedIn) {
    return null;
  }

  if (isWaiting || !partner || isMatchingInProgress) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <p className="font-pixel text-primary text-xs mb-4">🔍 FINDING YOUR MATCH...</p>
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">
            {queuePosition > 0 ? `Queue position: ${queuePosition}` : 'Connecting...'}
          </p>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-destructive mt-4 text-sm"
            >
              {error}
            </motion.p>
          )}
          <Button 
            onClick={() => {
              stopChat();
              navigate("/matching");
            }} 
            className="mt-6 bg-secondary text-foreground"
            variant="outline"
          >
            Cancel
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Match Info Bar */}
      <motion.div
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-card border-b border-border px-4 py-3 flex items-center justify-between z-10"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <span className="text-xl">{partner.name.charAt(0)}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-semibold text-foreground text-sm">{partner.name}, {partner.age}</span>
              <span className="w-2 h-2 rounded-full bg-online-green animate-pulse" />
            </div>
            <p className="text-xs text-muted-foreground">Connected</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" title="Report">
            <Flag className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" title="Block">
            <Shield className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 relative bg-background">
          {/* Remote Video */}
          <div className="absolute inset-0">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          </div>

          {/* Self Video */}
          <div className="absolute bottom-4 right-4 w-32 h-44 rounded-xl pixel-border-subtle overflow-hidden bg-secondary">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover scale-x-[-1]"
            />
          </div>

          {/* Controls */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className={`rounded-full h-12 w-12 border-border ${isMuted ? "bg-destructive/20 border-destructive" : "bg-secondary"}`}
              onClick={() => {
                setIsMuted(!isMuted);
                if (localStream) {
                  localStream.getAudioTracks().forEach(track => {
                    track.enabled = isMuted;
                  });
                }
              }}
            >
              {isMuted ? <MicOff className="w-5 h-5 text-destructive" /> : <Mic className="w-5 h-5 text-foreground" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className={`rounded-full h-12 w-12 border-border ${isVideoOff ? "bg-destructive/20 border-destructive" : "bg-secondary"}`}
              onClick={() => {
                setIsVideoOff(!isVideoOff);
                if (localStream) {
                  localStream.getVideoTracks().forEach(track => {
                    track.enabled = isVideoOff;
                  });
                }
              }}
            >
              {isVideoOff ? <VideoOff className="w-5 h-5 text-destructive" /> : <Video className="w-5 h-5 text-foreground" />}
            </Button>
            <Button
              size="icon"
              className="rounded-full h-14 w-14 bg-destructive hover:bg-destructive/80"
              onClick={handleStopChat}
            >
              <Phone className="w-6 h-6 text-destructive-foreground rotate-[135deg]" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className={`rounded-full h-12 w-12 border-border ${showChat ? "bg-primary/20 border-primary" : "bg-secondary"}`}
              onClick={() => setShowChat(!showChat)}
            >
              <MessageSquare className="w-5 h-5 text-foreground" />
            </Button>
          </div>
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-l border-border bg-card flex flex-col w-80 shrink-0"
          >
            <div className="p-3 border-b border-border flex items-center justify-between">
              <span className="pixel-tag text-primary">CHAT</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowChat(false)}>
                <X className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-8">
                  No messages yet. Say hi! 👋
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.isSent ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                      msg.isSent
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-foreground"
                    }`}>
                      {!msg.isSent && (
                        <div className="text-xs opacity-70 mb-1">{msg.sender}</div>
                      )}
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="p-3 border-t border-border flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="bg-secondary border-border text-foreground text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <Button size="icon" className="bg-primary hover:bg-pink-deep shrink-0" onClick={handleSendMessage}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      {error && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-destructive/90 text-destructive-foreground px-4 py-2 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
};

export default VideoChat;

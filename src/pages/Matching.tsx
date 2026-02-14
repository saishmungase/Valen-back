import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useGlobalSocket } from "@/hooks/useGlobalSocket";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Video, MapPin, User as UserIcon, X, Check } from "lucide-react";

interface OnlineUser {
  id: string;
  name: string;
  age: number;
  gender: string;
  bio: string;
  interests: string[];
  country: string;
  socketId: string;
}

interface MatchRequest {
  from: OnlineUser;
  fromSocketId: string;
  timestamp: number;
}

const Matching = () => {
  const { user, isLoggedIn, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { socket, isConnected } = useGlobalSocket();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [incomingRequests, setIncomingRequests] = useState<MatchRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<string[]>([]);
  const [activeMatch, setActiveMatch] = useState<OnlineUser | null>(null);

useEffect(() => {
  if (!socket) return;

  socket.on('match-request-received', (data: { from: OnlineUser; fromSocketId: string }) => {
    console.log('📩 Incoming match request from:', data.from.name);
    
    setIncomingRequests(prev => {
      const exists = prev.find(r => r.fromSocketId === data.fromSocketId);
      if (exists) {
        console.log('⚠️ Request already exists, ignoring duplicate');
        return prev;
      }
      return [...prev, {
        from: data.from,
        fromSocketId: data.fromSocketId,
        timestamp: Date.now()
      }];
    });
  });

  socket.on('match-request-accepted', (data: { partner: OnlineUser; initiator: boolean }) => {
    console.log('✅ Match request accepted! Partner:', data.partner.name);
    setActiveMatch(data.partner);
    
    setIncomingRequests([]);
    setSentRequests([]);
    
    navigate('/chat/new', { state: { partner: data.partner, initiator: data.initiator } });
  });

  socket.on('match-request-declined', (data: { fromSocketId: string }) => {
    console.log('❌ Match request was declined');
    setSentRequests(prev => prev.filter(id => id !== data.fromSocketId));
  });

  return () => {
    socket.off('match-request-received');
    socket.off('match-request-accepted');
    socket.off('match-request-declined');
  };
}, [socket, navigate]);

  useEffect(() => {
    if (!socket) return;

    socket.on('match-request-received', (data: { from: OnlineUser; fromSocketId: string }) => {
      console.log('📩 Incoming match request from:', data.from.name);
      setIncomingRequests(prev => [...prev, {
        from: data.from,
        fromSocketId: data.fromSocketId,
        timestamp: Date.now()
      }]);
    });

    socket.on('match-request-accepted', (data: { partner: OnlineUser }) => {
      console.log('✅ Match request accepted! Partner:', data.partner.name);
      setActiveMatch(data.partner);
      setTimeout(() => {
        navigate('/chat/new', { state: { partner: data.partner, initiator: false } });
      }, 300);
    });

    socket.on('match-request-declined', () => {
      console.log('❌ Match request was declined');
      setSentRequests(prev => prev.filter(id => id !== currentIndex.toString()));
    });

    return () => {
      socket.off('match-request-received');
      socket.off('match-request-accepted');
      socket.off('match-request-declined');
    };
  }, [socket, navigate]);

  useEffect(() => {
    if (!isMatching) return;

    const fetchOnlineUsers = async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
        const response = await fetch(`${backendUrl}/api/users`);
        
        if (!response.ok) return;
        
        const data = await response.json();
        
        const filtered = data.filter((u: OnlineUser) => u.name !== user?.username);
        
        console.log('Online users:', filtered);
        setOnlineUsers(filtered);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchOnlineUsers();
    const interval = setInterval(fetchOnlineUsers, 2000);
    return () => clearInterval(interval);
  }, [user, isMatching]);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      navigate("/login");
    }
  }, [isLoggedIn, authLoading, navigate]);

  const handleStartMatching = () => {
    if (!socket || !user || !isConnected) {
      console.error('❌ Socket not connected or user not available');
      return;
    }

    console.log('🎯 Starting matching mode...');
    
    socket.emit('register-presence', {
      name: user.username,
      username: user.username,
      age: user.age || 25,
      gender: user.gender || 'other',
      interests: user.interests || [],
      bio: user.description || `Hi, I'm ${user.username}!`,
      description: user.description,
      country: user.country || 'Unknown'
    });

    console.log('✅ Registered for matching:', user.username);
    setIsMatching(true);
    setLoading(false);
  };

  const handleSendRequest = (targetUser: OnlineUser) => {
    if (!socket || !user) {
      console.error('❌ Socket not connected or user not available');
      return;
    }

    console.log(`📤 Sending match request to ${targetUser.name}`);
    
    socket.emit('send-match-request', {
      fromUser: {
        name: user.username,
        age: user.age || 25,
        gender: user.gender || 'other',
        interests: user.interests || [],
        bio: user.description || `Hi, I'm ${user.username}!`,
      },
      toSocketId: targetUser.socketId
    });

    setSentRequests(prev => [...prev, targetUser.socketId]);
  };

const handleAcceptRequest = (request: MatchRequest) => {
  if (!socket) return;

  console.log(`✅ Accepting match request from ${request.from.name}`);
  
  socket.emit('accept-match-request', {
    fromSocketId: request.fromSocketId
  });

  setActiveMatch(request.from);
  setIncomingRequests(prev => prev.filter(r => r.fromSocketId !== request.fromSocketId));
  
  navigate('/chat/new', { state: { partner: request.from, initiator: false } });
};

  const handleDeclineRequest = (request: MatchRequest) => {
    if (!socket) return;

    console.log(`❌ Declining match request from ${request.from.name}`);
    
    socket.emit('decline-match-request', {
      fromSocketId: request.fromSocketId
    });

    setIncomingRequests(prev => prev.filter(r => r.fromSocketId !== request.fromSocketId));
  };

  if (authLoading || !isLoggedIn) {
    return null;
  }

  if (!isMatching) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 pt-28 pb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card-surface rounded-2xl p-12 text-center"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary to-pink-deep flex items-center justify-center text-4xl font-heading font-bold text-white shadow-xl">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            
            <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
              Ready to Meet People?
            </h2>
            <p className="text-muted-foreground mb-8">
              Click below to start matching with people online
            </p>

            <Button
              onClick={handleStartMatching}
              className="h-14 px-8 gap-2 bg-primary hover:bg-pink-deep text-primary-foreground glow-pink-sm font-heading font-semibold text-lg"
            >
              <Heart className="w-6 h-6" />
              Start Matching
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex gap-4 p-4 pt-20 overflow-hidden">
        {/* Main content - Online users */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-heading font-bold text-foreground">
              👥 Online Users ({onlineUsers.length})
            </h2>
              <Button
                variant="outline"
                onClick={() => {
                  setIsMatching(false);
                  setSentRequests([]);
                  setIncomingRequests([]);
                  if (socket) {
                    socket.emit('cancel-matching');
                  }
                }}
              >
                Exit Matching
              </Button>
          </div>

          {onlineUsers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex items-center justify-center"
            >
              <div className="card-surface rounded-2xl p-12 text-center">
                <UserIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-heading font-bold text-foreground mb-2">No Users Online</h3>
                <p className="text-muted-foreground">Open another tab to test matching!</p>
              </div>
            </motion.div>
          ) : (
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="space-y-3">
                {onlineUsers.map((onlineUser) => (
                  <motion.div
                    key={onlineUser.socketId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="card-surface rounded-xl p-4 hover:bg-card/80 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-lg">
                          {onlineUser.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-heading font-semibold text-foreground">
                            {onlineUser.name}, {onlineUser.age}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {onlineUser.bio}
                          </p>
                        </div>
                        <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                      </div>
                    </div>
                    
                    <div className="flex gap-2 flex-wrap mb-2">
                      {(onlineUser.interests || []).slice(0, 2).map((interest, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {interest}
                        </Badge>
                      ))}
                    </div>

                    <Button
                      onClick={() => handleSendRequest(onlineUser)}
                      disabled={sentRequests.includes(onlineUser.socketId)}
                      className="w-full bg-primary hover:bg-pink-deep text-primary-foreground text-sm"
                    >
                      {sentRequests.includes(onlineUser.socketId) ? (
                        <>✓ Request Sent</>
                      ) : (
                        <>
                          <Heart className="w-4 h-4 mr-2" />
                          Send Request
                        </>
                      )}
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar - Incoming requests */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-80 bg-card rounded-2xl p-4 border border-border flex flex-col"
        >
          <h3 className="text-lg font-heading font-bold text-foreground mb-4">
            💌 Match Requests ({incomingRequests.length})
          </h3>

          {incomingRequests.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
              <div>
                <p className="text-sm">No requests yet</p>
                <p className="text-xs mt-1">When someone sends you a request, it will appear here</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-3">
              <AnimatePresence>
                {incomingRequests.map((request) => (
                  <motion.div
                    key={request.fromSocketId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-background rounded-lg p-3 border border-border"
                  >
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-10 h-10 rounded-full bg-primary/30 flex items-center justify-center font-bold">
                          {request.from.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-foreground">
                            {request.from.name}, {request.from.age}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Wants to match with you
                          </p>
                        </div>
                      </div>
                      
                      <p className="text-xs text-muted-foreground line-clamp-2 ml-12">
                        {request.from.bio}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAcceptRequest(request)}
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs"
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Accept
                      </Button>
                      <Button
                        onClick={() => handleDeclineRequest(request)}
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Decline
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Matching;
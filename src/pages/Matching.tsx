import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useUserPresence } from "@/hooks/useUserPresence";
import Navbar from "@/components/Navbar";
import ScanningRadar from "@/components/ScanningRadar";
import { computeMatch, MatchUser } from "@/lib/mockMatches";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Zap, Brain, MessageSquare, Video, MapPin, SkipForward } from "lucide-react";

const Matching = () => {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [matchedUsers, setMatchedUsers] = useState<string[]>([]);
  const [availableUsers, setAvailableUsers] = useState<MatchUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Register user presence with backend (separate from video chat)
  useUserPresence(user);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
        const response = await fetch(`${backendUrl}/api/users`);
        const data = await response.json();

        // Filter out current user and convert API users to MatchUser format
        const users: MatchUser[] = data
          .filter((u: any) => u.name !== user?.name)
          .map((u: any) => ({
            id: u.id,
            name: u.name,
            age: u.age,
            country: u.country,
            flag: u.flag,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`,
            online: u.online,
            interests: u.interests || [],
            values: u.values || [],
            personalityTags: u.personalityTags || [],
            bio: u.bio || `Hi, I'm ${u.name}!`,
            mode: u.mode || 'friendship'
          }));

        setAvailableUsers(users);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
    const interval = setInterval(fetchUsers, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [user]);

  const matches = useMemo(() => {
    if (!user || availableUsers.length === 0) return [];
    return availableUsers
      .map((candidate) =>
        computeMatch(
          user?.interests || [],
          user?.values || [],
          user?.personalityTags || [],
          user?.idealPartnerDescription || "",
          candidate
        )
      )
      .sort((a, b) => b.score - a.score);
  }, [user, availableUsers]);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
    }
  }, [isLoggedIn, navigate]);

  if (!isLoggedIn) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 pt-28 pb-16">
          <div className="card-surface rounded-2xl overflow-hidden shadow-2xl border-none">
            <ScanningRadar />
            <div className="p-8 text-center space-y-4">
              <h3 className="text-xl font-heading font-medium text-foreground">Finding your best match...</h3>
              <p className="text-muted-foreground text-sm">Analyzing shared interests, personality traits, and cosmic vibes.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const current = matches[currentIndex];
  const isFinished = currentIndex >= matches.length;

  const handleSkip = () => {
    setDirection("left");
    setShowDetails(false);
    setTimeout(() => {
      setCurrentIndex((i) => i + 1);
      setDirection(null);
    }, 300);
  };

  const handleMatch = () => {
    if (!current) return;
    // Navigate to video chat instead of just marking as matched
    navigate("/chat/new");
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-online-green";
    if (score >= 40) return "text-yellow-400";
    return "text-muted-foreground";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 pt-28 pb-16">
        {/* Matched count */}
        {matchedUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 text-center"
          >
            <span className="pixel-tag text-primary">{matchedUsers.length} MATCH{matchedUsers.length > 1 ? "ES" : ""}</span>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {isFinished ? (
            <motion.div
              key="finished"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card-surface rounded-2xl p-12 text-center"
            >
              <p className="font-pixel text-primary text-xs mb-4">NO MORE PROFILES</p>
              <p className="text-muted-foreground mb-6">
                {matchedUsers.length > 0
                  ? `You matched with ${matchedUsers.length} people! Start chatting now.`
                  : "Complete your profile to get better matches."}
              </p>
              <div className="flex flex-col gap-3 items-center">
                {matchedUsers.length > 0 && (
                  <Button
                    className="gap-2 bg-primary hover:bg-pink-deep text-primary-foreground glow-pink-sm font-heading"
                    onClick={() => navigate(`/chat/${matchedUsers[matchedUsers.length - 1]}`)}
                  >
                    <Video className="w-4 h-4" />
                    Chat with last match
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="border-border"
                  onClick={() => {
                    setCurrentIndex(0);
                    setMatchedUsers([]);
                  }}
                >
                  Start Over
                </Button>
              </div>
            </motion.div>
          ) : current ? (
            <motion.div
              key={current.user.id}
              initial={{ opacity: 0, x: direction === "left" ? 100 : direction === "right" ? -100 : 0, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{
                opacity: 0,
                x: direction === "left" ? -300 : direction === "right" ? 300 : 0,
                scale: 0.9,
                transition: { duration: 0.3 },
              }}
              transition={{ duration: 0.35 }}
              className="card-surface rounded-2xl overflow-hidden glass-card border-none"
            >
              {/* Profile Image */}
              <div className="relative aspect-[3/4] max-h-[420px] overflow-hidden">
                <img
                  src={current.user.avatar}
                  alt={current.user.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

                {/* Score badge */}
                <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm rounded-xl px-3 py-2 text-center">
                  <p className={`text-xl font-pixel ${getScoreColor(current.score)}`}>{current.score}%</p>
                  <p className="pixel-tag text-muted-foreground mt-0.5">MATCH</p>
                </div>

                {/* Online indicator */}
                {current.user.online && (
                  <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-background/60 backdrop-blur-sm rounded-full px-2.5 py-1">
                    <div className="w-2 h-2 rounded-full bg-online-green animate-pulse" />
                    <span className="text-[10px] font-medium text-foreground uppercase tracking-wider">Online</span>
                  </div>
                )}

                {/* Name overlay */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{current.user.flag}</span>
                    <h2 className="text-2xl font-heading font-bold text-foreground">
                      {current.user.name}, {current.user.age}
                    </h2>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    <span className="text-sm text-muted-foreground">{current.user.country}</span>
                  </div>
                </div>
              </div>

              {/* Bio & Match Info */}
              <div className="p-5">
                <p className="text-sm text-foreground mb-3">{current.user.bio}</p>

                {/* Quick match stats */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                  <div className="bg-secondary rounded-lg p-2 text-center">
                    <Heart className="w-3.5 h-3.5 text-primary mx-auto mb-0.5" />
                    <p className="text-xs text-muted-foreground">Interests</p>
                    <p className="font-heading font-bold text-foreground text-sm">{current.sharedInterests.length}</p>
                  </div>
                  <div className="bg-secondary rounded-lg p-2 text-center">
                    <Zap className="w-3.5 h-3.5 text-yellow-400 mx-auto mb-0.5" />
                    <p className="text-xs text-muted-foreground">Values</p>
                    <p className="font-heading font-bold text-foreground text-sm">{current.sharedValues.length}</p>
                  </div>
                  <div className="bg-secondary rounded-lg p-2 text-center">
                    <Brain className="w-3.5 h-3.5 text-blue-400 mx-auto mb-0.5" />
                    <p className="text-xs text-muted-foreground">Vibe</p>
                    <p className="font-heading font-bold text-foreground text-sm">{current.sharedPersonality.length}</p>
                  </div>
                  <div className="bg-secondary rounded-lg p-2 text-center">
                    <MessageSquare className="w-3.5 h-3.5 text-online-green mx-auto mb-0.5" />
                    <p className="text-xs text-muted-foreground">Text</p>
                    <p className="font-heading font-bold text-foreground text-sm">{Math.round(current.textSimilarity * 100)}%</p>
                  </div>
                </div>

                {/* Expandable explanation */}
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="w-full text-left"
                >
                  <p className="pixel-tag text-primary mb-1">WHY YOU MATCH</p>
                  <p className="text-xs text-muted-foreground">{current.explanation}</p>
                </button>

                <AnimatePresence>
                  {showDetails && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {current.sharedInterests.map((i) => (
                          <Badge key={i} className="bg-primary/20 text-primary border-none text-xs">{i}</Badge>
                        ))}
                        {current.sharedValues.map((v) => (
                          <Badge key={v} className="bg-yellow-400/20 text-yellow-400 border-none text-xs">{v}</Badge>
                        ))}
                        {current.sharedPersonality.map((p) => (
                          <Badge key={p} className="bg-blue-400/20 text-blue-400 border-none text-xs">{p}</Badge>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Action Buttons */}
              <div className="p-5 pt-0 flex items-center gap-3">
                <Button
                  variant="outline"
                  className="flex-1 h-14 gap-2 border-border bg-secondary hover:bg-muted text-foreground font-heading"
                  onClick={handleSkip}
                >
                  <SkipForward className="w-5 h-5 text-muted-foreground" />
                  Skip
                </Button>
                <Button
                  className="flex-[2] h-14 gap-2 bg-primary hover:bg-pink-deep text-primary-foreground glow-pink-sm font-heading font-semibold text-base"
                  onClick={handleMatch}
                >
                  <Heart className="w-5 h-5" />
                  Match & Chat
                </Button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Progress */}
        {!isFinished && (
          <div className="mt-4 flex items-center justify-center gap-2">
            {matches.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === currentIndex
                    ? "w-6 bg-primary"
                    : i < currentIndex
                      ? matchedUsers.includes(matches[i].user.id)
                        ? "w-1.5 bg-primary/50"
                        : "w-1.5 bg-muted"
                      : "w-1.5 bg-muted"
                  }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Matching;

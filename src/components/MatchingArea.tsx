import { Video, Sparkles, Heart, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const MatchingArea = () => {
  const navigate = useNavigate();
  const [onlineCount, setOnlineCount] = useState(184293);

  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineCount((prev) => prev + Math.floor(Math.random() * 5) - 2);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center h-full min-h-[500px] lg:min-h-[600px] rounded-2xl card-surface overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-pink-deep/5" />
      
      {/* Floating elements */}
      <motion.div
        animate={{
          y: [0, -20, 0],
          rotate: [0, 5, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-20 left-10 w-16 h-16 rounded-2xl bg-primary/10 backdrop-blur-sm"
      />
      <motion.div
        animate={{
          y: [0, 20, 0],
          rotate: [0, -5, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-32 right-16 w-20 h-20 rounded-full bg-pink-deep/10 backdrop-blur-sm"
      />

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 text-center px-4 max-w-2xl"
      >
        {/* Logo */}
        <h1 className="text-6xl md:text-7xl lg:text-8xl font-heading font-bold text-gradient-pink mb-6 tracking-tight">
          pixematch
        </h1>

        {/* Tagline */}
        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-lg mx-auto">
          Connect with people worldwide through instant video chat
        </p>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex items-center justify-center gap-2 mb-10 bg-secondary/50 backdrop-blur-sm rounded-full px-6 py-3 mx-auto w-fit"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-online-green animate-pulse" />
          <span className="text-sm font-medium text-foreground">
            {onlineCount.toLocaleString()} online now
          </span>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Button
            size="lg"
            className="gap-3 bg-primary hover:bg-pink-deep text-primary-foreground h-14 px-8 glow-pink font-heading font-semibold text-lg rounded-xl"
            onClick={() => navigate("/matching")}
          >
            <Video className="w-6 h-6" />
            Start Matching
            <Sparkles className="w-5 h-5" />
          </Button>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="flex items-center justify-center gap-6 mt-12 text-sm text-muted-foreground"
        >
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-primary" />
            <span>HD Video</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-primary" />
            <span>Live Chat</span>
          </div>
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-primary" />
            <span>Safe & Fun</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default MatchingArea;

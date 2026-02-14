import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, X, Video } from "lucide-react";

interface MatchRequest {
  from: {
    id: string;
    name: string;
    age: number;
    avatar: string;
  };
  fromSocketId: string;
}

interface MatchRequestPopupProps {
  request: MatchRequest;
  onAccept: () => void;
  onDecline: () => void;
}

const MatchRequestPopup = ({ request, onAccept, onDecline }: MatchRequestPopupProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      className="bg-card border-2 border-primary rounded-xl shadow-2xl overflow-hidden w-80 glow-pink"
    >
      <div className="bg-primary/10 p-3 border-b border-primary/20">
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4 text-primary animate-pulse" />
          <span className="font-heading font-semibold text-sm text-foreground">Match Request</span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <img
            src={request.from.avatar}
            alt={request.from.name}
            className="w-12 h-12 rounded-full border-2 border-primary"
          />
          <div>
            <h4 className="font-heading font-bold text-foreground">
              {request.from.name}, {request.from.age}
            </h4>
            <p className="text-xs text-muted-foreground">wants to video chat with you</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 gap-2 border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
            onClick={onDecline}
          >
            <X className="w-4 h-4" />
            Decline
          </Button>
          <Button
            className="flex-1 gap-2 bg-primary hover:bg-pink-deep text-primary-foreground glow-pink-sm"
            onClick={onAccept}
          >
            <Check className="w-4 h-4" />
            Accept
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default MatchRequestPopup;
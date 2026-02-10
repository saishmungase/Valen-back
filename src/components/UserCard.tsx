import { motion } from "framer-motion";

interface UserCardProps {
  image: string;
  name: string;
  age: number;
  country: string;
  flag: string;
  online?: boolean;
  delay?: number;
}

const UserCard = ({ image, name, age, country, flag, online = true, delay = 0 }: UserCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-xl overflow-hidden group cursor-pointer glass-card border-none"
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <img
        src={image}
        alt={name}
        className="w-full h-full object-cover aspect-[3/4] transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />

      {online && (
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-background/60 backdrop-blur-sm rounded-full px-2.5 py-1">
          <div className="w-2 h-2 rounded-full bg-online-green animate-pulse" />
          <span className="text-[10px] font-medium text-foreground uppercase tracking-wider">Online</span>
        </div>
      )}

      <div className="absolute bottom-3 left-3 right-3">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{flag}</span>
          <span className="font-heading font-semibold text-foreground text-sm">
            {name}, {age}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default UserCard;

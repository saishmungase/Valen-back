import { Video, Shield, Sparkles, Globe } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Video,
    title: "Live Video Chat",
    description: "Connect face-to-face with people around the world in real-time video conversations.",
  },
  {
    icon: Shield,
    title: "Safe & Moderated",
    description: "Advanced safety tools and community moderation keep your experience comfortable.",
  },
  {
    icon: Sparkles,
    title: "Smart Matching",
    description: "Our algorithm learns your preferences to find you the most compatible matches.",
  },
  {
    icon: Globe,
    title: "Global Community",
    description: "Meet people from 190+ countries. Filter by region to discover specific cultures.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 px-6">
      <div className="max-w-5xl mx-auto text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
          Video Chat & <span className="text-gradient-pink">Meet New People</span>
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Connect with interest-based matches around the world. Discover people who share your interests!
        </p>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="card-surface rounded-xl p-6 text-center hover:border-primary/30 transition-colors group"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
              <feature.icon className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-heading font-semibold text-foreground mb-2">{feature.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default FeaturesSection;

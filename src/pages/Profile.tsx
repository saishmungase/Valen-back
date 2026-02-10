import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { 
  Camera, MapPin, Save, Video, Heart, Gamepad2, BookOpen, Briefcase,
  Sparkles, TrendingUp, Award, CheckCircle2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const INTEREST_OPTIONS = [
  "Gaming", "Music", "Travel", "Cooking", "Fitness", "Art", "Movies", "Reading",
  "Photography", "Tech", "Anime", "Nature", "Dance", "Fashion", "Sports", "Coding",
];

const VALUE_OPTIONS = [
  "Honesty", "Humor", "Ambition", "Creativity", "Loyalty", "Kindness", "Adventure", "Empathy",
];

const PERSONALITY_OPTIONS = [
  "Introvert", "Extrovert", "Ambivert", "Creative", "Analytical", "Empathetic",
  "Adventurous", "Calm", "Energetic", "Thoughtful",
];

const MODE_OPTIONS = [
  { value: "dating" as const, label: "Dating", icon: Heart, color: "text-primary", bg: "bg-primary/10" },
  { value: "friendship" as const, label: "Friends", icon: Gamepad2, color: "text-online-green", bg: "bg-green-500/10" },
  { value: "study" as const, label: "Study", icon: BookOpen, color: "text-blue-400", bg: "bg-blue-500/10" },
  { value: "co-founder" as const, label: "Co-founder", icon: Briefcase, color: "text-yellow-400", bg: "bg-yellow-500/10" },
];

const Profile = () => {
  const { user, updateProfile, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [country, setCountry] = useState(user?.country || "");
  const [interests, setInterests] = useState<string[]>(user?.interests || []);
  const [values, setValues] = useState<string[]>(user?.values || []);
  const [personalityTags, setPersonalityTags] = useState<string[]>(user?.personalityTags || []);
  const [idealPartnerDescription, setIdealPartnerDescription] = useState(user?.idealPartnerDescription || "");
  const [mode, setMode] = useState<"dating" | "friendship" | "study" | "co-founder">(user?.mode || "dating");
  const [saved, setSaved] = useState(false);

  if (!isLoggedIn) {
    navigate("/login");
    return null;
  }

  const toggleTag = (tag: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(tag) ? list.filter((t) => t !== tag) : [...list, tag]);
  };

  const handleSave = () => {
    updateProfile({ name, bio, country, interests, values, personalityTags, idealPartnerDescription, mode });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const profileCompleteness = Math.min(100, Math.round(
    (name ? 15 : 0) + (bio ? 10 : 0) + (country ? 10 : 0) +
    (interests.length > 0 ? Math.min(25, interests.length * 5) : 0) +
    (values.length > 0 ? Math.min(15, values.length * 5) : 0) +
    (personalityTags.length > 0 ? Math.min(15, personalityTags.length * 5) : 0) +
    (idealPartnerDescription ? 10 : 0)
  ));

  const getProfileLevel = () => {
    if (profileCompleteness >= 90) return { level: "Expert", icon: Award, color: "text-yellow-500" };
    if (profileCompleteness >= 70) return { level: "Advanced", icon: TrendingUp, color: "text-primary" };
    if (profileCompleteness >= 40) return { level: "Intermediate", icon: Sparkles, color: "text-blue-500" };
    return { level: "Beginner", icon: CheckCircle2, color: "text-muted-foreground" };
  };

  const profileLevel = getProfileLevel();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-pink-deep/10">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 pt-28 pb-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }}
        >
          {/* Profile Header Card */}
          <Card className="p-8 mb-6 bg-card/50 backdrop-blur-sm border-border/50">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              {/* Avatar */}
              <div className="relative group">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="w-32 h-32 rounded-2xl bg-gradient-to-br from-primary to-pink-deep flex items-center justify-center text-5xl font-heading font-bold text-white shadow-xl"
                >
                  {name.charAt(0).toUpperCase() || "?"}
                </motion.div>
                <div className="absolute inset-0 rounded-2xl bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="w-8 h-8 text-foreground" />
                </div>
                {/* Profile Level Badge */}
                <div className="absolute -bottom-3 -right-3 bg-card border-2 border-border rounded-full px-3 py-1 flex items-center gap-1.5 shadow-lg">
                  <profileLevel.icon className={`w-4 h-4 ${profileLevel.color}`} />
                  <span className="text-xs font-semibold text-foreground">{profileLevel.level}</span>
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center lg:text-left">
                <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
                  {name || "Your Name"}
                </h1>
                <p className="text-sm text-muted-foreground mb-3">{user?.email}</p>
                
                {country && (
                  <div className="flex items-center gap-2 mb-4 justify-center lg:justify-start">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="text-sm text-foreground">{country}</span>
                  </div>
                )}

                {/* Profile Completeness */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Profile Strength</span>
                    <span className="font-semibold text-primary">{profileCompleteness}%</span>
                  </div>
                  <div className="h-3 bg-secondary rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${profileCompleteness}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-primary to-pink-deep"
                    />
                  </div>
                  {profileCompleteness < 100 && (
                    <p className="text-xs text-muted-foreground">
                      Complete your profile to get better matches!
                    </p>
                  )}
                </div>
              </div>

              {/* CTA Button */}
              <Button 
                size="lg"
                className="gap-2 bg-primary hover:bg-pink-deep text-primary-foreground glow-pink shadow-xl font-heading font-semibold" 
                onClick={() => navigate("/matching")}
              >
                <Video className="w-5 h-5" />
                Start Matching
              </Button>
            </div>
          </Card>

          {/* Mode Selection */}
          <Card className="p-6 mb-6 bg-card/50 backdrop-blur-sm border-border/50">
            <h2 className="text-xl font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              What are you looking for?
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {MODE_OPTIONS.map((m, index) => (
                <motion.button
                  key={m.value}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setMode(m.value)}
                  className={`p-6 rounded-xl border-2 transition-all text-center ${
                    mode === m.value
                      ? `border-primary ${m.bg} shadow-lg`
                      : "border-border bg-secondary/50 hover:border-primary/50"
                  }`}
                >
                  <m.icon className={`w-8 h-8 mx-auto mb-3 ${m.color}`} />
                  <span className="text-sm font-heading font-semibold text-foreground">{m.label}</span>
                </motion.button>
              ))}
            </div>
          </Card>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* Interests */}
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
              <h2 className="text-lg font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                Interests
                <Badge variant="secondary" className="ml-auto">{interests.length}</Badge>
              </h2>
              <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
                {INTEREST_OPTIONS.map((tag) => (
                  <Badge
                    key={tag}
                    variant={interests.includes(tag) ? "default" : "outline"}
                    className={`cursor-pointer transition-all ${
                      interests.includes(tag)
                        ? "bg-primary text-primary-foreground hover:bg-pink-deep shadow-md"
                        : "border-border text-muted-foreground hover:border-primary hover:text-foreground"
                    }`}
                    onClick={() => toggleTag(tag, interests, setInterests)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </Card>

            {/* Values */}
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
              <h2 className="text-lg font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                Values
                <Badge variant="secondary" className="ml-auto">{values.length}</Badge>
              </h2>
              <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
                {VALUE_OPTIONS.map((tag) => (
                  <Badge
                    key={tag}
                    variant={values.includes(tag) ? "default" : "outline"}
                    className={`cursor-pointer transition-all ${
                      values.includes(tag)
                        ? "bg-yellow-500 text-white hover:bg-yellow-600 shadow-md"
                        : "border-border text-muted-foreground hover:border-yellow-500 hover:text-foreground"
                    }`}
                    onClick={() => toggleTag(tag, values, setValues)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </Card>
          </div>

          {/* Personality Tags */}
          <Card className="p-6 mb-6 bg-card/50 backdrop-blur-sm border-border/50">
            <h2 className="text-lg font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-500" />
              Personality
              <Badge variant="secondary" className="ml-auto">{personalityTags.length}</Badge>
            </h2>
            <div className="flex flex-wrap gap-2">
              {PERSONALITY_OPTIONS.map((tag) => (
                <Badge
                  key={tag}
                  variant={personalityTags.includes(tag) ? "default" : "outline"}
                  className={`cursor-pointer transition-all ${
                    personalityTags.includes(tag)
                      ? "bg-blue-500 text-white hover:bg-blue-600 shadow-md"
                      : "border-border text-muted-foreground hover:border-blue-500 hover:text-foreground"
                  }`}
                  onClick={() => toggleTag(tag, personalityTags, setPersonalityTags)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </Card>

          {/* Edit Profile Details */}
          <Card className="p-8 bg-card/50 backdrop-blur-sm border-border/50">
            <h2 className="text-xl font-heading font-semibold text-foreground mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Profile Details
            </h2>
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-foreground font-medium">Display Name</Label>
                  <Input 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    className="bg-secondary border-border text-foreground h-12" 
                    placeholder="Enter your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground font-medium">Country</Label>
                  <Input 
                    value={country} 
                    onChange={(e) => setCountry(e.target.value)} 
                    placeholder="e.g. United States" 
                    className="bg-secondary border-border text-foreground placeholder:text-muted-foreground h-12" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground font-medium">Bio</Label>
                <Textarea 
                  value={bio} 
                  onChange={(e) => setBio(e.target.value)} 
                  placeholder="Tell people about yourself..." 
                  rows={4} 
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground resize-none" 
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground font-medium flex items-center gap-2">
                  Ideal Match Description
                  <Badge className="bg-gradient-to-r from-primary to-pink-deep text-white">AI Powered</Badge>
                </Label>
                <Textarea
                  value={idealPartnerDescription}
                  onChange={(e) => setIdealPartnerDescription(e.target.value)}
                  placeholder="Describe your ideal match... e.g. 'Someone who loves hiking, appreciates deep conversations, and has a good sense of humor'"
                  rows={5}
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground resize-none"
                />
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  This helps our AI find more compatible matches for you
                </p>
              </div>

              <Button 
                onClick={handleSave} 
                size="lg"
                className="w-full gap-2 bg-primary hover:bg-pink-deep text-primary-foreground glow-pink shadow-xl font-heading font-semibold h-14"
              >
                <Save className="w-5 h-5" />
                {saved ? "✓ Saved Successfully!" : "Save Changes"}
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;

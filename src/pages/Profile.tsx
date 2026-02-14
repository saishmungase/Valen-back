import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { 
  Camera, MapPin, Save, Video, Heart,
  User, Settings, LogOut, Mail, Calendar
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const Profile = () => {
  const { user, updateProfile, isLoggedIn, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState(0);
  const [gender, setGender] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setEmail(user.email || '');
      setAge(user.age || 0);
      setGender(user.gender || '');
      setBio(user.description || '');
      setInterests(user.interests || []);
      setImages([user.image1, user.image2, user.image3].filter(Boolean));
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      navigate("/login");
    }
  }, [isLoggedIn, authLoading, navigate]);

  if (authLoading || loading || !isLoggedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    updateProfile({ 
      username,
      bio,
      interests
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const sidebarItems = [
    { id: "profile", label: "Profile", icon: User },
    { id: "photos", label: "Photos", icon: Camera },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-pink-deep/10">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 pt-28 pb-16">
        <div className="flex gap-6">
          {/* Sidebar */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="hidden lg:block w-72 flex-shrink-0"
          >
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50 sticky top-28">
              {/* User Info */}
              <div className="text-center mb-6 pb-6 border-b border-border/50">
                {images[0] ? (
                  <motion.img
                    whileHover={{ scale: 1.05 }}
                    src={images[0]}
                    alt={username}
                    className="w-24 h-24 mx-auto mb-3 rounded-full object-cover border-4 border-primary shadow-xl cursor-pointer"
                    onClick={() => setActiveTab("photos")}
                  />
                ) : (
                  <div className="w-24 h-24 mx-auto mb-3 rounded-full bg-gradient-to-br from-primary to-pink-deep flex items-center justify-center text-3xl font-heading font-bold text-white shadow-lg">
                    {username.charAt(0).toUpperCase() || "?"}
                  </div>
                )}
                <h3 className="font-heading font-semibold text-foreground text-lg mb-1">
                  {username}
                </h3>
                <p className="text-xs text-muted-foreground truncate flex items-center justify-center gap-1 mb-2">
                  <Mail className="w-3 h-3" />
                  {email}
                </p>
                <Badge className="bg-gradient-to-r from-primary to-pink-deep text-white">
                  {age} years • {gender}
                </Badge>
              </div>

              {/* Navigation */}
              <nav className="space-y-2 mb-6">
                {sidebarItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      activeTab === item.id
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </nav>

              {/* Quick Stats */}
              <div className="space-y-3 mb-6 pb-6 border-b border-border/50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Interests</span>
                  <Badge variant="secondary">{interests.length}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Photos</span>
                  <Badge variant="secondary">{images.length}/3</Badge>
                </div>
              </div>

              {/* Logout Button */}
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5" />
                Log out
              </Button>
            </Card>
          </motion.aside>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === "profile" && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                {/* Profile Header Card */}
                <Card className="p-8 bg-card/50 backdrop-blur-sm border-border/50">
                  <h2 className="text-2xl font-heading font-bold text-foreground mb-6 flex items-center gap-2">
                    <User className="w-6 h-6 text-primary" />
                    My Profile
                  </h2>

                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Left Column - Info */}
                    <div className="space-y-6">
                      <div>
                        <Label className="text-sm text-muted-foreground mb-2 block">Username</Label>
                        <Input 
                          value={username} 
                          onChange={(e) => setUsername(e.target.value)} 
                          className="bg-secondary border-border text-foreground h-12 text-lg" 
                        />
                      </div>

                      <div>
                        <Label className="text-sm text-muted-foreground mb-2 block">Email</Label>
                        <Input 
                          value={email} 
                          disabled
                          className="bg-secondary/50 border-border text-muted-foreground h-12" 
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-muted-foreground mb-2 block">Age</Label>
                          <Input 
                            value={age} 
                            disabled
                            className="bg-secondary/50 border-border text-muted-foreground h-12" 
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground mb-2 block">Gender</Label>
                          <Input 
                            value={gender.charAt(0).toUpperCase() + gender.slice(1)} 
                            disabled
                            className="bg-secondary/50 border-border text-muted-foreground h-12" 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Photo Preview */}
                    <div>
                      <Label className="text-sm text-muted-foreground mb-2 block">Profile Photo</Label>
                      {images[0] ? (
                        <motion.div 
                          whileHover={{ scale: 1.02 }}
                          className="aspect-square rounded-2xl overflow-hidden border-4 border-primary shadow-xl cursor-pointer"
                          onClick={() => setActiveTab("photos")}
                        >
                          <img
                            src={images[0]}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        </motion.div>
                      ) : (
                        <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary to-pink-deep flex items-center justify-center text-6xl font-heading font-bold text-white">
                          {username.charAt(0).toUpperCase() || "?"}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Bio Section */}
                <Card className="p-8 bg-card/50 backdrop-blur-sm border-border/50">
                  <h2 className="text-xl font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-primary" />
                    About Me
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm text-muted-foreground mb-2 block">Bio</Label>
                      <Textarea 
                        value={bio} 
                        onChange={(e) => setBio(e.target.value)} 
                        placeholder="Tell people about yourself..." 
                        rows={5} 
                        className="bg-secondary border-border text-foreground placeholder:text-muted-foreground resize-none" 
                        maxLength={500}
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        {bio.length}/500 characters
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Interests Section */}
                <Card className="p-8 bg-card/50 backdrop-blur-sm border-border/50">
                  <h2 className="text-xl font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Camera className="w-5 h-5 text-primary" />
                    My Interests
                  </h2>
                  {interests.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {interests.map((interest, index) => (
                        <Badge
                          key={index}
                          className="bg-gradient-to-r from-primary to-pink-deep text-white px-4 py-2 text-sm"
                        >
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No interests added yet</p>
                  )}
                </Card>

                {/* Save Button */}
                <Button 
                  onClick={handleSave} 
                  size="lg"
                  className="w-full gap-2 bg-primary hover:bg-pink-deep text-primary-foreground glow-pink shadow-xl font-heading font-semibold h-14"
                >
                  <Save className="w-5 h-5" />
                  {saved ? "✓ Saved Successfully!" : "Save Changes"}
                </Button>
              </motion.div>
            )}

            {activeTab === "photos" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="p-8 bg-card/50 backdrop-blur-sm border-border/50">
                  <h2 className="text-2xl font-heading font-bold text-foreground mb-6 flex items-center gap-2">
                    <Camera className="w-6 h-6 text-primary" />
                    My Photos
                  </h2>
                  
                  {images.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {images.map((image, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ scale: 1.03 }}
                          className="aspect-square rounded-2xl overflow-hidden border-4 border-primary shadow-xl cursor-pointer group relative"
                        >
                          <img
                            src={image}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {/* Overlay on hover */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                            <p className="text-white font-semibold">Photo {index + 1}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <Camera className="w-20 h-20 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground text-lg">No photos uploaded yet</p>
                    </div>
                  )}

                  {/* Photos Info */}
                  <div className="mt-8 p-6 bg-primary/5 rounded-xl border border-primary/20">
                    <h3 className="font-heading font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Heart className="w-4 h-4 text-primary" />
                      Photo Tips
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>✨ Use high-quality, well-lit photos</li>
                      <li>😊 Show your genuine smile</li>
                      <li>🎯 Photos that represent your interests work best</li>
                      <li>📸 Upload 3 photos to complete your profile</li>
                    </ul>
                  </div>
                </Card>
              </motion.div>
            )}

            {activeTab === "settings" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="p-8 bg-card/50 backdrop-blur-sm border-border/50">
                  <h2 className="text-2xl font-heading font-bold text-foreground mb-6 flex items-center gap-2">
                    <Settings className="w-6 h-6 text-primary" />
                    Account Settings
                  </h2>

                  <div className="space-y-6">
                    {/* Account Info */}
                    <div className="p-6 bg-secondary/50 rounded-xl">
                      <h3 className="font-heading font-semibold text-foreground mb-4">Account Information</h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Email:</span>
                          <span className="text-foreground font-medium">{email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Username:</span>
                          <span className="text-foreground font-medium">{username}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Account Type:</span>
                          <Badge>Free</Badge>
                        </div>
                      </div>
                    </div>

                    {/* Start Matching CTA */}
                    <div className="p-8 bg-gradient-to-br from-primary/20 to-pink-deep/20 rounded-xl border border-primary/30 text-center">
                      <h3 className="text-xl font-heading font-bold text-foreground mb-3">Ready to Meet People?</h3>
                      <p className="text-muted-foreground mb-6">Start matching with people who share your interests</p>
                      <Button 
                        size="lg"
                        className="gap-2 bg-primary hover:bg-pink-deep text-primary-foreground glow-pink shadow-xl font-heading font-semibold" 
                        onClick={() => navigate("/matching")}
                      >
                        <Video className="w-5 h-5" />
                        Start Matching Now
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
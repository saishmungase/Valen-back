import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/lib/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

const Signup = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [step, setStep] = useState<'email' | 'verify' | 'details'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [description, setDescription] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [interestInput, setInterestInput] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authService.sendVerificationCode(email);
      setStep('verify');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }
    setStep('details');
  };

  const addInterest = () => {
    const trimmed = interestInput.trim();
    if (trimmed && !interests.includes(trimmed) && interests.length < 10) {
      setInterests([...interests, trimmed]);
      setInterestInput('');
    }
  };

  const removeInterest = (interest: string) => {
    setInterests(interests.filter(i => i !== interest));
  };

  const handleInterestKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addInterest();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      
      if (files.length !== 3) {
        setError('Please select exactly 3 images');
        return;
      }

      setImages(files);

      const previews = files.map(file => URL.createObjectURL(file));
      setImagePreviews(previews);
      setError('');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (images.length !== 3) {
      setError('Please upload exactly 3 images');
      return;
    }

    if (interests.length === 0) {
      setError('Please add at least one interest');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userData = await authService.signup({
        email,
        code,
        username,
        password,
        age: parseInt(age),
        gender,
        description,
        interests,
        images
      });

      setUser(userData);

      navigate('/matching');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'email') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="card-surface rounded-2xl p-8 max-w-md w-full">
          <h1 className="text-3xl font-heading font-bold text-gradient-pink mb-2">
            Sign Up
          </h1>
          <p className="text-muted-foreground mb-6">Join Pixematch and start connecting!</p>

          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending Code...' : 'Send Verification Code'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline">
                Login
              </Link>
            </p>
          </form>
        </div>
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="card-surface rounded-2xl p-8 max-w-md w-full">
          <h1 className="text-3xl font-heading font-bold text-gradient-pink mb-2">
            Verify Email
          </h1>
          <p className="text-muted-foreground mb-6">
            We sent a 6-digit code to <strong>{email}</strong>
          </p>

          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Verification Code</label>
              <Input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="text-center text-2xl tracking-widest font-mono"
                required
              />
            </div>

            <Button type="submit" className="w-full">
              Verify & Continue
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setStep('email')}
            >
              Change Email
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 py-8">
      <div className="card-surface rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h1 className="text-3xl font-heading font-bold text-gradient-pink mb-2">
          Complete Your Profile
        </h1>
        <p className="text-muted-foreground mb-6">Tell us about yourself</p>

        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-heading font-semibold text-lg">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium mb-2">Username</label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a unique username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                minLength={6}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Age</label>
                <Input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="18"
                  min="18"
                  max="100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full p-2 rounded-lg bg-background border border-border h-10"
                  required
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* About You */}
          <div className="space-y-4">
            <h3 className="font-heading font-semibold text-lg">About You</h3>
            
            <div>
              <label className="block text-sm font-medium mb-2">Bio</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell people about yourself... What do you like? What are you looking for?"
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {description.length}/500 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Interests <span className="text-primary">*</span>
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={interestInput}
                  onChange={(e) => setInterestInput(e.target.value)}
                  onKeyPress={handleInterestKeyPress}
                  placeholder="e.g., Gaming, Music, Travel..."
                  maxLength={30}
                />
                <Button
                  type="button"
                  onClick={addInterest}
                  variant="outline"
                  disabled={!interestInput.trim() || interests.length >= 10}
                >
                  Add
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Press Enter or click Add. Maximum 10 interests.
              </p>
              
              {interests.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {interests.map((interest) => (
                    <Badge
                      key={interest}
                      variant="secondary"
                      className="px-3 py-1 text-sm flex items-center gap-2"
                    >
                      {interest}
                      <button
                        type="button"
                        onClick={() => removeInterest(interest)}
                        className="hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Photos */}
          <div className="space-y-4">
            <h3 className="font-heading font-semibold text-lg">Your Photos</h3>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Upload 3 Photos <span className="text-primary">*</span>
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="w-full p-2 rounded-lg bg-background border border-border file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground hover:file:bg-pink-deep cursor-pointer"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Choose 3 images that represent you well (max 5MB each)
              </p>
            </div>

            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="aspect-square rounded-lg overflow-hidden border-2 border-border">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 text-base" 
            disabled={loading || images.length !== 3 || interests.length === 0}
          >
            {loading ? 'Creating Account...' : 'Create Account & Start Matching'}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;
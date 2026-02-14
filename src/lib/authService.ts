const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export const authService = {
  async getCurrentUser() {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const response = await fetch(`${API_URL}/api/profile/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return null;
      }

      const userData = await response.json();
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  async sendVerificationCode(email: string) {
    const response = await fetch(`${API_URL}/api/auth/send-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send code');
    }

    return response.json();
  },

  async signup(data: {
    email: string;
    code: string;
    username: string;
    password: string;
    age: number;
    gender: string;
    description?: string;
    interests?: string[];
    images: File[];
  }) {
    const formData = new FormData();
    formData.append('email', data.email);
    formData.append('code', data.code);
    formData.append('username', data.username);
    formData.append('password', data.password);
    formData.append('age', data.age.toString());
    formData.append('gender', data.gender);
    
    if (data.description) {
      formData.append('description', data.description);
    }
    
    if (data.interests && data.interests.length > 0) {
      formData.append('interests', JSON.stringify(data.interests));
    }

    data.images.forEach((image) => {
      formData.append('images', image);
    });

    const response = await fetch(`${API_URL}/api/auth/verified-signup`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Signup failed');
    }

    const result = await response.json();
    
    localStorage.setItem('token', result.token);
    
    const userProfile = await this.getCurrentUser();
    
    return userProfile;
  },

  async login(username: string, password: string) {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const result = await response.json();
    
    localStorage.setItem('token', result.token);
    
    const userProfile = await this.getCurrentUser();
    
    return userProfile;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  }
};
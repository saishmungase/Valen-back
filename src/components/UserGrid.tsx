import { useState, useEffect } from "react";
import UserCard from "./UserCard";
import { useAuth } from "@/hooks/useAuth";
import { useUserPresence } from "@/hooks/useUserPresence";

interface User {
  id: string;
  name: string;
  age: number;
  country: string;
  flag: string;
  online: boolean;
}

const UserGrid = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Register user presence with backend (separate from video chat)
  useUserPresence(user);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
        const response = await fetch(`${backendUrl}/api/users`);
        const data = await response.json();
        
        // Filter out current user if logged in
        const filteredUsers = user ? data.filter((u: User) => u.name !== user.name) : data;
        setUsers(filteredUsers);
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

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-3 auto-rows-auto">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="aspect-[3/4] bg-secondary rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No users online right now</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3 auto-rows-auto">
      {users.map((user, i) => (
        <UserCard 
          key={user.id} 
          image={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
          name={user.name}
          age={user.age}
          country={user.country}
          flag={user.flag}
          online={user.online}
          delay={i * 0.1}
        />
      ))}
    </div>
  );
};

export default UserGrid;

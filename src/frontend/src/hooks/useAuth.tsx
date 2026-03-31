import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface User {
  id: number;
  name: string; 
  email: string;
  is_seller: boolean;
}

interface AuthContextType {
  session: string | null;
  user: User | null;
  signOut: () => void;
  loading: boolean; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Removido o parâmetro 'token' que não estava sendo usado
  const getUserProfile = async () => {
    try {
      const response = await api.get('/users/me', { timeout: 5000 }); 
      setUser(response.data);
    } catch (error: any) {
      console.error("Falha ao buscar perfil:", error);
      if (error.response?.status === 401) {
          signOut();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('yale_token');
    if (token) {
      setSession(token);
      // Chama a função sem passar o parâmetro agora
      getUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const signOut = () => {
    localStorage.removeItem('yale_token');
    setSession(null);
    setUser(null);
    window.location.href = '/auth';
  };

  return (
    <AuthContext.Provider value={{ session, user, signOut, loading }}>
      {children} 
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
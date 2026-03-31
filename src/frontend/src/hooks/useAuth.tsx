import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api'; // Certifique-se de que o api.ts está correto com o localhost:8000

// 1. O molde do Utilizador no TypeScript (deve bater com o UserCreate/UserResponse do Python)
interface User {
  id: number;
  name: string; // O FastAPI envia o nome completo aqui
  email: string;
  role: string;
}

interface AuthContextType {
  session: string | null;
  user: User | null; // <-- ADICIONAMOS ISTO AQUI
  signOut: () => void;
  loading: boolean; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null); // <-- Estado para o nome/dados
  const [loading, setLoading] = useState(true);

  // Função para buscar os dados do utilizador usando o Token
  const getUserProfile = async (token: string) => {
    try {
      // Configuramos o Axios para esperar no máximo 5 segundos (5000ms)
      const response = await api.get('/users/me', { timeout: 5000 }); 
      setUser(response.data);
    } catch (error: any) {
      console.error("Falha ao buscar perfil:", error);
      
      // Se for um erro 401, o token expirou ou é inválido. Vamos expulsar.
      if (error.response?.status === 401) {
          signOut();
      }
    } finally {
      // Haja o que houver, após tentar buscar ou dar timeout, libertamos a tela.
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('yale_token');
    if (token) {
      setSession(token);
      // Nós temos o token, mas ainda não temos os dados do perfil (nome)
      // Oapi.ts já deve ter sido configurado para ler o token do localStorage e colocar no Header Authorization automaticamente.
      getUserProfile(token);
    } else {
      setLoading(false); // Não tem token, não tem nada pra buscar
    }
  }, []);

  const signOut = () => {
    localStorage.removeItem('yale_token');
    setSession(null);
    setUser(null); // Limpa os dados do utilizador
    window.location.href = '/auth'; // Expulsa o utilizador à força
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
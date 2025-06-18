import React, { createContext, useContext, useState, ReactNode } from 'react';
import api from '../services/api';
import { User } from '../types/user';

// Tipos
interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  loginLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  clearError: () => void;
  validateEmail: (email: string) => boolean;
  validatePassword: (password: string) => boolean;
  verifyEmail: (code: string, email: string) => Promise<boolean>;
  resendVerification: (email: string) => Promise<boolean>;
}
//interface de contexto
interface AuthContextData extends UseAuthReturn {}

// Contexto
const AuthContext = createContext<AuthContextData>({} as AuthContextData);

// Provider
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validadores
  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  // Funções de autenticação
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoginLoading(true);
      setError(null);
      
      const response = await api.post('/api/auth/login', { email, password });
      
      if (response.data.user) {
        setUser(response.data.user);
        return true;
      }
      
      setError(response.data.message || 'Erro ao fazer login');
      return false;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao fazer login');
      return false;
    } finally {
      setLoginLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/api/auth/register', { name, email, password });
      
      if (response.data.success) {
        setError(null);
        return true;
      }
      
      setError(response.data.message || 'Erro ao fazer registro');
      return false;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao fazer registro');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async (code: string, email: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await api.post('/api/auth/verify-email', { code, email });
      
      if (response.data.success) {
        setError(null);
        return true;
      }
      
      setError(response.data.message || 'Erro ao verificar email');
      return false;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao verificar email');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async (email: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await api.post('/api/auth/resend-verification', { email });
      
      if (response.data.success) {
        setError(null);
        return true;
      }
      
      setError(response.data.message || 'Erro ao reenviar código');
      return false;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao reenviar código');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  // Verificar autenticação inicial
  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get('/api/auth/me');
        if (response.data.user) {
          setUser(response.data.user);
        }
      } catch (err) {
        // Não está autenticado
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginLoading,
        error,
        isAuthenticated: !!user,
        login,
        logout,
        register,
        clearError,
        validateEmail,
        validatePassword,
        verifyEmail,
        resendVerification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth; 
import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import { config } from '../config/environment';

// �� Tipos e Interfaces
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Subscription {
  plan_name: string;
  status: string;
  max_empresas: number;
  max_monthly_matches: number;
  max_monthly_rag_queries: number;
  current_period_end: string;
  trial_ends_at?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    access_token: string;
    expires_at: string;
    user: User;
    subscription: Subscription;
  };
  error?: string;
}

// 🔄 Estados da Autenticação
interface AuthState {
  user: User | null;
  token: string | null;
  subscription: Subscription | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// 🎯 Ações do Reducer
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string; subscription: Subscription } }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_CLEAR_ERROR' }
  | { type: 'AUTH_CHECK_START' }
  | { type: 'AUTH_CHECK_END' };

// 🔧 Context Interface
interface AuthContextType {
  // Estados
  user: User | null;
  token: string | null;
  subscription: Subscription | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  
  // Ações
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  verifyEmail: (code: string, email: string) => Promise<boolean>;
  resendVerification: (email: string) => Promise<boolean>;
  requestPasswordReset: (email: string) => Promise<boolean>;
  verifyPasswordResetCode: (email: string, code: string) => Promise<boolean>;
  resetPassword: (email: string, code: string, new_password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  
  // Utilitários
  getAuthHeaders: () => Record<string, string>;
  isTokenExpired: () => boolean;
}

// 🏭 Reducer da Autenticação
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        loading: true,
        error: null,
      };
      
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        subscription: action.payload.subscription,
        isAuthenticated: true,
        loading: false,
        error: null,
      };
      
    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        token: null,
        subscription: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload,
      };
      
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        subscription: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      };
      
    case 'AUTH_CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
      
    case 'AUTH_CHECK_START':
      return {
        ...state,
        loading: true,
      };
      
    case 'AUTH_CHECK_END':
      return {
        ...state,
        loading: false,
      };
      
    default:
      return state;
  }
};

// 🏪 Estado Inicial
const initialState: AuthState = {
  user: null,
  token: null,
  subscription: null,
  isAuthenticated: false,
  loading: true, // Inicia como true para verificar token existente
  error: null,
};

// 📦 Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 🔧 Constantes
const TOKEN_KEY = 'alicit_token';
const USER_KEY = 'alicit_user';
const SUBSCRIPTION_KEY = 'alicit_subscription';

// 🏗️ Provider do Context
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // 💾 Utilitários de localStorage
  const saveToStorage = (token: string, user: User, subscription: Subscription) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(subscription));
  };

  const clearFromStorage = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(SUBSCRIPTION_KEY);
  };

  const loadFromStorage = () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const userStr = localStorage.getItem(USER_KEY);
      const subscriptionStr = localStorage.getItem(SUBSCRIPTION_KEY);

      if (token && userStr && subscriptionStr) {
        const user = JSON.parse(userStr);
        const subscription = JSON.parse(subscriptionStr);
        return { token, user, subscription };
      }
    } catch (error) {
      console.error('Erro ao carregar dados do localStorage:', error);
      clearFromStorage();
    }
    return null;
  };

  // 🔐 Verificar se token está expirado
  const isTokenExpired = (): boolean => {
    if (!state.token) return true;
    
    try {
      const payload = JSON.parse(atob(state.token.split('.')[1]));
      const exp = payload.exp * 1000; // JWT exp é em segundos
      return Date.now() >= exp;
    } catch {
      return true;
    }
  };

  // 📋 Headers de autenticação
  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (state.token && !isTokenExpired()) {
      headers['Authorization'] = `Bearer ${state.token}`;
    }

    return headers;
  };

  // 🔑 Função de Login
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      dispatch({ type: 'AUTH_START' });

      const loginUrl = `${config.API_BASE_URL}/auth/login`;
      console.log('🔗 Fazendo requisição para:', loginUrl);

      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const result: AuthResponse = await response.json();

      if (result.success && result.data) {
        const { access_token, user, subscription } = result.data;
        
        // Salvar dados
        saveToStorage(access_token, user, subscription);
        
        // Atualizar estado
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: {
            user,
            token: access_token,
            subscription,
          },
        });

        console.log('✅ Login realizado com sucesso:', user.name);
        return true;
      } else {
        const errorMsg = result.error || result.message || 'Erro desconhecido';
        dispatch({ type: 'AUTH_ERROR', payload: errorMsg });
        return false;
      }
    } catch (error) {
      console.error('❌ Erro no login:', error);
      dispatch({ type: 'AUTH_ERROR', payload: 'Erro de conexão. Tente novamente.' });
      return false;
    }
  };

  // 📝 Função de Registro
  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      dispatch({ type: 'AUTH_START' });

      const registerUrl = `${config.API_BASE_URL}/auth/register`;
      console.log('🔗 Fazendo requisição para:', registerUrl);

      const response = await fetch(registerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const result: AuthResponse = await response.json();

      if (result.success) {
        // Apenas indica sucesso, não loga o usuário
        dispatch({ type: 'AUTH_CHECK_END' });
        return true;
      } else {
        dispatch({ type: 'AUTH_ERROR', payload: result.message || 'Erro desconhecido durante o registro.' });
        return false;
      }
    } catch (error: any) {
      console.error('❌ Erro na requisição de registro:', error);
      dispatch({ type: 'AUTH_ERROR', payload: error.message || 'Erro de rede ou servidor indisponível.' });
      return false;
    }
  };

  // 📧 Função para Verificar Email
  const verifyEmail = async (code: string, email: string): Promise<boolean> => {
    try {
      dispatch({ type: 'AUTH_START' });

      const verifyUrl = `${config.API_BASE_URL}/auth/verify-email`;
      console.log('🔗 Fazendo requisição para:', verifyUrl);

      const response = await fetch(verifyUrl, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ code, email }),
      });

      const result: AuthResponse = await response.json();

      if (result.success) {
        dispatch({ type: 'AUTH_CHECK_END' });
        return true;
      } else {
        dispatch({ type: 'AUTH_ERROR', payload: result.message || 'Código de verificação inválido.' });
        return false;
      }
    } catch (error: any) {
      console.error('❌ Erro na requisição de verificação:', error);
      dispatch({ type: 'AUTH_ERROR', payload: error.message || 'Erro de rede ou servidor indisponível.' });
      return false;
    }
  };

  // 🔁 Função para Reenviar Código de Verificação
  const resendVerification = async (email: string): Promise<boolean> => {
    try {
      dispatch({ type: 'AUTH_START' });

      const resendUrl = `${config.API_BASE_URL}/auth/resend-verification`;
      console.log('🔗 Fazendo requisição para:', resendUrl);

      const response = await fetch(resendUrl, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ email }),
      });

      const result: AuthResponse = await response.json();

      if (result.success) {
        dispatch({ type: 'AUTH_CHECK_END' });
        return true;
      } else {
        dispatch({ type: 'AUTH_ERROR', payload: result.message || 'Não foi possível reenviar o código.' });
        return false;
      }
    } catch (error: any) {
      console.error('❌ Erro na requisição de reenvio:', error);
      dispatch({ type: 'AUTH_ERROR', payload: error.message || 'Erro de rede ou servidor indisponível.' });
      return false;
    }
  };

  // 🔑 Solicitar Redefinição de Senha
  const requestPasswordReset = async (email: string): Promise<boolean> => {
    try {
      dispatch({ type: 'AUTH_START' });
      const url = `${config.API_BASE_URL}/auth/forgot-password`;
      await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ email }),
      });
      // A API sempre retorna sucesso por segurança
      dispatch({ type: 'AUTH_CHECK_END' });
      return true;
    } catch (error: any) {
      dispatch({ type: 'AUTH_ERROR', payload: error.message });
      return false;
    }
  };

  // ❓ Verificar Código de Reset de Senha
  const verifyPasswordResetCode = async (email: string, code: string): Promise<boolean> => {
    try {
      dispatch({ type: 'AUTH_START' });
      const url = `${config.API_BASE_URL}/auth/verify-password-code`;
      const response = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ email, code }),
      });
      const result = await response.json();
      if (result.success) {
        dispatch({ type: 'AUTH_CHECK_END' });
        return true;
      } else {
        dispatch({ type: 'AUTH_ERROR', payload: result.message || 'Código inválido.' });
        return false;
      }
    } catch (error: any) {
      dispatch({ type: 'AUTH_ERROR', payload: error.message || 'Erro de rede.' });
      return false;
    }
  };

  // 🔄 Redefinir Senha
  const resetPassword = async (email: string, code: string, new_password: string): Promise<boolean> => {
    try {
      dispatch({ type: 'AUTH_START' });
      const url = `${config.API_BASE_URL}/auth/reset-password`;
      const response = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ email, code, new_password }),
      });
      const result = await response.json();
      if (result.success) {
        dispatch({ type: 'AUTH_CHECK_END' });
        return true;
      } else {
        dispatch({ type: 'AUTH_ERROR', payload: result.message });
        return false;
      }
    } catch (error: any) {
      dispatch({ type: 'AUTH_ERROR', payload: error.message });
      return false;
    }
  };

  // 🚪 Função de Logout
  const logout = useCallback(() => {
    clearFromStorage();
    dispatch({ type: 'AUTH_LOGOUT' });
    console.log('👋 Logout realizado');
  }, []);

  // 🧹 Limpar erro
  const clearError = useCallback(() => {
    dispatch({ type: 'AUTH_CLEAR_ERROR' });
  }, []);

  // 🔄 Verificar autenticação ao inicializar
  useEffect(() => {
    const checkAuth = () => {
      dispatch({ type: 'AUTH_CHECK_START' });
      
      const savedData = loadFromStorage();
      
      if (savedData && !isTokenExpired()) {
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: {
            user: savedData.user,
            token: savedData.token,
            subscription: savedData.subscription,
          },
        });
        console.log('✅ Usuário autenticado automaticamente:', savedData.user.name);
      } else {
        // Token expirado ou inexistente
        if (savedData) {
          console.log('⏰ Token expirado, fazendo logout');
          clearFromStorage();
        }
        dispatch({ type: 'AUTH_CHECK_END' });
      }
    };

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dependências intencionalmente vazias - queremos executar apenas uma vez

  // 🔄 Verificar expiração do token periodicamente
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (state.isAuthenticated && state.token) {
      interval = setInterval(() => {
        if (isTokenExpired()) {
          console.log('⏰ Token expirou, fazendo logout automático');
          logout();
        }
      }, 60000); // Verificar a cada minuto
    }

    return () => {
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isAuthenticated, state.token]); // isTokenExpired e logout são estáveis

  // 📦 Value do Context
  const value: AuthContextType = {
    // Estados
    user: state.user,
    token: state.token,
    subscription: state.subscription,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading,
    error: state.error,
    
    // Ações
    login,
    register,
    verifyEmail,
    resendVerification,
    requestPasswordReset,
    verifyPasswordResetCode,
    resetPassword,
    logout,
    clearError,
    
    // Utilitários
    getAuthHeaders,
    isTokenExpired,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// 🪝 Hook para usar o Context
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext deve ser usado dentro de um AuthProvider');
  }
  return context;
}; 
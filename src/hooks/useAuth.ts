import { useState, useCallback, useEffect } from 'react';
import { useAuthContext, User, Subscription } from '../contexts/AuthContext';

// 📋 Interface do Hook
interface UseAuthReturn {
  // Estados básicos do contexto
  user: User | null;
  token: string | null;
  subscription: Subscription | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  
  // Ações do contexto
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  verifyEmail: (code: string, email: string) => Promise<boolean>;
  resendVerification: (email: string) => Promise<boolean>;
  requestPasswordReset: (email: string) => Promise<boolean>;
  verifyPasswordResetCode: (email: string, code: string) => Promise<boolean>;
  resetPassword: (email: string, code: string, new_password: string) => Promise<boolean>;
  
  // Utilitários do contexto
  getAuthHeaders: () => Record<string, string>;
  isTokenExpired: () => boolean;
  
  // Estados e ações adicionais do hook
  loginLoading: boolean;
  registerLoading: boolean;
  
  // Funções auxiliares
  canCreateCompanies: () => boolean;
  canMakeMatches: () => boolean;
  getRemainingCompanies: () => number;
  getRemainingMatches: () => number;
  isTrialUser: () => boolean;
  getTrialDaysLeft: () => number;
  
  // Validações
  validateEmail: (email: string) => boolean;
  validatePassword: (password: string) => { valid: boolean; errors: string[] };
}

// 🎯 Hook Principal
export const useAuth = (): UseAuthReturn => {
  const authContext = useAuthContext();
  
  // Estados locais do hook
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);

  // 🔑 Login com loading local
  const handleLogin = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setLoginLoading(true);
      const success = await authContext.login(email, password);
      return success;
    } finally {
      setLoginLoading(false);
    }
  }, [authContext]);

  // 📝 Registro com loading local
  const handleRegister = useCallback(async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      setRegisterLoading(true);
      const success = await authContext.register(name, email, password);
      return success;
    } finally {
      setRegisterLoading(false);
    }
  }, [authContext]);

  // 📊 Calcular empresas restantes
  const getRemainingCompanies = useCallback((): number => {
    if (!authContext.subscription) return 0;
    // TODO: Implementar lógica para buscar quantas empresas o usuário já tem
    // Por enquanto, retorna o máximo permitido
    return authContext.subscription.max_empresas;
  }, [authContext.subscription]);

  // 📈 Calcular matches restantes
  const getRemainingMatches = useCallback((): number => {
    if (!authContext.subscription) return 0;
    // TODO: Implementar lógica para buscar quantos matches o usuário já fez no mês
    // Por enquanto, retorna o máximo permitido
    return authContext.subscription.max_monthly_matches;
  }, [authContext.subscription]);

  // 🏢 Verificar se pode criar empresas
  const canCreateCompanies = useCallback((): boolean => {
    if (!authContext.subscription) return false;
    return getRemainingCompanies() > 0;
  }, [authContext.subscription, getRemainingCompanies]);

  // 🔗 Verificar se pode fazer matches
  const canMakeMatches = useCallback((): boolean => {
    if (!authContext.subscription) return false;
    return getRemainingMatches() > 0;
  }, [authContext.subscription, getRemainingMatches]);

  // 🆓 Verificar se é usuário trial
  const isTrialUser = useCallback((): boolean => {
    if (!authContext.subscription) return false;
    return authContext.subscription.status === 'trial';
  }, [authContext.subscription]);

  // ⏰ Calcular dias restantes do trial
  const getTrialDaysLeft = useCallback((): number => {
    if (!authContext.subscription?.trial_ends_at) return 0;
    
    try {
      const trialEnd = new Date(authContext.subscription.trial_ends_at);
      const now = new Date();
      const diffTime = trialEnd.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    } catch {
      return 0;
    }
  }, [authContext.subscription]);

  // ✉️ Validar email
  const validateEmail = useCallback((email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  // 🔒 Validar senha
  const validatePassword = useCallback((password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('A senha deve ter pelo menos 8 caracteres');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('A senha deve conter pelo menos uma letra maiúscula');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('A senha deve conter pelo menos uma letra minúscula');
    }
    
    if (!/\d/.test(password)) {
      errors.push('A senha deve conter pelo menos um número');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('A senha deve conter pelo menos um caractere especial');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }, []);

  // 🔄 Log de mudanças de autenticação (desenvolvimento)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Auth State Change:', {
        isAuthenticated: authContext.isAuthenticated,
        user: authContext.user?.name,
        subscription: authContext.subscription?.plan_name,
        loading: authContext.loading,
        error: authContext.error,
      });
    }
  }, [
    authContext.isAuthenticated, 
    authContext.user, 
    authContext.subscription, 
    authContext.loading, 
    authContext.error
  ]);

  // 📦 Retorno do Hook
  return {
    // Estados básicos do contexto
    user: authContext.user,
    token: authContext.token,
    subscription: authContext.subscription,
    isAuthenticated: authContext.isAuthenticated,
    loading: authContext.loading,
    error: authContext.error,
    
    // Ações do contexto (com loading adicional)
    login: handleLogin,
    register: handleRegister,
    logout: authContext.logout,
    clearError: authContext.clearError,
    verifyEmail: authContext.verifyEmail,
    resendVerification: authContext.resendVerification,
    requestPasswordReset: authContext.requestPasswordReset,
    verifyPasswordResetCode: authContext.verifyPasswordResetCode,
    resetPassword: authContext.resetPassword,
    
    // Utilitários do contexto
    getAuthHeaders: authContext.getAuthHeaders,
    isTokenExpired: authContext.isTokenExpired,
    
    // Estados adicionais do hook
    loginLoading,
    registerLoading,
    
    // Funções auxiliares
    canCreateCompanies,
    canMakeMatches,
    getRemainingCompanies,
    getRemainingMatches,
    isTrialUser,
    getTrialDaysLeft,
    
    // Validações
    validateEmail,
    validatePassword,
  };
};

// 🎯 Hook simplificado apenas para verificar autenticação
export const useAuthStatus = () => {
  const { isAuthenticated, loading, user, subscription } = useAuth();
  
  return {
    isAuthenticated,
    loading,
    user,
    subscription,
    isReady: !loading, // Indica quando a verificação inicial terminou
  };
};

// 🔧 Hook para headers de API
export const useAuthHeaders = () => {
  const { getAuthHeaders, isAuthenticated, isTokenExpired } = useAuth();
  
  const getHeaders = useCallback(() => {
    if (isAuthenticated && !isTokenExpired()) {
      return getAuthHeaders();
    }
    
    return {
      'Content-Type': 'application/json',
    };
  }, [getAuthHeaders, isAuthenticated, isTokenExpired]);
  
  return {
    getHeaders,
    hasValidToken: isAuthenticated && !isTokenExpired(),
  };
};

// 🎮 Hook para ações de autenticação
export const useAuthActions = () => {
  const { 
    login, 
    register, 
    logout, 
    clearError, 
    loginLoading, 
    registerLoading 
  } = useAuth();
  
  return {
    login,
    register,
    logout,
    clearError,
    loginLoading,
    registerLoading,
    isLoading: loginLoading || registerLoading,
  };
}; 
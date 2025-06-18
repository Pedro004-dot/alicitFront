import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStatus } from '../../hooks/useAuth';

// 📋 Props do componente
interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
  fallback?: ReactNode;
}

// 🛡️ Componente de Loading para autenticação
const AuthLoadingSpinner: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center">
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-orange-200 rounded-full"></div>
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-orange-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-1">
          Verificando autenticação
        </h3>
        <p className="text-gray-600">
          Aguarde um momento...
        </p>
      </div>
    </div>
  </div>
);

// 🔒 Componente Principal de Proteção
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  redirectTo = '/login',
  requireAuth = true,
  fallback = <AuthLoadingSpinner />,
}) => {
  const { isAuthenticated, loading, isReady } = useAuthStatus();
  const location = useLocation();

  // 🔄 Se ainda está verificando autenticação, mostrar loading
  if (!isReady || loading) {
    return <>{fallback}</>;
  }

  // 🔐 Se requer autenticação mas usuário não está autenticado
  if (requireAuth && !isAuthenticated) {
    // Salvar a localização atual para redirecionar após login
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // 🚫 Se não requer autenticação mas usuário está autenticado (ex: página de login)
  if (!requireAuth && isAuthenticated) {
    // Recuperar a localização salva ou ir para home
    const from = location.state?.from || '/';
    return <Navigate to={from} replace />;
  }

  // ✅ Renderizar children se as condições forem atendidas
  return <>{children}</>;
};

// 🔧 Variações do componente para casos específicos

// Proteção padrão (requer autenticação)
export const RequireAuth: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <ProtectedRoute requireAuth={true} fallback={fallback}>
    {children}
  </ProtectedRoute>
);

// Proteção para usuários não autenticados (ex: login, register)
export const RequireNoAuth: React.FC<{ children: ReactNode; redirectTo?: string }> = ({ 
  children, 
  redirectTo = '/' 
}) => (
  <ProtectedRoute requireAuth={false} redirectTo={redirectTo}>
    {children}
  </ProtectedRoute>
);

// Componente condicional baseado na autenticação
interface ConditionalAuthProps {
  children: ReactNode;
  fallback?: ReactNode;
  loadingComponent?: ReactNode;
  when: 'authenticated' | 'unauthenticated';
}

export const ConditionalAuth: React.FC<ConditionalAuthProps> = ({
  children,
  fallback = null,
  loadingComponent = <AuthLoadingSpinner />,
  when,
}) => {
  const { isAuthenticated, loading, isReady } = useAuthStatus();

  // Se ainda está carregando
  if (!isReady || loading) {
    return <>{loadingComponent}</>;
  }

  // Renderizar baseado na condição
  const shouldRender = when === 'authenticated' ? isAuthenticated : !isAuthenticated;
  
  return shouldRender ? <>{children}</> : <>{fallback}</>;
};

// 🎯 Hook para verificar permissões específicas
export const useRouteProtection = () => {
  const { isAuthenticated, loading, subscription } = useAuthStatus();

  const canAccess = {
    // Verificações básicas
    isAuthenticated: () => isAuthenticated,
    hasValidSubscription: () => subscription?.status === 'active' || subscription?.status === 'trial',
    
    // Verificações de features
    canCreateCompanies: () => {
      if (!subscription) return false;
      // TODO: Implementar lógica baseada em uso atual vs limites
      return subscription.max_empresas > 0;
    },
    
    canMakeMatches: () => {
      if (!subscription) return false;
      // TODO: Implementar lógica baseada em uso atual vs limites
      return subscription.max_monthly_matches > 0;
    },
    
    // Verificações de tipo de usuário
    isTrialUser: () => subscription?.status === 'trial',
    isPaidUser: () => subscription?.status === 'active',
    
    // Verificações de admin (futuro)
    isAdmin: () => {
      // TODO: Implementar quando houver roles
      return false;
    },
  };

  const getRedirectPath = (feature: string) => {
    if (!isAuthenticated) return '/login';
    if (!canAccess.hasValidSubscription()) return '/subscription';
    return '/';
  };

  return {
    canAccess,
    getRedirectPath,
    loading,
    isReady: !loading,
  };
};

// 🔐 Componente para proteção baseada em features
interface FeatureProtectedProps {
  children: ReactNode;
  feature: 'companies' | 'matches' | 'admin';
  fallback?: ReactNode;
  redirectTo?: string;
}

export const FeatureProtected: React.FC<FeatureProtectedProps> = ({
  children,
  feature,
  fallback = null,
  redirectTo,
}) => {
  const { canAccess, getRedirectPath, loading } = useRouteProtection();

  if (loading) {
    return <AuthLoadingSpinner />;
  }

  let hasAccess = false;
  
  switch (feature) {
    case 'companies':
      hasAccess = canAccess.isAuthenticated() && canAccess.canCreateCompanies();
      break;
    case 'matches':
      hasAccess = canAccess.isAuthenticated() && canAccess.canMakeMatches();
      break;
    case 'admin':
      hasAccess = canAccess.isAuthenticated() && canAccess.isAdmin();
      break;
    default:
      hasAccess = canAccess.isAuthenticated();
  }

  if (!hasAccess) {
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }
    
    if (fallback) {
      return <>{fallback}</>;
    }
    
    // Redirecionar para página apropriada baseada no motivo da negação
    const redirect = getRedirectPath(feature);
    return <Navigate to={redirect} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 
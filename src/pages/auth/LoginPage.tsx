import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import logoAlicit from '../../assets/logoAlicitDegrade.png';

const LoginPage: React.FC = () => {
  const { 
    login, 
    isAuthenticated, 
    loading: authLoading,
    loginLoading,
    error,
    clearError,
    validateEmail 
  } = useAuth();

  // Estados do formulário
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Estados de validação
  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    password: '',
  });

  // Estados da UI
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Limpar erro ao montar componente
  useEffect(() => {
    clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Executar apenas uma vez ao montar

  // Limpar erro após 5 segundos
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]); // clearError é estável

  // Redirecionar se já autenticado
  if (isAuthenticated && !authLoading) {
    return <Navigate to="/" replace />;
  }

  // Validar campo individual
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'email':
        if (!value.trim()) return 'Email é obrigatório';
        if (!validateEmail(value)) return 'Email inválido';
        return '';
      
      case 'password':
        if (!value.trim()) return 'Senha é obrigatória';
        if (value.length < 6) return 'Senha deve ter pelo menos 6 caracteres';
        return '';
      
      default:
        return '';
    }
  };

  // Atualizar campo do formulário
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Validar campo se já foi tocado
    if (fieldErrors[name as keyof typeof fieldErrors]) {
      const error = validateField(name, value);
      setFieldErrors(prev => ({
        ...prev,
        [name]: error,
      }));
    }

    // Limpar erro geral se existir
    if (error) {
      clearError();
    }
  };

  // Validar formulário ao sair do campo
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    
    setFieldErrors(prev => ({
      ...prev,
      [name]: error,
    }));
  };

  // Submeter formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar todos os campos
    const emailError = validateField('email', formData.email);
    const passwordError = validateField('password', formData.password);

    setFieldErrors({
      email: emailError,
      password: passwordError,
    });

    // Se há erros, não submeter
    if (emailError || passwordError) {
      return;
    }

    // Tentar fazer login
    const success = await login(formData.email, formData.password);
    
    if (success) {
      setShowSuccess(true);
      // O redirecionamento será automático via Navigate
    }
  };

  // Se está carregando autenticação inicial
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-white shadow-lg">
              <img 
                src={logoAlicit} 
                alt="Alicit Logo" 
                className="w-full h-full object-contain p-2"
              />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Bem-vindo de volta!
          </h2>
          <p className="mt-2 text-gray-600">
            Entre na sua conta para continuar
          </p>
        </div>

        {/* Mensagem de Sucesso */}
        {showSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-green-800 font-medium">Login realizado com sucesso!</p>
              <p className="text-green-600 text-sm">Redirecionando...</p>
            </div>
          </div>
        )}

        {/* Mensagem de Erro */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-medium">Erro no login</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Formulário */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Campo Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`
                  block w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm placeholder-gray-400 
                  focus:outline-none focus:ring-2 focus:border-transparent transition-all
                  ${fieldErrors.email 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-orange-500'
                  }
                `}
                placeholder="Seu email"
              />
            </div>
            {fieldErrors.email && (
              <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                <AlertCircle className="w-4 h-4" />
                <span>{fieldErrors.email}</span>
              </p>
            )}
          </div>

          {/* Campo Senha */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`
                  block w-full pl-10 pr-10 py-3 border rounded-lg shadow-sm placeholder-gray-400 
                  focus:outline-none focus:ring-2 focus:border-transparent transition-all
                  ${fieldErrors.password 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-orange-500'
                  }
                `}
                placeholder="Sua senha"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                <AlertCircle className="w-4 h-4" />
                <span>{fieldErrors.password}</span>
              </p>
            )}
          </div>

          {/* Opções */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Lembrar-me
              </label>
            </div>

            <div className="text-sm">
              <Link
                to="/forgot-password"
                className="font-medium text-orange-600 hover:text-orange-500 transition-colors"
              >
                Esqueceu a senha?
              </Link>
            </div>
          </div>

          {/* Botão de Login */}
          <button
            type="submit"
            disabled={loginLoading || showSuccess}
            className={`
              group relative w-full flex justify-center py-3 px-4 border border-transparent 
              text-sm font-medium rounded-lg text-white transition-all
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500
              ${loginLoading || showSuccess
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-orange-600 hover:bg-orange-700 active:bg-orange-800'
              }
            `}
          >
            {loginLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Entrando...</span>
              </div>
            ) : showSuccess ? (
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Sucesso!</span>
              </div>
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        {/* Link para Registro */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Ainda não tem conta?{' '}
            <Link
              to="/register"
              className="font-medium text-orange-600 hover:text-orange-500 transition-colors"
            >
              Criar conta grátis
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          <p>
            Ao entrar, você concorda com nossos{' '}
            <button className="text-orange-600 hover:text-orange-500 underline bg-transparent border-none cursor-pointer">
              Termos de Serviço
            </button>{' '}
            e{' '}
            <button className="text-orange-600 hover:text-orange-500 underline bg-transparent border-none cursor-pointer">
              Política de Privacidade
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 
import React, { useState, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import logoAlicit from '../../assets/logoAlicitDegrade.png';

const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyEmail, resendVerification, loading, error, clearError } = useAuth();
  
  // Pegar email da query string ou state
  const email = new URLSearchParams(location.search).get('email') || 
                location.state?.email || '';
                
  // Estado do código (array de 6 dígitos)
  const [code, setCode] = useState<string[]>(Array(6).fill(''));
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Estados de UI
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutos em segundos
  const [canResend, setCanResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Referências para os inputs
  const inputRefs = Array(6).fill(0).map(() => React.createRef<HTMLInputElement>());
  
  // Formatar tempo restante
  const formatTimeLeft = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Contador regressivo
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);
  
  // Limpar erro ao montar
  useEffect(() => {
    clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Limpar erro após 5 segundos
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);
  
  // Manipular input do código
  const handleCodeChange = (index: number, value: string) => {
    // Permitir apenas números
    if (!/^\d*$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    
    // Mover para o próximo input se houver valor
    if (value && index < 5) {
      const nextIndex = index + 1;
      setCurrentIndex(nextIndex);
      inputRefs[nextIndex].current?.focus();
    }
    
    // Verificar automaticamente se código está completo
    if (value && index === 5) {
      setCurrentIndex(5); // Atualizar índice atual
    }
  };
  
  // Manipular backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      setCurrentIndex(index - 1);
      inputRefs[index - 1].current?.focus();
    }
  };
  
  // Submeter código
  const handleSubmit = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) return;
    
    const success = await verifyEmail(fullCode, email);
    if (success) {
      setSuccess(true);
      // Redirecionar após 2 segundos
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    }
  };
  
  // Reenviar código
  const handleResend = async () => {
    if (!canResend || resendLoading) return;
    
    setResendLoading(true);
    await resendVerification(email);
    setResendLoading(false);
    
    // Resetar contador
    setTimeLeft(600);
    setCanResend(false);
    
    // Limpar código atual
    setCode(Array(6).fill(''));
    setCurrentIndex(0);
    inputRefs[0].current?.focus();
  };
  
  // Voltar para registro
  const handleBack = () => {
    navigate('/register');
  };
  
  // Se não tem email, voltar para registro
  if (!email) {
    return <Navigate to="/register" replace />;
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
            Verificar Email
          </h2>
          <p className="mt-2 text-gray-600">
            Digite o código de 6 dígitos enviado para
          </p>
          <p className="font-medium text-gray-800">
            {email}
          </p>
        </div>

        {/* Mensagem de Sucesso */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-green-800 font-medium">Email verificado com sucesso!</p>
              <p className="text-green-600 text-sm">Redirecionando para o login...</p>
            </div>
          </div>
        )}

        {/* Mensagem de Erro */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-medium">Erro na verificação</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Campos do Código */}
        <div className="space-y-6">
          <div>
            <div className="flex justify-center space-x-3">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={inputRefs[index]}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={`
                    w-12 h-14 text-center text-2xl font-bold border rounded-lg
                    focus:outline-none focus:ring-2 focus:border-transparent transition-all
                    ${error 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-orange-500'
                    }
                  `}
                  disabled={loading || success}
                />
              ))}
            </div>
            
            {/* Contador */}
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Tempo restante: <span className="font-medium">{formatTimeLeft()}</span>
              </p>
            </div>
          </div>

          {/* Botão de Verificação */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={code.join('').length !== 6 || loading || success}
            className={`
              w-full py-3 px-4 text-base font-medium rounded-lg text-white
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500
              transition-all
              ${code.join('').length === 6 && !loading && !success
                ? 'bg-orange-600 hover:bg-orange-700'
                : 'bg-orange-300 cursor-not-allowed'
              }
            `}
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Verificando...</span>
              </div>
            ) : (
              'Verificar Código'
            )}
          </button>

          {/* Botão de Reenvio */}
          <button
            type="button"
            onClick={handleResend}
            disabled={!canResend || resendLoading || loading || success}
            className={`
              w-full py-3 px-4 text-sm font-medium rounded-lg
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500
              transition-all
              ${canResend && !resendLoading && !loading && !success
                ? 'text-orange-600 hover:text-orange-700'
                : 'text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {resendLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Reenviando...</span>
              </div>
            ) : (
              'Reenviar código'
            )}
          </button>

          {/* Botão Voltar */}
          <button
            type="button"
            onClick={handleBack}
            className="w-full flex items-center justify-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para registro</span>
          </button>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          <p>
            Problemas para verificar?{' '}
            <button 
              className="text-orange-600 hover:text-orange-500 underline bg-transparent border-none cursor-pointer"
              onClick={() => window.location.href = 'mailto:suporte@alicit.co'}
            >
              Contate o suporte
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage; 
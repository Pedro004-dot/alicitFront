import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, Loader2, ArrowLeft, KeyRound } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import logoAlicit from '../../assets/logoAlicitDegrade.png';

const VerifyPasswordResetPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { requestPasswordReset, verifyPasswordResetCode, loading, error, clearError } = useAuth();
  
  const email = location.state?.email || '';
                
  const [code, setCode] = useState<string[]>(Array(6).fill(''));
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutos
  const [canResend, setCanResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const inputRefs = Array(6).fill(0).map(() => React.createRef<HTMLInputElement>());
  
  const formatTimeLeft = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);
  
  useEffect(() => {
    clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Executar apenas uma vez ao montar
  
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);
  
  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    
    if (value && index < 5) {
      const nextIndex = index + 1;
      setCurrentIndex(nextIndex);
      inputRefs[nextIndex].current?.focus();
    } else if (value && index === 5) {
        setCurrentIndex(5);
    }
  };
  
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      setCurrentIndex(index - 1);
      inputRefs[index - 1].current?.focus();
    }
  };
  
  const handleSubmit = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6 || !email) return;
    
    const isVerified = await verifyPasswordResetCode(email, fullCode);
        
    if (isVerified) {
      setSuccess(true);
      setTimeout(() => {
        navigate('/reset-password', { 
          state: { email, code: fullCode },
          replace: true 
        });
      }, 2000);
    }
  };
  
  const handleResend = async () => {
    if (!canResend || resendLoading || !email) return;
    
    setResendLoading(true);
    await requestPasswordReset(email);
    setResendLoading(false);
    
    setTimeLeft(600);
    setCanResend(false);
    
    setCode(Array(6).fill(''));
    setCurrentIndex(0);
    inputRefs[0].current?.focus();
  };
  
  const handleBack = () => {
    navigate('/login');
  };
  
  if (!email) {
    return <Navigate to="/forgot-password" replace />;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-white shadow-lg flex items-center justify-center">
              <KeyRound className="w-12 h-12 text-orange-500" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Verificar Código
          </h2>
          <p className="mt-2 text-gray-600">
            Digite o código de 6 dígitos enviado para
          </p>
          <p className="font-medium text-gray-800">
            {email}
          </p>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-green-800 font-medium">Código verificado!</p>
              <p className="text-green-600 text-sm">Redirecionando para redefinir sua senha...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-medium">Erro na verificação</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

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
            
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                O código expira em: <span className="font-medium">{formatTimeLeft()}</span>
              </p>
            </div>
          </div>

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

          <button
            type="button"
            onClick={handleBack}
            className="w-full flex items-center justify-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyPasswordResetPage; 
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import logoAlicit from '../../assets/logoAlicitDegrade.png';

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { resetPassword, validatePassword } = useAuth();

  // Pegar dados do state da navegação
  const email = location.state?.email || null;
  const code = location.state?.code || null;
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setError(passwordValidation.errors.join(', '));
      return;
    }
    
    if (!email || !code) {
      setError('Informações de verificação ausentes. Tente o processo novamente.');
      return;
    }

    setLoading(true);
    const result = await resetPassword(email, code, password);
    setLoading(false);

    if (result) {
      setSuccess(true);
      // Redirecionar para o login após 3 segundos
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);
    } else {
      // O erro já deve ser setado pelo hook `useAuth`
      // mas podemos setar um genérico como fallback.
      setError('Não foi possível redefinir a senha. O código pode ter expirado.');
    }
  };

  if (!email || !code) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6 bg-white p-10 rounded-2xl shadow-lg">
        <div className="text-center">
          <img src={logoAlicit} alt="Alicit Logo" className="mx-auto h-20 w-auto" />
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            Crie uma Nova Senha
          </h2>
        </div>

        {success ? (
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Senha Redefinida!</h3>
            <p className="mt-2 text-sm text-gray-600">
              Sua senha foi alterada com sucesso. Redirecionando para o login...
            </p>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Campo Nova Senha */}
            <div>
              <label htmlFor="password-input" className="sr-only">Nova Senha</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-gray-400" />
                </span>
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nova senha"
                  className="block w-full rounded-md border-gray-300 pl-10 focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3">
                  {showPassword ? <EyeOff className="h-5 w-5 text-gray-500" /> : <Eye className="h-5 w-5 text-gray-500" />}
                </button>
              </div>
            </div>
            {/* Campo Confirmar Senha */}
            <div>
              <label htmlFor="confirm-password-input" className="sr-only">Confirmar Nova Senha</label>
              <div className="relative">
                 <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-gray-400" />
                </span>
                <input
                  id="confirm-password-input"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmar nova senha"
                  className="block w-full rounded-md border-gray-300 pl-10 focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                />
                 <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3">
                  {showConfirmPassword ? <EyeOff className="h-5 w-5 text-gray-500" /> : <Eye className="h-5 w-5 text-gray-500" />}
                </button>
              </div>
            </div>
            
            {error && <p className="mt-2 text-sm text-red-600 text-center">{error}</p>}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center rounded-md border border-transparent bg-orange-600 py-2 px-4 text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:bg-orange-400"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Redefinir Senha'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage; 
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import logoAlicit from '../../assets/logoAlicitDegrade.png';

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { requestPasswordReset } = useAuth(); // Precisaremos adicionar esta função
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Por favor, insira seu email.');
      return;
    }

    setLoading(true);
    const success = await requestPasswordReset(email); 
    setLoading(false);
    
    if (success) {
      setSuccess(true);
      // Navegar para a página de verificação após um breve delay
      setTimeout(() => {
        navigate('/verify-password-reset', { 
          state: { email },
          replace: true 
        });
      }, 2000);
    } else {
      // O hook já deve setar o erro global, mas podemos ter um local também
      setError("Não foi possível enviar a solicitação. Tente novamente.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-lg">
        <div className="text-center">
          <img src={logoAlicit} alt="Alicit Logo" className="mx-auto h-20 w-auto" />
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            Esqueceu sua senha?
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sem problemas! Digite seu email e enviaremos um código para redefinição.
          </p>
        </div>

        {success ? (
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Verifique seu email</h3>
            <p className="mt-2 text-sm text-gray-600">
              Enviamos um código de 6 dígitos para {email}. Redirecionando...
            </p>
            <button
              onClick={() => navigate('/login')}
              className="mt-6 w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Voltar para o Login
            </button>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-md border-gray-300 pl-10 focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                  placeholder="seu.email@exemplo.com"
                />
              </div>
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center rounded-md border border-transparent bg-orange-600 py-2 px-4 text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:bg-orange-400"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Enviar Código de Redefinição'
                )}
              </button>
            </div>
          </form>
        )}

        <div className="text-center">
          <Link to="/login" className="flex items-center justify-center text-sm font-medium text-orange-600 hover:text-orange-500">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Lembrou a senha? Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage; 
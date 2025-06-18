import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { RequireAuth, RequireNoAuth } from './components/auth/ProtectedRoute';

// 🔐 Páginas de Autenticação
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import VerifyPasswordResetPage from './pages/auth/VerifyPasswordResetPage';

// 🏠 Layout e Páginas Principais
import Sidebar from './components/layout/Sidebar';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import MatchesPage from './pages/MatchesPage';
import CompaniesPage from './pages/CompaniesPage';
import ConfigPage from './pages/ConfigPage';
import BidAnalysisPage from './pages/BidAnalysisPage';

// 🎯 Layout Principal com Sidebar (Protegido)
const MainLayout: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('home');

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onPageChange={setCurrentPage} />;
      case 'licitacoes':
        return <SearchPage />;
      case 'matches':
        return <MatchesPage />;
      case 'empresas':
        return <CompaniesPage />;
      case 'config':
        return <ConfigPage />;
      default:
        return <HomePage onPageChange={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="flex-1 min-h-screen">
        {renderCurrentPage()}
      </main>
    </div>
  );
};

// 🚀 App Principal
const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* 🔓 Rotas Públicas (sem autenticação) */}
          <Route 
            path="/login" 
            element={
              <RequireNoAuth>
                <LoginPage />
              </RequireNoAuth>
            } 
          />
          
          <Route 
            path="/register" 
            element={
              <RequireNoAuth>
                <RegisterPage />
              </RequireNoAuth>
            } 
          />
          
          <Route 
            path="/forgot-password" 
            element={
              <RequireNoAuth>
                <ForgotPasswordPage />
              </RequireNoAuth>
            } 
          />

          <Route 
            path="/verify-password-reset" 
            element={
              <RequireNoAuth>
                <VerifyPasswordResetPage />
              </RequireNoAuth>
            } 
          />

          <Route 
            path="/reset-password" 
            element={
              <RequireNoAuth>
                <ResetPasswordPage />
              </RequireNoAuth>
            } 
          />
          
          {/* 🔐 Rotas Protegidas (requerem autenticação) */}
          
          {/* Análise de Licitação - Rota específica protegida */}
          <Route 
            path="/analise-licitacao" 
            element={
              <RequireAuth>
                <BidAnalysisPage />
              </RequireAuth>
            } 
          />
          
          {/* Dashboard Principal - Layout com Sidebar */}
          <Route 
            path="/" 
            element={
              <RequireAuth>
                <MainLayout />
              </RequireAuth>
            } 
          />
          
          {/* Todas as outras rotas redirecionam para home */}
          <Route 
            path="*" 
            element={<Navigate to="/" replace />} 
          />

          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;

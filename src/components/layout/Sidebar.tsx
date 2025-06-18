import React, { useState, useEffect } from 'react';
import { 
  Home, 
  FileText, 
  Link, 
  Building2, 
  ChevronLeft, 
  ChevronRight,
  Menu,
  X,
  User,
  LogOut,
  Shield,
  Crown
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import logoAlicit from '../../assets/logoAlicitDegrade.png';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const menuItems: MenuItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: Home,
    description: 'Visão geral e dashboard'
  },
  {
    id: 'licitacoes',
    label: 'Licitações',
    icon: FileText,
    description: 'Gerenciar licitações'
  },
  {
    id: 'matches',
    label: 'Matches',
    icon: Link,
    description: 'Correspondências encontradas'
  },
  {
    id: 'empresas',
    label: 'Empresas',
    icon: Building2,
    description: 'Gerenciar empresas'
  }
];

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange }) => {
  // 🔐 Hook de autenticação
  const { user, logout, subscription, isTrialUser, getTrialDaysLeft } = useAuth();

  // Estado para controlar se está expandida ou minimizada
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem('sidebar-expanded');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Estado para controlar se está aberta no mobile
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Salvar preferência no localStorage
  useEffect(() => {
    localStorage.setItem('sidebar-expanded', JSON.stringify(isExpanded));
  }, [isExpanded]);

  // Detectar tamanho da tela para responsividade
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsExpanded(false);
        setIsMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Executar na montagem

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const toggleMobile = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const handleItemClick = (pageId: string) => {
    onPageChange(pageId);
    // Fechar menu mobile após seleção
    if (window.innerWidth < 768) {
      setIsMobileOpen(false);
    }
  };

  // 🚪 Função de logout
  const handleLogout = () => {
    logout();
    // Menu mobile será fechado automaticamente pelo redirect
  };

  return (
    <>
      {/* Botão hamburger para mobile */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={toggleMobile}
          className="p-2 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          {isMobileOpen ? (
            <X className="w-5 h-5 text-gray-600" />
          ) : (
            <Menu className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>

      {/* Overlay para mobile */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-lg z-40
          transition-all duration-300 ease-in-out
          ${isExpanded ? 'w-64' : 'w-16'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Header da sidebar */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {/* Logo/Título */}
            <div className={`flex items-center space-x-3 ${!isExpanded && 'justify-center'}`}>
              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-white">
                <img 
                  src={logoAlicit} 
                  alt="Alicit Logo" 
                  className="w-full h-full object-contain p-1"
                />
              </div>
              {isExpanded && (
                <div className="flex flex-col">
                  <h1 className="text-lg font-bold text-gray-900">Alicit</h1>
                  <p className="text-xs text-gray-500">Gestão Inteligente</p>
                </div>
              )}
            </div>

            {/* Botão de minimizar (apenas desktop) */}
            <button
              onClick={toggleExpanded}
              className={`
                hidden md:flex p-1.5 rounded-lg hover:bg-gray-100 transition-colors
                ${!isExpanded && 'mx-auto'}
              `}
            >
              {isExpanded ? (
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Menu de navegação */}
        <nav className="p-2 space-y-1 pb-32">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`
                  w-full flex items-center space-x-3 px-3 py-3 rounded-lg
                  transition-all duration-200 text-left
                  ${isActive 
                    ? 'bg-orange-50 text-orange-700 border-l-4 border-[#FF7610]' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }
                  ${!isExpanded && 'justify-center px-2'}
                `}
                title={!isExpanded ? item.label : undefined}
              >
                <Icon 
                  className={`
                    w-5 h-5 flex-shrink-0
                    ${isActive ? 'text-[#FF7610]' : 'text-gray-500'}
                  `} 
                />
                {isExpanded && (
                  <div className="flex flex-col">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-xs text-gray-500">{item.description}</span>
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* 👤 Seção do Usuário */}
        <div className="absolute bottom-0 left-0 right-0 p-2 border-t border-gray-200 bg-white">
          {isExpanded ? (
            // Versão expandida - Informações completas do usuário
            <div className="space-y-3">
              {/* Informações da assinatura */}
              {subscription && (
                <div className="px-3 py-2 bg-orange-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {isTrialUser() ? (
                        <Crown className="w-4 h-4 text-orange-600" />
                      ) : (
                        <Shield className="w-4 h-4 text-green-600" />
                      )}
                      <span className="text-xs font-medium text-gray-700">
                        {subscription.plan_name}
                      </span>
                    </div>
                    {isTrialUser() && (
                      <span className="text-xs text-orange-600 font-medium">
                        {getTrialDaysLeft()} dias
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Informações do usuário */}
              <div className="flex items-center space-x-3 px-3 py-2 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-[#FF7610] rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.name || 'Usuário'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email || ''}
                  </p>
                </div>
              </div>

              {/* Botão de logout */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-3 py-2 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Sair</span>
              </button>
            </div>
          ) : (
            // Versão minimizada - Apenas avatar e logout
            <div className="space-y-2">
              {/* Avatar do usuário */}
              <div className="flex justify-center">
                <div className="w-8 h-8 bg-[#FF7610] rounded-full flex items-center justify-center" title={user?.name}>
                  <User className="w-4 h-4 text-white" />
                </div>
              </div>

                             {/* Status da assinatura (indicador) */}
               {subscription && (
                 <div className="flex justify-center">
                   <div 
                     title={subscription.plan_name}
                     className={`w-2 h-2 rounded-full ${isTrialUser() ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`}>
                   </div>
                 </div>
               )}

              {/* Botão de logout minimizado */}
              <button
                onClick={handleLogout}
                className="w-full flex justify-center p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Spacer para o conteúdo principal (apenas desktop) */}
      <div className={`hidden md:block transition-all duration-300 ${isExpanded ? 'w-64' : 'w-16'}`} />
    </>
  );
};

export default Sidebar; 
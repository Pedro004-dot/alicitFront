import React from 'react';
import ProcessStatusWidget from './ProcessStatusWidget';

interface LayoutProps {
  children: React.ReactNode;
  showProcessWidget?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, showProcessWidget = true }) => {
  const handleProcessComplete = (type: 'search' | 'reevaluate') => {
    console.log(`Processo ${type} concluído globalmente`);
    // Você pode adicionar lógica global aqui, como atualizar um context
    // ou mostrar notificações em toda a aplicação
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {children}
      
      {/* Widget de Status Global (aparece em todas as páginas se habilitado) */}
      {showProcessWidget && (
        <ProcessStatusWidget onProcessComplete={handleProcessComplete} />
      )}
    </div>
  );
};

export default Layout; 
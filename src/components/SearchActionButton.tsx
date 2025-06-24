import React from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { config } from '../config/environment';
import { useAuthHeaders } from '../hooks/useAuth';

interface SearchActionButtonProps {
  type: 'search' | 'reevaluate';
  variant?: 'floating' | 'inline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SearchActionButton: React.FC<SearchActionButtonProps> = ({ 
  type, 
  variant = 'inline', 
  size = 'md',
  className = '' 
}) => {
  const { getHeaders } = useAuthHeaders();

  const startProcess = async () => {
    try {
      const endpoint = type === 'search' ? '/search-new-bids' : '/reevaluate-bids';
      const response = await fetch(`${config.API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          ...getHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      
      const data = await response.json();
      
      if (data.status === 'success' && data.data.success) {
        console.log(`${type === 'search' ? 'Busca' : 'Reavaliação'} iniciada com sucesso!`);
        // O ProcessStatusWidget detectará automaticamente o processo ativo
      } else {
        console.error('Erro ao iniciar processo:', data.message);
      }
      
    } catch (err) {
      console.error('Erro ao iniciar processo:', err);
    }
  };

  const getIcon = () => {
    return type === 'search' ? <Search className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />;
  };

  const getLabel = () => {
    return type === 'search' ? 'Buscar Licitações' : 'Reavaliar Matches';
  };

  const getColors = () => {
    return type === 'search' 
      ? 'bg-blue-500 hover:bg-blue-600 text-white'
      : 'bg-green-500 hover:bg-green-600 text-white';
  };

  const getSizes = () => {
    switch (size) {
      case 'sm': return 'px-3 py-2 text-sm';
      case 'lg': return 'px-6 py-3 text-lg';
      default: return 'px-4 py-2 text-base';
    }
  };

  if (variant === 'floating') {
    return (
      <button
        onClick={startProcess}
        className={`fixed bottom-6 right-6 ${getColors()} p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110 z-40 ${className}`}
        title={getLabel()}
      >
        {getIcon()}
      </button>
    );
  }

  return (
    <button
      onClick={startProcess}
      className={`flex items-center gap-2 ${getSizes()} ${getColors()} rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 ${className}`}
      title={getLabel()}
    >
      {getIcon()}
      <span>{getLabel()}</span>
    </button>
  );
};

export default SearchActionButton; 
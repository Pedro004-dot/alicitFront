import React, { useState, useEffect } from 'react';
import { 
  Search, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  X, 
  Minimize2, 
  Maximize2,
  Activity
} from 'lucide-react';
import { config } from '../config/environment';
import { useAuthHeaders } from '../hooks/useAuth';

interface ProcessStatus {
  running: boolean;
  message: string;
  progress?: number;
  estimatedTime?: string;
  startTime?: string;
}

interface ProcessStatusWidgetProps {
  onProcessComplete?: (type: 'search' | 'reevaluate') => void;
}

const ProcessStatusWidget: React.FC<ProcessStatusWidgetProps> = ({ onProcessComplete }) => {
  const { getHeaders } = useAuthHeaders();
  
  const [processes, setProcesses] = useState<{
    search: ProcessStatus;
    reevaluate: ProcessStatus;
  }>({
    search: { running: false, message: '' },
    reevaluate: { running: false, message: '' }
  });
  
  const [isMinimized, setIsMinimized] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    visible: boolean;
  }>({ type: 'info', message: '', visible: false });

  // Polling de status
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const hasActiveProcess = processes.search.running || processes.reevaluate.running;
    
    if (hasActiveProcess) {
      interval = setInterval(async () => {
        try {
          // Verificar ambos os status
          const [searchResponse, reevalResponse] = await Promise.all([
            fetch(`${config.API_BASE_URL}/status/daily-bids`, { headers: getHeaders() }),
            fetch(`${config.API_BASE_URL}/status/reevaluate`, { headers: getHeaders() })
          ]);
          
          const searchData = await searchResponse.json();
          const reevalData = await reevalResponse.json();
          
          setProcesses(prev => {
            const newState = { ...prev };
            
            // Atualizar status de busca
            if (searchData.status === 'success' && searchData.data) {
              const wasRunning = prev.search.running;
              newState.search = {
                running: searchData.data.running === true,
                message: searchData.data.message || '',
                progress: searchData.data.progress,
                estimatedTime: searchData.data.estimatedTime,
                startTime: prev.search.startTime || (searchData.data.running ? new Date().toISOString() : undefined)
              };
              
              // Se estava rodando e agora parou, notificar
              if (wasRunning && !newState.search.running) {
                showNotification('success', 'Busca de novas licitações concluída!');
                onProcessComplete?.('search');
              }
            }
            
            // Atualizar status de reavaliação
            if (reevalData.status === 'success' && reevalData.data) {
              const wasRunning = prev.reevaluate.running;
              newState.reevaluate = {
                running: reevalData.data.running === true,
                message: reevalData.data.message || '',
                progress: reevalData.data.progress,
                estimatedTime: reevalData.data.estimatedTime,
                startTime: prev.reevaluate.startTime || (reevalData.data.running ? new Date().toISOString() : undefined)
              };
              
              // Se estava rodando e agora parou, notificar
              if (wasRunning && !newState.reevaluate.running) {
                showNotification('success', 'Reavaliação de matches concluída!');
                onProcessComplete?.('reevaluate');
              }
            }
            
            return newState;
          });
          
        } catch (err) {
          console.error('Erro ao verificar status dos processos:', err);
        }
      }, 2000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [processes.search.running, processes.reevaluate.running, getHeaders, onProcessComplete]);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message, visible: true });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, visible: false }));
    }, 5000);
  };

  const startProcess = async (type: 'search' | 'reevaluate') => {
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
        setProcesses(prev => ({
          ...prev,
          [type]: { 
            running: true, 
            message: `Iniciando ${type === 'search' ? 'busca' : 'reavaliação'}...`,
            startTime: new Date().toISOString()
          }
        }));
        
        showNotification('info', `${type === 'search' ? 'Busca' : 'Reavaliação'} iniciada! ${data.data.estimated_duration || ''}`);
        setIsMinimized(false); // Mostrar widget quando processo iniciar
      } else {
        throw new Error(data.data?.message || data.message || 'Erro ao iniciar processo');
      }
      
    } catch (err) {
      console.error('Erro ao iniciar processo:', err);
      showNotification('error', err instanceof Error ? err.message : 'Erro ao iniciar processo');
    }
  };

  const stopProcess = () => {
    setProcesses({
      search: { running: false, message: '' },
      reevaluate: { running: false, message: '' }
    });
    showNotification('info', 'Processos interrompidos pelo usuário');
  };

  const formatElapsedTime = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const elapsed = Math.floor((now.getTime() - start.getTime()) / 1000);
    
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const hasActiveProcess = processes.search.running || processes.reevaluate.running;

  // Se não há processo ativo, mostrar apenas notificações (sem botões flutuantes)
  if (!hasActiveProcess) {
    return (
      <>
        {/* Notificação */}
        {notification.visible && (
          <div className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg transition-all duration-300 transform ${
            notification.visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
          } ${
            notification.type === 'success' ? 'bg-green-500 text-white' :
            notification.type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
          }`}>
            <div className="flex items-center gap-3">
              {notification.type === 'success' && <CheckCircle className="h-5 w-5" />}
              {notification.type === 'error' && <AlertCircle className="h-5 w-5" />}
              {notification.type === 'info' && <Clock className="h-5 w-5" />}
              <p className="text-sm font-medium">{notification.message}</p>
              <button
                onClick={() => setNotification(prev => ({ ...prev, visible: false }))}
                className="ml-auto text-white hover:text-gray-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {/* Widget de Status */}
      <div className={`fixed bottom-6 right-6 z-50 bg-white rounded-lg shadow-xl border-2 border-blue-200 transition-all duration-300 ${
        isMinimized ? 'w-16 h-16' : 'w-96'
      }`}>
        {isMinimized ? (
          // Versão minimizada
          <div className="w-full h-full flex items-center justify-center">
            <button
              onClick={() => setIsMinimized(false)}
              className="w-full h-full flex items-center justify-center text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Activity className="h-6 w-6 animate-pulse" />
            </button>
          </div>
        ) : (
          // Versão expandida
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600 animate-pulse" />
                <h3 className="font-semibold text-gray-900">Processando</h3>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                  title="Minimizar"
                >
                  <Minimize2 className="h-4 w-4" />
                </button>
                <button
                  onClick={stopProcess}
                  className="p-1 text-red-400 hover:text-red-600 rounded"
                  title="Parar processos"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Processos ativos */}
            <div className="space-y-4">
              {processes.search.running && (
                <div className="border-l-4 border-blue-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Search className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-sm text-gray-900">Buscando Licitações</span>
                    {processes.search.startTime && (
                      <span className="text-xs text-gray-500 ml-auto">
                        {formatElapsedTime(processes.search.startTime)}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-600 mb-2">
                    {processes.search.message || 'Processando...'}
                  </p>
                  
                  {processes.search.progress !== undefined ? (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${processes.search.progress}%` }}
                      />
                    </div>
                  ) : (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
                    </div>
                  )}
                  
                  {processes.search.estimatedTime && (
                    <p className="text-xs text-blue-600 mt-1">
                      Tempo estimado: {processes.search.estimatedTime}
                    </p>
                  )}
                </div>
              )}

              {processes.reevaluate.running && (
                <div className="border-l-4 border-green-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <RefreshCw className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-sm text-gray-900">Reavaliando Matches</span>
                    {processes.reevaluate.startTime && (
                      <span className="text-xs text-gray-500 ml-auto">
                        {formatElapsedTime(processes.reevaluate.startTime)}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-600 mb-2">
                    {processes.reevaluate.message || 'Processando...'}
                  </p>
                  
                  {processes.reevaluate.progress !== undefined ? (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${processes.reevaluate.progress}%` }}
                      />
                    </div>
                  ) : (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
                    </div>
                  )}
                  
                  {processes.reevaluate.estimatedTime && (
                    <p className="text-xs text-green-600 mt-1">
                      Tempo estimado: {processes.reevaluate.estimatedTime}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Dica para o usuário */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700">
                💡 Você pode navegar livremente enquanto os processos são executados. Será notificado quando terminarem.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Notificação */}
      {notification.visible && (
        <div className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg transition-all duration-300 transform ${
          notification.visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        } ${
          notification.type === 'success' ? 'bg-green-500 text-white' :
          notification.type === 'error' ? 'bg-red-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          <div className="flex items-center gap-3">
            {notification.type === 'success' && <CheckCircle className="h-5 w-5" />}
            {notification.type === 'error' && <AlertCircle className="h-5 w-5" />}
            {notification.type === 'info' && <Clock className="h-5 w-5" />}
            <p className="text-sm font-medium">{notification.message}</p>
            <button
              onClick={() => setNotification(prev => ({ ...prev, visible: false }))}
              className="ml-auto text-white hover:text-gray-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ProcessStatusWidget; 
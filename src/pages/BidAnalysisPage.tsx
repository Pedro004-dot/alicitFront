import React, { useState, useEffect, useRef } from 'react';
import { BidDetail } from '../types';
import { FileText, Calendar, MapPin, DollarSign, Building2, Clock, Eye, ChevronUp, ChevronDown, Menu, X } from 'lucide-react';
import { config } from '../config/environment';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  loading?: boolean;
}

interface DocFile {
  name: string;
  url: string;
  type: string; // ex: 'pdf', 'image', etc.
  size?: number;
  created_at?: string;
  updated_at?: string;
}

const BidAnalysisPage: React.FC = () => {
  // Extrair parâmetros da URL
  const urlParams = new URLSearchParams(window.location.search);
  const pncp_id = urlParams.get('pncp_id');
  const licitacao_id_url = urlParams.get('licitacao_id');
  
  const [bidDetail, setBidDetail] = useState<BidDetail | null>(null);
  const [currentLicitacaoId, setCurrentLicitacaoId] = useState<string | null>(licitacao_id_url);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para o chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  
  // Estados para UI
  const [metadataMinimized, setMetadataMinimized] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [documents, setDocuments] = useState<DocFile[]>([]);
  const [activeDoc, setActiveDoc] = useState<DocFile | null>(null);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState<string | null>(null);

  // 🆕 NOVOS ESTADOS para preparação automática
  const [preparationStatus, setPreparationStatus] = useState<'idle' | 'preparing' | 'ready' | 'error'>('idle');
  const [preparationStep, setPreparationStep] = useState<string>('');
  const [preparationProgress, setPreparationProgress] = useState<number>(0);
  const [preparationError, setPreparationError] = useState<string | null>(null);

  useEffect(() => {
    if (pncp_id) {
      fetchBidDetail();
    }
  }, [pncp_id]);

  // 🆕 NOVO useEffect para iniciar preparação automática
  useEffect(() => {
    if (bidDetail && currentLicitacaoId && preparationStatus === 'idle') {
      console.log('🚀 Condições atendidas para preparação automática:', {
        bidDetail: !!bidDetail,
        currentLicitacaoId,
        preparationStatus
      });
      startAutomaticPreparation();
    }
  }, [bidDetail, currentLicitacaoId, preparationStatus]);

  useEffect(() => {
    // Adicionar mensagem de boas-vindas
    if (chatMessages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `Olá! Sou seu assistente especializado em análise de licitações.\n\nEstou aqui para responder dúvidas específicas sobre esta licitação com base nos documentos oficiais.\n\n💡 Algumas perguntas que você pode me fazer:\n• Qual é o objeto desta licitação?\n• Qual o valor estimado?\n• Quais são os documentos necessários?\n• Quais são os prazos importantes?\n• Como posso participar desta licitação?\n• Quais são os critérios de habilitação?\n\nFique à vontade para perguntar!`,
        timestamp: new Date(),
      };
      setChatMessages([welcomeMessage]);
    }
  }, []);

  useEffect(() => {
    // Scroll para a última mensagem
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    if (currentLicitacaoId && preparationStatus === 'ready') {
      fetchDocuments();
    }
  }, [currentLicitacaoId, preparationStatus]);

  const fetchBidDetail = async () => {
    if (!pncp_id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${config.API_BASE_URL}/bids/detail?pncp_id=${encodeURIComponent(pncp_id)}`);
      if (!response.ok) {
        throw new Error('Falha ao carregar detalhes da licitação');
      }
      const data = await response.json();
      setBidDetail(data.data);
      
      // 🎯 CORREÇÃO: Debug completo e usar o UUID correto
      console.log('📋 Debug bidDetail completo:', data.data);
      console.log('🔍 currentLicitacaoId atual:', currentLicitacaoId);
      console.log('🔍 data.data.id:', data.data?.id);
      console.log('🔍 data.data.licitacao_id:', data.data?.licitacao_id);
      
      // Se não temos licitacao_id da URL, extrair do detalhe
      if (!currentLicitacaoId) {
        // Tentar diferentes campos que podem conter o UUID
        const uuid = data.data?.licitacao_id || data.data?.id;
        if (uuid) {
          console.log('🔄 Licitacao_id obtido do detalhe:', uuid);
          setCurrentLicitacaoId(uuid);
        } else {
          console.error('❌ Nenhum licitacao_id encontrado no bidDetail');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    setDocumentsLoading(true);
    setDocumentsError(null);
    
    try {
      if (!currentLicitacaoId) {
        console.warn('⚠️ licitacao_id não disponível para buscar documentos');
        setDocumentsLoading(false);
        return;
      }
      
      console.log('🔍 Buscando documentos para licitacao_id:', currentLicitacaoId);
      const res = await fetch(`${config.API_BASE_URL}/bids/documents?licitacao_id=${currentLicitacaoId}`);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log('📄 Resposta da API de documentos:', data);
      
      if (data.success) {
        const docs = data.data || [];
        setDocuments(docs);
        console.log(`✅ ${docs.length} documentos carregados`);
        
        // Se há documentos, selecionar o primeiro automaticamente
        if (docs.length > 0) {
          setActiveDoc(docs[0]);
          console.log('📋 Documento ativo:', docs[0].name);
        }
      } else {
        console.error('❌ Erro na resposta da API:', data.message);
        setDocumentsError(data.message || 'Erro ao carregar documentos');
        setDocuments([]);
      }
    } catch (err) {
      console.error('❌ Erro ao buscar documentos:', err);
      setDocumentsError(err instanceof Error ? err.message : 'Erro desconhecido');
      setDocuments([]);
    } finally {
      setDocumentsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;
    
    // ✅ Validar licitacao_id
    if (!currentLicitacaoId || currentLicitacaoId === 'undefined' || currentLicitacaoId === 'null') {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: '❌ Erro: ID da licitação não está disponível. Verifique se você acessou esta página a partir de uma licitação válida.',
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, errorMessage]);
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: currentMessage.trim(),
      timestamp: new Date(),
    };

    const loadingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      loading: true,
    };

    setChatMessages(prev => [...prev, userMessage, loadingMessage]);
    setCurrentMessage('');
    setChatLoading(true);

    try {
      const response = await fetch(`${config.API_BASE_URL}/rag/analisarDocumentos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licitacao_id: currentLicitacaoId,
          query: currentMessage.trim()
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 2).toString(),
          type: 'assistant',
          content: result.answer || 'Desculpe, não consegui processar sua pergunta no momento.',
          timestamp: new Date(),
        };

        setChatMessages(prev => prev.slice(0, -1).concat(assistantMessage));
      } else {
        throw new Error(result.error || 'Erro ao processar pergunta');
      }
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 3).toString(),
        type: 'assistant',
        content: `Desculpe, ocorreu um erro ao processar sua pergunta: ${err instanceof Error ? err.message : 'Erro desconhecido'}`,
        timestamp: new Date(),
      };

      setChatMessages(prev => prev.slice(0, -1).concat(errorMessage));
    } finally {
      setChatLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatCurrency = (value?: number) => {
    if (!value) return 'Não informado';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Não informado';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'aberta':
      case 'em andamento':
        return 'bg-green-100 text-green-800';
      case 'encerrada':
        return 'bg-red-100 text-red-800';
      case 'suspensa':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 🆕 FUNÇÃO para preparação automática
  const startAutomaticPreparation = async () => {
    if (!currentLicitacaoId || !pncp_id) {
      console.warn('⚠️ Dados insuficientes para preparação:', { currentLicitacaoId, pncp_id });
      return;
    }
    
    console.log('🚀 Iniciando preparação automática da licitação...');
    setPreparationStatus('preparing');
    setPreparationProgress(0);
    setPreparationError(null);
    
    try {
      // PASSO 1: Verificar se documentos já existem
      setPreparationStep('Verificando documentos existentes...');
      setPreparationProgress(10);
      
      console.log('🔍 Verificando documentos para licitacao_id:', currentLicitacaoId);
      const checkResponse = await fetch(`${config.API_BASE_URL}/bids/documents?licitacao_id=${currentLicitacaoId}`);
      const checkData = await checkResponse.json();
      
      if (checkData.success && checkData.data && checkData.data.length > 0) {
        console.log('✅ Documentos já processados, pulando processamento');
        setPreparationStep('Carregando documentos existentes...');
        setPreparationProgress(80);
        
        setDocuments(checkData.data);
        if (checkData.data.length > 0) {
          setActiveDoc(checkData.data[0]);
        }
        
        setPreparationProgress(100);
        setPreparationStatus('ready');
        return;
      }
      
      // PASSO 2: Processar documentos da licitação
      setPreparationStep('Baixando documentos da API PNCP...');
      setPreparationProgress(20);
      
      console.log('📥 Iniciando processamento de documentos...');
      const processResponse = await fetch(`${config.API_BASE_URL}/bids/prepare-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licitacao_id: currentLicitacaoId,
          pncp_id: pncp_id
        })
      });
      
      if (!processResponse.ok) {
        throw new Error('Falha ao iniciar processamento de documentos');
      }
      
      const processData = await processResponse.json();
      if (!processData.success) {
        throw new Error(processData.error || 'Erro no processamento');
      }
      
      setPreparationProgress(40);
      
      // PASSO 3: Aguardar processamento (polling)
      setPreparationStep('Processando e extraindo texto dos documentos...');
      await pollProcessingStatus(currentLicitacaoId);
      
      // PASSO 4: Vetorizar documentos para RAG
      setPreparationStep('Preparando sistema de busca inteligente...');
      setPreparationProgress(85);
      
      try {
        const vectorizeResponse = await fetch(`${config.API_BASE_URL}/rag/vectorize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            licitacao_id: currentLicitacaoId
          })
        });
        
        if (!vectorizeResponse.ok) {
          console.warn('⚠️ Falha na vetorização, mas continuando (RAG pode não funcionar otimamente)');
        } else {
          const vectorizeData = await vectorizeResponse.json();
          console.log('✅ Vetorização concluída:', vectorizeData);
        }
      } catch (vectorizeError) {
        console.warn('⚠️ Erro na vetorização:', vectorizeError);
        // Não bloquear o processo por falha na vetorização
      }
      
      // PASSO 5: Finalizar preparação
      setPreparationStep('Finalizando preparação...');
      setPreparationProgress(95);
      
      // Carregar documentos processados
      await fetchDocuments();
      
      setPreparationProgress(100);
      setPreparationStatus('ready');
      
      console.log('🎉 Preparação automática concluída!');
      
    } catch (error) {
      console.error('❌ Erro na preparação automática:', error);
      setPreparationStatus('error');
      setPreparationError(error instanceof Error ? error.message : 'Erro desconhecido');
      setPreparationStep(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  // 🆕 FUNÇÃO para polling do status do processamento
  const pollProcessingStatus = async (licitacaoId: string) => {
    const maxAttempts = 30; // 2.5 minutos máximo (30 * 5s)
    let attempts = 0;
    
    const poll = async (): Promise<void> => {
      attempts++;
      setPreparationProgress(40 + (attempts / maxAttempts * 35)); // 40% até 75%
      
      try {
        console.log(`📊 Polling tentativa ${attempts}/${maxAttempts}...`);
        const response = await fetch(`${config.API_BASE_URL}/bids/preparation-status?licitacao_id=${licitacaoId}`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('📋 Status response:', data);
        
        if (data.success && data.status === 'completed') {
          console.log('✅ Processamento concluído!');
          return; // Processamento concluído
        }
        
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000); // Aguardar 5 segundos
        } else {
          throw new Error('Timeout no processamento de documentos (2.5 minutos)');
        }
      } catch (error) {
        throw new Error(`Erro ao verificar status: ${error}`);
      }
    };
    
    await poll();
  };

  // 🆕 COMPONENTE de preparação automática
  const renderPreparationOverlay = () => {
    if (preparationStatus !== 'preparing') return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
          <div className="text-center">
            {/* Ícone animado */}
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            
            {/* Título */}
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              🤖 Preparando Ambiente de Análise
            </h3>
            
            {/* Descrição */}
            <p className="text-gray-600 mb-6">
              Estamos baixando e processando todos os documentos da licitação para você ter a melhor experiência de análise.
            </p>
            
            {/* Barra de progresso */}
            <div className="mb-4">
              <div className="bg-gray-200 rounded-full h-3 mb-2">
                <div 
                  className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${preparationProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500">
                {preparationProgress.toFixed(0)}% - {preparationStep}
              </p>
            </div>
            
            {/* Etapas */}
            <div className="text-left bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-2">O que estamos fazendo:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li className={`flex items-center ${preparationProgress >= 10 ? 'text-green-600' : ''}`}>
                  {preparationProgress >= 10 ? '✅' : '⏳'} Verificando documentos
                </li>
                <li className={`flex items-center ${preparationProgress >= 40 ? 'text-green-600' : ''}`}>
                  {preparationProgress >= 40 ? '✅' : '⏳'} Baixando da API PNCP
                </li>
                <li className={`flex items-center ${preparationProgress >= 75 ? 'text-green-600' : ''}`}>
                  {preparationProgress >= 75 ? '✅' : '⏳'} Extraindo texto dos PDFs
                </li>
                <li className={`flex items-center ${preparationProgress >= 90 ? 'text-green-600' : ''}`}>
                  {preparationProgress >= 90 ? '✅' : '⏳'} Preparando busca inteligente
                </li>
              </ul>
            </div>
            
            {/* Tempo estimado */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700">
                 <strong>Tempo estimado:</strong> 1-3 minutos
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 🆕 COMPONENTE de erro na preparação
  const renderPreparationError = () => {
    if (preparationStatus !== 'error') return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
          <div className="text-center">
            {/* Ícone de erro */}
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            {/* Título */}
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              ❌ Erro na Preparação
            </h3>
            
            {/* Descrição do erro */}
            <p className="text-gray-600 mb-6">
              {preparationError || 'Ocorreu um erro ao preparar o ambiente de análise.'}
            </p>
            
            {/* Botões */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setPreparationStatus('idle');
                  setPreparationError(null);
                  startAutomaticPreparation();
                }}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                🔄 Tentar Novamente
              </button>
              <button
                onClick={() => {
                  setPreparationStatus('ready');
                  setPreparationError(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                📋 Continuar Sem Preparação
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 🆕 Overlays de preparação */}
      {renderPreparationOverlay()}
      {renderPreparationError()}
      
      {/* Sidebar Esquerda */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-16'} bg-white shadow-lg border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        {/* Header da Sidebar */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Análise Inteligente</h1>
                  <p className="text-xs text-gray-600">
                    {preparationStatus === 'preparing' ? 'Preparando ambiente...' 
                     : preparationStatus === 'ready' ? 'Assistente especializado'
                     : preparationStatus === 'error' ? 'Erro na preparação'
                     : 'Carregando...'}
                  </p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Navegação */}
        {sidebarOpen && (
          <div className="flex-1 p-4">
            <nav className="space-y-2">
              <button
                onClick={() => window.history.back()}
                className="w-full flex items-center gap-3 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors text-left"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Voltar
              </button>
              
              {/* 🆕 Status da preparação na sidebar */}
              {preparationStatus !== 'idle' && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
                  <h4 className="text-sm font-medium text-gray-800 mb-2">Status do Sistema</h4>
                  <div className="flex items-center gap-2">
                    {preparationStatus === 'preparing' && (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-orange-500"></div>
                        <span className="text-xs text-gray-600">Preparando...</span>
                      </>
                    )}
                    {preparationStatus === 'ready' && (
                      <>
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-green-600">Pronto para análise</span>
                      </>
                    )}
                    {preparationStatus === 'error' && (
                      <>
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-xs text-red-600">Erro na preparação</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col">
        {/* Metadados da licitação - Minimizáveis */}
        {bidDetail && (
          <div className="bg-white shadow-sm border-b border-gray-200">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Informações da Licitação</h2>
                <button
                  onClick={() => setMetadataMinimized(!metadataMinimized)}
                  className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {metadataMinimized ? (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Expandir
                    </>
                  ) : (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Minimizar
                    </>
                  )}
                </button>
              </div>

              {!metadataMinimized && (
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* PNCP e Status */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-orange-600" />
                        <span className="font-semibold text-gray-900">PNCP</span>
                      </div>
                      <p className="text-sm text-gray-700 font-mono">{bidDetail.pncp_id}</p>
                      {bidDetail.status && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(bidDetail.status)}`}>
                          {bidDetail.status}
                        </span>
                      )}
                    </div>

                    {/* Município e UF */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-orange-600" />
                        <span className="font-semibold text-gray-900">Localização</span>
                      </div>
                      <div className="space-y-1">
                        {bidDetail.municipio_nome && (
                          <p className="text-sm text-gray-700">{bidDetail.municipio_nome}</p>
                        )}
                        {bidDetail.uf_nome && (
                          <p className="text-xs text-gray-600">{bidDetail.uf_nome}</p>
                        )}
                        {bidDetail.nome_unidade && (
                          <p className="text-xs text-gray-600 truncate" title={bidDetail.nome_unidade}>
                            {bidDetail.nome_unidade}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Valor Estimado */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-orange-600" />
                        <span className="font-semibold text-gray-900">Valor Estimado</span>
                      </div>
                      <p className="text-sm text-gray-700 font-semibold">
                        {formatCurrency(bidDetail.valor_total_estimado)}
                      </p>
                      {bidDetail.modalidade_compra && (
                        <p className="text-xs text-gray-600">
                          Modalidade: {bidDetail.modalidade_compra}
                        </p>
                      )}
                    </div>

                    {/* Datas Importantes */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-orange-600" />
                        <span className="font-semibold text-gray-900">Prazos</span>
                      </div>
                      <div className="space-y-1">
                        {bidDetail.data_abertura_proposta && (
                          <div>
                            <p className="text-xs text-gray-600">Abertura:</p>
                            <p className="text-sm text-gray-700">{formatDate(bidDetail.data_abertura_proposta)}</p>
                          </div>
                        )}
                        {bidDetail.data_encerramento_proposta && (
                          <div>
                            <p className="text-xs text-gray-600">Encerramento:</p>
                            <p className="text-sm text-gray-700">{formatDate(bidDetail.data_encerramento_proposta)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Objeto da licitação */}
                  <div className="mt-6 pt-6 border-t border-orange-200">
                    <div className="flex items-start gap-2">
                      <FileText className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-semibold text-gray-900">Objeto:</span>
                        <p className="text-sm text-gray-700 mt-1 leading-relaxed">{bidDetail.objeto_compra}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Versão minimizada */}
              {metadataMinimized && (
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-gray-900">PNCP: {bidDetail.pncp_id}</span>
                      {bidDetail.municipio_nome && (
                        <span className="text-sm text-gray-600">{bidDetail.municipio_nome}</span>
                      )}
                      <span className="text-sm text-gray-600">
                        {formatCurrency(bidDetail.valor_total_estimado)}
                      </span>
                    </div>
                    {bidDetail.status && (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bidDetail.status)}`}>
                        {bidDetail.status}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {loading && (
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="bg-gray-100 rounded-xl p-6 border border-gray-200 animate-pulse">
              <div className="space-y-3">
                <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Main Content - Layout dividido ocupando toda a largura */}
        <div className="flex-1 flex">
          
          {/* Coluna Esquerda - Documentos */}
          <div className="w-1/2 bg-white border-r border-gray-200 flex flex-col">
            {/* Header dos Documentos */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-orange-600" />
                  <h2 className="font-semibold text-gray-900">
                    Documentos {documentsLoading ? '...' : `(${documents.length})`}
                  </h2>
                  {/* 🆕 Indicador de status dos documentos */}
                  {preparationStatus === 'preparing' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                      <div className="animate-spin rounded-full h-2 w-2 border-b border-orange-600 mr-1"></div>
                      Processando
                    </span>
                  )}
                  {preparationStatus === 'ready' && documents.length > 0 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      ✅ Prontos
                    </span>
                  )}
                </div>
                {documentsLoading && (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500"></div>
                )}
              </div>
            </div>

            {/* Seletor de Documentos */}
            <div className="px-6 py-4 border-b border-gray-200 bg-white">
              {documentsLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                  Carregando documentos...
                </div>
              ) : documentsError ? (
                <div className="flex items-center gap-2 text-sm text-red-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {documentsError}
                </div>
              ) : documents.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <FileText className="w-4 h-4" />
                  {preparationStatus === 'preparing' 
                    ? 'Baixando documentos da PNCP...' 
                    : 'Nenhum documento encontrado'
                  }
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Selecione um documento:</label>
                  <select
                    value={activeDoc?.url || ''}
                    onChange={(e) => {
                      const selectedDoc = documents.find(doc => doc.url === e.target.value);
                      setActiveDoc(selectedDoc || null);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  >
                    <option value="">Selecione um documento...</option>
                    {documents.map((doc) => (
                      <option key={doc.url} value={doc.url}>
                        {doc.name} ({doc.type.toUpperCase()})
                        {doc.size && ` - ${(doc.size / 1024 / 1024).toFixed(1)} MB`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Preview do Documento */}
            <div className="flex-1 bg-gray-50">
              {activeDoc ? (
                activeDoc.type === 'pdf' ? (
                  <div className="w-full h-full flex flex-col">
                    <div className="px-4 py-2 bg-gray-100 border-b text-xs text-gray-600 flex items-center justify-between">
                      <span className="truncate flex items-center gap-2">
                        <Eye className="w-3 h-3" />
                        {activeDoc.name}
                      </span>
                      <a 
                        href={activeDoc.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-orange-600 hover:text-orange-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-orange-50 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Abrir
                      </a>
                    </div>
                    <iframe 
                      src={activeDoc.url} 
                      title={activeDoc.name} 
                      className="w-full flex-1 border-0"
                      onError={() => console.error('Erro ao carregar PDF:', activeDoc.url)}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <FileText className="w-16 h-16 text-gray-400 mb-4" />
                    <p className="text-lg font-medium text-gray-700 mb-2">{activeDoc.name}</p>
                    <p className="text-sm text-gray-500 mb-4">
                      Tipo: {activeDoc.type.toUpperCase()}
                      {activeDoc.size && ` • ${(activeDoc.size / 1024 / 1024).toFixed(1)} MB`}
                    </p>
                    <a 
                      href={activeDoc.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Abrir Documento
                    </a>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <FileText className="w-16 h-16 text-gray-300 mb-4" />
                  <p className="text-lg text-gray-500 mb-2">
                    {preparationStatus === 'preparing' 
                      ? 'Preparando documentos...' 
                      : 'Nenhum documento selecionado'
                    }
                  </p>
                  <p className="text-sm text-gray-400">
                    {preparationStatus === 'preparing' 
                      ? 'Aguarde enquanto baixamos e processamos os documentos' 
                      : 'Selecione um documento acima para visualizar'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Coluna Direita - Chat */}
          <div className="w-1/2 bg-white flex flex-col">
            {/* Header do Chat */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Assistente IA</h2>
                  {/* 🆕 Status do assistente */}
                  <p className="text-xs text-gray-600">
                    {preparationStatus === 'preparing' && 'Preparando sistema de análise...'}
                    {preparationStatus === 'ready' && 'Pronto para responder suas perguntas'}
                    {preparationStatus === 'error' && 'Sistema com limitações'}
                    {preparationStatus === 'idle' && 'Inicializando...'}
                  </p>
                </div>
              </div>
            </div>

            {/* Área de Mensagens */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-end gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.type === 'assistant' && (
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                      message.type === 'user'
                        ? 'bg-orange-500 text-white rounded-br-none'
                        : 'bg-gray-100 text-gray-800 rounded-bl-none'
                    }`}
                  >
                    {message.loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                        <span className="text-sm">Analisando documentos...</span>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                    )}
                    <div className={`text-xs mt-2 text-right ${
                      message.type === 'user' ? 'text-orange-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input de Mensagem */}
            <div className="border-t border-gray-200 p-4">
              {/* 🆕 Aviso durante preparação */}
              {preparationStatus === 'preparing' && (
                <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-700">
                     Estamos preparando o sistema de análise. Em breve você poderá fazer perguntas específicas sobre os documentos da licitação.
                  </p>
                </div>
              )}
              
              <div className="flex items-end space-x-3">
                <textarea
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    preparationStatus === 'preparing' 
                      ? 'Aguarde a preparação do sistema...' 
                      : 'Digite sua pergunta sobre a licitação...'
                  }
                  className="flex-1 resize-none border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  rows={2}
                  disabled={chatLoading || preparationStatus === 'preparing'}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!currentMessage.trim() || chatLoading || preparationStatus === 'preparing'}
                  className="px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  style={{ minHeight: '52px', minWidth: '52px' }}
                >
                  {chatLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {preparationStatus === 'preparing' 
                  ? 'Sistema sendo preparado para análise inteligente...'
                  : 'Pressione Enter para enviar, Shift+Enter para nova linha.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BidAnalysisPage; 
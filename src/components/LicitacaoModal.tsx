import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Package, Loader2, RefreshCw } from 'lucide-react';
import { Licitacao } from '../types/licitacao';
import { config } from '../config/environment';
import { useAuthHeaders } from '../hooks/useAuth';

interface LicitacaoItem {
  numero_item: number;
  descricao: string;
  quantidade?: number;
  unidade_medida?: string;
  valor_unitario_estimado?: number;
  valor_total?: number;
  material_ou_servico?: string;
  criterio_julgamento_nome?: string;
  situacao_item?: string;
  especificacao_tecnica?: string;
  procuring_entity_name?: string;
  razao_social?: string;
  municipio_nome?: string;
  uf_nome?: string;
  data_publicacao?: string;
  data_abertura_proposta?: string;
  data_encerramento_proposta?: string;
  valor_total_estimado?: number;
  nome?: string; // Adicionado para exibir o nome do item
  external_id?: string; // Adicionado para detectar o provider
}

interface LicitacaoModalProps {
  selectedLicitacao: Licitacao | null;
  modalLoading: boolean;
  onClose: () => void;
  showAnaliseButton?: boolean
}

const LicitacaoModal: React.FC<LicitacaoModalProps> = ({
  selectedLicitacao,
  modalLoading,
  onClose,
  showAnaliseButton = true
}) => {
  const navigate = useNavigate();
  const [itens, setItens] = useState<LicitacaoItem[]>([]);
  const [loadingItens, setLoadingItens] = useState(false);
  const [itensError, setItensError] = useState<string | null>(null);
  const [showAllItens, setShowAllItens] = useState(false);
  const authHeaders = useAuthHeaders();

  // Função para determinar status baseado na data (usando status calculado do backend)
  const getStatusLicitacao = (licitacao: Licitacao) => {
    // Usar o status calculado do backend se disponível
    if (licitacao.status_calculado) {
      return licitacao.status_calculado;
    }
    
    // Fallback para cálculo frontend se necessário
    if (!licitacao.data_encerramento_proposta) return 'Indefinido';
    
    const hoje = new Date();
    const dataEncerramentoDate = new Date(licitacao.data_encerramento_proposta);
    
    // Um dia antes
    const umDiaAntes = new Date(dataEncerramentoDate);
    umDiaAntes.setDate(umDiaAntes.getDate() - 1);
    
    if (hoje > umDiaAntes) {
      return 'Fechada';
    } else {
      return 'Ativa';
    }
  };

  // Função para formatar valor (usando valor formatado do backend)
  const formatarValor = (licitacao: Licitacao) => {
    // Usar valor display do backend se disponível
    if (licitacao.valor_display !== undefined) {
      if (licitacao.valor_display === 'Sigiloso') {
        return 'Sigiloso';
      }
      if (typeof licitacao.valor_display === 'number') {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(licitacao.valor_display);
      }
    }
    
    // Fallback para valor original
    if (!licitacao.valor_total_estimado || licitacao.valor_total_estimado === 0) return 'Sigiloso';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(licitacao.valor_total_estimado);
  };

  // Função para formatar data
  const formatarData = (data: string | null) => {
    if (!data) return 'Não informado';
    return new Date(data).toLocaleDateString('pt-BR');
  };

  // Buscar itens quando o modal abrir e tiver uma licitação
  useEffect(() => {
    if (selectedLicitacao) {
      // Usar numero_controle_pncp se disponível, senão usar pncp_id
      console.log('🔍 [LicitacaoModal] selectedLicitacao:', selectedLicitacao);
      const pncpId = selectedLicitacao.numero_controle_pncp || selectedLicitacao.pncp_id;
      console.log('🔍 [LicitacaoModal] pncpId:', pncpId);
      if (pncpId) {
        fetchItens(pncpId);
      } else {
        setItens([]);
        setItensError('ID PNCP não disponível para buscar itens');
      }
    } else {
      // Limpar itens quando modal fechar
      setItens([]);
      setItensError(null);
    }
  }, [selectedLicitacao]);

  const fetchItens = async (pncpId: string, forceRefresh = false) => {
    setLoadingItens(true);
    setItensError(null);

    try {
      // Novo endpoint multi-provider
      const endpoint = `${config.API_BASE_URL}/bids/items-multi`;
      // Enviar lista de licitações (aqui, apenas uma, mas pode ser expandido)
      const payload = { licitacoes: [selectedLicitacao] };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders.getHeaders()
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      let itensRecebidos: any[] | null = null;

      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        // data.data é um array de objetos { licitacao, itens }
        const resultado = data.data[0];
        if (resultado && Array.isArray(resultado.itens)) {
          itensRecebidos = resultado.itens;
        }
      }

      if (itensRecebidos && itensRecebidos.length > 0) {
        setItens(itensRecebidos);
        console.log(`✅ ${itensRecebidos.length} itens carregados (multi-provider)`);
      } else {
        setItens([]);
        setItensError(data.message || 'Nenhum item encontrado');
      }
    } catch (error) {
      console.error('❌ Erro ao buscar itens (multi-provider):', error);
      setItensError(error instanceof Error ? error.message : 'Erro ao carregar itens');
      setItens([]);
    } finally {
      setLoadingItens(false);
    }
  };

  if (!selectedLicitacao) return null;

  // 🔍 DEBUG: Log completo do objeto selectedLicitacao
  console.log('🔍 [LicitacaoModal] selectedLicitacao completo:', selectedLicitacao);
  console.log('🔍 [LicitacaoModal] razao_social:', selectedLicitacao.razao_social);
  console.log('🔍 [LicitacaoModal] nome_unidade:', selectedLicitacao.nome_unidade);
  console.log('🔍 [LicitacaoModal] municipio_nome:', selectedLicitacao.municipio_nome);
  console.log('🔍 [LicitacaoModal] uf_nome:', selectedLicitacao.uf_nome);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header do modal */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            Detalhes da Licitação
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Conteúdo do modal */}
        <div className="p-6">
          {modalLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando detalhes...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Informações básicas */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Informações Gerais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">PNCP ID</label>
                    <p className="text-sm text-gray-900">{selectedLicitacao.pncp_id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Órgão Licitante</label>
                    <div className="text-sm text-gray-900 space-y-1">
                      <p className="font-medium">{selectedLicitacao.nome_unidade || selectedLicitacao.razao_social || selectedLicitacao.procuring_entity_name || 'Não informado'}</p>
                      {selectedLicitacao.municipio_nome && selectedLicitacao.uf_nome && (
                        <p className="text-xs text-gray-600">📍 {selectedLicitacao.municipio_nome} - {selectedLicitacao.uf_nome}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data de Publicação</label>
                    <p className="text-sm text-gray-900">{formatarData(selectedLicitacao.data_publicacao)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data de Abertura</label>
                    <p className="text-sm text-gray-900">{formatarData(selectedLicitacao.data_abertura_proposta)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data de Encerramento</label>
                    <p className="text-sm text-gray-900">{formatarData(selectedLicitacao.data_encerramento_proposta)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Valor Total</label>
                    <p className="text-sm text-gray-900 font-medium">{formatarValor(selectedLicitacao)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <div className="space-y-2">
                      <div>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            getStatusLicitacao(selectedLicitacao) === 'Ativa'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {getStatusLicitacao(selectedLicitacao)}
                        </span>
                      </div>
                      
                      {/* Botão Analisar Licitação */}
                      {showAnaliseButton && (
                        <div>
                          <button
                            onClick={() => {
                              console.log('🔍 Debug - selectedLicitacao.id:', selectedLicitacao.id);
                              console.log('🔍 Debug - selectedLicitacao.pncp_id:', selectedLicitacao.pncp_id);
                              
                              // 🎯 CORREÇÃO: Verificar se temos o ID interno, senão passar apenas pncp_id
                              const licitacaoId = selectedLicitacao.id || '';
                              const url = `/analise-licitacao?pncp_id=${encodeURIComponent(selectedLicitacao.pncp_id)}&licitacao_id=${encodeURIComponent(licitacaoId)}`;
                              
                              console.log('🔗 Navegando para:', url);
                              onClose(); // Fechar modal antes de navegar
                              navigate(url); // Usar React Router
                            }}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-slate-800 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all duration-200 shadow-sm"
                          >
                            <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            IA Análise
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Objeto */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Objeto</h3>
                <p className="text-gray-700 leading-relaxed">{selectedLicitacao.objeto_compra}</p>
              </div>

              {/* Informações complementares */}
              {selectedLicitacao.informacao_complementar && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Informações Complementares</h3>
                  <p className="text-gray-700 leading-relaxed">{selectedLicitacao.informacao_complementar}</p>
                </div>
              )}


            </div>
          )}

          {/* Seção de Itens da Licitação */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-indigo-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Itens da Licitação
                </h3>
                {itens.length > 0 && (
                  <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {itens.length} {itens.length === 1 ? 'item' : 'itens'}
                  </span>
                )}
              </div>
              
              {(selectedLicitacao.numero_controle_pncp || selectedLicitacao.pncp_id) && (
                <button
                  onClick={() => {
                    const pncpId = selectedLicitacao.numero_controle_pncp || selectedLicitacao.pncp_id;
                    if (pncpId) fetchItens(pncpId, true);
                  }}
                  disabled={loadingItens}
                  className="flex items-center space-x-1 px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  title="Atualizar itens da API PNCP"
                >
                  {loadingItens ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span>Atualizar</span>
                </button>
              )}
            </div>

            {/* Loading de Itens */}
            {loadingItens && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600 mr-2" />
                <span className="text-gray-600">Carregando itens...</span>
              </div>
            )}

            {/* Erro ao carregar itens */}
            {itensError && !loadingItens && (
              <div className="text-center py-8">
                <p className="text-red-600 mb-2">{itensError}</p>
                {(selectedLicitacao.numero_controle_pncp || selectedLicitacao.pncp_id) && (
                  <button
                    onClick={() => {
                      const pncpId = selectedLicitacao.numero_controle_pncp || selectedLicitacao.pncp_id;
                      if (pncpId) fetchItens(pncpId);
                    }}
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  >
                    Tentar novamente
                  </button>
                )}
              </div>
            )}

            {/* Lista de Itens */}
            {!loadingItens && !itensError && itens.length > 0 && (
              <div className="space-y-3">
                {(showAllItens ? itens : itens.slice(0, 5)).map((item, index) => {
                    // Detecta provider pelo external_id
                    const isComprasNet = item.external_id?.startsWith('comprasnet_');
                    if (isComprasNet) {
                      // Para ComprasNet: nome, primeira linha da descrição, quantidade e unidade
                      return (
                        <div key={`item-detail-${item.numero_item || index}`} className="bg-white p-4 rounded-lg border border-gray-200">
                          <div className="font-bold text-lg text-gray-900 mb-1">{item.nome}</div>
                          {item.descricao && (
                            <div className="text-gray-700 textQ-sm mb-2">
                              {item.descricao.split('\n')[0]}
                            </div>
                          )}
                          <div className="text-gray-800 text-sm">
                            Quantidade: <span className="font-bold">{item.quantidade}</span> {item.unidade_medida}
                          </div>
                        </div>
                      );
                    } else {
                      // PNCP: experiência aprimorada
                      const titulo = item.nome || (item.numero_item ? `Item ${item.numero_item}` : 'Item');
                      return (
                        <div key={`item-detail-${item.numero_item || index}`} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                          {/* Título do item */}
                          <div className="font-bold text-lg text-gray-900 mb-2">{titulo}</div>
                          {/* Descrição com quebras de linha */}
                          {item.descricao && (
                            <div className="text-gray-700 text-base mb-3 whitespace-pre-line" style={{lineHeight: '1.6'}}>
                              {item.descricao}
                            </div>
                          )}
                          {/* Quantidade e unidade */}
                          <div className="text-gray-800 text-sm mt-2">
                            <span className="font-semibold">Quantidade:</span> {item.quantidade} {item.unidade_medida}
                          </div>
                        </div>
                      );
                    }
                  })}

                {/* Botão para mostrar mais itens */}
                {itens.length > 5 && (
                  <div className="text-center pt-4">
                    <button
                      onClick={() => setShowAllItens(!showAllItens)}
                      className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                    >
                      {showAllItens 
                        ? 'Mostrar menos itens' 
                        : `Mostrar todos os ${itens.length} itens`
                      }
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LicitacaoModal;
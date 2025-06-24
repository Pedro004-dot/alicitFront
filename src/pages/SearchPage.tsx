import React, { useState } from 'react';
import { Search, Filter, MapPin, Calendar, DollarSign, FileText, Eye, ChevronDown, Loader2 } from 'lucide-react';
import { config } from '../config/environment';
import LicitacaoModal from '../components/LicitacaoModal';
import { Licitacao } from '../types/licitacao';
import { useAuthHeaders } from '../hooks/useAuth';

interface UnifiedFilters {
  uf: string;
  valor_min: string;
  valor_max: string;
  modalidades: string[];
  status: string;
}

interface ExtendedLicitacao extends Licitacao {
  source?: 'local' | 'pncp';
  source_label?: string;
}

const SearchPage: React.FC = () => {
  const { getHeaders } = useAuthHeaders();
  
  // Estados principais
  const [results, setResults] = useState<ExtendedLicitacao[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keywords, setKeywords] = useState('');
  const [searchPncp, setSearchPncp] = useState(true);
  
  // Estados do modal
  const [selectedLicitacao, setSelectedLicitacao] = useState<ExtendedLicitacao | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Estados dos filtros unificados
  const [filters, setFilters] = useState<UnifiedFilters>({
    uf: '',
    valor_min: '',
    valor_max: '',
    modalidades: ['todas'],
    status: ''
  });

  // Lista de UFs para o filtro
  const ufs = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  // Modalidades disponíveis
  const modalidades = [
    { value: 'todas', label: 'Todas as modalidades' },
    { value: 'pregao_eletronico', label: 'Pregão Eletrônico' },
    { value: 'concorrencia', label: 'Concorrência' },
    { value: 'convite', label: 'Convite' },
    { value: 'tomada_precos', label: 'Tomada de Preços' },
    { value: 'dispensa', label: 'Dispensa' },
    { value: 'inexigibilidade', label: 'Inexigibilidade' }
  ];

  // Função de busca unificada
  const handleUnifiedSearch = async () => {
    if (!keywords.trim()) {
      setError('Digite palavras-chave para buscar');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const searchPayload = {
        keywords: keywords,
        search_pncp: searchPncp,
        filters: {
          uf: filters.uf || undefined,
          valor_min: filters.valor_min ? parseFloat(filters.valor_min) : undefined,
          valor_max: filters.valor_max ? parseFloat(filters.valor_max) : undefined,
          modalidades: filters.modalidades.includes('todas') ? undefined : filters.modalidades,
          status: filters.status || undefined
        },
        pncp_options: {
          max_pages: 3,
          include_items: true,
          save_results: true
        }
      };

      console.log('🔍 Iniciando busca unificada:', searchPayload);

      const response = await fetch(`${config.API_BASE_URL}/search/unified`, {
        method: 'POST',
        headers: {
          ...getHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(searchPayload)
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Busca unificada concluída:', data.data.summary);
        
        // Usar os resultados combinados
        setResults(data.data.combined_results);
        
        // Log dos resultados para debug
        console.log(`📊 Resultados: ${data.data.summary.total_local} locais + ${data.data.summary.total_pncp} PNCP = ${data.data.summary.total_combined} total`);
      } else {
        setError(data.message || 'Erro na busca');
      }
    } catch (err) {
      console.error('❌ Erro na busca unificada:', err);
      setError('Erro ao conectar com a API');
    } finally {
      setLoading(false);
    }
  };

  // Função para determinar status baseado na data
  const getStatusLicitacao = (licitacao: ExtendedLicitacao) => {
    if (licitacao.status_calculado) {
      return licitacao.status_calculado;
    }
    
    if (!licitacao.data_encerramento_proposta) return 'Indefinido';
    
    const hoje = new Date();
    const dataEncerramentoDate = new Date(licitacao.data_encerramento_proposta);
    
    const umDiaAntes = new Date(dataEncerramentoDate);
    umDiaAntes.setDate(umDiaAntes.getDate() - 1);
    
    if (hoje > umDiaAntes) {
      return 'Fechada';
    } else {
      return 'Ativa';
    }
  };

  // Função para formatar valor
  const formatarValor = (licitacao: ExtendedLicitacao) => {
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

  // Abrir modal com detalhes
  const abrirModal = async (licitacao: ExtendedLicitacao) => {
    setSelectedLicitacao(licitacao);
    setModalLoading(true);

    try {
      // Se for resultado local, buscar detalhes completos
      if (licitacao.source === 'local') {
        const [detailsResponse, itemsResponse] = await Promise.all([
          fetch(`${config.API_BASE_URL}/bids/detail?pncp_id=${licitacao.pncp_id}`),
          fetch(`${config.API_BASE_URL}/bids/items?pncp_id=${licitacao.pncp_id}`)
        ]);

        const detailsData = await detailsResponse.json();
        const itemsData = await itemsResponse.json();

        if (detailsData.success) {
          const licitacaoCompleta = {
            ...detailsData.data,
            itens: itemsData.success ? itemsData.data : []
          };
          console.log('🔍 [SearchPage] Dados completos da API:', licitacaoCompleta);
          console.log('🔍 [SearchPage] razao_social:', licitacaoCompleta.razao_social);
          console.log('🔍 [SearchPage] nome_unidade:', licitacaoCompleta.nome_unidade);
          setSelectedLicitacao(licitacaoCompleta);
        }
      } else {
        // Para licitações PNCP, os itens já estão incluídos
        setSelectedLicitacao(licitacao);
      }
    } catch (err) {
      console.error('Erro ao buscar detalhes:', err);
    } finally {
      setModalLoading(false);
    }
  };

  // Atualizar filtro
  const updateFilter = (key: keyof UnifiedFilters, value: string | string[]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Limpar filtros
  const clearFilters = () => {
    setFilters({
      uf: '',
      valor_min: '',
      valor_max: '',
      modalidades: ['todas'],
      status: ''
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Buscando licitações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Busca de Licitações
              </h1>
              <p className="text-gray-600 mt-1">
                {results.length > 0 
                  ? `${results.length} licitações encontradas`
                  : 'Digite palavras-chave para buscar licitações'
                }
              </p>
            </div>

            {/* Barra de busca e controles */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Ex: desenvolvimento software, notebooks, consultoria..."
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent w-full sm:w-80"
                    onKeyPress={(e) => e.key === 'Enter' && handleUnifiedSearch()}
                  />
                </div>
                
                <button
                  onClick={handleUnifiedSearch}
                  disabled={loading || !keywords.trim()}
                  className="flex items-center gap-2 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Search className="h-5 w-5" />
                  )}
                  {loading ? 'Buscando...' : 'Buscar'}
                </button>
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="h-5 w-5" />
                Filtros
                <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Controles adicionais */}
          <div className="mt-4 flex items-center gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={searchPncp}
                onChange={(e) => setSearchPncp(e.target.checked)}
                className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
              />
              <span className="text-sm text-gray-700">Incluir busca no PNCP</span>
            </label>
          </div>

          {/* Painel de filtros */}
          {showFilters && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Modalidades</label>
                  <select
                    value={filters.modalidades[0] || 'todas'}
                    onChange={(e) => updateFilter('modalidades', [e.target.value])}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    {modalidades.map(mod => (
                      <option key={mod.value} value={mod.value}>{mod.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">UF</label>
                  <select
                    value={filters.uf}
                    onChange={(e) => updateFilter('uf', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">Todos os estados</option>
                    {ufs.map(uf => (
                      <option key={uf} value={uf}>{uf}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor Mínimo</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={filters.valor_min}
                    onChange={(e) => updateFilter('valor_min', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor Máximo</label>
                  <input
                    type="number"
                    placeholder="Sem limite"
                    value={filters.valor_max}
                    onChange={(e) => updateFilter('valor_max', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Limpar Filtros
                </button>
              </div>
            </div>
          )}

          {/* Erro */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <div className="text-red-500 mr-3">⚠️</div>
                <div>
                  <h3 className="text-sm font-medium text-red-800">Erro na busca</h3>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid de licitações */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((licitacao) => {
            const status = getStatusLicitacao(licitacao);
            const isAtiva = status === 'Ativa';
            
            return (
              <div
                key={licitacao.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
                onClick={() => abrirModal(licitacao)}
              >
                <div className="p-6">
                  {/* Status badges */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isAtiva
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {status}
                      </span>
                      {licitacao.source && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {licitacao.source_label}
                        </span>
                      )}
                    </div>
                    <Eye className="h-5 w-5 text-gray-400" />
                  </div>

                  {/* Título (objeto) */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">
                    {licitacao.objeto_compra}
                  </h3>

                  {/* Informações principais */}
                  <div className="space-y-2">
                    {/* UF */}
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{licitacao.uf || 'Não informado'}</span>
                    </div>

                    {/* Data de encerramento */}
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      <span>
                        Encerra: {formatarData(licitacao.data_encerramento_proposta)}
                      </span>
                    </div>

                    {/* Valor */}
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="font-medium">
                        {formatarValor(licitacao)}
                      </span>
                    </div>
                  </div>

                  {/* Rodapé do card */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 truncate">
                        {licitacao.pncp_id}
                      </span>
                      <button className="text-orange-500 hover:text-orange-600 text-sm font-medium">
                        Ver detalhes →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sem resultados */}
        {results.length === 0 && !loading && !error && (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma licitação encontrada
            </h3>
            <p className="text-gray-500">
              Digite palavras-chave e clique em "Buscar" para encontrar licitações.
            </p>
          </div>
        )}
      </div>

      {/* Modal de detalhes */}
      <LicitacaoModal
        selectedLicitacao={selectedLicitacao}
        modalLoading={modalLoading}
        onClose={() => setSelectedLicitacao(null)}
        showAnaliseButton={true}
      />
    </div>
  );
};

export default SearchPage; 
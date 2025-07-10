import React, { useState, useMemo } from 'react';
import { Search, Filter, MapPin, Calendar, DollarSign, FileText, Eye, ChevronDown, Loader2, X } from 'lucide-react';
import Select, { MultiValue, SingleValue } from 'react-select';
import { config } from '../config/environment';
import LicitacaoModal from '../components/LicitacaoModal';
import { Licitacao } from '../types/licitacao';
import { useAuthHeaders } from '../hooks/useAuth';
import { estadosBrasil, getCidadesByEstado } from '../data/estadosCidades';

interface FilterOptions {
  estados: string[];
  cidades: string[];
  modalidades: string[];
  valor_minimo?: number;
  valor_maximo?: number;
}

interface ExtendedLicitacao extends Licitacao {
  source?: 'local' | 'pncp';
  source_label?: string;
  provider_name?: string; // 🆕 identifica o provider (pncp | comprasnet)
  is_proposal_open?: boolean; // 🆕 indica se a licitação está aberta para propostas
  status_calculado?: string; // 🆕 status calculado (Ativa/Fechada)
}

interface OptionType {
  value: string;
  label: string;
}

const SearchPage: React.FC = () => {
  const { getHeaders } = useAuthHeaders();
  
  // Estados principais
  const [results, setResults] = useState<ExtendedLicitacao[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keywords, setKeywords] = useState('');
  
  // Estados do modal
  const [selectedLicitacao, setSelectedLicitacao] = useState<ExtendedLicitacao | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Estados dos filtros
  const [filters, setFilters] = useState<FilterOptions>({
    estados: [],
    cidades: [],
    modalidades: [],
    valor_minimo: undefined,
    valor_maximo: undefined
  });

  // Preparar opções para os selects
  const estadoOptions: OptionType[] = estadosBrasil.map(estado => ({
    value: estado.sigla,
    label: `${estado.nome} (${estado.sigla})`
  }));

  const modalidadeOptions: OptionType[] = [
    { value: 'pregao_eletronico', label: 'Pregão Eletrônico' },
    { value: 'concorrencia', label: 'Concorrência' },
    { value: 'convite', label: 'Convite' },
    { value: 'tomada_precos', label: 'Tomada de Preços' },
    { value: 'dispensa', label: 'Dispensa' },
    { value: 'inexigibilidade', label: 'Inexigibilidade' }
  ];

  // Opções de cidades baseadas nos estados selecionados
  const cidadeOptions: OptionType[] = useMemo(() => {
    if (filters.estados.length === 0) return [];
    
    const cidadesDisponiveis: Set<string> = new Set();
    filters.estados.forEach(estadoSigla => {
      const cidades = getCidadesByEstado(estadoSigla);
      console.log(`🏙️ Estado ${estadoSigla}: ${cidades.length} cidades`, cidades);
      cidades.forEach(cidade => cidadesDisponiveis.add(cidade));
    });
    
    const cidadesArray = Array.from(cidadesDisponiveis).sort();
    console.log(`🎯 Total de cidades únicas de ${filters.estados.length} estados: ${cidadesArray.length}`, cidadesArray);
    
    return cidadesArray.map(cidade => ({
      value: cidade,
      label: cidade
    }));
  }, [filters.estados]);

  // Função de busca usando a nova API unificada
  const handleSearch = async () => {
    if (!keywords.trim()) {
      setError('Digite palavras-chave para buscar');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 🆕 NOVA IMPLEMENTAÇÃO: Usar rota unificada /api/search/unified
      console.log('🔍 Usando nova rota unificada para busca');

      // Construir parâmetros da query string para a nova API
      const searchParams = new URLSearchParams();
      
      // Adicionar keywords
      searchParams.append('keywords', keywords.trim());
      
      // Adicionar filtros se existirem
      if (filters.estados.length > 0) {
        // Para múltiplos estados, usar o primeiro (ou você pode adaptar a API para aceitar múltiplos)
        searchParams.append('region_code', filters.estados[0]);
      }
      
      if (filters.valor_minimo !== undefined && filters.valor_minimo > 0) {
        searchParams.append('min_value', filters.valor_minimo.toString());
      }
      
      if (filters.valor_maximo !== undefined && filters.valor_maximo > 0) {
        searchParams.append('max_value', filters.valor_maximo.toString());
      }

      // Paginação (usando valores padrão adequados)
      searchParams.append('page', '1');
      searchParams.append('page_size', '50');
      searchParams.append('sort_order', 'desc');

      const unifiedUrl = `${config.API_BASE_URL}/search/unified?${searchParams.toString()}`;
      console.log('🔍 URL da busca unificada:', unifiedUrl);

      const response = await fetch(unifiedUrl, {
        method: 'GET',
        headers: {
          ...getHeaders(), // Manter headers de autenticação
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      console.log('🔍 Resposta da API unificada:', data);

      if (response.ok && data.success) {
        const unifiedData = data.data;
        const opportunities = unifiedData.opportunities || [];
        
        console.log('📋 Oportunidades encontradas:', opportunities);
        
        // Mapear os resultados da API unificada para o formato esperado pelo frontend
        const licitacoesFormatadas = opportunities.map((opportunity: any) => ({
          // IDs e identificadores
          id: opportunity.external_id || opportunity.id,
          pncp_id: opportunity.external_id,
          numero_controle_pncp: opportunity.external_id,
          
          // Campos principais
          objeto_compra: opportunity.title || opportunity.objeto_compra,
          modalidade_nome: opportunity.provider_specific_data?.modalidadeNome || 'Pregão Eletrônico',
          situacao_compra_nome: opportunity.provider_specific_data?.situacaoCompraNome || 'Aberta',
          
          // Datas - 🆕 Formato atualizado para ComprasNet
          data_publicacao: opportunity.publication_date,
          data_publicacao_pncp: opportunity.publication_date,
          data_abertura_proposta: opportunity.opening_date || opportunity.provider_specific_data?.dataAberturaProposta,
          data_encerramento_proposta: opportunity.submission_deadline || opportunity.provider_specific_data?.dataEncerramentoProposta,
          
          // Valor
          valor_total_estimado: opportunity.estimated_value,
          valor_display: opportunity.estimated_value,
          
          // Localização
          uf: opportunity.region_code,
          uf_nome: opportunity.provider_specific_data?.ufNome || opportunity.region_code,
          municipio_nome: opportunity.municipality,
          
          // Órgão/entidade - 🆕 Formato atualizado para ComprasNet
          razao_social: opportunity.procuring_entity_name,
          nome_unidade: opportunity.procuring_entity_name, // Agora usando o nome extraído corretamente
          orgao_entidade: {
            razaoSocial: opportunity.procuring_entity_name,
            cnpj: opportunity.procuring_entity_id
          },
          unidade_orgao: {
            nomeUnidade: opportunity.procuring_entity_name,
            municipioNome: opportunity.municipality,
            ufSigla: opportunity.region_code,
            ufNome: opportunity.provider_specific_data?.ufNome || opportunity.region_code
          },
          
          // Outros campos
          processo: opportunity.provider_specific_data?.processo || '',
          informacao_complementar: opportunity.description,
          link_sistema_origem: opportunity.provider_specific_data?.linkSistemaOrigem,
          
          // Campos específicos do novo sistema
          provider_name: opportunity.provider_name || 'pncp',
          source: opportunity.provider_name || 'pncp',
          source_label: opportunity.provider_name?.toUpperCase() || 'PNCP',
          
          // Status calculado
          status_calculado: opportunity.is_proposal_open ? 'Ativa' : 'Fechada',
          is_proposal_open: opportunity.is_proposal_open
        }));
        
        console.log('📋 DADOS FORMATADOS PARA FRONTEND:', licitacoesFormatadas);
        setResults(licitacoesFormatadas);
        
        // Log dos resultados para debug
        console.log(`📊 Resultados: ${unifiedData.total} licitações encontradas via busca unificada`);
        console.log(`🔍 Provedores utilizados: ${Object.keys(data.data.filters_applied || {}).join(', ')}`);
        
      } else {
        // Fallback para API antiga em caso de erro
        console.warn('⚠️ API unificada falhou, tentando fallback para API antiga');
        await handleSearchFallback();
      }
    } catch (err) {
      console.error('❌ Erro na busca unificada:', err);
      console.warn('🔄 Tentando fallback para API antiga');
      await handleSearchFallback();
    } finally {
      setLoading(false);
    }
  };

  // Função de fallback para a API antiga (mantém compatibilidade)
  const handleSearchFallback = async () => {
    try {
      console.log('🔄 Executando busca com API antiga como fallback');
      
      const requestBody: any = {
        palavra_chave: keywords,
        usar_sinonimos: true,
        threshold_relevancia: 0.2,
        pagina: 1,
        itens_por_pagina: 50,
      };

      // Adicionar filtros se existirem
      if (filters.estados.length > 0) {
        requestBody.estados = filters.estados;
      }
      
      if (filters.cidades.length > 0) {
        requestBody.cidades = filters.cidades;
      }
      
      if (filters.modalidades.length > 0) {
        requestBody.modalidades = filters.modalidades;
      }
      
      if (filters.valor_minimo !== undefined && filters.valor_minimo > 0) {
        requestBody.valor_minimo = filters.valor_minimo;
      }
      
      if (filters.valor_maximo !== undefined && filters.valor_maximo > 0) {
        requestBody.valor_maximo = filters.valor_maximo;
      }

      const response = await fetch(`${config.API_BASE_URL}/licitacoes/buscar`, {
        method: 'POST',
        headers: {
          ...getHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Processar resposta da API antiga (código original)
        let metadados: any;
        let licitacoesRaw: any[];

        if (data.data?.metadados) {
          metadados = data.data.metadados;
          licitacoesRaw = data.data.data || [];
        } else if (data.data && data.data.total !== undefined) {
          metadados = {
            totalRegistros: data.data.total,
            totalPaginas: data.data.total_paginas || 1,
            pagina: data.data.pagina_atual || 1,
            estrategia_busca: data.data.estrategia_aplicada || {}
          };
          licitacoesRaw = data.data.licitacoes || [];
        } else {
          setError('Formato de resposta inesperado na API antiga');
          return;
        }
        
        // Mapear os resultados para o formato esperado (código original)
        const licitacoesFormatadas = licitacoesRaw.map((lic: any) => ({
          ...lic,
          id: lic.numeroControlePNCP || lic.id,
          pncp_id: lic.numeroControlePNCP,
          numero_controle_pncp: lic.numeroControlePNCP,
          
          objeto_compra: lic.objetoCompra || lic.objeto_compra,
          modalidade_nome: lic.modalidadeNome || lic.modalidade_nome,
          situacao_compra_nome: lic.situacaoCompraNome || lic.situacao_compra_nome,
          
          data_publicacao_pncp: lic.dataPublicacaoPncp || lic.data_publicacao_pncp,
          data_publicacao: lic.dataPublicacaoPncp || lic.data_publicacao,
          data_abertura_proposta: lic.dataAberturaProposta || lic.data_abertura_proposta,
          data_encerramento_proposta: lic.dataEncerramentoProposta || lic.data_encerramento_proposta,
          
          valor_total_estimado: lic.valorTotalEstimado || lic.valor_total_estimado,
          
          orgao_entidade: lic.orgaoEntidade || lic.orgao_entidade,
          unidade_orgao: lic.unidadeOrgao || lic.unidade_orgao,
          
          razao_social: lic.orgaoEntidade?.razaoSocial || lic.razao_social,
          nome_unidade: lic.unidadeOrgao?.nomeUnidade || lic.nome_unidade,
          municipio_nome: lic.unidadeOrgao?.municipioNome || lic.municipio_nome,
          uf: lic.unidadeOrgao?.ufSigla || lic.uf || lic.unidadeOrgao?.uf,
          uf_nome: lic.unidadeOrgao?.ufNome || lic.uf_nome,
          codigo_ibge: lic.unidadeOrgao?.codigoIbge || lic.codigo_ibge,
          
          processo: lic.processo,
          informacao_complementar: lic.informacaoComplementar || lic.informacao_complementar,
          link_sistema_origem: lic.linkSistemaOrigem || lic.link_sistema_origem,
          
          source: 'pncp',
          source_label: 'PNCP (Fallback)'
        }));
        
        setResults(licitacoesFormatadas);
        console.log(`📊 Fallback concluído: ${metadados.totalRegistros} licitações encontradas`);
        
      } else {
        setError(data.message || 'Erro na busca (fallback)');
      }
    } catch (fallbackErr) {
      console.error('❌ Erro também no fallback:', fallbackErr);
      setError('Erro ao conectar com a API (todas as tentativas falharam)');
    }
  };

  // Função para determinar status baseado na data
  const getStatusLicitacao = (licitacao: ExtendedLicitacao) => {
    // Determinar a cor do badge baseado no provider
    const providerColors = {
      comprasnet: 'bg-green-100 text-green-800',
      pncp: 'bg-blue-100 text-blue-800'
    };
    
    // Determinar a cor do status
    const statusColor = licitacao.is_proposal_open ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800';
    
    return (
      <div className="flex gap-2 items-center">
        {/* Badge do Provider */}
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${providerColors[licitacao.provider_name as keyof typeof providerColors] || providerColors.pncp}`}>
          {licitacao.source_label}
        </span>
        
        {/* Badge do Status */}
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
          {licitacao.status_calculado}
        </span>
      </div>
    );
  };

  // Função para formatar valor
  const formatarValor = (licitacao: ExtendedLicitacao) => {
    // Tenta diferentes campos de valor
    const valor = licitacao.valor_display || 
                 licitacao.valor_total_estimado;
    
    if (valor === 'Sigiloso' || valor === undefined || valor === null || valor === 0) {
        return 'Sigiloso';
      }
    
    if (typeof valor === 'number') {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
      }).format(valor);
    }
    
    return 'Sigiloso';
  };

  // Função para formatar data
  const formatarData = (data: string | null) => {
    if (!data) return 'Não informado';
    try {
      const date = new Date(data);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'Data inválida';
    }
  };

  // Abrir modal com detalhes
  const abrirModal = async (licitacao: ExtendedLicitacao) => {
    setSelectedLicitacao(licitacao);
    setModalLoading(true);

    try {
        if (!licitacao.pncp_id) {
            console.warn("Licitação sem PNCP ID, não é possível buscar detalhes.", licitacao);
            setSelectedLicitacao(licitacao);
            setModalLoading(false);
            return;
        }

        const response = await fetch(`${config.API_BASE_URL}/bids/pncp/${licitacao.pncp_id}`, {
            method: 'GET',
            headers: getHeaders()
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                const licitacaoCompleta = data.data;
                console.log('🔍 Dados completos da licitação (do backend):', licitacaoCompleta);
                setSelectedLicitacao(licitacaoCompleta);
            } else {
                console.warn(`Não foi possível buscar detalhes para ${licitacao.pncp_id}:`, data.message);
                setSelectedLicitacao(licitacao); // Mantém os dados da busca se a busca detalhada falhar
            }
        } else {
             console.error(`Erro HTTP ${response.status} ao buscar detalhes para ${licitacao.pncp_id}`);
             setSelectedLicitacao(licitacao); // Mantém os dados da busca
        }
    } catch (err) {
        console.error('Erro de rede ao buscar detalhes:', err);
        setSelectedLicitacao(licitacao); // Mantém os dados da busca em caso de erro de rede
    } finally {
        setModalLoading(false);
    }
  };

  // Handlers para os filtros
  const handleEstadoChange = (selected: MultiValue<OptionType>) => {
    const novoEstados = selected.map(option => option.value);
    setFilters(prev => ({
      ...prev,
      estados: novoEstados,
      cidades: [] // Limpar cidades quando estados mudarem
    }));
  };

  const handleCidadeChange = (selected: MultiValue<OptionType>) => {
    setFilters(prev => ({
      ...prev,
      cidades: selected.map(option => option.value)
    }));
  };

  const handleModalidadeChange = (selected: MultiValue<OptionType>) => {
    setFilters(prev => ({
      ...prev,
      modalidades: selected.map(option => option.value)
    }));
  };

  // Limpar filtros
  const clearFilters = () => {
    setFilters({
      estados: [],
      cidades: [],
      modalidades: [],
      valor_minimo: undefined,
      valor_maximo: undefined
    });
  };

  // Contar filtros ativos
  const filtrosAtivos = filters.estados.length + filters.cidades.length + filters.modalidades.length + 
    (filters.valor_minimo ? 1 : 0) + (filters.valor_maximo ? 1 : 0);

  // Estilo customizado para react-select
  const selectStyles = {
    control: (base: any) => ({
      ...base,
      borderRadius: '0.5rem',
      borderColor: '#d1d5db',
      '&:hover': {
        borderColor: '#f97316'
      },
      '&:focus-within': {
        borderColor: '#f97316',
        boxShadow: '0 0 0 3px rgb(249 115 22 / 0.1)'
      }
    }),
    multiValue: (base: any) => ({
      ...base,
      backgroundColor: '#fed7aa',
      borderRadius: '0.375rem'
    }),
    multiValueLabel: (base: any) => ({
      ...base,
      color: '#9a3412'
    }),
    multiValueRemove: (base: any) => ({
      ...base,
      color: '#9a3412',
      '&:hover': {
        backgroundColor: '#f97316',
        color: 'white'
      }
    })
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Buscando licitações no PNCP...</p>
          <p className="mt-2 text-sm text-gray-500">Isso pode demorar alguns segundos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Busca Inteligente de Licitações
              </h1>
            <p className="text-lg text-gray-600">
              Portal Nacional de Contratações Públicas (PNCP)
            </p>
            {results.length > 0 && (
              <p className="text-sm text-gray-500 mt-2">
                {results.length} licitações abertas encontradas
              </p>
            )}
            </div>

          {/* Barra de busca principal */}
          <div className="max-w-4xl mx-auto mb-6">
            <div className="relative">
              <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400 h-6 w-6" />
                  <input
                    type="text"
                placeholder="Digite palavras-chave: notebooks, consultoria, desenvolvimento de software, medicamentos..."
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                className="w-full pl-16 pr-32 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 shadow-sm"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                <button
                onClick={handleSearch}
                  disabled={loading || !keywords.trim()}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2 px-6 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Search className="h-5 w-5" />
                  )}
                  {loading ? 'Buscando...' : 'Buscar'}
                </button>
            </div>
              </div>
              
          {/* Controles de filtros */}
          <div className="flex justify-center">
              <button
                onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                <Filter className="h-5 w-5" />
              Filtros Avançados
              {filtrosAtivos > 0 && (
                <span className="bg-orange-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                  {filtrosAtivos}
                </span>
              )}
                <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
          </div>

          {/* Painel de filtros */}
          {showFilters && (
            <div className="mt-8 max-w-6xl mx-auto">
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Filtro de Estados */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Estados
                    </label>
                    <Select
                      isMulti
                      options={estadoOptions}
                      value={estadoOptions.filter(option => filters.estados.includes(option.value))}
                      onChange={handleEstadoChange}
                      placeholder="Selecione os estados..."
                      styles={selectStyles}
                      noOptionsMessage={() => "Nenhum estado encontrado"}
                    />
                  </div>

                  {/* Filtro de Cidades */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Cidades
                    </label>
                    <Select
                      isMulti
                      options={cidadeOptions}
                      value={cidadeOptions.filter(option => filters.cidades.includes(option.value))}
                      onChange={handleCidadeChange}
                      placeholder={filters.estados.length === 0 ? "Primeiro selecione os estados" : "Selecione as cidades..."}
                      isDisabled={filters.estados.length === 0}
                      styles={selectStyles}
                      noOptionsMessage={() => "Nenhuma cidade encontrada"}
                    />
                </div>

                  {/* Filtro de Modalidades */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Modalidades
                    </label>
                    <Select
                      isMulti
                      options={modalidadeOptions}
                      value={modalidadeOptions.filter(option => filters.modalidades.includes(option.value))}
                      onChange={handleModalidadeChange}
                      placeholder="Selecione as modalidades..."
                      styles={selectStyles}
                      noOptionsMessage={() => "Nenhuma modalidade encontrada"}
                    />
                </div>

                  {/* Valor Mínimo */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Valor Mínimo (R$)
                    </label>
                  <input
                    type="number"
                      placeholder="Ex: 10000"
                      value={filters.valor_minimo || ''}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        valor_minimo: e.target.value ? parseFloat(e.target.value) : undefined
                      }))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  />
                </div>

                  {/* Valor Máximo */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Valor Máximo (R$)
                    </label>
                  <input
                    type="number"
                      placeholder="Ex: 1000000"
                      value={filters.valor_maximo || ''}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        valor_maximo: e.target.value ? parseFloat(e.target.value) : undefined
                      }))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>

                {/* Ações dos filtros */}
                <div className="mt-6 flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    {filtrosAtivos > 0 && (
                      <span>{filtrosAtivos} filtro{filtrosAtivos > 1 ? 's' : ''} ativo{filtrosAtivos > 1 ? 's' : ''}</span>
                    )}
                  </div>
                  <div className="flex gap-3">
                <button
                  onClick={clearFilters}
                      className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                      <X className="h-4 w-4" />
                  Limpar Filtros
                </button>
                    <button
                      onClick={handleSearch}
                      disabled={!keywords.trim()}
                      className="flex items-center gap-2 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Search className="h-4 w-4" />
                      Aplicar Filtros
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Erro */}
          {error && (
            <div className="mt-6 max-w-4xl mx-auto p-4 bg-red-50 border border-red-200 rounded-xl">
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
            // 🐞 DEBUG: Log para verificar provider_name
            console.log(`🔍 Licitação ID: ${licitacao.id}, Provider: ${licitacao.provider_name}`, licitacao);
            
            // Usar status string para lógica de cor
            const statusString = licitacao.status_calculado || licitacao.status || '';
            const isAtiva = statusString === 'Ativa' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
            const providerColor = licitacao.provider_name === 'comprasnet'
              ? 'bg-green-100 text-green-800'
              : 'bg-blue-100 text-blue-800';
            
            return (
              <div
                key={licitacao.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer border border-gray-100 hover:border-orange-200"
                onClick={() => abrirModal(licitacao)}
              >
                <div className="p-6">
                  {/* Status badges */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-2">
                      {/* Badge do Provider */}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${providerColor}`}>
                        {licitacao.source_label}
                      </span>
                      {/* Badge do Status */}
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${isAtiva}`}>
                        {statusString}
                      </span>
                    </div>
                    <Eye className="h-5 w-5 text-gray-400" />
                  </div>

                  {/* Título (objeto) */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 line-clamp-3 leading-tight">
                    {licitacao.objeto_compra}
                  </h3>

                  {/* Informações principais */}
                  <div className="space-y-3">
                    {/* UF e Município */}
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                      <span className="truncate">
                        {licitacao.unidade_orgao?.municipio_nome || licitacao.municipio_nome || 'Não informado'} 
                        {(licitacao.uf || licitacao.unidade_orgao?.uf) && ` - ${licitacao.uf || licitacao.unidade_orgao?.uf}`}
                      </span>
                    </div>

                    {/* Datas */}
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <div className="flex flex-col">
                        <span className="text-sm">
                          Abertura: {formatarData(licitacao.data_abertura_proposta)}
                        </span>
                        <span className="text-sm">
                          Encerramento: {formatarData(licitacao.data_encerramento_proposta)}
                        </span>
                      </div>
                    </div>

                    {/* Valor */}
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                      <span className="font-semibold">
                        {formatarValor(licitacao)}
                      </span>
                    </div>
                  </div>

                  {/* Rodapé do card */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 truncate font-mono">
                        {licitacao.pncp_id || licitacao.numero_controle_pncp}
                      </span>
                      <button className="text-orange-500 hover:text-orange-600 text-sm font-semibold">
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
          <div className="text-center py-16">
            <FileText className="h-20 w-20 text-gray-300 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Nenhuma licitação encontrada
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Digite palavras-chave relacionadas ao que você procura e use os filtros para refinar sua busca no Portal Nacional de Contratações Públicas.
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
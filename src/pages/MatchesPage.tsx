import React, { useState, useEffect } from 'react';
import { Building, FileText, Eye, MapPin, DollarSign, ArrowLeft, Users, Award, Target } from 'lucide-react';
import { config } from '../config/environment';
import LicitacaoModal from '../components/LicitacaoModal';
import ProcessStatusWidget from '../components/ProcessStatusWidget';
import { Licitacao } from '../types/licitacao';
import { useAuthHeaders } from '../hooks/useAuth';

interface EmpresaMatch {
  empresa_id: string;
  empresa_nome: string;
  razao_social: string;
  cnpj: string;
  setor_atuacao: string;
  total_matches: number;
  score_medio: string;
  melhor_score: string;
  pior_score: string;
}

interface Match {
  id: string;
  score_similaridade: string;
  match_type: string;
  justificativa_match: string;
  data_match: string;
  // Dados da licitação no match
  licitacao_id: string;
  licitacao_pncp_id?: string; // O PNCP ID pode estar em um campo separado
  licitacao_objeto: string;
  licitacao_uf: string | null;
  licitacao_valor: string;
  licitacao_data_publicacao: string | null;
  licitacao_modalidade: string | null;
  licitacao_status?: string;
}

const MatchesPage: React.FC = () => {
  // 🔐 Hook de autenticação
  const { getHeaders, hasValidToken } = useAuthHeaders();
  
  const [empresas, setEmpresas] = useState<EmpresaMatch[]>([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState<EmpresaMatch | null>(null);
  const [matchesEmpresa, setMatchesEmpresa] = useState<Match[]>([]);
  const [selectedLicitacao, setSelectedLicitacao] = useState<Licitacao | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Callback para quando um processo é concluído
  const handleProcessComplete = (type: 'search' | 'reevaluate') => {
    console.log(`Processo ${type} concluído, recarregando dados...`);
    // Recarregar dados após 2 segundos
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  // Carregar empresas com matches
  useEffect(() => {
    const fetchEmpresas = async () => {
      try {
        setLoading(true);
        
        // Verificar se tem token válido
        if (!hasValidToken) {
          setError('Usuário não autenticado');
          return;
        }
        
        console.log('🔗 [MATCHES] Requisição para:', `${config.API_BASE_URL}/matches/by-company`);
        const response = await fetch(`${config.API_BASE_URL}/matches/by-company`, {
          headers: getHeaders(),
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          setEmpresas(data.data);
          console.log(`✅ ${data.data.length} empresas com matches carregadas (multi-tenant)`);
        } else {
          setError(data.message || 'Erro ao carregar empresas');
        }
      } catch (err) {
        setError('Erro ao conectar com a API');
        console.error('Erro:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmpresas();
  }, [hasValidToken, getHeaders]);

  // Função para buscar matches de uma empresa específica
  const buscarMatchesEmpresa = async (empresa: EmpresaMatch) => {
    try {
      setSelectedEmpresa(empresa);
      setLoading(true);
      
      // Verificar se tem token válido
      if (!hasValidToken) {
        setError('Usuário não autenticado');
        return;
      }
      
      // Usar rota específica da empresa (multi-tenant) - SEM LIMITE
      const url = `${config.API_BASE_URL}/matches/company/${empresa.empresa_id}?limit=1000`;
      console.log('🔗 [MATCHES] Requisição para:', url);
      const response = await fetch(url, {
        headers: getHeaders(),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Dados já vêm filtrados pela empresa do usuário
        setMatchesEmpresa(data.data);
        console.log(`✅ ${data.data.length} matches da empresa ${empresa.empresa_nome} carregados (multi-tenant)`);
      } else {
        if (response.status === 404) {
          setError('Empresa não encontrada ou não pertence ao usuário');
        } else {
          setError(data.message || 'Erro ao carregar matches');
        }
      }
    } catch (err) {
      setError('Erro ao conectar com a API');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  // Voltar para a lista de empresas
  const voltarParaEmpresas = () => {
    setSelectedEmpresa(null);
    setMatchesEmpresa([]);
  };

  // Funções auxiliares necessárias para a página
  const formatarValorNumerico = (valor: number) => {
    if (!valor || valor === 0) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarData = (data: string | null) => {
    if (!data) return 'Não informado';
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const formatarScore = (score: string) => {
    return `${(parseFloat(score) * 100).toFixed(1)}%`;
  };

  const getScoreColor = (score: string) => {
    const numScore = parseFloat(score) * 100;
    if (numScore >= 80) return 'text-green-600 bg-green-50';
    if (numScore >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getMatchTypeLabel = (type: string) => {
    const tipos = {
      'objeto_completo': 'Objeto Completo',
      'item_especifico': 'Item Específico',
      'objeto_e_itens': 'Objeto + Itens'
    };
    return tipos[type as keyof typeof tipos] || type;
  };

  // Abrir modal com detalhes da licitação (seguindo padrão do SearchPage)
  const abrirModal = async (match: Match) => {
    // 🆕 ATUALIZAÇÃO: Usar nova API unificada com fallback para API antiga
    setModalLoading(true);

    try {
      const pncp_id = match.licitacao_pncp_id || match.licitacao_id;
      console.log('🔍 [MatchesPage] Buscando detalhes para pncp_id:', pncp_id);
      console.log('🔍 [MatchesPage] match completo:', match);
      
      // 🆕 PRIMEIRA TENTATIVA: Usar nova API unificada para buscar detalhes
      try {
        console.log('🔍 [MatchesPage] Tentando busca via API unificada');
        
        // Construir URL da busca unificada com keywords baseadas no objeto da licitação
        const searchParams = new URLSearchParams();
        searchParams.append('keywords', match.licitacao_objeto);
        searchParams.append('page_size', '1');
        
        if (match.licitacao_uf) {
          searchParams.append('region_code', match.licitacao_uf);
        }

        const unifiedUrl = `${config.API_BASE_URL}/search/unified?${searchParams.toString()}`;
        console.log('🔍 [MatchesPage] URL da busca unificada:', unifiedUrl);

        const unifiedResponse = await fetch(unifiedUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (unifiedResponse.ok) {
          const unifiedData = await unifiedResponse.json();
          
          if (unifiedData.success && unifiedData.data?.opportunities?.length > 0) {
            // Encontrar a oportunidade correspondente pelo PNCP ID
            const matchingOpportunity = unifiedData.data.opportunities.find(
              (opp: any) => opp.external_id === pncp_id || opp.id === pncp_id
            );
            
            if (matchingOpportunity) {
              console.log('✅ [MatchesPage] Detalhes encontrados via API unificada');
              
              // Mapear dados da API unificada para o formato esperado
              const licitacaoDetalhada: Licitacao = {
                id: matchingOpportunity.external_id || pncp_id,
                pncp_id: matchingOpportunity.external_id || pncp_id,
                numero_controle_pncp: matchingOpportunity.external_id || pncp_id,
                
                // Campos principais
                objeto_compra: matchingOpportunity.title || match.licitacao_objeto,
                modalidade_nome: matchingOpportunity.provider_specific_data?.modalidadeNome || match.licitacao_modalidade || 'Pregão Eletrônico',
                situacao_compra_nome: matchingOpportunity.provider_specific_data?.situacaoCompraNome || 'Aberta',
                
                // Datas
                data_publicacao: matchingOpportunity.publication_date || match.licitacao_data_publicacao,
                data_abertura_proposta: matchingOpportunity.provider_specific_data?.dataAberturaProposta,
                data_encerramento_proposta: matchingOpportunity.submission_deadline,
                
                // Valor
                valor_total_estimado: matchingOpportunity.estimated_value || parseFloat(match.licitacao_valor) || 0,
                
                // Localização
                uf: matchingOpportunity.region_code || match.licitacao_uf || '',
                uf_nome: matchingOpportunity.provider_specific_data?.ufNome || match.licitacao_uf || '',
                municipio_nome: matchingOpportunity.municipality || 'Não informado',
                
                // Órgão/entidade
                razao_social: matchingOpportunity.procuring_entity_name || 'Não informado',
                nome_unidade: matchingOpportunity.provider_specific_data?.nomeUnidade || matchingOpportunity.procuring_entity_name || 'Não informado',
                
                // Objetos estruturados
                orgao_entidade: {
                  razaoSocial: matchingOpportunity.procuring_entity_name || 'Não informado',
                  cnpj: matchingOpportunity.procuring_entity_id || ''
                },
                unidade_orgao: {
                  nomeUnidade: matchingOpportunity.provider_specific_data?.nomeUnidade || matchingOpportunity.procuring_entity_name || 'Não informado',
                  municipioNome: matchingOpportunity.municipality || 'Não informado',
                  ufSigla: matchingOpportunity.region_code || match.licitacao_uf || '',
                  ufNome: matchingOpportunity.provider_specific_data?.ufNome || match.licitacao_uf || ''
                },
                
                // Outros campos
                processo: matchingOpportunity.provider_specific_data?.processo || '',
                informacao_complementar: matchingOpportunity.description || 'Dados obtidos via busca unificada.',
                status: matchingOpportunity.is_proposal_open ? 'Ativa' : 'Fechada',
                itens: []
              };
              
              setSelectedLicitacao(licitacaoDetalhada);
              return; // Sucesso, sair da função
            }
          }
        }
        
        console.warn('⚠️ [MatchesPage] API unificada não encontrou correspondência, tentando API antiga');
      } catch (unifiedError) {
        console.warn('⚠️ [MatchesPage] Erro na API unificada, tentando API antiga:', unifiedError);
      }
      
      // 🔄 FALLBACK: Usar API antiga se a unificada falhar
      console.log('🔍 [MatchesPage] Tentando busca via API antiga');
      
      const response = await fetch(`${config.API_BASE_URL}/bids/detail?pncp_id=${encodeURIComponent(pncp_id)}`);
      
      if (!response.ok) {
        throw new Error('Falha ao carregar detalhes da licitação');
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        console.log('✅ [MatchesPage] Dados completos da API antiga:', data.data);
        console.log('🏢 [MatchesPage] Campos de órgão recebidos:');
        console.log('  razao_social:', data.data.razao_social);
        console.log('  nome_unidade:', data.data.nome_unidade);
        console.log('  municipio_nome:', data.data.municipio_nome);
        console.log('  uf_nome:', data.data.uf_nome);
        setSelectedLicitacao(data.data);
      } else {
        // Fallback para objeto básico se todas as APIs falharem
        console.warn('⚠️ [MatchesPage] Todas as APIs falharam, usando dados básicos do match');
        const licitacaoBasica: Licitacao = {
          id: match.licitacao_id,
          pncp_id: pncp_id,
          objeto_compra: match.licitacao_objeto,
          uf: match.licitacao_uf || '',
          data_abertura_proposta: null,
          data_encerramento_proposta: null,
          valor_total_estimado: parseFloat(match.licitacao_valor) || 0,
          status: match.licitacao_status || 'Ativa',
          data_publicacao: match.licitacao_data_publicacao,
          modalidade_nome: match.licitacao_modalidade || '',
          situacao_compra_nome: '',
          processo: '',
          orgao_entidade: null,
          unidade_orgao: null,
          informacao_complementar: 'Dados básicos da licitação obtidos através do match.',
          itens: [],
          razao_social: 'Não informado',
          nome_unidade: 'Não informado',
          municipio_nome: 'Não informado',
          uf_nome: 'Não informado'
        };
        setSelectedLicitacao(licitacaoBasica);
      }
    } catch (error) {
      console.error('❌ [MatchesPage] Erro ao buscar detalhes:', error);
      // Em caso de erro total, usar dados básicos do match
      const pncp_id = match.licitacao_pncp_id || match.licitacao_id;
      const licitacaoBasica: Licitacao = {
        id: match.licitacao_id,
        pncp_id: pncp_id,
        objeto_compra: match.licitacao_objeto,
        uf: match.licitacao_uf || '',
        data_abertura_proposta: null,
        data_encerramento_proposta: null,
        valor_total_estimado: parseFloat(match.licitacao_valor) || 0,
        status: match.licitacao_status || 'Ativa',
        data_publicacao: match.licitacao_data_publicacao,
        modalidade_nome: match.licitacao_modalidade || '',
        situacao_compra_nome: '',
        processo: '',
        orgao_entidade: null,
        unidade_orgao: null,
        informacao_complementar: 'Dados básicos da licitação obtidos através do match (modo offline).',
        itens: [],
        razao_social: 'Não informado',
        nome_unidade: 'Não informado',
        municipio_nome: 'Não informado',
        uf_nome: 'Não informado'
      };
      setSelectedLicitacao(licitacaoBasica);
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando matches...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erro ao carregar</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

      return (
      <div className="min-h-screen bg-gray-50">`

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {selectedEmpresa && (
                <button
                  onClick={voltarParaEmpresas}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                  Voltar
                </button>
              )}
              
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {selectedEmpresa 
                    ? `Matches para ${selectedEmpresa.empresa_nome}`
                    : 'Matches por Empresa'
                  }
                </h1>
                <p className="text-gray-600 mt-1">
                  {selectedEmpresa 
                    ? `${matchesEmpresa.length} licitações encontradas`
                    : `${empresas.length} empresas com matches`
                  }
                </p>
              </div>
            </div>

            {/* Status Score (apenas quando empresa selecionada) */}
            {selectedEmpresa && (
              <div className="text-right">
                <div className="text-sm text-gray-500">Score médio</div>
                <div className={`text-2xl font-bold ${getScoreColor(selectedEmpresa.score_medio)}`}>
                  {formatarScore(selectedEmpresa.score_medio)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!selectedEmpresa ? (
          // Grid de empresas
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {empresas.map((empresa) => (
              <div
                key={empresa.empresa_id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
                onClick={() => buscarMatchesEmpresa(empresa)}
              >
                <div className="p-6">
                  {/* Header do card */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-orange-100 p-2 rounded-lg">
                        <Building className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {empresa.empresa_nome}
                        </h3>
                        <p className="text-sm text-gray-500">{empresa.razao_social}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(empresa.score_medio)}`}>
                      {formatarScore(empresa.score_medio)}
                    </span>
                  </div>

                  {/* Informações da empresa */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Target className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{empresa.setor_atuacao}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2 text-gray-400" />
                      <span>CNPJ: {empresa.cnpj}</span>
                    </div>
                  </div>

                  {/* Estatísticas */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {empresa.total_matches}
                      </div>
                      <div className="text-xs text-gray-500">Matches</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {formatarScore(empresa.melhor_score)}
                      </div>
                      <div className="text-xs text-gray-500">Melhor Score</div>
                    </div>
                  </div>

                  {/* Rodapé */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button className="w-full text-orange-500 hover:text-orange-600 text-sm font-medium">
                      Ver matches →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Grid de licitações da empresa selecionada
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matchesEmpresa.map((match) => {
              return (
                <div
                  key={match.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
                  onClick={() => abrirModal(match)}
                >
                  <div className="p-6">
                    {/* Header com status e score */}
                    <div className="flex justify-between items-start mb-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(match.score_similaridade)}`}>
                        Match: {formatarScore(match.score_similaridade)}
                      </span>
                      <Eye className="h-5 w-5 text-gray-400" />
                    </div>

                    {/* Título (objeto) */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">
                      {match.licitacao_objeto}
                    </h3>

                    {/* Informações principais */}
                    <div className="space-y-2 mb-4">
                      {/* UF */}
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{match.licitacao_uf || 'Não informado'}</span>
                      </div>

                      {/* Valor */}
                      <div className="flex items-center text-sm text-gray-600">
                        <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="font-medium">
                          {match.licitacao_valor && parseFloat(match.licitacao_valor) > 0 
                            ? formatarValorNumerico(parseFloat(match.licitacao_valor))
                            : 'Sigiloso'
                          }
                        </span>
                      </div>

                      {/* Tipo de match */}
                      <div className="flex items-center text-sm text-gray-600">
                        <Award className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{getMatchTypeLabel(match.match_type)}</span>
                      </div>
                    </div>

                    {/* Justificativa */}
                    <div className="bg-gray-50 p-3 rounded-lg mb-4">
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {match.justificativa_match}
                      </p>
                    </div>

                    {/* Rodapé do card */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {formatarData(match.data_match)}
                      </span>
                      <button className="text-orange-500 hover:text-orange-600 text-sm font-medium">
                        Ver detalhes →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Sem resultados */}
        {!selectedEmpresa && empresas.length === 0 && (
          <div className="text-center py-12">
            <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma empresa com matches encontrada
            </h3>
            <p className="text-gray-500">
              Ainda não há matches processados no sistema.
            </p>
          </div>
        )}

        {selectedEmpresa && matchesEmpresa.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum match encontrado
            </h3>
            <p className="text-gray-500">
              Esta empresa não possui matches com licitações.
            </p>
          </div>
        )}
      </div>

      {/* Modal de detalhes da licitação */}
      <LicitacaoModal
        selectedLicitacao={selectedLicitacao}
        modalLoading={modalLoading}
        onClose={() => setSelectedLicitacao(null)}
        showAnaliseButton={true}
      />

      {/* Widget de Status de Processos */}
      <ProcessStatusWidget onProcessComplete={handleProcessComplete} />
    </div>
  );
};

export default MatchesPage; 
import { useState, useEffect, useCallback } from 'react';
import { Bid, Company, Match, CompanyMatch, Status, ApiResponse } from '../types';
import { config } from '../config/environment';
import { useAuthHeaders } from './useAuth';

interface LoadingState {
  bids: boolean;
  companies: boolean;
  matches: boolean;
  companyMatches: boolean;
  status: boolean;
}

interface ApiDataHook {
  bids: Bid[];
  companies: Company[];
  matches: Match[];
  companyMatches: CompanyMatch[];
  status: { daily_bids: Status; reevaluate: Status; } | null;
  loading: LoadingState;
  loadBids: () => Promise<void>;
  loadCompanies: () => Promise<void>;
  loadMatches: () => Promise<void>;
  loadStatus: () => Promise<void>;
  setLoading: (key: keyof LoadingState, value: boolean) => void;
}

const API_BASE_URL = config.API_BASE_URL;

export const useApiData = (): ApiDataHook => {
  // 🔐 Hook de autenticação para headers
  const { getHeaders, hasValidToken } = useAuthHeaders();

  const [bids, setBids] = useState<Bid[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [companyMatches, setCompanyMatches] = useState<CompanyMatch[]>([]);
  const [status, setStatus] = useState<{ daily_bids: Status; reevaluate: Status; } | null>(null);
  
  const [loading, setLoadingState] = useState<LoadingState>({
    bids: false,
    companies: false,
    matches: false,
    companyMatches: false,
    status: false,
  });

  const setLoading = useCallback((key: keyof LoadingState, value: boolean) => {
    setLoadingState(prev => ({ ...prev, [key]: value }));
  }, []);

  // Carregar licitações
  const loadBids = useCallback(async () => {
    try {
      setLoading('bids', true);
      // Remover limitador - buscar todas as licitações
      const url = `${API_BASE_URL}/bids?limit=0`; // limit=0 significa sem limite
      console.log('🔗 [BIDS] Requisição para:', url);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      const result: ApiResponse<Bid[]> = await response.json();
      
      if (result.success && result.data) {
        setBids(result.data);
        console.log(`✅ ${result.data.length} licitações carregadas (todas)`);
      } else {
        console.error('Erro na resposta da API:', result.message || result.error);
        setBids([]);
      }
    } catch (error) {
      console.error('Erro ao carregar licitações:', error);
      setBids([]);
    } finally {
      setLoading('bids', false);
    }
  }, [setLoading]);

  // Carregar empresas (ATUALIZADO PARA MULTI-TENANT)
  const loadCompanies = useCallback(async () => {
    try {
      setLoading('companies', true);
      
      // Verificar se tem token válido
      if (!hasValidToken) {
        console.warn('⚠️ Token inválido para carregar empresas');
        setCompanies([]);
        return;
      }

      const url = `${API_BASE_URL}/companies`;
      console.log('🔗 [COMPANIES] Requisição para:', url);
      const response = await fetch(url, {
        headers: getHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      const result: ApiResponse<Company[]> = await response.json();
      
      if (result.success && result.data) {
        setCompanies(result.data);
        console.log(`✅ ${result.data.length} empresas carregadas (multi-tenant)`);
      } else {
        console.error('Erro na resposta da API:', result.message || result.error);
        setCompanies([]);
      }
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      setCompanies([]);
    } finally {
      setLoading('companies', false);
    }
  }, [setLoading, hasValidToken, getHeaders]);

  // Carregar matches (ATUALIZADO PARA MULTI-TENANT)
  const loadMatches = useCallback(async () => {
    try {
      setLoading('matches', true);
      setLoading('companyMatches', true);
      
      // Verificar se tem token válido
      if (!hasValidToken) {
        console.warn('⚠️ Token inválido para carregar matches');
        setMatches([]);
        setCompanyMatches([]);
        return;
      }
      
      // Carregar matches gerais (apenas do usuário autenticado) - SEM LIMITE
      const matchesResponse = await fetch(`${API_BASE_URL}/matches?limit=1000`, {
        headers: getHeaders(),
      });
      if (matchesResponse.ok) {
        const matchesResult: ApiResponse<Match[]> = await matchesResponse.json();
        if (matchesResult.success && matchesResult.data) {
          setMatches(matchesResult.data);
          console.log(`✅ ${matchesResult.data.length} matches carregados (multi-tenant)`);
        }
      }
      
      // Carregar matches por empresa (apenas do usuário autenticado)
      const companyMatchesResponse = await fetch(`${API_BASE_URL}/matches/by-company`, {
        headers: getHeaders(),
      });
      if (companyMatchesResponse.ok) {
        const companyMatchesResult: ApiResponse<CompanyMatch[]> = await companyMatchesResponse.json();
        if (companyMatchesResult.success && companyMatchesResult.data) {
          setCompanyMatches(companyMatchesResult.data);
          console.log(`✅ ${companyMatchesResult.data.length} matches por empresa carregados (multi-tenant)`);
        }
      }
      
    } catch (error) {
      console.error('Erro ao carregar matches:', error);
      setMatches([]);
      setCompanyMatches([]);
    } finally {
      setLoading('matches', false);
      setLoading('companyMatches', false);
    }
  }, [setLoading, hasValidToken, getHeaders]);

  // Carregar status (ATUALIZADO para nova API)
  const loadStatus = useCallback(async () => {
    try {
      setLoading('status', true);
      
      // Buscar status específico de cada processo
      const [dailyResponse, reevaluateResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/status/daily-bids`),
        fetch(`${API_BASE_URL}/status/reevaluate`)
      ]);
      
      if (dailyResponse.ok && reevaluateResponse.ok) {
        const dailyResult = await dailyResponse.json();
        const reevaluateResult = await reevaluateResponse.json();
        
        if (dailyResult.success && reevaluateResult.success) {
          const dailyStatus = dailyResult.data;
          const reevaluateStatus = reevaluateResult.data;
          
          setStatus({
            daily_bids: {
              running: dailyStatus.running,
              last_result: dailyStatus.last_run ? {
                success: true,
                message: dailyStatus.message || 'Processo executado com sucesso',
                timestamp: dailyStatus.last_run
              } : null
            },
            reevaluate: {
              running: reevaluateStatus.running,
              last_result: reevaluateStatus.last_run ? {
                success: true,
                message: reevaluateStatus.message || 'Processo executado com sucesso',
                timestamp: reevaluateStatus.last_run
              } : null
            }
          });
          
          console.log('📊 Status atualizado:', {
            daily_running: dailyStatus.running,
            reevaluate_running: reevaluateStatus.running
          });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar status:', error);
    } finally {
      setLoading('status', false);
    }
  }, [setLoading]);

  // Carregar dados iniciais (APENAS QUANDO AUTENTICADO)
  useEffect(() => {
    const loadInitialData = async () => {
      // Só carregar se tiver token válido
      if (!hasValidToken) {
        console.log('⚠️ Usuário não autenticado - dados não serão carregados');
        return;
      }

      console.log('🚀 Carregando dados iniciais (usuário autenticado)...');
      await Promise.all([
        loadBids(), // Licitações permanecem públicas
        loadCompanies(), // Empresas agora são multi-tenant
        loadMatches(), // Matches agora são multi-tenant
        loadStatus() // Status permanece público
      ]);
      console.log('✅ Dados iniciais carregados');
    };

    loadInitialData();
  }, [loadBids, loadCompanies, loadMatches, loadStatus, hasValidToken]);

  return {
    bids,
    companies,
    matches,
    companyMatches,
    status,
    loading,
    loadBids,
    loadCompanies,
    loadMatches,
    loadStatus,
    setLoading
  };
}; 
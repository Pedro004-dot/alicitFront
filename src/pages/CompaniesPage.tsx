import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X, 
  Save, 
  FileText, 
  Target,
  Tag,
  AlertCircle,
  CheckCircle,
  Loader2,
  Filter,
  SortAsc,
  Eye
} from 'lucide-react';
import { Company } from '../types';
import { useCompanyCrud } from '../hooks/useCompanyCrud';
import { useAuthHeaders } from '../hooks/useAuth';
import { config } from '../config/environment';

interface CompanyFormData {
  nome_fantasia: string;
  razao_social: string;
  cnpj: string;
  descricao_servicos_produtos: string;
  palavras_chave: string[];
  setor_atuacao: string;
}

const CompaniesPage: React.FC = () => {
  // 🔐 Hook de autenticação
  const { getHeaders, hasValidToken } = useAuthHeaders();
  
  // Estados principais
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');
  const [sortBy, setSortBy] = useState<'nome_fantasia' | 'razao_social' | 'setor_atuacao' | 'cnpj' | 'created_at'>('nome_fantasia');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Estados do modal/formulário
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState<CompanyFormData>({
    nome_fantasia: '',
    razao_social: '',
    cnpj: '',
    descricao_servicos_produtos: '',
    palavras_chave: [],
    setor_atuacao: ''
  });
  const [keywordInput, setKeywordInput] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Função callback para sucesso das operações CRUD
  const handleCrudSuccess = () => {
    // Fechar modal
    const wasCreating = modalMode === 'create';
    const wasEditing = modalMode === 'edit';
    
    closeModal();
    
    // Recarregar lista de empresas
    fetchCompanies();
    
    // Mostrar notificação de sucesso
    if (wasCreating) {
      showNotification('success', `✅ Empresa criada com sucesso!`);
    } else if (wasEditing) {
      showNotification('success', `✅ Empresa atualizada com sucesso!`);
    }
  };

  // Hooks (API não utilizada diretamente, usando fetch customizado)
  // const { companies: apiCompanies, loadCompanies } = useApiData();
  const { 
    loading: crudLoading, 
    error: crudError, 
    createCompany, 
    updateCompany, 
    deleteCompany,
    clearError 
  } = useCompanyCrud(handleCrudSuccess, getHeaders);

  // Função para buscar empresas
  const fetchCompanies = async () => {
    try {
      setLoading(true);
      
      // Verificar se tem token válido
      if (!hasValidToken) {
        showNotification('error', 'Usuário não autenticado');
        setCompanies([]);
        return;
      }
      
      console.log('🔗 [COMPANIES] Requisição para:', `${config.API_BASE_URL}/companies/`);
      const response = await fetch(`${config.API_BASE_URL}/companies/`, {
        headers: getHeaders()
      });
      const result = await response.json();
      
      if (response.ok && result.success && result.data) {
        setCompanies(result.data);
        console.log(`✅ ${result.data.length} empresas carregadas (multi-tenant)`);
      } else {
        console.error('Erro na resposta da API:', result.message);
        setCompanies([]);
        if (response.status === 401) {
          showNotification('error', 'Sessão expirada. Faça login novamente.');
        } else {
          showNotification('error', result.message || 'Erro ao carregar empresas');
        }
      }
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      setCompanies([]);
      showNotification('error', 'Erro ao conectar com a API');
    } finally {
      setLoading(false);
    }
  };

  // Carregar empresas na inicialização
  useEffect(() => {
    if (hasValidToken) {
      fetchCompanies();
    }
  }, [hasValidToken]);

  // Aplicar filtros e ordenação
  useEffect(() => {
    let filtered = [...companies];

    // Filtrar por busca textual
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(company =>
        company.nome_fantasia.toLowerCase().includes(search) ||
        company.razao_social.toLowerCase().includes(search) ||
        company.cnpj?.toLowerCase().includes(search) ||
        company.descricao_servicos_produtos.toLowerCase().includes(search) ||
        company.setor_atuacao?.toLowerCase().includes(search) ||
        company.palavras_chave?.some(keyword => keyword.toLowerCase().includes(search))
      );
    }

    // Filtrar por setor
    if (sectorFilter && sectorFilter !== 'todos') {
      filtered = filtered.filter(company => company.setor_atuacao === sectorFilter);
    }

    // Ordenar
    filtered.sort((a, b) => {
      let aValue: string | number | Date = '';
      let bValue: string | number | Date = '';

      switch (sortBy) {
        case 'nome_fantasia':
          aValue = a.nome_fantasia;
          bValue = b.nome_fantasia;
          break;
        case 'razao_social':
          aValue = a.razao_social;
          bValue = b.razao_social;
          break;
        case 'setor_atuacao':
          aValue = a.setor_atuacao || '';
          bValue = b.setor_atuacao || '';
          break;
        case 'cnpj':
          return (a.cnpj || '').localeCompare(b.cnpj || '');
        case 'created_at':
          // Acessar campos de data de forma segura
          const aCreated = (a as any).created_at;
          const bCreated = (b as any).created_at;
          return new Date(bCreated || 0).getTime() - new Date(aCreated || 0).getTime();
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortOrder === 'asc' ? comparison : -comparison;
      }

      return 0;
    });

    setFilteredCompanies(filtered);
  }, [companies, searchTerm, sectorFilter, sortBy, sortOrder]);

  // Função para mostrar notificação
  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    
    // Tempo personalizado baseado no tipo
    const duration = type === 'success' ? 4000 : type === 'error' ? 6000 : 3000;
    
    setTimeout(() => setNotification(null), duration);
  };

  // Obter setores únicos para filtro
  const uniqueSetores = Array.from(new Set(companies.map(c => c.setor_atuacao).filter(Boolean)));

  // Funções do modal
  const openModal = (mode: 'create' | 'edit' | 'view', company?: Company) => {
    setModalMode(mode);
    setSelectedCompany(company || null);
    
    if (mode === 'create') {
      setFormData({
        nome_fantasia: '',
        razao_social: '',
        cnpj: '',
        descricao_servicos_produtos: '',
        palavras_chave: [],
        setor_atuacao: ''
      });
      // Feedback para nova empresa
      showNotification('info', '➕ Formulário de nova empresa aberto');
    } else if (company) {
      setFormData({
        nome_fantasia: company.nome_fantasia || '',
        razao_social: company.razao_social || '',
        cnpj: company.cnpj || '',
        descricao_servicos_produtos: company.descricao_servicos_produtos || '',
        palavras_chave: company.palavras_chave || [],
        setor_atuacao: company.setor_atuacao || ''
      });
      
      // Mostrar notificação informativa ao visualizar/editar empresa
      if (mode === 'view') {
        showNotification('info', `👁️ Visualizando detalhes de "${company.nome_fantasia}"`);
      } else if (mode === 'edit') {
        showNotification('info', `✏️ Editando empresa "${company.nome_fantasia}"`);
      }
    }
    
    clearError();
    setShowModal(true);
  };

  const closeModal = () => {
    // Verificar se havia dados não salvos
    const hasUnsavedData = modalMode !== 'view' && (
      formData.nome_fantasia.trim() !== '' ||
      formData.razao_social.trim() !== '' ||
      formData.cnpj.trim() !== '' ||
      formData.descricao_servicos_produtos.trim() !== '' ||
      formData.palavras_chave.length > 0 ||
      formData.setor_atuacao.trim() !== ''
    );
    
    setShowModal(false);
    setSelectedCompany(null);
    setFormData({
      nome_fantasia: '',
      razao_social: '',
      cnpj: '',
      descricao_servicos_produtos: '',
      palavras_chave: [],
      setor_atuacao: ''
    });
    setFormErrors({});
    setKeywordInput('');
    clearError();
    
    // Feedback ao fechar
    if (modalMode === 'view') {
      showNotification('info', '📋 Visualização fechada');
    } else if (hasUnsavedData) {
      showNotification('info', '❌ Formulário fechado sem salvar');
    }
  };

  // Validação do formulário
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.nome_fantasia.trim()) {
      errors.nome_fantasia = 'Nome fantasia é obrigatório';
    }

    if (!formData.razao_social.trim()) {
      errors.razao_social = 'Razão social é obrigatória';
    }

    if (!formData.descricao_servicos_produtos.trim()) {
      errors.descricao_servicos_produtos = 'Descrição de serviços/produtos é obrigatória';
    }

    if (formData.cnpj && !validateCNPJ(formData.cnpj)) {
      errors.cnpj = 'CNPJ inválido';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validação simples de CNPJ
  const validateCNPJ = (cnpj: string): boolean => {
    const cleanCNPJ = cnpj.replace(/[^\d]/g, '');
    return cleanCNPJ.length === 14;
  };

  // Formatação de CNPJ
  const formatCNPJ = (cnpj: string): string => {
    if (!cnpj) return '';
    const clean = cnpj.replace(/[^\d]/g, '');
    if (clean.length <= 14) {
      return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return cnpj;
  };

  // Gerenciar palavras-chave
  const addKeyword = () => {
    if (keywordInput.trim() && !formData.palavras_chave.includes(keywordInput.trim())) {
      setFormData(prev => ({
        ...prev,
        palavras_chave: [...prev.palavras_chave, keywordInput.trim()]
      }));
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      palavras_chave: prev.palavras_chave.filter(k => k !== keyword)
    }));
  };

  // Submissão do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showNotification('error', '❌ Por favor, corrija os erros no formulário antes de continuar');
      return;
    }

    // Mostrar notificação de processo iniciado
    const action = modalMode === 'create' ? 'criando' : 'atualizando';
    const empresaNome = formData.nome_fantasia || 'empresa';
    showNotification('info', `⏳ ${action.charAt(0).toUpperCase() + action.slice(1)} "${empresaNome}"...`);
    
    try {
      if (modalMode === 'create') {
        await createCompany(formData);
      } else if (modalMode === 'edit' && selectedCompany) {
        await updateCompany(selectedCompany.id, formData);
      }
      
      // O sucesso é tratado automaticamente pelo callback onSuccess do hook
    } catch (error) {
      console.error('Erro ao salvar empresa:', error);
      const action = modalMode === 'create' ? 'criar' : 'atualizar';
      showNotification('error', `❌ Erro ao ${action} empresa. Tente novamente.`);
    }
  };

  // Excluir empresa
  const handleDelete = async (company: Company) => {
    // Confirmação com detalhes da empresa
    const confirmMessage = `⚠️ ATENÇÃO: Esta ação não pode ser desfeita!\n\nDeseja realmente excluir a empresa?\n\n• Nome: ${company.nome_fantasia}\n• Razão Social: ${company.razao_social}\n• CNPJ: ${company.cnpj || 'Não informado'}\n\nTodos os dados relacionados serão removidos permanentemente.`;
    
    if (window.confirm(confirmMessage)) {
      // Mostrar notificação de processo iniciado
      showNotification('info', `🗑️ Excluindo empresa "${company.nome_fantasia}"...`);
      
      try {
        const success = await deleteCompany(company.id);
        if (success) {
          // Recarregar lista
          await fetchCompanies();
          // Notificação de sucesso
          showNotification('success', `✅ Empresa "${company.nome_fantasia}" excluída com sucesso!`);
        } else {
          showNotification('error', `❌ Erro ao excluir empresa "${company.nome_fantasia}"`);
        }
      } catch (error) {
        console.error('Erro ao excluir empresa:', error);
        showNotification('error', `❌ Erro inesperado ao excluir empresa "${company.nome_fantasia}"`);
      }
    }
  };

  // Cor do badge do setor
  const getSetorColor = (setor: string): string => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-yellow-100 text-yellow-800',
      'bg-purple-100 text-purple-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
    ];
    const index = setor.length % colors.length;
    return colors[index];
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Building className="h-8 w-8 text-blue-600" />
              Gerenciar Empresas
            </h1>
            <p className="text-gray-600 mt-2">
              Cadastre e gerencie empresas para matching com licitações
            </p>
          </div>
          
          <button
            onClick={() => openModal('create')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Nova Empresa
          </button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <Building className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total de Empresas</p>
              <p className="text-2xl font-bold text-gray-900">{companies.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <Target className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Setores Únicos</p>
              <p className="text-2xl font-bold text-gray-900">{uniqueSetores.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="text-sm text-gray-600">Com CNPJ</p>
              <p className="text-2xl font-bold text-gray-900">
                {companies.filter(c => c.cnpj).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <Search className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Resultados</p>
              <p className="text-2xl font-bold text-gray-900">{filteredCompanies.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar empresas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Filtro por Setor */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
            >
              <option value="">Todos os setores</option>
              {uniqueSetores.map(setor => (
                <option key={setor} value={setor}>{setor}</option>
              ))}
            </select>
          </div>
          
          {/* Ordenação */}
          <div className="relative">
            <SortAsc className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
            >
              <option value="nome_fantasia">Ordenar por Nome</option>
              <option value="razao_social">Ordenar por Razão Social</option>
              <option value="setor_atuacao">Ordenar por Setor</option>
              <option value="cnpj">Ordenar por CNPJ</option>
              <option value="created_at">Ordenar por Data</option>
            </select>
          </div>
          
          {/* Limpar Filtros */}
          <button
            onClick={() => {
              setSearchTerm('');
              setSectorFilter('');
              setSortBy('nome_fantasia');
            }}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Limpar Filtros
          </button>
        </div>
      </div>

      {/* Lista de Empresas */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Carregando empresas...</span>
        </div>
      ) : filteredCompanies.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {companies.length === 0 ? 'Nenhuma empresa cadastrada' : 'Nenhuma empresa encontrada'}
          </h3>
          <p className="text-gray-600 mb-6">
            {companies.length === 0 
              ? 'Comece cadastrando a primeira empresa do sistema.'
              : 'Tente ajustar os filtros ou termos de busca.'
            }
          </p>
          {companies.length === 0 && (
            <button
              onClick={() => openModal('create')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Cadastrar Primeira Empresa
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((company) => (
            <div key={company.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              {/* Header do Card */}
              <div className="p-6 border-b">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {company.nome_fantasia}
                  </h3>
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => openModal('view', company)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      title="Visualizar"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openModal('edit', company)}
                      className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(company)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-2 truncate">
                  {company.razao_social}
                </p>
                
                {company.cnpj && (
                  <p className="text-sm text-gray-500 font-mono">
                    CNPJ: {formatCNPJ(company.cnpj)}
                  </p>
                )}
              </div>
              
              {/* Conteúdo do Card */}
              <div className="p-6">
                {company.setor_atuacao && (
                  <div className="mb-3">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getSetorColor(company.setor_atuacao)}`}>
                      {company.setor_atuacao}
                    </span>
                  </div>
                )}
                
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {company.descricao_servicos_produtos}
                </p>
                
                {company.palavras_chave && company.palavras_chave.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {company.palavras_chave.slice(0, 3).map((keyword: string, index: number) => (
                      <span
                        key={index}
                        className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                      >
                        {keyword}
                      </span>
                    ))}
                    {company.palavras_chave.length > 3 && (
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        +{company.palavras_chave.length - 3} mais
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header do Modal */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {modalMode === 'create' && 'Nova Empresa'}
                {modalMode === 'edit' && 'Editar Empresa'}
                {modalMode === 'view' && 'Detalhes da Empresa'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Nome Fantasia */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Fantasia *
                </label>
                <input
                  type="text"
                  value={formData.nome_fantasia}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome_fantasia: e.target.value }))}
                  disabled={modalMode === 'view'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  placeholder="Nome comercial da empresa"
                />
                {formErrors.nome_fantasia && (
                  <p className="text-red-600 text-sm mt-1">{formErrors.nome_fantasia}</p>
                )}
              </div>

              {/* Razão Social */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Razão Social *
                </label>
                <input
                  type="text"
                  value={formData.razao_social}
                  onChange={(e) => setFormData(prev => ({ ...prev, razao_social: e.target.value }))}
                  disabled={modalMode === 'view'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  placeholder="Razão social completa"
                />
                {formErrors.razao_social && (
                  <p className="text-red-600 text-sm mt-1">{formErrors.razao_social}</p>
                )}
              </div>

              {/* CNPJ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CNPJ
                </label>
                <input
                  type="text"
                  value={formData.cnpj}
                  onChange={(e) => setFormData(prev => ({ ...prev, cnpj: e.target.value }))}
                  disabled={modalMode === 'view'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  placeholder="00.000.000/0000-00"
                />
                {formErrors.cnpj && (
                  <p className="text-red-600 text-sm mt-1">{formErrors.cnpj}</p>
                )}
              </div>

              {/* Setor de Atuação */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Setor de Atuação
                </label>
                <input
                  type="text"
                  value={formData.setor_atuacao}
                  onChange={(e) => setFormData(prev => ({ ...prev, setor_atuacao: e.target.value }))}
                  disabled={modalMode === 'view'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  placeholder="Ex: Tecnologia, Construção, Saúde"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição de Serviços/Produtos *
                </label>
                <textarea
                  value={formData.descricao_servicos_produtos}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao_servicos_produtos: e.target.value }))}
                  disabled={modalMode === 'view'}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  placeholder="Descreva os principais serviços e produtos oferecidos pela empresa"
                />
                {formErrors.descricao_servicos_produtos && (
                  <p className="text-red-600 text-sm mt-1">{formErrors.descricao_servicos_produtos}</p>
                )}
              </div>

              {/* Palavras-chave */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Palavras-chave
                </label>
                
                {modalMode !== 'view' && (
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Digite uma palavra-chave e pressione Enter"
                    />
                    <button
                      type="button"
                      onClick={addKeyword}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <Tag className="h-4 w-4" />
                      Adicionar
                    </button>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2">
                  {formData.palavras_chave.map((keyword, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {keyword}
                      {modalMode !== 'view' && (
                        <button
                          type="button"
                          onClick={() => removeKeyword(keyword)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </div>

              {/* Erro do CRUD */}
              {crudError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="text-red-700">{crudError}</span>
                </div>
              )}

              {/* Ações do Modal */}
              <div className="flex gap-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {modalMode === 'view' ? 'Fechar' : 'Cancelar'}
                </button>
                
                {modalMode !== 'view' && (
                  <button
                    type="submit"
                    disabled={crudLoading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {crudLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {modalMode === 'create' ? 'Criar Empresa' : 'Salvar Alterações'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notificação */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border ${
            notification.type === 'success' ? 'bg-green-500 text-white border-green-400 shadow-green-500/20' :
            notification.type === 'error' ? 'bg-red-500 text-white border-red-400 shadow-red-500/20' :
            'bg-blue-500 text-white border-blue-400 shadow-blue-500/20'
          } max-w-md backdrop-blur-sm`}>
            <div className="flex-shrink-0">
              {notification.type === 'success' && <CheckCircle className="h-6 w-6" />}
              {notification.type === 'error' && <AlertCircle className="h-6 w-6" />}
              {notification.type === 'info' && <Loader2 className="h-6 w-6 animate-spin" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium leading-relaxed">{notification.message}</p>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="flex-shrink-0 text-white/80 hover:text-white transition-colors rounded-lg p-1 hover:bg-black/10"
              title="Fechar notificação"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompaniesPage; 
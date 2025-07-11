export interface LicitacaoItem {
  id: string;
  numero_item: number;
  descricao: string;
  quantidade: string;
  unidade_medida: string;
  valor_unitario_estimado: string;
  valor_total?: string;
}

export interface Licitacao {
  id: string;
  pncp_id: string;
  objeto_compra: string;
  uf: string;
  data_abertura_proposta: string | null;
  data_encerramento_proposta: string | null;
  valor_total_estimado: number;
  status: string;
  data_publicacao: string | null;
  modalidade_nome: string;
  situacao_compra_nome: string;
  processo: string;
  orgao_entidade: any;
  unidade_orgao: any;
  informacao_complementar: string;
  numero_controle_pncp?: string; // Novo campo para buscar itens
  itens?: LicitacaoItem[];
  // Campos calculados do backend
  status_calculado?: string;
  valor_display?: number | string;
  razao_social?: string;
  procuring_entity_name?: string;
  // Novos campos da unidadeOrgao
  uf_nome?: string;
  nome_unidade?: string;
  municipio_nome?: string;
  codigo_ibge?: string;
  codigo_unidade?: string;
} 
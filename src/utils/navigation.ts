import { NavigateFunction } from 'react-router-dom';

/**
 * Utilitário para navegação segura usando React Router
 * Evita o uso de window.location.href que causa reload da página
 */
export class NavigationHelper {
  private static navigate: NavigateFunction | null = null;

  /**
   * Registra a função navigate do React Router
   */
  static setNavigate(navigateFunction: NavigateFunction) {
    this.navigate = navigateFunction;
  }

  /**
   * Navega para uma rota usando React Router
   * @param path Caminho para navegar
   * @param replace Se deve substituir a entrada no histórico
   */
  static navigateTo(path: string, replace = false) {
    if (this.navigate) {
      this.navigate(path, { replace });
    } else {
      console.warn('Navigator not initialized, falling back to window.location');
      window.location.href = path;
    }
  }

  /**
   * Navega para análise de licitação
   * @param pncp_id ID PNCP da licitação
   * @param licitacao_id ID interno da licitação
   */
  static navigateToAnalysis(pncp_id: string, licitacao_id: string) {
    const url = `/analise-licitacao?pncp_id=${encodeURIComponent(pncp_id)}&licitacao_id=${encodeURIComponent(licitacao_id)}`;
    this.navigateTo(url);
  }

  /**
   * Voltar na história
   */
  static goBack() {
    window.history.back();
  }
}

/**
 * Hook para navegação segura
 */
export const useSafeNavigation = () => {
  return {
    navigateTo: NavigationHelper.navigateTo,
    navigateToAnalysis: NavigationHelper.navigateToAnalysis,
    goBack: NavigationHelper.goBack,
  };
}; 
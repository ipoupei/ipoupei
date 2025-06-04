// src/stores/categoriasStore.js

/**
 * Store global simples para sincronização de categorias entre componentes
 * Usando padrão Observer para notificar mudanças
 */
class CategoriasStore {
  constructor() {
    this.listeners = new Set();
    this.lastUpdate = Date.now();
  }

  // Adiciona um listener para mudanças
  subscribe(callback) {
    this.listeners.add(callback);
    
    // Retorna função para unsubscribe
    return () => {
      this.listeners.delete(callback);
    };
  }

  // Notifica todos os listeners sobre uma mudança
  notifyChange(type = 'update', data = {}) {
    this.lastUpdate = Date.now();
    console.log('🔄 CategoriasStore - Notificando mudança:', type, data);
    
    this.listeners.forEach(callback => {
      try {
        callback({ type, data, timestamp: this.lastUpdate });
      } catch (error) {
        console.error('Erro ao notificar listener:', error);
      }
    });
  }

  // Métodos de notificação para diferentes tipos de mudança
  categoriaAdicionada(categoria) {
    this.notifyChange('categoria_adicionada', categoria);
  }

  categoriaAtualizada(categoria) {
    this.notifyChange('categoria_atualizada', categoria);
  }

  categoriaRemovida(categoriaId) {
    this.notifyChange('categoria_removida', { categoriaId });
  }

  subcategoriaAdicionada(categoriaId, subcategoria) {
    this.notifyChange('subcategoria_adicionada', { categoriaId, subcategoria });
  }

  subcategoriaAtualizada(categoriaId, subcategoria) {
    this.notifyChange('subcategoria_atualizada', { categoriaId, subcategoria });
  }

  subcategoriaRemovida(categoriaId, subcategoriaId) {
    this.notifyChange('subcategoria_removida', { categoriaId, subcategoriaId });
  }

  // Força refresh geral
  forceRefresh() {
    this.notifyChange('force_refresh');
  }
}

// Instância singleton
export const categoriasStore = new CategoriasStore();

export default categoriasStore;
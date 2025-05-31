import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  X, Check, ArrowUp, ArrowDown, 
  RefreshCw, CreditCard, BanknoteIcon,
  CalendarIcon, CircleCheckIcon, CircleDashedIcon 
} from 'lucide-react';

const TransacoesFilter = ({ 
  filters, 
  onApplyFilters, 
  onClearFilters, 
  onClose,
  contas = [],
  categorias = [],
  cartoes = []
}) => {
  // Estado local para manipular os filtros antes de aplicar
  const [localFilters, setLocalFilters] = useState({...filters});
  
  // Lista de categorias filtradas por tipo
  const [subcategorias, setSubcategorias] = useState([]);
  
  // Atualiza a lista de subcategorias quando a categoria muda
  useEffect(() => {
    if (localFilters.categoriaId) {
      const categoria = categorias.find(cat => cat.id === localFilters.categoriaId);
      setSubcategorias(categoria?.subcategorias || []);
    } else {
      setSubcategorias([]);
    }
  }, [localFilters.categoriaId, categorias]);
  
  // Função para atualizar um filtro local
  const updateFilter = (key, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Função para lidar com a mudança nas datas
  const handleDateChange = (field, value) => {
    try {
      const date = value ? parseISO(value) : null;
      updateFilter(field, date);
    } catch (error) {
      console.error('Erro ao converter data:', error);
    }
  };
  
  // Função para aplicar os filtros
  const handleApplyFilters = () => {
    onApplyFilters(localFilters);
    onClose();
  };
  
  // Função para limpar os filtros
  const handleClearFilters = () => {
    onClearFilters();
    onClose();
  };
  
  // Formatação de data para o input
  const formatDateForInput = (date) => {
    if (!date) return '';
    return format(date, 'yyyy-MM-dd');
  };
  
  return (
    <div className="transacoes-filter">
      <div className="filter-header">
        <h2>Filtrar Transações</h2>
        <button 
          className="close-button" 
          onClick={onClose}
          aria-label="Fechar filtros"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      <div className="filter-content">
        <div className="filter-section">
          <h3 className="section-title">
            <CalendarIcon className="section-icon" />
            Período
          </h3>
          
          <div className="filter-row">
            <div className="filter-field">
              <label htmlFor="periodoInicio">De</label>
              <input 
                type="date" 
                id="periodoInicio"
                className="filter-input" 
                value={formatDateForInput(localFilters.periodoInicio)}
                onChange={(e) => handleDateChange('periodoInicio', e.target.value)}
              />
            </div>
            
            <div className="filter-field">
              <label htmlFor="periodoFim">Até</label>
              <input 
                type="date" 
                id="periodoFim"
                className="filter-input" 
                value={formatDateForInput(localFilters.periodoFim)}
                onChange={(e) => handleDateChange('periodoFim', e.target.value)}
              />
            </div>
          </div>
          
          <div className="filter-quick-dates">
            <button 
              className="quick-date-button"
              onClick={() => {
                const today = new Date();
                updateFilter('periodoInicio', startOfMonth(today));
                updateFilter('periodoFim', endOfMonth(today));
              }}
            >
              Mês Atual
            </button>
            
            <button 
              className="quick-date-button"
              onClick={() => {
                const today = new Date();
                const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1);
                updateFilter('periodoInicio', startOfMonth(lastMonth));
                updateFilter('periodoFim', endOfMonth(lastMonth));
              }}
            >
              Mês Anterior
            </button>
            
            <button 
              className="quick-date-button"
              onClick={() => {
                const today = new Date();
                const startYear = new Date(today.getFullYear(), 0, 1);
                updateFilter('periodoInicio', startYear);
                updateFilter('periodoFim', today);
              }}
            >
              Este Ano
            </button>
          </div>
        </div>
        
        <div className="filter-section">
          <h3 className="section-title">
            <BanknoteIcon className="section-icon" />
            Tipo de Transação
          </h3>
          
          <div className="filter-buttons">
            <button 
              className={`filter-toggle ${localFilters.tipo === 'todas' ? 'active' : ''}`}
              onClick={() => updateFilter('tipo', 'todas')}
            >
              Todas
            </button>
            
            <button 
              className={`filter-toggle ${localFilters.tipo === 'receita' ? 'active receita' : ''}`}
              onClick={() => updateFilter('tipo', 'receita')}
            >
              <ArrowUp className="toggle-icon" />
              Receitas
            </button>
            
            <button 
              className={`filter-toggle ${localFilters.tipo === 'despesa' ? 'active despesa' : ''}`}
              onClick={() => updateFilter('tipo', 'despesa')}
            >
              <ArrowDown className="toggle-icon" />
              Despesas
            </button>
            
            <button 
              className={`filter-toggle ${localFilters.tipo === 'transferencia' ? 'active transferencia' : ''}`}
              onClick={() => updateFilter('tipo', 'transferencia')}
            >
              <RefreshCw className="toggle-icon" />
              Transferências
            </button>
          </div>
        </div>
        
        <div className="filter-section">
          <h3 className="section-title">
            <CircleCheckIcon className="section-icon" />
            Status
          </h3>
          
          <div className="filter-buttons">
            <button 
              className={`filter-toggle ${localFilters.efetivada === null ? 'active' : ''}`}
              onClick={() => updateFilter('efetivada', null)}
            >
              Todas
            </button>
            
            <button 
              className={`filter-toggle ${localFilters.efetivada === true ? 'active efetivada' : ''}`}
              onClick={() => updateFilter('efetivada', true)}
            >
              <CircleCheckIcon className="toggle-icon" />
              Efetivadas
            </button>
            
            <button 
              className={`filter-toggle ${localFilters.efetivada === false ? 'active pendente' : ''}`}
              onClick={() => updateFilter('efetivada', false)}
            >
              <CircleDashedIcon className="toggle-icon" />
              Pendentes
            </button>
          </div>
        </div>
        
        <div className="filter-row">
          <div className="filter-field">
            <label htmlFor="contaId">Conta</label>
            <select 
              id="contaId"
              className="filter-select" 
              value={localFilters.contaId || ''}
              onChange={(e) => updateFilter('contaId', e.target.value ? e.target.value : null)}
            >
              <option value="">Todas as contas</option>
              {contas.map(conta => (
                <option key={conta.id} value={conta.id}>
                  {conta.nome}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-field">
            <label htmlFor="categoriaId">Categoria</label>
            <select 
              id="categoriaId"
              className="filter-select" 
              value={localFilters.categoriaId || ''}
              onChange={(e) => {
                updateFilter('categoriaId', e.target.value ? e.target.value : null);
                updateFilter('subcategoriaId', null); // Reset subcategoria ao mudar categoria
              }}
            >
              <option value="">Todas as categorias</option>
              {categorias.map(categoria => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nome}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="filter-row">
          <div className="filter-field">
            <label htmlFor="subcategoriaId">Subcategoria</label>
            <select 
              id="subcategoriaId"
              className="filter-select" 
              value={localFilters.subcategoriaId || ''}
              onChange={(e) => updateFilter('subcategoriaId', e.target.value ? e.target.value : null)}
              disabled={!localFilters.categoriaId || subcategorias.length === 0}
            >
              <option value="">Todas as subcategorias</option>
              {subcategorias.map(sub => (
                <option key={sub.id} value={sub.id}>
                  {sub.nome}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-field">
            <label htmlFor="cartaoId">Cartão de Crédito</label>
            <select 
              id="cartaoId"
              className="filter-select" 
              value={localFilters.cartaoId || ''}
              onChange={(e) => updateFilter('cartaoId', e.target.value ? e.target.value : null)}
            >
              <option value="">Todos os cartões</option>
              {cartoes.map(cartao => (
                <option key={cartao.id} value={cartao.id}>
                  {cartao.nome}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="filter-toggle-option">
          <label className="toggle-label">
            <input 
              type="checkbox"
              checked={localFilters.agruparFaturas}
              onChange={() => updateFilter('agruparFaturas', !localFilters.agruparFaturas)}
            />
            <div className="toggle-switch">
              <div className="toggle-slider"></div>
            </div>
            <span>Agrupar faturas de cartão</span>
          </label>
          <small className="toggle-description">
            Agrupa todas as compras no cartão em uma única fatura por vencimento
          </small>
        </div>
      </div>
      
      <div className="filter-actions">
        <button 
          className="secondary-button"
          onClick={handleClearFilters}
        >
          Limpar Filtros
        </button>
        
        <button 
          className="primary-button"
          onClick={handleApplyFilters}
        >
          <Check className="button-icon" />
          Aplicar Filtros
        </button>
      </div>
    </div>
  );
};

export default TransacoesFilter;
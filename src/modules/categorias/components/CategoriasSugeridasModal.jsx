import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, Plus, Check, Lightbulb } from 'lucide-react';
import useCategorias from '@modules/categorias/hooks/useCategorias';
import '@shared/styles/FormsModal.css';
import '@modules/categorias/styles/CategoriasSugeridasModal.css';

// Dados das categorias sugeridas completas
const categoriasSugeridasData = {
  despesas: [
    {
      id: 'desp_1',
      nome: 'Alimentação',
      cor: '#FF6B6B',
      icone: '🍽️',
      subcategorias: [
        { nome: 'Supermercado' },
        { nome: 'Restaurante' },
        { nome: 'Lanche/Fast Food/Delivery' },
        { nome: 'Açougue/Feira' }
      ]
    },
    {
      id: 'desp_2',
      nome: 'Transporte',
      cor: '#4ECDC4',
      icone: '🚗',
      subcategorias: [
        { nome: 'Combustível' },
        { nome: 'Uber/Taxi' },
        { nome: 'Transporte Público' },
        { nome: 'Manutenção Veículo' },
        { nome: 'Estacionamento' }
      ]
    },
    {
      id: 'desp_3',
      nome: 'Moradia',
      cor: '#45B7D1',
      icone: '🏠',
      subcategorias: [
        { nome: 'Aluguel' },
        { nome: 'Condomínio' },
        { nome: 'Energia Elétrica' },
        { nome: 'Água' },
        { nome: 'Internet' },
        { nome: 'Gás' }
      ]
    },
    {
      id: 'desp_4',
      nome: 'Saúde',
      cor: '#96CEB4',
      icone: '🏥',
      subcategorias: [
        { nome: 'Consultas Médicas/Dentista' },
        { nome: 'Medicamentos' },
        { nome: 'Exames' },
        { nome: 'Plano de Saúde' },
      ]
    },
    {
      id: 'desp_5',
      nome: 'Educação',
      cor: '#FFEAA7',
      icone: '📚',
      subcategorias: [
        { nome: 'Cursos' },
        { nome: 'Livros' },
        { nome: 'Material Escolar' },
        { nome: 'Mensalidade' }
      ]
    },
    {
      id: 'desp_6',
      nome: 'Lazer',
      cor: '#DDA0DD',
      icone: '🎉',
      subcategorias: [
        { nome: 'Cinema/Teatro' },
        { nome: 'Viagens' },
        { nome: 'Hobbies' },
        { nome: 'Streaming' }
      ]
    },
    {
      id: 'desp_7',
      nome: 'Vestuário',
      cor: '#98D8C8',
      icone: '👕',
      subcategorias: [
        { nome: 'Roupas' },
        { nome: 'Calçados' },
        { nome: 'Acessórios' }
      ]
    },
    {
      id: 'desp_8',
      nome: 'Pets',
      cor: '#F7DC6F',
      icone: '🐕',
      subcategorias: [
        { nome: 'Ração' },
        { nome: 'Veterinário' },
        { nome: 'Medicamentos Pet' },
        { nome: 'Acessórios' }
      ]
    }

  
  ],
  receitas: [
    {
      id: 'rec_1',
      nome: 'Salário',
      cor: '#27AE60',
      icone: '💰',
      subcategorias: [
        { nome: 'Salário Principal' },
        { nome: 'Horas Extras' },
        { nome: 'Bonificação' },
        { nome: '13º Salário' }
      ]
    },
    {
      id: 'rec_2',
      nome: 'Freelance',
      cor: '#3498DB',
      icone: '💼',
      subcategorias: [
        { nome: 'Projetos' },
        { nome: 'Consultoria' },
        { nome: 'Serviços' }
      ]
    },
    {
      id: 'rec_3',
      nome: 'Investimentos',
      cor: '#9B59B6',
      icone: '📈',
      subcategorias: [
        { nome: 'Dividendos' },
        { nome: 'Juros' },
        { nome: 'Rendimentos CDB' },
        { nome: 'Fundos' }
      ]
    },
    {
      id: 'rec_4',
      nome: 'Vendas',
      cor: '#E67E22',
      icone: '🛍️',
      subcategorias: [
        { nome: 'Produtos' },
        { nome: 'Usados' },
        { nome: 'Artesanato' }
      ]
    },
    {
      id: 'rec_5',
      nome: 'Outros',
      cor: '#95A5A6',
      icone: '💸',
      subcategorias: [
        { nome: 'Presente' },
        { nome: 'Reembolso' },
        { nome: 'Prêmio' }
      ]
    }
  ]
};

/**
 * Modal para exibir categorias sugeridas e permitir importação
 * Versão refatorada usando estilos base do FormsModal
 */
const CategoriasSugeridasModal = ({ isOpen, onClose }) => {
  console.log('🎯 CategoriasSugeridasModal renderizado:', { isOpen });
  
  const { addCategoria, addSubcategoria, categorias, loading } = useCategorias();
  
  // Estado para controlar o tipo atual (receitas/despesas)
  const [tipoAtual, setTipoAtual] = useState('despesas');
  
  // Estado para categorias selecionadas
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState({});
  
  // Estado para subcategorias selecionadas
  const [subcategoriasSelecionadas, setSubcategoriasSelecionadas] = useState({});
  
  // Estados de feedback
  const [feedback, setFeedback] = useState({ show: false, message: '', type: '' });
  const [importando, setImportando] = useState(false);
  
  // Dados das categorias filtradas por tipo
  const categoriasFiltradas = categoriasSugeridasData[tipoAtual] || [];
  
  // Reset das seleções quando troca de tipo
  useEffect(() => {
    setCategoriasSelecionadas({});
    setSubcategoriasSelecionadas({});
  }, [tipoAtual]);
  
  // Função para mostrar feedback
  const showFeedback = (message, type = 'success') => {
    setFeedback({ show: true, message, type });
    setTimeout(() => {
      setFeedback({ show: false, message: '', type: '' });
    }, 5000);
  };
  
  // Verifica se uma categoria já existe no sistema
  const categoriaJaExiste = (nomeCategoria) => {
    return categorias.some(cat => 
      cat.nome.toLowerCase().trim() === nomeCategoria.toLowerCase().trim() && 
      cat.tipo === (tipoAtual === 'despesas' ? 'despesa' : 'receita')
    );
  };
  
  // Handler para selecionar/deselecionar categoria
  const handleToggleCategoria = (categoriaId, selecionada) => {
    setCategoriasSelecionadas(prev => ({
      ...prev,
      [categoriaId]: selecionada
    }));
    
    // Se deselecionar categoria, deselecionar todas as subcategorias
    if (!selecionada) {
      setSubcategoriasSelecionadas(prev => {
        const novasSubcategorias = { ...prev };
        const categoria = categoriasFiltradas.find(cat => cat.id === categoriaId);
        
        if (categoria && categoria.subcategorias) {
          categoria.subcategorias.forEach((_, index) => {
            delete novasSubcategorias[`${categoriaId}_${index}`];
          });
        }
        
        return novasSubcategorias;
      });
    } else {
      // Se selecionar categoria, selecionar todas as subcategorias
      const categoria = categoriasFiltradas.find(cat => cat.id === categoriaId);
      if (categoria && categoria.subcategorias) {
        setSubcategoriasSelecionadas(prev => {
          const novasSubcategorias = { ...prev };
          categoria.subcategorias.forEach((_, index) => {
            novasSubcategorias[`${categoriaId}_${index}`] = true;
          });
          return novasSubcategorias;
        });
      }
    }
  };
  
  // Handler para selecionar/deselecionar subcategoria
  const handleToggleSubcategoria = (categoriaId, subcategoriaIndex, selecionada) => {
    const key = `${categoriaId}_${subcategoriaIndex}`;
    
    setSubcategoriasSelecionadas(prev => ({
      ...prev,
      [key]: selecionada
    }));
    
    // Se selecionar subcategoria, garantir que a categoria também esteja selecionada
    if (selecionada) {
      setCategoriasSelecionadas(prev => ({
        ...prev,
        [categoriaId]: true
      }));
    }
  };
  
  // Função para selecionar/deselecionar todas as categorias
  const handleToggleTodasCategorias = (selecionar) => {
    const novasCategorias = {};
    const novasSubcategorias = {};
    
    categoriasFiltradas.forEach(categoria => {
      if (!categoriaJaExiste(categoria.nome)) {
        novasCategorias[categoria.id] = selecionar;
        
        if (selecionar && categoria.subcategorias) {
          categoria.subcategorias.forEach((_, index) => {
            novasSubcategorias[`${categoria.id}_${index}`] = true;
          });
        }
      }
    });
    
    setCategoriasSelecionadas(novasCategorias);
    setSubcategoriasSelecionadas(selecionar ? novasSubcategorias : {});
  };
  
  // Contador de seleções
  const contarSelecoes = () => {
    const categoriasCount = Object.values(categoriasSelecionadas).filter(Boolean).length;
    const subcategoriasCount = Object.values(subcategoriasSelecionadas).filter(Boolean).length;
    return { categorias: categoriasCount, subcategorias: subcategoriasCount };
  };
  
  // Função para importar categorias selecionadas
  const handleImportarCategorias = async () => {
    const selecionadas = Object.entries(categoriasSelecionadas).filter(([_, selected]) => selected);
    
    if (selecionadas.length === 0) {
      showFeedback('Selecione pelo menos uma categoria para importar', 'error');
      return;
    }
    
    setImportando(true);
    
    try {
      let sucessos = 0;
      let erros = 0;
      
      for (const [categoriaId] of selecionadas) {
        const categoriaSugerida = categoriasFiltradas.find(cat => cat.id === categoriaId);
        
        if (!categoriaSugerida || categoriaJaExiste(categoriaSugerida.nome)) {
          continue; // Pula categorias que já existem
        }
        
        // Criar categoria
        const resultCategoria = await addCategoria({
          nome: categoriaSugerida.nome,
          tipo: tipoAtual === 'despesas' ? 'despesa' : 'receita',
          cor: categoriaSugerida.cor,
          icone: categoriaSugerida.icone || null
        });
        
        if (resultCategoria.success) {
          sucessos++;
          
          // Criar subcategorias selecionadas
          if (categoriaSugerida.subcategorias) {
            for (let i = 0; i < categoriaSugerida.subcategorias.length; i++) {
              const key = `${categoriaId}_${i}`;
              
              if (subcategoriasSelecionadas[key]) {
                await addSubcategoria(resultCategoria.data.id, {
                  nome: categoriaSugerida.subcategorias[i].nome
                });
              }
            }
          }
        } else {
          erros++;
          console.error('Erro ao criar categoria:', categoriaSugerida.nome, resultCategoria.error);
        }
      }
      
      if (sucessos > 0) {
        showFeedback(
          `${sucessos} categoria${sucessos > 1 ? 's' : ''} importada${sucessos > 1 ? 's' : ''} com sucesso!`,
          'success'
        );
        
        // Reset das seleções
        setCategoriasSelecionadas({});
        setSubcategoriasSelecionadas({});
      }
      
      if (erros > 0) {
        showFeedback(
          `${erros} categoria${erros > 1 ? 's' : ''} não puderam ser importadas`,
          'warning'
        );
      }
      
    } catch (error) {
      console.error('Erro durante importação:', error);
      showFeedback('Erro inesperado durante a importação', 'error');
    } finally {
      setImportando(false);
    }
  };
  
  // Renderizar item de categoria individual
  const renderCategoriaItem = (categoria) => {
    const categoriaSelecionada = categoriasSelecionadas[categoria.id] || false;
    const jaExiste = categoriaJaExiste(categoria.nome);
    const subcategoriasCount = categoria.subcategorias?.length || 0;
    const subcategoriasSelecionadasCount = categoria.subcategorias?.filter((_, index) => 
      subcategoriasSelecionadas[`${categoria.id}_${index}`]
    ).length || 0;
    
    return (
      <div key={categoria.id} className={`categoria-sugerida-item ${categoriaSelecionada ? 'selecionada' : ''} ${jaExiste ? 'ja-existe' : ''}`}>
        <div className="categoria-sugerida-header">
          <div className="categoria-info">
            <div className="categoria-checkbox-container">
              <input
                type="checkbox"
                className="categoria-checkbox"
                checked={categoriaSelecionada}
                onChange={(e) => handleToggleCategoria(categoria.id, e.target.checked)}
                disabled={jaExiste}
              />
              <div className="categoria-color" style={{ backgroundColor: categoria.cor }}></div>
              <div className="categoria-details">
                <div className="categoria-nome">
                  {categoria.icone} {categoria.nome}
                  {jaExiste && <span className="ja-existe-badge">JÁ EXISTE</span>}
                </div>
                <div className="subcategorias-info">
                  {subcategoriasCount > 0 && (
                    <span>
                      {subcategoriasCount} subcategoria{subcategoriasCount > 1 ? 's' : ''}
                      {categoriaSelecionada && subcategoriasSelecionadasCount > 0 && (
                        <span className="subcategorias-selecionadas">
                          • {subcategoriasSelecionadasCount} selecionadas
                        </span>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Subcategorias */}
        {categoriaSelecionada && categoria.subcategorias && categoria.subcategorias.length > 0 && (
          <div className="subcategorias-sugeridas">
            <div className="subcategorias-grid">
              {categoria.subcategorias.map((subcategoria, index) => {
                const key = `${categoria.id}_${index}`;
                const subcategoriaSelecionada = subcategoriasSelecionadas[key] || false;
                
                return (
                  <div key={index} className={`subcategoria-sugerida-item ${subcategoriaSelecionada ? 'selecionada' : ''}`}>
                    <label className="subcategoria-label">
                      <input
                        type="checkbox"
                        className="subcategoria-checkbox"
                        checked={subcategoriaSelecionada}
                        onChange={(e) => handleToggleSubcategoria(categoria.id, index, e.target.checked)}
                      />
                      <span className="subcategoria-nome">{subcategoria.nome}</span>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  if (!isOpen) {
    console.log('❌ Modal fechado');
    return null;
  }

  console.log('✅ Renderizando modal completo');
  
  const selecoes = contarSelecoes();

  return (
    <div className="modal-overlay">
      <div className="forms-modal-container modal-large categorias-sugeridas-modal">
        {/* Header usando estilos base */}
        <div className="modal-header">
          <div className="modal-header-content">
            <div className="modal-icon-container modal-icon-warning">
              <Lightbulb size={16} />
            </div>
            <div>
              <h2 className="modal-title">Categorias Sugeridas</h2>
              <p className="modal-subtitle">
                Importe categorias prontas para organizar suas finanças de forma rápida e eficiente
              </p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Feedback usando estilo base */}
        {feedback.show && (
          <div className={`feedback-message ${feedback.type}`}>
            {feedback.message}
          </div>
        )}

        {/* Seletor de tipo */}
        <div className="tipo-selector">
          <button 
            className={`tipo-button ${tipoAtual === 'despesas' ? 'active' : ''}`} 
            onClick={() => setTipoAtual('despesas')}
          >
            💸 Despesas ({categoriasSugeridasData.despesas?.length || 0})
          </button>
          <button 
            className={`tipo-button ${tipoAtual === 'receitas' ? 'active' : ''}`}
            onClick={() => setTipoAtual('receitas')}
          >
            💰 Receitas ({categoriasSugeridasData.receitas?.length || 0})
          </button>
        </div>

        {/* Controles de seleção */}
        <div className="selecao-controls">
          <div className="selecao-info">
            <span className="contador">
              {selecoes.categorias} categorias • {selecoes.subcategorias} subcategorias selecionadas
            </span>
          </div>
          
          <div className="selecao-actions">
            <button 
              className="btn-secondary"
              onClick={() => handleToggleTodasCategorias(true)}
              disabled={categoriasFiltradas.every(cat => categoriaJaExiste(cat.nome))}
            >
              Selecionar todas
            </button>
            <button 
              className="btn-cancel"
              onClick={() => handleToggleTodasCategorias(false)}
            >
              Limpar seleção
            </button>
          </div>
        </div>

        {/* Lista de categorias usando body base */}
        <div className="modal-body categorias-sugeridas-content">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p className="loading-text">Carregando suas categorias...</p>
            </div>
          ) : categoriasFiltradas.length > 0 ? (
            <div className="categorias-sugeridas-list">
              {categoriasFiltradas.map(renderCategoriaItem)}
            </div>
          ) : (
            <div className="empty-state">
              <p>Nenhuma categoria encontrada para este tipo.</p>
            </div>
          )}
        </div>

        {/* Footer usando estilos base */}
        <div className="modal-footer">
          <div className="footer-left">
            {selecoes.categorias > 0 ? (
              <span className="form-label">
                {selecoes.categorias} categoria{selecoes.categorias > 1 ? 's' : ''} e {selecoes.subcategorias} subcategoria{selecoes.subcategorias !== 1 ? 's' : ''} serão importadas
              </span>
            ) : (
              <span className="form-label">
                Selecione as categorias que deseja adicionar ao seu sistema
              </span>
            )}
          </div>
          
          <div className="footer-right">
            <button 
              className="btn-cancel"
              onClick={onClose}
              disabled={importando}
            >
              Cancelar
            </button>
            <button 
              className="btn-primary"
              onClick={handleImportarCategorias}
              disabled={selecoes.categorias === 0 || importando}
            >
              {importando ? (
                <>
                  <div className="btn-spinner"></div>
                  Importando...
                </>
              ) : (
                <>
                  <Plus size={14} />
                  Importar {selecoes.categorias} categoria{selecoes.categorias > 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

CategoriasSugeridasModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default CategoriasSugeridasModal;
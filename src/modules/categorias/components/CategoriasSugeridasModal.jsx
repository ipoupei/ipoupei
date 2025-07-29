import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, Plus, Check, Eye, ChevronDown, ChevronRight } from 'lucide-react';
import useCategorias from '@modules/categorias/hooks/useCategorias';
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
        { nome: 'Plano de Saúde' }
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
 * Modal de Categorias Sugeridas - Versão refatorada seguindo padrões iPoupei
 * Utiliza arquivo CSS separado conforme documentação técnica
 */
const CategoriasSugeridasModal = ({ isOpen, onClose }) => {
  console.log('🎯 CategoriasSugeridasModal renderizado:', { isOpen });
  
  const { addCategoria, addSubcategoria, categorias, loading } = useCategorias();
  
  // Estados para categorias selecionadas
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState({});
  const [subcategoriasSelecionadas, setSubcategoriasSelecionadas] = useState({});
  
  // Estados para controlar expansão das categorias
  const [categoriasExpandidas, setCategoriasExpandidas] = useState({});
  
  // Estados de feedback
  const [feedback, setFeedback] = useState({ show: false, message: '', type: '' });
  const [importando, setImportando] = useState(false);
  
  // Memoizar categorias e subcategorias existentes para performance
  const categoriasExistentes = React.useMemo(() => {
    const existentes = new Set();
    categorias?.forEach(cat => existentes.add(cat.nome.toLowerCase().trim()));
    return existentes;
  }, [categorias]);
  
  const subcategoriasExistentes = React.useMemo(() => {
    const existentes = new Set();
    categorias?.forEach(cat => {
      cat.subcategorias?.forEach(sub => existentes.add(sub.nome.toLowerCase().trim()));
    });
    return existentes;
  }, [categorias]);

  // Reset de estados quando modal abre/fecha
  useEffect(() => {
    if (isOpen) {
      setCategoriasSelecionadas({});
      setSubcategoriasSelecionadas({});
      setCategoriasExpandidas({});
      setFeedback({ show: false, message: '', type: '' });
    }
  }, [isOpen]);

  // Função para mostrar feedback seguindo padrão iPoupei
  const showFeedback = (message, type = 'success') => {
    setFeedback({ show: true, message, type });
    setTimeout(() => {
      setFeedback({ show: false, message: '', type: '' });
    }, 5000);
  };

  // Verificar se categoria já existe (case-insensitive)
  const categoriaJaExiste = (nomeCategoria) => {
    return categoriasExistentes.has(nomeCategoria.toLowerCase().trim());
  };

  // Verificar se subcategoria já existe (case-insensitive)
  const subcategoriaJaExiste = (nomeSubcategoria) => {
    return subcategoriasExistentes.has(nomeSubcategoria.toLowerCase().trim());
  };

  // Toggle expansão de categoria
  const toggleExpansao = (categoriaId) => {
    setCategoriasExpandidas(prev => ({
      ...prev,
      [categoriaId]: !prev[categoriaId]
    }));
  };

  // Toggle seleção de categoria
  const toggleCategoria = (categoriaId, categoria) => {
    if (categoriaJaExiste(categoria.nome)) return;
    
    const novoEstado = !categoriasSelecionadas[categoriaId];
    
    setCategoriasSelecionadas(prev => ({
      ...prev,
      [categoriaId]: novoEstado
    }));

    if (novoEstado) {
      // Selecionar subcategorias disponíveis
      const novasSubcategorias = {};
      categoria.subcategorias?.forEach((subcategoria, index) => {
        const key = `${categoriaId}_${index}`;
        if (!subcategoriaJaExiste(subcategoria.nome)) {
          novasSubcategorias[key] = true;
        }
      });
      
      setSubcategoriasSelecionadas(prev => ({
        ...prev,
        ...novasSubcategorias
      }));
      
      // Expandir automaticamente quando selecionar
      setCategoriasExpandidas(prev => ({
        ...prev,
        [categoriaId]: true
      }));
    } else {
      // Desmarcar todas as subcategorias desta categoria
      setSubcategoriasSelecionadas(prev => {
        const novoEstado = { ...prev };
        categoria.subcategorias?.forEach((_, index) => {
          delete novoEstado[`${categoriaId}_${index}`];
        });
        return novoEstado;
      });
    }
  };

  // Toggle seleção de subcategoria
  const toggleSubcategoria = (categoriaId, subcategoriaIndex, subcategoria) => {
    const key = `${categoriaId}_${subcategoriaIndex}`;
    if (subcategoriaJaExiste(subcategoria.nome)) return;
    
    setSubcategoriasSelecionadas(prev => {
      const novoEstado = {
        ...prev,
        [key]: !prev[key]
      };
      
      // Se selecionou subcategoria, marcar categoria pai também
      if (novoEstado[key]) {
        setCategoriasSelecionadas(prevCat => ({
          ...prevCat,
          [categoriaId]: true
        }));
      }
      
      return novoEstado;
    });
  };

  // Função principal de importação
  const handleImportar = async () => {
    const categoriasParaImportar = [];
    
    // Processar categorias de despesas e receitas
    Object.entries(categoriasSugeridasData).forEach(([tipo, categorias]) => {
      categorias.forEach(categoria => {
        const categoriaExiste = categoriaJaExiste(categoria.nome);
        const categoriaSelecionada = categoriasSelecionadas[categoria.id];
        
        // Verificar subcategorias selecionadas
        const subcategoriasParaImportar = [];
        categoria.subcategorias?.forEach((subcategoria, index) => {
          const key = `${categoria.id}_${index}`;
          const subcategoriaSelecionada = subcategoriasSelecionadas[key];
          const subcategoriaExiste = subcategoriaJaExiste(subcategoria.nome);
          
          if (subcategoriaSelecionada && !subcategoriaExiste) {
            subcategoriasParaImportar.push(subcategoria);
          }
        });

        // Adicionar categoria para importação se necessário
        if ((categoriaSelecionada && !categoriaExiste) || subcategoriasParaImportar.length > 0) {
          categoriasParaImportar.push({
            ...categoria,
            tipo: tipo === 'despesas' ? 'despesa' : 'receita',
            isExistente: categoriaExiste,
            subcategorias: subcategoriasParaImportar
          });
        }
      });
    });

    if (categoriasParaImportar.length === 0) {
      showFeedback('Selecione pelo menos uma categoria ou subcategoria para importar', 'error');
      return;
    }

    setImportando(true);

    try {
      let sucessos = 0;
      let erros = 0;

      for (const catParaImportar of categoriasParaImportar) {
        try {
          if (!catParaImportar.isExistente) {
            // Criar nova categoria
            const resultCategoria = await addCategoria({
              nome: catParaImportar.nome,
              tipo: catParaImportar.tipo,
              cor: catParaImportar.cor,
              icone: catParaImportar.icone || null
            });

            if (resultCategoria.success) {
              sucessos++;
              
              // Criar subcategorias da nova categoria
              for (const subcategoria of catParaImportar.subcategorias) {
                try {
                  await addSubcategoria(resultCategoria.data.id, {
                    nome: subcategoria.nome
                  });
                } catch (error) {
                  console.error('Erro ao criar subcategoria:', error);
                  erros++;
                }
              }
            } else {
              erros++;
              console.error('Erro ao criar categoria:', catParaImportar.nome, resultCategoria.error);
            }
          } else {
            // Adicionar subcategorias a categoria existente
            const categoriaExistente = categorias.find(cat => 
              cat.nome.toLowerCase().trim() === catParaImportar.nome.toLowerCase().trim()
            );
            
            if (categoriaExistente) {
              for (const subcategoria of catParaImportar.subcategorias) {
                try {
                  await addSubcategoria(categoriaExistente.id, {
                    nome: subcategoria.nome
                  });
                  sucessos++;
                } catch (error) {
                  console.error('Erro ao criar subcategoria:', error);
                  erros++;
                }
              }
            }
          }
        } catch (error) {
          console.error('Erro ao processar categoria:', catParaImportar.nome, error);
          erros++;
        }
      }

      // Feedback baseado em resultados
      if (sucessos > 0) {
        showFeedback(
          `${sucessos} item${sucessos > 1 ? 's' : ''} importado${sucessos > 1 ? 's' : ''} com sucesso!`,
          'success'
        );
        
        // Reset de seleções após sucesso
        setCategoriasSelecionadas({});
        setSubcategoriasSelecionadas({});
        setCategoriasExpandidas({});
      }

      if (erros > 0) {
        showFeedback(
          `${erros} item${erros > 1 ? 's' : ''} não puderam ser importados`,
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

  // Contador de itens selecionados
  const contarSelecionados = () => {
    const categorias = Object.values(categoriasSelecionadas).filter(Boolean).length;
    const subcategorias = Object.values(subcategoriasSelecionadas).filter(Boolean).length;
    return categorias + subcategorias;
  };

  // Renderizar item de categoria individual
  const renderCategoriaItem = (categoria, tipo) => {
    const categoriaExiste = categoriaJaExiste(categoria.nome);
    const categoriaSelecionada = categoriasSelecionadas[categoria.id] || false;
    const expandida = categoriasExpandidas[categoria.id] || false;

    return (
      <div key={categoria.id} className="category-item">
        <div className="category-row">
          <button
            onClick={() => toggleExpansao(categoria.id)}
            className="expand-button"
            aria-label={`${expandida ? 'Recolher' : 'Expandir'} categoria ${categoria.nome}`}
          >
            {expandida ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          <div 
            className="category-icon"
            style={{ backgroundColor: categoria.cor }}
            aria-hidden="true"
          >
            {categoria.icone}
          </div>

          <div className="category-info">
            <div className="category-name">{categoria.nome}</div>
            <div className="category-count">
              {categoria.subcategorias?.length || 0} subcategorias
            </div>
          </div>

          <div className="category-status">
            {categoriaExiste && (
              <span className="exists-badge">Já existe</span>
            )}
            
            <div className="checkbox-wrapper">
              <input
                type="checkbox"
                checked={categoriaSelecionada || categoriaExiste} // ✅ ADICIONAR: || categoriaExiste
                onChange={() => toggleCategoria(categoria.id, categoria)}
                disabled={categoriaExiste}
                className="category-checkbox"
                aria-label={`Selecionar categoria ${categoria.nome}`}
              />
              <div className="checkbox-custom"></div>
            </div>
          </div>
        </div>

        {expandida && categoria.subcategorias && (
          <div className="subcategories-list">
            {categoria.subcategorias.map((subcategoria, index) => {
              const key = `${categoria.id}_${index}`;
              const subcategoriaExiste = subcategoriaJaExiste(subcategoria.nome);
              const subcategoriaSelecionada = subcategoriasSelecionadas[key] || false;

              return (
                <div key={index} className="subcategory-item">
                  <span className="subcategory-name">{subcategoria.nome}</span>
                  
                  <div className="checkbox-wrapper">
                    <input
                      type="checkbox"
                      checked={subcategoriaSelecionada || subcategoriaExiste} // ✅ ADICIONAR: || subcategoriaExiste
                      onChange={() => toggleSubcategoria(categoria.id, index, subcategoria)}
                      disabled={subcategoriaExiste}
                      className="subcategory-checkbox"
                      aria-label={`Selecionar subcategoria ${subcategoria.nome}`}
                    />
                    <div className="checkbox-custom"></div>
                  </div>
                </div>
              );
            })}
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

  return (
    <div className="modal-overlay categorias-sugeridas-modal" data-modal="categorias-sugeridas">
      <div className="modal-container">
        {/* Header Simples seguindo padrão iPoupei */}
        <div className="modal-header-simple">
          <div className="modal-header-simple-content">
            <Plus size={20} />
            <h2>Importar Categorias Sugeridas</h2>
          </div>
          <button 
            onClick={onClose} 
            className="modal-close-simple"
            aria-label="Fechar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Feedback Messages */}
        {feedback.show && (
          <div className={`feedback-message ${feedback.type}`}>
            {feedback.message}
          </div>
        )}

        {/* Info Box */}
        <div className="modal-info-box">
          <Eye size={16} />
          <span>Selecione as categorias e subcategorias que deseja adicionar ao seu sistema</span>
        </div>

        {/* Content */}
        <div className="modal-body-simple">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p className="loading-text">Carregando suas categorias...</p>
            </div>
          ) : (
            <>
              {/* Seção Despesas */}
              <div className="section-wrapper">
                <div className="section-header-simple">
                  <div className="section-indicator"></div>
                  <div className="section-icon">💸</div>
                  <h3>Categorias de Despesas</h3>
                </div>

                <div className="categories-container">
                  {categoriasSugeridasData.despesas.map(categoria => 
                    renderCategoriaItem(categoria, 'despesas')
                  )}
                </div>
              </div>

              {/* Seção Receitas */}
              <div className="section-wrapper">
                <div className="section-header-simple">
                  <div className="section-indicator section-indicator-receitas"></div>
                  <div className="section-icon">💰</div>
                  <h3>Categorias de Receitas</h3>
                </div>

                <div className="categories-container">
                  {categoriasSugeridasData.receitas.map(categoria => 
                    renderCategoriaItem(categoria, 'receitas')
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer seguindo padrão iPoupei */}
        <div className="modal-footer-simple">
          <div className="selection-counter">
            <Check size={16} />
            <span>{contarSelecionados()} itens selecionados</span>
          </div>
          
          <div className="footer-actions">
            <button 
              onClick={onClose} 
              className="btn-cancel-simple"
              disabled={importando}
            >
              Cancelar
            </button>
            <button 
              onClick={handleImportar} 
              className="btn-primary-simple"
              disabled={contarSelecionados() === 0 || importando}
            >
              {importando ? (
                <>
                  <div className="btn-spinner"></div>
                  Importando...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Importar Selecionados
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
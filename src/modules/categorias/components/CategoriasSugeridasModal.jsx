// src/modules/categorias/components/CategoriasSugeridasModal.jsx

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import useCategorias from '@modules/categorias/hooks/useCategorias';
import { categoriasSugeridasData } from '@modules/categorias/data/categoriasSugeridas';
import CategoriasSugeridasItem from './CategoriasSugeridasItem';
import '@modules/categorias/styles/CategoriasSugeridasModal.css';

/**
 * Modal para exibir categorias sugeridas e permitir importação
 * O usuário pode selecionar quais categorias e subcategorias deseja importar
 */
const CategoriasSugeridasModal = ({ isOpen, onClose }) => {
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
  
  if (!isOpen) return null;
  
  const selecoes = contarSelecoes();

  return (
    <div className="modal-overlay">
      <div className="categorias-sugeridas-modal">
        <div className="modal-header">
          <h2>Categorias Sugeridas</h2>
          <p className="modal-subtitle">
            Selecione as categorias que deseja importar para seu sistema
          </p>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Feedback */}
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
            🚨 Despesas ({categoriasSugeridasData.despesas?.length || 0})
          </button>
          <button 
            className={`tipo-button ${tipoAtual === 'receitas' ? 'active' : ''}`}
            onClick={() => setTipoAtual('receitas')}
          >
            ✅ Receitas ({categoriasSugeridasData.receitas?.length || 0})
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
              className="button-small secondary"
              onClick={() => handleToggleTodasCategorias(true)}
            >
              Selecionar todas
            </button>
            <button 
              className="button-small secondary"
              onClick={() => handleToggleTodasCategorias(false)}
            >
              Limpar seleção
            </button>
          </div>
        </div>

        {/* Lista de categorias */}
        <div className="categorias-sugeridas-content">
          {loading ? (
            <div className="loading">
              <div className="loading-spinner"></div>
              <p>Carregando suas categorias...</p>
            </div>
          ) : categoriasFiltradas.length > 0 ? (
            <div className="categorias-sugeridas-list">
              {categoriasFiltradas.map(categoria => (
                <CategoriasSugeridasItem
                  key={categoria.id}
                  categoria={categoria}
                  tipoAtual={tipoAtual}
                  categoriaSelecionada={categoriasSelecionadas[categoria.id] || false}
                  subcategoriasSelecionadas={subcategoriasSelecionadas}
                  onToggleCategoria={handleToggleCategoria}
                  onToggleSubcategoria={handleToggleSubcategoria}
                  categoriaJaExiste={categoriaJaExiste(categoria.nome)}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>Nenhuma categoria encontrada para este tipo.</p>
            </div>
          )}
        </div>

        {/* Footer com ações */}
        <div className="modal-footer">
          <div className="footer-info">
            {selecoes.categorias > 0 && (
              <span className="selecoes-resumo">
                {selecoes.categorias} categoria{selecoes.categorias > 1 ? 's' : ''} e {selecoes.subcategorias} subcategoria{selecoes.subcategorias !== 1 ? 's' : ''} serão importadas
              </span>
            )}
          </div>
          
          <div className="footer-actions">
            <button 
              className="button secondary"
              onClick={onClose}
              disabled={importando}
            >
              Cancelar
            </button>
            <button 
              className="button primary"
              onClick={handleImportarCategorias}
              disabled={selecoes.categorias === 0 || importando}
            >
              {importando ? 'Importando...' : `Importar ${selecoes.categorias} categoria${selecoes.categorias > 1 ? 's' : ''}`}
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
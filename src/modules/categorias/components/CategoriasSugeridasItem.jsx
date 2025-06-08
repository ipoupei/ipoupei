// src/modules/categorias/components/CategoriasSugeridasItem.jsx

import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Componente que representa um item de categoria sugerida
 * Permite selecionar a categoria e suas subcategorias
 */
const CategoriasSugeridasItem = ({
  categoria,
  tipoAtual,
  categoriaSelecionada,
  subcategoriasSelecionadas,
  onToggleCategoria,
  onToggleSubcategoria,
  categoriaJaExiste
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Handler para expandir/colapsar
  const handleToggleExpand = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };
  
  // Handler para checkbox da categoria
  const handleCategoriaChange = (e) => {
    e.stopPropagation();
    if (!categoriaJaExiste) {
      onToggleCategoria(categoria.id, e.target.checked);
    }
  };
  
  // Handler para checkbox da subcategoria
  const handleSubcategoriaChange = (subcategoriaIndex, checked) => {
    if (!categoriaJaExiste) {
      onToggleSubcategoria(categoria.id, subcategoriaIndex, checked);
    }
  };
  
  // Conta quantas subcategorias estão selecionadas
  const subcategoriasSelecionadasCount = categoria.subcategorias?.reduce((count, _, index) => {
    const key = `${categoria.id}_${index}`;
    return subcategoriasSelecionadas[key] ? count + 1 : count;
  }, 0) || 0;
  
  // Determina se todas as subcategorias estão selecionadas
  const todasSubcategoriasSelecionadas = categoria.subcategorias?.length > 0 && 
    subcategoriasSelecionadasCount === categoria.subcategorias.length;
  
  // Determina se algumas subcategorias estão selecionadas
  const algumasSubcategoriasSelecionadas = subcategoriasSelecionadasCount > 0 && 
    subcategoriasSelecionadasCount < (categoria.subcategorias?.length || 0);

  return (
    <div className={`categoria-sugerida-item ${categoriaJaExiste ? 'ja-existe' : ''} ${categoriaSelecionada ? 'selecionada' : ''}`}>
      <div className="categoria-sugerida-header" onClick={handleToggleExpand}>
        <div className="categoria-info">
          <div className="categoria-checkbox-container">
            <input
              type="checkbox"
              checked={categoriaSelecionada || false}
              onChange={handleCategoriaChange}
              disabled={categoriaJaExiste}
              onClick={(e) => e.stopPropagation()}
              className="categoria-checkbox"
            />
            
            <div 
              className="categoria-color" 
              style={{ backgroundColor: categoria.cor }}
            ></div>
            
            <div className="categoria-details">
              <span className="categoria-nome">
                {categoria.nome}
                {categoriaJaExiste && (
                  <span className="ja-existe-badge">Já existe</span>
                )}
              </span>
              
              <span className="subcategorias-info">
                {categoria.subcategorias?.length || 0} subcategorias
                {subcategoriasSelecionadasCount > 0 && !categoriaJaExiste && (
                  <span className="subcategorias-selecionadas">
                    • {subcategoriasSelecionadasCount} selecionadas
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
        
        <div className="expand-controls">
          {!categoriaJaExiste && categoria.subcategorias?.length > 0 && (
            <div className="subcategorias-actions">
              {categoriaSelecionada && (
                <>
                  <button
                    type="button"
                    className="button-tiny"
                    onClick={(e) => {
                      e.stopPropagation();
                      categoria.subcategorias.forEach((_, index) => {
                        handleSubcategoriaChange(index, true);
                      });
                    }}
                    disabled={todasSubcategoriasSelecionadas}
                  >
                    Todas
                  </button>
                  <button
                    type="button"
                    className="button-tiny secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      categoria.subcategorias.forEach((_, index) => {
                        handleSubcategoriaChange(index, false);
                      });
                    }}
                    disabled={subcategoriasSelecionadasCount === 0}
                  >
                    Nenhuma
                  </button>
                </>
              )}
            </div>
          )}
          
          <button className="expand-icon" type="button">
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>
      </div>
      
      {isExpanded && categoria.subcategorias && categoria.subcategorias.length > 0 && (
        <div className="subcategorias-sugeridas">
          <div className="subcategorias-grid">
            {categoria.subcategorias.map((subcategoria, index) => {
              const key = `${categoria.id}_${index}`;
              const isSelected = subcategoriasSelecionadas[key] || false;
              
              return (
                <div key={index} className={`subcategoria-sugerida-item ${isSelected ? 'selecionada' : ''}`}>
                  <label className="subcategoria-label">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleSubcategoriaChange(index, e.target.checked)}
                      disabled={categoriaJaExiste || !categoriaSelecionada}
                      className="subcategoria-checkbox"
                    />
                    <span className="subcategoria-nome">
                      {subcategoria.nome}
                    </span>
                  </label>
                </div>
              );
            })}
          </div>
          
          {!categoriaJaExiste && !categoriaSelecionada && (
            <div className="subcategorias-disabled-message">
              <small>Selecione a categoria para escolher suas subcategorias</small>
            </div>
          )}
        </div>
      )}
      
      {isExpanded && (!categoria.subcategorias || categoria.subcategorias.length === 0) && (
        <div className="sem-subcategorias">
          <small>Esta categoria não possui subcategorias predefinidas</small>
        </div>
      )}
    </div>
  );
};

CategoriasSugeridasItem.propTypes = {
  categoria: PropTypes.shape({
    id: PropTypes.string.isRequired,
    nome: PropTypes.string.isRequired,
    cor: PropTypes.string.isRequired,
    icone: PropTypes.string,
    subcategorias: PropTypes.arrayOf(
      PropTypes.shape({
        nome: PropTypes.string.isRequired
      })
    )
  }).isRequired,
  tipoAtual: PropTypes.string.isRequired,
  categoriaSelecionada: PropTypes.bool.isRequired,
  subcategoriasSelecionadas: PropTypes.object.isRequired,
  onToggleCategoria: PropTypes.func.isRequired,
  onToggleSubcategoria: PropTypes.func.isRequired,
  categoriaJaExiste: PropTypes.bool.isRequired
};

export default CategoriasSugeridasItem;
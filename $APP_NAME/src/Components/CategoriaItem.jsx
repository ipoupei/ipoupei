import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FaChevronDown, FaChevronRight, FaTrash, FaEdit, FaPen } from 'react-icons/fa';

/**
 * Componente que representa um item de categoria na lista
 * Permite expandir para mostrar subcategorias e acessar ações
 * 
 * @param {Object} props - Propriedades do componente
 * @param {Object} props.categoria - Dados da categoria
 * @param {boolean} props.isSelected - Se a categoria está selecionada
 * @param {Function} props.onSelect - Função chamada ao selecionar a categoria
 * @param {Function} props.onEdit - Função chamada ao editar a categoria
 * @param {Function} props.onDelete - Função chamada ao excluir a categoria
 * @param {Function} props.onEditSubcategoria - Função chamada ao editar uma subcategoria
 * @param {Function} props.onDeleteSubcategoria - Função chamada ao excluir uma subcategoria
 */
const CategoriaItem = ({ 
  categoria, 
  isSelected, 
  onSelect, 
  onEdit, 
  onDelete,
  onEditSubcategoria,
  onDeleteSubcategoria
}) => {
  const [isExpanded, setIsExpanded] = useState(isSelected);
  
  // Expandir ou colapsar subcategorias
  const toggleExpand = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
    
    if (!isExpanded) {
      onSelect(); // Seleciona a categoria ao expandir
    }
  };

  return (
    <div className={`categoria-item ${isSelected ? 'selected' : ''}`}>
      <div 
        className="categoria-header" 
        onClick={onSelect}
        style={{ borderLeftColor: categoria.cor }}
      >
        <div className="expand-icon" onClick={toggleExpand}>
          {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
        </div>
        
        <div className="categoria-color" style={{ backgroundColor: categoria.cor }} />
        
        <div className="categoria-nome">
          {categoria.nome} 
          <span className="subcategoria-count">
            ({categoria.subcategorias?.length || 0})
          </span>
        </div>
        
        <div className="categoria-actions">
          <button 
            className="icon-button edit" 
            onClick={(e) => { 
              e.stopPropagation();
              onEdit();
            }}
            title="Editar categoria"
          >
            <FaEdit />
          </button>
          <button 
            className="icon-button delete" 
            onClick={(e) => { 
              e.stopPropagation();
              onDelete();
            }}
            title="Excluir categoria"
          >
            <FaTrash />
          </button>
        </div>
      </div>
      
      {isExpanded && categoria.subcategorias && categoria.subcategorias.length > 0 && (
        <div className="subcategorias-list">
          {categoria.subcategorias.map((subcategoria) => (
            <div key={subcategoria.id} className="subcategoria-item">
              <div className="subcategoria-nome">{subcategoria.nome}</div>
              <div className="subcategoria-actions">
                <button 
                  className="icon-button edit-small" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditSubcategoria(subcategoria);
                  }}
                  title="Editar subcategoria"
                >
                  <FaPen />
                </button>
                <button 
                  className="icon-button delete-small" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSubcategoria(subcategoria.id);
                  }}
                  title="Excluir subcategoria"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {isExpanded && (!categoria.subcategorias || categoria.subcategorias.length === 0) && (
        <div className="subcategorias-empty">
          <p>Nenhuma subcategoria encontrada</p>
        </div>
      )}
    </div>
  );
};

CategoriaItem.propTypes = {
  categoria: PropTypes.shape({
    id: PropTypes.string.isRequired,
    nome: PropTypes.string.isRequired,
    cor: PropTypes.string,
    subcategorias: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        nome: PropTypes.string.isRequired,
        parentId: PropTypes.string.isRequired
      })
    )
  }).isRequired,
  isSelected: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onEditSubcategoria: PropTypes.func.isRequired,
  onDeleteSubcategoria: PropTypes.func.isRequired
};

export default CategoriaItem;
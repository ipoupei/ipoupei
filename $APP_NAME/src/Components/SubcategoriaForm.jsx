import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Formulário para criar ou editar uma subcategoria
 * 
 * @param {Object} props - Propriedades do componente
 * @param {Object} props.subcategoriaInicial - Dados da subcategoria para edição (opcional)
 * @param {Object} props.categoriaParent - Categoria pai a qual a subcategoria pertence
 * @param {Function} props.onSave - Função chamada ao salvar o formulário
 * @param {Function} props.onCancel - Função chamada ao cancelar o formulário
 */
const SubcategoriaForm = ({ 
  subcategoriaInicial, 
  categoriaParent, 
  onSave, 
  onCancel 
}) => {
  const [nome, setNome] = useState('');
  const [error, setError] = useState('');
  
  // Preenche o formulário com dados existentes ao editar
  useEffect(() => {
    if (subcategoriaInicial) {
      setNome(subcategoriaInicial.nome || '');
    }
  }, [subcategoriaInicial]);

  // Validar o formulário
  const validarForm = () => {
    // Limpa o erro anterior
    setError('');
    
    // Verifica se o nome foi preenchido
    if (!nome.trim()) {
      setError('O nome da subcategoria é obrigatório');
      return false;
    }
    
    return true;
  };

  // Handler para submissão do formulário
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validarForm()) return;
    
    const dadosSubcategoria = {
      nome: nome.trim()
    };
    
    onSave(dadosSubcategoria);
    resetForm();
  };

  // Resetar o formulário
  const resetForm = () => {
    setNome('');
    setError('');
  };

  return (
    <div className="subcategoria-form">
      <h3>
        {subcategoriaInicial ? 'Editar Subcategoria' : 'Nova Subcategoria'}
        {categoriaParent && (
          <span className="parent-categoria">
            - {categoriaParent.nome}
          </span>
        )}
      </h3>
      
      <form onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-group">
          <label htmlFor="subcategoria-nome">Nome*</label>
          <input 
            type="text" 
            id="subcategoria-nome" 
            value={nome} 
            onChange={(e) => setNome(e.target.value)}
            className="form-input"
            placeholder="Nome da subcategoria"
            autoFocus
            maxLength={30}
          />
        </div>
        
        {categoriaParent && (
          <div className="form-group">
            <label>Categoria pai</label>
            <div className="parent-info">
              <div 
                className="parent-color" 
                style={{ backgroundColor: categoriaParent.cor }}
              />
              <span className="parent-name">{categoriaParent.nome}</span>
            </div>
          </div>
        )}
        
        <div className="form-actions">
          <button 
            type="button" 
            className="button secondary" 
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            className="button primary"
          >
            {subcategoriaInicial ? 'Atualizar' : 'Criar'}
          </button>
        </div>
      </form>
    </div>
  );
};

SubcategoriaForm.propTypes = {
  subcategoriaInicial: PropTypes.shape({
    id: PropTypes.string,
    nome: PropTypes.string,
    parentId: PropTypes.string
  }),
  categoriaParent: PropTypes.shape({
    id: PropTypes.string.isRequired,
    nome: PropTypes.string.isRequired,
    cor: PropTypes.string
  }),
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default SubcategoriaForm;
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Formulário para criar ou editar uma categoria
 * 
 * @param {Object} props - Propriedades do componente
 * @param {Object} props.categoriaInicial - Dados da categoria para edição (opcional)
 * @param {Function} props.onSave - Função chamada ao salvar o formulário
 * @param {Function} props.onCancel - Função chamada ao cancelar o formulário
 */
const CategoriaForm = ({ categoriaInicial, onSave, onCancel }) => {
  const [nome, setNome] = useState('');
  const [cor, setCor] = useState('#3498db');
  const [error, setError] = useState('');
  
  // Preenche o formulário com dados existentes ao editar
  useEffect(() => {
    if (categoriaInicial) {
      setNome(categoriaInicial.nome || '');
      setCor(categoriaInicial.cor || '#3498db');
    }
  }, [categoriaInicial]);

  // Validar o formulário
  const validarForm = () => {
    // Limpa o erro anterior
    setError('');
    
    // Verifica se o nome foi preenchido
    if (!nome.trim()) {
      setError('O nome da categoria é obrigatório');
      return false;
    }
    
    return true;
  };

  // Handler para submissão do formulário
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validarForm()) return;
    
    const dadosCategoria = {
      nome: nome.trim(),
      cor
    };
    
    onSave(dadosCategoria);
    resetForm();
  };

  // Resetar o formulário
  const resetForm = () => {
    setNome('');
    setCor('#3498db');
    setError('');
  };

  // Cores pré-definidas para seleção rápida
  const coresPredefinidas = [
    '#3498db', // Azul
    '#2ecc71', // Verde
    '#e74c3c', // Vermelho
    '#f39c12', // Laranja
    '#9b59b6', // Roxo
    '#1abc9c', // Verde-água
    '#34495e', // Azul escuro
    '#e67e22', // Laranja escuro
    '#95a5a6', // Cinza
    '#16a085', // Verde escuro
    '#27ae60', // Verde médio
    '#d35400', // Laranja avermelhado
    '#8e44ad', // Roxo escuro
    '#2c3e50', // Azul marinho
    '#f1c40f'  // Amarelo
  ];

  return (
    <div className="categoria-form">
      <h3>{categoriaInicial ? 'Editar Categoria' : 'Nova Categoria'}</h3>
      
      <form onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-group">
          <label htmlFor="nome">Nome*</label>
          <input 
            type="text" 
            id="nome" 
            value={nome} 
            onChange={(e) => setNome(e.target.value)}
            className="form-input"
            placeholder="Nome da categoria"
            autoFocus
            maxLength={30}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="cor">Cor</label>
          <div className="color-input-container">
            <input 
              type="color" 
              id="cor" 
              value={cor} 
              onChange={(e) => setCor(e.target.value)}
              className="color-input"
            />
            <div 
              className="color-preview" 
              style={{ backgroundColor: cor }}
            />
            <span className="color-value">{cor}</span>
          </div>
          
          <div className="color-presets">
            {coresPredefinidas.map((corPreset) => (
              <button
                key={corPreset}
                type="button"
                className={`color-preset ${cor === corPreset ? 'selected' : ''}`}
                style={{ backgroundColor: corPreset }}
                onClick={() => setCor(corPreset)}
                title={corPreset}
              />
            ))}
          </div>
        </div>
        
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
            {categoriaInicial ? 'Atualizar' : 'Criar'}
          </button>
        </div>
      </form>
    </div>
  );
};

CategoriaForm.propTypes = {
  categoriaInicial: PropTypes.shape({
    id: PropTypes.string,
    nome: PropTypes.string,
    cor: PropTypes.string
  }),
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default CategoriaForm;
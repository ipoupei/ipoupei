import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import useCategorias from '../hooks/useCategorias';
import './CategoriasModal.css';

/**
 * Modal para gerenciamento de categorias e subcategorias
 */
const CategoriasModal = ({ isOpen, onClose }) => {
  // Obter dados das categorias do hook existente
  const { 
    categorias, 
    loading, 
    addCategoria, 
    addSubcategoria, 
    updateCategoria, 
    updateSubcategoria, 
    deleteCategoria, 
    deleteSubcategoria 
  } = useCategorias();
  
  // Estado para controlar o tipo atual (despesa/receita)
  const [tipoAtual, setTipoAtual] = useState('despesa');
  const [categoriasFiltradas, setCategoriasFiltradas] = useState([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState(null);
  
  // Estados para formulários
  const [showFormCategoria, setShowFormCategoria] = useState(false);
  const [showFormSubcategoria, setShowFormSubcategoria] = useState(false);
  const [novaCategoriaNome, setNovaCategoriaNome] = useState('');
  const [novaCategoriaColor, setNovaCategoriaColor] = useState('#3498db');
  const [novaSubcategoriaNome, setNovaSubcategoriaNome] = useState('');
  
  // Estados para edição
  const [editandoCategoria, setEditandoCategoria] = useState(null);
  const [editandoSubcategoria, setEditandoSubcategoria] = useState(null);
  
  // Cores predefinidas para seleção
  const coresPredefinidas = [
    '#FF5733', // Vermelho
    '#33A8FF', // Azul
    '#FF33A8', // Rosa
    '#A833FF', // Roxo
    '#33FF57', // Verde claro
    '#57FF33', // Lima
    '#33FFC1', // Verde-água
    '#C133FF', // Roxo-rosa
    '#FF8333', // Laranja
    '#337DFF'  // Azul escuro
  ];
  
  // Função para resetar formulários
  const resetarFormularios = () => {
    setShowFormCategoria(false);
    setShowFormSubcategoria(false);
    setNovaCategoriaNome('');
    setNovaCategoriaColor('#3498db');
    setNovaSubcategoriaNome('');
    setEditandoCategoria(null);
    setEditandoSubcategoria(null);
  };
  
  // Filtrar categorias com base no tipo selecionado
  useEffect(() => {
    if (categorias && categorias.length > 0) {
      const filtradas = categorias.filter(cat => cat.tipo === tipoAtual);
      setCategoriasFiltradas(filtradas);
    } else {
      setCategoriasFiltradas([]);
    }
    
    // Resetar seleção ao trocar tipo
    setCategoriaSelecionada(null);
    resetarFormularios();
  }, [categorias, tipoAtual]);
  
  // Se o modal não estiver aberto, não renderiza nada
  if (!isOpen) return null;

  // Handler para alternar entre tipos
  const handleChangeTipo = (tipo) => {
    setTipoAtual(tipo);
    resetarFormularios();
  };
  
  // Handler para selecionar uma categoria
  const handleSelectCategoria = (id) => {
    if (id === categoriaSelecionada) {
      setCategoriaSelecionada(null);
    } else {
      setCategoriaSelecionada(id);
    }
    resetarFormularios();
  };
  
  // Abrir formulário de nova categoria
  const handleNovaCategoria = () => {
    resetarFormularios();
    setShowFormCategoria(true);
    setNovaCategoriaNome('');
    setNovaCategoriaColor('#3498db');
  };
  
  // Abrir formulário de nova subcategoria
  const handleNovaSubcategoria = (categoriaId) => {
    if (!categoriaId) return;
    
    resetarFormularios();
    setCategoriaSelecionada(categoriaId);
    setShowFormSubcategoria(true);
    setNovaSubcategoriaNome('');
  };
  
  // Abrir formulário de edição de categoria
  const handleEditarCategoria = (categoria) => {
    resetarFormularios();
    setShowFormCategoria(true);
    setEditandoCategoria(categoria);
    setNovaCategoriaNome(categoria.nome);
    setNovaCategoriaColor(categoria.cor || '#3498db');
  };
  
  // Abrir formulário de edição de subcategoria
  const handleEditarSubcategoria = (categoriaId, subcategoria) => {
    resetarFormularios();
    setShowFormSubcategoria(true);
    setEditandoSubcategoria(subcategoria);
    setNovaSubcategoriaNome(subcategoria.nome);
    setCategoriaSelecionada(categoriaId);
  };
  
  // Salvar categoria (nova ou editada)
  const handleSalvarCategoria = () => {
    if (!novaCategoriaNome.trim()) {
      alert('O nome da categoria é obrigatório');
      return;
    }
    
    if (editandoCategoria) {
      // Atualizar categoria existente
      updateCategoria(editandoCategoria.id, {
        nome: novaCategoriaNome,
        cor: novaCategoriaColor
      });
    } else {
      // Adicionar nova categoria
      addCategoria({
        nome: novaCategoriaNome,
        tipo: tipoAtual,
        cor: novaCategoriaColor
      });
    }
    
    resetarFormularios();
  };
  
  // Salvar subcategoria (nova ou editada)
  const handleSalvarSubcategoria = () => {
    if (!novaSubcategoriaNome.trim()) {
      alert('O nome da subcategoria é obrigatório');
      return;
    }
    
    if (editandoSubcategoria) {
      // Atualizar subcategoria existente
      updateSubcategoria(
        categoriaSelecionada, 
        editandoSubcategoria.id, 
        { nome: novaSubcategoriaNome }
      );
    } else {
      // Adicionar nova subcategoria
      addSubcategoria(
        categoriaSelecionada, 
        { nome: novaSubcategoriaNome }
      );
    }
    
    resetarFormularios();
  };
  
  // Handler para excluir categoria
  const handleExcluirCategoria = (categoriaId) => {
    if (window.confirm('Tem certeza que deseja excluir esta categoria?')) {
      deleteCategoria(categoriaId);
      if (categoriaId === categoriaSelecionada) {
        setCategoriaSelecionada(null);
      }
    }
  };
  
  // Handler para excluir subcategoria
  const handleExcluirSubcategoria = (categoriaId, subcategoriaId) => {
    if (window.confirm('Tem certeza que deseja excluir esta subcategoria?')) {
      deleteSubcategoria(categoriaId, subcategoriaId);
    }
  };
  
  // Formulário de categoria
  const renderFormCategoria = () => {
    return (
      <div className="form-categoria">
        <h3>{editandoCategoria ? 'Editar Categoria' : 'Nova Categoria'}</h3>
        
        <div className="form-group">
          <label htmlFor="categoria-nome">Nome</label>
          <input
            type="text"
            id="categoria-nome"
            value={novaCategoriaNome}
            onChange={(e) => setNovaCategoriaNome(e.target.value)}
            placeholder="Digite o nome da categoria"
            autoFocus
          />
        </div>
        
        <div className="form-group">
          <label>Cor</label>
          <div className="color-input-container">
            <input
              type="color"
              value={novaCategoriaColor}
              onChange={(e) => setNovaCategoriaColor(e.target.value)}
              className="color-picker"
            />
            <div className="color-preview" style={{ backgroundColor: novaCategoriaColor }}></div>
          </div>
          
          <div className="cores-container">
            {coresPredefinidas.map(cor => (
              <button
                key={cor}
                type="button"
                className={`cor-item ${cor === novaCategoriaColor ? 'selected' : ''}`}
                style={{ backgroundColor: cor }}
                onClick={() => setNovaCategoriaColor(cor)}
              />
            ))}
          </div>
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className="button secondary"
            onClick={resetarFormularios}
          >
            Cancelar
          </button>
          <button 
            type="button" 
            className="button primary"
            onClick={handleSalvarCategoria}
          >
            {editandoCategoria ? 'Atualizar' : 'Salvar'}
          </button>
        </div>
      </div>
    );
  };
  
  // Formulário de subcategoria
  const renderFormSubcategoria = () => {
    const categoriaParent = categorias.find(cat => cat.id === categoriaSelecionada);
    
    return (
      <div className="form-subcategoria">
        <h3>
          {editandoSubcategoria ? 'Editar Subcategoria' : 'Nova Subcategoria'}
          {categoriaParent && (
            <span className="parent-categoria"> - {categoriaParent.nome}</span>
          )}
        </h3>
        
        <div className="form-group">
          <label htmlFor="subcategoria-nome">Nome</label>
          <input
            type="text"
            id="subcategoria-nome"
            value={novaSubcategoriaNome}
            onChange={(e) => setNovaSubcategoriaNome(e.target.value)}
            placeholder="Digite o nome da subcategoria"
            autoFocus
          />
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className="button secondary"
            onClick={resetarFormularios}
          >
            Cancelar
          </button>
          <button 
            type="button" 
            className="button primary"
            onClick={handleSalvarSubcategoria}
          >
            {editandoSubcategoria ? 'Atualizar' : 'Salvar'}
          </button>
        </div>
      </div>
    );
  };
  
  // Renderiza uma categoria individual
  const renderCategoria = (categoria) => {
    const isSelected = categoria.id === categoriaSelecionada;
    const subcategoriasCount = categoria.subcategorias?.length || 0;
    
    return (
      <div key={categoria.id} className="categoria-item">
        <div className="categoria-header">
          <div 
            className="categoria-color" 
            style={{ backgroundColor: categoria.cor || '#999' }}
          ></div>
          
          <div 
            className="categoria-nome"
            onClick={() => handleSelectCategoria(categoria.id)}
          >
            {categoria.nome} 
            <span className="subcategoria-count">
              ({subcategoriasCount})
            </span>
          </div>
          
          <div className="categoria-actions">
            <button 
              className="button-small edit-button"
              onClick={() => handleEditarCategoria(categoria)}
            >
              Editar
            </button>
            <button 
              className="button-small delete-button"
              onClick={() => handleExcluirCategoria(categoria.id)}
            >
              Excluir
            </button>
          </div>
        </div>
        
        {/* Se a categoria estiver selecionada, exibe as subcategorias */}
        {isSelected && !showFormCategoria && !showFormSubcategoria && (
          <div className="subcategorias-container">
            <div className="subcategorias-header">
              <h4>Subcategorias</h4>
              <button 
                className="button-small add-button"
                onClick={() => handleNovaSubcategoria(categoria.id)}
              >
                Nova Subcategoria
              </button>
            </div>
            
            {subcategoriasCount > 0 ? (
              <div className="subcategorias-list">
                {categoria.subcategorias.map(subcategoria => (
                  <div key={subcategoria.id} className="subcategoria-item">
                    <span className="subcategoria-nome">{subcategoria.nome}</span>
                    <div className="subcategoria-actions">
                      <button 
                        className="button-small edit-button"
                        onClick={() => handleEditarSubcategoria(categoria.id, subcategoria)}
                      >
                        Editar
                      </button>
                      <button 
                        className="button-small delete-button"
                        onClick={() => handleExcluirSubcategoria(categoria.id, subcategoria.id)}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="subcategorias-empty">
                <p>Nenhuma subcategoria encontrada.</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>Gestão de categorias e subcategorias</h2>
          <button className="close-button" onClick={onClose}>
            X
          </button>
        </div>

        <div className="tipo-selector">
          <button 
            className={`tipo-button ${tipoAtual === 'despesa' ? 'active' : ''}`} 
            onClick={() => handleChangeTipo('despesa')}
          >
            Despesas
          </button>
          <button 
            className={`tipo-button ${tipoAtual === 'receita' ? 'active' : ''}`}
            onClick={() => handleChangeTipo('receita')}
          >
            Receitas
          </button>
        </div>

        <div className="modal-content">
          {showFormCategoria ? (
            renderFormCategoria()
          ) : showFormSubcategoria ? (
            renderFormSubcategoria()
          ) : (
            <div className="categorias-container">
              <h3>Categorias</h3>
              
              {loading ? (
                <div className="loading">Carregando categorias...</div>
              ) : categoriasFiltradas.length > 0 ? (
                <div className="categorias-list">
                  {categoriasFiltradas.map(renderCategoria)}
                </div>
              ) : (
                <div className="empty-state">
                  <p>Você ainda não criou nenhuma categoria. Vamos começar?</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          {!showFormCategoria && !showFormSubcategoria && (
            <>
              <button 
                className="button primary"
                onClick={handleNovaCategoria}
              >
                Nova Categoria de {tipoAtual === 'despesa' ? 'despesas' : 'receitas'}
              </button>
              <button 
                className="button"
                onClick={onClose}
              >
                Fechar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

CategoriasModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default CategoriasModal;
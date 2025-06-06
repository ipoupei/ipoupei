import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import useCategorias from '@modules/categorias/hooks/useCategorias';
import '@modules/categorias/styles/CategoriasModal.css';

/**
 * Modal para gerenciamento de categorias e subcategorias
 * ✅ IMPROVEMENT 001: Cores automáticas inteligentes
 * ✅ CORREÇÃO: Funcionalidades completas de subcategorias
 * ✅ MELHORIA: Interface mais intuitiva e responsiva
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
  
  // Estados para feedback
  const [feedback, setFeedback] = useState({ show: false, message: '', type: '' });
  
  // ✅ IMPROVEMENT 001: Cores predefinidas mais variadas e modernas
  const coresPredefinidas = [
    '#FF6B6B', // Vermelho coral
    '#4ECDC4', // Verde-água
    '#45B7D1', // Azul claro
    '#96CEB4', // Verde menta
    '#FFEAA7', // Amarelo suave
    '#DDA0DD', // Roxo claro
    '#98D8C8', // Verde seafoam
    '#F7DC6F', // Dourado
    '#BB8FCE', // Lavanda
    '#85C1E9', // Azul céu
    '#F8C471', // Laranja suave
    '#82E0AA', // Verde lima
    '#F1948A', // Rosa salmão
    '#AED6F1', // Azul bebê
    '#D7BDE2', // Roxo pastel
    '#A9DFBF', // Verde menta claro
    '#FAD7A0', // Pêssego
    '#D5A6BD', // Rosa antigo
    '#A3E4D7', // Turquesa
    '#F9E79F'  // Amarelo pastel
  ];
  
  // ✅ IMPROVEMENT 001: Função para gerar cor única automática
  const getUniqueRandomColor = () => {
    // Obter cores já em uso
    const coresEmUso = categoriasFiltradas.map(cat => cat.cor?.toUpperCase()).filter(Boolean);
    
    // Filtrar cores predefinidas que não estão em uso
    const coresDisponiveis = coresPredefinidas.filter(cor => 
      !coresEmUso.includes(cor.toUpperCase())
    );
    
    // Se ainda há cores predefinidas disponíveis, escolher uma aleatória
    if (coresDisponiveis.length > 0) {
      const indiceAleatorio = Math.floor(Math.random() * coresDisponiveis.length);
      return coresDisponiveis[indiceAleatorio];
    }
    
    // Se todas as cores predefinidas estão em uso, gerar uma cor aleatória
    return gerarCorAleatoria();
  };
  
  // ✅ IMPROVEMENT 001: Função para gerar cor aleatória com boa saturação
  const gerarCorAleatoria = () => {
    const hue = Math.floor(Math.random() * 360);
    const saturation = 65 + Math.floor(Math.random() * 25); // 65-90%
    const lightness = 55 + Math.floor(Math.random() * 20);  // 55-75%
    
    return hslToHex(hue, saturation, lightness);
  };
  
  // ✅ IMPROVEMENT 001: Converter HSL para HEX
  const hslToHex = (h, s, l) => {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };
  
  // Função para mostrar feedback
  const showFeedback = (message, type = 'success') => {
    setFeedback({ show: true, message, type });
    setTimeout(() => {
      setFeedback({ show: false, message: '', type: '' });
    }, 3000);
  };
  
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
  
  // ✅ IMPROVEMENT 001: Abrir formulário de nova categoria com cor automática
  const handleNovaCategoria = () => {
    resetarFormularios();
    setShowFormCategoria(true);
    setNovaCategoriaNome('');
    
    // ✅ Definir cor automática inteligente
    const corAutomatica = getUniqueRandomColor();
    setNovaCategoriaColor(corAutomatica);
    
    console.log(`🎨 Cor automática gerada: ${corAutomatica}`);
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
  
  // ✅ IMPROVEMENT 001: Função para sugerir nova cor automática
  const handleSugerirNovaCor = () => {
    const novaCor = getUniqueRandomColor();
    setNovaCategoriaColor(novaCor);
    showFeedback(`Nova cor sugerida: ${novaCor}`, 'info');
  };
  
  // Salvar categoria (nova ou editada)
  const handleSalvarCategoria = async () => {
    if (!novaCategoriaNome.trim()) {
      showFeedback('O nome da categoria é obrigatório', 'error');
      return;
    }
    
    try {
      let result;
      
      if (editandoCategoria) {
        // Atualizar categoria existente
        result = await updateCategoria(editandoCategoria.id, {
          nome: novaCategoriaNome.trim(),
          cor: novaCategoriaColor
        });
      } else {
        // Adicionar nova categoria
        result = await addCategoria({
          nome: novaCategoriaNome.trim(),
          tipo: tipoAtual,
          cor: novaCategoriaColor
        });
      }
      
      if (result.success) {
        showFeedback(
          editandoCategoria ? 'Categoria atualizada com sucesso!' : 'Categoria adicionada com sucesso!',
          'success'
        );
        resetarFormularios();
      } else {
        throw new Error(result.error || 'Erro ao salvar categoria');
      }
    } catch (err) {
      console.error('Erro ao salvar categoria:', err);
      showFeedback(`Erro ao ${editandoCategoria ? 'atualizar' : 'adicionar'} categoria: ${err.message}`, 'error');
    }
  };
  
  // Salvar subcategoria (nova ou editada)
  const handleSalvarSubcategoria = async () => {
    if (!novaSubcategoriaNome.trim()) {
      showFeedback('O nome da subcategoria é obrigatório', 'error');
      return;
    }
    
    if (!categoriaSelecionada) {
      showFeedback('Erro: Categoria não selecionada', 'error');
      return;
    }
    
    try {
      let result;
      
      if (editandoSubcategoria) {
        // Atualizar subcategoria existente
        result = await updateSubcategoria(
          categoriaSelecionada, 
          editandoSubcategoria.id, 
          { nome: novaSubcategoriaNome.trim() }
        );
      } else {
        // Adicionar nova subcategoria
        result = await addSubcategoria(
          categoriaSelecionada, 
          { nome: novaSubcategoriaNome.trim() }
        );
      }
      
      if (result.success) {
        showFeedback(
          editandoSubcategoria ? 'Subcategoria atualizada com sucesso!' : 'Subcategoria adicionada com sucesso!',
          'success'
        );
        resetarFormularios();
      } else {
        throw new Error(result.error || 'Erro ao salvar subcategoria');
      }
    } catch (err) {
      console.error('Erro ao salvar subcategoria:', err);
      showFeedback(`Erro ao ${editandoSubcategoria ? 'atualizar' : 'adicionar'} subcategoria: ${err.message}`, 'error');
    }
  };
  
  // Handler para excluir categoria
  const handleExcluirCategoria = async (categoriaId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta categoria? Esta ação afetará todas as subcategorias e transações relacionadas.')) {
      return;
    }
    
    try {
      const result = await deleteCategoria(categoriaId);
      
      if (result.success) {
        showFeedback('Categoria excluída com sucesso!', 'success');
        if (categoriaId === categoriaSelecionada) {
          setCategoriaSelecionada(null);
        }
        resetarFormularios();
      } else {
        throw new Error(result.error || 'Erro ao excluir categoria');
      }
    } catch (err) {
      console.error('Erro ao excluir categoria:', err);
      showFeedback(`Erro ao excluir categoria: ${err.message}`, 'error');
    }
  };
  
  // Handler para excluir subcategoria
  const handleExcluirSubcategoria = async (categoriaId, subcategoriaId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta subcategoria? Esta ação afetará todas as transações relacionadas.')) {
      return;
    }
    
    try {
      const result = await deleteSubcategoria(categoriaId, subcategoriaId);
      
      if (result.success) {
        showFeedback('Subcategoria excluída com sucesso!', 'success');
      } else {
        throw new Error(result.error || 'Erro ao excluir subcategoria');
      }
    } catch (err) {
      console.error('Erro ao excluir subcategoria:', err);
      showFeedback(`Erro ao excluir subcategoria: ${err.message}`, 'error');
    }
  };
  
  // ✅ IMPROVEMENT 001: Formulário de categoria com cores automáticas
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
            {/* ✅ IMPROVEMENT 001: Botão para sugerir nova cor */}
            <button
              type="button"
              className="button-suggest-color"
              onClick={handleSugerirNovaCor}
              title="Sugerir nova cor automática"
            >
              🎲 Sortear
            </button>
          </div>
          
          <div className="cores-container">
            {coresPredefinidas.map(cor => {
              // ✅ Verificar se a cor já está em uso
              const corEmUso = categoriasFiltradas.some(cat => 
                cat.cor?.toUpperCase() === cor.toUpperCase() && cat.id !== editandoCategoria?.id
              );
              
              return (
                <button
                  key={cor}
                  type="button"
                  className={`cor-item ${cor === novaCategoriaColor ? 'selected' : ''} ${corEmUso ? 'in-use' : ''}`}
                  style={{ backgroundColor: cor }}
                  onClick={() => setNovaCategoriaColor(cor)}
                  title={corEmUso ? `Cor já usada` : `Usar cor ${cor}`}
                  disabled={corEmUso}
                />
              );
            })}
          </div>
          
          {/* ✅ IMPROVEMENT 001: Indicador de cores em uso */}
          <div className="color-usage-info">
            <small>
              💡 Cores com ⚫ já estão em uso. Use o botão "🎲 Sortear" para gerar uma cor única.
            </small>
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
            disabled={loading}
          >
            {loading ? 'Salvando...' : (editandoCategoria ? 'Atualizar' : 'Salvar')}
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
            disabled={loading}
          >
            {loading ? 'Salvando...' : (editandoSubcategoria ? 'Atualizar' : 'Salvar')}
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
              title="Editar categoria"
            >
              ✏️
            </button>
            <button 
              className="button-small delete-button"
              onClick={() => handleExcluirCategoria(categoria.id)}
              title="Excluir categoria"
            >
              🗑️
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
                title="Adicionar subcategoria"
              >
                ➕ Nova Subcategoria
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
                        title="Editar subcategoria"
                      >
                        ✏️
                      </button>
                      <button 
                        className="button-small delete-button"
                        onClick={() => handleExcluirSubcategoria(categoria.id, subcategoria.id)}
                        title="Excluir subcategoria"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="subcategorias-empty">
                <p>Nenhuma subcategoria encontrada.</p>
                <button 
                  className="button-small primary"
                  onClick={() => handleNovaSubcategoria(categoria.id)}
                >
                  ➕ Criar primeira subcategoria
                </button>
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
            ✕
          </button>
        </div>

        {/* Feedback de sucesso/erro */}
        {feedback.show && (
          <div className={`feedback-message ${feedback.type}`}>
            {feedback.message}
          </div>
        )}

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
              <div className="categorias-header">
                <h3>Categorias de {tipoAtual === 'despesa' ? 'Despesas' : 'Receitas'}</h3>
                <p className="categorias-subtitle">
                  Clique em uma categoria para ver e gerenciar suas subcategorias
                </p>
                
                {/* ✅ IMPROVEMENT 001: Estatísticas de cores */}
                {categoriasFiltradas.length > 0 && (
                  <div className="color-stats">
                    <small>
                      🎨 {categoriasFiltradas.length} categorias • 
                      {coresPredefinidas.length - categoriasFiltradas.filter(cat => 
                        coresPredefinidas.includes(cat.cor)
                      ).length} cores disponíveis
                    </small>
                  </div>
                )}
              </div>
              
              {loading ? (
                <div className="loading">
                  <div className="loading-spinner"></div>
                  <p>Carregando categorias...</p>
                </div>
              ) : categoriasFiltradas.length > 0 ? (
                <div className="categorias-list">
                  {categoriasFiltradas.map(renderCategoria)}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">📊</div>
                  <p>Você ainda não criou nenhuma categoria de {tipoAtual === 'despesa' ? 'despesas' : 'receitas'}.</p>
                  <p>Vamos começar criando sua primeira categoria?</p>
                  <button 
                    className="button primary"
                    onClick={handleNovaCategoria}
                  >
                    ➕ Criar primeira categoria
                  </button>
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
                ➕ Nova Categoria
              </button>
              <button 
                className="button secondary"
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
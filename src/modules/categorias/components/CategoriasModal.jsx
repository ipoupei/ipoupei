import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  X, Plus, Edit3, Trash2, Palette, Lightbulb, 
  ChevronDown, ChevronRight, Star, Search 
} from 'lucide-react';
import useCategorias from '@modules/categorias/hooks/useCategorias';
import CategoriasSugeridasModal from './CategoriasSugeridasModal';
import CategoriaIcons from '@shared/utils/CategoriaIcons';
import '@shared/styles/CategoriasModal.css';

/**
 * Modal para gerenciamento de categorias - LAYOUT TABULAR ORIGINAL
 * ✅ Mantém exatamente o visual da primeira imagem
 * ✅ Remove apenas o CSS inline, usando classes CSS
 * ✅ Layout de tabela preservado
 * ✅ Todas as funcionalidades mantidas
 */
const CategoriasModal = ({ isOpen, onClose }) => {
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
  
  // Estados para colapsar seções
  const [expandidos, setExpandidos] = useState({
    despesas: true,
    receitas: true
  });
  
  // Estados para modais
  const [modalAberto, setModalAberto] = useState(null); // 'editar', 'excluir', 'nova'
  const [itemSendoEditado, setItemSendoEditado] = useState(null);
  const [tipoItemModal, setTipoItemModal] = useState(''); // 'categoria', 'subcategoria'  
  const [categoriaParentId, setCategoriaParentId] = useState(null);
  
  // Estados para formulários
  const [nomeFormulario, setNomeFormulario] = useState('');
  const [corFormulario, setCorFormulario] = useState('#008080');
  const [iconeFormulario, setIconeFormulario] = useState('📁');
  
  // Estados para seletor de ícones
  const [dropdownIconeAberto, setDropdownIconeAberto] = useState(false);
  const [buscaIcone, setBuscaIcone] = useState('');
  
  // Estados para feedback
  const [mensagemFeedback, setMensagemFeedback] = useState({ show: false, message: '', type: '' });
  const [modalSugeridaAberto, setModalSugeridaAberto] = useState(false);
  
  const coresPredefinidas = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', 
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA'
  ];
  
  // Filtrar e organizar categorias
  const categoriasDespesas = categorias.filter(cat => cat.tipo === 'despesa') || [];
  const categoriasReceitas = categorias.filter(cat => cat.tipo === 'receita') || [];
  
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        if (dropdownIconeAberto) {
          setDropdownIconeAberto(false);
        } else if (modalAberto) {
          fecharModal();
        } else {
          onClose();
        }
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, dropdownIconeAberto, modalAberto, onClose]);
  
  const mostrarFeedback = (message, type = 'success') => {
    setMensagemFeedback({ show: true, message, type });
    setTimeout(() => setMensagemFeedback({ show: false, message: '', type: '' }), 3000);
  };
  
  const alternarExpandir = (tipo) => {
    setExpandidos(prev => ({
      ...prev,
      [tipo]: !prev[tipo]
    }));
  };
  
  const abrirModal = (tipoAcao, item, tipoItem, parentId = null) => {
    console.log('🎯 abrirModal chamado:', { tipoAcao, item, tipoItem, parentId });
    
    setModalAberto(tipoAcao);
    setItemSendoEditado(item || {});
    setTipoItemModal(tipoItem);
    setNomeFormulario(item?.nome || '');
    setCorFormulario(item?.cor || '#008080');
    setIconeFormulario(item?.icone || '📁');
    
    if (tipoItem === 'subcategoria') {
      const idPai = parentId || item?.parentId || item?.categoria_id;
      console.log('🔧 Setando categoriaParentId:', idPai);
      setCategoriaParentId(idPai);
    } else {
      setCategoriaParentId(null);
    }
  };
  
  const fecharModal = () => {
    setModalAberto(null);
    setItemSendoEditado(null);
    setTipoItemModal('');
    setNomeFormulario('');
    setCorFormulario('#008080');
    setIconeFormulario('📁');
    setCategoriaParentId(null);
    setDropdownIconeAberto(false);
    setBuscaIcone('');
  };
  
  const confirmarAcao = async () => {
    console.log('🚀 confirmarAcao iniciada:', { 
      modalAberto, 
      tipoItemModal, 
      nomeFormulario: nomeFormulario.trim(),
      itemSendoEditado 
    });
    
    if (modalAberto === 'excluir') {
      return confirmarExclusao();
    }
    
    if (!nomeFormulario.trim()) {
      mostrarFeedback('Nome é obrigatório', 'error');
      return;
    }
    
    try {
      let resultado;
      
      if (modalAberto === 'nova' && tipoItemModal === 'categoria') {
        const tipoCategoria = itemSendoEditado?.tipo || 'despesa';
        console.log('📝 Criando nova categoria:', { 
          nome: nomeFormulario.trim(),
          tipo: tipoCategoria,
          cor: corFormulario,
          icone: iconeFormulario 
        });
        
        resultado = await addCategoria({
          nome: nomeFormulario.trim(),
          tipo: tipoCategoria,
          cor: corFormulario,
          icone: iconeFormulario
        });
        
        console.log('✅ Resultado addCategoria:', resultado);
      } else if (modalAberto === 'editar' && tipoItemModal === 'categoria') {
        console.log('✏️ Editando categoria:', itemSendoEditado.id);
        resultado = await updateCategoria(itemSendoEditado.id, {
          nome: nomeFormulario.trim(),
          cor: corFormulario,
          icone: iconeFormulario
        });
      } else if (modalAberto === 'nova' && tipoItemModal === 'subcategoria') {
        if (!categoriaParentId) {
          console.error('❌ categoriaParentId não definido:', categoriaParentId);
          mostrarFeedback('Erro: Categoria pai não identificada', 'error');
          return;
        }
        
        console.log('✅ Criando subcategoria com parentId:', categoriaParentId);
        resultado = await addSubcategoria(categoriaParentId, {
          nome: nomeFormulario.trim()
        });
      } else if (modalAberto === 'editar' && tipoItemModal === 'subcategoria') {
        const parentId = categoriaParentId || itemSendoEditado.categoria_id;
        if (!parentId) {
          console.error('❌ parentId não definido para edição:', { categoriaParentId, itemSendoEditado });
          mostrarFeedback('Erro: Categoria pai não identificada', 'error');
          return;
        }
        
        console.log('✅ Editando subcategoria com parentId:', parentId);
        resultado = await updateSubcategoria(parentId, itemSendoEditado.id, {
          nome: nomeFormulario.trim()
        });
      }
      
      console.log('📊 Resultado final:', resultado);
      
      if (resultado?.success) {
        mostrarFeedback(
          modalAberto === 'nova' ? 'Criado com sucesso!' : 'Atualizado com sucesso!',
          'success'
        );
        fecharModal();
      } else {
        throw new Error(resultado?.error || 'Erro ao salvar');
      }
    } catch (err) {
      console.error('❌ Erro ao salvar:', err);
      mostrarFeedback(`Erro: ${err.message}`, 'error');
    }
  };
  
  const confirmarExclusao = async () => {
    try {
      let resultado;
      if (tipoItemModal === 'categoria') {
        resultado = await deleteCategoria(itemSendoEditado.id);
      } else {
        const parentId = categoriaParentId || itemSendoEditado.categoria_id;
        if (!parentId) {
          console.error('❌ parentId não definido para exclusão:', { categoriaParentId, itemSendoEditado });
          mostrarFeedback('Erro: Categoria pai não identificada', 'error');
          return;
        }
        
        console.log('✅ Excluindo subcategoria com parentId:', parentId);
        resultado = await deleteSubcategoria(parentId, itemSendoEditado.id);
      }
      
      if (resultado?.success) {
        mostrarFeedback('Excluído com sucesso!', 'success');
        fecharModal();
      } else {
        throw new Error(resultado?.error || 'Erro ao excluir');
      }
    } catch (err) {
      console.error('Erro ao excluir:', err);
      mostrarFeedback(`Erro: ${err.message}`, 'error');
    }
  };
  
  const obterIconesFiltrados = () => {
    if (buscaIcone.trim()) {
      return CategoriaIcons.searchIcons(buscaIcone, 'emoji');
    } else {
      return CategoriaIcons.getSuggestedIcons(nomeFormulario || 'outros', 'emoji', 48);
    }
  };

  // Renderizar formulário de modal
  const renderFormularioModal = () => {
    if (!modalAberto) return null;
    
    const ehCategoria = tipoItemModal === 'categoria';
    const ehExcluir = modalAberto === 'excluir';
    const ehNova = modalAberto === 'nova';
    
    let titulo = '';
    if (ehExcluir) {
      titulo = `Excluir ${ehCategoria ? 'Categoria' : 'Subcategoria'}`;
    } else if (ehNova) {
      titulo = `Nova ${ehCategoria ? 'Categoria' : 'Subcategoria'}`;
    } else {
      titulo = `Editar ${ehCategoria ? 'Categoria' : 'Subcategoria'}`;
    }
    
    return (
      <div className="categorias-form-overlay">
        <div className="categorias-form-modal">
          {/* Header do Modal */}
          <div className="categorias-form-header">
            <h3 className="categorias-form-title">{titulo}</h3>
            <button className="categorias-form-close" onClick={fecharModal}>
              <X size={18} />
            </button>
          </div>
          
          {/* Conteúdo do Modal */}
          <div className="categorias-form-body">
            {ehExcluir ? (
              <div className="categorias-empty-state">
                <div className="categorias-empty-icon">⚠️</div>
                <div className="categorias-empty-title">
                  Tem certeza que deseja excluir?
                </div>
                <div className="categorias-empty-subtitle">
                  <strong>{itemSendoEditado?.nome}</strong>
                  {ehCategoria && ' e todas suas subcategorias'}
                </div>
                {ehCategoria && (
                  <p className="categorias-empty-subtitle" style={{ color: 'var(--danger)', marginTop: '8px', fontStyle: 'italic' }}>
                    Esta ação afetará todas as transações relacionadas.
                  </p>
                )}
              </div>
            ) : (
              <>
                {/* Campo Nome */}
                <div className="categorias-form-field">
                  <label className="categorias-form-label">
                    <Edit3 size={14} />
                    Nome {ehCategoria ? 'da categoria' : 'da subcategoria'} *
                  </label>
                  <input
                    type="text"
                    value={nomeFormulario}
                    onChange={(e) => setNomeFormulario(e.target.value)}
                    placeholder="Digite o nome..."
                    autoFocus
                    className="categorias-form-input"
                  />
                </div>
                
                {/* Seletor de Ícone (apenas para categorias) */}
                {ehCategoria && (
                  <div className="categorias-form-field">
                    <label className="categorias-form-label">
                      <Star size={14} />
                      Ícone da categoria
                    </label>
                    <div className="categorias-icon-selector">
                      <button 
                        type="button"
                        onClick={() => setDropdownIconeAberto(!dropdownIconeAberto)}
                        className="categorias-icon-trigger"
                      >
                        {iconeFormulario}
                      </button>
                      
                      {dropdownIconeAberto && (
                        <div className="categorias-icon-dropdown">
                          {/* Busca de ícones */}
                          <div className="categorias-icon-search">
                            <Search size={14} />
                            <input 
                              type="text" 
                              placeholder="Buscar ícone..."
                              value={buscaIcone}
                              onChange={(e) => setBuscaIcone(e.target.value)}
                              className="categorias-icon-search-input"
                            />
                          </div>
                          
                          {/* Grid de ícones */}
                          <div className="categorias-icon-grid">
                            {obterIconesFiltrados().map((icon, index) => (
                              <button
                                key={`${icon}-${index}`}
                                type="button"
                                onClick={() => {
                                  setIconeFormulario(icon);
                                  setDropdownIconeAberto(false);
                                  setBuscaIcone('');
                                }}
                                className={`categorias-icon-option ${icon === iconeFormulario ? 'selected' : ''}`}
                              >
                                {icon}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Seletor de Cor (apenas para categorias) */}
                {ehCategoria && (
                  <div className="categorias-form-field">
                    <label className="categorias-form-label">
                      <Palette size={14} />
                      Cor da categoria
                    </label>
                    <div className="categorias-color-selector">
                      <input
                        type="color"
                        value={corFormulario}
                        onChange={(e) => setCorFormulario(e.target.value)}
                        className="categorias-color-input"
                      />
                      <div className="categorias-color-presets">
                        {coresPredefinidas.slice(0, 6).map(cor => (
                          <button
                            key={cor}
                            type="button"
                            onClick={() => setCorFormulario(cor)}
                            className={`categorias-color-preset ${cor === corFormulario ? 'active' : ''}`}
                            style={{ backgroundColor: cor }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Footer do Modal */}
          <div className="categorias-form-footer">
            <button className="categorias-btn-cancel" onClick={fecharModal}>
              Cancelar
            </button>
            <button 
              onClick={confirmarAcao}
              disabled={loading}
              className={`categorias-btn-primary ${ehExcluir ? 'categorias-btn-danger' : ''}`}
            >
              {loading ? (
                <>
                  <div className="categorias-btn-spinner"></div>
                  {ehExcluir ? 'Excluindo...' : 'Salvando...'}
                </>
              ) : (
                <>
                  {ehExcluir ? (
                    <>
                      <Trash2 size={14} />
                      Sim, excluir
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      {ehNova ? 'Criar' : 'Salvar'}
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Renderizar linha de categoria
  const renderCategoriaLinha = (categoria) => {
    return (
      <React.Fragment key={categoria.id}>
        <tr className="categoria-row">
          <td className="categoria-cell">
            <div className="categoria-nome-container">
              <span className="categoria-icone-display">
                {categoria.icone || '📁'}
              </span>
              <span className="categoria-nome-text">
                {categoria.nome}
              </span>
            </div>
          </td>
          
          <td className="categoria-cell categoria-icone-cell">
            <span>{categoria.icone || '📁'}</span>
          </td>
          
          <td className="categoria-cell categoria-cor-cell">
            <div 
              className="categoria-color-dot"
              style={{ backgroundColor: categoria.cor || '#008080' }}
            />
          </td>
          
          <td className="categoria-cell categoria-acoes-cell">
            <div className="categoria-acoes-container">
              <button 
                onClick={() => abrirModal('editar', categoria, 'categoria')}
                title="Editar categoria"
                className="categoria-action-btn edit"
              >
                <Edit3 size={14} />
              </button>
              <button 
                onClick={() => abrirModal('excluir', categoria, 'categoria')}
                title="Excluir categoria"
                className="categoria-action-btn danger"
              >
                <Trash2 size={14} />
              </button>
              <button 
                onClick={() => abrirModal('nova', { parentId: categoria.id }, 'subcategoria', categoria.id)}
                title="Nova subcategoria"
                className="categoria-action-btn add"
              >
                <Plus size={14} />
              </button>
            </div>
          </td>
        </tr>
        
        {/* Subcategorias */}
        {categoria.subcategorias?.map(subcategoria => (
          <tr key={`sub-${subcategoria.id}`} className="subcategoria-row">
            <td className="categoria-cell">
              <div className="subcategoria-nome-container">
                <span className="subcategoria-nome-text">
                  {subcategoria.nome}
                </span>
              </div>
            </td>
            
            <td className="categoria-cell categoria-icone-cell">
              <div 
                className="subcategoria-dot"
                style={{ backgroundColor: categoria.cor || '#008080' }}
              />
            </td>
            
            <td className="categoria-cell categoria-cor-cell">
              <div 
                className="subcategoria-dot"
                style={{ backgroundColor: categoria.cor || '#008080' }}
              />
            </td>
            
            <td className="categoria-cell categoria-acoes-cell">
              <div className="subcategoria-acoes-container">
                <button 
                  onClick={() => abrirModal('editar', subcategoria, 'subcategoria', categoria.id)}
                  title="Editar subcategoria"
                  className="subcategoria-action-btn"
                >
                  <Edit3 size={12} />
                </button>
                <button 
                  onClick={() => abrirModal('excluir', subcategoria, 'subcategoria', categoria.id)}
                  title="Excluir subcategoria"
                  className="subcategoria-action-btn danger"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </React.Fragment>
    );
  };

  // Renderizar seção de categorias (Despesas/Receitas)
  const renderSecaoCategoria = (titulo, categorias, tipo, emoji) => {
    const estaExpandido = expandidos[tipo];
    
    return (
      <React.Fragment key={tipo}>
        <tr className="categoria-section-row">
          <td colSpan="4" className="categoria-section-cell">
            <div 
              className="categoria-section-header-content"
              onClick={() => alternarExpandir(tipo)}
            >
              <div className="categoria-section-info">
                <div className={`categoria-section-chevron ${estaExpandido ? 'categoria-section-expanded' : ''}`}>
                  {estaExpandido ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </div>
                <span className="categoria-section-icon">{emoji}</span>
                <span className="categoria-section-title">{titulo}</span>
                <span className="categoria-section-count">({categorias.length})</span>
              </div>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  abrirModal('nova', { tipo: tipo === 'despesas' ? 'despesa' : 'receita' }, 'categoria');
                }}
                className="categoria-section-add-btn"
              >
                <Plus size={12} />
                Nova
              </button>
            </div>
          </td>
        </tr>
        
        {estaExpandido && categorias.map(renderCategoriaLinha)}
      </React.Fragment>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay active">
        <div className="categorias-modal-container">
          {/* Header do Modal Principal */}
          <div className="categorias-modal-header">
            <div className="categorias-modal-header-content">
              <div className="categorias-modal-icon">
                <Palette size={18} />
              </div>
              <div>
                <h2 className="categorias-modal-title">Gestão de Categorias</h2>
                <p className="categorias-modal-subtitle">Organizar categorias e subcategorias</p>
              </div>
            </div>
            <button className="categorias-modal-close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          {/* Feedback de Mensagens */}
          {mensagemFeedback.show && (
            <div className={`categorias-feedback-message ${mensagemFeedback.type}`}>
              {mensagemFeedback.message}
            </div>
          )}

          {/* Corpo do Modal */}
          <div className="categorias-modal-body">
            {loading ? (
              <div className="categorias-loading-container">
                <div className="categorias-loading-spinner"></div>
                <p className="categorias-loading-text">Carregando...</p>
              </div>
            ) : (
              <div className="categorias-table-container">
                <table className="categorias-table">
                  <thead className="categorias-table-header">
                    <tr>
                      <th className="col-nome">Nome</th>
                      <th className="col-icone">Ícone</th>
                      <th className="col-cor">Cor</th>
                      <th className="col-acoes">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {renderSecaoCategoria('DESPESAS', categoriasDespesas, 'despesas', '💸')}
                    {renderSecaoCategoria('RECEITAS', categoriasReceitas, 'receitas', '💰')}
                    
                    {/* Empty State */}
                    {categoriasDespesas.length === 0 && categoriasReceitas.length === 0 && (
                      <tr>
                        <td colSpan="4">
                          <div className="categorias-empty-state">
                            <div className="categorias-empty-icon">
                              <Palette size={32} />
                            </div>
                            <div className="categorias-empty-title">Nenhuma categoria encontrada</div>
                            <div className="categorias-empty-subtitle">
                              Nenhuma informação disponível
                            </div>
                            <div className="categorias-empty-actions">
                              <button 
                                onClick={() => setModalSugeridaAberto(true)}
                                className="categorias-empty-btn secondary"
                              >
                                <Lightbulb size={14} />
                                Ver categorias sugeridas
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer do Modal Principal */}
          <div className="categorias-modal-footer">
            <div className="categorias-modal-footer-left">
              <button 
                type="button"
                className="categorias-btn-secondary"
                onClick={() => setModalSugeridaAberto(true)}
              >
                <Lightbulb size={14} />
                Categorias sugeridas
              </button>
            </div>
            
            <div className="categorias-modal-footer-right">
              <button className="categorias-btn-close" onClick={onClose}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Categorias Sugeridas */}
      {modalSugeridaAberto && (
        <CategoriasSugeridasModal 
          isOpen={modalSugeridaAberto}
          onClose={() => setModalSugeridaAberto(false)}
        />
      )}

      {/* Modal de Formulário */}
      {renderFormularioModal()}
    </>
  );
};

CategoriasModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default CategoriasModal;
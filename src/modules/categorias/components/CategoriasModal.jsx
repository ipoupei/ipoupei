import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { 
  X, Plus, Edit, Trash2, Palette, Lightbulb, 
  ChevronDown, ChevronRight, Search, Check
} from 'lucide-react';
import useCategorias from '@modules/categorias/hooks/useCategorias';
import CategoriasSugeridasModal from './CategoriasSugeridasModal';
import CategoriaIcons from '@shared/utils/CategoriaIcons';
import '@shared/styles/PrincipalArquivoDeClasses.css';

/**
 * Modal para gerenciamento de categorias - REFATORADO COM CLASSES iPOUPEI
 * ✅ Usa classes padronizadas do PrincipalArquivoDeClasses.css
 * ✅ Novo seletor de cores com classes ip_
 * ✅ Interface consistente com outros modais
 * ✅ Mantém todas as funcionalidades existentes
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
  const [modalAberto, setModalAberto] = useState(null);
  const [itemSendoEditado, setItemSendoEditado] = useState(null);
  const [tipoItemModal, setTipoItemModal] = useState('');
  const [categoriaParentId, setCategoriaParentId] = useState(null);
  
  // Estados para formulários
  const [nomeFormulario, setNomeFormulario] = useState('');
  const [corFormulario, setCorFormulario] = useState('#008080');
  const [iconeFormulario, setIconeFormulario] = useState('📁');
  
  // Estados para seletores
  const [dropdownIconeAberto, setDropdownIconeAberto] = useState(false);
  const [buscaIcone, setBuscaIcone] = useState('');
  
  // Estados para feedback
  const [mensagemFeedback, setMensagemFeedback] = useState({ show: false, message: '', type: '' });
  const [modalSugeridaAberto, setModalSugeridaAberto] = useState(false);
  
  // ✅ NOVO: Cores padronizadas com 20 opções (2 linhas x 10 colunas)
  const coresPredefinidas = [
    // Linha 1 - Cores vibrantes e principais
    '#008080', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6',
    '#A855F7', '#EC4899', '#F43F5E', '#EF4444', '#F97316',
    // Linha 2 - Cores complementares e neutras
    '#F59E0B', '#EAB308', '#84CC16', '#22C55E', '#10B981',
    '#14B8A6', '#0F172A', '#1E293B', '#334155', '#475569'
  ];
  
  // Filtrar e organizar categorias
  const categoriasDespesas = categorias.filter(cat => cat.tipo === 'despesa') || [];
  const categoriasReceitas = categorias.filter(cat => cat.tipo === 'receita') || [];

  // =============================================================================
  // HANDLERS DE EVENTOS
  // =============================================================================
  
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
    setModalAberto(tipoAcao);
    setItemSendoEditado(item || {});
    setTipoItemModal(tipoItem);
    setNomeFormulario(item?.nome || '');
    setCorFormulario(item?.cor || '#008080');
    setIconeFormulario(item?.icone || '📁');
    
    if (tipoItem === 'subcategoria') {
      const idPai = parentId || item?.parentId || item?.categoria_id;
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

  // ✅ NOVO: Handler para mudança de cor
  const handleCorChange = useCallback((cor) => {
    setCorFormulario(cor);
  }, []);
  
  const confirmarAcao = async () => {
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
        
        resultado = await addCategoria({
          nome: nomeFormulario.trim(),
          tipo: tipoCategoria,
          cor: corFormulario,
          icone: iconeFormulario
        });
        
      } else if (modalAberto === 'editar' && tipoItemModal === 'categoria') {
        resultado = await updateCategoria(itemSendoEditado.id, {
          nome: nomeFormulario.trim(),
          cor: corFormulario,
          icone: iconeFormulario
        });
      } else if (modalAberto === 'nova' && tipoItemModal === 'subcategoria') {
        if (!categoriaParentId) {
          mostrarFeedback('Erro: Categoria pai não identificada', 'error');
          return;
        }
        
        resultado = await addSubcategoria(categoriaParentId, {
          nome: nomeFormulario.trim()
        });
      } else if (modalAberto === 'editar' && tipoItemModal === 'subcategoria') {
        const parentId = categoriaParentId || itemSendoEditado.categoria_id;
        if (!parentId) {
          mostrarFeedback('Erro: Categoria pai não identificada', 'error');
          return;
        }
        
        resultado = await updateSubcategoria(parentId, itemSendoEditado.id, {
          nome: nomeFormulario.trim()
        });
      }
      
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
          mostrarFeedback('Erro: Categoria pai não identificada', 'error');
          return;
        }
        
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

  // =============================================================================
  // RENDER DO FORMULÁRIO COM CLASSES iPOUPEI
  // =============================================================================

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
      <div className="ip_modal_fundo" style={{ zIndex: 1100 }}>
        <div className="ip_modal_medio">
          {/* Header do Modal */}
          <div className={`ip_modal_header ${ehExcluir ? 'ip_header_vermelho' : 'ip_header_azul'}`}>
            <div className="ip_flex ip_gap_3">
              <div className="ip_icone_item">
                {ehExcluir ? <Trash2 size={18} /> : <Palette size={18} />}
              </div>
              <div>
                <h2 className="ip_modal_titulo">{titulo}</h2>
                <p className="ip_modal_subtitulo">
                  {ehExcluir ? 'Esta ação pode afetar transações' : 'Configure as informações'}
                </p>
              </div>
            </div>
            <button className="ip_modal_close" onClick={fecharModal}>
              <X size={18} />
            </button>
          </div>
          
          {/* Conteúdo do Modal */}
          <div className="ip_modal_content">
            {ehExcluir ? (
              <div className="ip_mensagem_feedback aviso ip_mb_3">
                <Trash2 size={16} />
                <div>
                  <strong>Tem certeza que deseja excluir?</strong>
                  <p>
                    <strong>{itemSendoEditado?.nome}</strong>
                    {ehCategoria && ' e todas suas subcategorias'}
                  </p>
                  {ehCategoria && (
                    <p className="ip_mt_2">Esta ação afetará todas as transações relacionadas.</p>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Campo Nome */}
                <div className="ip_grupo_formulario ip_mb_3">
                  <label className="ip_label">
                    <Palette size={14} />
                    Nome {ehCategoria ? 'da categoria' : 'da subcategoria'} *
                  </label>
                  <input
                    type="text"
                    value={nomeFormulario}
                    onChange={(e) => setNomeFormulario(e.target.value)}
                    placeholder="Digite o nome..."
                    autoFocus
                    className="ip_input_base"
                  />
                </div>
                
                {/* Seletor de Ícone (apenas para categorias) */}
                {ehCategoria && (
                  <div className="ip_grupo_formulario ip_mb_3">
                    <label className="ip_label">
                      Ícone da categoria
                    </label>
                    <div style={{ position: 'relative' }}>
                      <button 
                        type="button"
                        onClick={() => setDropdownIconeAberto(!dropdownIconeAberto)}
                        className="ip_input_base ip_flex ip_gap_3"
                        style={{ justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                      >
                        <div className="ip_flex ip_gap_2" style={{ alignItems: 'center' }}>
                          <span style={{ fontSize: '20px' }}>{iconeFormulario}</span>
                          <span>Escolher ícone</span>
                        </div>
                        <ChevronDown size={16} style={{ 
                          transform: dropdownIconeAberto ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease'
                        }} />
                      </button>
                      
                      {dropdownIconeAberto && (
                        <div className="ip_dropdown_container">
                          <div className="ip_search_container ip_mb_3">
                            <Search size={16} />
                            <input 
                              type="text" 
                              placeholder="Buscar ícone..."
                              value={buscaIcone}
                              onChange={(e) => setBuscaIcone(e.target.value)}
                              className="ip_input_base"
                            />
                          </div>
                          
                          <div className="ip_grid_icones">
                            {obterIconesFiltrados().map((icon, index) => (
                              <button
                                key={`${icon}-${index}`}
                                type="button"
                                onClick={() => {
                                  setIconeFormulario(icon);
                                  setDropdownIconeAberto(false);
                                  setBuscaIcone('');
                                }}
                                className={`ip_botao_icone ${icon === iconeFormulario ? 'ip_selecionado' : ''}`}
                                style={{ fontSize: '18px' }}
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
                
                {/* ✅ NOVO: Seletor de Cor com classes ip_ (apenas para categorias) */}
                {ehCategoria && (
                  <div className="ip_grupo_formulario ip_mb_3">
                    <label className="ip_label">
                      <Palette size={14} />
                      Cor da categoria
                    </label>
                    
                    {/* Grid de Cores */}
                    <div className="ip_color_palette">
                      {coresPredefinidas.map((cor) => (
                        <button
                          key={cor}
                          type="button"
                          onClick={() => handleCorChange(cor)}
                          className={`ip_color_swatch ${cor === corFormulario ? 'ip_selected' : ''}`}
                          style={{ backgroundColor: cor }}
                          title={cor}
                        >
                          {cor === corFormulario && (
                            <Check size={12} className="ip_color_check" />
                          )}
                        </button>
                      ))}
                    </div>
                    
                    {/* Preview e Input Personalizado */}
                    <div className="ip_color_custom">
                      <div className="ip_color_preview_group">
                        <div 
                          className="ip_color_preview" 
                          style={{ backgroundColor: corFormulario }}
                        />
                        <div>
                          <span className="ip_color_code">{corFormulario}</span>
                          <p className="ip_color_hint">Cor selecionada</p>
                        </div>
                      </div>
                      
                      <div className="ip_color_custom_section">
                        <label className="ip_color_custom_label">
                          Criar cor personalizada
                        </label>
                        <input
                          type="color"
                          value={corFormulario}
                          onChange={(e) => handleCorChange(e.target.value)}
                          className="ip_color_input"
                          title="Clique para escolher uma cor personalizada"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Footer do Modal */}
          <div className="ip_modal_footer">
            <button className="ip_botao_base ip_botao_cinza" onClick={fecharModal}>
              Cancelar
            </button>
            <button 
              onClick={confirmarAcao}
              disabled={loading}
              className={`ip_botao_base ${ehExcluir ? 'ip_botao_vermelho' : 'ip_botao_verde'}`}
            >
              {loading ? (
                <>
                  <span className="ip_loading_spinner_pequeno"></span>
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

  // =============================================================================
  // RENDER DA TABELA COM CLASSES iPOUPEI
  // =============================================================================


{/* Header visual da tabela */}
<div className="ip_card_pequeno ip_mb_2" style={{ padding: '8px 16px', background: '#f8f9fa' }}>
  <div className="ip_flex" style={{ alignItems: 'center' }}>
    <div style={{ flex: '1 1 40%' }}>
      <span className="ip_texto_secundario" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nome</span>
    </div>
    <div style={{ flex: '0 0 60px', textAlign: 'center' }}>
      <span className="ip_texto_secundario" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ícone</span>
    </div>
    <div style={{ flex: '0 0 60px', textAlign: 'center' }}>
      <span className="ip_texto_secundario" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cor</span>
    </div>
    <div style={{ flex: '0 0 120px', textAlign: 'center' }}>
      <span className="ip_texto_secundario" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ações</span>
    </div>
  </div>
</div>

  const renderCategoriaLinha = (categoria) => {
  return (
    <React.Fragment key={categoria.id}>
      {/* Linha da Categoria Principal */}
      <div className="ip_card_item_lista" style={{ borderLeftColor: categoria.cor }}>
        {/* Nome e Ícone */}
        <div className="ip_flex ip_gap_2" style={{ alignItems: 'center', flex: '1 1 40%' }}>
          <span style={{ fontSize: '18px' }}>{categoria.icone || '📁'}</span>
          <span className="ip_texto_principal">{categoria.nome}</span>
        </div>
        
        {/* Ícone (coluna central) */}
        <div style={{ flex: '0 0 60px', textAlign: 'center' }}>
          <span style={{ fontSize: '16px' }}>{categoria.icone || '📁'}</span>
        </div>
        
        {/* Cor (coluna central) */}
        <div style={{ flex: '0 0 60px', textAlign: 'center' }}>
          <div 
            className="ip_indicador_cor"
            style={{ backgroundColor: categoria.cor || '#008080', margin: '0 auto' }}
          />
        </div>
        
        {/* Ações */}
        <div className="ip_flex ip_gap_1" style={{ flex: '0 0 120px', justifyContent: 'flex-end' }}>
          <button 
            onClick={() => abrirModal('editar', categoria, 'categoria')}
            title="Editar categoria"
            className="ip_botao_icone_pequeno"
          >
            <Edit size={12} />
          </button>
          <button 
            onClick={() => abrirModal('excluir', categoria, 'categoria')}
            title="Excluir categoria"
            className="ip_botao_icone_pequeno ip_botao_vermelho"
          >
            <Trash2 size={12} />
          </button>
          <button 
            onClick={() => abrirModal('nova', { parentId: categoria.id }, 'subcategoria', categoria.id)}
            title="Nova subcategoria"
            className="ip_botao_icone_pequeno ip_botao_verde"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>
      
      {/* Subcategorias com indentação */}
      {categoria.subcategorias?.map(subcategoria => (
        <div 
          key={`sub-${subcategoria.id}`} 
          className="ip_card_item_lista ip_item_aninhado"
        >
          {/* Nome da subcategoria com indentação */}
          <div className="ip_flex ip_gap_2" style={{ alignItems: 'center', flex: '1 1 40%', paddingLeft: '32px' }}>
            <span style={{ color: '#94a3b8', fontSize: '14px' }}>↳</span>
            <span className="ip_texto_secundario">{subcategoria.nome}</span>
          </div>
          
          {/* Ponto de cor (herda da categoria pai) */}
          <div style={{ flex: '0 0 60px', textAlign: 'center' }}>
            <div 
              style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: categoria.cor,
                margin: '0 auto'
              }}
            />
          </div>
          
          {/* Ponto de cor (herda da categoria pai) */}
          <div style={{ flex: '0 0 60px', textAlign: 'center' }}>
            <div 
              style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: categoria.cor,
                margin: '0 auto'
              }}
            />
          </div>
          
          {/* Ações da subcategoria */}
          <div className="ip_flex ip_gap_1" style={{ flex: '0 0 120px', justifyContent: 'flex-end' }}>
            <button 
              onClick={() => abrirModal('editar', subcategoria, 'subcategoria', categoria.id)}
              title="Editar subcategoria"
              className="ip_botao_icone_pequeno"
            >
              <Edit size={10} />
            </button>
            <button 
              onClick={() => abrirModal('excluir', subcategoria, 'subcategoria', categoria.id)}
              title="Excluir subcategoria"
              className="ip_botao_icone_pequeno ip_botao_vermelho"
            >
              <Trash2 size={10} />
            </button>
          </div>
        </div>
      ))}
    </React.Fragment>
  );
};


  const renderSecaoCategoria = (titulo, categorias, tipo, emoji) => {
    const estaExpandido = expandidos[tipo];
    
    return (
      <div key={tipo} className="ip_mb_3">
        {/* Cabeçalho da Seção */}
        <div 
          className="ip_header_secao"
          onClick={() => alternarExpandir(tipo)}
          style={{ cursor: 'pointer' }}
        >
          <div className="ip_flex ip_gap_2" style={{ alignItems: 'center' }}>
            <div style={{ 
              transform: estaExpandido ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }}>
              <ChevronRight size={16} />
            </div>
            <span style={{ fontSize: '18px' }}>{emoji}</span>
            <span className="ip_texto_principal">{titulo}</span>
            <span className="ip_badge_cinza">({categorias.length})</span>
          </div>
          
          <button 
            onClick={(e) => {
              e.stopPropagation();
              abrirModal('nova', { tipo: tipo === 'despesas' ? 'despesa' : 'receita' }, 'categoria');
            }}
            className="ip_botao_base ip_botao_pequeno ip_botao_verde"
          >
            <Plus size={12} />
            Nova
          </button>
        </div>
        
        {/* Lista de Categorias */}
        {estaExpandido && (
          <div className="ip_lista_items">
            {categorias.map(renderCategoriaLinha)}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      {/* MODAL PRINCIPAL */}
      <div className="ip_modal_fundo" style={{ zIndex: 1000 }}>
        <div className="ip_modal_grande">
          {/* Header */}
          <div className="ip_modal_header ip_header_azul">
            <div className="ip_flex ip_gap_3">
              <div className="ip_icone_item">
                <Palette size={24} />
              </div>
              <div>
                <h2 className="ip_modal_titulo">Gestão de Categorias</h2>
                <p className="ip_modal_subtitulo">
                  {categoriasDespesas.length + categoriasReceitas.length} categoria{categoriasDespesas.length + categoriasReceitas.length !== 1 ? 's' : ''} • 
                  {categoriasDespesas.length} despesa{categoriasDespesas.length !== 1 ? 's' : ''} • 
                  {categoriasReceitas.length} receita{categoriasReceitas.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <button className="ip_modal_close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          {/* Feedback de Mensagens */}
          {mensagemFeedback.show && (
            <div className={`ip_mensagem_feedback ${mensagemFeedback.type} ip_mb_0`}>
              {mensagemFeedback.type === 'success' ? '✅' : '❌'} {mensagemFeedback.message}
            </div>
          )}

          {/* Body */}
          <div className="ip_modal_content">
            {loading ? (
              <div className="ip_loading_container">
                <div className="ip_loading_spinner"></div>
                <p className="ip_loading_texto">Carregando categorias...</p>
              </div>
            ) : (
              <>
                {/* Controles superiores */}
                <div className="ip_flex ip_gap_4 ip_mb_4" style={{justifyContent: 'flex-end', alignItems: 'center'}}>
                  <button 
                    onClick={() => setModalSugeridaAberto(true)}
                    className="ip_botao_base ip_botao_pequeno ip_botao_azul"
                  >
                    <Lightbulb size={14} />
                    Categorias Sugeridas
                  </button>
                </div>

                {/* Lista de Seções */}
                {renderSecaoCategoria('DESPESAS', categoriasDespesas, 'despesas', '💸')}
                {renderSecaoCategoria('RECEITAS', categoriasReceitas, 'receitas', '💰')}
                
                {/* Estado vazio */}
                {categoriasDespesas.length === 0 && categoriasReceitas.length === 0 && (
                  <div className="ip_estado_vazio">
                    <Palette size={48} className="ip_estado_vazio_icone" />
                    <h3 className="ip_estado_vazio_titulo">Nenhuma categoria encontrada</h3>
                    <p className="ip_estado_vazio_descricao">
                      Crie suas primeiras categorias para organizar suas transações
                    </p>
                    <div className="ip_flex ip_gap_2">
                      <button 
                        onClick={() => abrirModal('nova', { tipo: 'despesa' }, 'categoria')}
                        className="ip_botao_base ip_botao_verde"
                      >
                        <Plus size={16} />
                        Nova Despesa
                      </button>
                      <button 
                        onClick={() => abrirModal('nova', { tipo: 'receita' }, 'categoria')}
                        className="ip_botao_base ip_botao_verde"
                      >
                        <Plus size={16} />
                        Nova Receita
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="ip_modal_footer">
            <button 
              onClick={() => setModalSugeridaAberto(true)}
              className="ip_botao_base ip_botao_azul ip_botao_pequeno"
            >
              <Lightbulb size={14} />
              Categorias Sugeridas
            </button>
            
            <button className="ip_botao_base ip_botao_cinza" onClick={onClose}>
              Fechar
            </button>
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
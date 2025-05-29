import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { 
  TrendingDown, 
  Plus, 
  X, 
  Calendar, 
  FileText, 
  Tag, 
  Building, 
  DollarSign, 
  MessageSquare, 
  Search,
  PlusCircle
} from 'lucide-react';
import InputMoney from './ui/InputMoney';
import useCategorias from '../hooks/useCategorias';
import useContas from '../hooks/useContas';
import { supabase } from '../lib/supabaseClient';
import useAuth from '../hooks/useAuth';
import './FormsModal.css';

/**
 * Modal moderno para lançamento de despesas
 * VERSÃO CORRIGIDA - sem loops de re-renderização
 */
const DespesasModal = ({ isOpen, onClose, onSave }) => {
  const valorInputRef = useRef(null);
  const categoriaInputRef = useRef(null);
  const subcategoriaInputRef = useRef(null);
  
  const { user } = useAuth();
  const { categorias, loading: categoriasLoading, addCategoria, addSubcategoria } = useCategorias();
  const { contas, loading: contasLoading } = useContas();
  
  // MEMOIZAÇÃO das categorias filtradas para evitar re-renders
  const categoriasDespesa = useMemo(() => 
    categorias.filter(cat => cat.tipo === 'despesa'), 
    [categorias]
  );
  
  const [formData, setFormData] = useState({
    valor: 0,
    data: getCurrentDate(),
    descricao: '',
    categoria: '',
    categoriaTexto: '',
    subcategoria: '',
    subcategoriaTexto: '',
    contaDebito: '',
    observacoes: ''
  });
  
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState({ visible: false, message: '', type: '' });
  const [submitting, setSubmitting] = useState(false);
  const [categoriaDropdownOpen, setCategoriaDropdownOpen] = useState(false);
  const [subcategoriaDropdownOpen, setSubcategoriaDropdownOpen] = useState(false);
  const [categoriasFiltradas, setCategoriasFiltradas] = useState([]);
  const [subcategoriasFiltradas, setSubcategoriasFiltradas] = useState([]);
  const [confirmacao, setConfirmacao] = useState({
    show: false,
    type: '',
    nome: '',
    categoriaId: ''
  });
  
  function getCurrentDate() {
    const hoje = new Date();
    return hoje.toISOString().split('T')[0];
  }
  
  // MEMOIZAÇÃO da categoria selecionada
  const categoriaSelecionada = useMemo(() =>
    categoriasDespesa.find(cat => cat.id === formData.categoria),
    [categoriasDespesa, formData.categoria]
  );
  
  // USEEFFECT OTIMIZADO - apenas quando necessário
  useEffect(() => {
    if (!categoriasDespesa.length) return;
    
    if (formData.categoriaTexto) {
      const filtradas = categoriasDespesa.filter(cat =>
        cat.nome.toLowerCase().includes(formData.categoriaTexto.toLowerCase())
      );
      setCategoriasFiltradas(filtradas);
    } else {
      setCategoriasFiltradas(categoriasDespesa);
    }
  }, [formData.categoriaTexto, categoriasDespesa]);
  
  // USEEFFECT OTIMIZADO para subcategorias
  useEffect(() => {
    if (!categoriaSelecionada) {
      setSubcategoriasFiltradas([]);
      return;
    }
    
    if (formData.subcategoriaTexto) {
      const filtradas = (categoriaSelecionada.subcategorias || []).filter(sub =>
        sub.nome.toLowerCase().includes(formData.subcategoriaTexto.toLowerCase())
      );
      setSubcategoriasFiltradas(filtradas);
    } else {
      setSubcategoriasFiltradas(categoriaSelecionada.subcategorias || []);
    }
  }, [formData.subcategoriaTexto, categoriaSelecionada]);
  
  // USEEFFECT apenas para abertura do modal
  useEffect(() => {
    if (isOpen) {
      resetForm();
      setTimeout(() => {
        valorInputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);
  
  // CALLBACKS MEMOIZADOS para evitar re-criação
  const showFeedback = useCallback((message, type = 'success') => {
    setFeedback({ visible: true, message, type });
    setTimeout(() => {
      setFeedback({ visible: false, message: '', type: '' });
    }, 3000);
  }, []);
  
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  }, [errors]);
  
  const handleValorChange = useCallback((value) => {
    setFormData(prev => ({ ...prev, valor: value }));
    if (errors.valor) {
      setErrors(prev => ({ ...prev, valor: null }));
    }
  }, [errors.valor]);
  
  const handleCategoriaChange = useCallback((e) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      categoriaTexto: value,
      categoria: '',
      subcategoria: '',
      subcategoriaTexto: ''
    }));
    
    setCategoriaDropdownOpen(true);
    if (errors.categoria) {
      setErrors(prev => ({ ...prev, categoria: null }));
    }
  }, [errors.categoria]);
  
  const handleSelecionarCategoria = useCallback((categoria) => {
    setFormData(prev => ({
      ...prev,
      categoria: categoria.id,
      categoriaTexto: categoria.nome,
      subcategoria: '',
      subcategoriaTexto: ''
    }));
    
    setCategoriaDropdownOpen(false);
    setTimeout(() => {
      subcategoriaInputRef.current?.focus();
    }, 100);
  }, []);
  
  const handleCategoriaBlur = useCallback(() => {
    setTimeout(() => {
      setCategoriaDropdownOpen(false);
      
      if (formData.categoriaTexto && !formData.categoria) {
        const existe = categoriasDespesa.find(cat =>
          cat.nome.toLowerCase() === formData.categoriaTexto.toLowerCase()
        );
        
        if (!existe) {
          setConfirmacao({
            show: true,
            type: 'categoria',
            nome: formData.categoriaTexto,
            categoriaId: ''
          });
        }
      }
    }, 200);
  }, [formData.categoriaTexto, formData.categoria, categoriasDespesa]);
  
  const handleSubcategoriaChange = useCallback((e) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      subcategoriaTexto: value,
      subcategoria: ''
    }));
    
    if (categoriaSelecionada) {
      setSubcategoriaDropdownOpen(true);
    }
  }, [categoriaSelecionada]);
  
  const handleSelecionarSubcategoria = useCallback((subcategoria) => {
    setFormData(prev => ({
      ...prev,
      subcategoria: subcategoria.id,
      subcategoriaTexto: subcategoria.nome
    }));
    
    setSubcategoriaDropdownOpen(false);
  }, []);
  
  const handleSubcategoriaBlur = useCallback(() => {
    setTimeout(() => {
      setSubcategoriaDropdownOpen(false);
      
      if (formData.subcategoriaTexto && !formData.subcategoria && categoriaSelecionada) {
        const existe = (categoriaSelecionada.subcategorias || []).find(sub =>
          sub.nome.toLowerCase() === formData.subcategoriaTexto.toLowerCase()
        );
        
        if (!existe) {
          setConfirmacao({
            show: true,
            type: 'subcategoria',
            nome: formData.subcategoriaTexto,
            categoriaId: formData.categoria
          });
        }
      }
    }, 200);
  }, [formData.subcategoriaTexto, formData.subcategoria, formData.categoria, categoriaSelecionada]);
  
  const handleConfirmarCriacao = useCallback(async () => {
    try {
      if (confirmacao.type === 'categoria') {
        const result = await addCategoria({
          nome: confirmacao.nome,
          tipo: 'despesa',
          cor: '#EF4444'
        });
        
        if (result.success) {
          setFormData(prev => ({
            ...prev,
            categoria: result.data.id,
            categoriaTexto: result.data.nome
          }));
          
          showFeedback(`Categoria "${confirmacao.nome}" criada com sucesso!`);
        } else {
          showFeedback('Erro ao criar categoria. Tente novamente.', 'error');
        }
      } else if (confirmacao.type === 'subcategoria') {
        const result = await addSubcategoria(confirmacao.categoriaId, {
          nome: confirmacao.nome
        });
        
        if (result.success) {
          setFormData(prev => ({
            ...prev,
            subcategoria: result.data.id,
            subcategoriaTexto: result.data.nome
          }));
          
          showFeedback(`Subcategoria "${confirmacao.nome}" criada com sucesso!`);
        } else {
          showFeedback('Erro ao criar subcategoria. Tente novamente.', 'error');
        }
      }
    } catch (error) {
      console.error('Erro ao criar categoria/subcategoria:', error);
      showFeedback('Erro inesperado. Tente novamente.', 'error');
    }
    
    setConfirmacao({ show: false, type: '', nome: '', categoriaId: '' });
  }, [confirmacao, addCategoria, addSubcategoria, showFeedback]);
  
  const validateForm = useCallback(() => {
    const newErrors = {};
    
    if (!formData.valor || formData.valor === 0) {
      newErrors.valor = "Valor é obrigatório";
    }
    if (!formData.data) {
      newErrors.data = "Data é obrigatória";
    }
    if (!formData.descricao.trim()) {
      newErrors.descricao = "Descrição é obrigatória";
    }
    if (!formData.categoria && !formData.categoriaTexto.trim()) {
      newErrors.categoria = "Categoria é obrigatória";
    }
    if (!formData.contaDebito) {
      newErrors.contaDebito = "Conta é obrigatória";
    }
    if (formData.observacoes.length > 300) {
      newErrors.observacoes = "Máximo de 300 caracteres";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);
  
  const handleSubmit = useCallback(async (e, criarNova = false) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      
      const dadosDespesa = {
        usuario_id: user.id,
        data: formData.data,
        descricao: formData.descricao.trim(),
        categoria_id: formData.categoria,
        subcategoria_id: formData.subcategoria || null,
        conta_id: formData.contaDebito,
        valor: formData.valor,
        observacoes: formData.observacoes.trim(),
        tipo: 'despesa',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('transacoes')
        .insert([dadosDespesa])
        .select();
      
      if (error) throw error;
      
      if (onSave) {
        onSave(); // Notifica o Dashboard para atualizar
      }
      
      if (criarNova) {
        showFeedback('Despesa salva! Pronto para a próxima.');
        // Reset apenas os campos principais, mantendo categoria e conta
        setFormData(prev => ({
          ...prev,
          valor: 0,
          data: getCurrentDate(),
          descricao: '',
          observacoes: ''
        }));
        setErrors({});
        // Foca no campo de valor para facilitar entrada rápida
        setTimeout(() => {
          valorInputRef.current?.focus();
        }, 100);
      } else {
        showFeedback('Despesa registrada com sucesso!');
        setTimeout(() => {
          resetForm();
          onClose();
        }, 1500);
      }
      
    } catch (error) {
      console.error('❌ Erro ao salvar despesa:', error);
      showFeedback(`Erro ao salvar despesa: ${error.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  }, [validateForm, user, formData, onSave, showFeedback, onClose]);
  
  const resetForm = useCallback(() => {
    setFormData({
      valor: 0,
      data: getCurrentDate(),
      descricao: '',
      categoria: '',
      categoriaTexto: '',
      subcategoria: '',
      subcategoriaTexto: '',
      contaDebito: '',
      observacoes: ''
    });
    setErrors({});
    setFeedback({ visible: false, message: '', type: '' });
    setCategoriaDropdownOpen(false);
    setSubcategoriaDropdownOpen(false);
    setConfirmacao({ show: false, type: '', nome: '', categoriaId: '' });
  }, []);
  
  // EARLY RETURN - se não estiver aberto
  if (!isOpen) return null;
  
  return (
    <div className="receitas-modal-overlay">
      <div className="receitas-modal-container">
        {/* Header compacto */}
        <div className="receitas-modal-header">
          <h2 className="receitas-modal-title">
            <TrendingDown size={18} style={{ color: '#ef4444' }} />
            Lançamento de Despesas
          </h2>
          <button className="receitas-modal-close" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        
        {/* Content */}
        <div className="receitas-modal-content">
          {/* Feedback */}
          {feedback.visible && (
            <div className={`receitas-feedback ${feedback.type}`}>
              {feedback.type === 'success' ? '✅' : '❌'} {feedback.message}
            </div>
          )}
          
          {/* Loading */}
          {(categoriasLoading || contasLoading) ? (
            <div className="receitas-loading">
              <div className="receitas-loading-spinner" style={{ borderTopColor: '#ef4444' }}></div>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                Carregando dados...
              </p>
            </div>
          ) : (
            <form onSubmit={(e) => handleSubmit(e, false)} className="receitas-form">
              {/* Valor e Data - Layout horizontal compacto */}
              <div className="receitas-form-row">
                <div className="receitas-form-group">
                  <label className="receitas-form-label">
                    <DollarSign size={14} />
                    Valor *
                  </label>
                  <InputMoney
                    ref={valorInputRef}
                    value={formData.valor}
                    onChange={handleValorChange}
                    placeholder="R$ 0,00"
                    disabled={submitting}
                    className={`receitas-form-input receitas-valor-input ${errors.valor ? 'error' : ''}`}
                    style={{ color: '#ef4444' }}
                  />
                  {errors.valor && (
                    <div className="receitas-form-error">{errors.valor}</div>
                  )}
                </div>
                
                <div className="receitas-form-group">
                  <label className="receitas-form-label">
                    <Calendar size={14} />
                    Data *
                  </label>
                  <input
                    type="date"
                    name="data"
                    value={formData.data}
                    onChange={handleInputChange}
                    disabled={submitting}
                    className={`receitas-form-input ${errors.data ? 'error' : ''}`}
                  />
                  {errors.data && (
                    <div className="receitas-form-error">{errors.data}</div>
                  )}
                </div>
              </div>
              
              {/* Descrição */}
              <div className="receitas-form-group receitas-form-full">
                <label className="receitas-form-label">
                  <FileText size={14} />
                  Descrição *
                </label>
                <input
                  type="text"
                  name="descricao"
                  placeholder="Ex: Almoço no restaurante, Compras no supermercado"
                  value={formData.descricao}
                  onChange={handleInputChange}
                  disabled={submitting}
                  className={`receitas-form-input ${errors.descricao ? 'error' : ''}`}
                />
                {errors.descricao && (
                  <div className="receitas-form-error">{errors.descricao}</div>
                )}
              </div>
              
              {/* Categoria */}
              <div className="receitas-form-group receitas-form-full">
                <label className="receitas-form-label">
                  <Tag size={14} />
                  Categoria *
                </label>
                <div className="receitas-dropdown-container">
                  <input
                    ref={categoriaInputRef}
                    type="text"
                    value={formData.categoriaTexto}
                    onChange={handleCategoriaChange}
                    onBlur={handleCategoriaBlur}
                    onFocus={() => setCategoriaDropdownOpen(true)}
                    placeholder="Digite ou selecione uma categoria"
                    disabled={submitting}
                    autoComplete="off"
                    className={`receitas-form-input receitas-dropdown-input ${errors.categoria ? 'error' : ''}`}
                  />
                  <Search size={14} className="receitas-search-icon" />
                  
                  {categoriaDropdownOpen && categoriasFiltradas.length > 0 && (
                    <div className="receitas-dropdown-options">
                      {categoriasFiltradas.map(categoria => (
                        <div
                          key={categoria.id}
                          className="receitas-dropdown-option"
                          onMouseDown={() => handleSelecionarCategoria(categoria)}
                        >
                          <div 
                            className="receitas-categoria-cor"
                            style={{ backgroundColor: categoria.cor }}
                          ></div>
                          {categoria.nome}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {errors.categoria && (
                  <div className="receitas-form-error">{errors.categoria}</div>
                )}
              </div>
              
              {/* Subcategoria */}
              <div className="receitas-form-group receitas-form-full">
                <label className="receitas-form-label">
                  <Tag size={14} />
                  Subcategoria <small>(opcional)</small>
                </label>
                <div className="receitas-dropdown-container">
                  <input
                    ref={subcategoriaInputRef}
                    type="text"
                    value={formData.subcategoriaTexto}
                    onChange={handleSubcategoriaChange}
                    onBlur={handleSubcategoriaBlur}
                    onFocus={() => categoriaSelecionada && setSubcategoriaDropdownOpen(true)}
                    placeholder={!formData.categoria ? "Escolha categoria primeiro" : "Digite ou selecione uma subcategoria"}
                    disabled={!formData.categoria || submitting}
                    autoComplete="off"
                    className={`receitas-form-input receitas-dropdown-input ${errors.subcategoria ? 'error' : ''}`}
                    style={{
                      backgroundColor: !formData.categoria ? '#f9fafb' : 'white'
                    }}
                  />
                  <Search size={14} className="receitas-search-icon" />
                  
                  {subcategoriaDropdownOpen && subcategoriasFiltradas.length > 0 && (
                    <div className="receitas-dropdown-options">
                      {subcategoriasFiltradas.map(subcategoria => (
                        <div
                          key={subcategoria.id}
                          className="receitas-dropdown-option"
                          onMouseDown={() => handleSelecionarSubcategoria(subcategoria)}
                        >
                          {subcategoria.nome}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Conta Débito */}
              <div className="receitas-form-group receitas-form-full">
                <label className="receitas-form-label">
                  <Building size={14} />
                  Conta Débito *
                </label>
                <select
                  name="contaDebito"
                  value={formData.contaDebito}
                  onChange={handleInputChange}
                  disabled={submitting}
                  className={`receitas-form-input ${errors.contaDebito ? 'error' : ''}`}
                >
                  <option value="">Selecione uma conta</option>
                  {contas.map(conta => (
                    <option key={conta.id} value={conta.id}>
                      {conta.nome}
                    </option>
                  ))}
                </select>
                {errors.contaDebito && (
                  <div className="receitas-form-error">{errors.contaDebito}</div>
                )}
              </div>
              
              {/* Observações */}
              <div className="receitas-form-group receitas-form-full">
                <label className="receitas-form-label">
                  <MessageSquare size={14} />
                  Observações <small>(máx. 300)</small>
                </label>
                <textarea
                  name="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => {
                    if (e.target.value.length <= 300) {
                      handleInputChange(e);
                    }
                  }}
                  placeholder="Adicione informações extras sobre esta despesa"
                  rows="2"
                  disabled={submitting}
                  className={`receitas-form-input receitas-form-textarea ${errors.observacoes ? 'error' : ''}`}
                />
                <div className="receitas-char-counter">
                  <span></span>
                  <span>{formData.observacoes.length}/300</span>
                </div>
                {errors.observacoes && (
                  <div className="receitas-form-error">{errors.observacoes}</div>
                )}
              </div>
              
              {/* Botões de ação compactos */}
              <div className="receitas-form-actions">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    onClose();
                  }}
                  disabled={submitting}
                  className="receitas-btn receitas-btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, true)}
                  disabled={submitting}
                  className="receitas-btn receitas-btn-tertiary"
                  style={{ backgroundColor: '#dc2626' }}
                >
                  {submitting ? (
                    <>
                      <div className="receitas-btn-spinner"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <PlusCircle size={14} />
                      Salvar e Nova
                    </>
                  )}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="receitas-btn receitas-btn-primary"
                  style={{ backgroundColor: '#ef4444' }}
                >
                  {submitting ? (
                    <>
                      <div className="receitas-btn-spinner"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      Salvar Despesa
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      
      {/* Modal de Confirmação */}
      {confirmacao.show && (
        <div className="receitas-confirmation-overlay">
          <div className="receitas-confirmation-container">
            <h3 className="receitas-confirmation-title">
              Criar Nova {confirmacao.type === 'categoria' ? 'Categoria' : 'Subcategoria'}
            </h3>
            <p className="receitas-confirmation-message">
              {confirmacao.type === 'categoria' ? 'A categoria' : 'A subcategoria'}{' '}
              <strong>"{confirmacao.nome}"</strong> não existe. Deseja criá-la?
            </p>
            <div className="receitas-confirmation-actions">
              <button 
                onClick={() => setConfirmacao({ show: false, type: '', nome: '', categoriaId: '' })}
                className="receitas-confirmation-btn receitas-confirmation-btn-secondary"
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmarCriacao}
                className="receitas-confirmation-btn receitas-confirmation-btn-primary"
                style={{ backgroundColor: '#ef4444' }}
              >
                Criar {confirmacao.type === 'categoria' ? 'Categoria' : 'Subcategoria'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

DespesasModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func
};

export default DespesasModal;
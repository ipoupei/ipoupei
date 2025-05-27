import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { 
  TrendingUp, 
  Plus, 
  X, 
  Calendar, 
  FileText, 
  Tag, 
  Building, 
  DollarSign, 
  MessageSquare, 
  ChevronDown 
} from 'lucide-react';
import InputMoney from './ui/InputMoney';
import useCategorias from '../hooks/useCategorias';
import useContas from '../hooks/useContas';
import './ModalForm.css';

/**
 * Modal para lançamento de receitas
 * Versão completamente nova com design limpo e otimizado
 */
const ReceitasModal = ({ isOpen, onClose }) => {
  // Referências para campos
  const valorInputRef = useRef(null);
  const categoriaInputRef = useRef(null);
  const subcategoriaInputRef = useRef(null);
  
  // Hooks
  const { 
    categorias, 
    loading: categoriasLoading, 
    addCategoria, 
    addSubcategoria 
  } = useCategorias();
  const { contas, loading: contasLoading } = useContas();
  
  // Filtrar categorias de receita
  const categoriasReceita = categorias.filter(cat => cat.tipo === 'receita');
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    valor: 0,
    data: getCurrentDate(),
    descricao: '',
    categoria: '',
    categoriaTexto: '',
    subcategoria: '',
    subcategoriaTexto: '',
    contaDeposito: '',
    observacoes: ''
  });
  
  // Estados de controle
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState({ visible: false, message: '', type: '' });
  const [submitting, setSubmitting] = useState(false);
  
  // Estados para dropdowns
  const [categoriaDropdownOpen, setCategoriaDropdownOpen] = useState(false);
  const [subcategoriaDropdownOpen, setSubcategoriaDropdownOpen] = useState(false);
  const [categoriasFiltradas, setCategoriasFiltradas] = useState([]);
  const [subcategoriasFiltradas, setSubcategoriasFiltradas] = useState([]);
  
  // Estados para confirmação de criação
  const [confirmacao, setConfirmacao] = useState({
    show: false,
    type: '', // 'categoria' ou 'subcategoria'
    nome: '',
    categoriaId: ''
  });
  
  // Função para obter data atual
  function getCurrentDate() {
    const hoje = new Date();
    return hoje.toISOString().split('T')[0];
  }
  
  // Categoria selecionada
  const categoriaSelecionada = categoriasReceita.find(cat => cat.id === formData.categoria);
  
  // Efeito para filtrar categorias
  useEffect(() => {
    if (formData.categoriaTexto) {
      const filtradas = categoriasReceita.filter(cat =>
        cat.nome.toLowerCase().includes(formData.categoriaTexto.toLowerCase())
      );
      setCategoriasFiltradas(filtradas);
    } else {
      setCategoriasFiltradas(categoriasReceita);
    }
  }, [formData.categoriaTexto, categoriasReceita]);
  
  // Efeito para filtrar subcategorias
  useEffect(() => {
    if (categoriaSelecionada && formData.subcategoriaTexto) {
      const filtradas = (categoriaSelecionada.subcategorias || []).filter(sub =>
        sub.nome.toLowerCase().includes(formData.subcategoriaTexto.toLowerCase())
      );
      setSubcategoriasFiltradas(filtradas);
    } else if (categoriaSelecionada) {
      setSubcategoriasFiltradas(categoriaSelecionada.subcategorias || []);
    } else {
      setSubcategoriasFiltradas([]);
    }
  }, [formData.subcategoriaTexto, categoriaSelecionada]);
  
  // Efeito para reset e foco
  useEffect(() => {
    if (isOpen) {
      resetForm();
      setTimeout(() => {
        valorInputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);
  
  // Função para mostrar feedback
  const showFeedback = (message, type = 'success') => {
    setFeedback({ visible: true, message, type });
    setTimeout(() => {
      setFeedback({ visible: false, message: '', type: '' });
    }, 3000);
  };
  
  // Handler para mudanças normais nos inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpar erro se existir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  // Handler para mudança no valor
  const handleValorChange = (value) => {
    setFormData(prev => ({ ...prev, valor: value }));
    if (errors.valor) {
      setErrors(prev => ({ ...prev, valor: null }));
    }
  };
  
  // Handler para mudança na categoria
  const handleCategoriaChange = (e) => {
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
  };
  
  // Handler para seleção de categoria
  const handleSelecionarCategoria = (categoria) => {
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
  };
  
  // Handler para blur da categoria
  const handleCategoriaBlur = () => {
    setTimeout(() => {
      setCategoriaDropdownOpen(false);
      
      if (formData.categoriaTexto && !formData.categoria) {
        const existe = categoriasReceita.find(cat =>
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
  };
  
  // Handler para mudança na subcategoria
  const handleSubcategoriaChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      subcategoriaTexto: value,
      subcategoria: ''
    }));
    
    if (categoriaSelecionada) {
      setSubcategoriaDropdownOpen(true);
    }
    
    if (errors.subcategoria) {
      setErrors(prev => ({ ...prev, subcategoria: null }));
    }
  };
  
  // Handler para seleção de subcategoria
  const handleSelecionarSubcategoria = (subcategoria) => {
    setFormData(prev => ({
      ...prev,
      subcategoria: subcategoria.id,
      subcategoriaTexto: subcategoria.nome
    }));
    
    setSubcategoriaDropdownOpen(false);
  };
  
  // Handler para blur da subcategoria
  const handleSubcategoriaBlur = () => {
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
  };
  
  // Handler para confirmar criação
  const handleConfirmarCriacao = async () => {
    try {
      if (confirmacao.type === 'categoria') {
        const novaCategoria = {
          nome: confirmacao.nome,
          tipo: 'receita',
          cor: '#10B981'
        };
        
        const result = await addCategoria(novaCategoria);
        
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
      console.error('Erro ao criar:', error);
      showFeedback('Erro inesperado. Tente novamente.', 'error');
    }
    
    setConfirmacao({ show: false, type: '', nome: '', categoriaId: '' });
  };
  
  // Handler para cancelar confirmação
  const handleCancelarConfirmacao = () => {
    setConfirmacao({ show: false, type: '', nome: '', categoriaId: '' });
  };
  
  // Validação do formulário
  const validateForm = () => {
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
    if (!formData.contaDeposito) {
      newErrors.contaDeposito = "Conta é obrigatória";
    }
    if (formData.observacoes.length > 300) {
      newErrors.observacoes = "Máximo de 300 caracteres";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handler para submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      
      const dadosReceita = {
        data: formData.data,
        descricao: formData.descricao.trim(),
        categoria_id: formData.categoria,
        subcategoria_id: formData.subcategoria || null,
        conta_id: formData.contaDeposito,
        valor: formData.valor,
        observacoes: formData.observacoes.trim(),
        tipo: 'receita'
      };
      
      console.log("💰 Dados da receita:", dadosReceita);
      
      // TODO: Implementar chamada real para API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      showFeedback('Receita registrada com sucesso!');
      
      setTimeout(() => {
        resetForm();
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('Erro ao salvar receita:', error);
      showFeedback('Erro ao salvar receita. Tente novamente.', 'error');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Função para resetar formulário
  const resetForm = () => {
    setFormData({
      valor: 0,
      data: getCurrentDate(),
      descricao: '',
      categoria: '',
      categoriaTexto: '',
      subcategoria: '',
      subcategoriaTexto: '',
      contaDeposito: '',
      observacoes: ''
    });
    setErrors({});
    setFeedback({ visible: false, message: '', type: '' });
    setCategoriaDropdownOpen(false);
    setSubcategoriaDropdownOpen(false);
    setConfirmacao({ show: false, type: '', nome: '', categoriaId: '' });
  };
  
  // Se não estiver aberto, não renderiza
  if (!isOpen) return null;
  
  return (
    <>
      <div className="modal-form-overlay">
        <div className="modal-form-container">
          {/* Cabeçalho */}
          <div className="modal-form-header">
            <h2 className="modal-form-title">
              <TrendingUp size={20} style={{ color: '#10b981' }} />
              Lançamento de Receitas
            </h2>
            <button className="modal-form-close" onClick={onClose} aria-label="Fechar">
              <X size={20} />
            </button>
          </div>
          
          {/* Conteúdo */}
          <div className="modal-form-content">
            {/* Feedback */}
            {feedback.visible && (
              <div className={`form-feedback ${feedback.type}`}>
                {feedback.type === 'success' ? '✅' : '❌'} {feedback.message}
              </div>
            )}
            
            {/* Loading ou Formulário */}
            {(categoriasLoading || contasLoading) ? (
              <div className="form-loading">
                <div className="form-loading-spinner"></div>
                <p>Carregando dados...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="modal-form">
                {/* Linha 1: Valor e Data */}
                <div className="form-row">
                  <div className="form-field" style={{ flex: 2 }}>
                    <label className="form-label">
                      <DollarSign size={16} />
                      Valor <span className="required">*</span>
                    </label>
                    <div className={`form-input-container ${errors.valor ? 'error' : ''}`}>
                      <InputMoney
                        ref={valorInputRef}
                        value={formData.valor}
                        onChange={handleValorChange}
                        placeholder="R$ 0,00"
                        disabled={submitting}
                        className="form-input"
                        style={{ 
                          fontSize: '1.1rem', 
                          fontWeight: '600',
                          color: '#10b981'
                        }}
                      />
                    </div>
                    {errors.valor && <div className="form-error">{errors.valor}</div>}
                  </div>
                  
                  <div className="form-field">
                    <label className="form-label">
                      <Calendar size={16} />
                      Data <span className="required">*</span>
                    </label>
                    <div className={`form-input-container ${errors.data ? 'error' : ''}`}>
                      <input
                        type="date"
                        name="data"
                        value={formData.data}
                        onChange={handleInputChange}
                        disabled={submitting}
                        className="form-input"
                      />
                    </div>
                    {errors.data && <div className="form-error">{errors.data}</div>}
                  </div>
                </div>
                
                {/* Linha 2: Descrição */}
                <div className="form-field">
                  <label className="form-label">
                    <FileText size={16} />
                    Descrição <span className="required">*</span>
                  </label>
                  <div className={`form-input-container ${errors.descricao ? 'error' : ''}`}>
                    <FileText size={16} className="form-icon" />
                    <input
                      type="text"
                      name="descricao"
                      value={formData.descricao}
                      onChange={handleInputChange}
                      placeholder="Ex: Pagamento projeto XPTO"
                      disabled={submitting}
                      className="form-input"
                    />
                  </div>
                  {errors.descricao && <div className="form-error">{errors.descricao}</div>}
                </div>
                
                {/* Linha 3: Categoria e Subcategoria */}
                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label">
                      <Tag size={16} />
                      Categoria <span className="required">*</span>
                    </label>
                    <div className={`form-input-container ${errors.categoria ? 'error' : ''}`}>
                      <Tag size={16} className="form-icon" />
                      <div className="form-dropdown-wrapper">
                        <input
                          ref={categoriaInputRef}
                          type="text"
                          value={formData.categoriaTexto}
                          onChange={handleCategoriaChange}
                          onBlur={handleCategoriaBlur}
                          onFocus={() => setCategoriaDropdownOpen(true)}
                          placeholder="Digite ou selecione uma categoria"
                          disabled={submitting}
                          className="form-input"
                          autoComplete="off"
                        />
                        <ChevronDown size={16} className="form-select-arrow" />
                        
                        {/* Dropdown de categorias */}
                        {categoriaDropdownOpen && categoriasFiltradas.length > 0 && (
                          <div className="form-dropdown-options">
                            {categoriasFiltradas.map(categoria => (
                              <div
                                key={categoria.id}
                                className="form-dropdown-option"
                                onMouseDown={() => handleSelecionarCategoria(categoria)}
                              >
                                <div 
                                  className="category-color"
                                  style={{ backgroundColor: categoria.cor }}
                                ></div>
                                {categoria.nome}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {errors.categoria && <div className="form-error">{errors.categoria}</div>}
                  </div>
                  
                  <div className="form-field">
                    <label className="form-label">
                      <Tag size={16} />
                      Subcategoria (opcional)
                    </label>
                    <div className={`form-input-container ${errors.subcategoria ? 'error' : ''}`}>
                      <Tag size={16} className="form-icon" />
                      <div className="form-dropdown-wrapper">
                        <input
                          ref={subcategoriaInputRef}
                          type="text"
                          value={formData.subcategoriaTexto}
                          onChange={handleSubcategoriaChange}
                          onBlur={handleSubcategoriaBlur}
                          onFocus={() => categoriaSelecionada && setSubcategoriaDropdownOpen(true)}
                          placeholder={!formData.categoria ? "Selecione categoria primeiro" : "Digite ou selecione"}
                          disabled={!formData.categoria || submitting}
                          className="form-input"
                          autoComplete="off"
                          style={{
                            backgroundColor: !formData.categoria ? '#f9fafb' : 'transparent'
                          }}
                        />
                        <ChevronDown size={16} className="form-select-arrow" />
                        
                        {/* Dropdown de subcategorias */}
                        {subcategoriaDropdownOpen && subcategoriasFiltradas.length > 0 && (
                          <div className="form-dropdown-options">
                            {subcategoriasFiltradas.map(subcategoria => (
                              <div
                                key={subcategoria.id}
                                className="form-dropdown-option"
                                onMouseDown={() => handleSelecionarSubcategoria(subcategoria)}
                              >
                                {subcategoria.nome}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {errors.subcategoria && <div className="form-error">{errors.subcategoria}</div>}
                  </div>
                </div>
                
                {/* Linha 4: Conta de Depósito */}
                <div className="form-field">
                  <label className="form-label">
                    <Building size={16} />
                    Conta de Depósito <span className="required">*</span>
                  </label>
                  <div className={`form-input-container ${errors.contaDeposito ? 'error' : ''}`}>
                    <Building size={16} className="form-icon" />
                    <select
                      name="contaDeposito"
                      value={formData.contaDeposito}
                      onChange={handleInputChange}
                      disabled={submitting}
                      className="form-input form-select"
                    >
                      <option value="">Selecione uma conta</option>
                      {contas.map(conta => (
                        <option key={conta.id} value={conta.id}>
                          {conta.nome}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="form-select-arrow" />
                  </div>
                  {errors.contaDeposito && <div className="form-error">{errors.contaDeposito}</div>}
                </div>
                
                {/* Linha 5: Observações */}
                <div className="form-field">
                  <label className="form-label">
                    <MessageSquare size={16} />
                    Observações (opcional)
                  </label>
                  <div className={`form-input-container ${errors.observacoes ? 'error' : ''}`}>
                    <MessageSquare size={16} className="form-icon" />
                    <textarea
                      name="observacoes"
                      value={formData.observacoes}
                      onChange={handleInputChange}
                      placeholder="Adicione informações extras sobre esta receita"
                      rows="3"
                      disabled={submitting}
                      className="form-input form-textarea"
                      maxLength="300"
                    />
                  </div>
                  {formData.observacoes.length > 0 && (
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: '#6b7280', 
                      textAlign: 'right',
                      marginTop: '4px'
                    }}>
                      {formData.observacoes.length}/300
                    </div>
                  )}
                  {errors.observacoes && <div className="form-error">{errors.observacoes}</div>}
                </div>
                
                {/* Ações do formulário */}
                <div className="form-actions">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      onClose();
                    }}
                    disabled={submitting}
                    className="form-btn form-btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="form-btn form-btn-primary"
                  >
                    {submitting ? (
                      <>
                        <div className="form-spinner"></div>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        Salvar Receita
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
      
      {/* Modal de Confirmação */}
      {confirmacao.show && (
        <div className="confirmation-overlay">
          <div className="confirmation-container">
            <h3 className="confirmation-title">
              Criar Nova {confirmacao.type === 'categoria' ? 'Categoria' : 'Subcategoria'}
            </h3>
            <p className="confirmation-message">
              {confirmacao.type === 'categoria' ? 'A categoria' : 'A subcategoria'}{' '}
              <strong>"{confirmacao.nome}"</strong> não existe. Deseja criá-la?
            </p>
            <div className="confirmation-actions">
              <button 
                className="form-btn form-btn-secondary"
                onClick={handleCancelarConfirmacao}
              >
                Cancelar
              </button>
              <button 
                className="form-btn form-btn-primary"
                onClick={handleConfirmarCriacao}
              >
                Criar {confirmacao.type === 'categoria' ? 'Categoria' : 'Subcategoria'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

ReceitasModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default ReceitasModal;

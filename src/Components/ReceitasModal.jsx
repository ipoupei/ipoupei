import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { TrendingUp, Plus, X, Calendar, FileText, Tag, Building, DollarSign, MessageSquare, Search, ChevronDown } from 'lucide-react';
import InputMoney from './ui/InputMoney';
import useCategorias from '../hooks/useCategorias';
import useContas from '../hooks/useContas';

/**
 * Modal compacto para lançamento de receitas
 * Design limpo e otimizado para notebooks
 */
const ReceitasModal = ({ isOpen, onClose }) => {
  // Referências para os campos
  const valorInputRef = useRef(null);
  const categoriaInputRef = useRef(null);
  const subcategoriaInputRef = useRef(null);
  
  // Hooks para obter categorias e contas
  const { categorias, loading: categoriasLoading, addCategoria, addSubcategoria } = useCategorias();
  const { contas, loading: contasLoading } = useContas();
  
  // Filtrar apenas categorias do tipo "receita"
  const categoriasReceita = categorias.filter(cat => cat.tipo === 'receita');
  
  // Estados para os campos do formulário
  const [formData, setFormData] = useState({
    valor: 0,
    data: formatarDataAtual(),
    descricao: '',
    categoria: '',
    categoriaTexto: '',
    subcategoria: '',
    subcategoriaTexto: '',
    contaDeposito: '',
    observacoes: ''
  });

  // Estados para controle dos dropdowns e busca
  const [categoriaDropdownAberto, setCategoriaDropdownAberto] = useState(false);
  const [subcategoriaDropdownAberto, setSubcategoriaDropdownAberto] = useState(false);
  const [categoriasFiltradas, setCategoriasFiltradas] = useState([]);
  const [subcategoriasFiltradas, setSubcategoriasFiltradas] = useState([]);
  
  // Estados para controle de criação de novas categorias
  const [confirmacaoCategoria, setConfirmacaoCategoria] = useState({ show: false, nome: '' });
  const [confirmacaoSubcategoria, setConfirmacaoSubcategoria] = useState({ show: false, nome: '', categoriaId: '' });
  
  // Estado para controlar erros de validação
  const [errors, setErrors] = useState({});
  
  // Estado para exibir mensagem de sucesso
  const [feedback, setFeedback] = useState({ visible: false, message: '', type: '' });
  
  // Estado para loading do formulário
  const [submitting, setSubmitting] = useState(false);
  
  // Obter categoria selecionada
  const categoriaSelecionada = categoriasReceita.find(cat => cat.id === formData.categoria);
  
  // Efeito para filtrar categorias conforme o usuário digita
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
  
  // Efeito para filtrar subcategorias conforme o usuário digita
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
  
  // Efeito para autofoco no primeiro campo quando o modal abre
  useEffect(() => {
    if (isOpen && valorInputRef.current) {
      setTimeout(() => {
        valorInputRef.current.focus();
      }, 150);
    }
    
    // Resetar o formulário quando o modal é aberto
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);
  
  // Função para obter a data atual no formato yyyy-MM-dd (para input date)
  function formatarDataAtual() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  // Função para mostrar feedback
  const showFeedback = (message, type = 'success') => {
    setFeedback({ visible: true, message, type });
    setTimeout(() => {
      setFeedback({ visible: false, message: '', type: '' });
    }, 3000);
  };

  // Handler para mudanças nos inputs normais
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
    
    // Limpa o erro deste campo se existir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };
  
  // Handler para mudanças no campo de categoria (com busca)
  const handleCategoriaChange = (e) => {
    const { value } = e.target;
    
    setFormData(prevData => ({
      ...prevData,
      categoriaTexto: value,
      categoria: '',
      subcategoria: '',
      subcategoriaTexto: ''
    }));
    
    setCategoriaDropdownAberto(true);
    
    if (errors.categoria) {
      setErrors(prev => ({ ...prev, categoria: null }));
    }
  };
  
  // Handler para seleção de categoria do dropdown
  const handleSelecionarCategoria = (categoria) => {
    setFormData(prevData => ({
      ...prevData,
      categoria: categoria.id,
      categoriaTexto: categoria.nome,
      subcategoria: '',
      subcategoriaTexto: ''
    }));
    
    setCategoriaDropdownAberto(false);
    
    setTimeout(() => {
      subcategoriaInputRef.current?.focus();
    }, 100);
  };
  
  // Handler para quando o usuário sai do campo categoria (onBlur)
  const handleCategoriaBlur = () => {
    setTimeout(() => {
      setCategoriaDropdownAberto(false);
      
      if (formData.categoriaTexto && !formData.categoria) {
        const categoriaExistente = categoriasReceita.find(cat =>
          cat.nome.toLowerCase() === formData.categoriaTexto.toLowerCase()
        );
        
        if (!categoriaExistente) {
          setConfirmacaoCategoria({
            show: true,
            nome: formData.categoriaTexto
          });
        }
      }
    }, 200);
  };
  
  // Handler para mudanças no campo de subcategoria (com busca)
  const handleSubcategoriaChange = (e) => {
    const { value } = e.target;
    
    setFormData(prevData => ({
      ...prevData,
      subcategoriaTexto: value,
      subcategoria: ''
    }));
    
    if (categoriaSelecionada) {
      setSubcategoriaDropdownAberto(true);
    }
    
    if (errors.subcategoria) {
      setErrors(prev => ({ ...prev, subcategoria: null }));
    }
  };
  
  // Handler para seleção de subcategoria do dropdown
  const handleSelecionarSubcategoria = (subcategoria) => {
    setFormData(prevData => ({
      ...prevData,
      subcategoria: subcategoria.id,
      subcategoriaTexto: subcategoria.nome
    }));
    
    setSubcategoriaDropdownAberto(false);
  };
  
  // Handler para quando o usuário sai do campo subcategoria (onBlur)
  const handleSubcategoriaBlur = () => {
    setTimeout(() => {
      setSubcategoriaDropdownAberto(false);
      
      if (formData.subcategoriaTexto && !formData.subcategoria && categoriaSelecionada) {
        const subcategoriaExistente = (categoriaSelecionada.subcategorias || []).find(sub =>
          sub.nome.toLowerCase() === formData.subcategoriaTexto.toLowerCase()
        );
        
        if (!subcategoriaExistente) {
          setConfirmacaoSubcategoria({
            show: true,
            nome: formData.subcategoriaTexto,
            categoriaId: formData.categoria
          });
        }
      }
    }, 200);
  };
  
  // Handler para confirmar criação de nova categoria
  const handleConfirmarNovaCategoria = async () => {
    try {
      const novaCategoria = {
        nome: confirmacaoCategoria.nome,
        tipo: 'receita',
        cor: '#10B981'
      };
      
      const result = await addCategoria(novaCategoria);
      
      if (result.success) {
        setFormData(prevData => ({
          ...prevData,
          categoria: result.data.id,
          categoriaTexto: result.data.nome
        }));
        
        showFeedback(`Categoria "${confirmacaoCategoria.nome}" criada com sucesso!`, 'success');
      } else {
        showFeedback('Erro ao criar categoria. Tente novamente.', 'error');
      }
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      showFeedback('Erro ao criar categoria. Tente novamente.', 'error');
    }
    
    setConfirmacaoCategoria({ show: false, nome: '' });
  };
  
  // Handler para confirmar criação de nova subcategoria
  const handleConfirmarNovaSubcategoria = async () => {
    try {
      const novaSubcategoria = {
        nome: confirmacaoSubcategoria.nome
      };
      
      const result = await addSubcategoria(confirmacaoSubcategoria.categoriaId, novaSubcategoria);
      
      if (result.success) {
        setFormData(prevData => ({
          ...prevData,
          subcategoria: result.data.id,
          subcategoriaTexto: result.data.nome
        }));
        
        showFeedback(`Subcategoria "${confirmacaoSubcategoria.nome}" criada com sucesso!`, 'success');
      } else {
        showFeedback('Erro ao criar subcategoria. Tente novamente.', 'error');
      }
    } catch (error) {
      console.error('Erro ao criar subcategoria:', error);
      showFeedback('Erro ao criar subcategoria. Tente novamente.', 'error');
    }
    
    setConfirmacaoSubcategoria({ show: false, nome: '', categoriaId: '' });
  };
  
  // Handler específico para o campo de valor
  const handleValorChange = (value) => {
    setFormData(prevData => ({
      ...prevData,
      valor: value
    }));
    
    if (errors.valor) {
      setErrors(prev => ({
        ...prev,
        valor: null
      }));
    }
  };
  
  // Handler para controlar o contador de caracteres nas observações
  const handleObservacoesChange = (e) => {
    const { value } = e.target;
    
    if (value.length <= 300) {
      setFormData(prevData => ({
        ...prevData,
        observacoes: value
      }));
      
      if (errors.observacoes) {
        setErrors(prev => ({
          ...prev,
          observacoes: null
        }));
      }
    }
  };

  // Validação do formulário
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.data) newErrors.data = "Data é obrigatória";
    if (!formData.descricao.trim()) newErrors.descricao = "Descrição é obrigatória";
    if (!formData.categoria && !formData.categoriaTexto.trim()) newErrors.categoria = "Categoria é obrigatória";
    if (!formData.contaDeposito) newErrors.contaDeposito = "Conta é obrigatória";
    if (!formData.valor || formData.valor === 0) newErrors.valor = "Valor é obrigatório";
    
    if (formData.observacoes.length > 300) {
      newErrors.observacoes = "Máximo de 300 caracteres";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handler para o envio do formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
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
        
        console.log("💰 ReceitasModal - Dados da receita a serem enviados:", dadosReceita);
        
        // Mock da função addReceita por enquanto
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        showFeedback('Receita registrada com sucesso!', 'success');
        
        setTimeout(() => {
          resetForm();
          onClose();
        }, 1500);
        
      } catch (error) {
        console.error('❌ ReceitasModal - Erro ao salvar receita:', error);
        showFeedback('Erro ao salvar receita. Tente novamente.', 'error');
      } finally {
        setSubmitting(false);
      }
    }
  };

  // Função para resetar o formulário
  const resetForm = () => {
    setFormData({
      valor: 0,
      data: formatarDataAtual(),
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
    setCategoriaDropdownAberto(false);
    setSubcategoriaDropdownAberto(false);
    setConfirmacaoCategoria({ show: false, nome: '' });
    setConfirmacaoSubcategoria({ show: false, nome: '', categoriaId: '' });
  };

  // Se não estiver aberto, não renderiza
  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay">
        <div className="modal-container">
          {/* Cabeçalho */}
          <div className="modal-header">
            <h2>Lançamento de Receitas</h2>
            <button className="btn-close" onClick={onClose} aria-label="Fechar">
              <X size={20} />
            </button>
          </div>
          
          {/* Conteúdo */}
          <div className="modal-content">
            {/* Feedback */}
            {feedback.visible && (
              <div className={`feedback ${feedback.type}`}>
                {feedback.type === 'success' ? '✅' : '❌'} {feedback.message}
              </div>
            )}
            
            {/* Modais de confirmação */}
            {confirmacaoCategoria.show && (
              <div className="confirmacao-overlay">
                <div className="confirmacao-container">
                  <h3>Criar Nova Categoria</h3>
                  <p>A categoria <strong>"{confirmacaoCategoria.nome}"</strong> não existe. Deseja criá-la?</p>
                  <div className="confirmacao-actions">
                    <button 
                      className="btn-secondary"
                      onClick={() => setConfirmacaoCategoria({ show: false, nome: '' })}
                    >
                      Cancelar
                    </button>
                    <button 
                      className="btn-primary"
                      onClick={handleConfirmarNovaCategoria}
                    >
                      Criar Categoria
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {confirmacaoSubcategoria.show && (
              <div className="confirmacao-overlay">
                <div className="confirmacao-container">
                  <h3>Criar Nova Subcategoria</h3>
                  <p>A subcategoria <strong>"{confirmacaoSubcategoria.nome}"</strong> não existe. Deseja criá-la?</p>
                  <div className="confirmacao-actions">
                    <button 
                      className="btn-secondary"
                      onClick={() => setConfirmacaoSubcategoria({ show: false, nome: '', categoriaId: '' })}
                    >
                      Cancelar
                    </button>
                    <button 
                      className="btn-primary"
                      onClick={handleConfirmarNovaSubcategoria}
                    >
                      Criar Subcategoria
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Loading ou Formulário */}
            {(categoriasLoading || contasLoading) ? (
              <div className="loading">
                <div className="loading-spinner"></div>
                <p>Carregando dados...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="form">
                {/* Linha 1: Valor e Data */}
                <div className="form-row">
                  <div className="field-group valor-field">
                    <DollarSign size={18} className="field-icon" />
                    <InputMoney
                      ref={valorInputRef}
                      value={formData.valor}
                      onChange={handleValorChange}
                      placeholder="Valor *"
                      disabled={submitting}
                      className={`input ${errors.valor ? 'error' : ''}`}
                    />
                  </div>
                  
                  <div className="field-group data-field">
                    <Calendar size={18} className="field-icon" />
                    <input
                      type="date"
                      value={formData.data}
                      name="data"
                      onChange={handleChange}
                      className={`input ${errors.data ? 'error' : ''}`}
                      disabled={submitting}
                      title="Data da receita"
                    />
                  </div>
                </div>
                
                {/* Linha 2: Descrição */}
                <div className="field-group">
                  <FileText size={18} className="field-icon" />
                  <input
                    type="text"
                    placeholder="Descrição *"
                    value={formData.descricao}
                    name="descricao"
                    onChange={handleChange}
                    className={`input ${errors.descricao ? 'error' : ''}`}
                    disabled={submitting}
                  />
                </div>
                
                {/* Linha 3: Categoria e Subcategoria */}
                <div className="form-row">
                  <div className="field-group dropdown-field">
                    <Tag size={18} className="field-icon" />
                    <div className="dropdown-wrapper">
                      <input
                        ref={categoriaInputRef}
                        type="text"
                        placeholder="Categoria *"
                        value={formData.categoriaTexto}
                        onChange={handleCategoriaChange}
                        onBlur={handleCategoriaBlur}
                        onFocus={() => setCategoriaDropdownAberto(true)}
                        className={`input ${errors.categoria ? 'error' : ''}`}
                        disabled={submitting}
                        autoComplete="off"
                      />
                      <ChevronDown size={16} className="dropdown-arrow" />
                      
                      {categoriaDropdownAberto && categoriasFiltradas.length > 0 && (
                        <div className="dropdown-options">
                          {categoriasFiltradas.map(categoria => (
                            <div
                              key={categoria.id}
                              className="dropdown-option"
                              onMouseDown={() => handleSelecionarCategoria(categoria)}
                            >
                              <div 
                                className="categoria-cor"
                                style={{ backgroundColor: categoria.cor }}
                              ></div>
                              {categoria.nome}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="field-group dropdown-field">
                    <Tag size={18} className="field-icon" />
                    <div className="dropdown-wrapper">
                      <input
                        ref={subcategoriaInputRef}
                        type="text"
                        placeholder={!formData.categoria ? "Escolha categoria primeiro" : "Subcategoria (opcional)"}
                        value={formData.subcategoriaTexto}
                        onChange={handleSubcategoriaChange}
                        onBlur={handleSubcategoriaBlur}
                        onFocus={() => categoriaSelecionada && setSubcategoriaDropdownAberto(true)}
                        disabled={!formData.categoria || submitting}
                        className={`input ${errors.subcategoria ? 'error' : ''} ${!formData.categoria ? 'disabled' : ''}`}
                        autoComplete="off"
                      />
                      <ChevronDown size={16} className="dropdown-arrow" />
                      
                      {subcategoriaDropdownAberto && subcategoriasFiltradas.length > 0 && (
                        <div className="dropdown-options">
                          {subcategoriasFiltradas.map(subcategoria => (
                            <div
                              key={subcategoria.id}
                              className="dropdown-option"
                              onMouseDown={() => handleSelecionarSubcategoria(subcategoria)}
                            >
                              {subcategoria.nome}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Linha 4: Conta */}
                <div className="field-group">
                  <Building size={18} className="field-icon" />
                  <div className="select-wrapper">
                    <select
                      value={formData.contaDeposito}
                      name="contaDeposito"
                      onChange={handleChange}
                      className={`input select ${errors.contaDeposito ? 'error' : ''}`}
                      disabled={submitting}
                    >
                      <option value="">Conta de depósito *</option>
                      {contas.map(conta => (
                        <option key={conta.id} value={conta.id}>
                          {conta.nome}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="select-arrow" />
                  </div>
                </div>
                
                {/* Linha 5: Observações (opcional) */}
                <div className="field-group">
                  <MessageSquare size={18} className="field-icon" />
                  <textarea
                    placeholder="Observações (opcional)"
                    value={formData.observacoes}
                    onChange={handleObservacoesChange}
                    rows="2"
                    className={`input textarea ${errors.observacoes ? 'error' : ''}`}
                    disabled={submitting}
                  />
                </div>
                
                {/* Botões de ação */}
                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      resetForm();
                      onClose();
                    }}
                    disabled={submitting}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <div className="btn-spinner"></div>
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
      
      {/* Estilos CSS */}
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        
        .modal-container {
          background: white;
          border-radius: 12px;
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
        }
        
        .modal-header h2 {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .btn-close {
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
          border-radius: 6px;
          color: #6b7280;
          transition: all 0.2s ease;
        }
        
        .btn-close:hover {
          background-color: #e5e7eb;
          color: #374151;
        }
        
        .modal-content {
          padding: 24px;
          overflow-y: auto;
          max-height: calc(90vh - 140px);
        }
        
        .feedback {
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 0.875rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .feedback.success {
          background-color: #dcfce7;
          color: #166534;
          border: 1px solid #bbf7d0;
        }
        
        .feedback.error {
          background-color: #fee2e2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }
        
        .loading {
          text-align: center;
          padding: 40px 20px;
        }
        
        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #f3f4f6;
          border-top: 3px solid #10b981;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }
        
        .form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .form-row {
          display: flex;
          gap: 16px;
        }
        
        .field-group {
          position: relative;
          display: flex;
          align-items: center;
          border: 1.5px solid #d1d5db;
          border-radius: 8px;
          background: white;
          min-height: 48px;
          transition: all 0.2s ease;
        }
        
        .field-group:focus-within {
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }
        
        .field-group.error {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }
        
        .valor-field {
          flex: 2;
        }
        
        .data-field {
          flex: 1;
        }
        
        .field-icon {
          margin-left: 14px;
          color: #6b7280;
          flex-shrink: 0;
        }
        
        .input {
          flex: 1;
          border: none;
          outline: none;
          padding: 12px 14px 12px 10px;
          font-size: 1rem;
          background: transparent;
          color: #111827;
        }
        
        .input::placeholder {
          color: #9ca3af;
        }
        
        .input:disabled,
        .input.disabled {
          background-color: #f9fafb;
          color: #9ca3af;
          cursor: not-allowed;
        }
        
        .textarea {
          resize: vertical;
          min-height: 48px;
          padding: 12px 14px 12px 10px;
          font-family: inherit;
          line-height: 1.4;
        }
        
        .dropdown-field .dropdown-wrapper,
        .select-wrapper {
          position: relative;
          flex: 1;
          display: flex;
          align-items: center;
        }
        
        .dropdown-arrow,
        .select-arrow {
          position: absolute;
          right: 12px;
          color: #6b7280;
          pointer-events: none;
        }
        
        .select {
          appearance: none;
          padding-right: 40px;
          cursor: pointer;
        }
        
        .dropdown-options {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          z-index: 1000;
          max-height: 200px;
          overflow-y: auto;
          margin-top: 4px;
        }
        
        .dropdown-option {
          padding: 10px 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background-color 0.15s ease;
          font-size: 0.9rem;
        }
        
        .dropdown-option:hover {
          background-color: #f3f4f6;
        }
        
        .dropdown-option:first-child {
          border-radius: 8px 8px 0 0;
        }
        
        .dropdown-option:last-child {
          border-radius: 0 0 8px 8px;
        }
        
        .categoria-cor {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        
        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 8px;
          padding-top: 20px;
          border-top: 1px solid #f3f4f6;
        }
        
        .btn-secondary {
          flex: 1;
          padding: 12px 20px;
          border: 1.5px solid #d1d5db;
          border-radius: 8px;
          background: white;
          color: #6b7280;
          font-weight: 500;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        
        .btn-secondary:hover:not(:disabled) {
          border-color: #9ca3af;
          color: #374151;
          background-color: #f9fafb;
        }
        
        .btn-secondary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .btn-primary {
          flex: 1;
          padding: 12px 20px;
          border: none;
          border-radius: 8px;
          background: #10b981;
          color: white;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        
        .btn-primary:hover:not(:disabled) {
          background: #059669;
          transform: translateY(-1px);
        }
        
        .btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }
        
        .btn-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        .confirmacao-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1100;
          padding: 20px;
        }
        
        .confirmacao-container {
          background: white;
          border-radius: 12px;
          padding: 24px;
          max-width: 400px;
          width: 100%;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        
        .confirmacao-container h3 {
          margin: 0 0 12px 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
        }
        
        .confirmacao-container p {
          margin: 0 0 20px 0;
          color: #6b7280;
          line-height: 1.5;
          font-size: 0.9rem;
        }
        
        .confirmacao-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }
        
        .confirmacao-actions .btn-secondary {
          flex: none;
          padding: 8px 16px;
          font-size: 0.875rem;
        }
        
        .confirmacao-actions .btn-primary {
          flex: none;
          padding: 8px 16px;
          font-size: 0.875rem;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Melhorias na responsividade */
        @media (max-width: 640px) {
          .modal-overlay {
            padding: 10px;
          }
          
          .modal-container {
            max-width: none;
            width: 100%;
            max-height: 95vh;
          }
          
          .modal-header {
            padding: 16px 20px;
          }
          
          .modal-content {
            padding: 20px;
          }
          
          .form-row {
            flex-direction: column;
            gap: 16px;
          }
          
          .valor-field,
          .data-field {
            flex: 1;
          }
          
          .form-actions {
            flex-direction: column;
          }
          
          .dropdown-options {
            max-height: 150px;
          }
          
          .confirmacao-container {
            margin: 0 20px;
          }
          
          .confirmacao-actions {
            flex-direction: column-reverse;
          }
          
          .confirmacao-actions .btn-secondary,
          .confirmacao-actions .btn-primary {
            flex: 1;
          }
        }
        
        /* Estados de foco melhorados */
        @media (prefers-reduced-motion: no-preference) {
          .field-group:focus-within {
            transform: translateY(-1px);
          }
          
          .btn-primary:hover:not(:disabled) {
            box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
          }
        }
        
        /* Melhor contraste para acessibilidade */
        @media (prefers-contrast: high) {
          .field-group {
            border-width: 2px;
          }
          
          .input::placeholder {
            color: #6b7280;
          }
        }
        
        /* Suporte a tema escuro */
        @media (prefers-color-scheme: dark) {
          .modal-container {
            background: #1f2937;
            color: #f9fafb;
          }
          
          .modal-header {
            background: #111827;
            border-color: #374151;
          }
          
          .modal-header h2 {
            color: #f9fafb;
          }
          
          .btn-close {
            color: #9ca3af;
          }
          
          .btn-close:hover {
            background-color: #374151;
            color: #f3f4f6;
          }
          
          .field-group {
            background: #111827;
            border-color: #4b5563;
          }
          
          .field-group:focus-within {
            border-color: #10b981;
          }
          
          .input {
            color: #f9fafb;
          }
          
          .input::placeholder {
            color: #9ca3af;
          }
          
          .input:disabled,
          .input.disabled {
            background-color: #1f2937;
            color: #6b7280;
          }
          
          .dropdown-options {
            background: #1f2937;
            border-color: #4b5563;
          }
          
          .dropdown-option:hover {
            background-color: #374151;
          }
          
          .btn-secondary {
            background: #1f2937;
            border-color: #4b5563;
            color: #d1d5db;
          }
          
          .btn-secondary:hover:not(:disabled) {
            border-color: #6b7280;
            background-color: #374151;
            color: #f3f4f6;
          }
          
          .form-actions {
            border-color: #374151;
          }
          
          .feedback.success {
            background-color: #064e3b;
            color: #6ee7b7;
            border-color: #047857;
          }
          
          .feedback.error {
            background-color: #7f1d1d;
            color: #fca5a5;
            border-color: #dc2626;
          }
          
          .confirmacao-container {
            background: #1f2937;
          }
          
          .confirmacao-container h3 {
            color: #f9fafb;
          }
          
          .confirmacao-container p {
            color: #d1d5db;
          }
        }
      `}</style>
    </>
  );
};

ReceitasModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default ReceitasModal;

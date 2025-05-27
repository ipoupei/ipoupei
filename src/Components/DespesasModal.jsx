import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { TrendingDown, Plus, X, Calendar, FileText, Tag, Building, DollarSign, MessageSquare, Search } from 'lucide-react';
import InputMoney from './ui/InputMoney';
import useCategorias from '../hooks/useCategorias';
import useContas from '../hooks/useContas';

/**
 * Modal moderno para lançamento de despesas
 * Com busca inteligente e criação automática de categorias/subcategorias
 */
const DespesasModal = ({ isOpen, onClose }) => {
  // Referências para os campos
  const dataInputRef = useRef(null);
  const categoriaInputRef = useRef(null);
  const subcategoriaInputRef = useRef(null);
  
  // Hooks para obter categorias e contas
  const { categorias, loading: categoriasLoading, addCategoria, addSubcategoria } = useCategorias();
  const { contas, loading: contasLoading } = useContas();
  
  // Filtrar apenas categorias do tipo "despesa"
  const categoriasDespesa = categorias.filter(cat => cat.tipo === 'despesa');
  
  // Estados para os campos do formulário
  const [formData, setFormData] = useState({
    data: formatarDataAtual(),
    descricao: '',
    categoria: '',
    categoriaTexto: '',
    subcategoria: '',
    subcategoriaTexto: '',
    contaDebito: '',
    valor: 0,
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
  const categoriaSelecionada = categoriasDespesa.find(cat => cat.id === formData.categoria);
  
  // Efeito para filtrar categorias conforme o usuário digita
  useEffect(() => {
    if (formData.categoriaTexto) {
      const filtradas = categoriasDespesa.filter(cat =>
        cat.nome.toLowerCase().includes(formData.categoriaTexto.toLowerCase())
      );
      setCategoriasFiltradas(filtradas);
    } else {
      setCategoriasFiltradas(categoriasDespesa);
    }
  }, [formData.categoriaTexto, categoriasDespesa]);
  
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
    if (isOpen && dataInputRef.current) {
      setTimeout(() => {
        dataInputRef.current.focus();
      }, 100);
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
      categoria: '', // Limpa a categoria selecionada
      subcategoria: '', // Limpa a subcategoria
      subcategoriaTexto: '' // Limpa o texto da subcategoria
    }));
    
    setCategoriaDropdownAberto(true);
    
    // Limpa erros
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
      subcategoria: '', // Limpa a subcategoria quando muda categoria
      subcategoriaTexto: ''
    }));
    
    setCategoriaDropdownAberto(false);
    
    // Foca no próximo campo
    setTimeout(() => {
      subcategoriaInputRef.current?.focus();
    }, 100);
  };
  
  // Handler para quando o usuário sai do campo categoria (onBlur)
  const handleCategoriaBlur = () => {
    setTimeout(() => {
      setCategoriaDropdownAberto(false);
      
      // Se há texto mas nenhuma categoria selecionada, verificar se precisa criar
      if (formData.categoriaTexto && !formData.categoria) {
        const categoriaExistente = categoriasDespesa.find(cat =>
          cat.nome.toLowerCase() === formData.categoriaTexto.toLowerCase()
        );
        
        if (!categoriaExistente) {
          // Perguntar se quer criar nova categoria
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
      subcategoria: '' // Limpa a subcategoria selecionada
    }));
    
    if (categoriaSelecionada) {
      setSubcategoriaDropdownAberto(true);
    }
    
    // Limpa erros
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
      
      // Se há texto mas nenhuma subcategoria selecionada, verificar se precisa criar
      if (formData.subcategoriaTexto && !formData.subcategoria && categoriaSelecionada) {
        const subcategoriaExistente = (categoriaSelecionada.subcategorias || []).find(sub =>
          sub.nome.toLowerCase() === formData.subcategoriaTexto.toLowerCase()
        );
        
        if (!subcategoriaExistente) {
          // Perguntar se quer criar nova subcategoria
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
        tipo: 'despesa', // SEMPRE despesa neste modal
        cor: '#EF4444' // Vermelho para despesas
      };
      
      const result = await addCategoria(novaCategoria);
      
      if (result.success) {
        // Selecionar a nova categoria
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
        // Selecionar a nova subcategoria
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
    
    // Limpa o erro se existir
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
    
    // Limita a 300 caracteres
    if (value.length <= 300) {
      setFormData(prevData => ({
        ...prevData,
        observacoes: value
      }));
      
      // Limpa o erro se existir
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
    
    // Validação dos campos obrigatórios
    if (!formData.data) newErrors.data = "Data é obrigatória";
    if (!formData.descricao.trim()) newErrors.descricao = "Descrição é obrigatória";
    if (!formData.categoria && !formData.categoriaTexto.trim()) newErrors.categoria = "Categoria é obrigatória";
    if (!formData.contaDebito) newErrors.contaDebito = "Conta é obrigatória";
    if (!formData.valor || formData.valor === 0) newErrors.valor = "Valor é obrigatório";
    
    // Limite de caracteres para observações
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
        
        // Preparar dados para envio
        const dadosDespesa = {
          data: formData.data,
          descricao: formData.descricao.trim(),
          categoria_id: formData.categoria,
          subcategoria_id: formData.subcategoria || null, // Subcategoria é opcional
          conta_id: formData.contaDebito,
          valor: formData.valor,
          observacoes: formData.observacoes.trim(),
          tipo: 'despesa'
        };
        
        // Debug dos dados a serem enviados
        console.log("💸 DespesasModal - Dados da despesa a serem enviados:", dadosDespesa);
        
        // TODO: Aqui você implementará a função para salvar a despesa no Supabase
        // const result = await addDespesa(dadosDespesa);
        
        // Mock da função addDespesa por enquanto
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simula delay da API
        
        // Exibe o feedback de sucesso
        showFeedback('Despesa registrada com sucesso!', 'success');
        
        // Limpa o formulário e fecha após 2 segundos
        setTimeout(() => {
          resetForm();
          onClose();
        }, 2000);
        
      } catch (error) {
        console.error('❌ DespesasModal - Erro ao salvar despesa:', error);
        showFeedback('Erro ao salvar despesa. Tente novamente.', 'error');
      } finally {
        setSubmitting(false);
      }
    }
  };

  // Função para resetar o formulário
  const resetForm = () => {
    setFormData({
      data: formatarDataAtual(),
      descricao: '',
      categoria: '',
      categoriaTexto: '',
      subcategoria: '',
      subcategoriaTexto: '',
      contaDebito: '',
      valor: 0,
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
    <div className="contas-modal-overlay">
      <div className="contas-modal-container">
        {/* Cabeçalho do modal */}
        <div className="contas-modal-header">
          <h2>
            <TrendingDown size={20} className="icon-header" style={{ color: '#ef4444' }} />
            <span>Lançamento de Despesas</span>
          </h2>
          <button 
            className="btn-fechar" 
            onClick={onClose}
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Conteúdo do modal */}
        <div className="contas-modal-content">
          {/* Feedback de sucesso/erro */}
          {feedback.visible && (
            <div className={`feedback-message ${feedback.type}`}>
              <span style={{ marginRight: '8px' }}>
                {feedback.type === 'success' ? '✅' : '❌'}
              </span>
              {feedback.message}
            </div>
          )}
          
          {/* Modal de confirmação para nova categoria */}
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
                    style={{ backgroundColor: '#ef4444' }}
                  >
                    Criar Categoria
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Modal de confirmação para nova subcategoria */}
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
                    style={{ backgroundColor: '#ef4444' }}
                  >
                    Criar Subcategoria
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Verificação se está carregando dados */}
          {(categoriasLoading || contasLoading) ? (
            <div className="loading" style={{ textAlign: 'center', padding: '40px' }}>
              <div className="loading-spinner" style={{
                width: '32px',
                height: '32px',
                border: '3px solid #f3f4f6',
                borderTop: '3px solid #ef4444',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px'
              }}></div>
              <p>Carregando categorias e contas...</p>
            </div>
          ) : (
            /* Formulário de despesa */
            <form onSubmit={handleSubmit} className="conta-form">
              <h3>Nova Despesa</h3>
              
              {/* Data */}
              <div className="form-group">
                <label htmlFor="data">
                  <Calendar size={16} />
                  Data *
                </label>
                <input
                  ref={dataInputRef}
                  type="date"
                  id="data"
                  name="data"
                  value={formData.data}
                  onChange={handleChange}
                  className={errors.data ? 'error' : ''}
                  disabled={submitting}
                />
                {errors.data && (
                  <div className="form-error">{errors.data}</div>
                )}
              </div>
              
              {/* Descrição */}
              <div className="form-group">
                <label htmlFor="descricao">
                  <FileText size={16} />
                  Descrição *
                </label>
                <input
                  type="text"
                  id="descricao"
                  name="descricao"
                  placeholder="Ex: Almoço no restaurante"
                  value={formData.descricao}
                  onChange={handleChange}
                  className={errors.descricao ? 'error' : ''}
                  disabled={submitting}
                />
                {errors.descricao && (
                  <div className="form-error">{errors.descricao}</div>
                )}
              </div>
              
              {/* Categoria e Subcategoria */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="categoria">
                    <Tag size={16} />
                    Categoria *
                  </label>
                  <div className="categoria-input-container" style={{ position: 'relative' }}>
                    <input
                      ref={categoriaInputRef}
                      type="text"
                      id="categoria"
                      name="categoriaTexto"
                      placeholder="Digite ou selecione uma categoria"
                      value={formData.categoriaTexto}
                      onChange={handleCategoriaChange}
                      onBlur={handleCategoriaBlur}
                      onFocus={() => setCategoriaDropdownAberto(true)}
                      className={errors.categoria ? 'error' : ''}
                      disabled={submitting}
                      autoComplete="off"
                    />
                    <Search size={16} style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#6b7280',
                      pointerEvents: 'none'
                    }} />
                    
                    {/* Dropdown de categorias */}
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
                              style={{ 
                                width: '12px', 
                                height: '12px', 
                                borderRadius: '50%',
                                backgroundColor: categoria.cor,
                                marginRight: '8px'
                              }}
                            ></div>
                            {categoria.nome}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {errors.categoria && (
                    <div className="form-error">{errors.categoria}</div>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="subcategoria">
                    <Tag size={16} />
                    Subcategoria <small>(opcional)</small>
                  </label>
                  <div className="subcategoria-input-container" style={{ position: 'relative' }}>
                    <input
                      ref={subcategoriaInputRef}
                      type="text"
                      id="subcategoria"
                      name="subcategoriaTexto"
                      placeholder={!formData.categoria ? "Selecione uma categoria primeiro" : "Digite ou selecione uma subcategoria"}
                      value={formData.subcategoriaTexto}
                      onChange={handleSubcategoriaChange}
                      onBlur={handleSubcategoriaBlur}
                      onFocus={() => categoriaSelecionada && setSubcategoriaDropdownAberto(true)}
                      disabled={!formData.categoria || submitting}
                      className={errors.subcategoria ? 'error' : ''}
                      style={{
                        backgroundColor: !formData.categoria ? '#f9fafb' : 'white'
                      }}
                      autoComplete="off"
                    />
                    <Search size={16} style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#6b7280',
                      pointerEvents: 'none'
                    }} />
                    
                    {/* Dropdown de subcategorias */}
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
                  {errors.subcategoria && (
                    <div className="form-error">{errors.subcategoria}</div>
                  )}
                </div>
              </div>
              
              {/* Conta Débito e Valor */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="contaDebito">
                    <Building size={16} />
                    Conta Débito *
                  </label>
                  <select
                    id="contaDebito"
                    name="contaDebito"
                    value={formData.contaDebito}
                    onChange={handleChange}
                    className={errors.contaDebito ? 'error' : ''}
                    disabled={submitting}
                  >
                    <option value="">Selecione uma conta</option>
                    {contas.map(conta => (
                      <option key={conta.id} value={conta.id}>
                        {conta.nome}
                      </option>
                    ))}
                  </select>
                  {errors.contaDebito && (
                    <div className="form-error">{errors.contaDebito}</div>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="valor">
                    <DollarSign size={16} />
                    Valor *
                  </label>
                  <InputMoney
                    id="valor"
                    name="valor"
                    value={formData.valor}
                    onChange={handleValorChange}
                    placeholder="R$ 0,00"
                    disabled={submitting}
                    style={{
                      borderColor: errors.valor ? '#ef4444' : '#d1d5db'
                    }}
                  />
                  {errors.valor && (
                    <div className="form-error">{errors.valor}</div>
                  )}
                </div>
              </div>
              
              {/* Observações */}
              <div className="form-group">
                <label htmlFor="observacoes">
                  <MessageSquare size={16} />
                  Observações
                  <small>(opcional, máx. 300 caracteres)</small>
                </label>
                <textarea
                  id="observacoes"
                  name="observacoes"
                  value={formData.observacoes}
                  onChange={handleObservacoesChange}
                  placeholder="Adicione informações extras sobre esta despesa"
                  rows="3"
                  className={errors.observacoes ? 'error' : ''}
                  disabled={submitting}
                  style={{ resize: 'vertical' }}
                />
                <div style={{ 
                  textAlign: 'right', 
                  fontSize: '12px', 
                  color: '#6b7280',
                  marginTop: '4px'
                }}>
                  {formData.observacoes.length}/300
                </div>
                {errors.observacoes && (
                  <div className="form-error">{errors.observacoes}</div>
                )}
              </div>
              
              {/* Botões de ação */}
              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    onClose();
                  }}
                  className="btn-secondary"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                  style={{ backgroundColor: '#ef4444' }}
                >
                  {submitting ? (
                    <>
                      <div className="loading-spinner" style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid transparent',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Salvar Despesa
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      
      <style jsx>{`
        .categoria-input-container,
        .subcategoria-input-container {
          position: relative;
        }
        
        .dropdown-options {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #d1d5db;
          border-top: none;
          border-radius: 0 0 6px 6px;
          max-height: 200px;
          overflow-y: auto;
          z-index: 1000;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        
        .dropdown-option {
          padding: 12px 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          border-bottom: 1px solid #f3f4f6;
          transition: background-color 0.2s ease;
        }
        
        .dropdown-option:hover {
          background-color: #f9fafb;
        }
        
        .dropdown-option:last-child {
          border-bottom: none;
        }
        
        .categoria-cor {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin-right: 8px;
          flex-shrink: 0;
        }
        
        .confirmacao-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1100;
        }
        
        .confirmacao-container {
          background: white;
          border-radius: 12px;
          padding: 24px;
          max-width: 400px;
          width: 90%;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        
        .confirmacao-container h3 {
          margin: 0 0 16px 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
        }
        
        .confirmacao-container p {
          margin: 0 0 24px 0;
          color: #6b7280;
          line-height: 1.5;
        }
        
        .confirmacao-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }
        
        .loading-spinner {
          display: inline-block;
          margin-right: 8px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Ajustes para inputs com busca */
        input[type="text"]:focus + .dropdown-options {
          display: block;
        }
        
        /* Responsividade */
        @media (max-width: 640px) {
          .dropdown-options {
            max-height: 150px;
          }
          
          .confirmacao-container {
            margin: 20px;
            width: calc(100% - 40px);
          }
          
          .confirmacao-actions {
            flex-direction: column-reverse;
          }
          
          .confirmacao-actions button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

DespesasModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default DespesasModal;
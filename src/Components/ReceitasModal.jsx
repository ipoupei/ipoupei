import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { TrendingUp, Plus, X, Calendar, FileText, Tag, Building, DollarSign, MessageSquare, Search, ChevronDown } from 'lucide-react';
import InputMoney from './ui/InputMoney';
import useCategorias from '../hooks/useCategorias';
import useContas from '../hooks/useContas';

/**
 * Modal compacto para lançamento de receitas
 * Layout otimizado com placeholders como labels
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
  
  // Estado para controle do toggle "Foi recebida"
  const [foiRecebida, setFoiRecebida] = useState(true);
  
  // Estado para mostrar detalhes adicionais
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);
  
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
        const categoriaExistente = categoriasReceita.find(cat =>
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
        tipo: 'receita', // SEMPRE receita neste modal
        cor: '#10B981' // Verde para receitas
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
    if (!formData.contaDeposito) newErrors.contaDeposito = "Conta é obrigatória";
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
        const dadosReceita = {
          data: formData.data,
          descricao: formData.descricao.trim(),
          categoria_id: formData.categoria,
          subcategoria_id: formData.subcategoria || null, // Subcategoria é opcional
          conta_id: formData.contaDeposito,
          valor: formData.valor,
          observacoes: formData.observacoes.trim(),
          tipo: 'receita',
          foi_recebida: foiRecebida
        };
        
        // Debug dos dados a serem enviados
        console.log("💰 ReceitasModal - Dados da receita a serem enviados:", dadosReceita);
        
        // TODO: Aqui você implementará a função para salvar a receita no Supabase
        // const result = await addReceita(dadosReceita);
        
        // Mock da função addReceita por enquanto
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simula delay da API
        
        // Exibe o feedback de sucesso
        showFeedback('Receita registrada com sucesso!', 'success');
        
        // Limpa o formulário e fecha após 2 segundos
        setTimeout(() => {
          resetForm();
          onClose();
        }, 2000);
        
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
    setFoiRecebida(true);
    setMostrarDetalhes(false);
  };

  // Se não estiver aberto, não renderiza
  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay-compact">
        <div className="modal-container-compact">
          {/* Cabeçalho do modal */}
          <div className="modal-header-compact">
            <h2>Nova receita</h2>
            <button 
              className="btn-close-compact" 
              onClick={onClose}
              aria-label="Fechar"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Conteúdo do modal */}
          <div className="modal-content-compact">
            {/* Feedback de sucesso/erro */}
            {feedback.visible && (
              <div className={`feedback-compact ${feedback.type}`}>
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
                      style={{ backgroundColor: '#10b981' }}
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
                      style={{ backgroundColor: '#10b981' }}
                    >
                      Criar Subcategoria
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Verificação se está carregando dados */}
            {(categoriasLoading || contasLoading) ? (
              <div className="loading-compact">
                <div className="loading-spinner-compact"></div>
                <p>Carregando...</p>
              </div>
            ) : (
              /* Formulário de receita */
              <form onSubmit={handleSubmit} className="form-compact">
                {/* Valor e Data na mesma linha */}
                <div className="form-row-compact">
                  <div className="field-group-compact valor-field">
                    <DollarSign size={18} className="field-icon" />
                    <InputMoney
                      ref={valorInputRef}
                      value={formData.valor}
                      onChange={handleValorChange}
                      placeholder="Valor"
                      disabled={submitting}
                      className={`input-compact input-valor ${errors.valor ? 'error' : ''}`}
                    />
                    <span className="currency-code">BRL</span>
                  </div>
                  
                  <div className="field-group-compact data-field">
                    <Calendar size={18} className="field-icon" />
                    <input
                      type="date"
                      value={formData.data}
                      name="data"
                      onChange={handleChange}
                      className={`input-compact ${errors.data ? 'error' : ''}`}
                      disabled={submitting}
                    />
                  </div>
                </div>
                
                {/* Toggle Foi Recebida */}
                <div className="toggle-row-compact">
                  <div className="toggle-group">
                    <div className="toggle-icon">
                      <div className="clock-icon"></div>
                    </div>
                    <span className="toggle-label">Foi recebida</span>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={foiRecebida}
                        onChange={(e) => setFoiRecebida(e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
                
                {/* Botões de período (Hoje, Ontem, Outros...) */}
                <div className="period-buttons-compact">
                  <button
                    type="button"
                    className="period-btn active"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, data: formatarDataAtual() }));
                    }}
                  >
                    Hoje
                  </button>
                  <button
                    type="button"
                    className="period-btn"
                    onClick={() => {
                      const ontem = new Date();
                      ontem.setDate(ontem.getDate() - 1);
                      const ano = ontem.getFullYear();
                      const mes = String(ontem.getMonth() + 1).padStart(2, '0');
                      const dia = String(ontem.getDate()).padStart(2, '0');
                      setFormData(prev => ({ ...prev, data: `${ano}-${mes}-${dia}` }));
                    }}
                  >
                    Ontem
                  </button>
                  <button type="button" className="period-btn">
                    Outros...
                  </button>
                </div>
                
                {/* Descrição */}
                <div className="field-group-compact">
                  <FileText size={18} className="field-icon" />
                  <input
                    type="text"
                    placeholder="Descrição"
                    value={formData.descricao}
                    name="descricao"
                    onChange={handleChange}
                    className={`input-compact ${errors.descricao ? 'error' : ''}`}
                    disabled={submitting}
                  />
                </div>
                
                {/* Categoria */}
                <div className="field-group-compact dropdown-field">
                  <Tag size={18} className="field-icon" />
                  <div className="dropdown-wrapper">
                    <input
                      ref={categoriaInputRef}
                      type="text"
                      placeholder="Digite ou selecione uma categoria"
                      value={formData.categoriaTexto}
                      onChange={handleCategoriaChange}
                      onBlur={handleCategoriaBlur}
                      onFocus={() => setCategoriaDropdownAberto(true)}
                      className={`input-compact ${errors.categoria ? 'error' : ''}`}
                      disabled={submitting}
                      autoComplete="off"
                    />
                    <ChevronDown size={16} className="dropdown-arrow" />
                    
                    {/* Dropdown de categorias */}
                    {categoriaDropdownAberto && categoriasFiltradas.length > 0 && (
                      <div className="dropdown-options-compact">
                        {categoriasFiltradas.map(categoria => (
                          <div
                            key={categoria.id}
                            className="dropdown-option-compact"
                            onMouseDown={() => handleSelecionarCategoria(categoria)}
                          >
                            <div 
                              className="categoria-cor-compact"
                              style={{ backgroundColor: categoria.cor }}
                            ></div>
                            {categoria.nome}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Conta */}
                <div className="field-group-compact dropdown-field">
                  <Building size={18} className="field-icon" />
                  <div className="conta-wrapper">
                    <select
                      value={formData.contaDeposito}
                      name="contaDeposito"
                      onChange={handleChange}
                      className={`input-compact select-compact ${errors.contaDeposito ? 'error' : ''}`}
                      disabled={submitting}
                    >
                      <option value="">Selecione uma conta</option>
                      {contas.map(conta => (
                        <option key={conta.id} value={conta.id}>
                          {conta.nome}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="dropdown-arrow" />
                  </div>
                </div>
                
                {/* Botão para mostrar mais detalhes */}
                <button
                  type="button"
                  className="mais-detalhes-btn"
                  onClick={() => setMostrarDetalhes(!mostrarDetalhes)}
                >
                  Mais detalhes
                  <ChevronDown 
                    size={16} 
                    className={`chevron-icon ${mostrarDetalhes ? 'rotated' : ''}`} 
                  />
                </button>
                
                {/* Campos adicionais (mostrados apenas quando expandido) */}
                {mostrarDetalhes && (
                  <div className="detalhes-section">
                    {/* Subcategoria */}
                    <div className="field-group-compact dropdown-field">
                      <Tag size={18} className="field-icon" />
                      <div className="dropdown-wrapper">
                        <input
                          ref={subcategoriaInputRef}
                          type="text"
                          placeholder={!formData.categoria ? "Selecione uma categoria primeiro" : "Subcategoria (opcional)"}
                          value={formData.subcategoriaTexto}
                          onChange={handleSubcategoriaChange}
                          onBlur={handleSubcategoriaBlur}
                          onFocus={() => categoriaSelecionada && setSubcategoriaDropdownAberto(true)}
                          disabled={!formData.categoria || submitting}
                          className={`input-compact ${errors.subcategoria ? 'error' : ''}`}
                          style={{ backgroundColor: !formData.categoria ? '#f9fafb' : 'white' }}
                          autoComplete="off"
                        />
                        <ChevronDown size={16} className="dropdown-arrow" />
                        
                        {/* Dropdown de subcategorias */}
                        {subcategoriaDropdownAberto && subcategoriasFiltradas.length > 0 && (
                          <div className="dropdown-options-compact">
                            {subcategoriasFiltradas.map(subcategoria => (
                              <div
                                key={subcategoria.id}
                                className="dropdown-option-compact"
                                onMouseDown={() => handleSelecionarSubcategoria(subcategoria)}
                              >
                                {subcategoria.nome}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Observações */}
                    <div className="field-group-compact">
                      <MessageSquare size={18} className="field-icon" />
                      <textarea
                        placeholder="Observações (opcional)"
                        value={formData.observacoes}
                        onChange={handleObservacoesChange}
                        rows="2"
                        className={`input-compact textarea-compact ${errors.observacoes ? 'error' : ''}`}
                        disabled={submitting}
                      />
                    </div>
                  </div>
                )}
                
                {/* Botões de ação */}
                <div className="actions-compact">
                  <button
                    type="button"
                    className="btn-secondary-compact"
                    onClick={() => {
                      // TODO: Implementar "Salvar e criar nova"
                      handleSubmit({ preventDefault: () => {} });
                    }}
                    disabled={submitting}
                  >
                    SALVAR E CRIAR NOVA
                  </button>
                  <button
                    type="submit"
                    className="btn-primary-compact"
                    disabled={submitting}
                  >
                    {submitting ? 'SALVANDO...' : 'SALVAR'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
      
      {/* Estilos CSS */}
      <style jsx>{`
        .modal-overlay-compact {
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
        
        .modal-container-compact {
          background: white;
          border-radius: 16px;
          width: 100%;
          max-width: 480px;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        
        .modal-header-compact {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px 16px;
          border-bottom: 1px solid #f3f4f6;
        }
        
        .modal-header-compact h2 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
        }
        
        .btn-close-compact {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          color: #6b7280;
          transition: all 0.2s ease;
        }
        
        .btn-close-compact:hover {
          background-color: #f3f4f6;
          color: #374151;
        }
        
        .modal-content-compact {
          padding: 24px;
          overflow-y: auto;
          max-height: calc(90vh - 100px);
        }
        
        .feedback-compact {
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 0.875rem;
          font-weight: 500;
        }
        
        .feedback-compact.success {
          background-color: #d1fae5;
          color: #065f46;
          border: 1px solid #a7f3d0;
        }
        
        .feedback-compact.error {
          background-color: #fee2e2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }
        
        .loading-compact {
          text-align: center;
          padding: 40px 20px;
        }
        
        .loading-spinner-compact {
          width: 24px;
          height: 24px;
          border: 2px solid #f3f4f6;
          border-top: 2px solid #10b981;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 12px;
        }
        
        .form-compact {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .form-row-compact {
          display: flex;
          gap: 12px;
        }
        
        .field-group-compact {
          position: relative;
          display: flex;
          align-items: center;
          border: 1px solid #d1d5db;
          border-radius: 12px;
          background: white;
          min-height: 50px;
          transition: all 0.2s ease;
        }
        
        .field-group-compact:focus-within {
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }
        
        .field-group-compact.error {
          border-color: #ef4444;
        }
        
        .valor-field {
          flex: 2;
        }
        
        .data-field {
          flex: 1;
        }
        
        .field-icon {
          margin-left: 16px;
          color: #6b7280;
          flex-shrink: 0;
        }
        
        .input-compact {
          flex: 1;
          border: none;
          outline: none;
          padding: 12px 16px 12px 8px;
          font-size: 1rem;
          background: transparent;
          color: #111827;
        }
        
        .input-valor {
          font-size: 1.125rem;
          font-weight: 600;
          color: #10b981;
        }
        
        .currency-code {
          padding-right: 16px;
          font-size: 0.875rem;
          color: #6b7280;
          font-weight: 500;
        }
        
        .input-compact::placeholder {
          color: #9ca3af;
        }
        
        .input-compact:disabled {
          background-color: #f9fafb;
          color: #6b7280;
        }
        
        .toggle-row-compact {
          padding: 0 4px;
        }
        
        .toggle-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .toggle-icon {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .clock-icon {
          width: 16px;
          height: 16px;
          border: 2px solid #6b7280;
          border-radius: 50%;
          position: relative;
        }
        
        .clock-icon::after {
          content: '';
          position: absolute;
          top: 2px;
          left: 6px;
          width: 2px;
          height: 6px;
          background: #6b7280;
          border-radius: 1px;
        }
        
        .toggle-label {
          flex: 1;
          color: #374151;
          font-weight: 500;
        }
        
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
        }
        
        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        
        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #d1d5db;
          transition: 0.3s;
          border-radius: 24px;
        }
        
        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.3s;
          border-radius: 50%;
        }
        
        input:checked + .toggle-slider {
          background-color: #10b981;
        }
        
        input:checked + .toggle-slider:before {
          transform: translateX(20px);
        }
        
        .period-buttons-compact {
          display: flex;
          gap: 8px;
          padding: 0 4px;
        }
        
        .period-btn {
          flex: 1;
          padding: 8px 16px;
          border: 1px solid #d1d5db;
          border-radius: 20px;
          background: white;
          color: #6b7280;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .period-btn:hover {
          border-color: #10b981;
          color: #10b981;
        }
        
        .period-btn.active {
          background: #10b981;
          border-color: #10b981;
          color: white;
        }
        
        .dropdown-field .dropdown-wrapper,
        .dropdown-field .conta-wrapper {
          position: relative;
          flex: 1;
          display: flex;
          align-items: center;
        }
        
        .dropdown-arrow {
          position: absolute;
          right: 12px;
          color: #6b7280;
          pointer-events: none;
        }
        
        .select-compact {
          appearance: none;
          padding-right: 40px;
        }
        
        .dropdown-options-compact {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          max-height: 200px;
          overflow-y: auto;
          margin-top: 4px;
        }
        
        .dropdown-option-compact {
          padding: 12px 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background-color 0.2s ease;
          font-size: 0.875rem;
        }
        
        .dropdown-option-compact:hover {
          background-color: #f9fafb;
        }
        
        .categoria-cor-compact {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        
        .mais-detalhes-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: none;
          border: none;
          color: #10b981;
          font-weight: 500;
          cursor: pointer;
          padding: 12px;
          border-radius: 8px;
          transition: all 0.2s ease;
          font-size: 0.875rem;
        }
        
        .mais-detalhes-btn:hover {
          background-color: #f0fdf4;
        }
        
        .chevron-icon {
          transition: transform 0.2s ease;
        }
        
        .chevron-icon.rotated {
          transform: rotate(180deg);
        }
        
        .detalhes-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding-top: 8px;
        }
        
        .textarea-compact {
          resize: vertical;
          min-height: 60px;
          padding: 12px 16px 12px 8px;
          font-family: inherit;
        }
        
        .actions-compact {
          display: flex;
          gap: 12px;
          margin-top: 8px;
        }
        
        .btn-secondary-compact {
          flex: 1;
          padding: 14px 20px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: white;
          color: #6b7280;
          font-weight: 500;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .btn-secondary-compact:hover {
          border-color: #10b981;
          color: #10b981;
        }
        
        .btn-primary-compact {
          flex: 1;
          padding: 14px 20px;
          border: none;
          border-radius: 8px;
          background: #10b981;
          color: white;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .btn-primary-compact:hover:not(:disabled) {
          background: #059669;
        }
        
        .btn-primary-compact:disabled {
          opacity: 0.6;
          cursor: not-allowed;
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
        
        .btn-secondary {
          padding: 8px 16px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: white;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .btn-secondary:hover {
          border-color: #9ca3af;
          color: #374151;
        }
        
        .btn-primary {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          background: #10b981;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .btn-primary:hover {
          background: #059669;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Responsividade */
        @media (max-width: 640px) {
          .modal-container-compact {
            margin: 20px;
            width: calc(100% - 40px);
            max-height: calc(100vh - 40px);
          }
          
          .form-row-compact {
            flex-direction: column;
          }
          
          .valor-field,
          .data-field {
            flex: 1;
          }
          
          .period-buttons-compact {
            flex-direction: column;
          }
          
          .actions-compact {
            flex-direction: column;
          }
          
          .dropdown-options-compact {
            max-height: 150px;
          }
        }
        
        /* Melhorias na acessibilidade */
        @media (prefers-reduced-motion: reduce) {
          .toggle-slider,
          .toggle-slider:before,
          .chevron-icon,
          .btn-secondary-compact,
          .btn-primary-compact {
            transition: none;
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

import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { TrendingUp, Plus, X, Calendar, FileText, Tag, Building, DollarSign, MessageSquare, Search } from 'lucide-react';
import InputMoney from './ui/InputMoney';
import useCategorias from '../hooks/useCategorias';
import useContas from '../hooks/useContas';

/**
 * Modal melhorado para lançamento de receitas
 * Interface mais limpa e organizada seguindo o padrão do concorrente
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
    conta: '',
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
    if (!formData.valor || formData.valor === 0) newErrors.valor = "Valor é obrigatório";
    if (!formData.data) newErrors.data = "Data é obrigatória";
    if (!formData.descricao.trim()) newErrors.descricao = "Descrição é obrigatória";
    if (!formData.categoria && !formData.categoriaTexto.trim()) newErrors.categoria = "Categoria é obrigatória";
    if (!formData.conta) newErrors.conta = "Conta é obrigatória";
    
    // Limite de caracteres para observações
    if (formData.observacoes.length > 300) {
      newErrors.observacoes = "Máximo de 300 caracteres";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handler para o envio do formulário
  const handleSubmit = async (e, criarNova = false) => {
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
          conta_id: formData.conta,
          valor: formData.valor,
          observacoes: formData.observacoes.trim(),
          tipo: 'receita'
        };
        
        // Debug dos dados a serem enviados
        console.log("💰 ReceitasModal - Dados da receita a serem enviados:", dadosReceita);
        
        // TODO: Aqui você implementará a função para salvar a receita no Supabase
        // const result = await addReceita(dadosReceita);
        
        // Mock da função addReceita por enquanto
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simula delay da API
        
        // Exibe o feedback de sucesso
        if (criarNova) {
          showFeedback('Receita salva! Cadastre uma nova receita.', 'success');
          // Reseta apenas os campos principais, mantém categoria e conta selecionadas
          setFormData(prev => ({
            ...prev,
            valor: 0,
            data: formatarDataAtual(),
            descricao: '',
            observacoes: ''
          }));
          // Foca no campo valor para agilizar o próximo cadastro
          setTimeout(() => {
            valorInputRef.current?.focus();
          }, 100);
        } else {
          showFeedback('Receita registrada com sucesso!', 'success');
          // Limpa o formulário e fecha após 2 segundos
          setTimeout(() => {
            resetForm();
            onClose();
          }, 2000);
        }
        
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
      conta: '',
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
    <div className="modal-overlay">
      <div className="modal-container receitas-modal">
        {/* Cabeçalho do modal */}
        <div className="modal-header">
          <h2 className="modal-title">
            <TrendingUp size={20} className="modal-icon" />
            <span>Lançamento de Receitas</span>
          </h2>
          <button 
            className="modal-close-btn" 
            onClick={onClose}
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Conteúdo do modal */}
        <div className="modal-content">
          {/* Feedback de sucesso/erro */}
          {feedback.visible && (
            <div className={`feedback-alert ${feedback.type}`}>
              <span className="feedback-icon">
                {feedback.type === 'success' ? '✅' : '❌'}
              </span>
              {feedback.message}
            </div>
          )}
          
          {/* Modal de confirmação para nova categoria */}
          {confirmacaoCategoria.show && (
            <div className="confirmation-overlay">
              <div className="confirmation-modal">
                <h3>Criar Nova Categoria</h3>
                <p>A categoria <strong>"{confirmacaoCategoria.nome}"</strong> não existe. Deseja criá-la?</p>
                <div className="confirmation-actions">
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setConfirmacaoCategoria({ show: false, nome: '' })}
                  >
                    Cancelar
                  </button>
                  <button 
                    className="btn btn-primary btn-success"
                    onClick={handleConfirmarNovaCategoria}
                  >
                    Criar Categoria
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Modal de confirmação para nova subcategoria */}
          {confirmacaoSubcategoria.show && (
            <div className="confirmation-overlay">
              <div className="confirmation-modal">
                <h3>Criar Nova Subcategoria</h3>
                <p>A subcategoria <strong>"{confirmacaoSubcategoria.nome}"</strong> não existe. Deseja criá-la?</p>
                <div className="confirmation-actions">
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setConfirmacaoSubcategoria({ show: false, nome: '', categoriaId: '' })}
                  >
                    Cancelar
                  </button>
                  <button 
                    className="btn btn-primary btn-success"
                    onClick={handleConfirmarNovaSubcategoria}
                  >
                    Criar Subcategoria
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Verificação se está carregando dados */}
          {(categoriasLoading || contasLoading) ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Carregando dados...</p>
            </div>
          ) : (
            /* Formulário de receita */
            <form onSubmit={handleSubmit} className="receita-form">
              {/* Primeira linha: Valor e Data */}
              <div className="form-row">
                <div className="form-group form-group-valor">
                  <label htmlFor="valor" className="form-label">
                    <DollarSign size={16} />
                    Valor *
                  </label>
                  <InputMoney
                    ref={valorInputRef}
                    id="valor"
                    name="valor"
                    value={formData.valor}
                    onChange={handleValorChange}
                    placeholder="R$ 0,00"
                    disabled={submitting}
                    className={`form-input valor-input ${errors.valor ? 'error' : ''}`}
                  />
                  {errors.valor && (
                    <div className="form-error">{errors.valor}</div>
                  )}
                </div>
                
                <div className="form-group form-group-data">
                  <label htmlFor="data" className="form-label">
                    <Calendar size={16} />
                    Data *
                  </label>
                  <input
                    type="date"
                    id="data"
                    name="data"
                    value={formData.data}
                    onChange={handleChange}
                    className={`form-input ${errors.data ? 'error' : ''}`}
                    disabled={submitting}
                  />
                  {errors.data && (
                    <div className="form-error">{errors.data}</div>
                  )}
                </div>
              </div>
              
              {/* Segunda linha: Descrição */}
              <div className="form-group">
                <label htmlFor="descricao" className="form-label">
                  <FileText size={16} />
                  Descrição *
                </label>
                <input
                  type="text"
                  id="descricao"
                  name="descricao"
                  placeholder="Ex: Pagamento projeto XPTO"
                  value={formData.descricao}
                  onChange={handleChange}
                  className={`form-input ${errors.descricao ? 'error' : ''}`}
                  disabled={submitting}
                />
                {errors.descricao && (
                  <div className="form-error">{errors.descricao}</div>
                )}
              </div>
              
              {/* Terceira linha: Categoria e Subcategoria */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="categoria" className="form-label">
                    <Tag size={16} />
                    Categoria *
                  </label>
                  <div className="search-input-container">
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
                      className={`form-input search-input ${errors.categoria ? 'error' : ''}`}
                      disabled={submitting}
                      autoComplete="off"
                    />
                    <Search size={16} className="search-icon" />
                    
                    {/* Dropdown de categorias */}
                    {categoriaDropdownAberto && categoriasFiltradas.length > 0 && (
                      <div className="dropdown-menu">
                        {categoriasFiltradas.map(categoria => (
                          <div
                            key={categoria.id}
                            className="dropdown-item"
                            onMouseDown={() => handleSelecionarCategoria(categoria)}
                          >
                            <div 
                              className="categoria-color"
                              style={{ backgroundColor: categoria.cor }}
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
                  <label htmlFor="subcategoria" className="form-label">
                    <Tag size={16} />
                    Subcategoria <small>(opcional)</small>
                  </label>
                  <div className="search-input-container">
                    <input
                      ref={subcategoriaInputRef}
                      type="text"
                      id="subcategoria"
                      name="subcategoriaTexto"
                      placeholder={!formData.categoria ? "Selecione uma categoria primeiro" : "Digite ou selecione"}
                      value={formData.subcategoriaTexto}
                      onChange={handleSubcategoriaChange}
                      onBlur={handleSubcategoriaBlur}
                      onFocus={() => categoriaSelecionada && setSubcategoriaDropdownAberto(true)}
                      disabled={!formData.categoria || submitting}
                      className={`form-input search-input ${errors.subcategoria ? 'error' : ''} ${!formData.categoria ? 'disabled' : ''}`}
                      autoComplete="off"
                    />
                    <Search size={16} className="search-icon" />
                    
                    {/* Dropdown de subcategorias */}
                    {subcategoriaDropdownAberto && subcategoriasFiltradas.length > 0 && (
                      <div className="dropdown-menu">
                        {subcategoriasFiltradas.map(subcategoria => (
                          <div
                            key={subcategoria.id}
                            className="dropdown-item"
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
              
              {/* Quarta linha: Conta */}
              <div className="form-group">
                <label htmlFor="conta" className="form-label">
                  <Building size={16} />
                  Conta *
                </label>
                <select
                  id="conta"
                  name="conta"
                  value={formData.conta}
                  onChange={handleChange}
                  className={`form-input form-select ${errors.conta ? 'error' : ''}`}
                  disabled={submitting}
                >
                  <option value="">Selecione uma conta</option>
                  {contas.map(conta => (
                    <option key={conta.id} value={conta.id}>
                      {conta.nome}
                    </option>
                  ))}
                </select>
                {errors.conta && (
                  <div className="form-error">{errors.conta}</div>
                )}
              </div>
              
              {/* Quinta linha: Observações */}
              <div className="form-group">
                <label htmlFor="observacoes" className="form-label">
                  <MessageSquare size={16} />
                  Observações
                  <small>(opcional, máx. 300 caracteres)</small>
                </label>
                <textarea
                  id="observacoes"
                  name="observacoes"
                  value={formData.observacoes}
                  onChange={handleObservacoesChange}
                  placeholder="Adicione informações extras sobre esta receita"
                  rows="3"
                  className={`form-input form-textarea ${errors.observacoes ? 'error' : ''}`}
                  disabled={submitting}
                />
                <div className="char-counter">
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
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, true)}
                  className="btn btn-primary btn-outline"
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
                      Salvar e Criar Nova
                    </>
                  )}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-success"
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
          border-radius: 16px;
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 24px 0 24px;
          border-bottom: 1px solid #f3f4f6;
          margin-bottom: 24px;
        }

        .modal-title {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
        }

        .modal-icon {
          color: #10b981;
        }

        .modal-close-btn {
          background: none;
          border: none;
          padding: 8px;
          border-radius: 8px;
          cursor: pointer;
          color: #6b7280;
          transition: all 0.2s;
        }

        .modal-close-btn:hover {
          background-color: #f3f4f6;
          color: #374151;
        }

        .modal-content {
          padding: 0 14px 14px 14px;
        }

        .feedback-alert {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 14px;
          font-weight: 500;
        }

        .feedback-alert.success {
          background-color: #d1fae5;
          color: #065f46;
          border: 1px solid #a7f3d0;
        }

        .feedback-alert.error {
          background-color: #fee2e2;
          color: #991b1b;
          border: 1px solid #fca5a5;
        }

        .confirmation-overlay {
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

        .confirmation-modal {
          background: white;
          border-radius: 12px;
          padding: 24px;
          max-width: 400px;
          width: 90%;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        .confirmation-modal h3 {
          margin: 0 0 16px 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
        }

        .confirmation-modal p {
          margin: 0 0 24px 0;
          color: #6b7280;
          line-height: 1.5;
        }

        .confirmation-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .loading-state {
          text-align: center;
          padding: 40px;
        }

        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #f3f4f6;
          border-top: 3px solid #10b981;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }

        .receita-form {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-row {
          display: flex;
          gap: 6px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }

        .form-group-valor {
          flex: 2;
        }

        .form-group-data {
          flex: 1;
        }

        .form-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 500;
          color: #374151;
          font-size: 14px;
        }

        .form-label small {
          font-weight: 400;
          color: #6b7280;
          margin-left: 4px;
        }

        .form-input {
          padding: 10px 14px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s;
          background: white;
          height: 44px;
          box-sizing: border-box;
        }

        .form-input:focus {
          outline: none;
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }

        .form-input.error {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }

        .form-input.disabled {
          background-color: #f9fafb;
          color: #9ca3af;
          cursor: not-allowed;
        }

        .valor-input {
          font-size: 16px;
          font-weight: 600;
          color: #10b981;
          height: 44px;
        }

        .search-input-container {
          position: relative;
        }

        .search-input {
          padding-right: 36px;
          height: 44px;
        }

        .search-icon {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          pointer-events: none;
        }

        .dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #d1d5db;
          border-top: none;
          border-radius: 0 0 8px 8px;
          max-height: 200px;
          overflow-y: auto;
          z-index: 1000;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .dropdown-item {
          padding: 10px 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background-color 0.2s;
          font-size: 14px;
        }

        .dropdown-item:hover {
          background-color: #f9fafb;
        }

        .categoria-color {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .form-select {
          cursor: pointer;
          height: 44px;
        }

        .form-textarea {
          resize: vertical;
          min-height: 70px;
          height: auto;
          padding: 10px 14px;
        }

        .char-counter {
          text-align: right;
          font-size: 12px;
          color: #6b7280;
          margin-top: 2px;
        }

        .form-error {
          color: #ef4444;
          font-size: 12px;
          margin-top: 2px;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 4px;
          padding-top: 16px;
          border-top: 1px solid #f3f4f6;
        }

        .btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid transparent;
          text-decoration: none;
          height: 40px;
          box-sizing: border-box;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: white;
          color: #6b7280;
          border-color: #d1d5db;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #f9fafb;
          color: #374151;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #2563eb;
        }

        .btn-success {
          background: #10b981;
        }

        .btn-success:hover:not(:disabled) {
          background: #059669;
        }

        .btn-outline {
          background: transparent;
          color: #10b981;
          border-color: #10b981;
        }

        .btn-outline:hover:not(:disabled) {
          background: #f0fdf4;
          color: #059669;
          border-color: #059669;
        }

        .btn-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Responsividade */
        @media (max-width: 640px) {
          .modal-container {
            margin: 10px;
            max-height: calc(100vh - 20px);
          }

          .modal-header {
            padding: 16px 16px 0 16px;
          }

          .modal-content {
            padding: 0 16px 16px 16px;
          }

          .form-row {
            flex-direction: column;
            gap: 16px;
          }

          .form-group-valor,
          .form-group-data {
            flex: 1;
          }

          .dropdown-menu {
            max-height: 150px;
          }

          .confirmation-modal {
            margin: 20px;
            width: calc(100% - 40px);
          }

          .confirmation-actions {
            flex-direction: column-reverse;
          }

          .confirmation-actions .btn {
            width: 100%;
            justify-content: center;
          }

          .form-actions {
            flex-direction: column-reverse;
            gap: 8px;
          }

          .form-actions .btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}
      `}</style>
    </div>
  );
};

ReceitasModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default ReceitasModal;
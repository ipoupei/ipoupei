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
  Search,
  ChevronDown 
} from 'lucide-react';
import InputMoney from './ui/InputMoney';
import useCategorias from '../hooks/useCategorias';
import useContas from '../hooks/useContas';
import { supabase } from '../lib/supabaseClient';
import useAuth from '../hooks/useAuth';

/**
 * Modal melhorado para lançamento de receitas
 * Integrado com o sistema existente e com funcionalidades avançadas
 */
const ReceitasModal = ({ isOpen, onClose }) => {
  // Referências para campos
  const valorInputRef = useRef(null);
  const categoriaInputRef = useRef(null);
  const subcategoriaInputRef = useRef(null);
  
  // Hooks do sistema
  const { user } = useAuth();
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
  
  // Estados para dropdowns com busca
  const [categoriaDropdownOpen, setCategoriaDropdownOpen] = useState(false);
  const [subcategoriaDropdownOpen, setSubcategoriaDropdownOpen] = useState(false);
  const [categoriasFiltradas, setCategoriasFiltradas] = useState([]);
  const [subcategoriasFiltradas, setSubcategoriasFiltradas] = useState([]);
  
  // Estados para confirmação de criação
  const [confirmacao, setConfirmacao] = useState({
    show: false,
    type: '',
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
  
  // Efeitos para filtros
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
  
  // Reset e foco
  useEffect(() => {
    if (isOpen) {
      resetForm();
      setTimeout(() => {
        valorInputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);
  
  // Funções auxiliares
  const showFeedback = (message, type = 'success') => {
    setFeedback({ visible: true, message, type });
    setTimeout(() => {
      setFeedback({ visible: false, message: '', type: '' });
    }, 3000);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  const handleValorChange = (value) => {
    setFormData(prev => ({ ...prev, valor: value }));
    if (errors.valor) {
      setErrors(prev => ({ ...prev, valor: null }));
    }
  };
  
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
  };
  
  const handleSelecionarSubcategoria = (subcategoria) => {
    setFormData(prev => ({
      ...prev,
      subcategoria: subcategoria.id,
      subcategoriaTexto: subcategoria.nome
    }));
    
    setSubcategoriaDropdownOpen(false);
  };
  
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
  
  const handleConfirmarCriacao = async () => {
    try {
      if (confirmacao.type === 'categoria') {
        const result = await addCategoria({
          nome: confirmacao.nome,
          tipo: 'receita',
          cor: '#10B981'
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
  };
  
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
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      
      const dadosReceita = {
        usuario_id: user.id,
        data: formData.data,
        descricao: formData.descricao.trim(),
        categoria_id: formData.categoria,
        subcategoria_id: formData.subcategoria || null,
        conta_id: formData.contaDeposito,
        valor: formData.valor,
        observacoes: formData.observacoes.trim(),
        tipo: 'receita',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log("💰 Salvando receita:", dadosReceita);
      
      // Salvar no Supabase
      const { data, error } = await supabase
        .from('transacoes')
        .insert([dadosReceita])
        .select();
      
      if (error) throw error;
      
      console.log("✅ Receita salva com sucesso:", data);
      
      showFeedback('Receita registrada com sucesso!');
      
      setTimeout(() => {
        resetForm();
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('❌ Erro ao salvar receita:', error);
      showFeedback(`Erro ao salvar receita: ${error.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };
  
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
  
  if (!isOpen) return null;
  
  return (
    <>
      <div className="contas-modal-overlay">
        <div className="contas-modal-container" style={{ maxWidth: '500px' }}>
          {/* Cabeçalho */}
          <div className="contas-modal-header">
            <h2>
              <TrendingUp size={20} className="icon-header" style={{ color: '#10b981' }} />
              <span>Lançamento de Receitas</span>
            </h2>
            <button className="btn-fechar" onClick={onClose} aria-label="Fechar">
              <X size={20} />
            </button>
          </div>
          
          {/* Conteúdo */}
          <div className="contas-modal-content">
            {/* Feedback */}
            {feedback.visible && (
              <div className={`feedback-message ${feedback.type}`}>
                <span style={{ marginRight: '8px' }}>
                  {feedback.type === 'success' ? '✅' : '❌'}
                </span>
                {feedback.message}
              </div>
            )}
            
            {/* Loading ou Formulário */}
            {(categoriasLoading || contasLoading) ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  border: '3px solid #f3f4f6',
                  borderTop: '3px solid #10b981',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 16px'
                }}></div>
                <p>Carregando dados...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="conta-form">
                <h3>Nova Receita</h3>
                
                {/* Valor e Data */}
                <div className="form-row">
                  <div className="form-group" style={{ flex: 2 }}>
                    <label htmlFor="valor">
                      <DollarSign size={16} />
                      Valor *
                    </label>
                    <InputMoney
                      ref={valorInputRef}
                      id="valor"
                      value={formData.valor}
                      onChange={handleValorChange}
                      placeholder="R$ 0,00"
                      disabled={submitting}
                      style={{
                        borderColor: errors.valor ? '#ef4444' : '#d1d5db',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        color: '#10b981'
                      }}
                    />
                    {errors.valor && (
                      <div className="form-error">{errors.valor}</div>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="data">
                      <Calendar size={16} />
                      Data *
                    </label>
                    <input
                      type="date"
                      id="data"
                      name="data"
                      value={formData.data}
                      onChange={handleInputChange}
                      className={errors.data ? 'error' : ''}
                      disabled={submitting}
                    />
                    {errors.data && (
                      <div className="form-error">{errors.data}</div>
                    )}
                  </div>
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
                    placeholder="Ex: Salário, Freelance, Rendimentos"
                    value={formData.descricao}
                    onChange={handleInputChange}
                    className={errors.descricao ? 'error' : ''}
                    disabled={submitting}
                  />
                  {errors.descricao && (
                    <div className="form-error">{errors.descricao}</div>
                  )}
                </div>
                
                {/* Categoria e Subcategoria com busca */}
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="categoria">
                      <Tag size={16} />
                      Categoria *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        ref={categoriaInputRef}
                        type="text"
                        id="categoria"
                        value={formData.categoriaTexto}
                        onChange={handleCategoriaChange}
                        onBlur={handleCategoriaBlur}
                        onFocus={() => setCategoriaDropdownOpen(true)}
                        placeholder="Digite ou selecione uma categoria"
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
                      
                      {categoriaDropdownOpen && categoriasFiltradas.length > 0 && (
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
                    <div style={{ position: 'relative' }}>
                      <input
                        ref={subcategoriaInputRef}
                        type="text"
                        id="subcategoria"
                        value={formData.subcategoriaTexto}
                        onChange={handleSubcategoriaChange}
                        onBlur={handleSubcategoriaBlur}
                        onFocus={() => categoriaSelecionada && setSubcategoriaDropdownOpen(true)}
                        placeholder={!formData.categoria ? "Escolha categoria primeiro" : "Digite ou selecione"}
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
                      
                      {subcategoriaDropdownOpen && subcategoriasFiltradas.length > 0 && (
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
                
                {/* Conta de Depósito */}
                <div className="form-group">
                  <label htmlFor="contaDeposito">
                    <Building size={16} />
                    Conta de Depósito *
                  </label>
                  <select
                    id="contaDeposito"
                    name="contaDeposito"
                    value={formData.contaDeposito}
                    onChange={handleInputChange}
                    className={errors.contaDeposito ? 'error' : ''}
                    disabled={submitting}
                  >
                    <option value="">Selecione uma conta</option>
                    {contas.map(conta => (
                      <option key={conta.id} value={conta.id}>
                        {conta.nome}
                      </option>
                    ))}
                  </select>
                  {errors.contaDeposito && (
                    <div className="form-error">{errors.contaDeposito}</div>
                  )}
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
                    onChange={(e) => {
                      if (e.target.value.length <= 300) {
                        handleInputChange(e);
                      }
                    }}
                    placeholder="Adicione informações extras sobre esta receita"
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
                
                {/* Ações */}
                <div className="form-actions">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      onClose();
                    }}
                    disabled={submitting}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary"
                    style={{ backgroundColor: '#10b981' }}
                  >
                    {submitting ? (
                      <>
                        <div style={{
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
        <div className="confirmacao-overlay">
          <div className="confirmacao-container">
            <h3>Criar Nova {confirmacao.type === 'categoria' ? 'Categoria' : 'Subcategoria'}</h3>
            <p>
              {confirmacao.type === 'categoria' ? 'A categoria' : 'A subcategoria'}{' '}
              <strong>"{confirmacao.nome}"</strong> não existe. Deseja criá-la?
            </p>
            <div className="confirmacao-actions">
              <button 
                className="btn-secondary"
                onClick={() => setConfirmacao({ show: false, type: '', nome: '', categoriaId: '' })}
              >
                Cancelar
              </button>
              <button 
                className="btn-primary"
                onClick={handleConfirmarCriacao}
                style={{ backgroundColor: '#10b981' }}
              >
                Criar {confirmacao.type === 'categoria' ? 'Categoria' : 'Subcategoria'}
              </button>
            </div>
          </div>
        )}
      </div>
      
      <style>{`
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
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
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
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
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
    </>
  );
};

ReceitasModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default ReceitasModal;

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
  Search 
} from 'lucide-react';
import InputMoney from './ui/InputMoney';
import useCategorias from '../hooks/useCategorias';
import useContas from '../hooks/useContas';
import { supabase } from '../lib/supabaseClient';
import useAuth from '../hooks/useAuth';

const ReceitasModal = ({ isOpen, onClose }) => {
  const valorInputRef = useRef(null);
  const categoriaInputRef = useRef(null);
  const subcategoriaInputRef = useRef(null);
  
  const { user } = useAuth();
  const { categorias, loading: categoriasLoading, addCategoria, addSubcategoria } = useCategorias();
  const { contas, loading: contasLoading } = useContas();
  
  const categoriasReceita = categorias.filter(cat => cat.tipo === 'receita');
  
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
  
  const categoriaSelecionada = categoriasReceita.find(cat => cat.id === formData.categoria);
  
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
  
  useEffect(() => {
    if (isOpen) {
      resetForm();
      setTimeout(() => {
        valorInputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);
  
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
          
          showFeedback(`Categoria "${confirmacao.nome}" criada!`);
        } else {
          showFeedback('Erro ao criar categoria.', 'error');
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
          
          showFeedback(`Subcategoria "${confirmacao.nome}" criada!`);
        } else {
          showFeedback('Erro ao criar subcategoria.', 'error');
        }
      }
    } catch (error) {
      console.error('Erro ao criar categoria/subcategoria:', error);
      showFeedback('Erro inesperado.', 'error');
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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '420px',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        {/* Header compacto */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid #f3f4f6'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} style={{ color: '#10b981' }} />
            <h2 style={{ 
              margin: 0, 
              fontSize: '1.125rem', 
              fontWeight: '600', 
              color: '#111827' 
            }}>
              Lançamento de Receitas
            </h2>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Content */}
        <div style={{ 
          padding: '20px',
          overflowY: 'auto',
          maxHeight: 'calc(90vh - 100px)'
        }}>
          {/* Feedback */}
          {feedback.visible && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '0.875rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: feedback.type === 'success' ? '#dcfce7' : '#fee2e2',
              color: feedback.type === 'success' ? '#166534' : '#991b1b',
              border: `1px solid ${feedback.type === 'success' ? '#bbf7d0' : '#fecaca'}`
            }}>
              {feedback.type === 'success' ? '✅' : '❌'} {feedback.message}
            </div>
          )}
          
          {/* Loading */}
          {(categoriasLoading || contasLoading) ? (
            <div style={{ textAlign: 'center', padding: '30px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                border: '3px solid #f3f4f6',
                borderTop: '3px solid #10b981',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 12px'
              }}></div>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                Carregando dados...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Valor e Data - Layout horizontal compacto */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.75rem', 
                  color: '#9ca3af',
                  marginTop: '4px'
                }}>
                  <span></span>
                  <span>{formData.observacoes.length}/300</span>
                </div>
                {errors.observacoes && (
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: '#ef4444', 
                    marginTop: '4px' 
                  }}>
                    {errors.observacoes}
                  </div>
                )}
              </div>
              
              {/* Botões de ação compactos */}
              <div style={{ 
                display: 'flex', 
                gap: '10px', 
                marginTop: '8px',
                paddingTop: '16px',
                borderTop: '1px solid #f3f4f6'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    onClose();
                  }}
                  disabled={submitting}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    backgroundColor: 'white',
                    color: '#6b7280',
                    opacity: submitting ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => !submitting && (e.target.style.borderColor = '#10b981', e.target.style.color = '#10b981')}
                  onMouseLeave={(e) => !submitting && (e.target.style.borderColor = '#d1d5db', e.target.style.color = '#6b7280')}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 2,
                    padding: '12px 16px',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    backgroundColor: '#10b981',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    opacity: submitting ? 0.8 : 1
                  }}
                  onMouseEnter={(e) => !submitting && (e.target.style.backgroundColor = '#059669')}
                  onMouseLeave={(e) => !submitting && (e.target.style.backgroundColor = '#10b981')}
                >
                  {submitting ? (
                    <>
                      <div style={{
                        width: '14px',
                        height: '14px',
                        border: '2px solid transparent',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      Salvar Receita
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
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            maxWidth: '360px',
            width: '90%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#111827'
            }}>
              Criar Nova {confirmacao.type === 'categoria' ? 'Categoria' : 'Subcategoria'}
            </h3>
            <p style={{
              margin: '0 0 20px 0',
              color: '#6b7280',
              lineHeight: '1.5',
              fontSize: '0.875rem'
            }}>
              {confirmacao.type === 'categoria' ? 'A categoria' : 'A subcategoria'}{' '}
              <strong>"{confirmacao.nome}"</strong> não existe. Deseja criá-la?
            </p>
            <div style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'flex-end'
            }}>
              <button 
                onClick={() => setConfirmacao({ show: false, type: '', nome: '', categoriaId: '' })}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  backgroundColor: 'white',
                  color: '#6b7280'
                }}
                onMouseEnter={(e) => (e.target.style.borderColor = '#10b981', e.target.style.color = '#10b981')}
                onMouseLeave={(e) => (e.target.style.borderColor = '#d1d5db', e.target.style.color = '#6b7280')}
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmarCriacao}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  backgroundColor: '#10b981',
                  color: 'white'
                }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = '#059669')}
                onMouseLeave={(e) => (e.target.style.backgroundColor = '#10b981')}
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

ReceitasModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default ReceitasModal;={{ flex: '1.5' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    marginBottom: '6px',
                    color: '#374151'
                  }}>
                    <DollarSign size={14} />
                    Valor *
                  </label>
                  <InputMoney
                    ref={valorInputRef}
                    value={formData.valor}
                    onChange={handleValorChange}
                    placeholder="R$ 0,00"
                    disabled={submitting}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: `1px solid ${errors.valor ? '#ef4444' : '#d1d5db'}`,
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#10b981',
                      backgroundColor: 'white'
                    }}
                  />
                  {errors.valor && (
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: '#ef4444', 
                      marginTop: '4px' 
                    }}>
                      {errors.valor}
                    </div>
                  )}
                </div>
                
                <div style={{ flex: '1' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    marginBottom: '6px',
                    color: '#374151'
                  }}>
                    <Calendar size={14} />
                    Data *
                  </label>
                  <input
                    type="date"
                    name="data"
                    value={formData.data}
                    onChange={handleInputChange}
                    disabled={submitting}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: `1px solid ${errors.data ? '#ef4444' : '#d1d5db'}`,
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      backgroundColor: 'white'
                    }}
                  />
                  {errors.data && (
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: '#ef4444', 
                      marginTop: '4px' 
                    }}>
                      {errors.data}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Descrição */}
              <div>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  marginBottom: '6px',
                  color: '#374151'
                }}>
                  <FileText size={14} />
                  Descrição *
                </label>
                <input
                  type="text"
                  name="descricao"
                  placeholder="Ex: Salário, Freelance, Rendimentos"
                  value={formData.descricao}
                  onChange={handleInputChange}
                  disabled={submitting}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${errors.descricao ? '#ef4444' : '#d1d5db'}`,
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    backgroundColor: 'white'
                  }}
                />
                {errors.descricao && (
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: '#ef4444', 
                    marginTop: '4px' 
                  }}>
                    {errors.descricao}
                  </div>
                )}
              </div>
              
              {/* Categoria e Subcategoria */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    marginBottom: '6px',
                    color: '#374151'
                  }}>
                    <Tag size={14} />
                    Categoria *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      ref={categoriaInputRef}
                      type="text"
                      value={formData.categoriaTexto}
                      onChange={handleCategoriaChange}
                      onBlur={handleCategoriaBlur}
                      onFocus={() => setCategoriaDropdownOpen(true)}
                      placeholder="Digite ou selecione"
                      disabled={submitting}
                      autoComplete="off"
                      style={{
                        width: '100%',
                        padding: '10px 32px 10px 12px',
                        border: `1px solid ${errors.categoria ? '#ef4444' : '#d1d5db'}`,
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        backgroundColor: 'white'
                      }}
                    />
                    <Search size={14} style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#9ca3af',
                      pointerEvents: 'none'
                    }} />
                    
                    {categoriaDropdownOpen && categoriasFiltradas.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: 'white',
                        border: '1px solid #d1d5db',
                        borderTop: 'none',
                        borderRadius: '0 0 6px 6px',
                        maxHeight: '160px',
                        overflowY: 'auto',
                        zIndex: 1000,
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}>
                        {categoriasFiltradas.map(categoria => (
                          <div
                            key={categoria.id}
                            style={{
                              padding: '8px 12px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              borderBottom: '1px solid #f3f4f6',
                              fontSize: '0.875rem'
                            }}
                            onMouseDown={() => handleSelecionarCategoria(categoria)}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                          >
                            <div style={{ 
                              width: '10px', 
                              height: '10px', 
                              borderRadius: '50%',
                              backgroundColor: categoria.cor,
                              marginRight: '8px'
                            }}></div>
                            {categoria.nome}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {errors.categoria && (
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: '#ef4444', 
                      marginTop: '4px' 
                    }}>
                      {errors.categoria}
                    </div>
                  )}
                </div>
                
                <div style={{ flex: 1 }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    marginBottom: '6px',
                    color: '#374151'
                  }}>
                    <Tag size={14} />
                    Subcategoria
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      ref={subcategoriaInputRef}
                      type="text"
                      value={formData.subcategoriaTexto}
                      onChange={handleSubcategoriaChange}
                      onBlur={handleSubcategoriaBlur}
                      onFocus={() => categoriaSelecionada && setSubcategoriaDropdownOpen(true)}
                      placeholder={!formData.categoria ? "Escolha categoria" : "Digite ou selecione"}
                      disabled={!formData.categoria || submitting}
                      autoComplete="off"
                      style={{
                        width: '100%',
                        padding: '10px 32px 10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        backgroundColor: !formData.categoria ? '#f9fafb' : 'white'
                      }}
                    />
                    <Search size={14} style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#9ca3af',
                      pointerEvents: 'none'
                    }} />
                    
                    {subcategoriaDropdownOpen && subcategoriasFiltradas.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: 'white',
                        border: '1px solid #d1d5db',
                        borderTop: 'none',
                        borderRadius: '0 0 6px 6px',
                        maxHeight: '160px',
                        overflowY: 'auto',
                        zIndex: 1000,
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}>
                        {subcategoriasFiltradas.map(subcategoria => (
                          <div
                            key={subcategoria.id}
                            style={{
                              padding: '8px 12px',
                              cursor: 'pointer',
                              borderBottom: '1px solid #f3f4f6',
                              fontSize: '0.875rem'
                            }}
                            onMouseDown={() => handleSelecionarSubcategoria(subcategoria)}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
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
              <div>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  marginBottom: '6px',
                  color: '#374151'
                }}>
                  <Building size={14} />
                  Conta de Depósito *
                </label>
                <select
                  name="contaDeposito"
                  value={formData.contaDeposito}
                  onChange={handleInputChange}
                  disabled={submitting}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${errors.contaDeposito ? '#ef4444' : '#d1d5db'}`,
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">Selecione uma conta</option>
                  {contas.map(conta => (
                    <option key={conta.id} value={conta.id}>
                      {conta.nome}
                    </option>
                  ))}
                </select>
                {errors.contaDeposito && (
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: '#ef4444', 
                    marginTop: '4px' 
                  }}>
                    {errors.contaDeposito}
                  </div>
                )}
              </div>
              
              {/* Observações */}
              <div>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  marginBottom: '6px',
                  color: '#374151'
                }}>
                  <MessageSquare size={14} />
                  Observações <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>(máx. 300)</span>
                </label>
                <textarea
                  name="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => {
                    if (e.target.value.length <= 300) {
                      handleInputChange(e);
                    }
                  }}
                  placeholder="Informações extras sobre esta receita"
                  rows="2"
                  disabled={submitting}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${errors.observacoes ? '#ef4444' : '#d1d5db'}`,
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    backgroundColor: 'white',
                    resize: 'none',
                    fontFamily: 'inherit'
                  }}
                />
               <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.75rem', 
                  color: '#9ca3af',
                  marginTop: '4px'
                }}>
                  <span></span>
                  <span>{formData.observacoes.length}/300</span>
                </div>
                {errors.observacoes && (
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: '#ef4444', 
                    marginTop: '4px' 
                  }}>
                    {errors.observacoes}
                  </div>
                )}
              </div>
              
              {/* Botões de ação compactos */}
              <div style={{ 
                display: 'flex', 
                gap: '10px', 
                marginTop: '8px',
                paddingTop: '16px',
                borderTop: '1px solid #f3f4f6'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    onClose();
                  }}
                  disabled={submitting}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    backgroundColor: 'white',
                    color: '#6b7280',
                    opacity: submitting ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => !submitting && (e.target.style.borderColor = '#10b981', e.target.style.color = '#10b981')}
                  onMouseLeave={(e) => !submitting && (e.target.style.borderColor = '#d1d5db', e.target.style.color = '#6b7280')}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 2,
                    padding: '12px 16px',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    backgroundColor: '#10b981',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    opacity: submitting ? 0.8 : 1
                  }}
                  onMouseEnter={(e) => !submitting && (e.target.style.backgroundColor = '#059669')}
                  onMouseLeave={(e) => !submitting && (e.target.style.backgroundColor = '#10b981')}
                >
                  {submitting ? (
                    <>
                      <div style={{
                        width: '14px',
                        height: '14px',
                        border: '2px solid transparent',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      Salvar Receita
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
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            maxWidth: '360px',
            width: '90%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#111827'
            }}>
              Criar Nova {confirmacao.type === 'categoria' ? 'Categoria' : 'Subcategoria'}
            </h3>
            <p style={{
              margin: '0 0 20px 0',
              color: '#6b7280',
              lineHeight: '1.5',
              fontSize: '0.875rem'
            }}>
              {confirmacao.type === 'categoria' ? 'A categoria' : 'A subcategoria'}{' '}
              <strong>"{confirmacao.nome}"</strong> não existe. Deseja criá-la?
            </p>
            <div style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'flex-end'
            }}>
              <button 
                onClick={() => setConfirmacao({ show: false, type: '', nome: '', categoriaId: '' })}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  backgroundColor: 'white',
                  color: '#6b7280'
                }}
                onMouseEnter={(e) => (e.target.style.borderColor = '#10b981', e.target.style.color = '#10b981')}
                onMouseLeave={(e) => (e.target.style.borderColor = '#d1d5db', e.target.style.color = '#6b7280')}
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmarCriacao}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  backgroundColor: '#10b981',
                  color: 'white'
                }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = '#059669')}
                onMouseLeave={(e) => (e.target.style.backgroundColor = '#10b981')}
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

ReceitasModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default ReceitasModal;

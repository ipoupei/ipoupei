import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { TrendingUp, Plus, X, Calendar, FileText, Tag, Building, DollarSign, MessageSquare } from 'lucide-react';
import InputMoney from './ui/InputMoney';
import useCategorias from '../hooks/useCategorias';
import useContas from '../hooks/useContas';

/**
 * Modal moderno para lançamento de receitas
 * Seguindo o padrão visual dos outros modais do sistema
 */
const ReceitasModal = ({ isOpen, onClose }) => {
  // Referência para o primeiro campo do formulário (autofoco)
  const dataInputRef = useRef(null);
  
  // Hooks para obter categorias e contas
  const { categorias } = useCategorias();
  const { contas } = useContas();
  
  // Filtrar apenas categorias do tipo "receita"
  const categoriasReceita = categorias.filter(cat => cat.tipo === 'receita');
  
  // Estados para os campos do formulário
  const [formData, setFormData] = useState({
    data: formatarDataAtual(),
    descricao: '',
    categoria: '',
    subcategoria: '',
    contaDeposito: '',
    valor: 0,
    observacoes: ''
  });

  // Estado para controlar erros de validação
  const [errors, setErrors] = useState({});
  
  // Estado para exibir mensagem de sucesso
  const [feedback, setFeedback] = useState({ visible: false, message: '', type: '' });
  
  // Obter subcategorias com base na categoria selecionada
  const subcategoriasFiltradas = formData.categoria 
    ? categoriasReceita.find(cat => cat.id === formData.categoria)?.subcategorias || []
    : [];
  
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

  // Handler para mudanças nos inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Se a categoria mudou, resetar a subcategoria
    if (name === 'categoria') {
      setFormData(prevData => ({
        ...prevData,
        [name]: value,
        subcategoria: '' // Reseta a subcategoria
      }));
    } else {
      setFormData(prevData => ({
        ...prevData,
        [name]: value
      }));
    }
    
    // Limpa o erro deste campo se existir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
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
    if (!formData.categoria) newErrors.categoria = "Categoria é obrigatória";
    if (!formData.subcategoria) newErrors.subcategoria = "Subcategoria é obrigatória";
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
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Mock da função addReceita
      console.log("Dados da receita enviados:", formData);
      
      // Exibe o feedback de sucesso
      showFeedback('Receita registrada com sucesso!', 'success');
      
      // Limpa o formulário e fecha após 2 segundos
      setTimeout(() => {
        resetForm();
        onClose();
      }, 2000);
    }
  };

  // Função para resetar o formulário
  const resetForm = () => {
    setFormData({
      data: formatarDataAtual(),
      descricao: '',
      categoria: '',
      subcategoria: '',
      contaDeposito: '',
      valor: 0,
      observacoes: ''
    });
    setErrors({});
    setFeedback({ visible: false, message: '', type: '' });
  };

  // Se não estiver aberto, não renderiza
  if (!isOpen) return null;

  return (
    <div className="contas-modal-overlay">
      <div className="contas-modal-container">
        {/* Cabeçalho do modal */}
        <div className="contas-modal-header">
          <h2>
            <TrendingUp size={20} className="icon-header" style={{ color: '#10b981' }} />
            <span>Lançamento de Receitas</span>
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
          
          {/* Formulário de receita */}
          <form onSubmit={handleSubmit} className="conta-form">
            <h3>Nova Receita</h3>
            
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
                placeholder="Ex: Pagamento projeto XPTO"
                value={formData.descricao}
                onChange={handleChange}
                className={errors.descricao ? 'error' : ''}
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
                <select
                  id="categoria"
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleChange}
                  className={errors.categoria ? 'error' : ''}
                >
                  <option value="">Selecione uma categoria</option>
                  {categoriasReceita.map(categoria => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nome}
                    </option>
                  ))}
                </select>
                {errors.categoria && (
                  <div className="form-error">{errors.categoria}</div>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="subcategoria">
                  <Tag size={16} />
                  Subcategoria *
                </label>
                <select
                  id="subcategoria"
                  name="subcategoria"
                  value={formData.subcategoria}
                  onChange={handleChange}
                  disabled={!formData.categoria}
                  className={errors.subcategoria ? 'error' : ''}
                  style={{
                    backgroundColor: !formData.categoria ? '#f9fafb' : 'white'
                  }}
                >
                  <option value="">Selecione uma subcategoria</option>
                  {subcategoriasFiltradas.map(subcategoria => (
                    <option key={subcategoria.id} value={subcategoria.id}>
                      {subcategoria.nome}
                    </option>
                  ))}
                </select>
                {errors.subcategoria && (
                  <div className="form-error">{errors.subcategoria}</div>
                )}
              </div>
            </div>
            
            {/* Conta Depósito e Valor */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="contaDeposito">
                  <Building size={16} />
                  Conta Depósito *
                </label>
                <select
                  id="contaDeposito"
                  name="contaDeposito"
                  value={formData.contaDeposito}
                  onChange={handleChange}
                  className={errors.contaDeposito ? 'error' : ''}
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
                placeholder="Adicione informações extras sobre esta receita"
                rows="3"
                className={errors.observacoes ? 'error' : ''}
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
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary"
                style={{ backgroundColor: '#10b981' }}
              >
                <Plus size={16} />
                Salvar Receita
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

ReceitasModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default ReceitasModal;
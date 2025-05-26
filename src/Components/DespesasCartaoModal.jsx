import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { CreditCard, Plus, X, Calendar, FileText, Tag, DollarSign, MessageSquare, Hash, Info } from 'lucide-react';
import InputMoney from './ui/InputMoney';
import useCategorias from '../hooks/useCategorias';
import useCartoes from '../hooks/useCartoes';
import { formatCurrency } from '../utils/formatCurrency';

/**
 * Modal moderno para lançamento de despesas com cartão de crédito
 * Seguindo o padrão visual dos outros modais do sistema
 */
const DespesasCartaoModal = ({ isOpen, onClose }) => {
  // Referência para o primeiro campo do formulário (autofoco)
  const dataInputRef = useRef(null);
  
  // Hooks para obter categorias e cartões
  const { categorias } = useCategorias();
  const { cartoes } = useCartoes();
  
  // Filtrar apenas categorias do tipo "despesa"
  const categoriasDespesa = categorias.filter(cat => cat.tipo === 'despesa');
  
  // Filtrar apenas cartões ativos
  const cartoesAtivos = cartoes.filter(cartao => cartao.ativo);
  
  // Estados para os campos do formulário
  const [formData, setFormData] = useState({
    dataCompra: formatarDataAtual(),
    descricao: '',
    categoria: '',
    subcategoria: '',
    cartaoId: '',
    valorTotal: 0,
    numeroParcelas: 1,
    observacoes: ''
  });

  // Estado para controlar erros de validação
  const [errors, setErrors] = useState({});
  
  // Estado para exibir mensagem de sucesso
  const [feedback, setFeedback] = useState({ visible: false, message: '', type: '' });
  
  // Estado para armazenar o cartão selecionado
  const [cartaoSelecionado, setCartaoSelecionado] = useState(null);
  
  // Obter subcategorias com base na categoria selecionada
  const subcategoriasFiltradas = formData.categoria 
    ? categoriasDespesa.find(cat => cat.id === formData.categoria)?.subcategorias || []
    : [];
  
  // Opções de parcelamento
  const opcoesParcelamento = Array.from({ length: 24 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1}x${i === 0 ? ' à vista' : ''}`
  }));
  
  // Calcula o valor da parcela
  const valorParcela = formData.valorTotal > 0 && formData.numeroParcelas > 0
    ? formData.valorTotal / formData.numeroParcelas
    : 0;
  
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
  
  // Atualiza o cartão selecionado quando o ID muda
  useEffect(() => {
    if (formData.cartaoId) {
      const cartao = cartoes.find(c => c.id === formData.cartaoId);
      setCartaoSelecionado(cartao);
    } else {
      setCartaoSelecionado(null);
    }
  }, [formData.cartaoId, cartoes]);
  
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
    
    // Lógica especial para campos específicos
    if (name === 'categoria') {
      // Se a categoria mudou, resetar a subcategoria
      setFormData(prevData => ({
        ...prevData,
        [name]: value,
        subcategoria: '' // Reseta a subcategoria
      }));
    } else if (name === 'numeroParcelas') {
      // Garantir que o número de parcelas seja pelo menos 1
      const parcelas = Math.max(1, parseInt(value) || 1);
      setFormData(prevData => ({
        ...prevData,
        [name]: parcelas
      }));
    } else {
      // Comportamento padrão para outros campos
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
  
  // Handler específico para o campo de valor total
  const handleValorTotalChange = (value) => {
    setFormData(prevData => ({
      ...prevData,
      valorTotal: value
    }));
    
    // Limpa o erro se existir
    if (errors.valorTotal) {
      setErrors(prev => ({
        ...prev,
        valorTotal: null
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
    if (!formData.dataCompra) newErrors.dataCompra = "Data é obrigatória";
    if (!formData.descricao.trim()) newErrors.descricao = "Descrição é obrigatória";
    if (!formData.categoria) newErrors.categoria = "Categoria é obrigatória";
    if (!formData.subcategoria) newErrors.subcategoria = "Subcategoria é obrigatória";
    if (!formData.cartaoId) newErrors.cartaoId = "Cartão é obrigatório";
    if (!formData.valorTotal || formData.valorTotal === 0) newErrors.valorTotal = "Valor é obrigatório";
    
    // Validações específicas para parcelamento
    if (formData.numeroParcelas < 1) {
      newErrors.numeroParcelas = "Número de parcelas deve ser pelo menos 1";
    }
    
    if (formData.numeroParcelas > 1 && formData.valorTotal < 10) {
      newErrors.numeroParcelas = "Para parcelar, valor mínimo deve ser R$ 10,00";
    }
    
    // Verifica se o cartão está ativo
    const cartao = cartoes.find(c => c.id === formData.cartaoId);
    if (cartao && !cartao.ativo) {
      newErrors.cartaoId = "Este cartão está inativo";
    }
    
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
      // Calcula o valor de cada parcela
      const valorParcelaFinal = formData.valorTotal / formData.numeroParcelas;
      
      // Constrói o objeto de despesa com cartão
      const despesaCartao = {
        ...formData,
        valorParcela: valorParcelaFinal,
        dataRegistro: new Date().toISOString(),
        status: 'aberto'
      };
      
      // Mock da função addDespesaCartao
      console.log("Dados da despesa de cartão enviados:", despesaCartao);
      
      // Exibe o feedback de sucesso
      showFeedback('Despesa de cartão registrada com sucesso!', 'success');
      
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
      dataCompra: formatarDataAtual(),
      descricao: '',
      categoria: '',
      subcategoria: '',
      cartaoId: '',
      valorTotal: 0,
      numeroParcelas: 1,
      observacoes: ''
    });
    setErrors({});
    setFeedback({ visible: false, message: '', type: '' });
    setCartaoSelecionado(null);
  };

  // Se não estiver aberto, não renderiza
  if (!isOpen) return null;

  return (
    <div className="contas-modal-overlay">
      <div className="contas-modal-container" style={{ maxWidth: '600px' }}>
        {/* Cabeçalho do modal */}
        <div className="contas-modal-header">
          <h2>
            <CreditCard size={20} className="icon-header" style={{ color: '#8b5cf6' }} />
            <span>Despesa com Cartão de Crédito</span>
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
          
          {/* Formulário de despesa com cartão */}
          <form onSubmit={handleSubmit} className="conta-form">
            <h3>Nova Despesa com Cartão</h3>
            
            {/* Data da Compra */}
            <div className="form-group">
              <label htmlFor="dataCompra">
                <Calendar size={16} />
                Data da Compra *
              </label>
              <input
                ref={dataInputRef}
                type="date"
                id="dataCompra"
                name="dataCompra"
                value={formData.dataCompra}
                onChange={handleChange}
                className={errors.dataCompra ? 'error' : ''}
              />
              {errors.dataCompra && (
                <div className="form-error">{errors.dataCompra}</div>
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
                placeholder="Ex: Compra na Amazon"
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
                  {categoriasDespesa.map(categoria => (
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
            
            {/* Cartão de Crédito */}
            <div className="form-group">
              <label htmlFor="cartaoId">
                <CreditCard size={16} />
                Cartão de Crédito *
              </label>
              <select
                id="cartaoId"
                name="cartaoId"
                value={formData.cartaoId}
                onChange={handleChange}
                className={errors.cartaoId ? 'error' : ''}
              >
                <option value="">Selecione um cartão</option>
                {cartoes.map(cartao => (
                  <option 
                    key={cartao.id} 
                    value={cartao.id}
                    disabled={!cartao.ativo}
                  >
                    {cartao.nome} {!cartao.ativo ? '(Inativo)' : ''}
                  </option>
                ))}
              </select>
              {errors.cartaoId && (
                <div className="form-error">{errors.cartaoId}</div>
              )}
            </div>
            
            {/* Valor Total e Parcelas */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="valorTotal">
                  <DollarSign size={16} />
                  Valor Total *
                </label>
                <InputMoney
                  id="valorTotal"
                  name="valorTotal"
                  value={formData.valorTotal}
                  onChange={handleValorTotalChange}
                  placeholder="R$ 0,00"
                  style={{
                    borderColor: errors.valorTotal ? '#ef4444' : '#d1d5db'
                  }}
                />
                {errors.valorTotal && (
                  <div className="form-error">{errors.valorTotal}</div>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="numeroParcelas">
                  <Hash size={16} />
                  Parcelas *
                  <Info size={12} style={{ marginLeft: '4px', color: '#6b7280' }} />
                </label>
                <select
                  id="numeroParcelas"
                  name="numeroParcelas"
                  value={formData.numeroParcelas}
                  onChange={handleChange}
                  className={errors.numeroParcelas ? 'error' : ''}
                >
                  {opcoesParcelamento.map(opcao => (
                    <option key={opcao.value} value={opcao.value}>
                      {opcao.label}
                    </option>
                  ))}
                </select>
                {errors.numeroParcelas && (
                  <div className="form-error">{errors.numeroParcelas}</div>
                )}
              </div>
            </div>
            
            {/* Preview do Parcelamento */}
            {formData.valorTotal > 0 && formData.numeroParcelas > 0 && (
              <div className="contas-resumo" style={{ marginBottom: '16px' }}>
                <div className="resumo-item">
                  <div className="resumo-label">Valor por parcela</div>
                  <div className="resumo-valor" style={{ color: '#8b5cf6' }}>
                    {formatCurrency(valorParcela)}
                  </div>
                </div>
                <div className="resumo-item">
                  <div className="resumo-label">Total de parcelas</div>
                  <div className="resumo-valor">
                    {formData.numeroParcelas}x
                  </div>
                </div>
              </div>
            )}
            
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
                placeholder="Adicione informações extras sobre esta compra"
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
                style={{ backgroundColor: '#8b5cf6' }}
              >
                <Plus size={16} />
                Salvar Despesa
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

DespesasCartaoModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default DespesasCartaoModal;
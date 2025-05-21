import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { CreditCard, Calendar, DollarSign, Landmark, Check, AlertCircle } from 'lucide-react';
import InputMoney from './ui/InputMoney';
import './CartoesModal.css';

/**
 * Formulário para cadastro e edição de cartões de crédito
 * Atualizado com mais bandeiras e correções visuais
 */
const CartaoForm = ({ cartao, contas, onSave, onCancel }) => {
  // Estado do formulário
  const [formData, setFormData] = useState({
    nome: '',
    limite: 0,
    diaFechamento: 1,
    diaVencimento: 10,
    bandeira: '',
    contaPagamento: '',
    ativo: true,
    cor: '#7c3aed' // Cor padrão (roxo)
  });
  
  // Estado de erros do formulário
  const [errors, setErrors] = useState({});
  
  // Estado para controle do botão de preview
  const [mostrarPreview, setMostrarPreview] = useState(false);
  
  // Bandeiras de cartão disponíveis - Atualizado com mais bandeiras populares
  const BANDEIRAS = [
    { id: 'visa', nome: 'Visa', icon: '💳' },
    { id: 'mastercard', nome: 'Mastercard', icon: '💳' },
    { id: 'elo', nome: 'Elo', icon: '💳' },
    { id: 'amex', nome: 'American Express', icon: '💳' },
    { id: 'hipercard', nome: 'Hipercard', icon: '💳' },
    { id: 'diners', nome: 'Diners Club', icon: '💳' },
    { id: 'discover', nome: 'Discover', icon: '💳' },
    { id: 'jcb', nome: 'JCB', icon: '💳' },
    { id: 'aura', nome: 'Aura', icon: '💳' },
    { id: 'outro', nome: 'Outro', icon: '💳' }
  ];

  // Gera array de dias do mês (1-31)
  const DIAS_MES = Array.from({ length: 31 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1}`
  }));
  
  // Preenche o formulário quando receber um cartão para edição
  useEffect(() => {
    if (cartao) {
      setFormData({
        nome: cartao.nome || '',
        limite: cartao.limite || 0,
        diaFechamento: cartao.diaFechamento || 1,
        diaVencimento: cartao.diaVencimento || 10,
        bandeira: cartao.bandeira || '',
        contaPagamento: cartao.contaPagamento || '',
        ativo: cartao.ativo !== undefined ? cartao.ativo : true,
        cor: cartao.cor || '#7c3aed'
      });
    }
  }, [cartao]);

  // Handler para mudanças nos inputs
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Para checkbox, usa o valor checked
    const inputValue = type === 'checkbox' ? checked : value;
    
    // Atualiza o formData
    setFormData(prev => ({
      ...prev,
      [name]: inputValue
    }));
    
    // Limpa o erro deste campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  // Handler para o campo de limite (InputMoney)
  const handleLimiteChange = (value) => {
    setFormData(prev => ({ ...prev, limite: value }));
    
    // Limpa o erro do campo limite
    if (errors.limite) {
      setErrors(prev => ({ ...prev, limite: null }));
    }
  };
  
  // Validação do formulário
  const validateForm = () => {
    const newErrors = {};
    
    // Validações de campos obrigatórios
    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome do cartão é obrigatório';
    }
    
    if (!formData.limite && formData.limite !== 0) {
      newErrors.limite = 'Informe um limite válido';
    }
    
    if (!formData.bandeira) {
      newErrors.bandeira = 'Selecione a bandeira do cartão';
    }
    
    if (!formData.diaFechamento || formData.diaFechamento < 1 || formData.diaFechamento > 31) {
      newErrors.diaFechamento = 'Dia de fechamento inválido';
    }
    
    if (!formData.diaVencimento || formData.diaVencimento < 1 || formData.diaVencimento > 31) {
      newErrors.diaVencimento = 'Dia de vencimento inválido';
    }
    
    // Validação avançada: vencimento muito próximo do fechamento
    if (formData.diaVencimento && formData.diaFechamento) {
      const diasEntreFechamentoEVencimento = calcularDiasEntreDatas(
        formData.diaFechamento, 
        formData.diaVencimento
      );
      
      if (diasEntreFechamentoEVencimento < 5) {
        newErrors.diaVencimento = 'O vencimento está muito próximo do fechamento';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Calcula dias entre duas datas do mês
  const calcularDiasEntreDatas = (diaInicial, diaFinal) => {
    if (diaFinal >= diaInicial) {
      return diaFinal - diaInicial;
    } else {
      // Se o dia final for menor que o inicial, 
      // significa que está no mês seguinte (ex: fechamento 25, vencimento 5)
      return (30 - diaInicial) + diaFinal;
    }
  };
  
  // Handler para salvar o formulário
  const handleSubmit = (e, criarNovo = false) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formData, criarNovo);
    }
  };
  
  // Obtém o nome da bandeira pelo ID
  const getNomeBandeira = (bandeiraId) => {
    const bandeira = BANDEIRAS.find(b => b.id === bandeiraId);
    return bandeira ? bandeira.nome : 'Bandeira';
  };
  
  // Obtém o valor formatado do limite
  const getLimiteFormatado = () => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(formData.limite || 0);
  };

  return (
    <div className="cartao-form">
      {/* Preview do cartão */}
      {mostrarPreview && (
        <div className="cartao-preview-container">
          <div 
            className="cartao-preview"
            style={{ backgroundColor: formData.cor }}
          >
            <div className="cartao-preview-header">
              <span className="cartao-preview-bandeira">
                {formData.bandeira ? getNomeBandeira(formData.bandeira) : 'Bandeira'}
              </span>
              <span className="cartao-preview-icon">💳</span>
            </div>
            <div className="cartao-preview-nome">
              {formData.nome || 'Nome do Cartão'}
            </div>
            <div className="cartao-preview-limite">
              {getLimiteFormatado()}
            </div>
            <div className="cartao-preview-datas">
              <div>
                <small>Fecha dia</small>
                <div>{formData.diaFechamento || '--'}</div>
              </div>
              <div>
                <small>Vence dia</small>
                <div>{formData.diaVencimento || '--'}</div>
              </div>
            </div>
          </div>
          <button 
            type="button" 
            className="btn-secondary btn-sm"
            onClick={() => setMostrarPreview(false)}
          >
            Fechar Preview
          </button>
        </div>
      )}
      
      <h3 className="cartao-form-title">
        {cartao ? 'Editar Cartão' : 'Novo Cartão de Crédito'}
      </h3>
      
      <form className="cartao-form-container">
        {/* Nome do Cartão */}
        <div className="form-group">
          <label htmlFor="nome">
            <CreditCard size={16} />
            <span>Nome do Cartão*</span>
          </label>
          <input 
            type="text"
            id="nome"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            placeholder="Ex: Nubank, Itaú Visa"
            className={errors.nome ? 'input-error' : ''}
          />
          {errors.nome && <div className="error-message">{errors.nome}</div>}
        </div>
        
        {/* Limite do Cartão */}
        <div className="form-group">
          <label htmlFor="limite">
            <DollarSign size={16} />
            <span>Limite Total*</span>
          </label>
          <InputMoney
            id="limite"
            name="limite"
            value={formData.limite}
            onChange={handleLimiteChange}
            placeholder="R$ 0,00"
            className={errors.limite ? 'input-error' : ''}
          />
          {errors.limite && <div className="error-message">{errors.limite}</div>}
        </div>
        
        {/* Bandeira do Cartão - Layout melhorado */}
        <div className="form-group">
          <label htmlFor="bandeira">
            <CreditCard size={16} />
            <span>Bandeira*</span>
          </label>
          <div className="bandeiras-selector">
            {BANDEIRAS.map(bandeira => (
              <div 
                key={bandeira.id}
                className={`bandeira-option ${formData.bandeira === bandeira.id ? 'selected' : ''}`}
                onClick={() => {
                  setFormData(prev => ({ ...prev, bandeira: bandeira.id }));
                  if (errors.bandeira) {
                    setErrors(prev => ({ ...prev, bandeira: null }));
                  }
                }}
              >
                <span className="bandeira-icon">{bandeira.icon}</span>
                <span className="bandeira-nome">{bandeira.nome}</span>
                {formData.bandeira === bandeira.id && (
                  <div className="check-icon-container">
                    <Check size={14} className="check-icon" />
                  </div>
                )}
              </div>
            ))}
          </div>
          {errors.bandeira && <div className="error-message">{errors.bandeira}</div>}
        </div>
        
        {/* Dia de Fechamento */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="diaFechamento">
              <Calendar size={16} />
              <span>Dia do Fechamento*</span>
              <div className="tooltip">
                <AlertCircle size={14} />
                <span className="tooltiptext">Dia em que a fatura é fechada</span>
              </div>
            </label>
            <select
              id="diaFechamento"
              name="diaFechamento"
              value={formData.diaFechamento}
              onChange={handleChange}
              className={errors.diaFechamento ? 'input-error' : ''}
            >
              {DIAS_MES.map(dia => (
                <option key={`fechamento-${dia.value}`} value={dia.value}>
                  {dia.label}
                </option>
              ))}
            </select>
            {errors.diaFechamento && <div className="error-message">{errors.diaFechamento}</div>}
          </div>
          
          {/* Dia de Vencimento */}
          <div className="form-group">
            <label htmlFor="diaVencimento">
              <Calendar size={16} />
              <span>Dia do Vencimento*</span>
              <div className="tooltip">
                <AlertCircle size={14} />
                <span className="tooltiptext">Dia em que a fatura deve ser paga</span>
              </div>
            </label>
            <select
              id="diaVencimento"
              name="diaVencimento"
              value={formData.diaVencimento}
              onChange={handleChange}
              className={errors.diaVencimento ? 'input-error' : ''}
            >
              {DIAS_MES.map(dia => (
                <option key={`vencimento-${dia.value}`} value={dia.value}>
                  {dia.label}
                </option>
              ))}
            </select>
            {errors.diaVencimento && <div className="error-message">{errors.diaVencimento}</div>}
          </div>
        </div>
        
        {/* Conta para Pagamento */}
        <div className="form-group">
          <label htmlFor="contaPagamento">
            <Landmark size={16} />
            <span>Conta para Pagamento</span>
            <div className="tooltip">
              <AlertCircle size={14} />
              <span className="tooltiptext">Conta bancária utilizada para pagar a fatura</span>
            </div>
          </label>
          <select
            id="contaPagamento"
            name="contaPagamento"
            value={formData.contaPagamento}
            onChange={handleChange}
          >
            <option value="">Selecione uma conta</option>
            {contas.map(conta => (
              <option key={conta.id} value={conta.id}>
                {conta.nome}
              </option>
            ))}
          </select>
        </div>
        
        {/* Status Ativo */}
        <div className="form-group checkbox-group">
          <label htmlFor="ativo" className="checkbox-label">
            <input
              type="checkbox"
              id="ativo"
              name="ativo"
              checked={formData.ativo}
              onChange={handleChange}
            />
            <span>Cartão ativo</span>
          </label>
          <div className="helper-text">
            Desmarque para arquivar este cartão sem excluí-lo
          </div>
        </div>
        
        {/* Cor do Cartão */}
        <div className="form-group">
          <label htmlFor="cor">
            <span>Cor do Cartão</span>
          </label>
          <input
            type="color"
            id="cor"
            name="cor"
            value={formData.cor}
            onChange={handleChange}
            className="color-picker"
          />
          <button
            type="button"
            className="btn-secondary btn-sm"
            onClick={() => setMostrarPreview(!mostrarPreview)}
          >
            {mostrarPreview ? 'Esconder Preview' : 'Ver Preview do Cartão'}
          </button>
        </div>
        
        {/* Botões de Ação */}
        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancel}
          >
            Cancelar
          </button>
          
          <div>
            <button
              type="button"
              className="btn-primary btn-save-and-new"
              onClick={(e) => handleSubmit(e, true)}
            >
              Salvar e Criar Novo
            </button>
            
            <button
              type="button"
              className="btn-primary"
              onClick={(e) => handleSubmit(e, false)}
            >
              Salvar
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

CartaoForm.propTypes = {
  cartao: PropTypes.object,
  contas: PropTypes.array.isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default CartaoForm;
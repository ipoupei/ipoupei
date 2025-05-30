import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { CreditCard, Calendar, DollarSign, Landmark, Check, AlertCircle } from 'lucide-react';
import InputMoney from './ui/InputMoney';
import '../styles/BaseModal.css';
import './CartaoForm.css';

/**
 * Formulário para cadastro e edição de cartões de crédito
 * Versão atualizada com sistema CSS unificado
 */
const CartaoForm = ({ cartao, contas, onSave, onCancel }) => {
  // Estado do formulário - campos ajustados para o Supabase
  const [formData, setFormData] = useState({
    nome: '',
    limite: 0,
    dia_fechamento: 1,
    dia_vencimento: 10,
    bandeira: '',
    banco: '',
    conta_debito_id: '',
    ativo: true,
    cor: '#8A05BE'
  });
  
  // Estado de erros do formulário
  const [errors, setErrors] = useState({});
  
  // Estado para controle do botão de preview
  const [mostrarPreview, setMostrarPreview] = useState(false);
  
  // Bandeiras de cartão disponíveis
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
    { id: 'outros', nome: 'Outros', icon: '💳' }
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
        dia_fechamento: cartao.dia_fechamento || 1,
        dia_vencimento: cartao.dia_vencimento || 10,
        bandeira: cartao.bandeira || '',
        banco: cartao.banco || '',
        conta_debito_id: cartao.conta_debito_id || '',
        ativo: cartao.ativo !== undefined ? cartao.ativo : true,
        cor: cartao.cor || '#8A05BE'
      });
    }
  }, [cartao]);

  // Handler para mudanças nos inputs
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Para checkbox, usa o valor checked
    const inputValue = type === 'checkbox' ? checked : value;
    
    // Conversão para números quando necessário
    let finalValue = inputValue;
    if (name === 'dia_fechamento' || name === 'dia_vencimento') {
      finalValue = Number(inputValue);
    }
    
    // Atualiza o formData
    setFormData(prev => ({
      ...prev,
      [name]: finalValue
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
    
    if (!formData.dia_fechamento || formData.dia_fechamento < 1 || formData.dia_fechamento > 31) {
      newErrors.dia_fechamento = 'Dia de fechamento inválido';
    }
    
    if (!formData.dia_vencimento || formData.dia_vencimento < 1 || formData.dia_vencimento > 31) {
      newErrors.dia_vencimento = 'Dia de vencimento inválido';
    }
    
    // Validação avançada: vencimento muito próximo do fechamento
    if (formData.dia_vencimento && formData.dia_fechamento) {
      const diasEntreFechamentoEVencimento = calcularDiasEntreDatas(
        formData.dia_fechamento, 
        formData.dia_vencimento
      );
      
      if (diasEntreFechamentoEVencimento < 5) {
        newErrors.dia_vencimento = 'O vencimento está muito próximo do fechamento';
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
      console.log('📝 CartaoForm - Dados do formulário:', formData);
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
    <div className="form form--cartoes">
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
                <div>{formData.dia_fechamento || '--'}</div>
              </div>
              <div>
                <small>Vence dia</small>
                <div>{formData.dia_vencimento || '--'}</div>
              </div>
            </div>
          </div>
          <button 
            type="button" 
            className="btn btn--secondary btn--sm"
            onClick={() => setMostrarPreview(false)}
          >
            Fechar Preview
          </button>
        </div>
      )}
      
      <h3 className="form-title">
        {cartao ? 'Editar Cartão' : 'Novo Cartão de Crédito'}
      </h3>
      
      <form className="form-container">
        {/* Nome do Cartão */}
        <div className="form-group">
          <label htmlFor="nome" className="form-label form-label--required">
            <CreditCard size={16} />
            <span>Nome do Cartão</span>
          </label>
          <input 
            type="text"
            id="nome"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            placeholder="Ex: Nubank, Itaú Visa"
            className={`form-input ${errors.nome ? 'form-input--error' : ''}`}
          />
          {errors.nome && <div className="form-error">{errors.nome}</div>}
        </div>
        
        {/* Limite do Cartão */}
        <div className="form-group">
          <label htmlFor="limite" className="form-label form-label--required">
            <DollarSign size={16} />
            <span>Limite Total</span>
          </label>
          <InputMoney
            id="limite"
            name="limite"
            value={formData.limite}
            onChange={handleLimiteChange}
            placeholder="R$ 0,00"
            className={`form-input ${errors.limite ? 'form-input--error' : ''}`}
          />
          {errors.limite && <div className="form-error">{errors.limite}</div>}
        </div>
        
        {/* Banco */}
        <div className="form-group">
          <label htmlFor="banco" className="form-label">
            <Landmark size={16} />
            <span>Banco</span>
          </label>
          <input 
            type="text"
            id="banco"
            name="banco"
            value={formData.banco}
            onChange={handleChange}
            placeholder="Ex: Nubank, Itaú, Santander"
            className="form-input"
          />
        </div>
        
        {/* Bandeira do Cartão */}
        <div className="form-group">
          <label htmlFor="bandeira" className="form-label form-label--required">
            <CreditCard size={16} />
            <span>Bandeira</span>
          </label>
          <div className="cartao-bandeiras-selector">
            {BANDEIRAS.map(bandeira => (
              <div 
                key={bandeira.id}
                className={`cartao-bandeira-option ${formData.bandeira === bandeira.id ? 'cartao-bandeira-option--selected' : ''}`}
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
                  <Check size={14} className="cartao-check-icon" />
                )}
              </div>
            ))}
          </div>
          {errors.bandeira && <div className="form-error">{errors.bandeira}</div>}
        </div>
        
        {/* Dia de Fechamento e Vencimento */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="dia_fechamento" className="form-label form-label--required">
              <Calendar size={16} />
              <span>Dia do Fechamento</span>
              <div className="cartao-tooltip">
                <AlertCircle size={14} />
                <span className="cartao-tooltiptext">Dia em que a fatura é fechada</span>
              </div>
            </label>
            <select
              id="dia_fechamento"
              name="dia_fechamento"
              value={formData.dia_fechamento}
              onChange={handleChange}
              className={`form-input ${errors.dia_fechamento ? 'form-input--error' : ''}`}
            >
              {DIAS_MES.map(dia => (
                <option key={`fechamento-${dia.value}`} value={dia.value}>
                  {dia.label}
                </option>
              ))}
            </select>
            {errors.dia_fechamento && <div className="form-error">{errors.dia_fechamento}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="dia_vencimento" className="form-label form-label--required">
              <Calendar size={16} />
              <span>Dia do Vencimento</span>
              <div className="cartao-tooltip">
                <AlertCircle size={14} />
                <span className="cartao-tooltiptext">Dia em que a fatura deve ser paga</span>
              </div>
            </label>
            <select
              id="dia_vencimento"
              name="dia_vencimento"
              value={formData.dia_vencimento}
              onChange={handleChange}
              className={`form-input ${errors.dia_vencimento ? 'form-input--error' : ''}`}
            >
              {DIAS_MES.map(dia => (
                <option key={`vencimento-${dia.value}`} value={dia.value}>
                  {dia.label}
                </option>
              ))}
            </select>
            {errors.dia_vencimento && <div className="form-error">{errors.dia_vencimento}</div>}
          </div>
        </div>
        
        {/* Conta para Pagamento */}
        <div className="form-group">
          <label htmlFor="conta_debito_id" className="form-label">
            <Landmark size={16} />
            <span>Conta para Pagamento</span>
            <div className="cartao-tooltip">
              <AlertCircle size={14} />
              <span className="cartao-tooltiptext">Conta bancária utilizada para pagar a fatura</span>
            </div>
          </label>
          <select
            id="conta_debito_id"
            name="conta_debito_id"
            value={formData.conta_debito_id}
            onChange={handleChange}
            className="form-input"
          >
            <option value="">Selecione uma conta</option>
            {contas && contas.map(conta => (
              <option key={conta.id} value={conta.id}>
                {conta.nome}
              </option>
            ))}
          </select>
        </div>
        
        {/* Status Ativo */}
        <div className="form-group">
          <label htmlFor="ativo" className="cartao-checkbox-label">
            <input
              type="checkbox"
              id="ativo"
              name="ativo"
              checked={formData.ativo}
              onChange={handleChange}
              className="cartao-checkbox"
            />
            <span>Cartão ativo</span>
          </label>
          <small className="form-helper">
            Desmarque para arquivar este cartão sem excluí-lo
          </small>
        </div>
        
        {/* Cor do Cartão */}
        <div className="form-group">
          <label htmlFor="cor" className="form-label">
            <span>Cor do Cartão</span>
          </label>
          <div className="cartao-cor-controls">
            <input
              type="color"
              id="cor"
              name="cor"
              value={formData.cor}
              onChange={handleChange}
              className="cartao-color-picker"
            />
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={() => setMostrarPreview(!mostrarPreview)}
            >
              {mostrarPreview ? 'Esconder Preview' : 'Ver Preview do Cartão'}
            </button>
          </div>
        </div>
        
        {/* Botões de Ação */}
        <div className="form-actions">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={onCancel}
          >
            Cancelar
          </button>
          
          <button
            type="button"
            className="btn btn--primary cartao-btn-salvar-novo"
            onClick={(e) => handleSubmit(e, true)}
          >
            Salvar e Criar Novo
          </button>
          
          <button
            type="button"
            className="btn btn--primary cartao-btn-salvar"
            onClick={(e) => handleSubmit(e, false)}
          >
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
};

CartaoForm.propTypes = {
  cartao: PropTypes.object,
  contas: PropTypes.array,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default CartaoForm;
// src/modules/cartoes/components/CartaoForm.jsx
// ✅ SIMPLIFICADO: Versão user-friendly com campos essenciais
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { CreditCard, DollarSign, Calendar, Check, PlusCircle } from 'lucide-react';
import InputMoney from '@shared/components/ui/InputMoney';
import '@shared/styles/FormsModal.css';

/**
 * Formulário simplificado para cadastro e edição de cartões de crédito
 * ✅ SIMPLIFICADO: Apenas campos essenciais para o usuário
 */
const CartaoForm = ({ cartao, contas, onSave, onCancel }) => {
  // Estado do formulário - campos essenciais + valores padrão
  const [formData, setFormData] = useState({
    nome: '',
    limite: 0,
    bandeira: '',
    cor: '#8A05BE',
    // Campos ocultos com valores padrão
    dia_fechamento: 1,
    dia_vencimento: 10,
    banco: '',
    conta_debito_id: '',
    ativo: true
  });
  
  // Estado de erros do formulário
  const [errors, setErrors] = useState({});
  
  // Estado para loading
  const [loading, setLoading] = useState(false);
  
  // ✅ Bandeiras com ícones visuais
  const BANDEIRAS = [
    { id: 'visa', nome: 'Visa', icon: '💳' },
    { id: 'mastercard', nome: 'Mastercard', icon: '💳' },
    { id: 'elo', nome: 'Elo', icon: '💳' },
    { id: 'amex', nome: 'American Express', icon: '💳' },
    { id: 'hipercard', nome: 'Hipercard', icon: '💳' },
    { id: 'outros', nome: 'Outros', icon: '💳' }
  ];

  // Cores padrão para cartões
  const CORES_CARTAO = [
    '#8A05BE', '#DC3545', '#F97316', '#EAB308',
    '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899'
  ];
  
  // Preenche o formulário quando receber um cartão para edição
  useEffect(() => {
    if (cartao) {
      setFormData({
        nome: cartao.nome || '',
        limite: cartao.limite || 0,
        bandeira: cartao.bandeira || '',
        cor: cartao.cor || '#8A05BE',
        // Campos ocultos mantêm os valores existentes ou padrão
        dia_fechamento: cartao.dia_fechamento || 1,
        dia_vencimento: cartao.dia_vencimento || 10,
        banco: cartao.banco || '',
        conta_debito_id: cartao.conta_debito_id || '',
        ativo: cartao.ativo !== undefined ? cartao.ativo : true
      });
    } else {
      // Reset para novo cartão com valores padrão
      setFormData({
        nome: '',
        limite: 0,
        bandeira: '',
        cor: '#8A05BE',
        dia_fechamento: 1,
        dia_vencimento: 10,
        banco: '',
        conta_debito_id: '',
        ativo: true
      });
    }
    setErrors({});
  }, [cartao]);

  // Handler para mudanças nos inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Conversão para números quando necessário
    let finalValue = value;
    if (name === 'dia_fechamento' || name === 'dia_vencimento') {
      finalValue = Number(value);
    }
    
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

  // Handler para seleção de cor
  const handleCorSelect = (cor) => {
    setFormData(prev => ({ ...prev, cor }));
  };

  // Handler para seleção de bandeira
  const handleBandeiraSelect = (bandeiraId) => {
    setFormData(prev => ({ ...prev, bandeira: bandeiraId }));
    if (errors.bandeira) {
      setErrors(prev => ({ ...prev, bandeira: null }));
    }
  };
    
  // ✅ Validação simplificada - apenas campos essenciais
  const validateForm = () => {
    const newErrors = {};
    
    // Validações de campos obrigatórios
    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome do cartão é obrigatório';
    } else if (        formData.nome.trim().length < 2) {
      newErrors.nome = 'Nome deve ter pelo menos 2 caracteres';
    }
    
    if (!formData.limite && formData.limite !== 0) {
      newErrors.limite = 'Informe um limite válido';
    } else if (formData.limite < 0) {
      newErrors.limite = 'Limite não pode ser negativo';
    }
    
    if (!formData.bandeira) {
      newErrors.bandeira = 'Selecione a bandeira do cartão';
    }
    
    // Validações dos dias de fechamento e vencimento
    if (!formData.dia_fechamento || formData.dia_fechamento < 1 || formData.dia_fechamento > 31) {
      newErrors.dia_fechamento = 'Dia de fechamento inválido';
    }
    
    if (!formData.dia_vencimento || formData.dia_vencimento < 1 || formData.dia_vencimento > 31) {
      newErrors.dia_vencimento = 'Dia de vencimento inválido';
    }

    // Fechamento e vencimento não podem ser iguais
    if (formData.dia_fechamento === formData.dia_vencimento) {
      newErrors.dia_vencimento = 'Dia de vencimento deve ser diferente do fechamento';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handler para submit
  const handleSubmit = async (e, criarNovo = false) => {
    if (e) e.preventDefault();
    
    if (validateForm()) {
      setLoading(true);
      try {
        console.log('📝 CartaoForm - Dados do formulário:', formData);
        await onSave(formData, criarNovo);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="section-block">
      <form onSubmit={(e) => handleSubmit(e, false)}>
        
        {/* Nome do Cartão + Limite na mesma linha */}
        <div className="flex gap-3 row mb-3">
          <div className="flex flex-col flex-1">
            <label className="form-label">
              <CreditCard size={14} />
              Nome do Cartão *
            </label>
            <input 
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              placeholder="Ex: Nubank, Itaú Visa, Inter Gold"
              maxLength="50"
              className={`input-text ${errors.nome ? 'error' : ''}`}
            />
            {errors.nome && <div className="form-error">{errors.nome}</div>}
          </div>
          
          <div className="flex flex-col" style={{ minWidth: '160px' }}>
            <label className="form-label">
              <DollarSign size={14} />
              Limite Total *
            </label>
            <InputMoney
              value={formData.limite}
              onChange={handleLimiteChange}
              placeholder="R$ 0,00"
              className={`input-money input-money-highlight ${errors.limite ? 'error' : ''}`}
            />
            {errors.limite && <div className="form-error">{errors.limite}</div>}
          </div>
        </div>
        
        {/* Dias de Fechamento e Vencimento */}
        <div className="flex gap-3 row mb-3">
          <div className="flex flex-col">
            <label className="form-label">
              <Calendar size={14} />
              Dia Fechamento *
              <span className="form-label-small">(fatura)</span>
            </label>
            <div className="select-search">
              <select
                name="dia_fechamento"
                value={formData.dia_fechamento}
                onChange={handleChange}
                className={errors.dia_fechamento ? 'error' : ''}
              >
                {Array.from({ length: 31 }, (_, i) => (
                  <option key={`fechamento-${i + 1}`} value={i + 1}>
                    Dia {i + 1}
                  </option>
                ))}
              </select>
            </div>
            {errors.dia_fechamento && <div className="form-error">{errors.dia_fechamento}</div>}
          </div>
          
          <div className="flex flex-col">
            <label className="form-label">
              <Calendar size={14} />
              Dia Vencimento *
              <span className="form-label-small">(pagamento)</span>
            </label>
            <div className="select-search">
              <select
                name="dia_vencimento"
                value={formData.dia_vencimento}
                onChange={handleChange}
                className={errors.dia_vencimento ? 'error' : ''}
              >
                {Array.from({ length: 31 }, (_, i) => (
                  <option key={`vencimento-${i + 1}`} value={i + 1}>
                    Dia {i + 1}
                  </option>
                ))}
              </select>
            </div>
            {errors.dia_vencimento && <div className="form-error">{errors.dia_vencimento}</div>}
          </div>
        </div>
        
        {/* Bandeira do Cartão */}
        <div className="flex flex-col mb-3">
          <label className="form-label">
            <CreditCard size={14} />
            Bandeira *
          </label>
          <div className="bandeiras-scroll-container">
            {BANDEIRAS.map(bandeira => (
              <button
                key={bandeira.id}
                type="button"
                className={`status-option ${formData.bandeira === bandeira.id ? 'active' : ''}`}
                onClick={() => handleBandeiraSelect(bandeira.id)}
              >
                <div>
                  <div>{bandeira.nome}</div>
                </div>
                {formData.bandeira === bandeira.id && <Check size={14} />}
              </button>
            ))}
          </div>
          {errors.bandeira && <div className="form-error">{errors.bandeira}</div>}
        </div>
        
        {/* Cor do Cartão */}
        <div className="flex flex-col mb-4">
          <label className="form-label">
            Cor do Cartão
          </label>
          <div className="color-picker">
            {CORES_CARTAO.map(cor => (
              <button
                key={cor}
                type="button"
                className={`color-option ${formData.cor === cor ? 'active' : ''}`}
                style={{ backgroundColor: cor }}
                onClick={() => handleCorSelect(cor)}
                title={`Cor: ${cor}`}
              />
            ))}
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex gap-3 row">
          <button
            type="button"
            className="btn-cancel"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </button>
          
          {/* Botão "Continuar Adicionando" para novos cartões */}
          {!cartao && (
            <button
              type="button"
              className="btn-secondary btn-secondary--success"
              onClick={(e) => handleSubmit(e, true)}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="btn-spinner"></span>
                  Salvando...
                </>
              ) : (
                <>
                  <PlusCircle size={14} />
                  Continuar Adicionando
                </>
              )}
            </button>
          )}
          
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="btn-spinner"></span>
                Salvando...
              </>
            ) : (
              <>
                <CreditCard size={14} />
                {cartao ? 'Atualizar Cartão' : 'Salvar Cartão'}
              </>
            )}
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
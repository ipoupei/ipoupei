// src/modules/cartoes/components/CartaoForm.jsx
// ✅ AJUSTES FINAIS: Pequenas melhorias, funcionalidade preservada
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { CreditCard, Calendar, DollarSign, Landmark, Check, PlusCircle } from 'lucide-react';
import InputMoney from '@shared/components/ui/InputMoney';
import '@shared/styles/FormsModal.css';

/**
 * Formulário para cadastro e edição de cartões de crédito
 * ✅ AJUSTADO: Melhorias mínimas, estrutura preservada
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
  
  // Estado para loading
  const [loading, setLoading] = useState(false);
  
  // ✅ MELHORIA: Bandeiras com ícones visuais
  const BANDEIRAS = [
    { id: 'visa', nome: 'Visa', icon: '💳' },
    { id: 'mastercard', nome: 'Mastercard', icon: '💳' },
    { id: 'elo', nome: 'Elo', icon: '💳' },
    { id: 'amex', nome: 'American Express', icon: '💳' },
    { id: 'hipercard', nome: 'Hipercard', icon: '💳' },
    { id: 'outros', nome: 'Outros', icon: '💳' }
  ];

  // Cores padrão para cartões - usando as mesmas do sistema
  const CORES_CARTAO = [
    '#8A05BE', '#DC3545', '#F97316', '#EAB308',
    '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899'
  ];

  // Gera array de dias do mês (1-31)
  const DIAS_MES = Array.from({ length: 31 }, (_, i) => ({
    value: i + 1,
    label: `Dia ${i + 1}`
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
    } else {
      // Reset para novo cartão
      setFormData({
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
    
  // ✅ MELHORIA: Validação mais robusta
  const validateForm = () => {
    const newErrors = {};
    
    // Validações de campos obrigatórios
    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome do cartão é obrigatório';
    } else if (formData.nome.trim().length < 2) {
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
    
    if (!formData.dia_fechamento || formData.dia_fechamento < 1 || formData.dia_fechamento > 31) {
      newErrors.dia_fechamento = 'Dia de fechamento inválido';
    }
    
    if (!formData.dia_vencimento || formData.dia_vencimento < 1 || formData.dia_vencimento > 31) {
      newErrors.dia_vencimento = 'Dia de vencimento inválido';
    }

    // ✅ NOVA VALIDAÇÃO: Fechamento e vencimento não podem ser iguais
    if (formData.dia_fechamento === formData.dia_vencimento) {
      newErrors.dia_vencimento = 'Dia de vencimento deve ser diferente do fechamento';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // ✅ MELHORIA: Handler para "Continuar Adicionando"
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

  // ✅ MELHORIA: Contas ativas filtradas
  const contasAtivas = (contas || []).filter(conta => conta.ativo !== false);

  return (
    <div className="section-block">
      <form onSubmit={(e) => handleSubmit(e, false)}>
        {/* Nome do Cartão */}
        <div className="flex flex-col mb-3">
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
        
        {/* Limite e Banco */}
        <div className="flex gap-3 row mb-3">
          <div className="flex flex-col">
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
          <div className="flex flex-col">
            <label className="form-label">
              <Landmark size={14} />
              Banco
              <span className="form-label-small">(opcional)</span>
            </label>
            <input 
              type="text"
              name="banco"
              value={formData.banco}
              onChange={handleChange}
              placeholder="Ex: Nubank, Itaú, Inter"
              maxLength="30"
              className="input-text"
            />
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
                {DIAS_MES.map(dia => (
                  <option key={`fechamento-${dia.value}`} value={dia.value}>
                    {dia.label}
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
                {DIAS_MES.map(dia => (
                  <option key={`vencimento-${dia.value}`} value={dia.value}>
                    {dia.label}
                  </option>
                ))}
              </select>
            </div>
            {errors.dia_vencimento && <div className="form-error">{errors.dia_vencimento}</div>}
          </div>
        </div>

        {/* Conta para Pagamento */}
        <div className="flex flex-col mb-3">
          <label className="form-label">
            <Landmark size={14} />
            Conta para Pagamento
            <span className="form-label-small">(opcional)</span>
          </label>
          <div className="select-search">
            <select
              name="conta_debito_id"
              value={formData.conta_debito_id}
              onChange={handleChange}
            >
              <option value="">Nenhuma conta vinculada</option>
              {contasAtivas.map(conta => (
                <option key={conta.id} value={conta.id}>
                  {conta.nome} {/* ✅ Mostra saldo se disponível */}
                  {conta.saldo !== undefined && ` - ${new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(conta.saldo)}`}
                </option>
              ))}
            </select>
          </div>
          <div className="form-hint">
            <small>💡 A conta selecionada será usada por padrão no pagamento das faturas</small>
          </div>
        </div>
        
        {/* Cor do Cartão */}
        <div className="flex flex-col mb-3">
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

        {/* Status Ativo */}
        <div className="flex flex-col mb-4">
          <label className="form-label">Status do Cartão</label>
          <div className="status-selector">
            <button
              type="button"
              className={`status-option success ${formData.ativo ? 'active' : ''}`}
              onClick={() => setFormData(prev => ({ ...prev, ativo: !prev.ativo }))}
            >
              <Check size={16} />
              <div>
                <div>Cartão Ativo</div>
                <small>Cartão disponível para uso e lançamentos</small>
              </div>
            </button>
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
          
          {/* ✅ MELHORIA: Botão "Continuar Adicionando" para novos cartões */}
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
// src/modules/cartoes/components/ModalEstornoCartao.jsx
// ✅ REFATORADO: Usa novos hooks e faturaVencimento em vez de ano/mês
// ❌ PROIBIDO: Lógica de busca no componente, chamadas diretas ao Supabase

import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { 
  RefreshCw, 
  AlertCircle, 
  Check, 
  Calendar, 
  DollarSign,
  FileText,
  X
} from 'lucide-react';

// ✅ USAR: Novos hooks refatorados
import { useAuthStore } from '@modules/auth/store/authStore';
import { useUIStore } from '@store/uiStore';
import useCartoesData from '@modules/cartoes/hooks/useCartoesData';
import useFaturaOperations from '@modules/cartoes/hooks/useFaturaOperations';

import { formatCurrency } from '@utils/formatCurrency';
import '@shared/styles/FormsModal.css';

/**
 * Modal para lançar estorno de cartão
 * ✅ CORREÇÕES:
 * - Usa useCartoesData.fetchFaturasDisponiveis() em vez de lógica própria
 * - Usa useFaturaOperations.lancarEstorno() corretamente
 * - Trabalha com faturaVencimento em vez de ano/mês
 * - Remove lógica de negócio do componente
 */
const ModalEstornoCartao = ({ 
  isOpen, 
  onClose, 
  cartao,
  onSuccess 
}) => {
  const { user } = useAuthStore();
  const { showNotification } = useUIStore();
  
  // ✅ USAR: Hooks refatorados
  const { 
    fetchFaturasDisponiveis,
    loading: dataLoading,
    error: dataError
  } = useCartoesData();
  
  const { 
    lancarEstorno,
    loading: operationLoading,
    error: operationError
  } = useFaturaOperations();

  const valorInputRef = useRef(null);

  // Estados locais
  const [formData, setFormData] = useState({
    valor: '',
    descricao: '',
    faturaVencimento: '',
    dataEstorno: new Date().toISOString().split('T')[0]
  });
  
  const [errors, setErrors] = useState({});
  const [faturasDisponiveis, setFaturasDisponiveis] = useState([]);

  // ✅ CARREGAMENTO: Usar hook quando modal abre
  useEffect(() => {
    if (isOpen && cartao?.id) {
      carregarFaturasDisponiveis();
      resetForm();
    }
  }, [isOpen, cartao?.id]);

  const carregarFaturasDisponiveis = async () => {
    try {
      // ✅ USAR: Hook useCartoesData.fetchFaturasDisponiveis()
      const faturas = await fetchFaturasDisponiveis(cartao.id);
      
      // ✅ FILTRAR: Apenas faturas não pagas (em aberto)
      const faturasAbertas = faturas.filter(fatura => !fatura.status_paga);
      
      console.log('📋 Faturas disponíveis para estorno:', {
        total: faturas.length,
        abertas: faturasAbertas.length,
        faturas: faturasAbertas.map(f => ({
          vencimento: f.fatura_vencimento,
          valor: f.valor_total,
          paga: f.status_paga
        }))
      });
      
      setFaturasDisponiveis(faturasAbertas);
      
      // Se houver apenas uma fatura aberta, selecionar automaticamente
      if (faturasAbertas.length === 1) {
        setFormData(prev => ({
          ...prev,
          faturaVencimento: faturasAbertas[0].fatura_vencimento
        }));
      }
      
    } catch (error) {
      console.error('Erro ao carregar faturas disponíveis:', error);
      showNotification('Erro ao carregar faturas disponíveis', 'error');
    }
  };

  const resetForm = useCallback(() => {
    setFormData({
      valor: '',
      descricao: '',
      faturaVencimento: '',
      dataEstorno: new Date().toISOString().split('T')[0]
    });
    setErrors({});
    
    // Focus no input de valor
    setTimeout(() => valorInputRef.current?.focus(), 150);
  }, []);

  // ✅ FORMATAÇÃO SIMPLES: Apenas no componente
  const formatarValor = useCallback((valor) => {
    const apenasNumeros = valor.toString().replace(/\D/g, '');
    if (!apenasNumeros || apenasNumeros === '0') return '';
    const valorEmCentavos = parseInt(apenasNumeros, 10);
    const valorEmReais = valorEmCentavos / 100;
    return valorEmReais.toLocaleString('pt-BR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  }, []);

  const valorNumerico = useCallback(() => {
    if (!formData.valor) return 0;
    const valorString = formData.valor.toString();
    if (valorString.includes(',')) {
      const partes = valorString.split(',');
      const inteira = partes[0].replace(/\./g, '');
      const decimal = partes[1] || '00';
      const valorFinal = parseFloat(`${inteira}.${decimal}`);
      return isNaN(valorFinal) ? 0 : valorFinal;
    } else {
      const apenasNumeros = valorString.replace(/\./g, '');
      const valorFinal = parseFloat(apenasNumeros) / 100;
      return isNaN(valorFinal) ? 0 : valorFinal;
    }
  }, [formData.valor]);

  // Handlers
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  }, [errors]);

  const handleValorChange = useCallback((e) => {
    const valorFormatado = formatarValor(e.target.value);
    setFormData(prev => ({ ...prev, valor: valorFormatado }));
    if (errors.valor) {
      setErrors(prev => ({ ...prev, valor: null }));
    }
  }, [formatarValor, errors.valor]);

  const handleCancelar = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  // Validação
  const validateForm = useCallback(() => {
    const newErrors = {};
    const valor = valorNumerico();
    
    if (!valor || valor === 0) {
      newErrors.valor = "Valor é obrigatório";
    } else if (valor < 0) {
      newErrors.valor = "Valor deve ser positivo";
    }
    
    if (!formData.descricao.trim()) {
      newErrors.descricao = "Descrição é obrigatória";
    } else if (formData.descricao.length > 100) {
      newErrors.descricao = "Máximo de 100 caracteres";
    }
    
    if (!formData.faturaVencimento) {
      newErrors.faturaVencimento = "Selecione uma fatura";
    }
    
    if (!formData.dataEstorno) {
      newErrors.dataEstorno = "Data é obrigatória";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, valorNumerico]);

  // ✅ USAR: Hook useFaturaOperations.lancarEstorno()
  const handleConfirmar = useCallback(async () => {
    if (!validateForm()) {
      showNotification('Por favor, corrija os erros no formulário', 'error');
      return;
    }

    if (!cartao?.id) {
      showNotification('Dados do cartão inválidos', 'error');
      return;
    }

    try {
      const valor = valorNumerico();
      
      console.log('💳 Processando estorno:', {
        cartao: cartao.nome,
        cartaoId: cartao.id,
        valor,
        descricao: formData.descricao,
        faturaVencimento: formData.faturaVencimento,
        dataEstorno: formData.dataEstorno
      });

      // ✅ USAR: Hook useFaturaOperations.lancarEstorno()
      const resultado = await lancarEstorno({
        cartao_id: cartao.id,
        descricao: formData.descricao.trim(),
        valor: valor,
        fatura_vencimento: formData.faturaVencimento,
        data_estorno: formData.dataEstorno,
        observacoes: `Estorno lançado em ${new Date().toLocaleDateString('pt-BR')}`
      });
      
      if (resultado.success) {
        showNotification(
          `Estorno de ${formatCurrency(valor)} lançado com sucesso!`,
          'success'
        );
        
        // Callback de sucesso
        if (onSuccess) {
          onSuccess({
            cartaoId: cartao.id,
            faturaVencimento: formData.faturaVencimento,
            valorEstorno: valor,
            descricao: formData.descricao
          });
        }
        
        // Fechar modal após delay
        setTimeout(() => {
          handleCancelar();
        }, 1500);
        
      } else {
        throw new Error(resultado.error || 'Erro desconhecido');
      }
      
    } catch (error) {
      console.error('❌ Erro ao processar estorno:', error);
      showNotification(`Erro ao lançar estorno: ${error.message}`, 'error');
    }
  }, [
    validateForm, 
    cartao, 
    valorNumerico, 
    formData, 
    lancarEstorno, 
    showNotification, 
    onSuccess, 
    handleCancelar
  ]);

  // ESC para fechar
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleCancelar();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, handleCancelar]);

  if (!isOpen || !cartao) return null;

  // ✅ FORMATAÇÃO SIMPLES: Apenas formatação de dados
  const faturaInfo = formData.faturaVencimento 
    ? faturasDisponiveis.find(f => f.fatura_vencimento === formData.faturaVencimento)
    : null;

  const faturaFormatada = faturaInfo
    ? new Date(faturaInfo.fatura_vencimento + 'T12:00:00').toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric'
      })
    : 'Não selecionada';

  const isLoading = dataLoading || operationLoading;
  const hasError = dataError || operationError;

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`}>
      <div className="forms-modal-container">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <div className="modal-icon-container modal-icon-success">
              <RefreshCw size={18} />
            </div>
            <div>
              <h2 className="modal-title">Lançar Estorno</h2>
              <p className="modal-subtitle">Adicione um crédito na fatura do cartão</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Informações do Cartão */}
          <div className="summary-panel summary-panel-success mb-4">
            <div className="summary-header">
              <RefreshCw size={16} />
              Cartão Selecionado
            </div>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="summary-label">Nome:</span>
                <span className="summary-value">{cartao.nome}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Bandeira:</span>
                <span className="summary-value">{cartao.bandeira}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Limite:</span>
                <span className="summary-value">{formatCurrency(cartao.limite || 0)}</span>
              </div>
            </div>
          </div>

          {/* Status das Faturas */}
          {faturasDisponiveis.length === 0 ? (
            <div className="alert alert-warning mb-3">
              <div className="alert-icon">
                <AlertCircle size={16} />
              </div>
              <div className="alert-content">
                <strong>Nenhuma fatura aberta encontrada</strong>
                <p className="alert-description">
                  Estornos só podem ser lançados em faturas que ainda não foram pagas
                </p>
              </div>
            </div>
          ) : (
            <div className="alert alert-info mb-3">
              <div className="alert-icon">
                <Check size={16} />
              </div>
              <div className="alert-content">
                <strong>{faturasDisponiveis.length} fatura(s) disponível(is)</strong>
                <p className="alert-description">
                  Selecione a fatura onde deseja lançar o estorno
                </p>
              </div>
            </div>
          )}

          <form>
            {/* Valor do Estorno */}
            <div className="flex flex-col mb-3">
              <label className="form-label">
                <DollarSign size={14} />
                Valor do Estorno *
              </label>
              <input
                ref={valorInputRef}
                type="text"
                value={formData.valor}
                onChange={handleValorChange}
                placeholder="0,00"
                disabled={isLoading}
                className={`input-money input-money-highlight ${errors.valor ? 'error' : ''}`}
              />
              {errors.valor && <div className="form-error">{errors.valor}</div>}
              <div className="form-hint">
                <small>💡 Informe o valor que será creditado na fatura</small>
              </div>
            </div>

            {/* Descrição */}
            <div className="flex flex-col mb-3">
              <label className="form-label">
                <FileText size={14} />
                Descrição *
              </label>
              <input
                type="text"
                name="descricao"
                value={formData.descricao}
                onChange={handleInputChange}
                placeholder="Ex: Cashback compra loja X, Reembolso produto defeituoso"
                disabled={isLoading}
                maxLength="100"
                className={`input-text ${errors.descricao ? 'error' : ''}`}
              />
              <div className="char-counter">
                <span className="form-label-small">Máximo 100 caracteres</span>
                <span className={formData.descricao.length > 90 ? 'char-counter-warning' : ''}>
                  {formData.descricao.length}/100
                </span>
              </div>
              {errors.descricao && <div className="form-error">{errors.descricao}</div>}
            </div>

            {/* Seleção de Fatura */}
            <div className="flex flex-col mb-3">
              <label className="form-label">
                <Calendar size={14} />
                Fatura de Destino *
              </label>
              <div className="select-search">
                <select
                  name="faturaVencimento"
                  value={formData.faturaVencimento}
                  onChange={handleInputChange}
                  disabled={isLoading || faturasDisponiveis.length === 0}
                  className={`${faturasDisponiveis.length === 0 ? 'input-disabled' : ''} ${errors.faturaVencimento ? 'error' : ''}`}
                >
                  <option value="">
                    {faturasDisponiveis.length === 0 ? "Nenhuma fatura aberta" : "Selecione a fatura"}
                  </option>
                  {faturasDisponiveis.map(fatura => {
                    const dataFormatada = new Date(fatura.fatura_vencimento + 'T12:00:00').toLocaleDateString('pt-BR', {
                      month: 'long',
                      year: 'numeric'
                    });
                    
                    return (
                      <option key={fatura.fatura_vencimento} value={fatura.fatura_vencimento}>
                        {dataFormatada} - {formatCurrency(fatura.valor_total)} (Em aberto)
                      </option>
                    );
                  })}
                </select>
              </div>
              {errors.faturaVencimento && <div className="form-error">{errors.faturaVencimento}</div>}
              
              {faturaInfo && (
                <div className="form-hint">
                  <small>
                    📅 Fatura selecionada: {faturaFormatada} - 
                    Valor atual: {formatCurrency(faturaInfo.valor_total)}
                  </small>
                </div>
              )}
            </div>

            {/* Data do Estorno */}
            <div className="flex flex-col mb-3">
              <label className="form-label">
                <Calendar size={14} />
                Data do Estorno *
              </label>
              <input
                type="date"
                name="dataEstorno"
                value={formData.dataEstorno}
                onChange={handleInputChange}
                disabled={isLoading}
                className={`input-date ${errors.dataEstorno ? 'error' : ''}`}
              />
              {errors.dataEstorno && <div className="form-error">{errors.dataEstorno}</div>}
            </div>
          </form>

          {/* Informação Importante */}
          <div className="alert alert-info mb-3">
            <div className="alert-icon">
              <AlertCircle size={16} />
            </div>
            <div className="alert-content">
              <strong>Como funciona o estorno:</strong>
              <ul className="alert-list">
                <li>O valor será creditado na fatura selecionada</li>
                <li>Aparecerá como uma transação positiva (reduz o valor da fatura)</li>
                <li>Só é possível lançar em faturas ainda não pagas</li>
                <li>O estorno ficará visível na lista de transações do cartão</li>
              </ul>
            </div>
          </div>

          {/* Preview do Estorno */}
          {valorNumerico() > 0 && formData.descricao && faturaInfo && (
            <div className="summary-panel summary-panel-success mb-3">
              <div className="summary-header">
                <Check size={16} />
                Preview do Estorno
              </div>
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="summary-label">Valor:</span>
                  <span className="summary-value summary-value-positive">
                    + {formatCurrency(valorNumerico())}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Descrição:</span>
                  <span className="summary-value">{formData.descricao}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Fatura:</span>
                  <span className="summary-value">{faturaFormatada}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Novo valor da fatura:</span>
                  <span className="summary-value">
                    {formatCurrency(faturaInfo.valor_total - valorNumerico())}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            type="button"
            onClick={handleCancelar}
            disabled={isLoading}
            className="btn-cancel"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmar}
            disabled={
              isLoading || 
              valorNumerico() === 0 || 
              !formData.descricao.trim() || 
              !formData.faturaVencimento ||
              faturasDisponiveis.length === 0
            }
            className="btn-primary btn-primary--success"
          >
            {isLoading ? (
              <>
                <div className="btn-spinner"></div>
                Lançando...
              </>
            ) : (
              <>
                <Check size={14} />
                Lançar Estorno
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Error Display */}
      {hasError && (
        <div className="modal-overlay-error">
          <div className="error-toast">
            <AlertCircle size={16} />
            {dataError || operationError}
          </div>
        </div>
      )}
    </div>
  );
};

ModalEstornoCartao.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  cartao: PropTypes.shape({
    id: PropTypes.string.isRequired,
    nome: PropTypes.string.isRequired,
    bandeira: PropTypes.string,
    limite: PropTypes.number,
    cor: PropTypes.string
  }),
  onSuccess: PropTypes.func
};

export default React.memo(ModalEstornoCartao);
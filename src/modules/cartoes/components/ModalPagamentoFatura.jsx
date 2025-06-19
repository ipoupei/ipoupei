// src/modules/cartoes/components/ModalPagamentoFatura.jsx - AJUSTADO PARA fatura_vencimento
import React, { useState, useEffect } from 'react';
import { CreditCard, AlertCircle, Check, DollarSign } from 'lucide-react';
import { formatCurrency } from '../../../shared/utils/formatCurrency';
import useContas from '../../contas/hooks/useContas';
import useFaturaOperations from '../hooks/useFaturaOperations';

const ModalPagamentoFatura = ({ 
  isOpen, 
  onClose, 
  cartao, 
  valorFatura, 
  faturaVencimento, // ✅ NOVO: Parâmetro principal
  mesReferencia, // ✅ MANTIDO: Para exibição de compatibilidade
  anoReferencia, // ✅ MANTIDO: Para exibição de compatibilidade
  onSuccess 
}) => {
  const [contaSelecionada, setContaSelecionada] = useState('');
  const [confirmacao, setConfirmacao] = useState(false);
  
  const { contas, fetchContas } = useContas();
  const { pagarFatura, isLoading, error, setError } = useFaturaOperations();

  useEffect(() => {
    if (isOpen) {
      // ✅ VALIDAÇÃO: Verificar se faturaVencimento foi fornecido
      if (!faturaVencimento) {
        console.error('❌ faturaVencimento é obrigatório para o modal de pagamento');
        setError('Erro: Data de vencimento da fatura não encontrada. Feche e tente novamente.');
        return;
      }

      console.log('📝 Modal de pagamento aberto para fatura:', faturaVencimento);
      
      fetchContas();
      setContaSelecionada('');
      setConfirmacao(false);
      setError(null);
    }
  }, [isOpen, faturaVencimento, fetchContas, setError]);

  // ✅ SELEÇÃO AUTOMÁTICA: Usar conta de débito do cartão como padrão
  useEffect(() => {
    if (contas?.length > 0 && cartao?.conta_debito_id) {
      const contaDebito = contas.find(c => c.id === cartao.conta_debito_id && c.ativo);
      if (contaDebito) {
        setContaSelecionada(contaDebito.id);
      } else {
        // Fallback para primeira conta ativa
        const primeiraContaAtiva = contas.find(c => c.ativo);
        if (primeiraContaAtiva) {
          setContaSelecionada(primeiraContaAtiva.id);
        }
      }
    }
  }, [contas, cartao?.conta_debito_id]);

  const contasAtivas = contas.filter(conta => conta.ativo);

  const handleConfirmar = async () => {
    // ✅ VALIDAÇÕES BÁSICAS
    if (!faturaVencimento) {
      setError('Erro: Data de vencimento da fatura não encontrada');
      return;
    }

    if (!contaSelecionada) {
      setError('Selecione uma conta para débito');
      return;
    }

    if (!confirmacao) {
      setError('Confirme a operação marcando a caixa de confirmação');
      return;
    }

    try {
      console.log('💳 Iniciando pagamento da fatura:', {
        cartaoId: cartao.id,
        contaId: contaSelecionada,
        faturaVencimento,
        valorFatura
      });

      // ✅ NOVA CHAMADA: Usar faturaVencimento ao invés de mes/ano
      const resultado = await pagarFatura(
        cartao.id, 
        contaSelecionada, 
        faturaVencimento // ✅ PARÂMETRO PRINCIPAL
      );

      if (resultado.success) {
        console.log('✅ Fatura paga com sucesso:', resultado);
        onSuccess && onSuccess();
        onClose();
      }
    } catch (err) {
      console.error('❌ Erro inesperado no pagamento:', err);
      setError(`Erro inesperado: ${err.message}`);
    }
  };

  const contaEscolhida = contasAtivas.find(c => c.id === contaSelecionada);

  // ✅ FORMATAÇÃO: Período para exibição
  const periodoExibicao = React.useMemo(() => {
    // Priorizar mesReferencia/anoReferencia se disponíveis (compatibilidade)
    if (mesReferencia && anoReferencia) {
      return new Date(anoReferencia, mesReferencia - 1).toLocaleDateString('pt-BR', { 
        month: 'long', 
        year: 'numeric' 
      });
    }
    
    // Caso contrário, usar faturaVencimento
    if (faturaVencimento) {
      try {
        const dataVencimento = new Date(faturaVencimento + 'T00:00:00');
        return dataVencimento.toLocaleDateString('pt-BR', {
          month: 'long',
          year: 'numeric'
        });
      } catch (err) {
        console.warn('Erro ao formatar faturaVencimento:', faturaVencimento);
        return 'Data inválida';
      }
    }
    
    return 'Período não informado';
  }, [mesReferencia, anoReferencia, faturaVencimento]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay active">
      <div className="forms-modal-container">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <div className="modal-icon-container modal-icon-primary">
              <CreditCard />
            </div>
            <div>
              <h2 className="modal-title">Pagar Fatura</h2>
              <p className="modal-subtitle">Efetive o pagamento da fatura do cartão</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Informações da Fatura */}
          <div className="summary-panel">
            <h3 className="summary-title">Detalhes da Fatura</h3>
            <div className="confirmation-info">
              <div className="confirmation-item">
                <strong>Cartão:</strong> {cartao?.nome || 'Cartão'} - {cartao?.bandeira || 'Visa'}
              </div>
              <div className="confirmation-item">
                <strong>Período:</strong> {periodoExibicao}
              </div>
              {/* ✅ DEBUG: Mostrar faturaVencimento em desenvolvimento */}
              {process.env.NODE_ENV === 'development' && faturaVencimento && (
                <div className="confirmation-item" style={{ fontSize: '12px', color: '#666' }}>
                  <strong>Debug - Vencimento:</strong> {faturaVencimento}
                </div>
              )}
              <div className="confirmation-item">
                <strong>Valor Total:</strong> 
                <span className="summary-value" style={{ color: '#DC3545' }}>
                  {formatCurrency(valorFatura || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Seleção de Conta */}
          <div>
            <label className="form-label">
              <DollarSign size={14} />
              Conta para Débito *
            </label>
            <div className="select-search">
              <select
                value={contaSelecionada}
                onChange={(e) => setContaSelecionada(e.target.value)}
                disabled={isLoading}
                className="input-base"
              >
                <option value="">Selecione uma conta</option>
                {contasAtivas.map(conta => (
                  <option key={conta.id} value={conta.id}>
                    {conta.nome} - {formatCurrency(conta.saldo)}
                  </option>
                ))}
              </select>
            </div>
            
            {contaEscolhida && (
              <div className="confirmation-info-box">
                <AlertCircle size={16} />
                <div>
                  <p><strong>Saldo após pagamento:</strong> {formatCurrency(contaEscolhida.saldo - (valorFatura || 0))}</p>
                  {(contaEscolhida.saldo - (valorFatura || 0)) < 0 && (
                    <p style={{ color: '#DC2626', fontWeight: 600, marginTop: '4px' }}>
                      ⚠️ Atenção: Saldo ficará negativo
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Confirmação */}
          <div className="confirmation-warning">
            <input
              type="checkbox"
              id="confirmacao"
              checked={confirmacao}
              onChange={(e) => setConfirmacao(e.target.checked)}
              disabled={isLoading}
              style={{ marginTop: '2px' }}
            />
            <div>
              <p>
                Confirmo que desejo pagar esta fatura no valor de{' '}
                <strong>{formatCurrency(valorFatura || 0)}</strong> debitando da conta selecionada.
                Esta operação efetivará todas as transações da fatura.
              </p>
            </div>
          </div>

          {/* ✅ AVISO: Se faturaVencimento não foi fornecido */}
          {!faturaVencimento && (
            <div className="summary-panel danger">
              <div className="confirmation-item">
                <AlertCircle size={16} style={{ color: '#DC3545', marginRight: '8px' }} />
                <strong>Erro crítico:</strong> Data de vencimento da fatura não encontrada. 
                Feche este modal e tente novamente.
              </div>
            </div>
          )}

          {/* Erro */}
          {error && (
            <div className="summary-panel danger">
              <div className="confirmation-item">
                <AlertCircle size={16} style={{ color: '#DC3545', marginRight: '8px' }} />
                {error}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            className="btn-cancel"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            className="btn-primary"
            onClick={handleConfirmar}
            disabled={
              isLoading || 
              !contaSelecionada || 
              !confirmacao || 
              !faturaVencimento // ✅ BLOQUEIO: Sem fatura_vencimento
            }
          >
            {isLoading ? (
              <>
                <div className="btn-spinner"></div>
                Pagando...
              </>
            ) : (
              <>
                <Check size={16} />
                Confirmar Pagamento
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalPagamentoFatura;
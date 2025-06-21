// src/modules/cartoes/components/ModalPagamentoFatura.jsx
// ✅ COMPLETO: Pagamento Integral + Parcial + Parcelado

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  AlertCircle, 
  Check, 
  DollarSign, 
  AlertTriangle,
  Calculator,
  Calendar
} from 'lucide-react';
import { formatCurrency } from '@shared/utils/formatCurrency';
import useContas from '@modules/contas/hooks/useContas';
import useFaturaOperations from '@modules/cartoes/hooks/useFaturaOperations';

const ModalPagamentoFatura = ({ 
  isOpen, 
  onClose, 
  cartao, 
  valorFatura, 
  faturaVencimento,
  mesReferencia, 
  anoReferencia, 
  onSuccess 
}) => {
  // Estados principais
  const [contaSelecionada, setContaSelecionada] = useState('');
  const [tipoPagamento, setTipoPagamento] = useState('integral'); // 'integral', 'parcial', 'parcelado'
  const [dataPagamento, setDataPagamento] = useState(new Date().toISOString().split('T')[0]);
  
  // Estados para pagamento parcial
  const [valorPagar, setValorPagar] = useState(valorFatura || 0);
  const [faturaDestinoRestante, setFaturaDestinoRestante] = useState('');
  const [opcoesFaturaRestante, setOpcoesFaturaRestante] = useState([]);
  
  // Estados para pagamento parcelado
  const [numeroParcelas, setNumeroParcelas] = useState(2);
  const [valorParcela, setValorParcela] = useState(0);
  const [faturaInicialVencimento, setFaturaInicialVencimento] = useState('');
  const [opcoesFatura, setOpcoesFatura] = useState([]);
  
  const { contas, fetchContas } = useContas();
  const { 
    pagarFatura, 
    pagarFaturaParcial, 
    pagarFaturaParcelado,
    buscarOpcoesFatura,
    loading, 
    error, 
    setError 
  } = useFaturaOperations();

  useEffect(() => {
    if (isOpen) {
      if (!faturaVencimento) {
        setError('Data de vencimento da fatura não encontrada');
        return;
      }
      
      fetchContas();
      setContaSelecionada('');
      setError(null);
      setTipoPagamento('integral');
      setDataPagamento(new Date().toISOString().split('T')[0]);
      setValorPagar(valorFatura || 0);
      setFaturaDestinoRestante('');
      setOpcoesFaturaRestante([]);
      setNumeroParcelas(2);
      setValorParcela(0);
      setFaturaInicialVencimento('');
      setOpcoesFatura([]);
    }
  }, [isOpen, faturaVencimento, valorFatura, fetchContas, setError]);

  // Buscar opções de fatura quando necessário
  useEffect(() => {
    if ((tipoPagamento === 'parcelado' || tipoPagamento === 'parcial') && cartao?.id) {
      const fetchOpcoes = async () => {
        const opcoes = await buscarOpcoesFatura(cartao.id, dataPagamento);
        
        if (tipoPagamento === 'parcelado') {
          setOpcoesFatura(opcoes);
          // Selecionar a opção padrão (is_default = true)
          const opcaoPadrao = opcoes.find(o => o.is_default);
          if (opcaoPadrao) {
            setFaturaInicialVencimento(opcaoPadrao.valor_opcao);
          }
        } else if (tipoPagamento === 'parcial') {
          setOpcoesFaturaRestante(opcoes);
          // Para pagamento parcial, selecionar a próxima fatura como padrão
          const proximaFatura = opcoes.find(o => new Date(o.valor_opcao) > new Date(faturaVencimento));
          if (proximaFatura) {
            setFaturaDestinoRestante(proximaFatura.valor_opcao);
          } else if (opcoes.length > 0) {
            setFaturaDestinoRestante(opcoes[opcoes.length - 1].valor_opcao);
          }
        }
      };
      
      fetchOpcoes();
    }
  }, [tipoPagamento, cartao?.id, dataPagamento, buscarOpcoesFatura, faturaVencimento]);

  // Seleção automática da conta de débito do cartão
  useEffect(() => {
    if (contas?.length > 0 && cartao?.conta_debito_id) {
      const contaDebito = contas.find(c => c.id === cartao.conta_debito_id && c.ativo);
      if (contaDebito) {
        setContaSelecionada(contaDebito.id);
      } else {
        const primeiraContaAtiva = contas.find(c => c.ativo);
        if (primeiraContaAtiva) {
          setContaSelecionada(primeiraContaAtiva.id);
        }
      }
    }
  }, [contas, cartao?.conta_debito_id]);

  const contasAtivas = contas.filter(conta => conta.ativo);

  const handleConfirmar = async () => {
    if (!faturaVencimento) {
      setError('Data de vencimento da fatura não encontrada');
      return;
    }

    if (!contaSelecionada) {
      setError('Selecione uma conta para débito');
      return;
    }

    try {
      let resultado;

      switch (tipoPagamento) {
        case 'integral':
          resultado = await pagarFatura(cartao.id, faturaVencimento, valorFatura || 0, dataPagamento);
          break;
          
        case 'parcial':
          if (valorPagar <= 0 || valorPagar >= (valorFatura || 0)) {
            setError('Valor a pagar deve ser maior que zero e menor que o total da fatura');
            return;
          }
          if (!faturaDestinoRestante) {
            setError('Selecione a fatura de destino para o saldo restante');
            return;
          }
          resultado = await pagarFaturaParcial(
            cartao.id, 
            faturaVencimento, 
            valorFatura || 0, 
            valorPagar,
            faturaDestinoRestante,
            dataPagamento,
            cartao
          );
          break;
          
        case 'parcelado':
          if (!faturaInicialVencimento) {
            setError('Selecione a fatura inicial para as parcelas');
            return;
          }
          if (numeroParcelas < 2 || numeroParcelas > 60) {
            setError('Número de parcelas deve ser entre 2 e 60');
            return;
          }
          resultado = await pagarFaturaParcelado(
            cartao.id,
            faturaVencimento,
            valorFatura || 0,
            numeroParcelas,
            valorParcela,
            faturaInicialVencimento,
            dataPagamento,
            cartao
          );
          break;
          
        default:
          setError('Tipo de pagamento inválido');
          return;
      }

      if (resultado.success) {
        onSuccess && onSuccess();
        onClose();
      }
    } catch (err) {
      setError(`Erro inesperado: ${err.message}`);
    }
  };

  const contaEscolhida = contasAtivas.find(c => c.id === contaSelecionada);
  const valorPagarFinal = tipoPagamento === 'parcial' ? valorPagar : (valorFatura || 0);

  // Formatação do período para exibição
  const periodoExibicao = React.useMemo(() => {
    if (mesReferencia && anoReferencia) {
      return new Date(anoReferencia, mesReferencia - 1).toLocaleDateString('pt-BR', { 
        month: 'long', 
        year: 'numeric' 
      });
    }
    
    if (faturaVencimento) {
      try {
        const dataVencimento = new Date(faturaVencimento + 'T00:00:00');
        return dataVencimento.toLocaleDateString('pt-BR', {
          month: 'long',
          year: 'numeric'
        });
      } catch (err) {
        return 'Data inválida';
      }
    }
    
    return 'Período não informado';
  }, [mesReferencia, anoReferencia, faturaVencimento]);

  // Cálculos para pagamento parcelado
  const valorTotalParcelado = numeroParcelas * valorParcela;
  const prejuizoParcelamento = valorTotalParcelado - (valorFatura || 0);
  const percentualPrejuizo = (valorFatura || 0) > 0 ? (prejuizoParcelamento / (valorFatura || 0)) * 100 : 0;

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
              <div className="confirmation-item">
                <strong>Valor Total:</strong> 
                <span className="summary-value" style={{ color: '#DC3545' }}>
                  {formatCurrency(valorFatura || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Data do Pagamento */}
          <div>
            <label className="form-label">
              <Calendar size={14} />
              Data do Pagamento *
            </label>
            <input
              type="date"
              value={dataPagamento}
              onChange={(e) => setDataPagamento(e.target.value)}
              disabled={loading}
              className="input-base"
            />
            <p className="form-hint">Data em que o pagamento está sendo realizado</p>
          </div>

          {/* Tipo de Pagamento */}
          <div>
            <label className="form-label">
              <Calculator size={14} />
              Tipo de Pagamento *
            </label>
            <div className="radio-group">
              <label className="radio-item">
                <input
                  type="radio"
                  value="integral"
                  checked={tipoPagamento === 'integral'}
                  onChange={(e) => setTipoPagamento(e.target.value)}
                  disabled={loading}
                />
                <span>Pagamento Integral - {formatCurrency(valorFatura || 0)}</span>
              </label>
              
              <label className="radio-item">
                <input
                  type="radio"
                  value="parcial"
                  checked={tipoPagamento === 'parcial'}
                  onChange={(e) => setTipoPagamento(e.target.value)}
                  disabled={loading}
                />
                <span>Pagamento Parcial</span>
              </label>
              
              <label className="radio-item">
                <input
                  type="radio"
                  value="parcelado"
                  checked={tipoPagamento === 'parcelado'}
                  onChange={(e) => setTipoPagamento(e.target.value)}
                  disabled={loading}
                />
                <span>Pagamento Parcelado</span>
              </label>
            </div>
          </div>

          {/* Configurações de Pagamento Parcial */}
          {tipoPagamento === 'parcial' && (
            <div>
              <label className="form-label">
                <DollarSign size={14} />
                Valor a Pagar *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={valorFatura || 0}
                value={valorPagar}
                onChange={(e) => setValorPagar(parseFloat(e.target.value) || 0)}
                disabled={loading}
                className="input-base"
                placeholder="Digite o valor que deseja pagar"
              />
              
              {valorPagar > 0 && valorPagar < (valorFatura || 0) && (
                <div className="summary-panel warning">
                  <div className="confirmation-item">
                    <AlertTriangle size={16} style={{ color: '#F59E0B', marginRight: '8px' }} />
                    <div>
                      <strong>⚠️ Atenção: Juros de cartão de crédito podem ser devastadores. O ideal é pagar o total.</strong>
                      <p style={{ marginTop: '4px', fontSize: '14px' }}>
                        Saldo restante: {formatCurrency((valorFatura || 0) - valorPagar)} será transferido para a fatura selecionada.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="form-label">
                  <Calendar size={14} />
                  Fatura de Destino para o Saldo Restante *
                </label>
                <div className="select-search">
                  <select
                    value={faturaDestinoRestante}
                    onChange={(e) => setFaturaDestinoRestante(e.target.value)}
                    disabled={loading || opcoesFaturaRestante.length === 0}
                    className="input-base"
                  >
                    <option value="">Selecione a fatura de destino</option>
                    {opcoesFaturaRestante.map(opcao => (
                      <option key={opcao.valor_opcao} value={opcao.valor_opcao}>
                        {opcao.label_opcao}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="form-hint">
                  O saldo de {formatCurrency((valorFatura || 0) - valorPagar)} será adicionado à fatura selecionada
                </p>
              </div>
            </div>
          )}

          {/* Configurações de Pagamento Parcelado */}
          {tipoPagamento === 'parcelado' && (
            <>
              <div>
                <label className="form-label">
                  <Calculator size={14} />
                  Número de Parcelas *
                </label>
                <input
                  type="number"
                  min="2"
                  max="60"
                  value={numeroParcelas}
                  onChange={(e) => setNumeroParcelas(parseInt(e.target.value) || 2)}
                  disabled={loading}
                  className="input-base"
                />
              </div>

              <div>
                <label className="form-label">
                  <DollarSign size={14} />
                  Valor de Cada Parcela (informado pelo banco) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={valorParcela}
                  onChange={(e) => setValorParcela(parseFloat(e.target.value) || 0)}
                  disabled={loading}
                  className="input-base"
                  placeholder="Ex: 2.610,40"
                />
                <p className="form-hint">Digite o valor exato oferecido pelo banco para cada parcela</p>
              </div>

              {/* Análise de Impacto Financeiro */}
              {valorParcela > 0 && numeroParcelas > 0 && (
                <div className="summary-panel warning">
                  <h4 style={{ color: '#DC2626', marginBottom: '12px', fontSize: '16px' }}>
                    📊 Análise de Impacto Financeiro
                  </h4>
                  <div className="confirmation-info">
                    <div className="confirmation-item">
                      <strong>Sua fatura original:</strong> {formatCurrency(valorFatura || 0)} (pagamento à vista)
                    </div>
                    <div className="confirmation-item">
                      <strong>Parcelamento escolhido:</strong> {numeroParcelas}x de {formatCurrency(valorParcela)}
                    </div>
                    <div className="confirmation-item">
                      <strong>Valor total a pagar:</strong> 
                      <span style={{ color: '#DC2626', fontWeight: 'bold', marginLeft: '8px' }}>
                        {formatCurrency(valorTotalParcelado)}
                      </span>
                    </div>
                    <div className="confirmation-item">
                      <strong>Prejuízo total:</strong> 
                      <span style={{ color: '#DC2626', fontWeight: 'bold', marginLeft: '8px' }}>
                        {formatCurrency(prejuizoParcelamento)} ({percentualPrejuizo.toFixed(1)}% a mais)
                      </span>
                    </div>
                  </div>
                  
                  {prejuizoParcelamento > 0 && (
                    <div style={{ 
                      marginTop: '12px', 
                      padding: '12px', 
                      backgroundColor: '#FEF2F2', 
                      borderRadius: '8px',
                      border: '1px solid #FECACA' 
                    }}>
                      <AlertTriangle size={16} style={{ color: '#DC2626', marginBottom: '8px' }} />
                      <p style={{ fontSize: '14px', color: '#DC2626', fontWeight: '600', marginBottom: '4px' }}>
                        ⚠️ ATENÇÃO: Você pagará {formatCurrency(prejuizoParcelamento)} a mais!
                      </p>
                      <p style={{ fontSize: '13px', color: '#991B1B' }}>
                        Parcelar a fatura pode levar a um ciclo de dívidas. Se possível, quite o valor à vista de {formatCurrency(valorFatura || 0)}.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="form-label">
                  <Calendar size={14} />
                  Fatura Inicial para as Parcelas *
                </label>
                <div className="select-search">
                  <select
                    value={faturaInicialVencimento}
                    onChange={(e) => setFaturaInicialVencimento(e.target.value)}
                    disabled={loading || opcoesFatura.length === 0}
                    className="input-base"
                  >
                    <option value="">Selecione a fatura inicial</option>
                    {opcoesFatura.map(opcao => (
                      <option key={opcao.valor_opcao} value={opcao.valor_opcao}>
                        {opcao.label_opcao} {opcao.is_default ? '(Padrão)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="summary-panel warning">
                <div className="confirmation-item">
                  <AlertTriangle size={16} style={{ color: '#F59E0B', marginRight: '8px' }} />
                  <div>
                    <strong>⚠️ Confirme os dados do parcelamento antes de prosseguir.</strong>
                    <p style={{ marginTop: '4px', fontSize: '14px' }}>
                      As {numeroParcelas} parcelas de {formatCurrency(valorParcela)} serão criadas como novas despesas no cartão.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

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
                disabled={loading}
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
            
            {contaEscolhida && tipoPagamento !== 'parcelado' && (
              <div className="confirmation-info-box">
                <AlertCircle size={16} />
                <div>
                  <p><strong>Saldo após pagamento:</strong> {formatCurrency(contaEscolhida.saldo - valorPagarFinal)}</p>
                  {(contaEscolhida.saldo - valorPagarFinal) < 0 && (
                    <p style={{ color: '#DC2626', fontWeight: 600, marginTop: '4px' }}>
                      ⚠️ Atenção: Saldo ficará negativo
                    </p>
                  )}
                </div>
              </div>
            )}

            {contaEscolhida && tipoPagamento === 'parcelado' && (
              <div className="confirmation-info-box">
                <AlertCircle size={16} />
                <div>
                  <p><strong>Informação:</strong> O parcelamento será criado como novas despesas no cartão.</p>
                  <p style={{ fontSize: '14px', marginTop: '4px' }}>
                    A conta selecionada será utilizada apenas para referência do pagamento da fatura atual.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Resumo do Pagamento */}
          {(tipoPagamento === 'parcial' || tipoPagamento === 'parcelado') && (
            <div className="summary-panel">
              <h3 className="summary-title">Resumo do Pagamento</h3>
              <div className="confirmation-info">
                {tipoPagamento === 'parcial' && (
                  <>
                    <div className="confirmation-item">
                      <strong>Data do pagamento:</strong> {new Date(dataPagamento).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="confirmation-item">
                      <strong>Valor a pagar agora:</strong> {formatCurrency(valorPagar)}
                    </div>
                    <div className="confirmation-item">
                      <strong>Saldo restante:</strong> 
                      <span style={{ color: '#DC3545' }}>
                        {formatCurrency((valorFatura || 0) - valorPagar)}
                      </span>
                    </div>
                    <div className="confirmation-item">
                      <strong>Fatura de destino:</strong> {faturaDestinoRestante ? 
                        new Date(faturaDestinoRestante).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }) : 
                        'Não selecionada'
                      }
                    </div>
                    <div className="confirmation-item" style={{ fontSize: '14px', color: '#666' }}>
                      O saldo restante será automaticamente transferido para a fatura selecionada.
                    </div>
                  </>
                )}
                
                {tipoPagamento === 'parcelado' && (
                  <>
                    <div className="confirmation-item">
                      <strong>Data do pagamento:</strong> {new Date(dataPagamento).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="confirmation-item">
                      <strong>Valor total:</strong> {formatCurrency(valorFatura || 0)}
                    </div>
                    <div className="confirmation-item">
                      <strong>Parcelas:</strong> {numeroParcelas}x de {formatCurrency(valorParcela)}
                    </div>
                    <div className="confirmation-item">
                      <strong>Total a pagar:</strong> 
                      <span style={{ color: '#DC3545' }}>
                        {formatCurrency(valorTotalParcelado)}
                      </span>
                    </div>
                    <div className="confirmation-item">
                      <strong>Prejuízo:</strong> 
                      <span style={{ color: '#DC3545', fontWeight: 'bold' }}>
                        {formatCurrency(prejuizoParcelamento)} (+{percentualPrejuizo.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="confirmation-item">
                      <strong>Primeira parcela:</strong> {faturaInicialVencimento ? 
                        new Date(faturaInicialVencimento).toLocaleDateString('pt-BR') : 
                        'Não selecionada'
                      }
                    </div>
                    <div className="confirmation-item" style={{ fontSize: '14px', color: '#666' }}>
                      As parcelas serão criadas como novas despesas no cartão.
                    </div>
                  </>
                )}

                {tipoPagamento === 'integral' && (
                  <>
                    <div className="confirmation-item">
                      <strong>Data do pagamento:</strong> {new Date(dataPagamento).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="confirmation-item">
                      <strong>Valor total:</strong> {formatCurrency(valorFatura || 0)}
                    </div>
                    <div className="confirmation-item" style={{ fontSize: '14px', color: '#666' }}>
                      Todas as transações da fatura serão marcadas como efetivadas.
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Erro crítico se faturaVencimento não foi fornecido */}
          {!faturaVencimento && (
            <div className="summary-panel danger">
              <div className="confirmation-item">
                <AlertCircle size={16} style={{ color: '#DC3545', marginRight: '8px' }} />
                <strong>Erro:</strong> Data de vencimento da fatura não encontrada. 
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
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            className="btn-primary"
            onClick={handleConfirmar}
            disabled={
              loading || 
              !contaSelecionada || 
              !faturaVencimento ||
              !dataPagamento ||
              (tipoPagamento === 'parcial' && (valorPagar <= 0 || valorPagar >= (valorFatura || 0) || !faturaDestinoRestante)) ||
              (tipoPagamento === 'parcelado' && (!faturaInicialVencimento || numeroParcelas < 2 || valorParcela <= 0))
            }
          >
            {loading ? (
              <>
                <div className="btn-spinner"></div>
                {tipoPagamento === 'integral' && 'Pagando...'}
                {tipoPagamento === 'parcial' && 'Processando Pagamento Parcial...'}
                {tipoPagamento === 'parcelado' && 'Criando Parcelamento...'}
              </>
            ) : (
              <>
                <Check size={16} />
                {tipoPagamento === 'integral' && 'Confirmar Pagamento'}
                {tipoPagamento === 'parcial' && 'Confirmar Pagamento Parcial'}
                {tipoPagamento === 'parcelado' && 'Confirmar Parcelamento'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalPagamentoFatura;
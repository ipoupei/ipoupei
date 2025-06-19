// src/modules/cartoes/components/ModalEstornoCartao.jsx
import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle, Check, Calendar } from 'lucide-react';
import { formatCurrency } from '../../../shared/utils/formatCurrency';
import useFaturaOperations from '../hooks/useFaturaOperations';

const ModalEstornoCartao = ({ 
  isOpen, 
  onClose, 
  cartao,
  onSuccess 
}) => {
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [faturaEscolhida, setFaturaEscolhida] = useState('');
  const [faturasAbertas, setFaturasAbertas] = useState([]);
  
  const { lancarEstorno, buscarFaturasAbertas, isLoading, error, setError } = useFaturaOperations();

  useEffect(() => {
    if (isOpen && cartao) {
      carregarFaturasAbertas();
      setValor('');
      setDescricao('');
      setFaturaEscolhida('');
      setError(null);
    }
  }, [isOpen, cartao, setError]);

  const carregarFaturasAbertas = async () => {
    const faturas = await buscarFaturasAbertas(cartao.id);
    setFaturasAbertas(faturas);
    
    // Se houver apenas uma fatura aberta, selecionar automaticamente
    if (faturas.length === 1) {
      setFaturaEscolhida(`${faturas[0].ano}-${faturas[0].mes}`);
    }
  };

  const handleValorChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value) {
      value = (parseInt(value) / 100).toFixed(2);
      setValor(value);
    } else {
      setValor('');
    }
  };

  const handleConfirmar = async () => {
    const valorNumerico = parseFloat(valor);
    
    // Validações
    if (!valorNumerico || valorNumerico <= 0) {
      setError('Informe um valor válido para o estorno');
      return;
    }

    if (!descricao.trim()) {
      setError('Informe uma descrição para o estorno');
      return;
    }

    if (!faturaEscolhida) {
      setError('Selecione a fatura de destino');
      return;
    }

    // Preparar data da fatura
    const [ano, mes] = faturaEscolhida.split('-').map(Number);
    const dataFatura = new Date(ano, mes - 1, 15); // Dia 15 do mês escolhido

    const resultado = await lancarEstorno(
      cartao.id,
      valorNumerico,
      descricao.trim(),
      dataFatura.toISOString()
    );

    if (resultado.success) {
      onSuccess && onSuccess();
      onClose();
    }
  };

  const faturaInfo = faturaEscolhida ? 
    faturasAbertas.find(f => `${f.ano}-${f.mes}` === faturaEscolhida) : null;

  const valorFormatado = valor ? formatCurrency(parseFloat(valor)) : 'R$ 0,00';

  if (!isOpen) return null;

  return (
    <div className="modal-overlay active">
      <div className="forms-modal-container">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <div className="modal-icon-container modal-icon-success">
              <RefreshCw />
            </div>
            <div>
              <h2 className="modal-title">Lançar Estorno</h2>
              <p className="modal-subtitle">Adicione um crédito na fatura do cartão</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Informações do Cartão */}
          <div className="summary-panel">
            <h3 className="summary-title">Cartão Selecionado</h3>
            <div className="confirmation-info">
              <div className="confirmation-item" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div 
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: cartao?.cor || '#6B7280'
                  }}
                ></div>
                <span><strong>{cartao?.nome}</strong></span>
                <span style={{ color: '#666' }}>•</span>
                <span style={{ color: '#666' }}>{cartao?.bandeira}</span>
              </div>
            </div>
          </div>

          {/* Valor do Estorno */}
          <div>
            <label className="form-label">
              <RefreshCw size={14} />
              Valor do Estorno *
            </label>
            <input
              type="text"
              value={valorFormatado}
              onChange={handleValorChange}
              placeholder="R$ 0,00"
              disabled={isLoading}
              className="input-money input-money-highlight"
              style={{ textAlign: 'center' }}
            />
            <div className="form-label-small">
              Informe o valor que será creditado na fatura
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="form-label">
              Descrição *
            </label>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Cashback compra loja X, Reembolso produto defeituoso..."
              disabled={isLoading}
              maxLength={100}
              className="input-text"
            />
            <div className="char-counter">
              <span className="form-label-small">Máximo 100 caracteres</span>
              <span className={descricao.length > 90 ? 'char-counter-warning' : ''}>
                {descricao.length}/100
              </span>
            </div>
          </div>

          {/* Seleção de Fatura */}
          <div>
            <label className="form-label">
              <Calendar size={14} />
              Fatura de Destino *
            </label>
            
            {faturasAbertas.length === 0 ? (
              <div className="summary-panel danger">
                <div className="confirmation-item">
                  <AlertCircle size={16} style={{ color: '#DC3545', marginRight: '8px' }} />
                  <div>
                    <strong>Nenhuma fatura aberta encontrada</strong>
                    <div className="form-label-small" style={{ color: '#DC2626' }}>
                      Estornos só podem ser lançados em faturas que ainda não foram pagas
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="select-search">
                  <select
                    value={faturaEscolhida}
                    onChange={(e) => setFaturaEscolhida(e.target.value)}
                    disabled={isLoading}
                    className="input-base"
                  >
                    <option value="">Selecione a fatura</option>
                    {faturasAbertas.map(fatura => (
                      <option key={`${fatura.ano}-${fatura.mes}`} value={`${fatura.ano}-${fatura.mes}`}>
                        {fatura.mesNome} {fatura.ano} (Fatura Aberta)
                      </option>
                    ))}
                  </select>
                </div>
                
                {faturaInfo && (
                  <div className="confirmation-info-box">
                    <Calendar size={16} />
                    <div>
                      <p><strong>Fatura: {faturaInfo.mesNome} {faturaInfo.ano}</strong></p>
                      <p>O estorno será lançado nesta fatura em aberto</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Informação Importante */}
          <div className="confirmation-info-box">
            <AlertCircle size={16} />
            <div>
              <h4 style={{ margin: '0 0 8px 0', fontWeight: 600, color: '#1E40AF' }}>Como funciona o estorno:</h4>
              <div style={{ fontSize: '14px', color: '#1E40AF', lineHeight: '1.5' }}>
                <p style={{ margin: '0 0 4px 0' }}>• O valor será creditado na fatura selecionada</p>
                <p style={{ margin: '0 0 4px 0' }}>• Aparecerá como uma transação positiva (reduz o valor da fatura)</p>
                <p style={{ margin: '0 0 4px 0' }}>• Só é possível lançar em faturas ainda não pagas</p>
                <p style={{ margin: '0' }}>• O estorno ficará visível na lista de transações do cartão</p>
              </div>
            </div>
          </div>

          {/* Preview do Estorno */}
          {valor && parseFloat(valor) > 0 && descricao && faturaInfo && (
            <div className="summary-panel-purple">
              <h4 className="summary-title">Preview do Estorno:</h4>
              <div className="confirmation-info">
                <div className="confirmation-item">
                  <strong>Valor:</strong> 
                  <span style={{ color: '#22C55E', fontWeight: 600 }}>+ {valorFormatado}</span>
                </div>
                <div className="confirmation-item">
                  <strong>Descrição:</strong> {descricao}
                </div>
                <div className="confirmation-item">
                  <strong>Fatura:</strong> {faturaInfo.mesNome} {faturaInfo.ano}
                </div>
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
              !valor || 
              parseFloat(valor || '0') <= 0 || 
              !descricao.trim() || 
              !faturaEscolhida ||
              faturasAbertas.length === 0
            }
          >
            {isLoading ? (
              <>
                <div className="btn-spinner"></div>
                Lançando...
              </>
            ) : (
              <>
                <Check size={16} />
                Lançar Estorno
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalEstornoCartao;
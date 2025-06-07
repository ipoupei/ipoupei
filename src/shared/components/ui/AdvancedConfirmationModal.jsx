// src/shared/components/ui/AdvancedConfirmationModal.jsx - VERSÃO REFEITA DO ZERO
import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { 
  X, 
  AlertTriangle, 
  Archive, 
  Trash2, 
  ArchiveRestore,
  Clock,
  CheckCircle,
  Info
} from 'lucide-react';

/**
 * Modal de confirmação avançado para ações críticas
 * Versão simplificada e focada nas funcionalidades essenciais
 */
const AdvancedConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  type = 'delete',
  title,
  message,
  item = {},
  confirmText = '',
  requiresTyping = false,
  requiresWait = false,
  waitTime = 5,
  impacts = [],
  alternatives = [],
  disabled = false,
  children
}) => {
  const [confirmationText, setConfirmationText] = useState('');
  const [waitRemaining, setWaitRemaining] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Configurações por tipo
  const configs = {
    delete: {
      icon: Trash2,
      color: '#ef4444',
      bgColor: '#fef2f2',
      borderColor: '#fecaca',
      defaultTitle: 'Excluir Permanentemente',
      defaultMessage: 'Esta ação não pode ser desfeita',
      defaultConfirmText: 'EXCLUIR PERMANENTEMENTE'
    },
    archive: {
      icon: Archive,
      color: '#f59e0b',
      bgColor: '#fef3c7',
      borderColor: '#fcd34d',
      defaultTitle: 'Arquivar Item',
      defaultMessage: 'O item será ocultado mas mantido no histórico',
      defaultConfirmText: 'ARQUIVAR'
    },
    unarchive: {
      icon: ArchiveRestore,
      color: '#10b981',
      bgColor: '#ecfdf5',
      borderColor: '#bbf7d0',
      defaultTitle: 'Desarquivar Item',
      defaultMessage: 'O item voltará a ficar visível',
      defaultConfirmText: 'DESARQUIVAR'
    }
  };

  const config = configs[type] || configs.delete;
  const IconComponent = config.icon;
  const finalTitle = title || config.defaultTitle;
  const finalMessage = message || config.defaultMessage;
  const finalConfirmText = confirmText || config.defaultConfirmText;

  // Timer de espera
  useEffect(() => {
    if (isOpen && requiresWait && waitTime > 0) {
      setWaitRemaining(waitTime);
      const interval = setInterval(() => {
        setWaitRemaining(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isOpen, requiresWait, waitTime]);

  // Reset ao abrir/fechar
  useEffect(() => {
    if (isOpen) {
      setConfirmationText('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // ESC para fechar
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, isSubmitting, onClose]);

  // Verificar se pode confirmar
  const canConfirm = useCallback(() => {
    if (disabled || isSubmitting) return false;
    if (requiresWait && waitRemaining > 0) return false;
    if (requiresTyping && confirmationText !== finalConfirmText) return false;
    return true;
  }, [disabled, isSubmitting, requiresWait, waitRemaining, requiresTyping, confirmationText, finalConfirmText]);

  // Confirmar ação
  const handleConfirm = useCallback(async () => {
    if (!canConfirm()) return;

    setIsSubmitting(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error('Erro na confirmação:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [canConfirm, onConfirm]);

  // Formatar moeda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-container" style={{ maxWidth: '500px' }}>
        {/* Header */}
        <div 
          className="modal-header" 
          style={{ 
            background: `linear-gradient(135deg, ${config.bgColor} 0%, rgba(255,255,255,0.5) 100%)`,
            borderBottom: `1px solid ${config.borderColor}` 
          }}
        >
          <h2 className="modal-title">
            <div 
              className="form-icon-wrapper" 
              style={{
                background: config.color,
                color: 'white'
              }}
            >
              <IconComponent size={18} />
            </div>
            <div>
              <div className="form-title-main">{finalTitle}</div>
              {item.nome && (
                <div className="form-title-subtitle">{item.nome}</div>
              )}
            </div>
          </h2>
          <button 
            className="modal-close" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="modal-content" style={{ padding: '24px' }}>
          {/* Mensagem principal */}
          <div 
            style={{
              background: config.bgColor,
              border: `1px solid ${config.borderColor}`,
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}
          >
            <IconComponent size={20} style={{ color: config.color, marginTop: '2px', flexShrink: 0 }} />
            <div>
              <div style={{ 
                fontWeight: '600', 
                marginBottom: '4px',
                color: type === 'delete' ? '#b91c1c' : 
                       type === 'archive' ? '#92400e' : '#065f46'
              }}>
                {type === 'delete' && '⚠️ Ação Irreversível'}
                {type === 'archive' && '📁 Arquivar Item'}
                {type === 'unarchive' && '📂 Restaurar Item'}
              </div>
              <div style={{ 
                fontSize: '0.9rem', 
                color: type === 'delete' ? '#991b1b' : 
                       type === 'archive' ? '#a16207' : '#047857'
              }}>
                {finalMessage}
              </div>
            </div>
          </div>

          {/* Conteúdo customizado */}
          {children}

          {/* Detalhes do item */}
          {item && Object.keys(item).length > 0 && (
            <div style={{
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <h4 style={{ 
                margin: '0 0 12px 0', 
                fontSize: '0.9rem', 
                fontWeight: '600',
                color: '#374151'
              }}>
                Detalhes:
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem' }}>
                {item.nome && (
                  <>
                    <span style={{ color: '#6b7280' }}>Nome:</span>
                    <span style={{ fontWeight: '500' }}>{item.nome}</span>
                  </>
                )}
                {item.tipo && (
                  <>
                    <span style={{ color: '#6b7280' }}>Tipo:</span>
                    <span style={{ fontWeight: '500' }}>{item.tipo}</span>
                  </>
                )}
                {item.saldo !== undefined && (
                  <>
                    <span style={{ color: '#6b7280' }}>Saldo:</span>
                    <span style={{ 
                      fontWeight: '600',
                      color: item.saldo >= 0 ? '#10b981' : '#ef4444'
                    }}>
                      {formatCurrency(item.saldo)}
                    </span>
                  </>
                )}
                {item.banco && (
                  <>
                    <span style={{ color: '#6b7280' }}>Banco:</span>
                    <span style={{ fontWeight: '500' }}>{item.banco}</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Impactos */}
          {impacts.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ 
                margin: '0 0 12px 0', 
                fontSize: '0.9rem', 
                fontWeight: '600',
                color: '#374151',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Info size={16} />
                Consequências:
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {impacts.map((impact, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    background: '#f9fafb',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb',
                    fontSize: '0.85rem'
                  }}>
                    <span>{impact.icone || '•'}</span>
                    <span style={{ color: '#6b7280' }}>{impact.descricao}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alternativas */}
          {alternatives.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ 
                margin: '0 0 12px 0', 
                fontSize: '0.9rem', 
                fontWeight: '600',
                color: '#374151'
              }}>
                Alternativas:
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {alternatives.map((alt, index) => (
                  <button
                    key={index}
                    onClick={alt.onClick}
                    disabled={isSubmitting}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ fontSize: '1.2rem', minWidth: '24px', textAlign: 'center' }}>
                      {alt.icone}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', color: '#374151', marginBottom: '2px', fontSize: '0.9rem' }}>
                        {alt.titulo}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                        {alt.descricao}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Campo de confirmação por texto */}
          {requiresTyping && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Para confirmar, digite: <strong>{finalConfirmText}</strong>
              </label>
              <input
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder={finalConfirmText}
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `2px solid ${confirmationText === finalConfirmText ? '#10b981' : '#d1d5db'}`,
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontFamily: 'monospace',
                  textAlign: 'center',
                  fontWeight: '600'
                }}
              />
              {confirmationText && confirmationText !== finalConfirmText && (
                <div style={{ 
                  fontSize: '0.8rem', 
                  color: '#ef4444', 
                  marginTop: '4px',
                  textAlign: 'center'
                }}>
                  Texto incorreto. Digite exatamente como mostrado acima.
                </div>
              )}
            </div>
          )}

          {/* Timer de espera */}
          {requiresWait && waitRemaining > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              background: '#fef3c7',
              border: '1px solid #fcd34d',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <Clock size={16} style={{ color: '#f59e0b' }} />
              <span style={{ fontSize: '0.9rem', color: '#92400e' }}>
                Aguarde {waitRemaining} segundo{waitRemaining !== 1 ? 's' : ''} para continuar...
              </span>
            </div>
          )}

          {/* Alertas específicos por tipo */}
          {type === 'delete' && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '20px',
              fontSize: '0.85rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <AlertTriangle size={16} style={{ color: '#ef4444' }} />
                <span style={{ fontWeight: '600', color: '#b91c1c' }}>Lembre-se:</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#991b1b' }}>
                <li>Esta ação não pode ser desfeita</li>
                <li>Todos os dados serão perdidos permanentemente</li>
                <li>Considere fazer backup antes de prosseguir</li>
              </ul>
            </div>
          )}

          {type === 'archive' && (
            <div style={{
              background: '#fef3c7',
              border: '1px solid #fcd34d',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '20px',
              fontSize: '0.85rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Info size={16} style={{ color: '#f59e0b' }} />
                <span style={{ fontWeight: '600', color: '#92400e' }}>O que acontece ao arquivar:</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#a16207' }}>
                <li>O item será ocultado do dashboard principal</li>
                <li>O histórico será mantido para relatórios</li>
                <li>Você pode desarquivar a qualquer momento</li>
              </ul>
            </div>
          )}

          {type === 'unarchive' && (
            <div style={{
              background: '#ecfdf5',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '20px',
              fontSize: '0.85rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <CheckCircle size={16} style={{ color: '#10b981' }} />
                <span style={{ fontWeight: '600', color: '#065f46' }}>O que acontece ao desarquivar:</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#047857' }}>
                <li>O item voltará a aparecer no dashboard</li>
                <li>Ficará disponível para novas operações</li>
                <li>O histórico continuará preservado</li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px 24px',
          borderTop: '1px solid #e5e7eb',
          background: '#f9fafb',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              padding: '10px 20px',
              background: 'white',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: '500',
              color: '#374151',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.6 : 1
            }}
          >
            Cancelar
          </button>

          <button
            onClick={handleConfirm}
            disabled={!canConfirm()}
            style={{
              padding: '10px 20px',
              background: canConfirm() ? config.color : '#9ca3af',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: '600',
              color: 'white',
              cursor: canConfirm() ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: canConfirm() ? 1 : 0.6
            }}
          >
            {isSubmitting ? (
              <>
                <div style={{
                  width: '14px',
                  height: '14px',
                  border: '2px solid transparent',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                {type === 'delete' && 'Excluindo...'}
                {type === 'archive' && 'Arquivando...'}
                {type === 'unarchive' && 'Desarquivando...'}
              </>
            ) : requiresWait && waitRemaining > 0 ? (
              <>
                <Clock size={14} />
                Aguardar ({waitRemaining}s)
              </>
            ) : (
              <>
                <IconComponent size={14} />
                {type === 'delete' && 'Excluir Permanentemente'}
                {type === 'archive' && 'Arquivar'}
                {type === 'unarchive' && 'Desarquivar'}
              </>
            )}
          </button>
        </div>

        {/* CSS inline para animação */}
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

AdvancedConfirmationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  type: PropTypes.oneOf(['delete', 'archive', 'unarchive']),
  title: PropTypes.string,
  message: PropTypes.string,
  item: PropTypes.object,
  confirmText: PropTypes.string,
  requiresTyping: PropTypes.bool,
  requiresWait: PropTypes.bool,
  waitTime: PropTypes.number,
  impacts: PropTypes.arrayOf(PropTypes.shape({
    icone: PropTypes.string,
    descricao: PropTypes.string
  })),
  alternatives: PropTypes.arrayOf(PropTypes.shape({
    icone: PropTypes.string,
    titulo: PropTypes.string,
    descricao: PropTypes.string,
    onClick: PropTypes.func
  })),
  disabled: PropTypes.bool,
  children: PropTypes.node
};

export default React.memo(AdvancedConfirmationModal);
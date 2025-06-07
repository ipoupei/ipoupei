// src/modules/contas/components/ContasArquivadasModal.jsx - Modal dedicado para contas arquivadas
import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { 
  Archive,
  ArchiveRestore,
  Trash2,
  X, 
  AlertTriangle,
  Building,
  Search,
  Calendar,
  Filter
} from 'lucide-react';

import { useAuthStore } from '@modules/auth/store/authStore';
import { useUIStore } from '@store/uiStore';
import { formatCurrency } from '@utils/formatCurrency';
import useContas from '@modules/contas/hooks/useContas';
import '@shared/styles/FormsModal.css';

/**
 * Modal dedicado para visualizar e gerenciar contas arquivadas
 * ✅ Funcionalidades:
 * - Listar todas as contas arquivadas
 * - Desarquivar contas individualmente
 * - Excluir contas arquivadas (com validação)
 * - Filtrar por nome, tipo ou data de arquivamento
 * - Estatísticas das contas arquivadas
 */
const ContasArquivadasModal = ({ isOpen, onClose, onUpdate }) => {
  const { user } = useAuthStore();
  const { showNotification } = useUIStore();
  
  const {
    contasArquivadas,
    loading,
    desarquivarConta,
    excluirConta,
    fetchContasArquivadas
  } = useContas();

  // Estados locais
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Modais de confirmação
  const [modalDesarquivar, setModalDesarquivar] = useState({ show: false, conta: null });
  const [modalExcluir, setModalExcluir] = useState({ show: false, conta: null, confirmacao: '' });

  // Tipos de conta para filtro
  const tiposConta = [
    { value: '', label: 'Todos os tipos' },
    { value: 'corrente', label: 'Conta Corrente', icon: '🏦' },
    { value: 'poupanca', label: 'Poupança', icon: '🐷' },
    { value: 'investimento', label: 'Investimentos', icon: '📈' },
    { value: 'carteira', label: 'Carteira', icon: '👛' }
  ];

  // Carregar contas arquivadas quando modal abre
  useEffect(() => {
    if (isOpen && user) {
      fetchContasArquivadas();
    }
  }, [isOpen, user, fetchContasArquivadas]);

  // Filtrar contas
  const contasFiltradas = React.useMemo(() => {
    return contasArquivadas.filter(conta => {
      const matchTexto = !filtroTexto || 
        conta.nome.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        (conta.banco && conta.banco.toLowerCase().includes(filtroTexto.toLowerCase()));
      
      const matchTipo = !filtroTipo || conta.tipo === filtroTipo;
      
      return matchTexto && matchTipo;
    });
  }, [contasArquivadas, filtroTexto, filtroTipo]);

  // Estatísticas
  const estatisticas = React.useMemo(() => {
    return {
      total: contasArquivadas.length,
      saldoTotal: contasArquivadas.reduce((sum, conta) => sum + (conta.saldo || 0), 0),
      positivas: contasArquivadas.filter(conta => (conta.saldo || 0) > 0).length,
      negativas: contasArquivadas.filter(conta => (conta.saldo || 0) < 0).length,
      porTipo: tiposConta.slice(1).map(tipo => ({
        tipo: tipo.value,
        label: tipo.label,
        icon: tipo.icon,
        quantidade: contasArquivadas.filter(conta => conta.tipo === tipo.value).length
      })).filter(item => item.quantidade > 0)
    };
  }, [contasArquivadas, tiposConta]);

  // Confirmar desarquivamento
  const confirmarDesarquivamento = useCallback(async () => {
    if (!modalDesarquivar.conta) return;
    
    setSubmitting(true);
    try {
      const resultado = await desarquivarConta(modalDesarquivar.conta.id);
      
      if (resultado.success) {
        setModalDesarquivar({ show: false, conta: null });
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error('Erro ao desarquivar:', error);
    } finally {
      setSubmitting(false);
    }
  }, [modalDesarquivar.conta, desarquivarConta, onUpdate]);

  // Confirmar exclusão
  const confirmarExclusao = useCallback(async () => {
    if (!modalExcluir.conta) return;
    
    if (modalExcluir.confirmacao !== 'EXCLUIR PERMANENTEMENTE') {
      showNotification('Digite exatamente "EXCLUIR PERMANENTEMENTE" para confirmar', 'error');
      return;
    }
    
    setSubmitting(true);
    try {
      const resultado = await excluirConta(modalExcluir.conta.id, true);
      
      if (resultado.success) {
        setModalExcluir({ show: false, conta: null, confirmacao: '' });
        if (onUpdate) onUpdate();
      } else if (resultado.error === 'POSSUI_TRANSACOES') {
        showNotification(resultado.message, 'warning');
        setModalExcluir({ show: false, conta: null, confirmacao: '' });
      }
    } catch (error) {
      console.error('Erro ao excluir:', error);
    } finally {
      setSubmitting(false);
    }
  }, [modalExcluir, excluirConta, onUpdate, showNotification]);

  // Iniciar desarquivamento
  const iniciarDesarquivamento = useCallback((conta) => {
    setModalDesarquivar({ show: true, conta });
  }, []);

  // Iniciar exclusão
  const iniciarExclusao = useCallback(async (conta) => {
    // Primeiro, verificar se há transações
    const resultado = await excluirConta(conta.id, false);
    
    if (resultado.error === 'POSSUI_TRANSACOES') {
      showNotification(resultado.message, 'warning');
      return;
    }
    
    // Se não há transações, mostrar modal de confirmação
    setModalExcluir({ show: true, conta, confirmacao: '' });
  }, [excluirConta, showNotification]);

  // Limpar filtros
  const limparFiltros = useCallback(() => {
    setFiltroTexto('');
    setFiltroTipo('');
  }, []);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container" style={{ maxWidth: '800px', maxHeight: '90vh' }}>
        {/* Header */}
        <div className="modal-header" style={{ 
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(245, 158, 11, 0.02) 100%)',
          borderBottom: '1px solid rgba(245, 158, 11, 0.1)' 
        }}>
          <h2 className="modal-title">
            <div className="form-icon-wrapper" style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: 'white'
            }}>
              <Archive size={18} />
            </div>
            <div>
              <div className="form-title-main">Contas Arquivadas</div>
              <div className="form-title-subtitle">
                {estatisticas.total} conta{estatisticas.total !== 1 ? 's' : ''} arquivada{estatisticas.total !== 1 ? 's' : ''} • 
                Saldo total: {formatCurrency(estatisticas.saldoTotal)}
              </div>
            </div>
          </h2>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="modal-content" style={{ padding: '20px', overflow: 'auto' }}>
          {loading ? (
            <div className="form-loading">
              <div className="form-loading-spinner" style={{ borderTopColor: '#f59e0b' }}></div>
              <p>Carregando contas arquivadas...</p>
            </div>
          ) : (
            <>
              {/* Estatísticas */}
              {estatisticas.total > 0 && (
                <div style={{ 
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(245, 158, 11, 0.02) 100%)',
                  border: '1px solid rgba(245, 158, 11, 0.15)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '24px'
                }}>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                    gap: '16px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '4px' }}>
                        Total Arquivadas
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f59e0b' }}>
                        {estatisticas.total}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '4px' }}>
                        Saldo Total
                      </div>
                      <div style={{ 
                        fontSize: '1.1rem', 
                        fontWeight: '700',
                        color: estatisticas.saldoTotal >= 0 ? '#10b981' : '#ef4444'
                      }}>
                        {formatCurrency(estatisticas.saldoTotal)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '4px' }}>
                        Saldos Positivos
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#10b981' }}>
                        {estatisticas.positivas}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '4px' }}>
                        Saldos Negativos
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#ef4444' }}>
                        {estatisticas.negativas}
                      </div>
                    </div>
                  </div>

                  {/* Distribuição por tipo */}
                  {estatisticas.porTipo.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '8px' }}>
                        Por tipo:
                      </div>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {estatisticas.porTipo.map(item => (
                          <div key={item.tipo} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 8px',
                            background: 'rgba(245, 158, 11, 0.1)',
                            borderRadius: '6px',
                            fontSize: '0.8rem'
                          }}>
                            <span>{item.icon}</span>
                            <span>{item.label}: {item.quantidade}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Filtros */}
              {estatisticas.total > 0 && (
                <div style={{ 
                  display: 'flex', 
                  gap: '12px', 
                  marginBottom: '20px',
                  padding: '12px',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  alignItems: 'center',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ position: 'relative', minWidth: '200px' }}>
                    <Search size={16} style={{ 
                      position: 'absolute', 
                      left: '12px', 
                      top: '50%', 
                      transform: 'translateY(-50%)',
                      color: '#6b7280'
                    }} />
                    <input
                      type="text"
                      value={filtroTexto}
                      onChange={(e) => setFiltroTexto(e.target.value)}
                      placeholder="Buscar por nome ou banco..."
                      style={{
                        paddingLeft: '40px',
                        padding: '8px 12px 8px 40px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        width: '100%'
                      }}
                    />
                  </div>
                  
                  <select
                    value={filtroTipo}
                    onChange={(e) => setFiltroTipo(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      minWidth: '160px'
                    }}
                  >
                    {tiposConta.map(tipo => (
                      <option key={tipo.value} value={tipo.value}>
                        {tipo.icon ? `${tipo.icon} ` : ''}{tipo.label}
                      </option>
                    ))}
                  </select>

                  {(filtroTexto || filtroTipo) && (
                    <button
                      onClick={limparFiltros}
                      style={{
                        padding: '8px 12px',
                        background: '#6b7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <X size={14} />
                      Limpar
                    </button>
                  )}

                  <div style={{ marginLeft: 'auto', fontSize: '0.875rem', color: '#6b7280' }}>
                    {contasFiltradas.length} de {estatisticas.total} conta{contasFiltradas.length !== 1 ? 's' : ''}
                  </div>
                </div>
              )}

              {/* Lista de Contas Arquivadas */}
              {contasFiltradas.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {contasFiltradas.map(conta => {
                    // Extrair data de arquivamento das observações (se disponível)
                    const dataArquivamento = conta.observacoes && conta.observacoes.includes('[Arquivada:') 
                      ? conta.observacoes.match(/\[Arquivada: ([^\]]+)\]/)?.[1] 
                      : null;

                    return (
                      <div
                        key={conta.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '16px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '12px',
                          borderLeft: `4px solid ${conta.cor}`,
                          background: '#f9fafb',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            backgroundColor: conta.cor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: '16px',
                            fontSize: '18px',
                            opacity: 0.7
                          }}
                        >
                          {tiposConta.find(t => t.value === conta.tipo)?.icon || '💳'}
                        </div>
                        
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            fontWeight: '600', 
                            color: '#374151', 
                            marginBottom: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            {conta.nome}
                            <span style={{
                              fontSize: '0.7rem',
                              background: '#f59e0b',
                              color: 'white',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontWeight: '500'
                            }}>
                              ARQUIVADA
                            </span>
                          </div>
                          
                          <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '4px' }}>
                            {tiposConta.find(t => t.value === conta.tipo)?.label}
                            {conta.banco && ` • ${conta.banco}`}
                            {dataArquivamento && (
                              <>
                                {' • '}
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <Calendar size={12} />
                                  Arquivada em {dataArquivamento}
                                </span>
                              </>
                            )}
                          </div>
                          
                          <div style={{ 
                            fontSize: '0.9rem', 
                            fontWeight: '600',
                            color: (conta.saldo || 0) >= 0 ? '#059669' : '#dc2626'
                          }}>
                            {formatCurrency(conta.saldo || 0)}
                          </div>

                          {/* Motivo do arquivamento (se disponível) */}
                          {conta.observacoes && conta.observacoes.includes('[Arquivada:') && (
                            <div style={{ 
                              fontSize: '0.75rem', 
                              color: '#9ca3af',
                              marginTop: '4px',
                              fontStyle: 'italic'
                            }}>
                              {conta.observacoes.split('] ')[1] || 'Sem motivo especificado'}
                            </div>
                          )}
                        </div>
                        
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => iniciarDesarquivamento(conta)}
                            disabled={submitting}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '8px',
                              borderRadius: '6px',
                              color: '#10b981',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s ease'
                            }}
                            title="Desarquivar conta"
                          >
                            <ArchiveRestore size={16} />
                          </button>
                          <button
                            onClick={() => iniciarExclusao(conta)}
                            disabled={submitting}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '8px',
                              borderRadius: '6px',
                              color: '#ef4444',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s ease'
                            }}
                            title="Excluir conta permanentemente"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: '#6b7280'
                }}>
                  {estatisticas.total === 0 ? (
                    <>
                      <Archive size={48} strokeWidth={1} style={{ color: '#d1d5db', marginBottom: '16px' }} />
                      <p style={{ margin: '0 0 8px 0', fontSize: '1rem', fontWeight: '500' }}>
                        Nenhuma conta arquivada
                      </p>
                      <p style={{ margin: '0', fontSize: '0.875rem' }}>
                        Contas que você arquivar aparecerão aqui
                      </p>
                    </>
                  ) : (
                    <>
                      <Filter size={48} strokeWidth={1} style={{ color: '#d1d5db', marginBottom: '16px' }} />
                      <p style={{ margin: '0 0 8px 0', fontSize: '1rem', fontWeight: '500' }}>
                        Nenhuma conta encontrada
                      </p>
                      <p style={{ margin: '0 0 16px 0', fontSize: '0.875rem' }}>
                        Tente ajustar os filtros de busca
                      </p>
                      <button
                        onClick={limparFiltros}
                        style={{
                          padding: '8px 16px',
                          background: '#f59e0b',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          cursor: 'pointer'
                        }}
                      >
                        Limpar Filtros
                      </button>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #e5e7eb',
          background: '#f9fafb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            💡 <strong>Dica:</strong> Contas arquivadas não aparecem no dashboard, mas mantêm o histórico nos relatórios
          </div>
          <button
            onClick={onClose}
            className="form-btn form-btn-secondary"
          >
            Fechar
          </button>
        </div>

        {/* Modal de Desarquivamento */}
        {modalDesarquivar.show && (
          <div className="confirmation-overlay">
            <div className="confirmation-container" style={{ maxWidth: '450px' }}>
              <h3 className="confirmation-title" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                marginBottom: '16px' 
              }}>
                <ArchiveRestore size={20} style={{ color: '#10b981' }} />
                Desarquivar Conta
              </h3>
              
              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  background: '#ecfdf5',
                  border: '1px solid #10b981',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '16px'
                }}>
                  <div style={{ fontWeight: '600', marginBottom: '8px' }}>
                    {modalDesarquivar.conta?.nome}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#065f46' }}>
                    Esta conta será reativada e voltará a aparecer no dashboard e nos formulários. 
                    O saldo de <strong>{formatCurrency(modalDesarquivar.conta?.saldo || 0)}</strong> será 
                    incluído nos cálculos totais novamente.
                  </div>
                </div>
              </div>
              
              <div className="confirmation-actions" style={{ gap: '8px' }}>
                <button 
                  onClick={() => setModalDesarquivar({ show: false, conta: null })}
                  className="form-btn form-btn-secondary"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmarDesarquivamento}
                  disabled={submitting}
                  className="form-btn form-btn-primary receita"
                >
                  {submitting ? (
                    <>
                      <div className="form-spinner"></div>
                      Desarquivando...
                    </>
                  ) : (
                    <>
                      <ArchiveRestore size={14} />
                      Desarquivar Conta
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Exclusão */}
        {modalExcluir.show && (
          <div className="confirmation-overlay">
            <div className="confirmation-container" style={{ maxWidth: '500px' }}>
              <h3 className="confirmation-title" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                marginBottom: '16px',
                color: '#ef4444'
              }}>
                <Trash2 size={20} style={{ color: '#ef4444' }} />
                Excluir Conta Permanentemente
              </h3>
              
              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #ef4444',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '16px'
                }}>
                  <div style={{ fontWeight: '600', marginBottom: '8px', color: '#b91c1c' }}>
                    ⚠️ Ação Irreversível
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#991b1b', marginBottom: '12px' }}>
                    A conta <strong>"{modalExcluir.conta?.nome}"</strong> será apagada permanentemente. 
                    Esta ação não pode ser desfeita.
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#7f1d1d' }}>
                    Como esta conta está arquivada, presumimos que você não a utiliza mais. 
                    Mas lembre-se: uma vez excluída, não há como recuperar.
                  </div>
                </div>
                
                <div className="form-field">
                  <label className="form-label" style={{ color: '#374151' }}>
                    Para confirmar, digite: <strong>EXCLUIR PERMANENTEMENTE</strong>
                  </label>
                  <input
                    type="text"
                    value={modalExcluir.confirmacao}
                    onChange={(e) => setModalExcluir(prev => ({ ...prev, confirmacao: e.target.value }))}
                    placeholder="EXCLUIR PERMANENTEMENTE"
                    className="form-input"
                    style={{ 
                      fontFamily: 'monospace',
                      fontSize: '0.9rem',
                      textAlign: 'center'
                    }}
                  />
                </div>
              </div>
              
              <div className="confirmation-actions" style={{ gap: '8px' }}>
                <button 
                  onClick={() => setModalExcluir({ show: false, conta: null, confirmacao: '' })}
                  className="form-btn form-btn-secondary"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmarExclusao}
                  disabled={submitting || modalExcluir.confirmacao !== 'EXCLUIR PERMANENTEMENTE'}
                  className="form-btn form-btn-primary"
                  style={{ 
                    background: '#ef4444', 
                    borderColor: '#ef4444',
                    opacity: modalExcluir.confirmacao !== 'EXCLUIR PERMANENTEMENTE' ? 0.5 : 1
                  }}
                >
                  {submitting ? (
                    <>
                      <div className="form-spinner"></div>
                      Excluindo...
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} />
                      Excluir Permanentemente
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

ContasArquivadasModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onUpdate: PropTypes.func
};

export default React.memo(ContasArquivadasModal);
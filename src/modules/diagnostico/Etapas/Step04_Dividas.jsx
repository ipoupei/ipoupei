// src/modules/diagnostico/etapas/Step04_Dividas.jsx
// SUBSTITUA COMPLETAMENTE O ARQUIVO EXISTENTE POR ESTE CÓDIGO

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, 
  AlertCircle, 
  Plus, 
  Trash2,
  Calculator,
  Calendar,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import useDiagnosticoEmocionalStore from '@modules/diagnostico/store/diagnosticoEmocionalStore';

const Step04_Dividas = () => {
  const navigate = useNavigate();
  const { 
    dividas,
    setDividas,
    nextEtapa, 
    prevEtapa 
  } = useDiagnosticoEmocionalStore();

  const [temDividas, setTemDividas] = useState(null);
  const [listaDividas, setListaDividas] = useState([]);
  const [modoDetalhado, setModoDetalhado] = useState(false);

  const opcoesDividas = [
    {
      value: 'nao',
      titulo: '😊 Não tenho dívidas',
      descricao: 'Estou livre de dívidas no momento',
      icone: '✅',
      color: '#10b981'
    },
    {
      value: 'sim',
      titulo: '😰 Sim, tenho dívidas',
      descricao: 'Tenho algumas pendências financeiras',
      icone: '📊',
      color: '#ef4444'
    },
    {
      value: 'nao_sei',
      titulo: '🤷‍♂️ Não sei ao certo',
      descricao: 'Pode ser que tenha algo pendente',
      icone: '❓',
      color: '#f59e0b'
    }
  ];

  const tiposDivida = [
    'Cartão de Crédito',
    'Empréstimo Pessoal',
    'Financiamento',
    'Cheque Especial',
    'FIES/Estudantil',
    'Outros'
  ];

  const handleVoltar = () => {
    prevEtapa();
    navigate('/susto-consciente/gastos-mensais');
  };

  const handleContinuar = () => {
    let infoCompleta = '';
    
    if (temDividas === 'sim') {
      if (modoDetalhado && listaDividas.length > 0) {
        infoCompleta = {
          tipo: 'detalhado',
          dividas: listaDividas,
          totalValor: listaDividas.reduce((total, divida) => total + divida.valor, 0),
          totalParcelas: listaDividas.reduce((total, divida) => total + divida.parcelas, 0)
        };
      } else {
        infoCompleta = { tipo: 'simples', tem: true };
      }
    } else {
      infoCompleta = { tipo: 'simples', tem: false, motivo: temDividas };
    }
    
    setDividas(infoCompleta);
    nextEtapa();
    navigate('/susto-consciente/vilao');
  };

  const handleTemDividas = (opcao) => {
    setTemDividas(opcao);
    if (opcao !== 'sim') {
      setListaDividas([]);
      setModoDetalhado(false);
    }
  };

  const adicionarDivida = () => {
    setListaDividas(prev => [...prev, {
      id: Date.now(),
      tipo: '',
      valor: 0,
      parcelas: 0,
      descricao: ''
    }]);
  };

  const removerDivida = (id) => {
    setListaDividas(prev => prev.filter(divida => divida.id !== id));
  };

  const atualizarDivida = (id, campo, valor) => {
    setListaDividas(prev => prev.map(divida => 
      divida.id === id ? { ...divida, [campo]: valor } : divida
    ));
  };

  const totalDividas = listaDividas.reduce((total, divida) => total + divida.valor, 0);

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '900px',
        background: 'white',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Progress Bar */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{
            width: '100%',
            height: '8px',
            background: '#f3f4f6',
            borderRadius: '4px',
            marginBottom: '0.5rem'
          }}>
            <div style={{
              width: '50%', // 4/8 etapas
              height: '100%',
              background: 'linear-gradient(90deg, #ef4444, #f59e0b)',
              borderRadius: '4px',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>
            Etapa 4 de 8
          </span>
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', margin: '0 0 0.5rem 0', color: '#1f2937' }}>
            Você tem dívidas?
          </h1>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '1.1rem' }}>
            Vamos mapear seus compromissos financeiros para criar a melhor estratégia
          </p>
        </div>

        {/* Intro */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
            <AlertCircle size={32} color="#f59e0b" />
          </div>
          <p style={{ color: '#6b7280', lineHeight: 1.6, fontSize: '1rem' }}>
            Dívidas fazem parte da vida financeira. Seja honesto - quanto mais detalhe, 
            melhor será seu plano personalizado!
          </p>
        </div>

        {/* Options Cards */}
        <div style={{ margin: '2rem 0' }}>
          {opcoesDividas.map((opcao) => {
            const isSelected = temDividas === opcao.value;
            return (
              <div
                key={opcao.value}
                onClick={() => handleTemDividas(opcao.value)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1.5rem',
                  border: `3px solid ${isSelected ? opcao.color : '#e5e7eb'}`,
                  borderRadius: '12px',
                  background: isSelected ? `${opcao.color}10` : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  marginBottom: '1rem',
                  transform: isSelected ? 'translateY(-2px)' : 'translateY(0)',
                  boxShadow: isSelected ? `0 4px 12px ${opcao.color}40` : '0 2px 4px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                  }
                }}
              >
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '12px',
                  background: '#f9fafb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  flexShrink: 0
                }}>
                  {opcao.icone}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: '700',
                    margin: '0 0 0.25rem 0',
                    color: '#1f2937'
                  }}>
                    {opcao.titulo}
                  </h3>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    margin: 0
                  }}>
                    {opcao.descricao}
                  </p>
                </div>
                {isSelected && (
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: opcao.color,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.875rem',
                    fontWeight: '700'
                  }}>
                    ✓
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Modo Detalhado */}
        {temDividas === 'sim' && (
          <div style={{ 
            marginTop: '2rem', 
            paddingTop: '2rem', 
            borderTop: '2px solid #e2e8f0'
          }}>
            <div style={{
              display: 'flex',
              gap: '1rem',
              marginBottom: '2rem',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => setModoDetalhado(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.875rem 1.5rem',
                  border: `3px solid ${!modoDetalhado ? '#3b82f6' : '#e5e7eb'}`,
                  borderRadius: '10px',
                  background: !modoDetalhado ? '#eff6ff' : 'white',
                  color: !modoDetalhado ? '#1d4ed8' : '#6b7280',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontWeight: '600',
                  fontSize: '0.95rem'
                }}
              >
                <Calculator size={20} />
                Tenho, mas não sei detalhes
              </button>
              <button
                onClick={() => setModoDetalhado(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.875rem 1.5rem',
                  border: `3px solid ${modoDetalhado ? '#3b82f6' : '#e5e7eb'}`,
                  borderRadius: '10px',
                  background: modoDetalhado ? '#eff6ff' : 'white',
                  color: modoDetalhado ? '#1d4ed8' : '#6b7280',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontWeight: '600',
                  fontSize: '0.95rem'
                }}
              >
                <CreditCard size={20} />
                Quero detalhar
              </button>
            </div>

            {modoDetalhado && (
              <div style={{
                background: '#f8fafc',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                padding: '2rem',
                textAlign: 'center'
              }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: '600', 
                    margin: '0 0 0.5rem 0' 
                  }}>
                    Suas dívidas atuais
                  </h4>
                  <button
                    onClick={adicionarDivida}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    <Plus size={16} />
                    Adicionar dívida
                  </button>
                </div>

                {listaDividas.length === 0 ? (
                  <div style={{
                    padding: '3rem',
                    color: '#6b7280'
                  }}>
                    <div style={{ marginBottom: '1rem' }}>
                      <CreditCard size={32} color="#6b7280" />
                    </div>
                    <p>Clique em "Adicionar dívida" para começar a mapear suas pendências financeiras.</p>
                  </div>
                ) : (
                  <div>
                    {listaDividas.map((divida, index) => (
                      <div key={divida.id} style={{
                        background: 'white',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '1.5rem',
                        marginBottom: '1rem',
                        textAlign: 'left'
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '1rem'
                        }}>
                          <span style={{ fontWeight: '600' }}>Dívida {index + 1}</span>
                          <button
                            onClick={() => removerDivida(divida.id)}
                            style={{
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '0.25rem',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div style={{ display: 'grid', gap: '1rem' }}>
                          <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                              Tipo:
                            </label>
                            <select
                              value={divida.tipo}
                              onChange={(e) => atualizarDivida(divida.id, 'tipo', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '2px solid #e5e7eb',
                                borderRadius: '6px'
                              }}
                            >
                              <option value="">Selecione...</option>
                              {tiposDivida.map(tipo => (
                                <option key={tipo} value={tipo}>{tipo}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                              Valor total:
                            </label>
                            <input
                              type="number"
                              value={divida.valor}
                              onChange={(e) => atualizarDivida(divida.id, 'valor', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                              style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '2px solid #e5e7eb',
                                borderRadius: '6px'
                              }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                              Parcelas restantes:
                            </label>
                            <input
                              type="number"
                              value={divida.parcelas}
                              onChange={(e) => atualizarDivida(divida.id, 'parcelas', parseInt(e.target.value) || 0)}
                              placeholder="0"
                              style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '2px solid #e5e7eb',
                                borderRadius: '6px'
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    {listaDividas.length > 0 && (
                      <div style={{
                        background: '#fef2f2',
                        border: '2px solid #fecaca',
                        borderRadius: '8px',
                        padding: '1rem',
                        marginTop: '1rem'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: '600' }}>Total em dívidas:</span>
                          <span style={{ color: '#dc2626', fontWeight: '700' }}>
                            R$ {totalDividas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Feedback */}
        {temDividas && (
          <div style={{
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            border: '2px solid #0ea5e9',
            borderRadius: '12px',
            padding: '1.25rem',
            margin: '1.5rem 0',
            textAlign: 'center'
          }}>
            <p style={{
              color: '#0c4a6e',
              fontWeight: '600',
              margin: 0,
              lineHeight: 1.5
            }}>
              {temDividas === 'nao' && (
                <>
                  <strong>🎉 Parabéns!</strong> Estar livre de dívidas é um grande passo para a saúde financeira. 
                  Vamos focar em manter isso e potencializar seus investimentos!
                </>
              )}
              {temDividas === 'sim' && (
                <>
                  <strong>👍 Obrigado pela honestidade!</strong> Vamos criar estratégias para organizar e quitar tudo 
                  de forma inteligente.
                </>
              )}
              {temDividas === 'nao_sei' && (
                <>
                  <strong>📋 Sem problemas!</strong> Vamos fazer um diagnóstico completo para mapear 
                  toda sua situação financeira.
                </>
              )}
            </p>
          </div>
        )}

        {/* Motivação */}
        <div style={{
          background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
          border: '2px solid #bbf7d0',
          borderRadius: '12px',
          padding: '1.25rem',
          margin: '1.5rem 0',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <Calendar size={20} color="#10b981" />
          <p style={{
            margin: 0,
            color: '#047857',
            lineHeight: 1.6,
            fontWeight: '600'
          }}>
            <strong>Lembre-se:</strong> Ter dívidas não é o fim do mundo. Com o plano certo, 
            você pode se organizar e até acelerar a quitação!
          </p>
        </div>

        {/* Navigation */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '1rem',
          marginTop: '2rem',
          paddingTop: '2rem',
          borderTop: '2px solid #e5e7eb'
        }}>
          <button 
            onClick={handleVoltar}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.875rem 1.5rem',
              background: '#f3f4f6',
              color: '#374151',
              border: '2px solid #d1d5db',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              fontSize: '1rem'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#e5e7eb';
              e.target.style.borderColor = '#9ca3af';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#f3f4f6';
              e.target.style.borderColor = '#d1d5db';
            }}
          >
            <ArrowLeft size={20} />
            Voltar
          </button>
          
          <button 
            onClick={handleContinuar}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.875rem 2rem',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '1rem',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
            }}
          >
            Continuar
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Step04_Dividas;
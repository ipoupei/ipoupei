// src/modules/diagnostico/Etapas/PaginaContas.jsx - SUPER SIMPLES
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Plus, CheckCircle, ArrowRight } from 'lucide-react';

// Componentes
import ContasModal from '@modules/contas/components/ContasModal';
import useContas from '@modules/contas/hooks/useContas';

const PaginaContas = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const { contas, loading } = useContas();

  const handleVoltar = () => {
    navigate('/dashboard');
  };

  const handleProximo = () => {
    alert('🎉 Próxima etapa! (por enquanto volta pro dashboard)');
    navigate('/dashboard');
  };

  const canProceed = contas && contas.length > 0;

  if (loading) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f4f6',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p>Carregando contas...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '800px',
      margin: '0 auto',
      padding: '2rem',
      background: 'white',
      borderRadius: '20px',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(0, 0, 0, 0.05)'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{
          width: '80px',
          height: '80px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
          color: 'white',
          boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)'
        }}>
          <Wallet size={32} />
        </div>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: '800', 
          color: '#1e293b', 
          margin: '0 0 0.75rem 0' 
        }}>
          Vamos cadastrar suas contas
        </h1>
        <p style={{ 
          fontSize: '1.125rem', 
          color: '#64748b', 
          margin: '0' 
        }}>
          Configure as contas que você usa no dia a dia
        </p>
      </div>

      {/* Conteúdo */}
      <div style={{ marginBottom: '3rem' }}>
        {/* Texto Introdutório */}
        <div style={{
          marginBottom: '2.5rem',
          padding: '2rem',
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          borderRadius: '16px',
          border: '1px solid #e2e8f0'
        }}>
          <p style={{
            fontSize: '1rem',
            lineHeight: '1.7',
            color: '#374151',
            margin: '0 0 1rem 0',
            fontWeight: '500'
          }}>
            Agora vamos cadastrar as contas que você usa no seu dia a dia. 
            Essas contas podem ser bancárias, carteiras digitais, ou mesmo dinheiro em espécie.
          </p>
          <p style={{
            fontSize: '1rem',
            lineHeight: '1.7',
            color: '#6b7280',
            margin: '0',
            fontWeight: '400'
          }}>
            Clique no botão abaixo e adicione as contas que deseja controlar no iPoupei.
          </p>
        </div>

        {/* Botão Principal */}
        <div style={{ textAlign: 'center', margin: '2.5rem 0' }}>
          <button
            onClick={() => setShowModal(true)}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              color: 'white',
              padding: '1rem 2rem',
              fontSize: '1.125rem',
              fontWeight: '700',
              borderRadius: '16px',
              boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
              transition: 'all 0.3s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              minWidth: '240px',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 12px 32px rgba(102, 126, 234, 0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.3)';
            }}
          >
            <Plus size={20} />
            Adicionar Nova Conta
          </button>
        </div>

        {/* Status das Contas */}
        {canProceed && (
          <div style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            border: '1px solid #bbf7d0',
            borderRadius: '16px',
            padding: '2rem',
            margin: '2rem 0'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1.5rem'
            }}>
              <CheckCircle size={20} style={{ color: '#16a34a' }} />
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '700',
                color: '#166534',
                margin: '0'
              }}>
                {contas.length} conta{contas.length > 1 ? 's' : ''} cadastrada{contas.length > 1 ? 's' : ''}
              </h3>
            </div>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              marginBottom: '1.5rem'
            }}>
              {contas.map((conta) => (
                <div key={conta.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    backgroundColor: conta.cor || '#6b7280'
                  }}>
                    <Wallet size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>
                      {conta.nome}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {conta.tipo}
                    </div>
                  </div>
                  <div style={{
                    fontWeight: '700',
                    color: '#059669',
                    fontSize: '0.875rem',
                    background: '#f0fdf4',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    border: '1px solid #bbf7d0'
                  }}>
                    R$ {(conta.saldo || 0).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
              <button
                onClick={() => setShowModal(true)}
                style={{
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  color: '#6b7280',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Plus size={16} />
                Adicionar mais contas
              </button>
            </div>
          </div>
        )}

        {/* Dica */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          padding: '1.5rem',
          background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
          border: '1px solid #fbbf24',
          borderRadius: '16px',
          borderLeft: '4px solid #f59e0b'
        }}>
          <div style={{ fontSize: '1.5rem' }}>💡</div>
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#92400e', margin: '0 0 0.5rem 0' }}>
              Dica importante:
            </h4>
            <p style={{ fontSize: '0.875rem', color: '#78350f', margin: '0', lineHeight: '1.6' }}>
              Adicione apenas as contas que você realmente usa. 
              Você pode sempre adicionar mais contas depois.
            </p>
          </div>
        </div>
      </div>

      {/* Navegação */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        paddingTop: '2rem',
        borderTop: '1px solid #f1f5f9'
      }}>
        <button
          onClick={handleVoltar}
          style={{
            background: 'white',
            border: '1px solid #e5e7eb',
            color: '#6b7280',
            padding: '0.75rem 1.5rem',
            fontWeight: '600',
            borderRadius: '12px',
            cursor: 'pointer'
          }}
        >
          Voltar
        </button>

        <button
          onClick={handleProximo}
          disabled={!canProceed}
          style={{
            background: canProceed 
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
              : '#e5e7eb',
            border: 'none',
            color: canProceed ? 'white' : '#9ca3af',
            padding: '0.75rem 1.5rem',
            fontWeight: '700',
            borderRadius: '12px',
            cursor: canProceed ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          Continuar
          <ArrowRight size={16} />
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <ContasModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSave={() => {
            console.log('✅ Conta salva!');
            // Modal fecha automaticamente
          }}
        />
      )}
    </div>
  );
};

// EXPORT DEFAULT - IMPORTANTE!
export default PaginaContas;
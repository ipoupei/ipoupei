import React, { useState } from 'react';
import BasicModal from './BasicModal';
import InputMoney from './ui/InputMoney';
import { formatCurrency } from '../utils/formatCurrency';
import useContas from '../hooks/useContas';

/**
 * Modal para gerenciar contas bancárias
 * VERSÃO CORRIGIDA - Integrado com hook useContas real
 */
const ContasModal = ({ isOpen, onClose }) => {
  // Hook real de contas
  const { contas, loading, error, addConta, deleteConta } = useContas();
  
  // Estados do modal
  const [showForm, setShowForm] = useState(false);
  const [feedback, setFeedback] = useState({ visible: false, message: '', type: '' });
  const [formData, setFormData] = useState({ nome: '', saldo: 0 });
  const [formError, setFormError] = useState('');

  // Log para debug
  console.log('🏦 ContasModal - Estado:', { totalContas: contas.length, loading, error });

  // Calcula o total em contas
  const totalEmContas = contas.reduce((total, conta) => total + (conta.saldo || 0), 0);

  // Adiciona nova conta usando o hook real
  const handleSaveConta = async (e) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.nome.trim()) {
      setFormError('Nome da conta é obrigatório');
      return;
    }
    
    console.log('💾 Salvando conta:', formData);
    
    try {
      // Usar o hook real para adicionar
      const result = await addConta({
        nome: formData.nome.trim(),
        tipo: 'corrente', // Tipo padrão
        banco: '',
        saldo: formData.saldo || 0,
        cor: '#3B82F6' // Cor padrão
      });
      
      console.log('✅ Resultado da criação:', result);
      
      if (result.success) {
        // Reset do formulário
        setFormData({ nome: '', saldo: 0 });
        setFormError('');
        setShowForm(false);
        
        // Feedback de sucesso
        setFeedback({
          visible: true,
          message: 'Conta adicionada com sucesso!',
          type: 'success'
        });
        
        // Esconder feedback depois de 3 segundos
        setTimeout(() => {
          setFeedback({ visible: false, message: '', type: '' });
        }, 3000);
      } else {
        throw new Error(result.error || 'Erro ao criar conta');
      }
    } catch (err) {
      console.error('❌ Erro ao salvar conta:', err);
      setFeedback({
        visible: true,
        message: `Erro ao criar conta: ${err.message}`,
        type: 'error'
      });
      
      setTimeout(() => {
        setFeedback({ visible: false, message: '', type: '' });
      }, 5000);
    }
  };

  // Exclui uma conta usando o hook real
  const handleDeleteConta = async (conta) => {
    if (window.confirm(`Tem certeza que deseja excluir a conta "${conta.nome}"?`)) {
      console.log('🗑️ Excluindo conta:', conta.id);
      
      try {
        const result = await deleteConta(conta.id);
        
        console.log('✅ Resultado da exclusão:', result);
        
        if (result.success) {
          setFeedback({
            visible: true,
            message: 'Conta excluída com sucesso!',
            type: 'success'
          });
          
          setTimeout(() => {
            setFeedback({ visible: false, message: '', type: '' });
          }, 3000);
        } else {
          throw new Error(result.error || 'Erro ao excluir conta');
        }
      } catch (err) {
        console.error('❌ Erro ao excluir conta:', err);
        setFeedback({
          visible: true,
          message: `Erro ao excluir conta: ${err.message}`,
          type: 'error'
        });
        
        setTimeout(() => {
          setFeedback({ visible: false, message: '', type: '' });
        }, 5000);
      }
    }
  };

  // Se está carregando
  if (loading) {
    return (
      <BasicModal isOpen={isOpen} onClose={onClose} title="Gerenciar contas">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div>🔄 Carregando contas...</div>
        </div>
      </BasicModal>
    );
  }

  // Conteúdo principal do modal
  const modalContent = (
    <div style={{ maxWidth: '450px', margin: '0 auto' }}>
      {/* Resumo do dia */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          backgroundColor: '#f5f8ff',
          padding: '12px',
          borderRadius: '4px',
          marginBottom: '20px',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        <div>
          <div style={{ fontSize: '14px', color: '#718096', marginBottom: '2px' }}>
            Total em contas
          </div>
          <div style={{ 
            fontSize: '16px', 
            fontWeight: 600, 
            color: totalEmContas >= 0 ? '#3182ce' : '#e53e3e' 
          }}>
            {formatCurrency(totalEmContas)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '14px', color: '#718096', marginBottom: '2px', textAlign: 'right' }}>
            Número de contas
          </div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#4a5568', textAlign: 'right' }}>
            {contas.length}
          </div>
        </div>
      </div>

      {/* Feedback de sucesso/erro */}
      {feedback.visible && (
        <div
          style={{
            padding: '10px 12px',
            marginBottom: '16px',
            borderRadius: '4px',
            backgroundColor: feedback.type === 'success' ? '#e6fffa' : '#fff5f5',
            color: feedback.type === 'success' ? '#2c7a7b' : '#c53030',
            border: `1px solid ${feedback.type === 'success' ? '#b2f5ea' : '#feb2b2'}`,
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          {feedback.message}
        </div>
      )}

      {/* Erro geral do hook */}
      {error && (
        <div
          style={{
            padding: '10px 12px',
            marginBottom: '16px',
            borderRadius: '4px',
            backgroundColor: '#fff5f5',
            color: '#c53030',
            border: '1px solid #feb2b2',
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          ❌ {error}
        </div>
      )}

      {showForm ? (
        <div
          style={{
            backgroundColor: '#f7fafc',
            padding: '16px',
            borderRadius: '4px',
            marginBottom: '16px',
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          <h3 style={{ 
            marginTop: 0, 
            marginBottom: '16px', 
            fontSize: '15px',
            fontWeight: 500
          }}>
            Nova Conta
          </h3>
          
          <form onSubmit={handleSaveConta}>
            <div style={{ marginBottom: '12px' }}>
              <label 
                style={{ 
                  display: 'block', 
                  marginBottom: '4px', 
                  fontWeight: 500,
                  fontSize: '14px'
                }}
              >
                Nome da Conta
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, nome: e.target.value }));
                  if (formError) setFormError('');
                }}
                placeholder="Ex: Nubank, Itaú, Carteira"
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  border: `1px solid ${formError ? '#e53e3e' : '#cbd5e0'}`,
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  maxWidth: '320px'
                }}
              />
              {formError && (
                <div style={{ color: '#e53e3e', fontSize: '12px', marginTop: '4px' }}>
                  {formError}
                </div>
              )}
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label 
                style={{ 
                  display: 'block', 
                  marginBottom: '4px', 
                  fontWeight: 500,
                  fontSize: '14px'
                }}
              >
                Saldo Inicial
                <small style={{ 
                  marginLeft: '4px', 
                  fontWeight: 'normal',
                  color: '#718096',
                  fontSize: '12px'
                }}>
                  (pode ser negativo)
                </small>
              </label>
              <InputMoney
                value={formData.saldo}
                onChange={(value) => setFormData(prev => ({ ...prev, saldo: value }))}
                placeholder="R$ 0,00"
                style={{
                  width: '100%',
                  maxWidth: '320px',
                  padding: '6px 10px',
                  border: '1px solid #cbd5e0',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormData({ nome: '', saldo: 0 });
                  setFormError('');
                }}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#edf2f7',
                  color: '#4a5568',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '6px 12px',
                  backgroundColor: loading ? '#a0aec0' : '#3182ce',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          {/* Lista de contas */}
          <div
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: '16px',
              width: '100%',
              boxSizing: 'border-box'
            }}
          >
            {contas.length === 0 ? (
              <div style={{
                padding: '20px',
                textAlign: 'center',
                color: '#718096',
                backgroundColor: 'white'
              }}>
                📝 Nenhuma conta cadastrada ainda.
                <br />
                <small>Clique em "Criar nova conta" para começar!</small>
              </div>
            ) : (
              contas.map(conta => (
                <div
                  key={conta.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px 12px',
                    borderBottom: '1px solid #edf2f7',
                    backgroundColor: 'white'
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: conta.cor || '#ebf5ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '10px',
                      fontSize: '16px'
                    }}
                  >
                    🏦
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: '14px' }}>
                      {conta.nome}
                    </div>
                    <div style={{ fontSize: '12px', color: '#718096' }}>
                      {conta.tipo} {conta.banco && `- ${conta.banco}`}
                    </div>
                    <div style={{ 
                      fontSize: '13px', 
                      color: conta.saldo >= 0 ? '#3182ce' : '#e53e3e',
                      fontWeight: 500
                    }}>
                      {formatCurrency(conta.saldo)}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleDeleteConta(conta)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#e53e3e',
                      padding: '6px',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                    title="Excluir conta"
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
          
          {/* Botão para adicionar conta */}
          <button
            onClick={() => setShowForm(true)}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              padding: '8px',
              backgroundColor: loading ? '#a0aec0' : '#3182ce',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '16px',
              fontWeight: 500,
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          >
            <span style={{ marginRight: '6px', fontSize: '14px' }}>+</span>
            Criar nova conta
          </button>
        </>
      )}
      
      {/* Botão de fechar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={onClose}
          style={{
            padding: '6px 12px',
            backgroundColor: '#edf2f7',
            color: '#4a5568',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Fechar
        </button>
      </div>
    </div>
  );

  // Render o modal com o conteúdo
  return (
    <BasicModal
      isOpen={isOpen}
      onClose={onClose}
      title="Gerenciar contas"
    >
      {modalContent}
    </BasicModal>
  );
};

export default ContasModal;
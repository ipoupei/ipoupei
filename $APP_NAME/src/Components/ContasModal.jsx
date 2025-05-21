import React, { useState } from 'react';
import BasicModal from './BasicModal';
import InputMoney from './ui/InputMoney';
import { formatCurrency } from '../utils/formatCurrency';

/**
 * Modal para gerenciar contas bancárias
 * Atualizado para permitir saldos negativos e melhorar a usabilidade
 */
const ContasModal = ({ isOpen, onClose }) => {
  // Estados do modal
  const [contas, setContas] = useState([
    { id: '1', nome: 'Itaú', saldo: 1200.00 },
    { id: '2', nome: 'Bradesco', saldo: 760.10 },
    { id: '3', nome: 'Inter', saldo: 4550.00 }
  ]);
  const [showForm, setShowForm] = useState(false);
  const [feedback, setFeedback] = useState({ visible: false, message: '', type: '' });
  const [formData, setFormData] = useState({ nome: '', saldo: 0 });
  const [formError, setFormError] = useState('');

  // Calcula o total em contas
  const totalEmContas = contas.reduce((total, conta) => total + (conta.saldo || 0), 0);

  // Adiciona nova conta
  const handleSaveConta = (e) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.nome.trim()) {
      setFormError('Nome da conta é obrigatório');
      return;
    }
    
    // Criar nova conta
    const novaConta = {
      id: `conta_${Date.now()}`,
      nome: formData.nome.trim(),
      saldo: formData.saldo
    };
    
    // Adicionar à lista
    setContas([...contas, novaConta]);
    
    // Reset do formulário
    setFormData({ nome: '', saldo: 0 });
    setFormError('');
    setShowForm(false);
    
    // Feedback
    setFeedback({
      visible: true,
      message: 'Conta adicionada com sucesso!',
      type: 'success'
    });
    
    // Esconder feedback depois de 3 segundos
    setTimeout(() => {
      setFeedback({ visible: false, message: '', type: '' });
    }, 3000);
  };

  // Exclui uma conta
  const handleDeleteConta = (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta conta?')) {
      setContas(contas.filter(conta => conta.id !== id));
      
      setFeedback({
        visible: true,
        message: 'Conta excluída com sucesso!',
        type: 'success'
      });
      
      setTimeout(() => {
        setFeedback({ visible: false, message: '', type: '' });
      }, 3000);
    }
  };

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
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#3182ce',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Salvar
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
            {contas.map(conta => (
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
                    backgroundColor: '#ebf5ff',
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
                  <div style={{ fontWeight: 500, fontSize: '14px' }}>{conta.nome}</div>
                  <div style={{ 
                    fontSize: '13px', 
                    color: conta.saldo >= 0 ? '#3182ce' : '#e53e3e' 
                  }}>
                    {formatCurrency(conta.saldo)}
                  </div>
                </div>
                
                <button
                  onClick={() => handleDeleteConta(conta.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#e53e3e',
                    padding: '6px',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
          
          {/* Botão para adicionar conta */}
          <button
            onClick={() => setShowForm(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              padding: '8px',
              backgroundColor: '#3182ce',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
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
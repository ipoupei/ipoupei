import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Wallet, Plus, Trash2, Edit3, X } from 'lucide-react';
import BasicModal from './BasicModal';
import InputMoney from './ui/InputMoney';
import { formatCurrency } from '../utils/formatCurrency';
import useContas from '../hooks/useContas';
import './ContasModal.css';

/**
 * Modal para gerenciar contas bancárias
 * Versão integrada com Supabase através do hook useContas
 */
const ContasModal = ({ isOpen, onClose }) => {
  // Hook real de contas
  const { contas, loading, error, addConta, updateConta, deleteConta } = useContas();
  
  // Estados do modal
  const [showForm, setShowForm] = useState(false);
  const [editingConta, setEditingConta] = useState(null);
  const [feedback, setFeedback] = useState({ visible: false, message: '', type: '' });
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'corrente',
    banco: '',
    saldo: 0,
    cor: '#3B82F6'
  });
  const [formError, setFormError] = useState('');

  // Cores predefinidas para seleção
  const coresPredefinidas = [
    '#3B82F6', // Azul
    '#10B981', // Verde
    '#F59E0B', // Amarelo
    '#EF4444', // Vermelho
    '#8B5CF6', // Roxo
    '#EC4899', // Rosa
    '#06B6D4', // Ciano
    '#84CC16', // Lima
    '#F97316', // Laranja
    '#6B7280'  // Cinza
  ];

  // Tipos de conta disponíveis
  const tiposConta = [
    { value: 'corrente', label: 'Conta Corrente' },
    { value: 'poupanca', label: 'Poupança' },
    { value: 'investimento', label: 'Investimento' },
    { value: 'carteira', label: 'Carteira' },
    { value: 'outros', label: 'Outros' }
  ];

  // Calcula o total em contas
  const totalEmContas = contas.reduce((total, conta) => total + (conta.saldo || 0), 0);

  // Função para mostrar feedback
  const showFeedback = (message, type = 'success') => {
    setFeedback({ visible: true, message, type });
    setTimeout(() => {
      setFeedback({ visible: false, message: '', type: '' });
    }, 3000);
  };

  // Função para resetar formulário
  const resetForm = () => {
    setFormData({
      nome: '',
      tipo: 'corrente',
      banco: '',
      saldo: 0,
      cor: '#3B82F6'
    });
    setFormError('');
    setEditingConta(null);
    setShowForm(false);
  };

  // Função para abrir formulário de nova conta
  const handleNovaConta = () => {
    resetForm();
    setShowForm(true);
  };

  // Função para abrir formulário de edição
  const handleEditarConta = (conta) => {
    setEditingConta(conta);
    setFormData({
      nome: conta.nome || '',
      tipo: conta.tipo || 'corrente',
      banco: conta.banco || '',
      saldo: conta.saldo || 0,
      cor: conta.cor || '#3B82F6'
    });
    setFormError('');
    setShowForm(true);
  };

  // Adiciona ou atualiza conta
  const handleSaveConta = async (e) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.nome.trim()) {
      setFormError('Nome da conta é obrigatório');
      return;
    }
    
    console.log('💾 Salvando conta:', formData, editingConta);
    
    try {
      let result;
      
      if (editingConta) {
        // Atualizar conta existente
        result = await updateConta(editingConta.id, {
          nome: formData.nome.trim(),
          tipo: formData.tipo,
          banco: formData.banco.trim(),
          saldo: formData.saldo || 0,
          cor: formData.cor
        });
      } else {
        // Adicionar nova conta
        result = await addConta({
          nome: formData.nome.trim(),
          tipo: formData.tipo,
          banco: formData.banco.trim(),
          saldo: formData.saldo || 0,
          cor: formData.cor
        });
      }
      
      console.log('✅ Resultado da operação:', result);
      
      if (result.success) {
        resetForm();
        showFeedback(
          editingConta ? 'Conta atualizada com sucesso!' : 'Conta adicionada com sucesso!',
          'success'
        );
      } else {
        throw new Error(result.error || 'Erro ao salvar conta');
      }
    } catch (err) {
      console.error('❌ Erro ao salvar conta:', err);
      showFeedback(`Erro ao ${editingConta ? 'atualizar' : 'criar'} conta: ${err.message}`, 'error');
    }
  };

  // Exclui uma conta
  const handleDeleteConta = async (conta) => {
    if (window.confirm(`Tem certeza que deseja excluir a conta "${conta.nome}"?`)) {
      console.log('🗑️ Excluindo conta:', conta.id);
      
      try {
        const result = await deleteConta(conta.id);
        
        console.log('✅ Resultado da exclusão:', result);
        
        if (result.success) {
          showFeedback('Conta excluída com sucesso!', 'success');
        } else {
          throw new Error(result.error || 'Erro ao excluir conta');
        }
      } catch (err) {
        console.error('❌ Erro ao excluir conta:', err);
        showFeedback(`Erro ao excluir conta: ${err.message}`, 'error');
      }
    }
  };

  // Função para obter ícone do tipo de conta
  const getContaIcon = (tipo) => {
    switch (tipo) {
      case 'corrente': return '🏦';
      case 'poupanca': return '🐷';
      case 'investimento': return '📈';
      case 'carteira': return '👛';
      default: return '💳';
    }
  };

  // Se não estiver aberto, não renderiza
  if (!isOpen) return null;

  // Se está carregando
  if (loading && contas.length === 0) {
    return (
      <BasicModal isOpen={isOpen} onClose={onClose} title="Gerenciar contas">
        <div className="contas-loading">
          <div className="loading-spinner"></div>
          <p>Carregando contas...</p>
        </div>
      </BasicModal>
    );
  }

  return (
    <div className="contas-modal-overlay">
      <div className="contas-modal-container">
        {/* Cabeçalho do modal */}
        <div className="contas-modal-header">
          <h2>
            <Wallet size={20} className="icon-header" />
            <span>Gerenciar Contas</span>
          </h2>
          <button 
            className="btn-fechar" 
            onClick={onClose}
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Conteúdo do modal */}
        <div className="contas-modal-content">
          {/* Resumo financeiro */}
          <div className="contas-resumo">
            <div className="resumo-item">
              <div className="resumo-label">Total em contas</div>
              <div className={`resumo-valor ${totalEmContas >= 0 ? 'positivo' : 'negativo'}`}>
                {formatCurrency(totalEmContas)}
              </div>
            </div>
            <div className="resumo-item">
              <div className="resumo-label">Número de contas</div>
              <div className="resumo-valor">{contas.length}</div>
            </div>
          </div>

          {/* Feedback de sucesso/erro */}
          {feedback.visible && (
            <div className={`feedback-message ${feedback.type}`}>
              {feedback.message}
            </div>
          )}

          {/* Erro geral do hook */}
          {error && (
            <div className="feedback-message error">
              ❌ {error}
            </div>
          )}

          {showForm ? (
            /* Formulário de conta */
            <div className="conta-form">
              <h3>{editingConta ? 'Editar Conta' : 'Nova Conta'}</h3>
              
              <form onSubmit={handleSaveConta}>
                <div className="form-group">
                  <label htmlFor="conta-nome">Nome da Conta *</label>
                  <input
                    type="text"
                    id="conta-nome"
                    value={formData.nome}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, nome: e.target.value }));
                      if (formError) setFormError('');
                    }}
                    placeholder="Ex: Nubank, Itaú, Carteira"
                    className={formError ? 'error' : ''}
                    autoFocus
                  />
                  {formError && (
                    <div className="form-error">{formError}</div>
                  )}
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="conta-tipo">Tipo</label>
                    <select
                      id="conta-tipo"
                      value={formData.tipo}
                      onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
                    >
                      {tiposConta.map(tipo => (
                        <option key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="conta-banco">Banco (opcional)</label>
                    <input
                      type="text"
                      id="conta-banco"
                      value={formData.banco}
                      onChange={(e) => setFormData(prev => ({ ...prev, banco: e.target.value }))}
                      placeholder="Ex: Nubank, Itaú"
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="conta-saldo">
                    Saldo {editingConta ? 'Atual' : 'Inicial'}
                    <small>(pode ser negativo)</small>
                  </label>
                  <InputMoney
                    value={formData.saldo}
                    onChange={(value) => {
                      console.log('💰 Valor recebido do InputMoney:', value);
                      setFormData(prev => ({ ...prev, saldo: value }));
                    }}
                    placeholder="R$ 0,00"
                    allowNegative={true}
                  />
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    💡 Para valores negativos, digite o sinal de menos (-) antes do valor
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Cor</label>
                  <div className="cor-selector">
                    <input
                      type="color"
                      value={formData.cor}
                      onChange={(e) => setFormData(prev => ({ ...prev, cor: e.target.value }))}
                      className="color-picker"
                    />
                    <div className="cores-predefinidas">
                      {coresPredefinidas.map(cor => (
                        <button
                          key={cor}
                          type="button"
                          className={`cor-item ${cor === formData.cor ? 'selected' : ''}`}
                          style={{ backgroundColor: cor }}
                          onClick={() => setFormData(prev => ({ ...prev, cor }))}
                          title={cor}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="form-actions">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary"
                  >
                    {loading ? 'Salvando...' : (editingConta ? 'Atualizar' : 'Salvar')}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Lista de contas */
            <>
              <div className="contas-header">
                <h3>Minhas Contas</h3>
                <button 
                  className="btn-nova-conta"
                  onClick={handleNovaConta}
                >
                  <Plus size={18} />
                  <span>Nova Conta</span>
                </button>
              </div>
              
              {contas.length > 0 ? (
                <div className="contas-lista">
                  {contas.map(conta => (
                    <div key={conta.id} className="conta-item">
                      <div 
                        className="conta-cor"
                        style={{ backgroundColor: conta.cor || '#3B82F6' }}
                      >
                        <span className="conta-icone">
                          {getContaIcon(conta.tipo)}
                        </span>
                      </div>
                      
                      <div className="conta-info">
                        <div className="conta-nome">{conta.nome}</div>
                        <div className="conta-detalhes">
                          {tiposConta.find(t => t.value === conta.tipo)?.label}
                          {conta.banco && ` - ${conta.banco}`}
                        </div>
                        <div className={`conta-saldo ${conta.saldo >= 0 ? 'positivo' : 'negativo'}`}>
                          {formatCurrency(conta.saldo)}
                        </div>
                      </div>
                      
                      <div className="conta-actions">
                        <button
                          onClick={() => handleEditarConta(conta)}
                          className="btn-action edit"
                          title="Editar conta"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteConta(conta)}
                          className="btn-action delete"
                          title="Excluir conta"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="contas-empty">
                  <Wallet size={48} strokeWidth={1} />
                  <p>Você ainda não tem contas cadastradas</p>
                  <button 
                    className="btn-primary"
                    onClick={handleNovaConta}
                  >
                    <Plus size={18} />
                    <span>Adicionar minha primeira conta</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Rodapé do modal */}
        {!showForm && (
          <div className="contas-modal-footer">
            <button 
              className="btn-fechar-modal" 
              onClick={onClose}
            >
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

ContasModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default ContasModal;
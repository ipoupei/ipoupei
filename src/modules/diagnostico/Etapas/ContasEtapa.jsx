import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Landmark, Plus, Trash2, Edit2, Wallet, DollarSign } from 'lucide-react';
import InputMoney from '@shared/components/ui/InputMoney';
import { formatCurrency } from '@utils/formatCurrency';




/**
 * Componente da etapa de contas bancárias
 * Permite adicionar, editar e remover contas bancárias do usuário
 */
const ContasEtapa = ({ data, onUpdateData, onNext }) => {
  // Estado local para as contas
  const [contas, setContas] = useState([]);
  
  // Estado para o formulário de nova/editar conta
  const [formVisible, setFormVisible] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'corrente',
    saldo: 0
  });
  
  // Estado para erros no formulário
  const [formErrors, setFormErrors] = useState({});
  
  // Carrega contas existentes (se houver)
  useEffect(() => {
    if (data?.situacaoFinanceira?.contas && data.situacaoFinanceira.contas.length > 0) {
      setContas(data.situacaoFinanceira.contas);
    }
  }, [data]);
  
  // Opções de tipos de conta
  const tiposContas = [
    { id: 'corrente', nome: 'Conta Corrente' },
    { id: 'poupanca', nome: 'Poupança' },
    { id: 'investimento', nome: 'Investimento' },
    { id: 'dinheiro', nome: 'Dinheiro Físico (carteira)' },
    { id: 'outros', nome: 'Outros' }
  ];
  
  // Manipulador para mudanças nos campos do formulário
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpa erro do campo, se existir
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  // Manipulador para campo de saldo (monetário)
  const handleSaldoChange = (value) => {
    setFormData(prev => ({
      ...prev,
      saldo: value
    }));
    
    // Limpa erro do campo, se existir
    if (formErrors.saldo) {
      setFormErrors(prev => ({ ...prev, saldo: null }));
    }
  };
  
  // Valida o formulário antes de enviar
  const validateForm = () => {
    const errors = {};
    
    if (!formData.nome.trim()) {
      errors.nome = 'Nome da conta é obrigatório';
    }
    
    if (!formData.tipo) {
      errors.tipo = 'Selecione o tipo da conta';
    }
    
    // Saldo pode ser negativo (como cheque especial), então não validamos valor mínimo
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Adiciona ou atualiza uma conta
  const handleAddOrUpdateConta = () => {
    if (!validateForm()) return;
    
    const novaConta = {
      ...formData,
      id: editingIndex !== null ? contas[editingIndex].id : `conta_${Date.now()}`
    };
    
    if (editingIndex !== null) {
      // Atualizando uma conta existente
      const novasContas = [...contas];
      novasContas[editingIndex] = novaConta;
      setContas(novasContas);
    } else {
      // Adicionando nova conta
      setContas([...contas, novaConta]);
    }
    
    // Reseta o formulário
    resetForm();
  };
  
  // Remove uma conta
  const handleRemoveConta = (index) => {
    const novasContas = [...contas];
    novasContas.splice(index, 1);
    setContas(novasContas);
  };
  
  // Inicia a edição de uma conta
  const handleEditConta = (index) => {
    setFormData({
      nome: contas[index].nome,
      tipo: contas[index].tipo,
      saldo: contas[index].saldo
    });
    setEditingIndex(index);
    setFormVisible(true);
  };
  
  // Reseta o formulário
  const resetForm = () => {
    setFormData({
      nome: '',
      tipo: 'corrente',
      saldo: 0
    });
    setFormErrors({});
    setFormVisible(false);
    setEditingIndex(null);
  };
  
  // Calcula o saldo total
  const saldoTotal = contas.reduce((acc, conta) => acc + conta.saldo, 0);
  
  // Handler para avançar para a próxima etapa
  const handleContinue = () => {
    onUpdateData('situacaoFinanceira', { contas });
    onNext();
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <div className="p-2 rounded-full bg-blue-100 text-blue-600 mr-3">
          <Landmark size={24} />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Suas Contas Bancárias</h2>
      </div>
      
      <p className="text-gray-600 mb-6">
        Cadastre todas as suas contas bancárias, incluindo conta corrente, poupança, 
        investimentos e até mesmo o dinheiro que você tem em espécie.
      </p>
      
      {/* Lista de contas */}
      {contas.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium text-gray-800">Contas cadastradas</h3>
            <div className="text-gray-600 font-medium">
              Total: <span className={saldoTotal >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(saldoTotal)}
              </span>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {contas.map((conta, index) => (
              <div 
                key={conta.id} 
                className={`flex justify-between items-center p-4 ${
                  index !== contas.length - 1 ? 'border-b border-gray-200' : ''
                }`}
              >
                <div className="flex items-center">
                  <div className={`p-2 rounded-full mr-3 ${
                    conta.tipo === 'corrente' ? 'bg-blue-100 text-blue-600' :
                    conta.tipo === 'poupanca' ? 'bg-green-100 text-green-600' :
                    conta.tipo === 'investimento' ? 'bg-purple-100 text-purple-600' :
                    conta.tipo === 'dinheiro' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {conta.tipo === 'dinheiro' ? (
                      <Wallet size={18} />
                    ) : (
                      <Landmark size={18} />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">{conta.nome}</div>
                    <div className="text-sm text-gray-500">
                      {tiposContas.find(t => t.id === conta.tipo)?.nome || 'Conta'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className={`font-medium mr-4 ${conta.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(conta.saldo)}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => handleEditConta(index)}
                      className="p-1.5 text-gray-400 hover:text-blue-500 rounded-full hover:bg-gray-100"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveConta(index)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Formulário para adicionar/editar conta */}
      {formVisible ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            {editingIndex !== null ? 'Editar Conta' : 'Nova Conta'}
          </h3>
          
          <div className="space-y-4">
            {/* Nome da Conta */}
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
                Nome da Conta *
              </label>
              <input
                type="text"
                id="nome"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                placeholder="Ex: Nubank, Itaú, Carteira"
                className={`block w-full rounded-md ${
                  formErrors.nome 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
              />
              {formErrors.nome && (
                <p className="mt-1 text-sm text-red-600">{formErrors.nome}</p>
              )}
            </div>
            
            {/* Tipo de Conta */}
            <div>
              <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Conta *
              </label>
              <select
                id="tipo"
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                className={`block w-full rounded-md ${
                  formErrors.tipo 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
              >
                {tiposContas.map(tipo => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nome}
                  </option>
                ))}
              </select>
              {formErrors.tipo && (
                <p className="mt-1 text-sm text-red-600">{formErrors.tipo}</p>
              )}
            </div>
            
            {/* Saldo da Conta */}
            <div>
              <label htmlFor="saldo" className="block text-sm font-medium text-gray-700 mb-1">
                Saldo Atual *
              </label>
              <InputMoney
                id="saldo"
                name="saldo"
                value={formData.saldo}
                onChange={handleSaldoChange}
                placeholder="R$ 0,00"
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '0.625rem 0.75rem',
                  fontSize: '0.875rem',
                  borderRadius: '0.375rem',
                  border: formErrors.saldo ? '1px solid #ef4444' : '1px solid #d1d5db'
                }}
              />
              <p className="mt-1 text-xs text-gray-500">
                Use valores negativos para contas com saldo negativo (cheque especial)
              </p>
              {formErrors.saldo && (
                <p className="mt-1 text-sm text-red-600">{formErrors.saldo}</p>
              )}
            </div>
            
            {/* Botões de Ação */}
            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddOrUpdateConta}
                className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                {editingIndex !== null ? 'Atualizar' : 'Adicionar'} Conta
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setFormVisible(true)}
          className="flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <Plus size={16} className="mr-2" />
          Adicionar Nova Conta
        </button>
      )}
      
      {/* Resumo e informações adicionais */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <DollarSign className="h-5 w-5 text-blue-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              {contas.length > 0 ? (
                <>
                  Você cadastrou <strong>{contas.length}</strong> {contas.length === 1 ? 'conta' : 'contas'} com um saldo total de{' '}
                  <strong className={saldoTotal >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(saldoTotal)}
                  </strong>.
                </>
              ) : (
                'Adicione pelo menos uma conta para continuar. Se você não possui conta bancária, adicione "Dinheiro em espécie" como uma conta.'
              )}
            </p>
          </div>
        </div>
      </div>
      
      {/* Controles da etapa */}
      <div className="pt-4">
        <button
          onClick={handleContinue}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            contas.length > 0
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          disabled={contas.length === 0}
        >
          Continuar
        </button>
        
        {contas.length === 0 && (
          <p className="mt-2 text-sm text-amber-600">
            Adicione pelo menos uma conta para continuar.
          </p>
        )}
      </div>
    </div>
  );
};

ContasEtapa.propTypes = {
  data: PropTypes.object,
  onUpdateData: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired
};

export default ContasEtapa;
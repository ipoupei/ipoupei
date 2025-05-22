import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { CreditCard, Plus, Trash2, Edit2, Calendar, DollarSign, HelpCircle, Info } from 'lucide-react';
import InputMoney from '../../../Components/ui/InputMoney';
import { formatCurrency } from '../../../utils/formatCurrency';

/**
 * Componente da etapa de cartões de crédito
 * Permite adicionar, editar e remover cartões de crédito, além de gerenciar parcelamentos
 */
const CartoesEtapa = ({ data, onUpdateData, onNext }) => {
  // Estado local para os cartões
  const [cartoes, setCartoes] = useState([]);
  
  // Estado para o formulário de cartão
  const [formVisible, setFormVisible] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    bandeira: 'visa',
    limite: 0,
    faturaAtual: 0,
    diaFechamento: 1,
    diaVencimento: 10
  });
  
  // Estado para o formulário de parcelamento
  const [parcelamentos, setParcelamentos] = useState([]);
  const [parcelamentoFormVisible, setParcelamentoFormVisible] = useState(false);
  const [editingParcelamentoIndex, setEditingParcelamentoIndex] = useState(null);
  const [cartaoParcelamentoIndex, setCartaoParcelamentoIndex] = useState(null);
  const [parcelamentoFormData, setParcelamentoFormData] = useState({
    descricao: '',
    valorParcela: 0,
    parcelasRestantes: 1,
    totalParcelas: 1
  });
  
  // Estado para erros nos formulários
  const [formErrors, setFormErrors] = useState({});
  const [parcelamentoFormErrors, setParcelamentoFormErrors] = useState({});
  
  // Carrega cartões e parcelamentos existentes (se houver)
  useEffect(() => {
    if (data?.situacaoFinanceira?.cartoes && data.situacaoFinanceira.cartoes.length > 0) {
      setCartoes(data.situacaoFinanceira.cartoes);
    }
    
    if (data?.situacaoFinanceira?.parcelamentos && data.situacaoFinanceira.parcelamentos.length > 0) {
      setParcelamentos(data.situacaoFinanceira.parcelamentos);
    }
  }, [data]);
  
  // Opções de bandeiras de cartão
  const bandeiraOptions = [
    { id: 'visa', nome: 'Visa' },
    { id: 'mastercard', nome: 'Mastercard' },
    { id: 'elo', nome: 'Elo' },
    { id: 'amex', nome: 'American Express' },
    { id: 'hipercard', nome: 'Hipercard' },
    { id: 'outro', nome: 'Outro' }
  ];
  
  // Manipulador para mudanças nos campos do formulário de cartão
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
  
  // Manipulador para campos monetários do formulário de cartão
  const handleMoneyChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpa erro do campo, se existir
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: null }));
    }
  };
  
  // Manipulador para mudanças nos campos do formulário de parcelamento
  const handleParcelamentoChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'parcelasRestantes' || name === 'totalParcelas') {
      // Para campos numéricos, garantir que sejam inteiros positivos
      const numValue = parseInt(value, 10);
      if (isNaN(numValue) || numValue < 1) return;
      
      setParcelamentoFormData(prev => ({
        ...prev,
        [name]: numValue
      }));
    } else {
      setParcelamentoFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Limpa erro do campo, se existir
    if (parcelamentoFormErrors[name]) {
      setParcelamentoFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  // Manipulador para campo monetário do parcelamento
  const handleParcelamentoMoneyChange = (value) => {
    setParcelamentoFormData(prev => ({
      ...prev,
      valorParcela: value
    }));
    
    // Limpa erro do campo, se existir
    if (parcelamentoFormErrors.valorParcela) {
      setParcelamentoFormErrors(prev => ({ ...prev, valorParcela: null }));
    }
  };
  
  // Sincroniza parcelasRestantes e totalParcelas ao editar
  const handleParcelasRestantesChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (isNaN(value) || value < 1) return;
    
    // Se for novo parcelamento, atualiza totalParcelas também
    if (editingParcelamentoIndex === null) {
      setParcelamentoFormData(prev => ({
        ...prev,
        parcelasRestantes: value,
        totalParcelas: value
      }));
    } else {
      setParcelamentoFormData(prev => ({
        ...prev,
        parcelasRestantes: value
      }));
    }
    
    // Limpa erro do campo, se existir
    if (parcelamentoFormErrors.parcelasRestantes) {
      setParcelamentoFormErrors(prev => ({ ...prev, parcelasRestantes: null }));
    }
  };
  
  // Valida o formulário de cartão antes de enviar
  const validateCartaoForm = () => {
    const errors = {};
    
    if (!formData.nome.trim()) {
      errors.nome = 'Nome do cartão é obrigatório';
    }
    
    if (!formData.bandeira) {
      errors.bandeira = 'Selecione a bandeira do cartão';
    }
    
    if (formData.limite < 0) {
      errors.limite = 'Limite não pode ser negativo';
    }
    
    if (formData.faturaAtual < 0) {
      errors.faturaAtual = 'Valor da fatura não pode ser negativo';
    }
    
    if (formData.diaFechamento < 1 || formData.diaFechamento > 31) {
      errors.diaFechamento = 'Dia de fechamento inválido';
    }
    
    if (formData.diaVencimento < 1 || formData.diaVencimento > 31) {
      errors.diaVencimento = 'Dia de vencimento inválido';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Valida o formulário de parcelamento antes de enviar
  const validateParcelamentoForm = () => {
    const errors = {};
    
    if (!parcelamentoFormData.descricao.trim()) {
      errors.descricao = 'Descrição é obrigatória';
    }
    
    if (parcelamentoFormData.valorParcela <= 0) {
      errors.valorParcela = 'Valor da parcela deve ser maior que zero';
    }
    
    if (parcelamentoFormData.parcelasRestantes < 1) {
      errors.parcelasRestantes = 'Número de parcelas deve ser pelo menos 1';
    }
    
    if (parcelamentoFormData.totalParcelas < parcelamentoFormData.parcelasRestantes) {
      errors.totalParcelas = 'Total de parcelas não pode ser menor que parcelas restantes';
    }
    
    setParcelamentoFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Adiciona ou atualiza um cartão
  const handleAddOrUpdateCartao = () => {
    if (!validateCartaoForm()) return;
    
    const novoCartao = {
      ...formData,
      id: editingIndex !== null ? cartoes[editingIndex].id : `cartao_${Date.now()}`
    };
    
    if (editingIndex !== null) {
      // Atualizando cartão existente
      const novosCartoes = [...cartoes];
      novosCartoes[editingIndex] = novoCartao;
      setCartoes(novosCartoes);
    } else {
      // Adicionando novo cartão
      setCartoes([...cartoes, novoCartao]);
    }
    
    // Reseta o formulário
    resetCartaoForm();
  };
  
  // Remove um cartão
  const handleRemoveCartao = (index) => {
    // Remover o cartão
    const novosCartoes = [...cartoes];
    const cartaoId = novosCartoes[index].id;
    novosCartoes.splice(index, 1);
    setCartoes(novosCartoes);
    
    // Remover também parcelamentos associados a este cartão
    const novosParcelamentos = parcelamentos.filter(p => p.cartaoId !== cartaoId);
    setParcelamentos(novosParcelamentos);
  };
  
  // Inicia a edição de um cartão
  const handleEditCartao = (index) => {
    setFormData({
      nome: cartoes[index].nome,
      bandeira: cartoes[index].bandeira || 'visa',
      limite: cartoes[index].limite || 0,
      faturaAtual: cartoes[index].faturaAtual || 0,
      diaFechamento: cartoes[index].diaFechamento || 1,
      diaVencimento: cartoes[index].diaVencimento || 10
    });
    setEditingIndex(index);
    setFormVisible(true);
  };
  
  // Reseta o formulário de cartão
  const resetCartaoForm = () => {
    setFormData({
      nome: '',
      bandeira: 'visa',
      limite: 0,
      faturaAtual: 0,
      diaFechamento: 1,
      diaVencimento: 10
    });
    setFormErrors({});
    setFormVisible(false);
    setEditingIndex(null);
  };
  
  // Abre o formulário de parcelamento
  const handleOpenParcelamentoForm = (cartaoIndex) => {
    setCartaoParcelamentoIndex(cartaoIndex);
    setParcelamentoFormVisible(true);
    setEditingParcelamentoIndex(null);
    setParcelamentoFormData({
      descricao: '',
      valorParcela: 0,
      parcelasRestantes: 1,
      totalParcelas: 1
    });
  };
  
  // Adiciona ou atualiza um parcelamento
  const handleAddOrUpdateParcelamento = () => {
    if (!validateParcelamentoForm()) return;
    
    const novoParcelamento = {
      ...parcelamentoFormData,
      cartaoId: cartoes[cartaoParcelamentoIndex].id,
      id: editingParcelamentoIndex !== null ? parcelamentos[editingParcelamentoIndex].id : `parcelamento_${Date.now()}`
    };
    
    if (editingParcelamentoIndex !== null) {
      // Atualizando parcelamento existente
      const novosParcelamentos = [...parcelamentos];
      novosParcelamentos[editingParcelamentoIndex] = novoParcelamento;
      setParcelamentos(novosParcelamentos);
    } else {
      // Adicionando novo parcelamento
      setParcelamentos([...parcelamentos, novoParcelamento]);
    }
    
    // Reseta o formulário
    resetParcelamentoForm();
  };
  
  // Remove um parcelamento
  const handleRemoveParcelamento = (index) => {
    const novosParcelamentos = [...parcelamentos];
    novosParcelamentos.splice(index, 1);
    setParcelamentos(novosParcelamentos);
  };
  
  // Inicia a edição de um parcelamento
  const handleEditParcelamento = (index) => {
    const parcelamento = parcelamentos[index];
    const cartaoIndex = cartoes.findIndex(c => c.id === parcelamento.cartaoId);
    
    if (cartaoIndex === -1) return; // cartão não encontrado
    
    setParcelamentoFormData({
      descricao: parcelamento.descricao,
      valorParcela: parcelamento.valorParcela,
      parcelasRestantes: parcelamento.parcelasRestantes,
      totalParcelas: parcelamento.totalParcelas
    });
    setEditingParcelamentoIndex(index);
    setCartaoParcelamentoIndex(cartaoIndex);
    setParcelamentoFormVisible(true);
  };
  
  // Reseta o formulário de parcelamento
  const resetParcelamentoForm = () => {
    setParcelamentoFormData({
      descricao: '',
      valorParcela: 0,
      parcelasRestantes: 1,
      totalParcelas: 1
    });
    setParcelamentoFormErrors({});
    setParcelamentoFormVisible(false);
    setEditingParcelamentoIndex(null);
    setCartaoParcelamentoIndex(null);
  };
  
  // Calcula o total da fatura atual
  const totalFatura = cartoes.reduce((acc, cartao) => acc + (cartao.faturaAtual || 0), 0);
  
  // Calcula o total de parcelas futuras
  const totalParcelasFuturas = parcelamentos.reduce(
    (acc, parcelamento) => acc + (parcelamento.valorParcela * parcelamento.parcelasRestantes), 
    0
  );
  
  // Handler para avançar para a próxima etapa
  const handleContinue = () => {
    onUpdateData('situacaoFinanceira', { 
      cartoes,
      parcelamentos
    });
    onNext();
  };
  
  // Filtrar parcelamentos por cartão
  const getParcelamentosPorCartao = (cartaoId) => {
    return parcelamentos.filter(p => p.cartaoId === cartaoId);
  };
  
  // Verificar se o usuário possui algum cartão ou parcelamento
  const temCartaoOuParcelamento = cartoes.length > 0 || parcelamentos.length > 0;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <div className="p-2 rounded-full bg-purple-100 text-purple-600 mr-3">
          <CreditCard size={24} />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Seus Cartões de Crédito</h2>
      </div>
      
      <p className="text-gray-600 mb-6">
        Cadastre seus cartões de crédito e parcelamentos ativos. Isso nos ajudará a ter uma visão 
        completa do seu fluxo financeiro e compromissos futuros.
      </p>
      
      {/* Lista de cartões */}
      {cartoes.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium text-gray-800">Cartões cadastrados</h3>
            <div className="text-gray-600 font-medium">
              Fatura atual: <span className="text-purple-600">
                {formatCurrency(totalFatura)}
              </span>
            </div>
          </div>
          
          <div className="space-y-4">
            {cartoes.map((cartao, index) => {
              // Obter parcelamentos deste cartão
              const cartaoParcelamentos = getParcelamentosPorCartao(cartao.id);
              
              return (
                <div 
                  key={cartao.id} 
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden"
                >
                  {/* Cabeçalho do cartão */}
                  <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center">
                      <div className="p-2 rounded-full bg-purple-100 text-purple-600 mr-3">
                        <CreditCard size={18} />
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">{cartao.nome}</div>
                        <div className="text-sm text-gray-500">
                          {bandeiraOptions.find(b => b.id === cartao.bandeira)?.nome || 'Cartão'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div>
                        <div className="text-xs text-gray-500">Limite</div>
                        <div className="font-medium text-gray-800">{formatCurrency(cartao.limite || 0)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Fatura Atual</div>
                        <div className="font-medium text-purple-600">{formatCurrency(cartao.faturaAtual || 0)}</div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => handleEditCartao(index)}
                          className="p-1.5 text-gray-400 hover:text-blue-500 rounded-full hover:bg-gray-100"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveCartao(index)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Seção de parcelamentos */}
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-gray-700">Parcelamentos</h4>
                      <button
                        type="button"
                        onClick={() => handleOpenParcelamentoForm(index)}
                        className="text-sm text-purple-600 hover:text-purple-800 flex items-center"
                      >
                        <Plus size={14} className="mr-1" />
                        Adicionar Parcelamento
                      </button>
                    </div>
                    
                    {cartaoParcelamentos.length > 0 ? (
                      <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                        {cartaoParcelamentos.map((parcelamento, parcelamentoIndex) => {
                          const parcelamentoGlobalIndex = parcelamentos.findIndex(p => p.id === parcelamento.id);
                          
                          return (
                            <div key={parcelamento.id} className="flex justify-between items-center p-3">
                              <div>
                                <div className="font-medium text-gray-800">{parcelamento.descricao}</div>
                                <div className="text-sm text-gray-500">
                                  {parcelamento.parcelasRestantes} de {parcelamento.totalParcelas} parcelas
                                </div>
                              </div>
                              <div className="flex items-center">
                                <div className="font-medium text-gray-800 mr-4">
                                  {formatCurrency(parcelamento.valorParcela)}
                                </div>
                                <div className="flex space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => handleEditParcelamento(parcelamentoGlobalIndex)}
                                    className="p-1 text-gray-400 hover:text-blue-500 rounded-full hover:bg-gray-100"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveParcelamento(parcelamentoGlobalIndex)}
                                    className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm text-center py-4">
                        Nenhum parcelamento cadastrado para este cartão
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Formulário para adicionar/editar cartão */}
      {formVisible ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            {editingIndex !== null ? 'Editar Cartão' : 'Novo Cartão'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nome do Cartão */}
            <div className="md:col-span-2">
              <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Cartão *
              </label>
              <input
                type="text"
                id="nome"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                placeholder="Ex: Nubank, Itaú Visa, Bradesco Elo"
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
            
            {/* Bandeira */}
            <div>
              <label htmlFor="bandeira" className="block text-sm font-medium text-gray-700 mb-1">
                Bandeira *
              </label>
              <select
                id="bandeira"
                name="bandeira"
                value={formData.bandeira}
                onChange={handleChange}
                className={`block w-full rounded-md ${
                  formErrors.bandeira 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
              >
                {bandeiraOptions.map(bandeira => (
                  <option key={bandeira.id} value={bandeira.id}>
                    {bandeira.nome}
                  </option>
                ))}
              </select>
              {formErrors.bandeira && (
                <p className="mt-1 text-sm text-red-600">{formErrors.bandeira}</p>
              )}
            </div>
            
            {/* Limite do Cartão */}
            <div>
              <label htmlFor="limite" className="block text-sm font-medium text-gray-700 mb-1">
                Limite do Cartão
              </label>
              <InputMoney
                id="limite"
                name="limite"
                value={formData.limite}
                onChange={(value) => handleMoneyChange('limite', value)}
                placeholder="R$ 0,00"
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '0.625rem 0.75rem',
                  fontSize: '0.875rem',
                  borderRadius: '0.375rem',
                  border: formErrors.limite ? '1px solid #ef4444' : '1px solid #d1d5db'
                }}
              />
              {formErrors.limite && (
                <p className="mt-1 text-sm text-red-600">{formErrors.limite}</p>
              )}
            </div>
            
            {/* Fatura Atual */}
            <div>
              <label htmlFor="faturaAtual" className="block text-sm font-medium text-gray-700 mb-1">
                Fatura Atual
                <div className="relative group inline-block ml-1">
                  <HelpCircle size={14} className="text-gray-400 cursor-help" />
                  <div className="absolute left-0 w-48 p-2 bg-white rounded-md shadow-lg border border-gray-200 text-xs text-gray-600 hidden group-hover:block z-10">
                    Valor atual da fatura que ainda não foi paga
                  </div>
                </div>
              </label>
              <InputMoney
                id="faturaAtual"
                name="faturaAtual"
                value={formData.faturaAtual}
                onChange={(value) => handleMoneyChange('faturaAtual', value)}
                placeholder="R$ 0,00"
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '0.625rem 0.75rem',
                  fontSize: '0.875rem',
                  borderRadius: '0.375rem',
                  border: formErrors.faturaAtual ? '1px solid #ef4444' : '1px solid #d1d5db'
                }}
              />
              {formErrors.faturaAtual && (
                <p className="mt-1 text-sm text-red-600">{formErrors.faturaAtual}</p>
              )}
            </div>
            
            {/* Dia do Fechamento */}
            <div>
              <label htmlFor="diaFechamento" className="block text-sm font-medium text-gray-700 mb-1">
                Dia do Fechamento
              </label>
              <input
                type="number"
                id="diaFechamento"
                name="diaFechamento"
                value={formData.diaFechamento}
                onChange={handleChange}
                min="1"
                max="31"
                className={`block w-full rounded-md ${
                  formErrors.diaFechamento 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
              />
              {formErrors.diaFechamento && (
                <p className="mt-1 text-sm text-red-600">{formErrors.diaFechamento}</p>
              )}
            </div>
            
            {/* Dia do Vencimento */}
            <div>
              <label htmlFor="diaVencimento" className="block text-sm font-medium text-gray-700 mb-1">
                Dia do Vencimento
              </label>
              <input
                type="number"
                id="diaVencimento"
                name="diaVencimento"
                value={formData.diaVencimento}
                onChange={handleChange}
                min="1"
                max="31"
                className={`block w-full rounded-md ${
                  formErrors.diaVencimento 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
              />
              {formErrors.diaVencimento && (
                <p className="mt-1 text-sm text-red-600">{formErrors.diaVencimento}</p>
              )}
            </div>
          </div>
          
          {/* Botões de Ação */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={resetCartaoForm}
              className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAddOrUpdateCartao}
              className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              {editingIndex !== null ? 'Atualizar' : 'Adicionar'} Cartão
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setFormVisible(true)}
          className="flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <Plus size={16} className="mr-2" />
          Adicionar Novo Cartão
        </button>
      )}
      
      {/* Formulário para adicionar/editar parcelamento */}
      {parcelamentoFormVisible && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-5 mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            {editingParcelamentoIndex !== null ? 'Editar Parcelamento' : 'Novo Parcelamento'}
            {cartaoParcelamentoIndex !== null && (
              <span className="text-sm text-gray-600 block">
                Cartão: {cartoes[cartaoParcelamentoIndex]?.nome}
              </span>
            )}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Descrição do Parcelamento */}
            <div className="md:col-span-2">
              <label htmlFor="descricaoParcelamento" className="block text-sm font-medium text-gray-700 mb-1">
                Descrição do Parcelamento *
              </label>
              <input
                type="text"
                id="descricaoParcelamento"
                name="descricao"
                value={parcelamentoFormData.descricao}
                onChange={handleParcelamentoChange}
                placeholder="Ex: Notebook Dell, Geladeira, Móveis da sala"
                className={`block w-full rounded-md ${
                  parcelamentoFormErrors.descricao 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
              />
              {parcelamentoFormErrors.descricao && (
                <p className="mt-1 text-sm text-red-600">{parcelamentoFormErrors.descricao}</p>
              )}
            </div>
            
            {/* Valor da Parcela */}
            <div>
              <label htmlFor="valorParcelaParcelamento" className="block text-sm font-medium text-gray-700 mb-1">
                Valor da Parcela *
              </label>
              <InputMoney
                id="valorParcelaParcelamento"
                name="valorParcela"
                value={parcelamentoFormData.valorParcela}
                onChange={handleParcelamentoMoneyChange}
                placeholder="R$ 0,00"
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '0.625rem 0.75rem',
                  fontSize: '0.875rem',
                  borderRadius: '0.375rem',
                  border: parcelamentoFormErrors.valorParcela ? '1px solid #ef4444' : '1px solid #d1d5db'
                }}
              />
              {parcelamentoFormErrors.valorParcela && (
                <p className="mt-1 text-sm text-red-600">{parcelamentoFormErrors.valorParcela}</p>
              )}
            </div>
            
            {/* Parcelas Restantes */}
            <div>
              <label htmlFor="parcelasRestantesParcelamento" className="block text-sm font-medium text-gray-700 mb-1">
                Parcelas Restantes *
              </label>
              <input
                type="number"
                id="parcelasRestantesParcelamento"
                name="parcelasRestantes"
                value={parcelamentoFormData.parcelasRestantes}
                onChange={handleParcelasRestantesChange}
                min="1"
                className={`block w-full rounded-md ${
                  parcelamentoFormErrors.parcelasRestantes 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
              />
              {parcelamentoFormErrors.parcelasRestantes && (
                <p className="mt-1 text-sm text-red-600">{parcelamentoFormErrors.parcelasRestantes}</p>
              )}
            </div>
            
            {/* Total de Parcelas */}
            <div>
              <label htmlFor="totalParcelasParcelamento" className="block text-sm font-medium text-gray-700 mb-1">
                Total de Parcelas *
              </label>
              <input
                type="number"
                id="totalParcelasParcelamento"
                name="totalParcelas"
                value={parcelamentoFormData.totalParcelas}
                onChange={handleParcelamentoChange}
                min="1"
                className={`block w-full rounded-md ${
                  parcelamentoFormErrors.totalParcelas 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
              />
              {parcelamentoFormErrors.totalParcelas && (
                <p className="mt-1 text-sm text-red-600">{parcelamentoFormErrors.totalParcelas}</p>
              )}
            </div>
          </div>
          
          {/* Botões de Ação */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={resetParcelamentoForm}
              className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAddOrUpdateParcelamento}
              className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              {editingParcelamentoIndex !== null ? 'Atualizar' : 'Adicionar'} Parcelamento
            </button>
          </div>
        </div>
      )}
      
      {/* Resumo de cartões e parcelamentos */}
      {temCartaoOuParcelamento && (
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <Info className="h-5 w-5 text-purple-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-purple-700">
                Você tem <strong>{cartoes.length}</strong> cartão(ões) cadastrado(s) com fatura atual de{' '}
                <strong>{formatCurrency(totalFatura)}</strong>
                {totalParcelasFuturas > 0 && (
                  <> e <strong>{formatCurrency(totalParcelasFuturas)}</strong> em parcelamentos futuros</>
                )}.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Informação sobre pular etapa */}
      {!temCartaoOuParcelamento && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <DollarSign className="h-5 w-5 text-blue-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Se você não possui cartões de crédito ou não tem parcelamentos ativos, 
                pode prosseguir para a próxima etapa.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Controles da etapa */}
      <div className="pt-4">
        <button
          onClick={handleContinue}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Continuar
        </button>
      </div>
    </div>
  );
};

CartoesEtapa.propTypes = {
  data: PropTypes.object,
  onUpdateData: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired
};

export default CartoesEtapa;
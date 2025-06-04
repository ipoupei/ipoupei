import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, Plus, Trash2, Edit2, HelpCircle, DollarSign } from 'lucide-react';
import InputMoney from '../../../Components/ui/InputMoney';
import { formatCurrency } from '@utils/formatCurrency';



/**
 * Componente da etapa de dívidas e financiamentos
 * Permite adicionar, editar e remover dívidas ativas (empréstimos, financiamentos, acordos)
 */
const DividasEtapa = ({ data, onUpdateData, onNext }) => {
  // Estado local para as dívidas
  const [dividas, setDividas] = useState([]);
  
  // Estado para o formulário de dívida
  const [formVisible, setFormVisible] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [formData, setFormData] = useState({
    descricao: '',
    instituicao: '',
    valorTotal: 0,
    valorParcela: 0,
    parcelasRestantes: 1,
    parcelasTotais: 1,
    situacao: 'em_dia'
  });
  
  // Estado para erros no formulário
  const [formErrors, setFormErrors] = useState({});
  
  // Carrega dívidas existentes (se houver)
  useEffect(() => {
    if (data?.situacaoFinanceira?.dividas && data.situacaoFinanceira.dividas.length > 0) {
      setDividas(data.situacaoFinanceira.dividas);
    }
  }, [data]);
  
  // Opções de situação da dívida
  const situacaoOptions = [
    { id: 'em_dia', nome: 'Em dia' },
    { id: 'atrasada', nome: 'Atrasada' },
    { id: 'renegociando', nome: 'Em renegociação' }
  ];
  
  // Opções comuns de instituições financeiras
  const instituicoesComuns = [
    'Banco do Brasil', 'Caixa Econômica Federal', 'Itaú', 'Bradesco', 'Santander',
    'Nubank', 'Inter', 'BMG', 'Losango', 'Cetelem', 'BV Financeira', 'Pan',
    'Casas Bahia', 'Magazine Luiza', 'Agibank', 'Credicard', 'Outro'
  ];
  
  // Manipulador para mudanças nos campos do formulário
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'parcelasRestantes' || name === 'parcelasTotais') {
      // Para campos numéricos, garantir que sejam inteiros positivos
      const numValue = parseInt(value, 10);
      if (isNaN(numValue) || numValue < 1) return;
      
      setFormData(prev => ({
        ...prev,
        [name]: numValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Limpa erro do campo, se existir
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  // Manipulador para campos monetários
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
  
  // Valida o formulário antes de enviar
  const validateForm = () => {
    const errors = {};
    
    if (!formData.descricao.trim()) {
      errors.descricao = 'Descrição da dívida é obrigatória';
    }
    
    if (!formData.instituicao.trim()) {
      errors.instituicao = 'Instituição é obrigatória';
    }
    
    if (formData.valorTotal <= 0) {
      errors.valorTotal = 'Valor total deve ser maior que zero';
    }
    
    if (formData.valorParcela <= 0) {
      errors.valorParcela = 'Valor da parcela deve ser maior que zero';
    }
    
    if (formData.parcelasRestantes < 1) {
      errors.parcelasRestantes = 'Número de parcelas deve ser pelo menos 1';
    }
    
    if (formData.parcelasTotais < formData.parcelasRestantes) {
      errors.parcelasTotais = 'Total de parcelas não pode ser menor que parcelas restantes';
    }
    
    // Validação lógica: valor total vs parcelas
    const valorTotalCalculado = formData.valorParcela * formData.parcelasTotais;
    if (Math.abs(valorTotalCalculado - formData.valorTotal) > formData.valorTotal * 0.1) {
      errors.valorTotal = 'Valor total inconsistente com valor da parcela × total de parcelas';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Adiciona ou atualiza uma dívida
  const handleAddOrUpdateDivida = () => {
    if (!validateForm()) return;
    
    const novaDivida = {
      ...formData,
      id: editingIndex !== null ? dividas[editingIndex].id : `divida_${Date.now()}`
    };
    
    if (editingIndex !== null) {
      // Atualizando uma dívida existente
      const novasDividas = [...dividas];
      novasDividas[editingIndex] = novaDivida;
      setDividas(novasDividas);
    } else {
      // Adicionando nova dívida
      setDividas([...dividas, novaDivida]);
    }
    
    // Reseta o formulário
    resetForm();
  };
  
  // Remove uma dívida
  const handleRemoveDivida = (index) => {
    const novasDividas = [...dividas];
    novasDividas.splice(index, 1);
    setDividas(novasDividas);
  };
  
  // Inicia a edição de uma dívida
  const handleEditDivida = (index) => {
    setFormData({
      descricao: dividas[index].descricao,
      instituicao: dividas[index].instituicao,
      valorTotal: dividas[index].valorTotal,
      valorParcela: dividas[index].valorParcela,
      parcelasRestantes: dividas[index].parcelasRestantes,
      parcelasTotais: dividas[index].parcelasTotais,
      situacao: dividas[index].situacao
    });
    setEditingIndex(index);
    setFormVisible(true);
  };
  
  // Reseta o formulário
  const resetForm = () => {
    setFormData({
      descricao: '',
      instituicao: '',
      valorTotal: 0,
      valorParcela: 0,
      parcelasRestantes: 1,
      parcelasTotais: 1,
      situacao: 'em_dia'
    });
    setFormErrors({});
    setFormVisible(false);
    setEditingIndex(null);
  };
  
  // Calcula totais para resumo
  const totalDividas = dividas.reduce((acc, divida) => acc + divida.valorTotal, 0);
  const totalParcelasMensais = dividas.reduce((acc, divida) => acc + divida.valorParcela, 0);
  const dividasAtrasadas = dividas.filter(d => d.situacao === 'atrasada').length;
  
  // Handler para avançar para a próxima etapa
  const handleContinue = () => {
    onUpdateData('situacaoFinanceira', { dividas });
    onNext();
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <div className="p-2 rounded-full bg-red-100 text-red-600 mr-3">
          <AlertTriangle size={24} />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Dívidas e Financiamentos</h2>
      </div>
      
      <p className="text-gray-600 mb-6">
        Liste todas as suas dívidas ativas: empréstimos pessoais, financiamentos, cartões de loja, 
        acordos de parcelamento, etc. Seja transparente - isso é essencial para seu diagnóstico.
      </p>
      
      {/* Lista de dívidas */}
      {dividas.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium text-gray-800">Dívidas cadastradas</h3>
            <div className="text-right text-sm">
              <div className="text-gray-600">
                Total devido: <span className="font-medium text-red-600">
                  {formatCurrency(totalDividas)}
                </span>
              </div>
              <div className="text-gray-600">
                Parcelas mensais: <span className="font-medium text-red-600">
                  {formatCurrency(totalParcelasMensais)}
                </span>
              </div>
              {dividasAtrasadas > 0 && (
                <div className="text-red-500 font-medium">
                  {dividasAtrasadas} em atraso
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {dividas.map((divida, index) => (
              <div 
                key={divida.id} 
                className={`flex justify-between items-center p-4 ${
                  index !== dividas.length - 1 ? 'border-b border-gray-200' : ''
                } ${divida.situacao === 'atrasada' ? 'bg-red-50' : ''}`}
              >
                <div className="flex items-center flex-1">
                  <div className={`p-2 rounded-full mr-3 ${
                    divida.situacao === 'em_dia' ? 'bg-green-100 text-green-600' :
                    divida.situacao === 'atrasada' ? 'bg-red-100 text-red-600' :
                    'bg-yellow-100 text-yellow-600'
                  }`}>
                    <AlertTriangle size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{divida.descricao}</div>
                    <div className="text-sm text-gray-500">{divida.instituicao}</div>
                    <div className="text-xs text-gray-400">
                      {divida.parcelasRestantes} de {divida.parcelasTotais} parcelas restantes
                    </div>
                  </div>
                </div>
                
                <div className="text-right mr-4">
                  <div className="font-medium text-red-600">{formatCurrency(divida.valorTotal)}</div>
                  <div className="text-sm text-gray-500">{formatCurrency(divida.valorParcela)}/mês</div>
                  <div className={`text-xs font-medium ${
                    divida.situacao === 'em_dia' ? 'text-green-600' :
                    divida.situacao === 'atrasada' ? 'text-red-600' :
                    'text-yellow-600'
                  }`}>
                    {situacaoOptions.find(s => s.id === divida.situacao)?.nome}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => handleEditDivida(index)}
                    className="p-1.5 text-gray-400 hover:text-blue-500 rounded-full hover:bg-gray-100"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveDivida(index)}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Formulário para adicionar/editar dívida */}
      {formVisible ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            {editingIndex !== null ? 'Editar Dívida' : 'Nova Dívida'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Descrição da Dívida */}
            <div className="md:col-span-2">
              <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 mb-1">
                Descrição da Dívida *
              </label>
              <input
                type="text"
                id="descricao"
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
                placeholder="Ex: Empréstimo pessoal, Financiamento do carro, Cartão Magazine"
                className={`block w-full rounded-md ${
                  formErrors.descricao 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
              />
              {formErrors.descricao && (
                <p className="mt-1 text-sm text-red-600">{formErrors.descricao}</p>
              )}
            </div>
            
            {/* Instituição */}
            <div>
              <label htmlFor="instituicao" className="block text-sm font-medium text-gray-700 mb-1">
                Instituição *
              </label>
              <select
                id="instituicao"
                name="instituicao"
                value={formData.instituicao}
                onChange={handleChange}
                className={`block w-full rounded-md ${
                  formErrors.instituicao 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
              >
                <option value="">Selecione a instituição</option>
                {instituicoesComuns.map(inst => (
                  <option key={inst} value={inst}>{inst}</option>
                ))}
              </select>
              {formErrors.instituicao && (
                <p className="mt-1 text-sm text-red-600">{formErrors.instituicao}</p>
              )}
            </div>
            
            {/* Situação da Dívida */}
            <div>
              <label htmlFor="situacao" className="block text-sm font-medium text-gray-700 mb-1">
                Situação Atual *
              </label>
              <select
                id="situacao"
                name="situacao"
                value={formData.situacao}
                onChange={handleChange}
                className="block w-full rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              >
                {situacaoOptions.map(situacao => (
                  <option key={situacao.id} value={situacao.id}>
                    {situacao.nome}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Valor Total da Dívida */}
            <div>
              <label htmlFor="valorTotal" className="block text-sm font-medium text-gray-700 mb-1">
                Valor Total da Dívida *
                <div className="relative group inline-block ml-1">
                  <HelpCircle size={14} className="text-gray-400 cursor-help" />
                  <div className="absolute left-0 w-48 p-2 bg-white rounded-md shadow-lg border border-gray-200 text-xs text-gray-600 hidden group-hover:block z-10">
                    Valor total que ainda deve ser pago (saldo devedor atual)
                  </div>
                </div>
              </label>
              <InputMoney
                id="valorTotal"
                name="valorTotal"
                value={formData.valorTotal}
                onChange={(value) => handleMoneyChange('valorTotal', value)}
                placeholder="R$ 0,00"
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '0.625rem 0.75rem',
                  fontSize: '0.875rem',
                  borderRadius: '0.375rem',
                  border: formErrors.valorTotal ? '1px solid #ef4444' : '1px solid #d1d5db'
                }}
              />
              {formErrors.valorTotal && (
                <p className="mt-1 text-sm text-red-600">{formErrors.valorTotal}</p>
              )}
            </div>
            
            {/* Valor da Parcela Mensal */}
            <div>
              <label htmlFor="valorParcela" className="block text-sm font-medium text-gray-700 mb-1">
                Valor da Parcela Mensal *
              </label>
              <InputMoney
                id="valorParcela"
                name="valorParcela"
                value={formData.valorParcela}
                onChange={(value) => handleMoneyChange('valorParcela', value)}
                placeholder="R$ 0,00"
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '0.625rem 0.75rem',
                  fontSize: '0.875rem',
                  borderRadius: '0.375rem',
                  border: formErrors.valorParcela ? '1px solid #ef4444' : '1px solid #d1d5db'
                }}
              />
              {formErrors.valorParcela && (
                <p className="mt-1 text-sm text-red-600">{formErrors.valorParcela}</p>
              )}
            </div>
            
            {/* Parcelas Restantes */}
            <div>
              <label htmlFor="parcelasRestantes" className="block text-sm font-medium text-gray-700 mb-1">
                Parcelas Restantes *
              </label>
              <input
                type="number"
                id="parcelasRestantes"
                name="parcelasRestantes"
                value={formData.parcelasRestantes}
                onChange={handleChange}
                min="1"
                className={`block w-full rounded-md ${
                  formErrors.parcelasRestantes 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
              />
              {formErrors.parcelasRestantes && (
                <p className="mt-1 text-sm text-red-600">{formErrors.parcelasRestantes}</p>
              )}
            </div>
            
            {/* Total de Parcelas */}
            <div>
              <label htmlFor="parcelasTotais" className="block text-sm font-medium text-gray-700 mb-1">
                Total de Parcelas *
              </label>
              <input
                type="number"
                id="parcelasTotais"
                name="parcelasTotais"
                value={formData.parcelasTotais}
                onChange={handleChange}
                min="1"
                className={`block w-full rounded-md ${
                  formErrors.parcelasTotais 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
              />
              {formErrors.parcelasTotais && (
                <p className="mt-1 text-sm text-red-600">{formErrors.parcelasTotais}</p>
              )}
            </div>
          </div>
          
          {/* Botões de Ação */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAddOrUpdateDivida}
              className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              {editingIndex !== null ? 'Atualizar' : 'Adicionar'} Dívida
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
          Adicionar Dívida
        </button>
      )}
      
      {/* Resumo e alertas */}
      {dividas.length > 0 && (
        <div className={`p-4 rounded-lg ${dividasAtrasadas > 0 ? 'bg-red-50' : 'bg-yellow-50'}`}>
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className={`h-5 w-5 ${dividasAtrasadas > 0 ? 'text-red-400' : 'text-yellow-400'}`} />
            </div>
            <div className="ml-3">
              <p className={`text-sm ${dividasAtrasadas > 0 ? 'text-red-700' : 'text-yellow-700'}`}>
                {dividasAtrasadas > 0 ? (
                  <>
                    <strong>Atenção:</strong> Você tem {dividasAtrasadas} dívida(s) em atraso. 
                    Isso pode estar prejudicando seu score e gerando juros adicionais.
                  </>
                ) : (
                  <>
                    Você tem <strong>{dividas.length}</strong> dívida(s) ativa(s) com um total de{' '}
                    <strong>{formatCurrency(totalParcelasMensais)}</strong> em parcelas mensais.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Informação sobre pular etapa */}
      {dividas.length === 0 && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <DollarSign className="h-5 w-5 text-blue-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Se você não possui dívidas ativas, pode prosseguir para a próxima etapa. 
                Parabéns por manter suas finanças em dia!
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

DividasEtapa.propTypes = {
  data: PropTypes.object,
  onUpdateData: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired
};

export default DividasEtapa;
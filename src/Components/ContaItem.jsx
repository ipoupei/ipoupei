// src/components/ContaItem.jsx
import React from 'react';
import { formatCurrency } from '../utils/formatCurrency';

/**
 * Componente para exibir uma conta bancária individual
 * com opções para exclusão
 */
const ContaItem = ({ conta, onDelete }) => {
  // Tipo de conta formatado para exibição
  const getTipoFormatado = (tipo) => {
    const tiposMap = {
      'corrente': 'Conta Corrente',
      'poupanca': 'Poupança',
      'investimento': 'Investimento',
      'dinheiro': 'Dinheiro Físico',
      'outros': 'Outros'
    };
    
    return tiposMap[tipo] || tipo;
  };

  // Obtém uma cor representativa para cada tipo de conta
  const getTipoColor = (tipo) => {
    const colorsMap = {
      'corrente': 'bg-blue-100 text-blue-800',
      'poupanca': 'bg-green-100 text-green-800',
      'investimento': 'bg-purple-100 text-purple-800',
      'dinheiro': 'bg-yellow-100 text-yellow-800',
      'outros': 'bg-gray-100 text-gray-800'
    };
    
    return colorsMap[tipo] || 'bg-gray-100 text-gray-800';
  };

  // Formata a data de criação
  const formatarData = (dataString) => {
    if (!dataString) return '';
    
    try {
      const data = new Date(dataString);
      return data.toLocaleDateString('pt-BR');
    } catch (e) {
      console.error('Erro ao formatar data:', e);
      return '';
    }
  };

  return (
    <div className="grid grid-cols-4 py-3 px-3 items-center hover:bg-gray-50">
      {/* Nome da conta e instituição */}
      <div>
        <div className="font-medium text-gray-800">{conta.nome}</div>
        {conta.instituicao && (
          <div className="text-sm text-gray-500">{conta.instituicao}</div>
        )}
      </div>
      
      {/* Tipo de conta */}
      <div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTipoColor(conta.tipo)}`}>
          {getTipoFormatado(conta.tipo)}
        </span>
      </div>
      
      {/* Saldo */}
      <div className={`font-medium ${conta.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        {formatCurrency(conta.saldo)}
      </div>
      
      {/* Ações */}
      <div className="flex justify-end">
        <button 
          onClick={onDelete}
          className="text-red-600 hover:text-red-800 focus:outline-none"
          aria-label="Excluir conta"
          title="Excluir conta"
        >
          {/* Ícone de lixeira (alternativa usando entidade HTML para ícone) */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ContaItem;
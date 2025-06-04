// src/Components/ModalPlaceholder.jsx
import React from 'react';
import BasicModal from './BasicModal';

/**
 * Componente placeholder para modais que ainda não foram implementados
 */
const ModalPlaceholder = ({ isOpen, onClose, title }) => {
  return (
    <BasicModal isOpen={isOpen} onClose={onClose} title={title || 'Em desenvolvimento'}>
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🚧</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Funcionalidade em desenvolvimento
        </h3>
        <p className="text-gray-600 mb-4">
          Esta funcionalidade será implementada em breve.
        </p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Fechar
        </button>
      </div>
    </BasicModal>
  );
};

// Componentes específicos para cada modal
export const ContasModal = ({ isOpen, onClose }) => (
  <ModalPlaceholder isOpen={isOpen} onClose={onClose} title="Gerenciar Contas" />
);

export const DespesasModal = ({ isOpen, onClose }) => (
  <ModalPlaceholder isOpen={isOpen} onClose={onClose} title="Lançar Despesas" />
);

export const ReceitasModal = ({ isOpen, onClose }) => (
  <ModalPlaceholder isOpen={isOpen} onClose={onClose} title="Lançar Receitas" />
);

export const DespesasCartaoModal = ({ isOpen, onClose }) => (
  <ModalPlaceholder isOpen={isOpen} onClose={onClose} title="Despesas Cartão" />
);

export const CategoriasModal = ({ isOpen, onClose }) => (
  <ModalPlaceholder isOpen={isOpen} onClose={onClose} title="Gerenciar Categorias" />
);

export const CartoesModal = ({ isOpen, onClose }) => (
  <ModalPlaceholder isOpen={isOpen} onClose={onClose} title="Gerenciar Cartões" />
);

export const DetalhesDoDiaModal = ({ isOpen, onClose, dia }) => (
  <BasicModal isOpen={isOpen} onClose={onClose} title={`Detalhes do dia ${dia?.day ? new Date(dia.day).getDate() : ''}`}>
    <div className="py-4">
      <div className="text-center mb-4">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
          <span className="text-blue-600">📅</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900">
          {dia?.day ? new Date(dia.day).toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
          }) : 'Detalhes do dia'}
        </h3>
      </div>
      
      {dia?.transactions ? (
        <div className="space-y-3">
          {dia.transactions.receitas > 0 && (
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-green-800 font-medium">Receitas:</span>
              <span className="text-green-600 font-bold">
                +{new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(dia.transactions.receitas)}
              </span>
            </div>
          )}
          
          {dia.transactions.despesas > 0 && (
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
              <span className="text-red-800 font-medium">Despesas:</span>
              <span className="text-red-600 font-bold">
                -{new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(dia.transactions.despesas)}
              </span>
            </div>
          )}
          
          <div className="border-t pt-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-800 font-medium">Saldo do dia:</span>
              <span className={`font-bold ${
                (dia.transactions.receitas - dia.transactions.despesas) >= 0 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(dia.transactions.receitas - dia.transactions.despesas)}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-4">
          Nenhuma transação registrada neste dia.
        </div>
      )}
      
      <div className="mt-6 text-center">
        <button
          onClick={onClose}
          className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Fechar
        </button>
      </div>
    </div>
  </BasicModal>
);

export default ModalPlaceholder;
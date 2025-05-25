import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '../utils/formatCurrency';
import BasicModal from './BasicModal';

/**
 * Modal para exibir detalhes das movimentações financeiras de um dia
 * Atualizado para mostrar o saldo do dia e distinguir entre programado e realizado
 */
const DetalhesDoDiaModal = ({ isOpen, onClose, dia }) => {
  // Se não há dados do dia, não renderiza o conteúdo
  if (!dia) return null;
  
  // Formata a data para exibição
  const dataFormatada = format(new Date(dia.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const dataCapitalizada = dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);
  
  // Separar movimentos por status (realizados e programados)
  const movimentosRealizados = dia.movimentos.filter(m => m.status === 'realizado');
  const movimentosProgramados = dia.movimentos.filter(m => m.status === 'programado');
  
  // Separar receitas e despesas para mostrar nos totais
  const receitasRealizadas = movimentosRealizados.filter(m => m.tipo === 'receita')
    .reduce((total, m) => total + m.valor, 0);
  const despesasRealizadas = movimentosRealizados.filter(m => m.tipo === 'despesa')
    .reduce((total, m) => total + m.valor, 0);
  
  const receitasProgramadas = movimentosProgramados.filter(m => m.tipo === 'receita')
    .reduce((total, m) => total + m.valor, 0);
  const despesasProgramadas = movimentosProgramados.filter(m => m.tipo === 'despesa')
    .reduce((total, m) => total + m.valor, 0);
  
  const saldoRealizado = receitasRealizadas - despesasRealizadas;
  const saldoProgramado = receitasProgramadas - despesasProgramadas;
  const saldoTotal = saldoRealizado + saldoProgramado;
  
  // Formata um movimento para exibição
  const formatarMovimento = (movimento) => {
    const classeValor = movimento.tipo === 'receita' ? 'valor-positivo' : 'valor-negativo';
    
    return (
      <div key={movimento.id} className="detalhe-movimento-item animate-slide-in-up" style={{animationDelay: `${movimento.index * 0.1}s`}}>
        <div className="movimento-info">
          <div className="movimento-descricao">{movimento.descricao}</div>
          <div className="movimento-categoria">
            <span className={`categoria-tag ${movimento.tipo}`}>
              {movimento.categoria}
            </span>
            <span className={`status-tag ${movimento.status}`}>
              {movimento.status === 'realizado' ? 'Realizado' : 'Programado'}
            </span>
          </div>
        </div>
        <div className={`movimento-valor ${classeValor}`}>
          {formatCurrency(movimento.valor)}
        </div>
      </div>
    );
  };

  return (
    <BasicModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Movimentações - ${dataCapitalizada}`}
    >
      <div className="detalhes-dia-container">
        {/* Resumo do dia - mais detalhado e visual */}
        <div className="resumo-dia gradient-primary text-white rounded-lg p-4 mb-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="resumo-secao">
              <h4 className="resumo-secao-titulo text-white opacity-90 text-sm font-medium mb-3">✅ Realizados</h4>
              <div className="space-y-2">
                <div className="resumo-item flex justify-between">
                  <span className="resumo-label text-white opacity-80">Receitas:</span>
                  <span className="resumo-valor font-semibold text-green-200">
                    {formatCurrency(receitasRealizadas)}
                  </span>
                </div>
                <div className="resumo-item flex justify-between">
                  <span className="resumo-label text-white opacity-80">Despesas:</span>
                  <span className="resumo-valor font-semibold text-red-200">
                    {formatCurrency(despesasRealizadas)}
                  </span>
                </div>
                <div className="resumo-item subtotal flex justify-between pt-2 border-t border-white border-opacity-20">
                  <span className="resumo-label text-white font-medium">Saldo:</span>
                  <span className={`resumo-valor font-bold ${saldoRealizado >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                    {formatCurrency(saldoRealizado)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="resumo-secao">
              <h4 className="resumo-secao-titulo text-white opacity-90 text-sm font-medium mb-3">📅 Programados</h4>
              <div className="space-y-2">
                <div className="resumo-item flex justify-between">
                  <span className="resumo-label text-white opacity-80">Receitas:</span>
                  <span className="resumo-valor font-semibold text-green-200">
                    {formatCurrency(receitasProgramadas)}
                  </span>
                </div>
                <div className="resumo-item flex justify-between">
                  <span className="resumo-label text-white opacity-80">Despesas:</span>
                  <span className="resumo-valor font-semibold text-red-200">
                    {formatCurrency(despesasProgramadas)}
                  </span>
                </div>
                <div className="resumo-item subtotal flex justify-between pt-2 border-t border-white border-opacity-20">
                  <span className="resumo-label text-white font-medium">Saldo:</span>
                  <span className={`resumo-valor font-bold ${saldoProgramado >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                    {formatCurrency(saldoProgramado)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Total do dia destacado */}
          <div className="resumo-item total flex justify-between items-center mt-4 pt-4 border-t-2 border-white border-opacity-30">
            <span className="resumo-label text-white text-lg font-semibold">💰 Saldo do dia:</span>
            <span className={`resumo-valor text-xl font-bold ${saldoTotal >= 0 ? 'text-green-200' : 'text-red-200'}`}>
              {formatCurrency(saldoTotal)}
            </span>
          </div>
        </div>
        
        {/* Movimentos Realizados */}
        {movimentosRealizados.length > 0 && (
          <div className="secao-movimentos animate-slide-in-up stagger-1">
            <h3 className="secao-titulo flex items-center text-lg font-semibold text-gray-800 mb-4">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Movimentações Realizadas
            </h3>
            <div className="lista-movimentos space-y-2">
              {movimentosRealizados.map((movimento, index) => formatarMovimento({...movimento, index}))}
            </div>
          </div>
        )}
        
        {/* Movimentos Programados */}
        {movimentosProgramados.length > 0 && (
          <div className="secao-movimentos animate-slide-in-up stagger-2">
            <h3 className="secao-titulo flex items-center text-lg font-semibold text-gray-800 mb-4">
              <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
              Movimentações Programadas
            </h3>
            <div className="lista-movimentos space-y-2">
              {movimentosProgramados.map((movimento, index) => formatarMovimento({...movimento, index}))}
            </div>
          </div>
        )}
        
        {/* Mensagem se não houver movimentos */}
        {dia.movimentos.length === 0 && (
          <div className="sem-movimentos text-center py-12 animate-fade-in">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📝</span>
            </div>
            <p className="text-gray-500 text-lg">Não há movimentações registradas para este dia.</p>
            <p className="text-gray-400 text-sm mt-2">Adicione receitas ou despesas para começar a acompanhar suas finanças.</p>
          </div>
        )}
        
        {/* Card de resumo final mais visual */}
        {dia.movimentos.length > 0 && (
          <div className="saldo-dia-footer bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mt-6 border border-blue-100 animate-slide-in-up stagger-3">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="text-2xl mr-2">📊</span>
              Resumo Consolidado
            </h3>
            <div className="saldo-dia-conteudo">
              <div className="grid grid-cols-3 gap-4">
                <div className="saldo-dia-coluna text-center">
                  <div className="saldo-label text-sm text-gray-600 mb-1">💰 Receitas</div>
                  <div className="saldo-valor text-lg font-bold text-green-600">
                    {formatCurrency(receitasRealizadas + receitasProgramadas)}
                  </div>
                </div>
                <div className="saldo-dia-coluna text-center">
                  <div className="saldo-label text-sm text-gray-600 mb-1">💸 Despesas</div>
                  <div className="saldo-valor text-lg font-bold text-red-600">
                    {formatCurrency(despesasRealizadas + despesasProgramadas)}
                  </div>
                </div>
                <div className="saldo-dia-coluna total text-center bg-white rounded-lg p-3 shadow-sm">
                  <div className="saldo-label text-sm text-gray-600 mb-1">💵 Saldo Final</div>
                  <div className={`saldo-valor text-xl font-bold ${saldoTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(saldoTotal)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .detalhe-movimento-item {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          padding: 1rem;
          transition: all 0.2s ease;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .detalhe-movimento-item:hover {
          background-color: #f9fafb;
          border-color: #d1d5db;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .movimento-info {
          flex: 1;
        }
        
        .movimento-descricao {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.25rem;
        }
        
        .movimento-categoria {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }
        
        .categoria-tag {
          display: inline-block;
          padding: 0.125rem 0.5rem;
          border-radius: 0.375rem;
          font-size: 0.75rem;
          font-weight: 500;
        }
        
        .categoria-tag.receita {
          background-color: #dcfce7;
          color: #059669;
        }
        
        .categoria-tag.despesa {
          background-color: #fee2e2;
          color: #dc2626;
        }
        
        .status-tag {
          display: inline-block;
          padding: 0.125rem 0.5rem;
          border-radius: 0.375rem;
          font-size: 0.75rem;
          font-weight: 500;
          background-color: #f3f4f6;
          color: #6b7280;
        }
        
        .status-tag.realizado {
          background-color: #dcfce7;
          color: #059669;
        }
        
        .status-tag.programado {
          background-color: #fef3c7;
          color: #d97706;
        }
        
        .movimento-valor {
          font-weight: 700;
          font-size: 1rem;
        }
        
        .valor-positivo {
          color: #059669;
        }
        
        .valor-negativo {
          color: #dc2626;
        }
        
        .secao-movimentos {
          margin-bottom: 1.5rem;
        }
        
        .resumo-secao-titulo {
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
        }
        
        .animate-slide-in-up {
          animation: slideInUp 0.6s ease-out;
        }
        
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out;
        }
        
        .stagger-1 { animation-delay: 0.1s; }
        .stagger-2 { animation-delay: 0.2s; }
        .stagger-3 { animation-delay: 0.3s; }
        
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </BasicModal>
  );
};

export default DetalhesDoDiaModal;
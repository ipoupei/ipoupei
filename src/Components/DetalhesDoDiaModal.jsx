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
      <div key={movimento.id} className="detalhe-movimento-item">
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
        {/* Resumo do dia - mais detalhado */}
        <div className="resumo-dia">
          <div className="resumo-secao">
            <h4 className="resumo-secao-titulo">Realizados</h4>
            <div className="resumo-item">
              <span className="resumo-label">Receitas:</span>
              <span className="resumo-valor valor-positivo">
                {formatCurrency(receitasRealizadas)}
              </span>
            </div>
            <div className="resumo-item">
              <span className="resumo-label">Despesas:</span>
              <span className="resumo-valor valor-negativo">
                {formatCurrency(despesasRealizadas)}
              </span>
            </div>
            <div className="resumo-item subtotal">
              <span className="resumo-label">Saldo:</span>
              <span className={`resumo-valor ${saldoRealizado >= 0 ? 'valor-positivo' : 'valor-negativo'}`}>
                {formatCurrency(saldoRealizado)}
              </span>
            </div>
          </div>
          
          <div className="resumo-secao">
            <h4 className="resumo-secao-titulo">Programados</h4>
            <div className="resumo-item">
              <span className="resumo-label">Receitas:</span>
              <span className="resumo-valor valor-positivo">
                {formatCurrency(receitasProgramadas)}
              </span>
            </div>
            <div className="resumo-item">
              <span className="resumo-label">Despesas:</span>
              <span className="resumo-valor valor-negativo">
                {formatCurrency(despesasProgramadas)}
              </span>
            </div>
            <div className="resumo-item subtotal">
              <span className="resumo-label">Saldo:</span>
              <span className={`resumo-valor ${saldoProgramado >= 0 ? 'valor-positivo' : 'valor-negativo'}`}>
                {formatCurrency(saldoProgramado)}
              </span>
            </div>
          </div>
          
          <div className="resumo-item total">
            <span className="resumo-label">Saldo do dia:</span>
            <span className={`resumo-valor ${saldoTotal >= 0 ? 'valor-positivo' : 'valor-negativo'}`}>
              {formatCurrency(saldoTotal)}
            </span>
          </div>
        </div>
        
        {/* Movimentos Realizados */}
        {movimentosRealizados.length > 0 && (
          <div className="secao-movimentos">
            <h3 className="secao-titulo">Movimentações Realizadas</h3>
            <div className="lista-movimentos">
              {movimentosRealizados.map(formatarMovimento)}
            </div>
          </div>
        )}
        
        {/* Movimentos Programados */}
        {movimentosProgramados.length > 0 && (
          <div className="secao-movimentos">
            <h3 className="secao-titulo">Movimentações Programadas</h3>
            <div className="lista-movimentos">
              {movimentosProgramados.map(formatarMovimento)}
            </div>
          </div>
        )}
        
        {/* Mensagem se não houver movimentos */}
        {dia.movimentos.length === 0 && (
          <div className="sem-movimentos">
            <p>Não há movimentações registradas para este dia.</p>
          </div>
        )}
        
        {/* Saldo do dia destacado (implementação da sugestão) */}
        {dia.movimentos.length > 0 && (
          <div className="saldo-dia-footer">
            <h3>Resumo do dia</h3>
            <div className="saldo-dia-conteudo">
              <div className="saldo-dia-item">
                <div className="saldo-dia-coluna">
                  <div className="saldo-label">Receitas</div>
                  <div className="saldo-valor valor-positivo">
                    {formatCurrency(receitasRealizadas + receitasProgramadas)}
                  </div>
                </div>
                <div className="saldo-dia-coluna">
                  <div className="saldo-label">Despesas</div>
                  <div className="saldo-valor valor-negativo">
                    {formatCurrency(despesasRealizadas + despesasProgramadas)}
                  </div>
                </div>
                <div className="saldo-dia-coluna total">
                  <div className="saldo-label">Saldo</div>
                  <div className={`saldo-valor ${saldoTotal >= 0 ? 'valor-positivo' : 'valor-negativo'}`}>
                    {formatCurrency(saldoTotal)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </BasicModal>
  );
};

export default DetalhesDoDiaModal;
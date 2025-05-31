import React from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Edit, Trash2, CheckCircle, 
  CreditCard, Wallet, ArrowDownCircle, 
  ArrowUpCircle, RefreshCw, CircleDashed
} from 'lucide-react';

const TransacaoList = ({ 
  transacoes = [], 
  loading, 
  onEdit, 
  onDelete, 
  onMarkAsCompleted 
}) => {
  // Função para formatar o valor em moeda brasileira
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função para renderizar o ícone de tipo
  const renderTipoIcon = (tipo) => {
    switch (tipo) {
      case 'receita':
        return <ArrowUpCircle className="tipo-icon receita" />;
      case 'despesa':
        return <ArrowDownCircle className="tipo-icon despesa" />;
      case 'transferencia':
        return <RefreshCw className="tipo-icon transferencia" />;
      default:
        return null;
    }
  };

  // Função para renderizar o ícone de conta/cartão
  const renderContaIcon = (transacao) => {
    if (transacao.cartao_id) {
      return <CreditCard className="conta-icon cartao" />;
    }
    return <Wallet className="conta-icon conta" />;
  };

  // Função para renderizar o estado da transação
  const renderStatusIcon = (efetivada) => {
    return efetivada 
      ? <CheckCircle className="status-icon efetivada" /> 
      : <CircleDashed className="status-icon pendente" />;
  };

  // Renderiza a célula de valor com estilo apropriado
  const renderValorCell = (transacao) => {
    const classNames = `cell-valor ${
      transacao.tipo === 'receita' 
        ? 'valor-receita' 
        : transacao.tipo === 'despesa' 
          ? 'valor-despesa' 
          : 'valor-transferencia'
    }`;

    return (
      <div className={classNames}>
        {formatCurrency(transacao.valor)}
      </div>
    );
  };
  
  // Renderiza uma linha vazia quando não há transações
  if (!loading && (!transacoes || transacoes.length === 0)) {
    return (
      <div className="transacoes-empty">
        <div className="empty-icon">
          <RefreshCw size={48} />
        </div>
        <h3>Nenhuma transação encontrada</h3>
        <p>Tente ajustar os filtros ou adicionar novas transações.</p>
      </div>
    );
  }
  
  // Renderiza o estado de carregamento
  if (loading) {
    return (
      <div className="transacoes-loading">
        <div className="loading-spinner"></div>
        <p>Carregando transações...</p>
      </div>
    );
  }

  return (
    <div className="transacoes-list">
      {transacoes.map(transacao => (
        <div 
          key={transacao.id} 
          className={`transacao-item ${
            transacao.e_fatura_agrupada ? 'fatura-agrupada' : ''
          } ${
            transacao.efetivada ? 'efetivada' : 'pendente'
          }`}
        >
          <div className="cell-data">
            <div className="data-principal">
              {transacao.data && format(
                typeof transacao.data === 'string' ? parseISO(transacao.data) : transacao.data, 
                'dd MMM', 
                { locale: ptBR }
              )}
            </div>
            <div className="data-ano">
              {transacao.data && format(
                typeof transacao.data === 'string' ? parseISO(transacao.data) : transacao.data, 
                'yyyy'
              )}
            </div>
            <div className="status-indicator">
              {renderStatusIcon(transacao.efetivada)}
            </div>
          </div>
          
          <div className="cell-descricao">
            <div className="tipo-container">
              {renderTipoIcon(transacao.tipo)}
            </div>
            <div className="descricao-container">
              <div className="descricao-principal">
                {transacao.descricao}
              </div>
              {transacao.observacao && (
                <div className="descricao-observacao">
                  {transacao.observacao}
                </div>
              )}
              {transacao.e_fatura_agrupada && (
                <div className="descricao-fatura">
                  <CreditCard className="fatura-icon" />
                  <span>Fatura agrupada • {transacao.transacoes_agrupadas?.length || 0} transações</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="cell-categoria">
            {transacao.categoria && (
              <div 
                className="categoria-tag"
                style={{ 
                  backgroundColor: transacao.categoria.cor 
                    ? `${transacao.categoria.cor}20` // Adiciona transparência
                    : '#e5e7eb',
                  color: transacao.categoria.cor || '#374151',
                  borderColor: transacao.categoria.cor 
                    ? `${transacao.categoria.cor}40` 
                    : '#d1d5db'
                }}
              >
                {transacao.categoria.nome}
              </div>
            )}
            {transacao.subcategoria && (
              <div className="subcategoria-texto">
                {transacao.subcategoria.nome}
              </div>
            )}
          </div>
          
          <div className="cell-conta">
            <div className="conta-container">
              {renderContaIcon(transacao)}
              <div className="conta-texto">
                {transacao.cartao_id 
                  ? transacao.cartao?.nome || 'Cartão'
                  : transacao.conta?.nome || 'Conta'}
              </div>
            </div>
          </div>
          
          {renderValorCell(transacao)}
          
          <div className="cell-acoes">
            <button 
              className="acao-btn editar"
              onClick={() => onEdit(transacao)}
              aria-label="Editar transação"
            >
              <Edit className="acao-icon" />
            </button>
            
            {!transacao.efetivada && (
              <button 
                className="acao-btn efetivar"
                onClick={() => onMarkAsCompleted(transacao.id)}
                aria-label="Marcar como efetivada"
              >
                <CheckCircle className="acao-icon" />
              </button>
            )}
            
            <button 
              className="acao-btn excluir"
              onClick={() => onDelete(transacao.id)}
              aria-label="Excluir transação"
            >
              <Trash2 className="acao-icon" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TransacaoList;
import React from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Edit, Trash2, CheckCircle, 
  CreditCard, Wallet, ArrowDownCircle, 
  ArrowUpCircle, RefreshCw, CircleDashed
} from 'lucide-react';

const TransacaoItem = ({ 
  transacao, 
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
  const renderTipoIcon = () => {
    switch (transacao.tipo) {
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
  const renderContaIcon = () => {
    if (transacao.cartao_id) {
      return <CreditCard className="conta-icon cartao" />;
    }
    return <Wallet className="conta-icon conta" />;
  };

  // Função para renderizar o estado da transação
  const renderStatusIcon = () => {
    return transacao.efetivada 
      ? <CheckCircle className="status-icon efetivada" /> 
      : <CircleDashed className="status-icon pendente" />;
  };

  // Formatar a data da transação
  const formatDate = (date) => {
    if (!date) return '';
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    return format(parsedDate, 'dd MMM', { locale: ptBR });
  };

  // Formatar o ano da transação
  const formatYear = (date) => {
    if (!date) return '';
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    return format(parsedDate, 'yyyy');
  };

  // Determinar a classe CSS para a célula de valor
  const getValorClasses = () => {
    const baseClass = 'cell-valor';
    switch (transacao.tipo) {
      case 'receita':
        return `${baseClass} valor-receita`;
      case 'despesa':
        return `${baseClass} valor-despesa`;
      case 'transferencia':
        return `${baseClass} valor-transferencia`;
      default:
        return baseClass;
    }
  };

  // Determinar a classe CSS para o item de transação
  const getItemClasses = () => {
    let classes = 'transacao-item';
    
    if (transacao.e_fatura_agrupada) {
      classes += ' fatura-agrupada';
    }
    
    if (transacao.efetivada) {
      classes += ' efetivada';
    } else {
      classes += ' pendente';
    }
    
    return classes;
  };

  // Renderizar o item da transação
  return (
    <div className={getItemClasses()}>
      <div className="cell-data">
        <div className="data-principal">
          {formatDate(transacao.data)}
        </div>
        <div className="data-ano">
          {formatYear(transacao.data)}
        </div>
        <div className="status-indicator">
          {renderStatusIcon()}
        </div>
      </div>
      
      <div className="cell-descricao">
        <div className="tipo-container">
          {renderTipoIcon()}
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
          {renderContaIcon()}
          <div className="conta-texto">
            {transacao.cartao_id 
              ? transacao.cartao?.nome || 'Cartão'
              : transacao.conta?.nome || 'Conta'}
          </div>
        </div>
      </div>
      
      <div className={getValorClasses()}>
        {formatCurrency(transacao.valor)}
      </div>
      
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
  );
};

export default TransacaoItem;
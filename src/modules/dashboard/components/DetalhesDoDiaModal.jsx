import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  X, 
  TrendingUp,
  TrendingDown,
  Calendar,
  Tag,
  CreditCard,
  Landmark,
  Banknote
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@utils/formatCurrency';
import '../styles/DetalhesDoDiaModal.css';

/**
 * Modal para exibir detalhes das movimentações de um dia específico
 * Versão usando CSS externo para melhor organização
 */
const DetalhesDoDiaModal = ({ isOpen, onClose, dia }) => {
  const [movimentacoes, setMovimentacoes] = useState([]);
  
  // Carrega movimentações quando o modal abre
  useEffect(() => {
    if (isOpen && dia && dia.movimentos) {
      setMovimentacoes(dia.movimentos);
    } else {
      setMovimentacoes([]);
    }
  }, [isOpen, dia]);

  // Bloqueia scroll do body quando modal está aberto
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
      return () => {
        document.body.classList.remove('modal-open');
      };
    }
  }, [isOpen]);

  // Fecha o modal
  const handleClose = () => {
    onClose();
  };

  // Evita fechar modal ao clicar no conteúdo
  const handleContentClick = (e) => {
    e.stopPropagation();
  };

  // Handler para tecla ESC
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      return () => {
        document.removeEventListener('keydown', handleEscKey);
      };
    }
  }, [isOpen]);

  // Calcula totais baseado nas movimentações atuais
  const totais = movimentacoes.reduce((acc, mov) => {
    const valor = parseFloat(mov.valor) || 0;
    if (mov.tipo === 'receita') {
      acc.receitas += valor;
    } else if (mov.tipo === 'despesa') {
      acc.despesas += valor;
    }
    return acc;
  }, { receitas: 0, despesas: 0 });
  
  const saldoDia = totais.receitas - totais.despesas;

  // Componente de item de movimentação
  const MovimentacaoItem = ({ movimentacao }) => {
    const isReceita = movimentacao.tipo === 'receita';
    const valor = parseFloat(movimentacao.valor) || 0;
    
    const getContaIcon = () => {
      if (!movimentacao.conta) return <Banknote size={12} />;
      
      const contaLower = movimentacao.conta.toLowerCase();
      if (contaLower.includes('cartão') || contaLower.includes('cartao')) {
        return <CreditCard size={12} />;
      }
      if (contaLower.includes('poupança') || contaLower.includes('poupanca') || contaLower.includes('investimento')) {
        return <TrendingUp size={12} />;
      }
      return <Landmark size={12} />;
    };

    return (
      <div className={`detalhes-movimentacao-item ${isReceita ? 'receita' : 'despesa'}`}>
        <div className="detalhes-movimentacao-content">
          {/* Ícone do tipo */}
          <div className={`detalhes-movimentacao-icon ${isReceita ? 'receita' : 'despesa'}`}>
            {isReceita ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
          </div>
          
          {/* Informações principais */}
          <div className="detalhes-movimentacao-info">
            <div className="detalhes-movimentacao-main">
              <div>
                <h4 className="detalhes-movimentacao-descricao">
                  {movimentacao.descricao || 'Sem descrição'}
                </h4>
                <p className={`detalhes-movimentacao-valor ${isReceita ? 'receita' : 'despesa'}`}>
                  {isReceita ? '+' : '-'} {formatCurrency(valor)}
                </p>
              </div>
            </div>
            
            {/* Informações secundárias */}
            <div className="detalhes-movimentacao-detalhes">
              <div className="detalhes-movimentacao-detalhe">
                <Tag size={12} />
                <span>{movimentacao.categoria || 'Sem categoria'}</span>
              </div>
              <div className="detalhes-movimentacao-detalhe">
                {getContaIcon()}
                <span>{movimentacao.conta || 'Conta não informada'}</span>
              </div>
            </div>
            
            {movimentacao.observacoes && (
              <p className="detalhes-movimentacao-observacoes">
                {movimentacao.observacoes}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen || !dia) return null;

  return (
    <div className="detalhes-modal-overlay" onClick={handleClose}>
      <div className="detalhes-modal-container" onClick={handleContentClick}>
        {/* Header do Modal */}
        <div className="detalhes-modal-header">
          <button
            onClick={handleClose}
            className="detalhes-modal-close-button"
          >
            <X size={24} />
          </button>
          
          <h2 className="detalhes-modal-title">
            {dia?.data ? format(dia.data, 'dd \'de\' MMMM', { locale: ptBR }) : 'Detalhes do Dia'}
          </h2>
          <p className="detalhes-modal-subtitle">
            {dia?.data ? format(dia.data, 'EEEE', { locale: ptBR }) : ''}
          </p>
          
          {/* Resumo do Dia */}
          <div className="detalhes-modal-resumo">
            <div className="detalhes-resumo-item">
              <p className="detalhes-resumo-label">Receitas</p>
              <p className="detalhes-resumo-valor positivo">{formatCurrency(totais.receitas)}</p>
            </div>
            <div className="detalhes-resumo-item">
              <p className="detalhes-resumo-label">Despesas</p>
              <p className="detalhes-resumo-valor negativo">{formatCurrency(totais.despesas)}</p>
            </div>
            <div className="detalhes-resumo-item">
              <p className="detalhes-resumo-label">Saldo</p>
              <p className={`detalhes-resumo-valor ${saldoDia >= 0 ? 'positivo' : 'negativo'}`}>
                {formatCurrency(saldoDia)}
              </p>
            </div>
          </div>
        </div>
        
        {/* Conteúdo do Modal */}
        <div className="detalhes-modal-body">
          {movimentacoes.length === 0 ? (
            <div className="detalhes-empty-state">
              <div className="detalhes-empty-icon">
                <Calendar size={32} />
              </div>
              <h3 className="detalhes-empty-title">
                Nenhuma movimentação registrada
              </h3>
              <p className="detalhes-empty-description">
                Não há receitas ou despesas cadastradas para este dia.
              </p>
            </div>
          ) : (
            <div>
              {/* Cabeçalho */}
              <div className="detalhes-movimentacoes-header">
                <h3 className="detalhes-movimentacoes-title">
                  Movimentações ({movimentacoes.length})
                </h3>
                <p className="detalhes-movimentacoes-subtitle">
                  {dia?.data ? format(dia.data, 'dd/MM/yyyy', { locale: ptBR }) : ''}
                </p>
              </div>
              
              {/* Lista de movimentações */}
              <div className="detalhes-movimentacoes-lista">
                {movimentacoes.map((movimentacao, index) => (
                  <MovimentacaoItem 
                    key={movimentacao.id || index} 
                    movimentacao={movimentacao} 
                  />
                ))}
              </div>
              
              {/* Resumo adicional */}
              <div className="detalhes-resumo-adicional">
                <div className="detalhes-resumo-grid">
                  <div className="detalhes-resumo-coluna">
                    <p className="detalhes-resumo-coluna-label">Total de Transações</p>
                    <p className="detalhes-resumo-coluna-valor neutro">{movimentacoes.length}</p>
                  </div>
                  <div className="detalhes-resumo-coluna">
                    <p className="detalhes-resumo-coluna-label">Receitas</p>
                    <p className="detalhes-resumo-coluna-valor positivo">{formatCurrency(totais.receitas)}</p>
                  </div>
                  <div className="detalhes-resumo-coluna">
                    <p className="detalhes-resumo-coluna-label">Despesas</p>
                    <p className="detalhes-resumo-coluna-valor negativo">{formatCurrency(totais.despesas)}</p>
                  </div>
                  <div className="detalhes-resumo-coluna">
                    <p className="detalhes-resumo-coluna-label">Resultado</p>
                    <p className={`detalhes-resumo-coluna-valor ${saldoDia >= 0 ? 'positivo' : 'negativo'}`}>
                      {formatCurrency(saldoDia)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer do Modal */}
        <div className="detalhes-modal-footer">
          <div className="detalhes-modal-info">
            {movimentacoes.length} movimentação{movimentacoes.length !== 1 ? 'ões' : ''} • 
            Saldo do dia: <span className={`detalhes-modal-saldo-info ${saldoDia >= 0 ? 'positivo' : 'negativo'}`}>
              {formatCurrency(saldoDia)}
            </span>
          </div>
          <div className="detalhes-modal-actions">
            <button
              onClick={handleClose}
              className="detalhes-modal-button secondary"
            >
              Fechar
            </button>
            <button
              onClick={() => {
                handleClose();
                window.location.href = '/transacoes';
              }}
              className="detalhes-modal-button primary"
            >
              Ver todas as transações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

DetalhesDoDiaModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  dia: PropTypes.shape({
    data: PropTypes.instanceOf(Date),
    movimentos: PropTypes.array,
    totais: PropTypes.object
  })
};

export default DetalhesDoDiaModal;
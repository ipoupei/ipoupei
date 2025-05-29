// Novo arquivo: src/Components/FaturasCartao.jsx

import React, { useState, useEffect } from 'react';
import { CreditCard, Calendar, DollarSign, Eye } from 'lucide-react';
import useFaturasCartao from '../hooks/useFaturasCartao';
import useCartoes from '../hooks/useCartoes';
import { formatCurrency } from '../utils/formatCurrency';

const FaturasCartao = () => {
  const { faturas, loading, fetchFaturas, fetchDetalhesFatura } = useFaturasCartao();
  const { cartoes } = useCartoes();
  const [cartaoSelecionado, setCartaoSelecionado] = useState('');
  const [detalhesAbertos, setDetalhesAbertos] = useState({});

  useEffect(() => {
    fetchFaturas();
  }, [fetchFaturas]);

  const handleVerDetalhes = async (cartaoId, dataVencimento) => {
    const key = `${cartaoId}-${dataVencimento}`;
    
    if (detalhesAbertos[key]) {
      // Fechar detalhes
      setDetalhesAbertos(prev => ({ ...prev, [key]: null }));
    } else {
      // Buscar e abrir detalhes
      const result = await fetchDetalhesFatura(cartaoId, dataVencimento);
      if (result.success) {
        setDetalhesAbertos(prev => ({ ...prev, [key]: result.data }));
      }
    }
  };

  const faturasFiltradas = cartaoSelecionado 
    ? faturas.filter(f => f.cartao_id === cartaoSelecionado)
    : faturas;

  if (loading) {
    return <div className="loading">Carregando faturas...</div>;
  }

  return (
    <div className="faturas-cartao">
      <div className="faturas-header">
        <h2>
          <CreditCard size={20} />
          Faturas de Cartão
        </h2>
        
        <select 
          value={cartaoSelecionado} 
          onChange={(e) => setCartaoSelecionado(e.target.value)}
          className="cartao-filter"
        >
          <option value="">Todos os cartões</option>
          {cartoes.map(cartao => (
            <option key={cartao.id} value={cartao.id}>
              {cartao.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="faturas-lista">
        {faturasFiltradas.map(fatura => {
          const key = `${fatura.cartao_id}-${fatura.fatura_vencimento}`;
          const detalhes = detalhesAbertos[key];
          
          return (
            <div key={key} className="fatura-item">
              <div className="fatura-resumo">
                <div className="fatura-info">
                  <h3>{fatura.cartao_nome}</h3>
                  <p>
                    <Calendar size={14} />
                    Vencimento: {new Date(fatura.fatura_vencimento).toLocaleDateString('pt-BR')}
                  </p>
                  <p>
                    <DollarSign size={14} />
                    {formatCurrency(fatura.valor_total_fatura)}
                  </p>
                  <small>{fatura.total_parcelas} parcela(s) • {fatura.total_compras} compra(s)</small>
                </div>
                
                <button 
                  onClick={() => handleVerDetalhes(fatura.cartao_id, fatura.fatura_vencimento)}
                  className="btn-ver-detalhes"
                >
                  <Eye size={16} />
                  {detalhes ? 'Ocultar' : 'Ver Detalhes'}
                </button>
              </div>

              {detalhes && (
                <div className="fatura-detalhes">
                  <h4>Detalhes da Fatura</h4>
                  <div className="transacoes-lista">
                    {detalhes.map(transacao => (
                      <div key={transacao.id} className="transacao-item">
                        <div className="transacao-info">
                          <strong>{transacao.descricao}</strong>
                          <small>{new Date(transacao.data).toLocaleDateString('pt-BR')}</small>
                          <span className="categoria">
                            {transacao.categoria?.nome}
                            {transacao.subcategoria && ` > ${transacao.subcategoria.nome}`}
                          </span>
                        </div>
                        <div className="transacao-valor">
                          {formatCurrency(transacao.valor_parcela)}
                          {transacao.numero_parcelas > 1 && (
                            <small>({transacao.parcela_atual}/{transacao.numero_parcelas})</small>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {faturasFiltradas.length === 0 && (
        <div className="faturas-empty">
          <CreditCard size={48} />
          <p>Nenhuma fatura encontrada</p>
        </div>
      )}
    </div>
  );
};

export default FaturasCartao;
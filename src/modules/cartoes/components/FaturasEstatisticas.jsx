// src/components/FaturasEstatisticas.jsx
import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, BarChart3, PieChart,
  Calendar, CreditCard, DollarSign, Target,
  ArrowUpRight, ArrowDownRight, Equal
} from 'lucide-react';
import { formatCurrency } from '@utils/formatCurrency';
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const FaturasEstatisticas = ({ faturas, calcularEstatisticas, compararFaturas }) => {
  const [estatisticasAtual, setEstatisticasAtual] = useState(null);
  const [comparacao, setComparacao] = useState(null);
  const [loading, setLoading] = useState(false);

  // Calcular estatísticas da fatura atual
  useEffect(() => {
    if (faturas.length > 0) {
      const faturaAtual = faturas[0];
      const stats = calcularEstatisticas(faturaAtual);
      setEstatisticasAtual(stats);
      
      // Comparar com mês anterior se possível
      if (faturaAtual) {
        const mesAtual = format(new Date(faturaAtual.fatura_vencimento), 'yyyy-MM');
        const mesAnterior = format(subMonths(new Date(faturaAtual.fatura_vencimento), 1), 'yyyy-MM');
        
        compararFaturas(faturaAtual.cartao_id, mesAnterior, mesAtual)
          .then(result => {
            if (result.success) {
              setComparacao(result.data);
            }
          })
          .catch(console.error);
      }
    }
  }, [faturas, calcularEstatisticas, compararFaturas]);

  // Renderizar card de estatística
  const renderStatCard = (titulo, valor, icone, variacao = null, cor = 'blue') => {
    const cores = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200',
      green: 'bg-green-50 text-green-600 border-green-200',
      red: 'bg-red-50 text-red-600 border-red-200',
      yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
      purple: 'bg-purple-50 text-purple-600 border-purple-200'
    };

    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{titulo}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{valor}</p>
            {variacao && (
              <div className="flex items-center mt-2">
                {variacao.valor > 0 ? (
                  <ArrowUpRight className="h-4 w-4 text-red-500 mr-1" />
                ) : variacao.valor < 0 ? (
                  <ArrowDownRight className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <Equal className="h-4 w-4 text-gray-500 mr-1" />
                )}
                <span className={`text-sm font-medium ${
                  variacao.valor > 0 ? 'text-red-600' : 
                  variacao.valor < 0 ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {variacao.percentual > 0 ? '+' : ''}{variacao.percentual.toFixed(1)}%
                </span>
                <span className="text-sm text-gray-500 ml-1">vs mês anterior</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg border ${cores[cor]}`}>
            {icone}
          </div>
        </div>
      </div>
    );
  };

  // Renderizar gráfico de categorias (simplificado)
  const renderCategoriasChart = () => {
    if (!estatisticasAtual?.porCategoria) return null;

    const categorias = Object.entries(estatisticasAtual.porCategoria)
      .sort((a, b) => b[1].valor - a[1].valor)
      .slice(0, 5); // Top 5 categorias

    const maxValor = categorias[0]?.[1]?.valor || 1;

    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <PieChart size={20} />
          Top Categorias
        </h3>
        
        <div className="space-y-4">
          {categorias.map(([categoria, dados], index) => {
            const porcentagem = (dados.valor / maxValor) * 100;
            const cores = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500'];
            
            return (
              <div key={categoria} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${cores[index % cores.length]}`}></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {categoria}
                    </span>
                    <span className="text-sm text-gray-600">
                      {formatCurrency(dados.valor)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${cores[index % cores.length]}`}
                      style={{ width: `${porcentagem}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Renderizar timeline de gastos
  const renderTimelineGastos = () => {
    if (!estatisticasAtual?.porDia) return null;

    const ultimosDias = estatisticasAtual.porDia.slice(0, 7);

    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 size={20} />
          Últimos Dias
        </h3>
        
        <div className="space-y-3">
          {ultimosDias.map(dia => (
            <div key={dia.dia} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {format(new Date(dia.dia), "dd 'de' MMM", { locale: ptBR })}
                </p>
                <p className="text-xs text-gray-500">
                  {dia.quantidade} transação(ões)
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {formatCurrency(dia.valor)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Renderizar comparação com mês anterior
  const renderComparacao = () => {
    if (!comparacao) return null;

    const { diferencas } = comparacao;
    
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp size={20} />
          Comparação Mensal
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
              diferencas.valor > 0 ? 'bg-red-50 text-red-600' : 
              diferencas.valor < 0 ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600'
            }`}>
              {diferencas.valor > 0 ? (
                <ArrowUpRight size={14} />
              ) : diferencas.valor < 0 ? (
                <ArrowDownRight size={14} />
              ) : (
                <Equal size={14} />
              )}
              {diferencas.percentual > 0 ? '+' : ''}{diferencas.percentual.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Valor total</p>
          </div>
          
          <div className="text-center">
            <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
              diferencas.transacoes > 0 ? 'bg-red-50 text-red-600' : 
              diferencas.transacoes < 0 ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600'
            }`}>
              {diferencas.transacoes > 0 ? '+' : ''}{diferencas.transacoes}
            </div>
            <p className="text-xs text-gray-500 mt-1">Transações</p>
          </div>
          
          <div className="text-center">
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-600">
              {formatCurrency(Math.abs(diferencas.valor))}
            </div>
            <p className="text-xs text-gray-500 mt-1">Diferença</p>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  if (!estatisticasAtual) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center py-8">
          <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhuma estatística disponível
          </h3>
          <p className="text-gray-500">
            Selecione uma fatura para ver as estatísticas
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {renderStatCard(
          'Total de Transações',
          estatisticasAtual.totalTransacoes,
          <Receipt size={20} />,
          comparacao ? { 
            valor: comparacao.diferencas.transacoes,
            percentual: comparacao.diferencas.transacoes / comparacao.periodo1.fatura.total_compras * 100
          } : null,
          'blue'
        )}
        
        {renderStatCard(
          'Valor Total',
          formatCurrency(estatisticasAtual.valorTotal),
          <DollarSign size={20} />,
          comparacao ? comparacao.diferencas : null,
          'green'
        )}
        
        {renderStatCard(
          'Ticket Médio',
          formatCurrency(estatisticasAtual.valorMedio),
          <Target size={20} />,
          null,
          'purple'
        )}
        
        {renderStatCard(
          'Maior Categoria',
          estatisticasAtual.maiorCategoria?.nome || 'N/A',
          <PieChart size={20} />,
          null,
          'yellow'
        )}
      </div>

      {/* Gráficos e Análises */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderCategoriasChart()}
        {renderTimelineGastos()}
      </div>

      {/* Comparação Mensal */}
      {renderComparacao()}
    </div>
  );
};

export default FaturasEstatisticas;
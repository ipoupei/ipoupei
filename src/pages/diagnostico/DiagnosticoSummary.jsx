import React from 'react';
import PropTypes from 'prop-types';
import { Check, AlertCircle, TrendingDown, TrendingUp, Zap, ListChecks } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

/**
 * Componente para exibir o resumo do diagnóstico financeiro
 * Mostra os resultados, insights e planos de ação com base na análise dos dados
 */
const DiagnosticoSummary = ({ diagnosticoData, onFinish }) => {
  const { resultados, situacaoFinanceira } = diagnosticoData;
  
  // Helper para formatar o valor da nota
  const formatarNota = (nota) => {
    return Math.round(nota);
  };
  
  // Função para obter a cor da nota com base no valor
  const getNotaColor = (nota) => {
    if (nota < 30) return 'text-red-600';
    if (nota < 50) return 'text-orange-500';
    if (nota < 70) return 'text-yellow-500';
    if (nota < 90) return 'text-green-500';
    return 'text-emerald-500';
  };
  
  // Função para obter o texto da classificação com base no valor
  const getClassificacaoText = (classificacao) => {
    switch (classificacao) {
      case 'super_deficitario':
        return 'Super deficitário';
      case 'no_limite':
        return 'No limite';
      case 'superavitario':
        return 'Superavitário';
      case 'estavel':
        return 'Financeiramente estável';
      default:
        return 'Em análise';
    }
  };
  
  // Função para obter a cor da classificação com base no valor
  const getClassificacaoColor = (classificacao) => {
    switch (classificacao) {
      case 'super_deficitario':
        return 'bg-red-100 text-red-800';
      case 'no_limite':
        return 'bg-orange-100 text-orange-800';
      case 'superavitario':
        return 'bg-yellow-100 text-yellow-800';
      case 'estavel':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Calcula totais para o resumo
  const totalReceitas = situacaoFinanceira.rendaMensal;
  const totalDespesasFixas = Object.values(situacaoFinanceira.despesasFixas).reduce((a, b) => a + b, 0);
  const totalDespesasVariaveis = Object.values(situacaoFinanceira.despesasVariaveis).reduce((a, b) => a + b, 0);
  const totalParcelamentos = situacaoFinanceira.parcelamentos.reduce((acc, item) => acc + (item.valorParcela || 0), 0);
  const totalDividas = situacaoFinanceira.dividas.reduce((acc, item) => acc + (item.valorParcela || 0), 0);
  const totalDespesas = totalDespesasFixas + totalDespesasVariaveis + totalParcelamentos + totalDividas;
  const saldoMensal = totalReceitas - totalDespesas;

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-3">Seu Diagnóstico Financeiro</h2>
        <p className="text-gray-600 max-w-xl mx-auto">
          Com base nas informações fornecidas, fizemos uma análise completa da sua situação financeira atual.
          Use estes insights para tomar decisões mais conscientes e transformar sua vida financeira.
        </p>
      </div>
      
      {/* Nota de Saúde Financeira */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center">
          <div className="md:w-1/2 md:border-r md:border-gray-200 md:pr-6 pb-6 md:pb-0">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Nota de Saúde Financeira</h3>
            <div className="flex items-center">
              <div className="relative w-32 h-32 rounded-full border-8 border-gray-100 flex items-center justify-center mr-6">
                <div className={`text-4xl font-bold ${getNotaColor(resultados.notaSaudeFinanceira)}`}>
                  {formatarNota(resultados.notaSaudeFinanceira)}
                </div>
                <div className="absolute inset-0 rounded-full border-8 border-transparent" 
                  style={{
                    background: `conic-gradient(currentColor ${resultados.notaSaudeFinanceira}%, transparent 0)`,
                    WebkitMask: 'radial-gradient(transparent 55%, black 56%)',
                    mask: 'radial-gradient(transparent 55%, black 56%)',
                    color: resultados.notaSaudeFinanceira < 30 ? '#ef4444' : 
                           resultados.notaSaudeFinanceira < 50 ? '#f97316' : 
                           resultados.notaSaudeFinanceira < 70 ? '#eab308' : 
                           resultados.notaSaudeFinanceira < 90 ? '#22c55e' : '#10b981'
                  }}
                ></div>
              </div>
              <div>
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getClassificacaoColor(resultados.classificacao)}`}>
                  {getClassificacaoText(resultados.classificacao)}
                </div>
                <p className="text-gray-600 mt-2">
                  {resultados.nivelComprometimentoRenda}% da sua renda está comprometida
                </p>
                {saldoMensal > 0 ? (
                  <p className="text-green-600 font-medium mt-1">
                    Sobra mensal: {formatCurrency(saldoMensal)}
                  </p>
                ) : (
                  <p className="text-red-600 font-medium mt-1">
                    Déficit mensal: {formatCurrency(saldoMensal)}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="md:w-1/2 md:pl-6 pt-6 md:pt-0">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Resumo Financeiro</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-1 border-b border-gray-100">
                <span className="text-gray-600">Receitas mensais</span>
                <span className="font-medium text-green-600">{formatCurrency(totalReceitas)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-100">
                <span className="text-gray-600">Despesas fixas</span>
                <span className="font-medium text-red-600">{formatCurrency(totalDespesasFixas)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-100">
                <span className="text-gray-600">Despesas variáveis</span>
                <span className="font-medium text-red-600">{formatCurrency(totalDespesasVariaveis)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-100">
                <span className="text-gray-600">Parcelas (cartões + dívidas)</span>
                <span className="font-medium text-red-600">{formatCurrency(totalParcelamentos + totalDividas)}</span>
              </div>
              <div className="flex justify-between items-center py-1 pt-2">
                <span className="font-medium text-gray-800">Saldo mensal</span>
                <span className={`font-medium ${saldoMensal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(saldoMensal)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Riscos, Oportunidades e Ações */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Riscos */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center mb-4">
            <div className="p-2 rounded-full bg-red-100 text-red-600 mr-3">
              <AlertCircle size={20} />
            </div>
            <h3 className="text-lg font-medium text-gray-800">Pontos de Atenção</h3>
          </div>
          
          {resultados.riscosCriticos && resultados.riscosCriticos.length > 0 ? (
            <ul className="space-y-2">
              {resultados.riscosCriticos.map((risco, index) => (
                <li key={index} className="flex items-start">
                  <TrendingDown size={18} className="text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-gray-700">{risco}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">
              Não identificamos pontos críticos na sua situação financeira atual. Continue com o bom trabalho!
            </p>
          )}
        </div>
        
        {/* Oportunidades */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center mb-4">
            <div className="p-2 rounded-full bg-green-100 text-green-600 mr-3">
              <TrendingUp size={20} />
            </div>
            <h3 className="text-lg font-medium text-gray-800">Oportunidades</h3>
          </div>
          
          {resultados.oportunidades && resultados.oportunidades.length > 0 ? (
            <ul className="space-y-2">
              {resultados.oportunidades.map((oportunidade, index) => (
                <li key={index} className="flex items-start">
                  <Check size={18} className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-gray-700">{oportunidade}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">
              Continue mantendo suas finanças bem organizadas!
            </p>
          )}
        </div>
        
        {/* Plano de Ação */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center mb-4">
            <div className="p-2 rounded-full bg-blue-100 text-blue-600 mr-3">
              <ListChecks size={20} />
            </div>
            <h3 className="text-lg font-medium text-gray-800">Próximos Passos</h3>
          </div>
          
          {resultados.planosAcao && resultados.planosAcao.length > 0 ? (
            <ul className="space-y-3">
              {resultados.planosAcao.map((plano, index) => (
                <li key={index} className="flex items-start">
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 font-bold text-xs mr-2 flex-shrink-0">
                    {index + 1}
                  </div>
                  <span className="text-gray-700">{plano}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">
              Continue monitorando suas finanças com o iPoupei.
            </p>
          )}
        </div>
      </div>
      
      {/* Call-to-Action */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-8 shadow-md text-white text-center">
        <Zap size={40} className="mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">Pronto para começar sua jornada financeira?</h3>
        <p className="mb-6 text-blue-100">
          Suas contas, cartões, dívidas e despesas fixas já foram cadastradas automaticamente no sistema.
          Comece agora a acompanhar e transformar sua vida financeira.
        </p>
        <button
          onClick={onFinish}
          className="px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
        >
          Ir para meu dashboard agora
        </button>
      </div>
    </div>
  );
};

DiagnosticoSummary.propTypes = {
  diagnosticoData: PropTypes.object.isRequired,
  onFinish: PropTypes.func.isRequired
};

export default DiagnosticoSummary;

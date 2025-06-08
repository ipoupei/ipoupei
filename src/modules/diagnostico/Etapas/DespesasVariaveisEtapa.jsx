import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ShoppingBag, HelpCircle, TrendingDown, Calculator } from 'lucide-react';
import InputMoney from '@shared/components/ui/InputMoney';
import { formatCurrency } from '@utils/formatCurrency';



/**
 * Componente da etapa de despesas variáveis
 * Coleta dados sobre gastos que variam mensalmente (lazer, compras, imprevistos)
 */
const DespesasVariaveisEtapa = ({ data, onUpdateData, onNext }) => {
  // Estado local para as despesas variáveis
  const [localData, setLocalData] = useState({
    lazer: 0,
    compras: 0,
    imprevistos: 0
  });
  
  // Estado para controlar erros de validação
  const [errors, setErrors] = useState({});
  
  // Preenche o estado local com dados existentes (se houver)
  useEffect(() => {
    if (data?.situacaoFinanceira?.despesasVariaveis) {
      setLocalData(data.situacaoFinanceira.despesasVariaveis);
    }
  }, [data]);
  
  // Lista de categorias de despesas variáveis com descrições
  const categoriasDespesasVariaveis = [
    {
      key: 'lazer',
      nome: 'Lazer e Entretenimento',
      icone: '🎉',
      descricao: 'Cinema, shows, viagens, restaurantes, streaming, jogos',
      dica: 'Considere uma média mensal dos últimos 3 meses'
    },
    {
      key: 'compras',
      nome: 'Compras e Consumo',
      icone: '🛒',
      descricao: 'Roupas, eletrônicos, decoração, cosméticos, presentes',
      dica: 'Inclua compras online e físicas não essenciais'
    },
    {
      key: 'imprevistos',
      nome: 'Imprevistos e Emergências',
      icone: '🚨',
      descricao: 'Reparos, multas, remédios, gastos médicos não programados',
      dica: 'Baseie-se em uma média dos últimos 6 meses'
    }
  ];
  
  // Manipulador para campos monetários
  const handleMoneyChange = (field, value) => {
    setLocalData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpa erro do campo, se existir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };
  
  // Calcula o total das despesas variáveis
  const totalDespesasVariaveis = Object.values(localData).reduce((acc, val) => acc + val, 0);
  
  // Calcula percentual em relação à renda (se disponível)
  const rendaMensal = data?.situacaoFinanceira?.rendaMensal || 0;
  const percentualRenda = rendaMensal > 0 ? (totalDespesasVariaveis / rendaMensal) * 100 : 0;
  
  // Determina cor e mensagem baseada no percentual
  const getPercentualInfo = () => {
    if (percentualRenda === 0) {
      return { color: 'text-gray-600', message: '' };
    } else if (percentualRenda <= 20) {
      return { 
        color: 'text-green-600', 
        message: 'Excelente controle de gastos variáveis!' 
      };
    } else if (percentualRenda <= 35) {
      return { 
        color: 'text-yellow-600', 
        message: 'Gastos variáveis dentro de uma faixa aceitável.' 
      };
    } else if (percentualRenda <= 50) {
      return { 
        color: 'text-orange-600', 
        message: 'Gastos variáveis elevados - oportunidade de economia.' 
      };
    } else {
      return { 
        color: 'text-red-600', 
        message: 'Gastos variáveis muito altos - requer atenção imediata.' 
      };
    }
  };
  
  const percentualInfo = getPercentualInfo();
  
  // Submete os dados e avança para a próxima etapa
  const handleSubmit = () => {
    // Não há validação obrigatória para despesas variáveis (podem ser zero)
    onUpdateData('situacaoFinanceira', {
      despesasVariaveis: localData
    });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <div className="p-2 rounded-full bg-orange-100 text-orange-600 mr-3">
          <ShoppingBag size={24} />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Despesas Variáveis</h2>
      </div>
      
      <p className="text-gray-600 mb-6">
        Agora vamos falar sobre os gastos que variam de mês para mês. Estes são geralmente os mais 
        fáceis de controlar e onde você pode encontrar oportunidades de economia.
      </p>
      
      {/* Campos de despesas variáveis */}
      <div className="space-y-6">
        {categoriasDespesasVariaveis.map((categoria) => (
          <div key={categoria.key} className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-start mb-3">
              <div className="text-2xl mr-3">{categoria.icone}</div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-800 mb-1">
                  {categoria.nome}
                </h3>
                <p className="text-sm text-gray-600 mb-2">{categoria.descricao}</p>
                <div className="flex items-center text-xs text-blue-600 mb-3">
                  <HelpCircle size={14} className="mr-1" />
                  <span>{categoria.dica}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <label htmlFor={categoria.key} className="block text-sm font-medium text-gray-700 mb-1">
                  Gasto médio mensal
                </label>
                <InputMoney
                  id={categoria.key}
                  name={categoria.key}
                  value={localData[categoria.key]}
                  onChange={(value) => handleMoneyChange(categoria.key, value)}
                  placeholder="R$ 0,00"
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '0.625rem 0.75rem',
                    fontSize: '0.875rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #d1d5db'
                  }}
                />
              </div>
              
              {rendaMensal > 0 && localData[categoria.key] > 0 && (
                <div className="text-right text-sm">
                  <div className="text-gray-500">% da renda</div>
                  <div className={`font-medium ${
                    (localData[categoria.key] / rendaMensal) * 100 > 25 ? 'text-red-600' : 
                    (localData[categoria.key] / rendaMensal) * 100 > 15 ? 'text-orange-600' : 
                    'text-green-600'
                  }`}>
                    {((localData[categoria.key] / rendaMensal) * 100).toFixed(1)}%
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Resumo total */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <Calculator className="h-5 w-5 text-orange-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-800">Total de Despesas Variáveis</h3>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(totalDespesasVariaveis)}
            </div>
            {rendaMensal > 0 && (
              <div className={`text-sm font-medium ${percentualInfo.color}`}>
                {percentualRenda.toFixed(1)}% da sua renda
              </div>
            )}
          </div>
        </div>
        
        {percentualInfo.message && (
          <div className={`text-sm ${percentualInfo.color}`}>
            <TrendingDown size={14} className="inline mr-1" />
            {percentualInfo.message}
          </div>
        )}
        
        {totalDespesasVariaveis > 0 && rendaMensal > 0 && (
          <div className="mt-3 pt-3 border-t border-orange-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Gastos fixos + variáveis:</span>
                <div className="font-medium text-gray-800">
                  {(() => {
                    const despesasFixas = data?.situacaoFinanceira?.despesasFixas || {};
                    const totalFixas = Object.values(despesasFixas).reduce((acc, val) => acc + val, 0);
                    const totalGeral = totalFixas + totalDespesasVariaveis;
                    return formatCurrency(totalGeral);
                  })()}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Potencial de economia:</span>
                <div className="font-medium text-green-600">
                  {formatCurrency(totalDespesasVariaveis * 0.2)} - {formatCurrency(totalDespesasVariaveis * 0.4)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Dicas de economia */}
      {totalDespesasVariaveis > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <HelpCircle className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Dicas para economizar nas despesas variáveis:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Defina um orçamento mensal para cada categoria</li>
                <li>• Use a regra 24h: espere um dia antes de compras não programadas</li>
                <li>• Compare preços e busque promoções antes de comprar</li>
                <li>• Considere alternativas gratuitas para lazer (parques, eventos gratuitos)</li>
                <li>• Mantenha uma reserva pequena para imprevistos reais</li>
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Informação sobre pular */}
      {totalDespesasVariaveis === 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <ShoppingBag className="h-5 w-5 text-gray-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-700">
                Se você não tem gastos variáveis significativos ou prefere não informar agora, 
                pode prosseguir. Você poderá ajustar estes valores posteriormente no aplicativo.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Controles da etapa */}
      <div className="pt-4">
        <button
          onClick={handleSubmit}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Finalizar diagnóstico
        </button>
        
        <p className="mt-2 text-sm text-gray-500">
          Esta é a última etapa do diagnóstico. Após clicar em "Finalizar", 
          processaremos suas informações e geraremos seu relatório personalizado.
        </p>
      </div>
    </div>
  );
};

DespesasVariaveisEtapa.propTypes = {
  data: PropTypes.object,
  onUpdateData: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired
};

export default DespesasVariaveisEtapa;
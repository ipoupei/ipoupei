import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Home, HelpCircle, Calculator, TrendingUp } from 'lucide-react';
import InputMoney from '../../../Components/ui/InputMoney';
import { formatCurrency } from '../../../utils/formatCurrency';

/**
 * Componente da etapa de despesas fixas
 * Coleta dados sobre gastos mensais recorrentes e obrigatórios
 */
const DespesasFixasEtapa = ({ data, onUpdateData, onNext }) => {
  // Estado local para as despesas fixas
  const [localData, setLocalData] = useState({
    moradia: 0,
    contas: 0,
    alimentacao: 0,
    transporte: 0,
    educacao: 0,
    saude: 0,
    outros: 0
  });
  
  // Estado para controlar erros de validação
  const [errors, setErrors] = useState({});
  
  // Preenche o estado local com dados existentes (se houver)
  useEffect(() => {
    if (data?.situacaoFinanceira?.despesasFixas) {
      setLocalData(data.situacaoFinanceira.despesasFixas);
    }
  }, [data]);
  
  // Lista de categorias de despesas fixas com descrições
  const categoriasDespesasFixas = [
    {
      key: 'moradia',
      nome: 'Moradia',
      icone: '🏠',
      descricao: 'Aluguel, prestação da casa, condomínio, IPTU',
      dica: 'Inclua todos os custos relacionados à sua residência'
    },
    {
      key: 'contas',
      nome: 'Contas Básicas',
      icone: '💡',
      descricao: 'Luz, água, gás, telefone, internet, TV',
      dica: 'Some todas as contas de utilidades públicas'
    },
    {
      key: 'alimentacao',
      nome: 'Alimentação Básica',
      icone: '🛒',
      descricao: 'Supermercado, feira, gastos essenciais com comida',
      dica: 'Apenas alimentação básica/supermercado, não inclua restaurantes'
    },
    {
      key: 'transporte',
      nome: 'Transporte',
      icone: '🚗',
      descricao: 'Combustível, transporte público, prestação do carro',
      dica: 'Gastos regulares com locomoção para trabalho e atividades essenciais'
    },
    {
      key: 'educacao',
      nome: 'Educação',
      icone: '📚',
      descricao: 'Mensalidade escolar, cursos, material escolar',
      dica: 'Apenas gastos educacionais recorrentes e obrigatórios'
    },
    {
      key: 'saude',
      nome: 'Saúde',
      icone: '🏥',
      descricao: 'Plano de saúde, medicamentos contínuos, academia',
      dica: 'Gastos essenciais e recorrentes com saúde e bem-estar'
    },
    {
      key: 'outros',
      nome: 'Outras Despesas Fixas',
      icone: '📋',
      descricao: 'Seguros, assinaturas, outros gastos fixos mensais',
      dica: 'Qualquer outro gasto que você paga todo mês'
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
  
  // Calcula o total das despesas fixas
  const totalDespesasFixas = Object.values(localData).reduce((acc, val) => acc + val, 0);
  
  // Calcula percentual em relação à renda (se disponível)
  const rendaMensal = data?.situacaoFinanceira?.rendaMensal || 0;
  const percentualRenda = rendaMensal > 0 ? (totalDespesasFixas / rendaMensal) * 100 : 0;
  
  // Determina cor e mensagem baseada no percentual
  const getPercentualInfo = () => {
    if (percentualRenda === 0) {
      return { color: 'text-gray-600', message: '' };
    } else if (percentualRenda <= 50) {
      return { 
        color: 'text-green-600', 
        message: 'Despesas fixas em um nível saudável!' 
      };
    } else if (percentualRenda <= 70) {
      return { 
        color: 'text-yellow-600', 
        message: 'Despesas fixas um pouco elevadas, mas ainda controlável.' 
      };
    } else if (percentualRenda <= 90) {
      return { 
        color: 'text-orange-600', 
        message: 'Despesas fixas altas - pouca margem para outros gastos.' 
      };
    } else {
      return { 
        color: 'text-red-600', 
        message: 'Despesas fixas críticas - comprometem sua renda!' 
      };
    }
  };
  
  const percentualInfo = getPercentualInfo();
  
  // Calcula sobra após despesas fixas
  const sobraAposDespesasFixas = rendaMensal - totalDespesasFixas;
  
  // Submete os dados e avança para a próxima etapa
  const handleSubmit = () => {
    // Validação básica - pelo menos alguma despesa fixa deve existir
    if (totalDespesasFixas === 0) {
      setErrors({ geral: 'Informe pelo menos uma despesa fixa para continuar' });
      return;
    }
    
    onUpdateData('situacaoFinanceira', {
      despesasFixas: localData
    });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <div className="p-2 rounded-full bg-blue-100 text-blue-600 mr-3">
          <Home size={24} />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Despesas Fixas Mensais</h2>
      </div>
      
      <p className="text-gray-600 mb-6">
        Vamos mapear seus gastos fixos mensais - aqueles que você paga todo mês, 
        independentemente do que aconteça. Estes são os mais importantes para entender 
        seu orçamento base.
      </p>
      
      {/* Erro geral */}
      {errors.geral && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700 text-sm">{errors.geral}</p>
        </div>
      )}
      
      {/* Campos de despesas fixas */}
      <div className="space-y-4">
        {categoriasDespesasFixas.map((categoria) => (
          <div key={categoria.key} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start mb-3">
              <div className="text-2xl mr-3">{categoria.icone}</div>
              <div className="flex-1">
                <h3 className="text-base font-medium text-gray-800 mb-1">
                  {categoria.nome}
                </h3>
                <p className="text-sm text-gray-600 mb-2">{categoria.descricao}</p>
                <div className="flex items-center text-xs text-blue-600">
                  <HelpCircle size={12} className="mr-1" />
                  <span>{categoria.dica}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex-1">
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
                <div className="text-right text-sm min-w-[60px]">
                  <div className="text-gray-500 text-xs">% da renda</div>
                  <div className={`font-medium ${
                    (localData[categoria.key] / rendaMensal) * 100 > 30 ? 'text-red-600' : 
                    (localData[categoria.key] / rendaMensal) * 100 > 20 ? 'text-orange-600' : 
                    'text-green-600'
                  }`}>
                    {((localData[categoria.key] / rendaMensal) * 100).toFixed(0)}%
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Resumo total */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <Calculator className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-800">Total de Despesas Fixas</h3>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(totalDespesasFixas)}
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
            <TrendingUp size={14} className="inline mr-1" />
            {percentualInfo.message}
          </div>
        )}
        
        {rendaMensal > 0 && totalDespesasFixas > 0 && (
          <div className="mt-3 pt-3 border-t border-blue-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Sobra após despesas fixas:</span>
                <div className={`font-medium text-lg ${
                  sobraAposDespesasFixas >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(sobraAposDespesasFixas)}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Margem disponível:</span>
                <div className={`font-medium ${
                  sobraAposDespesasFixas >= rendaMensal * 0.3 ? 'text-green-600' : 
                  sobraAposDespesasFixas >= 0 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {sobraAposDespesasFixas >= 0 
                    ? `${((sobraAposDespesasFixas / rendaMensal) * 100).toFixed(0)}% da renda`
                    : 'Déficit!'
                  }
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Alertas baseados na situação */}
      {rendaMensal > 0 && totalDespesasFixas > 0 && (
        <div className={`p-4 rounded-lg ${
          percentualRenda > 80 ? 'bg-red-50' : 
          percentualRenda > 60 ? 'bg-yellow-50' : 'bg-green-50'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              <HelpCircle className={`h-5 w-5 ${
                percentualRenda > 80 ? 'text-red-400' : 
                percentualRenda > 60 ? 'text-yellow-400' : 'text-green-400'
              }`} />
            </div>
            <div className="ml-3">
              <div className={`text-sm ${
                percentualRenda > 80 ? 'text-red-700' : 
                percentualRenda > 60 ? 'text-yellow-700' : 'text-green-700'
              }`}>
                {percentualRenda > 80 ? (
                  <>
                    <strong>Situação crítica:</strong> Suas despesas fixas consomem mais de 80% da renda. 
                    É urgente rever contratos e buscar alternativas para reduzir estes custos.
                  </>
                ) : percentualRenda > 60 ? (
                  <>
                    <strong>Atenção:</strong> Suas despesas fixas estão altas. Considere renegociar 
                    contratos ou buscar alternativas mais econômicas.
                  </>
                ) : (
                  <>
                    <strong>Situação saudável:</strong> Suas despesas fixas estão em um patamar 
                    controlável, deixando margem para outros gastos e poupança.
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Informação sobre importância */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <HelpCircle className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Por que mapeamos as despesas fixas?</h4>
            <p className="text-sm text-blue-700">
              As despesas fixas são a base do seu orçamento. Conhecendo-as bem, você pode:
              identificar oportunidades de economia, negociar melhores condições, 
              planejar o que fazer com o dinheiro que sobra e evitar comprometer mais do que deveria.
            </p>
          </div>
        </div>
      </div>
      
      {/* Controles da etapa */}
      <div className="pt-4">
        <button
          onClick={handleSubmit}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            totalDespesasFixas > 0
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          disabled={totalDespesasFixas === 0}
        >
          Continuar
        </button>
        
        {totalDespesasFixas === 0 && (
          <p className="mt-2 text-sm text-amber-600">
            Informe pelo menos uma despesa fixa para continuar.
          </p>
        )}
      </div>
    </div>
  );
};

DespesasFixasEtapa.propTypes = {
  data: PropTypes.object,
  onUpdateData: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired
};

export default DespesasFixasEtapa;
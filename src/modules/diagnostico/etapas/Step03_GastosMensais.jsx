// src/modules/diagnostico/etapas/Step03_GastosMensais.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PieChart, 
  Home, 
  Car, 
  ShoppingCart, 
  CreditCard, 
  Coffee, 
  MoreHorizontal,
  DollarSign 
} from 'lucide-react';
import useDiagnosticoEmocionalStore from '@modules/diagnostico/store/diagnosticoEmocionalStore';
import { StepWrapper, MoneyInput } from '@modules/diagnostico/components/DiagnosticoComponents';
import '@modules/diagnostico/styles/DiagnosticoEmocional.css';

const Step03_GastosMensais = () => {
  const navigate = useNavigate();
  const { 
    rendaMensal,
    gastosMensais,
    setGastosMensais,
    nextEtapa, 
    prevEtapa 
  } = useDiagnosticoEmocionalStore();

  const [gastosPorCategoria, setGastosPorCategoria] = useState({
    moradia: 0,
    transporte: 0,
    alimentacao: 0,
    cartao: 0,
    lazer: 0,
    outros: 0
  });

  const categorias = [
    {
      key: 'moradia',
      nome: 'Moradia',
      descricao: 'Aluguel, financiamento, contas básicas',
      icone: <Home size={24} />,
      color: '#3b82f6',
      sugestao: rendaMensal * 0.3
    },
    {
      key: 'transporte',
      nome: 'Transporte',
      descricao: 'Combustível, Uber, transporte público',
      icone: <Car size={24} />,
      color: '#f59e0b',
      sugestao: rendaMensal * 0.15
    },
    {
      key: 'alimentacao',
      nome: 'Alimentação',
      descricao: 'Mercado, delivery, restaurantes',
      icone: <ShoppingCart size={24} />,
      color: '#10b981',
      sugestao: rendaMensal * 0.15
    },
    {
      key: 'cartao',
      nome: 'Cartão de Crédito',
      descricao: 'Fatura do cartão e parcelamentos',
      icone: <CreditCard size={24} />,
      color: '#ef4444',
      sugestao: rendaMensal * 0.2
    },
    {
      key: 'lazer',
      nome: 'Lazer e Pessoal',
      descricao: 'Diversão, roupas, cuidados pessoais',
      icone: <Coffee size={24} />,
      color: '#8b5cf6',
      sugestao: rendaMensal * 0.1
    },
    {
      key: 'outros',
      nome: 'Outros',
      descricao: 'Demais gastos não categorizados',
      icone: <MoreHorizontal size={24} />,
      color: '#6b7280',
      sugestao: rendaMensal * 0.1
    }
  ];

  const totalGastosDetalhado = Object.values(gastosPorCategoria).reduce((total, valor) => total + valor, 0);
  
  // Pode continuar sempre, mesmo se não preencher nada
  const podeAvancar = true;

  const handleVoltar = () => {
    prevEtapa();
    navigate('/susto-consciente/renda');
  };

  const handleContinuar = () => {
    console.log('Step03: Tentando continuar...', { totalGastosDetalhado });
    
    // Salva o total dos gastos categorizados
    setGastosMensais(totalGastosDetalhado);
    
    // Avança para próxima etapa
    nextEtapa();
    navigate('/susto-consciente/dividas');
  };

  const handleValorCategoria = (categoria, valor) => {
    console.log('Atualizando categoria:', categoria, 'com valor:', valor);
    setGastosPorCategoria(prev => ({
      ...prev,
      [categoria]: valor
    }));
  };

  const calcularPorcentagem = (valor) => {
    if (rendaMensal === 0) return 0;
    return ((valor / rendaMensal) * 100).toFixed(1);
  };

  const getSugestaoTexto = (valor, sugestao) => {
    const percentual = calcularPorcentagem(valor);
    const sugestaoPercentual = calcularPorcentagem(sugestao);
    
    if (valor === 0) {
      return `Sugestão: até ${sugestaoPercentual}% da renda`;
    } else if (valor > sugestao * 1.2) {
      return `🔴 ${percentual}% (recomendado: até ${sugestaoPercentual}%)`;
    } else if (valor > sugestao) {
      return `🟡 ${percentual}% (recomendado: até ${sugestaoPercentual}%)`;
    } else {
      return `🟢 ${percentual}% (dentro do recomendado)`;
    }
  };

  return (
    <div className="diagnostico-emocional-wrapper">
      <div className="diagnostico-emocional-container">
        <StepWrapper
          titulo="Quanto sai todo mês?"
          subtitulo="Vamos mapear seus principais gastos para entender seu padrão de consumo"
          onVoltar={handleVoltar}
          onContinuar={handleContinuar}
          podeContinuar={podeAvancar}
          etapaAtual={3}
          totalEtapas={8}
        >
          <div className="gastos-intro">
            <div className="gastos-icon">
              <PieChart size={32} color="#3b82f6" />
            </div>
            <p className="gastos-description">
              <strong>Pode ser uma estimativa!</strong> Se não souber o valor exato de alguma categoria, 
              deixe em branco ou coloque uma estimativa. O importante é ter uma noção geral.
            </p>
          </div>

          <div className="gastos-detalhados">
            <h3 className="form-section-title">
              <DollarSign size={24} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
              Vamos detalhar por categoria
            </h3>
            <p className="form-section-description">
              Isso vai nos ajudar a criar estratégias mais precisas para seu perfil
            </p>

            <div className="categorias-gastos">
              {categorias.map((categoria) => (
                <div key={categoria.key} className="categoria-item">
                  <div className="categoria-header">
                    <div className="item-info-base">
                      <div 
                        className="categoria-icon"
                        style={{ color: categoria.color }}
                      >
                        {categoria.icone}
                      </div>
                      <div className="categoria-details">
                        <h4 className="categoria-nome">{categoria.nome}</h4>
                        <p className="categoria-descricao">{categoria.descricao}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="categoria-input">
                    <MoneyInput
                      value={gastosPorCategoria[categoria.key]}
                      onChange={(valor) => handleValorCategoria(categoria.key, valor)}
                      placeholder="R$ 0,00"
                      size="small"
                    />
                  </div>

                  <div className="categoria-feedback">
                    <span className="percentual-gasto">
                      {getSugestaoTexto(gastosPorCategoria[categoria.key], categoria.sugestao)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {totalGastosDetalhado > 0 && (
              <div className="resumo-gastos-detalhado">
                <div className="total-gastos">
                  <span className="total-label">Total dos gastos:</span>
                  <span className="total-valor">
                    R$ {totalGastosDetalhado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                
                {rendaMensal > 0 && (
                  <div className="comparativo-renda">
                    <div className="comparativo-item">
                      <span className="comparativo-label">Percentual da renda:</span>
                      <span className={`comparativo-valor ${totalGastosDetalhado > rendaMensal ? 'negativo' : 'neutro'}`}>
                        {calcularPorcentagem(totalGastosDetalhado)}%
                      </span>
                    </div>
                    
                    <div className="comparativo-item">
                      <span className="comparativo-label">
                        {totalGastosDetalhado > rendaMensal ? 'Déficit:' : 'Sobra estimada:'}
                      </span>
                      <span className={`comparativo-valor ${totalGastosDetalhado > rendaMensal ? 'negativo' : 'positivo'}`}>
                        R$ {Math.abs(rendaMensal - totalGastosDetalhado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                )}

                {totalGastosDetalhado > rendaMensal && (
                  <div className="alerta-gastos">
                    <p>
                      <strong>⚠️ Atenção:</strong> Seus gastos são maiores que sua renda. 
                      Vamos encontrar formas de equilibrar isso no seu plano!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="gastos-dica">
            <div className="dica-box">
              <h4>💡 Dicas para estimativas:</h4>
              <ul className="dica-lista">
                <li><strong>Moradia:</strong> Some aluguel + condomínio + luz + água + gás + internet</li>
                <li><strong>Transporte:</strong> Combustível, Uber, ônibus, manutenção do carro</li>
                <li><strong>Alimentação:</strong> Mercado + delivery + restaurantes + lanche no trabalho</li>
                <li><strong>Cartão:</strong> Valor médio da fatura mensal (sem considerar parcelamentos antigos)</li>
                <li><strong>Lazer:</strong> Cinema, academia, roupas, salão, hobbies</li>
              </ul>
            </div>
          </div>

          <div className="gastos-motivacao">
            <div className="motivacao-box">
              <p className="motivacao-text">
                <strong>🎯 Lembre-se:</strong> Não precisa ser perfeito! Depois vamos refinar 
                tudo no seu painel de controle. O importante agora é ter uma base.
              </p>
            </div>
          </div>
        </StepWrapper>
      </div>
    </div>
  );
};

export default Step03_GastosMensais;
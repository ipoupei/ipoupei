// src/modules/diagnostico/etapas/Step02_Renda.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, TrendingUp, TrendingDown, Minus, HelpCircle } from 'lucide-react';
import useDiagnosticoEmocionalStore from '@modules/diagnostico/store/diagnosticoEmocionalStore';
import { StepWrapper, MoneyInput, OptionCard } from '@modules/diagnostico/components/DiagnosticoComponents';
import '@modules/diagnostico/styles/DiagnosticoEmocional.css';

const Step02_Renda = () => {
  const navigate = useNavigate();
  const { 
    rendaMensal, 
    sobraOuFalta,
    setRendaMensal, 
    setSobraOuFalta,
    nextEtapa, 
    prevEtapa,
    podeAvancar 
  } = useDiagnosticoEmocionalStore();

  const handleVoltar = () => {
    prevEtapa();
    navigate('/susto-consciente');
  };

  const handleContinuar = () => {
    if (podeAvancar) {
      nextEtapa();
      navigate('/susto-consciente/gastos-mensais');
    }
  };

  const opcoesFinaisMes = [
    {
      value: 'sobra',
      titulo: '😊 Sempre sobra dinheiro',
      descricao: 'Consigo guardar ou gastar com extras',
      icone: <TrendingUp size={24} color="#10b981" />,
      color: 'green'
    },
    {
      value: 'zerado',
      titulo: '😐 Fico no zero a zero',
      descricao: 'Gasto quase tudo que ganho',
      icone: <Minus size={24} color="#6b7280" />,
      color: 'gray'
    },
    {
      value: 'falta',
      titulo: '😰 Sempre falta dinheiro',
      descricao: 'Preciso me virar para fechar o mês',
      icone: <TrendingDown size={24} color="#ef4444" />,
      color: 'red'
    },
    {
      value: 'nao_sei',
      titulo: '🤷‍♂️ Não sei dizer',
      descricao: 'Não tenho controle dos meus gastos',
      icone: <HelpCircle size={24} color="#f59e0b" />,
      color: 'orange'
    }
  ];

  const getRendaFeedback = () => {
    if (rendaMensal >= 10000) return "💰 Excelente renda! Vamos otimizar para você multiplicar ainda mais.";
    if (rendaMensal >= 5000) return "👍 Boa renda! Há muito potencial para crescimento.";
    if (rendaMensal >= 2000) return "💪 Renda dentro da média. Vamos maximizar cada real.";
    if (rendaMensal >= 1000) return "🎯 Toda renda conta! Vamos criar estratégias eficientes.";
    return "🚀 Vamos começar do básico e construir juntos!";
  };

  return (
    <div className="diagnostico-emocional-wrapper">
      <div className="diagnostico-emocional-container">
        <StepWrapper
          titulo="Vamos começar pelo básico"
          subtitulo="Preciso entender sua situação atual para criar o melhor plano"
          onVoltar={handleVoltar}
          onContinuar={handleContinuar}
          podeContinuar={podeAvancar}
          etapaAtual={2}
          totalEtapas={8}
        >
          <div className="form-section">
            <h3 className="form-section-title">
              <DollarSign size={24} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
              Quanto você ganha por mês?
            </h3>
            <p className="form-section-description">
              Considere sua <strong>renda líquida total</strong> (o que efetivamente cai na sua conta)
            </p>
            
            <MoneyInput
              value={rendaMensal}
              onChange={setRendaMensal}
              placeholder="R$ 0,00"
              size="large"
              autoFocus
            />

            {rendaMensal > 0 && (
              <div className="renda-feedback">
                <p className="feedback-text">{getRendaFeedback()}</p>
              </div>
            )}
          </div>

          {rendaMensal > 0 && (
            <div className="form-section">
              <h3 className="form-section-title">
                E no final do mês, normalmente...
              </h3>
              <p className="form-section-description">
                Seja honesto! Isso vai definir toda nossa estratégia.
              </p>
              
              <div className="option-cards-grid single-column">
                {opcoesFinaisMes.map((opcao) => (
                  <OptionCard
                    key={opcao.value}
                    value={opcao.value}
                    titulo={opcao.titulo}
                    descricao={opcao.descricao}
                    icone={opcao.icone}
                    color={opcao.color}
                    isSelected={sobraOuFalta === opcao.value}
                    onClick={setSobraOuFalta}
                    size="medium"
                  />
                ))}
              </div>

              {sobraOuFalta && (
                <div className="situacao-feedback">
                  <div className="feedback-box">
                    {sobraOuFalta === 'sobra' && (
                      <p>
                        <strong>🎉 Ótimo!</strong> Você já tem uma base sólida. Vamos potencializar isso!
                      </p>
                    )}
                    {sobraOuFalta === 'zerado' && (
                      <p>
                        <strong>👍 Entendi!</strong> Você está equilibrado, mas podemos melhorar muito.
                      </p>
                    )}
                    {sobraOuFalta === 'falta' && (
                      <p>
                        <strong>🎯 Sem problemas!</strong> Já ajudei muitas pessoas nessa situação. Vamos virar esse jogo!
                      </p>
                    )}
                    {sobraOuFalta === 'nao_sei' && (
                      <p>
                        <strong>📊 Perfeito!</strong> Vamos trazer clareza total para sua vida financeira.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </StepWrapper>
      </div>
    </div>
  );
};

export default Step02_Renda;
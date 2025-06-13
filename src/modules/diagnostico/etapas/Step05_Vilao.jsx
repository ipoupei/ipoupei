// src/modules/diagnostico/etapas/Step05_VilaoEtapa.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Target } from 'lucide-react';
import useDiagnosticoEmocionalStore from '@modules/diagnostico/store/diagnosticoEmocionalStore';
import { StepWrapper, OptionCard } from '@modules/diagnostico/components/DiagnosticoComponents';
import '@modules/diagnostico/styles/DiagnosticoEmocional.css';

const Step05_VilaoEtapa = () => {
  const navigate = useNavigate();
  const { 
    vilao,
    setVilao,
    nextEtapa, 
    prevEtapa,
    podeAvancar 
  } = useDiagnosticoEmocionalStore();

  const handleVoltar = () => {
    prevEtapa();
    navigate('/susto-consciente/dividas');
  };

  const handleContinuar = () => {
    if (podeAvancar) {
      nextEtapa();
      navigate('/susto-consciente/saldo-contas');
    }
  };

  const opcoesMaiorGasto = [
    {
      value: 'casa',
      titulo: '🏠 Casa e moradia',
      descricao: 'Aluguel, financiamento, contas básicas',
      estrategia: 'Renegociação, mudança, otimização',
      color: 'blue'
    },
    {
      value: 'transporte',
      titulo: '🚗 Transporte',
      descricao: 'Combustível, Uber, transporte público',
      estrategia: 'Otimização de rotas, alternativas',
      color: 'orange'
    },
    {
      value: 'alimentacao',
      titulo: '🍔 Alimentação',
      descricao: 'Mercado, delivery, restaurantes',
      estrategia: 'Planejamento, compras inteligentes',
      color: 'green'
    },
    {
      value: 'cartao',
      titulo: '💳 Cartão de crédito',
      descricao: 'Faturas altas, parcelamentos, juros',
      estrategia: 'Quitação estratégica, controle',
      color: 'red'
    },
    {
      value: 'lazer',
      titulo: '🎭 Lazer e diversão',
      descricao: 'Restaurantes, viagens, entretenimento',
      estrategia: 'Orçamento controlado, alternativas',
      color: 'purple'
    },
    {
      value: 'roupas_pessoal',
      titulo: '👕 Roupas e cuidados',
      descricao: 'Roupas, beleza, cuidados pessoais',
      estrategia: 'Compras conscientes, timing',
      color: 'pink'
    },
    {
      value: 'desconhecido',
      titulo: '🤷‍♂️ Não sei onde vai',
      descricao: 'O dinheiro simplesmente some',
      estrategia: 'Rastreamento total, controle',
      color: 'gray'
    }
  ];

  const getDicaVilao = (vilaoSelecionado) => {
    const dicas = {
      casa: "💡 Casa é essencial, mas dá para negociar contas, buscar eficiência energética e até considerar mudanças estratégicas.",
      transporte: "💡 Transporte pode ser otimizado com planejamento de rotas, caronas, transporte público ou até mudança de local.",
      alimentacao: "💡 Alimentação é fundamental, mas planejamento de compras e redução de delivery podem gerar grande economia.",
      cartao: "💡 Cartão é o vilão #1! Vamos criar uma estratégia de quitação e controle para quebrar esse ciclo.",
      lazer: "💡 Diversão é importante para qualidade de vida, mas dá para ser mais estratégico sem abrir mão do prazer.",
      roupas_pessoal: "💡 Cuidados pessoais são importantes, mas timing e critério nas compras fazem toda diferença.",
      desconhecido: "💡 Esse é o mais perigoso! Vamos implementar um sistema de rastreamento para descobrir os vazamentos."
    };
    return dicas[vilaoSelecionado] || "";
  };

  return (
    <div className="diagnostico-emocional-wrapper">
      <div className="diagnostico-emocional-container">
        <StepWrapper
          titulo="Onde seu dinheiro mais some?"
          subtitulo="Vamos identificar o maior vilão do seu orçamento para atacá-lo estrategicamente"
          onVoltar={handleVoltar}
          onContinuar={handleContinuar}
          podeContinuar={podeAvancar}
          etapaAtual={4}
          totalEtapas={7}
        >
          <div className="villain-intro">
            <div className="villain-icon">
              <AlertTriangle size={32} color="#f59e0b" />
            </div>
            <p className="villain-description">
              Todo mundo tem aquele gasto que "devora" a maior parte do dinheiro. 
              Identificar o vilão é o primeiro passo para controlá-lo!
            </p>
          </div>

          <div className="option-cards-grid">
            {opcoesMaiorGasto.map((opcao) => (
              <OptionCard
                key={opcao.value}
                value={opcao.value}
                titulo={opcao.titulo}
                descricao={opcao.descricao}
                subtitle={`Estratégia: ${opcao.estrategia}`}
                color={opcao.color}
                isSelected={vilao === opcao.value}
                onClick={setVilao}
                size="medium"
              />
            ))}
          </div>
          
          {vilao && (
            <div className="villain-selected-feedback">
              <div className="feedback-box">
                <div className="feedback-header">
                  <Target size={20} color="#10b981" />
                  <strong>Vilão identificado!</strong>
                </div>
                <p className="dica-vilao">
                  {getDicaVilao(vilao)}
                </p>
                <p className="proxima-acao">
                  No seu plano personalizado, vou te mostrar <strong>estratégias específicas</strong> 
                  para domar esse vilão sem sacrificar sua qualidade de vida.
                </p>
              </div>
            </div>
          )}

          {!vilao && (
            <div className="villain-help">
              <div className="help-box">
                <h4>🤔 Não tem certeza?</h4>
                <p>
                  Pense no que te faz pensar "Nossa, gastei demais esse mês!" 
                  ou "Para onde foi meu dinheiro?". Geralmente é algo que se repete todo mês.
                </p>
              </div>
            </div>
          )}

          <div className="villain-motivacao">
            <div className="motivacao-box">
              <p className="motivacao-text">
                <strong>🎯 Importante:</strong> Não se culpe pelo vilão! Todos nós temos gastos que 
                descontrolam. O segredo é identificar, entender e criar estratégias inteligentes.
              </p>
            </div>
          </div>
        </StepWrapper>
      </div>
    </div>
  );
};

export default Step05_VilaoEtapa;
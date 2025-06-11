// src/modules/diagnostico/etapas/Step07_ResumoDiagnostico.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Target,
  Calendar,
  DollarSign,
  Award 
} from 'lucide-react';
import useDiagnosticoEmocionalStore from '@modules/diagnostico/store/diagnosticoEmocionalStore';
import { StepWrapper, ResultadoVisual, AlertBox } from '@modules/diagnostico/components/DiagnosticoComponents';
import '@modules/diagnostico/styles/DiagnosticoEmocional.css';

const Step07_ResumoDiagnostico = () => {
  const navigate = useNavigate();
  const { 
    rendaMensal,
    sobraOuFalta,
    gastosMensais,
    vilao,
    dividas,
    saldoContas,
    calcularSituacaoFinanceira,
    nextEtapa, 
    prevEtapa,
    finalizarDiagnostico 
  } = useDiagnosticoEmocionalStore();

  const [situacao, setSituacao] = useState(null);
  const [projecoes, setProjecoes] = useState(null);
  const [perfilUsuario, setPerfilUsuario] = useState(null);

  useEffect(() => {
    const resultado = calcularSituacaoFinanceira();
    setSituacao(resultado);
    
    // Calcular projeções
    calcularProjecoes();
    
    // Definir perfil do usuário
    definirPerfilUsuario();
  }, [calcularSituacaoFinanceira]);

  const calcularProjecoes = () => {
    const saldoAtual = getSaldoAtual();
    const fluxoMensal = getFluxoMensal();
    
    const projecao3Meses = saldoAtual + (fluxoMensal * 3);
    const projecao6Meses = saldoAtual + (fluxoMensal * 6);
    const projecao5Anos = saldoAtual + (fluxoMensal * 60); // 5 anos = 60 meses
    
    setProjecoes({
      atual: saldoAtual,
      tresMeses: projecao3Meses,
      seisMeses: projecao6Meses,
      cincoAnos: projecao5Anos,
      fluxoMensal: fluxoMensal
    });
  };

  const definirPerfilUsuario = () => {
    let perfil = '';
    let descricao = '';
    let cor = '';
    
    if (sobraOuFalta === 'sobra' && vilao !== 'desconhecido') {
      perfil = '🎯 Organizador Estratégico';
      descricao = 'Você tem controle, mas pode otimizar ainda mais';
      cor = 'green';
    } else if (sobraOuFalta === 'sobra' && vilao === 'desconhecido') {
      perfil = '💰 Poupador Inconsciente';
      descricao = 'Sobra dinheiro, mas sem estratégia clara';
      cor = 'blue';
    } else if (sobraOuFalta === 'zerado' && vilao !== 'desconhecido') {
      perfil = '⚖️ Equilibrista Consciente';
      descricao = 'No limite, mas sabe onde gasta';
      cor = 'orange';
    } else if (sobraOuFalta === 'falta') {
      perfil = '🚨 Desafiado Financeiro';
      descricao = 'Situação crítica, mas reversível';
      cor = 'red';
    } else {
      perfil = '🤷‍♂️ Explorador Financeiro';
      descricao = 'Descobrindo sua relação com o dinheiro';
      cor = 'gray';
    }
    
    setPerfilUsuario({ perfil, descricao, cor });
  };

  const getSaldoAtual = () => {
    if (!saldoContas || saldoContas.situacao === 'nao' || saldoContas.situacao === 'nao_sei') {
      return 0;
    }
    
    if (saldoContas.tipo === 'detalhado') {
      return saldoContas.totalSaldo || 0;
    }
    
    return saldoContas.saldoTotal || 0;
  };

  const getFluxoMensal = () => {
    if (gastosMensais > 0) {
      return rendaMensal - gastosMensais;
    }
    
    // Estimativa baseada na resposta sobre sobra/falta
    if (sobraOuFalta === 'sobra') return rendaMensal * 0.1;
    if (sobraOuFalta === 'zerado') return 0;
    if (sobraOuFalta === 'falta') return rendaMensal * -0.1;
    return 0;
  };

  const handleVoltar = () => {
    prevEtapa();
    navigate('/susto-consciente/saldo-contas');
  };

  const handleContinuar = () => {
    finalizarDiagnostico();
    nextEtapa();
    navigate('/susto-consciente/plano');
  };

  const getIconeSituacao = (tipo) => {
    switch (tipo) {
      case 'critico':
        return <AlertTriangle size={48} color="#ef4444" />;
      case 'atencao':
        return <TrendingDown size={48} color="#f59e0b" />;
      case 'bom':
        return <CheckCircle size={48} color="#10b981" />;
      default:
        return <TrendingUp size={48} color="#6b7280" />;
    }
  };

  const getVilaoTexto = () => {
    const viloes = {
      casa: '🏠 Casa e moradia',
      transporte: '🚗 Transporte',
      alimentacao: '🍔 Alimentação',
      cartao: '💳 Cartão de crédito',
      lazer: '🎭 Lazer e diversão',
      roupas_pessoal: '👕 Roupas e cuidados',
      desconhecido: '🤷‍♂️ Não sabe onde vai'
    };
    return viloes[vilao] || 'Não identificado';
  };

  const getDividasTexto = () => {
    if (!dividas || dividas.situacao === 'nao') return '✅ Sem dívidas';
    if (dividas.situacao === 'nao_sei') return '🤷‍♂️ Situação indefinida';
    if (dividas.tipo === 'detalhado' && dividas.totalValor) {
      return `📊 R$ ${dividas.totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }
    return '📊 Com pendências';
  };

  const calcularEconomiaPotencial = () => {
    const baseEconomia = rendaMensal * 0.15; // 15% da renda
    const maxEconomia = rendaMensal * 0.30; // 30% da renda
    
    return {
      minima: baseEconomia,
      maxima: maxEconomia
    };
  };

  if (!situacao || !projecoes || !perfilUsuario) {
    return (
      <div className="diagnostico-emocional-wrapper">
        <div className="diagnostico-emocional-container">
          <div className="loading-diagnostico">
            <div className="spinner"></div>
            <p>Analisando sua situação financeira...</p>
          </div>
        </div>
      </div>
    );
  }

  const economiaPotencial = calcularEconomiaPotencial();

  return (
    <div className="diagnostico-emocional-wrapper">
      <div className="diagnostico-emocional-container">
        <StepWrapper
          titulo="Seu Diagnóstico Financeiro Completo"
          subtitulo="Baseado nas suas respostas, aqui está o raio-x da sua vida financeira"
          onVoltar={handleVoltar}
          onContinuar={handleContinuar}
          textoBotao="Ver Meu Plano Personalizado"
          etapaAtual={6}
          totalEtapas={7}
        >
          <div className="diagnostico-resultado">
            {/* Selo do Perfil */}
            <div className="perfil-usuario">
              <div className="perfil-selo">
                <Award size={24} color="#f59e0b" />
                <div className="perfil-info">
                  <h3 className={`perfil-titulo ${perfilUsuario.cor}`}>
                    {perfilUsuario.perfil}
                  </h3>
                  <p className="perfil-descricao">{perfilUsuario.descricao}</p>
                </div>
              </div>
            </div>

            {/* Situação Atual */}
            <div className="situacao-header">
              <div className="situacao-icon">
                {getIconeSituacao(situacao.tipo)}
              </div>
              <div className="situacao-titulo">
                <h3>{situacao.titulo}</h3>
                <p>{situacao.descricao}</p>
              </div>
            </div>

            <ResultadoVisual situacao={situacao} />

            {/* Resumo dos Dados */}
            <div className="resumo-dados">
              <h4 className="resumo-title">📊 Resumo da sua situação:</h4>
              
              <div className="dados-grid">
                <div className="dado-item">
                  <span className="dado-label">Renda mensal:</span>
                  <span className="dado-valor positivo">
                    R$ {rendaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                
                <div className="dado-item">
                  <span className="dado-label">Situação no fim do mês:</span>
                  <span className={`dado-valor ${sobraOuFalta === 'sobra' ? 'positivo' : sobraOuFalta === 'falta' ? 'negativo' : 'neutro'}`}>
                    {sobraOuFalta === 'sobra' && '😊 Sobra dinheiro'}
                    {sobraOuFalta === 'zerado' && '😐 Fica no zero'}
                    {sobraOuFalta === 'falta' && '😰 Falta dinheiro'}
                    {sobraOuFalta === 'nao_sei' && '🤷‍♂️ Não sabe'}
                  </span>
                </div>
                
                <div className="dado-item">
                  <span className="dado-label">Maior vilão:</span>
                  <span className="dado-valor neutro">
                    {getVilaoTexto()}
                  </span>
                </div>
                
                <div className="dado-item">
                  <span className="dado-label">Dívidas:</span>
                  <span className={`dado-valor ${dividas && dividas.situacao !== 'nao' ? 'negativo' : 'positivo'}`}>
                    {getDividasTexto()}
                  </span>
                </div>

                <div className="dado-item">
                  <span className="dado-label">Saldo atual:</span>
                  <span className={`dado-valor ${projecoes.atual > 0 ? 'positivo' : projecoes.atual < 0 ? 'negativo' : 'neutro'}`}>
                    R$ {projecoes.atual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Projeções */}
            <div className="projecoes-futuro">
              <h4 className="projecoes-title">
                <Calendar size={20} />
                📈 Projeção do seu saldo futuro:
              </h4>
              
              <div className="projecoes-grid">
                <div className="projecao-item">
                  <span className="projecao-periodo">Em 3 meses:</span>
                  <span className={`projecao-valor ${projecoes.tresMeses > projecoes.atual ? 'positivo' : 'negativo'}`}>
                    R$ {projecoes.tresMeses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                
                <div className="projecao-item">
                  <span className="projecao-periodo">Em 6 meses:</span>
                  <span className={`projecao-valor ${projecoes.seisMeses > projecoes.atual ? 'positivo' : 'negativo'}`}>
                    R$ {projecoes.seisMeses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                
                <div className="projecao-item destaque">
                  <span className="projecao-periodo">Em 5 anos:</span>
                  <span className={`projecao-valor ${projecoes.cincoAnos > projecoes.atual ? 'positivo' : 'negativo'}`}>
                    R$ {projecoes.cincoAnos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="projecao-observacao">
                <p>
                  <strong>📝 Baseado no seu padrão atual.</strong> Com otimizações, 
                  esses números podem ser muito melhores!
                </p>
              </div>
            </div>

            {/* Alertas baseados na situação */}
            {situacao.tipo === 'critico' && (
              <AlertBox tipo="critico" titulo="🚨 Ação Urgente Necessária">
                <p>
                  Sua situação precisa de atenção <strong>imediata</strong>. 
                  Sem mudanças, os problemas podem se agravar rapidamente.
                </p>
                <ul>
                  <li>✓ Corte gastos não essenciais imediatamente</li>
                  <li>✓ Renegocie dívidas com urgência</li>
                  <li>✓ Busque renda extra temporária</li>
                  <li>✓ Evite novos compromissos financeiros</li>
                </ul>
              </AlertBox>
            )}

            {situacao.tipo === 'atencao' && (
              <AlertBox tipo="atencao" titulo="⚠️ Ponto de Atenção">
                <p>
                  Você está no caminho certo, mas alguns ajustes podem 
                  fazer uma <strong>grande diferença</strong>.
                </p>
                <ul>
                  <li>✓ Organize melhor o controle de gastos</li>
                  <li>✓ Crie uma reserva de emergência</li>
                  <li>✓ Otimize suas maiores despesas</li>
                  <li>✓ Planeje investimentos básicos</li>
                </ul>
              </AlertBox>
            )}

            {situacao.tipo === 'bom' && (
              <AlertBox tipo="bom" titulo="🎉 Situação Sob Controle">
                <p>
                  Parabéns! Você tem uma base sólida. Agora vamos 
                  <strong> potencializar</strong> seus resultados.
                </p>
                <ul>
                  <li>✓ Maximize o rendimento dos investimentos</li>
                  <li>✓ Diversifique fontes de renda</li>
                  <li>✓ Planeje objetivos de longo prazo</li>
                  <li>✓ Otimize a gestão tributária</li>
                </ul>
              </AlertBox>
            )}

            {/* Potencial de Economia */}
            <div className="economia-potencial">
              <h4 className="economia-title">
                <DollarSign size={20} />
                💰 Seu potencial de economia mensal:
              </h4>
              <div className="economia-range">
                <div className="economia-valores">
                  <span className="economia-min">
                    R$ {economiaPotencial.minima.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="economia-ate">até</span>
                  <span className="economia-max">
                    R$ {economiaPotencial.maxima.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <p className="economia-desc">
                  *Baseado na otimização dos seus gastos e implementação de estratégias inteligentes
                </p>
              </div>
            </div>

            {/* Próximos Passos */}
            <div className="proximos-passos">
              <h4 className="passos-title">
                <Target size={20} />
                🎯 Seus próximos passos:
              </h4>
              <div className="passos-list">
                <div className="passo-item">
                  <span className="passo-numero">1</span>
                  <span className="passo-texto">Receber plano de ação personalizado</span>
                </div>
                <div className="passo-item">
                  <span className="passo-numero">2</span>
                  <span className="passo-texto">Configurar o iPoupei com dados reais</span>
                </div>
                <div className="passo-item">
                  <span className="passo-numero">3</span>
                  <span className="passo-texto">Implementar estratégias gradualmente</span>
                </div>
                <div className="passo-item">
                  <span className="passo-numero">4</span>
                  <span className="passo-texto">Acompanhar resultados em tempo real</span>
                </div>
              </div>
            </div>
          </div>
        </StepWrapper>
      </div>
    </div>
  );
};

export default Step07_ResumoDiagnostico;
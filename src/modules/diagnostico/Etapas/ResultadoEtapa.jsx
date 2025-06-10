// src/modules/diagnostico/etapas/ResultadoEtapa.jsx
import { useDiagnosticoFlowStore } from '../store/diagnosticoFlowStore';
import { useNavigate } from 'react-router-dom';
import Button from '../../../shared/components/ui/Button';

const ResultadoEtapa = () => {
  const { 
    scoreCalculado, 
    etapaJornada, 
    relatorioCompleto, 
    dadosColetados,
    getEtapaAtual 
  } = useDiagnosticoFlowStore();
  
  const navigate = useNavigate();
  const etapa = getEtapaAtual();

  const handleIrParaDashboard = () => {
    navigate('/dashboard');
  };

  const handleVerRelatorioCompleto = () => {
    // Aqui você pode abrir um modal com relatório detalhado
    // ou navegar para uma página específica
    console.log('Relatório completo:', relatorioCompleto);
  };

  const getCorDoScore = (score) => {
    if (score <= 25) return '#ef4444';
    if (score <= 50) return '#f97316';
    if (score <= 75) return '#eab308';
    return '#22c55e';
  };

  const getMensagemMotivacional = (etapaJornada) => {
    const mensagens = {
      1: '🌱 Todo grande investidor começou exatamente onde você está agora!',
      2: '🔥 O despertar é o primeiro passo. Agora é hora de agir!',
      3: '📊 Você está se organizando! Continue assim e verá resultados.',
      4: '💪 Bom controle inicial! Hora de ser mais consistente.',
      5: '🎯 Sua disciplina está se desenvolvendo. Mantenha o foco!',
      6: '🚀 Com planejamento você vai longe. Continue evoluindo!',
      7: '💎 Reserva de emergência é segurança. Você está protegido!',
      8: '📈 Parabéns por investir! Agora é expandir conhecimento.',
      9: '🏆 Investidor experiente! Você inspira outras pessoas.',
      10: '👑 Liberdade financeira! Você chegou ao topo da jornada!'
    };
    return mensagens[etapaJornada?.id] || '🎉 Continue sua jornada!';
  };

  const calcularResumoFinanceiro = () => {
    const receitas = dadosColetados.receitas?.reduce((sum, r) => sum + (r.valor || 0), 0) || 0;
    const gastosFixos = dadosColetados.despesasFixas?.reduce((sum, d) => sum + (d.valor || 0), 0) || 0;
    const gastosVariaveis = dadosColetados.despesasVariaveis?.reduce((sum, d) => sum + (d.valor || 0), 0) || 0;
    const gastoTotal = gastosFixos + gastosVariaveis;
    const sobra = receitas - gastoTotal;
    const percentualGasto = receitas > 0 ? (gastoTotal / receitas) * 100 : 0;

    return {
      receitas,
      gastosFixos,
      gastosVariaveis,
      gastoTotal,
      sobra,
      percentualGasto
    };
  };

  const resumo = calcularResumoFinanceiro();

  if (!scoreCalculado || !etapaJornada) {
    return (
      <div className="etapa-container resultado-etapa">
        <div className="erro-resultado">
          <h2>❌ Erro no processamento</h2>
          <p>Ocorreu um erro ao calcular seu diagnóstico. Tente novamente.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="etapa-container resultado-etapa">
      <div className="etapa-header">
        <div className="etapa-icone-grande">{etapa.icone}</div>
        <h1>{etapa.titulo}</h1>
        <p className="etapa-subtitulo">{etapa.subtitulo}</p>
      </div>

      <div className="resultado-content">
        {/* Score Principal */}
        <div className="score-principal">
          <div className="score-visual">
            <div 
              className="score-circle"
              style={{ 
                background: `conic-gradient(${getCorDoScore(scoreCalculado)} ${scoreCalculado * 3.6}deg, #e5e7eb 0deg)`
              }}
            >
              <div className="score-inner">
                <span className="score-numero">{scoreCalculado}</span>
                <span className="score-label">pontos</span>
              </div>
            </div>
          </div>
          
          <div className="score-info">
            <h2>Seu Score Financeiro</h2>
            <p className="score-descricao">
              {scoreCalculado <= 25 ? 'Iniciante - Muita margem para crescer!' :
               scoreCalculado <= 50 ? 'Intermediário - No caminho certo!' :
               scoreCalculado <= 75 ? 'Avançado - Muito bem!' :
               'Expert - Parabéns!'}
            </p>
          </div>
        </div>

        {/* Etapa da Jornada */}
        <div className="etapa-jornada-resultado">
          <div className="etapa-badge" style={{ backgroundColor: etapaJornada.cor }}>
            <h3>Etapa {etapaJornada.id}: {etapaJornada.nome}</h3>
            <p>{etapaJornada.descricao}</p>
          </div>
          
          <div className="mensagem-motivacional">
            <p>{getMensagemMotivacional(etapaJornada)}</p>
          </div>
        </div>

        {/* Resumo Financeiro */}
        <div className="resumo-financeiro">
          <h3>📊 Seu Resumo Financeiro</h3>
          <div className="resumo-grid">
            <div className="resumo-item receita">
              <div className="resumo-icone">💰</div>
              <div>
                <span className="resumo-label">Receita Total</span>
                <span className="resumo-valor">R$ {resumo.receitas.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
              </div>
            </div>
            
            <div className="resumo-item gasto">
              <div className="resumo-icone">💸</div>
              <div>
                <span className="resumo-label">Gastos Totais</span>
                <span className="resumo-valor">R$ {resumo.gastoTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
              </div>
            </div>
            
            <div className={`resumo-item sobra ${resumo.sobra >= 0 ? 'positiva' : 'negativa'}`}>
              <div className="resumo-icone">{resumo.sobra >= 0 ? '😊' : '😰'}</div>
              <div>
                <span className="resumo-label">{resumo.sobra >= 0 ? 'Sobra' : 'Déficit'}</span>
                <span className="resumo-valor">R$ {Math.abs(resumo.sobra).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
              </div>
            </div>
            
            <div className="resumo-item percentual">
              <div className="resumo-icone">📈</div>
              <div>
                <span className="resumo-label">% dos Gastos</span>
                <span className="resumo-valor">{resumo.percentualGasto.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Análise dos Fatores */}
        <div className="fatores-analise">
          <h3>🔍 Análise Detalhada</h3>
          <div className="fatores-lista">
            {relatorioCompleto?.fatores?.map((fator, index) => (
              <div key={index} className="fator-item">
                {fator}
              </div>
            ))}
          </div>
        </div>

        {/* Próximos Passos */}
        <div className="proximos-passos">
          <h3>🎯 Seus Próximos Passos</h3>
          <div className="passos-lista">
            {relatorioCompleto?.proximosPassos?.map((passo, index) => (
              <div key={index} className="passo-item">
                <div className="passo-numero">{index + 1}</div>
                <span>{passo}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Situação de Dívidas */}
        {dadosColetados.dividas?.temDividas && (
          <div className="alerta-dividas">
            <h3>⚠️ Atenção às Dívidas</h3>
            <p>Você indicou ter dívidas. Priorize a quitação delas antes de pensar em investimentos.</p>
            <div className="dica-dividas">
              <strong>💡 Dica:</strong> Liste todas as dívidas, organize por maior taxa de juros e foque em quitar uma por vez.
            </div>
          </div>
        )}
      </div>

      <div className="resultado-footer">
        <Button 
          onClick={handleVerRelatorioCompleto} 
          variant="secondary"
        >
          Ver Relatório Completo
        </Button>
        <Button 
          onClick={handleIrParaDashboard} 
          variant="primary" 
          size="large"
        >
          Começar a Usar o iPoupei
        </Button>
      </div>
    </div>
  );
};

export default ResultadoEtapa;
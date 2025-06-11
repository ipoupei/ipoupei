// src/modules/diagnostico/etapas/PercepcaoEtapa.jsx
import { useState } from 'react';
import { useDiagnosticoFlowStore } from '../store/diagnosticoFlowStore';
import Button from '../../../shared/components/ui/Button';

const PercepcaoEtapa = () => {
  const { proximaEtapa, voltarEtapa, salvarDadosPercepcao, getEtapaAtual } = useDiagnosticoFlowStore();
  const etapa = getEtapaAtual();

  const [respostas, setRespostas] = useState({
    controleFinanceiro: '',
    disciplinaGastos: '',
    planejamentoFuturo: '',
    sentimentoGeral: ''
  });

  const handleResposta = (pergunta, valor) => {
    setRespostas(prev => ({
      ...prev,
      [pergunta]: valor
    }));
  };

  const handleProxima = () => {
    salvarDadosPercepcao(respostas);
    proximaEtapa();
  };

  const isCompleto = Object.values(respostas).every(r => r !== '');

  return (
    <div className="etapa-container percepcao-etapa">
      <div className="etapa-header">
        <div className="etapa-icone-grande">{etapa.icone}</div>
        <h1>{etapa.titulo}</h1>
        <p className="etapa-subtitulo">{etapa.subtitulo}</p>
      </div>

      <div className="questionario">
        {/* Pergunta 1 */}
        <div className="pergunta-grupo">
          <h3>Como você avalia seu controle financeiro atual?</h3>
          <div className="opcoes-grid">
            {[
              { valor: 'nenhum', label: '😰 Não tenho controle nenhum', cor: '#ef4444' },
              { valor: 'pouco', label: '😐 Tenho pouco controle', cor: '#f97316' },
              { valor: 'parcial', label: '🙂 Tenho controle parcial', cor: '#eab308' },
              { valor: 'total', label: '😎 Tenho controle total', cor: '#22c55e' }
            ].map(opcao => (
              <button
                key={opcao.valor}
                className={`opcao-btn ${respostas.controleFinanceiro === opcao.valor ? 'selecionada' : ''}`}
                onClick={() => handleResposta('controleFinanceiro', opcao.valor)}
                style={{ borderColor: respostas.controleFinanceiro === opcao.valor ? opcao.cor : '#e5e7eb' }}
              >
                {opcao.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pergunta 2 */}
        <div className="pergunta-grupo">
          <h3>Com que frequência você controla seus gastos?</h3>
          <div className="opcoes-grid">
            {[
              { valor: 'nunca', label: '🤷‍♂️ Nunca controlo', cor: '#ef4444' },
              { valor: 'raramente', label: '😅 Raramente', cor: '#f97316' },
              { valor: 'as-vezes', label: '🤔 Às vezes', cor: '#eab308' },
              { valor: 'sempre', label: '💪 Sempre controlo', cor: '#22c55e' }
            ].map(opcao => (
              <button
                key={opcao.valor}
                className={`opcao-btn ${respostas.disciplinaGastos === opcao.valor ? 'selecionada' : ''}`}
                onClick={() => handleResposta('disciplinaGastos', opcao.valor)}
                style={{ borderColor: respostas.disciplinaGastos === opcao.valor ? opcao.cor : '#e5e7eb' }}
              >
                {opcao.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pergunta 3 */}
        <div className="pergunta-grupo">
          <h3>Você planeja seu futuro financeiro?</h3>
          <div className="opcoes-grid">
            {[
              { valor: 'nao', label: '😟 Não penso nisso', cor: '#ef4444' },
              { valor: 'pensando', label: '🤯 Estou pensando em começar', cor: '#f97316' },
              { valor: 'sim-basico', label: '📝 Sim, tenho planos básicos', cor: '#eab308' },
              { valor: 'sim-planos', label: '🎯 Sim, tenho planos detalhados', cor: '#22c55e' }
            ].map(opcao => (
              <button
                key={opcao.valor}
                className={`opcao-btn ${respostas.planejamentoFuturo === opcao.valor ? 'selecionada' : ''}`}
                onClick={() => handleResposta('planejamentoFuturo', opcao.valor)}
                style={{ borderColor: respostas.planejamentoFuturo === opcao.valor ? opcao.cor : '#e5e7eb' }}
              >
                {opcao.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pergunta 4 */}
        <div className="pergunta-grupo">
          <h3>Como você se sente em relação ao dinheiro?</h3>
          <div className="opcoes-grid">
            {[
              { valor: 'ansioso', label: '😰 Ansioso e preocupado', cor: '#ef4444' },
              { valor: 'confuso', label: '😵 Confuso, não sei o que fazer', cor: '#f97316' },
              { valor: 'esperancoso', label: '😊 Esperançoso, quero melhorar', cor: '#eab308' },
              { valor: 'confiante', label: '😎 Confiante no meu futuro', cor: '#22c55e' }
            ].map(opcao => (
              <button
                key={opcao.valor}
                className={`opcao-btn ${respostas.sentimentoGeral === opcao.valor ? 'selecionada' : ''}`}
                onClick={() => handleResposta('sentimentoGeral', opcao.valor)}
                style={{ borderColor: respostas.sentimentoGeral === opcao.valor ? opcao.cor : '#e5e7eb' }}
              >
                {opcao.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="etapa-footer">
        <Button onClick={voltarEtapa} variant="secondary">
          Voltar
        </Button>
        <Button 
          onClick={handleProxima} 
          variant="primary" 
          disabled={!isCompleto}
        >
          Continuar
        </Button>
      </div>
    </div>
  );
};

export default PercepcaoEtapa;
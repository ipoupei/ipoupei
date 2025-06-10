// src/modules/diagnostico/etapas/DividasEtapa.jsx
import { useState } from 'react';
import { useDiagnosticoFlowStore } from '../store/diagnosticoFlowStore';
import Button from '../../../shared/components/ui/Button';

const DividasEtapa = () => {
  const { proximaEtapa, voltarEtapa, salvarDadosDividas, getEtapaAtual } = useDiagnosticoFlowStore();
  const etapa = getEtapaAtual();

  const [dividasInfo, setDividasInfo] = useState({
    temDividas: null,
    tiposDividas: [],
    impactoFinanceiro: '',
    planoQuitacao: ''
  });

  const tiposDividasOpcoes = [
    { id: 'cartao', label: '💳 Cartão de Crédito', cor: '#ef4444' },
    { id: 'emprestimo', label: '🏦 Empréstimo Bancário', cor: '#f97316' },
    { id: 'financiamento', label: '🏠 Financiamento', cor: '#eab308' },
    { id: 'crediario', label: '🛒 Crediário/Parcelamentos', cor: '#84cc16' },
    { id: 'cheque-especial', label: '🔴 Cheque Especial', cor: '#ef4444' },
    { id: 'outros', label: '📋 Outras Dívidas', cor: '#6b7280' }
  ];

  const handleTemDividas = (valor) => {
    setDividasInfo(prev => ({
      ...prev,
      temDividas: valor,
      tiposDividas: valor ? prev.tiposDividas : []
    }));
  };

  const handleTipoDivida = (tipoId) => {
    setDividasInfo(prev => {
      const tiposAtuais = prev.tiposDividas;
      const jaExiste = tiposAtuais.includes(tipoId);
      
      return {
        ...prev,
        tiposDividas: jaExiste 
          ? tiposAtuais.filter(t => t !== tipoId)
          : [...tiposAtuais, tipoId]
      };
    });
  };

  const handleImpacto = (valor) => {
    setDividasInfo(prev => ({
      ...prev,
      impactoFinanceiro: valor
    }));
  };

  const handlePlano = (valor) => {
    setDividasInfo(prev => ({
      ...prev,
      planoQuitacao: valor
    }));
  };

  const handleProxima = () => {
    salvarDadosDividas(dividasInfo);
    proximaEtapa();
  };

  const isCompleto = dividasInfo.temDividas !== null && 
    (dividasInfo.temDividas === false || 
     (dividasInfo.tiposDividas.length > 0 && dividasInfo.impactoFinanceiro && dividasInfo.planoQuitacao));

  return (
    <div className="etapa-container dividas-etapa">
      <div className="etapa-header">
        <div className="etapa-icone-grande">{etapa.icone}</div>
        <h1>{etapa.titulo}</h1>
        <p className="etapa-subtitulo">{etapa.subtitulo}</p>
      </div>

      <div className="dividas-content">
        {/* Pergunta principal */}
        <div className="pergunta-grupo">
          <h3>Você tem dívidas atualmente?</h3>
          <div className="opcoes-principais">
            <button
              className={`opcao-principal ${dividasInfo.temDividas === false ? 'selecionada verde' : ''}`}
              onClick={() => handleTemDividas(false)}
            >
              <div className="opcao-icone">😊</div>
              <div>
                <strong>Não tenho dívidas</strong>
                <p>Parabéns! Você está em uma boa situação</p>
              </div>
            </button>

            <button
              className={`opcao-principal ${dividasInfo.temDividas === true ? 'selecionada laranja' : ''}`}
              onClick={() => handleTemDividas(true)}
            >
              <div className="opcao-icone">😰</div>
              <div>
                <strong>Sim, tenho dívidas</strong>
                <p>Vamos mapear para criar um plano</p>
              </div>
            </button>
          </div>
        </div>

        {/* Se tem dívidas, mostrar detalhes */}
        {dividasInfo.temDividas === true && (
          <>
            <div className="pergunta-grupo">
              <h3>Que tipos de dívidas você tem? (Pode selecionar várias)</h3>
              <div className="tipos-dividas-grid">
                {tiposDividasOpcoes.map(tipo => (
                  <button
                    key={tipo.id}
                    className={`tipo-divida-btn ${dividasInfo.tiposDividas.includes(tipo.id) ? 'selecionada' : ''}`}
                    onClick={() => handleTipoDivida(tipo.id)}
                    style={{ 
                      borderColor: dividasInfo.tiposDividas.includes(tipo.id) ? tipo.cor : '#e5e7eb',
                      backgroundColor: dividasInfo.tiposDividas.includes(tipo.id) ? `${tipo.cor}10` : 'white'
                    }}
                  >
                    {tipo.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pergunta-grupo">
              <h3>Como essas dívidas impactam sua vida financeira?</h3>
              <div className="opcoes-grid">
                {[
                  { valor: 'pouco', label: '😌 Pouco impacto, consigo pagar', cor: '#22c55e' },
                  { valor: 'medio', label: '😐 Impacto moderado, fico apertado', cor: '#eab308' },
                  { valor: 'alto', label: '😰 Alto impacto, dificulta muito', cor: '#f97316' },
                  { valor: 'critico', label: '🆘 Situação crítica, não consigo pagar', cor: '#ef4444' }
                ].map(opcao => (
                  <button
                    key={opcao.valor}
                    className={`opcao-btn ${dividasInfo.impactoFinanceiro === opcao.valor ? 'selecionada' : ''}`}
                    onClick={() => handleImpacto(opcao.valor)}
                    style={{ borderColor: dividasInfo.impactoFinanceiro === opcao.valor ? opcao.cor : '#e5e7eb' }}
                  >
                    {opcao.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pergunta-grupo">
              <h3>Você tem algum plano para quitar essas dívidas?</h3>
              <div className="opcoes-grid">
                {[
                  { valor: 'nenhum', label: '😟 Não sei por onde começar', cor: '#ef4444' },
                  { valor: 'pensando', label: '🤔 Estou pensando em um plano', cor: '#f97316' },
                  { valor: 'basico', label: '📝 Tenho uma ideia básica', cor: '#eab308' },
                  { valor: 'detalhado', label: '🎯 Tenho um plano detalhado', cor: '#22c55e' }
                ].map(opcao => (
                  <button
                    key={opcao.valor}
                    className={`opcao-btn ${dividasInfo.planoQuitacao === opcao.valor ? 'selecionada' : ''}`}
                    onClick={() => handlePlano(opcao.valor)}
                    style={{ borderColor: dividasInfo.planoQuitacao === opcao.valor ? opcao.cor : '#e5e7eb' }}
                  >
                    {opcao.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {dividasInfo.temDividas === false && (
          <div className="sem-dividas-parabens">
            <div className="parabens-card">
              <h3>🎉 Excelente!</h3>
              <p>Não ter dívidas é um grande passo na jornada financeira. Isso já te coloca numa posição muito melhor que a maioria das pessoas.</p>
              <div className="dica">
                <strong>💡 Dica:</strong> Mantenha-se assim! O próximo passo é criar uma reserva de emergência.
              </div>
            </div>
          </div>
        )}
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

export default DividasEtapa;
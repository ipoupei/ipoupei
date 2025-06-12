// src/modules/diagnostico/onboarding/etapa05_Receitas.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import DiagnosticoEtapaLayout from '@modules/diagnostico/styles/DiagnosticoEtapaLayout';
import ReceitasModal from '@modules/transacoes/components/ReceitasModal';
import useTransacoes from '@modules/transacoes/hooks/useTransacoes';
import { formatCurrency } from '@utils/formatCurrency';

const ReceitasEtapa = ({ 
  onContinuar, 
  onVoltar, 
  etapaAtual = 5, 
  totalEtapas = 11 
}) => {
  const [modalAberto, setModalAberto] = useState(false);
  const { transacoes, loading } = useTransacoes();

  const handleAbrirModal = () => {
    setModalAberto(true);
  };

  const handleFecharModal = () => {
    setModalAberto(false);
  };

  const handleSalvar = () => {
    console.log('✅ Receita salva!');
    // Modal fecha automaticamente
  };

  const handleContinuar = () => {
    onContinuar();
  };

  // Filtra receitas
  const receitas = transacoes ? transacoes.filter(t => t.tipo === 'receita') : [];

  // Tipos de receita mais comuns
  const tiposReceita = [
    { icone: '💼', nome: 'Salário', descricao: 'Salário mensal da empresa' },
    { icone: '💰', nome: 'Freelance', descricao: 'Trabalhos extras e projetos' },
    { icone: '🏠', nome: 'Aluguel', descricao: 'Renda de imóveis' },
    { icone: '📈', nome: 'Investimentos', descricao: 'Dividendos e rendimentos' },
    { icone: '🎁', nome: 'Extras', descricao: 'Bonificações e vendas' },
    { icone: '👨‍👩‍👧‍👦', nome: 'Pensão', descricao: 'Aposentadoria ou pensão' }
  ];

  const temReceitas = receitas.length > 0;
  const podeContinuar = temReceitas;

  if (loading) {
    return (
      <DiagnosticoEtapaLayout
        icone="💰"
        titulo="Carregando receitas..."
        descricao="Aguarde enquanto carregamos suas informações"
        temDados={false}
        onAbrirModal={() => {}}
        onContinuar={() => {}}
        onVoltar={onVoltar}
        podeContinuar={false}
        etapaAtual={etapaAtual}
        totalEtapas={totalEtapas}
      />
    );
  }

  return (
    <>
      <DiagnosticoEtapaLayout
        icone="💰"
        titulo="Suas fontes de renda"
        subtitulo="De onde vem seu dinheiro?"
        descricao="Registre todas as suas fontes de renda - salário, freelances, aluguéis, investimentos. Isso é fundamental para entender sua capacidade financeira."
        temDados={temReceitas}
        labelBotaoPrincipal="Adicionar Receita"
        onAbrirModal={handleAbrirModal}
        onVoltar={onVoltar}
        onContinuar={handleContinuar}
        podeContinuar={podeContinuar}
        etapaAtual={etapaAtual}
        totalEtapas={totalEtapas}
        dadosExistentes={
          temReceitas 
            ? `${receitas.length} fonte${receitas.length > 1 ? 's' : ''} de renda registrada${receitas.length > 1 ? 's' : ''}` 
            : null
        }
        dicas={[
          "Inclua todas as fontes de renda, mesmo as irregulares",
          "Para rendas variáveis, use uma média mensal",
          "Registre o valor líquido (depois dos descontos)"
        ]}
        alertas={
          !temReceitas ? ["Esta etapa é obrigatória - precisamos saber sua renda para o diagnóstico"] : null
        }
      >
        {/* Receitas existentes */}
        {temReceitas && (
          <div className="receitas-existentes">
            <h3>Suas fontes de renda:</h3>
            <div className="receitas-lista">
              {receitas.map((receita) => (
                <div key={receita.id} className="receita-item">
                  <div className="receita-info">
                    <span className="receita-descricao">{receita.descricao}</span>
                    <span className="receita-tipo">
                      {receita.recorrente ? 'Renda fixa' : 'Renda variável'}
                    </span>
                  </div>
                  <div className="receita-valor">
                    {formatCurrency(receita.valor)}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="total-receitas">
              <strong>Renda total mensal: {formatCurrency(
                receitas.reduce((total, receita) => total + receita.valor, 0)
              )}</strong>
            </div>
          </div>
        )}

        {/* Tipos de receita sugeridos */}
        {!temReceitas && (
          <div className="sugestoes-receitas">
            <h3>💡 Tipos de renda mais comuns:</h3>
            <div className="tipos-grid">
              {tiposReceita.map((tipo, index) => (
                <div key={index} className="tipo-receita">
                  <div className="tipo-icone">{tipo.icone}</div>
                  <div className="tipo-info">
                    <span className="tipo-nome">{tipo.nome}</span>
                    <span className="tipo-descricao">{tipo.descricao}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="sugestoes-texto">
              Clique no botão acima para adicionar suas fontes de renda.
            </p>
          </div>
        )}

        {/* Informações importantes */}
        <div className="info-importante">
          <div className="info-icone">💡</div>
          <div className="info-conteudo">
            <h4>Dicas para registrar sua renda:</h4>
            <ul>
              <li><strong>Renda fixa:</strong> Salário, aposentadoria, pensão</li>
              <li><strong>Renda variável:</strong> Freelances, vendas, comissões</li>
              <li><strong>Renda passiva:</strong> Aluguéis, dividendos, juros</li>
              <li><strong>Valores líquidos:</strong> Já descontados impostos e contribuições</li>
            </ul>
          </div>
        </div>

        {/* Classificação de renda */}
        {temReceitas && (
          <div className="classificacao-renda">
            <h4>📊 Análise da sua renda:</h4>
            <div className="renda-cards">
              {(() => {
                const totalRenda = receitas.reduce((total, receita) => total + receita.valor, 0);
                const rendaFixa = receitas
                  .filter(r => r.recorrente)
                  .reduce((total, receita) => total + receita.valor, 0);
                const rendaVariavel = totalRenda - rendaFixa;
                const percentualFixa = totalRenda > 0 ? (rendaFixa / totalRenda) * 100 : 0;

                return (
                  <>
                    <div className="renda-card fixa">
                      <div className="card-header">
                        <span className="card-icone">🏦</span>
                        <span className="card-titulo">Renda Fixa</span>
                      </div>
                      <div className="card-valor">{formatCurrency(rendaFixa)}</div>
                      <div className="card-percentual">{percentualFixa.toFixed(1)}% do total</div>
                    </div>
                    
                    <div className="renda-card variavel">
                      <div className="card-header">
                        <span className="card-icone">📈</span>
                        <span className="card-titulo">Renda Variável</span>
                      </div>
                      <div className="card-valor">{formatCurrency(rendaVariavel)}</div>
                      <div className="card-percentual">{(100 - percentualFixa).toFixed(1)}% do total</div>
                    </div>
                  </>
                );
              })()}
            </div>
            
            <div className="renda-analise">
              {(() => {
                const totalRenda = receitas.reduce((total, receita) => total + receita.valor, 0);
                const rendaFixa = receitas
                  .filter(r => r.recorrente)
                  .reduce((total, receita) => total + receita.valor, 0);
                const percentualFixa = totalRenda > 0 ? (rendaFixa / totalRenda) * 100 : 0;

                if (percentualFixa >= 80) {
                  return (
                    <div className="analise-item excelente">
                      <span className="analise-icone">🎯</span>
                      <span>Excelente! Sua renda é bem estável e previsível.</span>
                    </div>
                  );
                } else if (percentualFixa >= 60) {
                  return (
                    <div className="analise-item boa">
                      <span className="analise-icone">👍</span>
                      <span>Boa estabilidade financeira com alguma renda extra.</span>
                    </div>
                  );
                } else if (percentualFixa >= 40) {
                  return (
                    <div className="analise-item atencao">
                      <span className="analise-icone">⚠️</span>
                      <span>Renda mista - cuidado com o planejamento da parte variável.</span>
                    </div>
                  );
                } else {
                  return (
                    <div className="analise-item cuidado">
                      <span className="analise-icone">🚨</span>
                      <span>Renda muito variável - importante ter reserva de emergência.</span>
                    </div>
                  );
                }
              })()}
            </div>
          </div>
        )}
      </DiagnosticoEtapaLayout>

      {/* Modal de receitas */}
      {modalAberto && (
        <ReceitasModal
          isOpen={modalAberto}
          onClose={handleFecharModal}
          onSave={handleSalvar}
          diagnosticoMode={true}
        />
      )}

      <style jsx>{`
        .receitas-existentes {
          margin: 2rem 0;
        }

        .receitas-existentes h3 {
          margin: 0 0 1.5rem 0;
          font-size: 1.125rem;
          font-weight: 700;
          color: #374151;
          text-align: center;
        }

        .receitas-lista {
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          border: 1px solid #bbf7d0;
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 1rem;
        }

        .receita-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          margin-bottom: 0.75rem;
        }

        .receita-item:last-child {
          margin-bottom: 0;
        }

        .receita-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .receita-descricao {
          font-weight: 600;
          color: #374151;
          font-size: 0.875rem;
        }

        .receita-tipo {
          font-size: 0.75rem;
          color: #6b7280;
        }

        .receita-valor {
          font-weight: 700;
          color: #059669;
          font-size: 0.875rem;
        }

        .total-receitas {
          text-align: center;
          padding: 1rem;
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          border: 1px solid #93c5fd;
          border-radius: 12px;
          color: #1e40af;
          font-size: 1.125rem;
        }

        .sugestoes-receitas {
          margin: 2rem 0;
        }

        .sugestoes-receitas h3 {
          margin: 0 0 1.5rem 0;
          font-size: 1.125rem;
          font-weight: 700;
          color: #374151;
          text-align: center;
        }

        .tipos-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .tipo-receita {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .tipo-receita:hover {
          border-color: #10b981;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);
        }

        .tipo-icone {
          font-size: 1.5rem;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8fafc;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
        }

        .tipo-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .tipo-nome {
          font-weight: 600;
          color: #374151;
          font-size: 0.875rem;
        }

        .tipo-descricao {
          font-size: 0.75rem;
          color: #6b7280;
        }

        .sugestoes-texto {
          text-align: center;
          color: #6b7280;
          font-size: 0.875rem;
          font-style: italic;
        }

        .info-importante {
          display: flex;
          gap: 1rem;
          padding: 1.5rem;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border: 1px solid #bae6fd;
          border-radius: 16px;
          margin: 2rem 0;
        }

        .info-icone {
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .info-conteudo h4 {
          margin: 0 0 0.75rem 0;
          font-size: 1rem;
          font-weight: 700;
          color: #0c4a6e;
        }

        .info-conteudo ul {
          margin: 0;
          padding-left: 1.25rem;
          color: #0369a1;
        }

        .info-conteudo li {
          font-size: 0.875rem;
          line-height: 1.5;
          margin-bottom: 0.5rem;
        }

        .classificacao-renda {
          margin: 2rem 0;
          padding: 1.5rem;
          background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%);
          border: 1px solid #fcd34d;
          border-radius: 16px;
        }

        .classificacao-renda h4 {
          margin: 0 0 1.5rem 0;
          font-size: 1.125rem;
          font-weight: 700;
          color: #92400e;
          text-align: center;
        }

        .renda-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .renda-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 1rem;
          text-align: center;
        }

        .renda-card.fixa {
          border-color: #10b981;
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        }

        .renda-card.variavel {
          border-color: #3b82f6;
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
        }

        .card-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .card-icone {
          font-size: 1.25rem;
        }

        .card-titulo {
          font-weight: 600;
          font-size: 0.875rem;
          color: #374151;
        }

        .card-valor {
          font-size: 1.25rem;
          font-weight: 700;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .card-percentual {
          font-size: 0.75rem;
          color: #6b7280;
        }

        .renda-analise {
          text-align: center;
        }

        .analise-item {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 1rem;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .analise-item.excelente {
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          color: #166534;
          border: 1px solid #bbf7d0;
        }

        .analise-item.boa {
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          color: #1e40af;
          border: 1px solid #93c5fd;
        }

        .analise-item.atencao {
          background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
          color: #92400e;
          border: 1px solid #fcd34d;
        }

        .analise-item.cuidado {
          background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        @media (max-width: 768px) {
          .tipos-grid,
          .renda-cards {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }

          .tipo-receita,
          .receita-item {
            padding: 0.875rem;
          }

          .receita-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .info-importante,
          .classificacao-renda {
            padding: 1.25rem;
          }

          .info-importante {
            flex-direction: column;
            text-align: center;
            gap: 0.75rem;
          }
        }
      `}</style>
    </>
  );
};

ReceitasEtapa.propTypes = {
  onContinuar: PropTypes.func.isRequired,
  onVoltar: PropTypes.func.isRequired,
  etapaAtual: PropTypes.number,
  totalEtapas: PropTypes.number
};

export default ReceitasEtapa;
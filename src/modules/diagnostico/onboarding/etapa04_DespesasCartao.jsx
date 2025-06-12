// src/modules/diagnostico/onboarding/etapa04_DespesasCartao.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import DiagnosticoEtapaLayout from '@modules/diagnostico/styles/DiagnosticoEtapaLayout';
import DespesasCartaoModal from '@modules/transacoes/components/DespesasCartaoModal';
import useCartoes from '@modules/cartoes/hooks/useCartoes';
import useTransacoes from '@modules/transacoes/hooks/useTransacoes';
import { formatCurrency } from '@utils/formatCurrency';

const DespesasCartaoEtapa = ({ 
  onContinuar, 
  onVoltar, 
  etapaAtual = 4, 
  totalEtapas = 11 
}) => {
  const [modalAberto, setModalAberto] = useState(false);
  const { cartoes } = useCartoes();
  const { transacoes, loading } = useTransacoes();

  const handleAbrirModal = () => {
    setModalAberto(true);
  };

  const handleFecharModal = () => {
    setModalAberto(false);
  };

  const handleSalvar = () => {
    console.log('✅ Despesa do cartão salva!');
    // Modal fecha automaticamente
  };

  const handleContinuar = () => {
    onContinuar();
  };

  const handlePular = () => {
    onContinuar(); // Permite pular esta etapa
  };

  // Filtra transações de cartão
  const despesasCartao = transacoes ? transacoes.filter(t => 
    t.tipo === 'despesa' && t.cartao_id
  ) : [];

  // Exemplos de gastos comuns no cartão
  const exemplosDespesas = [
    { icone: '🛒', categoria: 'Supermercado', descricao: 'Compras do mês' },
    { icone: '⛽', categoria: 'Combustível', descricao: 'Posto de gasolina' },
    { icone: '🍕', categoria: 'Alimentação', descricao: 'Restaurantes e delivery' },
    { icone: '👕', categoria: 'Roupas', descricao: 'Vestuário e calçados' },
    { icone: '💊', categoria: 'Farmácia', descricao: 'Medicamentos e produtos' },
    { icone: '🎬', categoria: 'Lazer', descricao: 'Cinema, shows, streaming' }
  ];

  const temCartoes = cartoes && cartoes.length > 0;
  const temDespesasCartao = despesasCartao.length > 0;
  const podeContinuar = true; // Sempre pode continuar (etapa opcional)

  if (loading) {
    return (
      <DiagnosticoEtapaLayout
        icone="💳"
        titulo="Carregando despesas..."
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

  // Se não tem cartões, pula automaticamente
  if (!temCartoes) {
    return (
      <DiagnosticoEtapaLayout
        icone="💳"
        titulo="Gastos no cartão de crédito"
        subtitulo="Você não tem cartões cadastrados"
        descricao="Como você não cadastrou nenhum cartão de crédito na etapa anterior, vamos pular esta parte e continuar."
        temDados={false}
        labelBotaoPrincipal="Voltar e Cadastrar Cartão"
        onAbrirModal={onVoltar}
        onVoltar={onVoltar}
        onContinuar={handleContinuar}
        podeContinuar={true}
        etapaAtual={etapaAtual}
        totalEtapas={totalEtapas}
        alertas={["Você pode voltar e cadastrar um cartão se quiser, ou continuar sem eles"]}
      >
        <div className="sem-cartoes">
          <div className="sem-cartoes-icone">💡</div>
          <div className="sem-cartoes-conteudo">
            <h4>Usando apenas dinheiro e débito?</h4>
            <p>
              Perfeito! Isso já é um ótimo controle financeiro. Vamos continuar 
              com as próximas etapas para mapear suas receitas e despesas.
            </p>
          </div>
        </div>
      </DiagnosticoEtapaLayout>
    );
  }

  return (
    <>
      <DiagnosticoEtapaLayout
        icone="💳"
        titulo="Gastos no cartão de crédito"
        subtitulo="Registre os principais gastos dos seus cartões"
        descricao="Agora vamos registrar os gastos que você já fez ou planeja fazer nos seus cartões. Isso ajuda a controlar as próximas faturas."
        temDados={temDespesasCartao}
        labelBotaoPrincipal="Adicionar Gasto no Cartão"
        onAbrirModal={handleAbrirModal}
        onVoltar={onVoltar}
        onContinuar={handleContinuar}
        onPular={handlePular}
        podeContinuar={podeContinuar}
        podePular={true}
        etapaAtual={etapaAtual}
        totalEtapas={totalEtapas}
        dadosExistentes={
          temDespesasCartao 
            ? `${despesasCartao.length} gasto${despesasCartao.length > 1 ? 's' : ''} registrado${despesasCartao.length > 1 ? 's' : ''}` 
            : null
        }
        dicas={[
          "Registre apenas os gastos principais - você pode adicionar outros depois",
          "Inclua compras parceladas para controle das próximas faturas",
          "Use aproximações se não lembrar do valor exato"
        ]}
      >
        {/* Despesas existentes */}
        {temDespesasCartao && (
          <div className="despesas-existentes">
            <h3>Gastos registrados nos cartões:</h3>
            <div className="despesas-lista">
              {despesasCartao.slice(0, 5).map((despesa) => {
                const cartao = cartoes.find(c => c.id === despesa.cartao_id);
                return (
                  <div key={despesa.id} className="despesa-item">
                    <div className="despesa-info">
                      <span className="despesa-descricao">{despesa.descricao}</span>
                      <span className="despesa-cartao">
                        {cartao?.nome || 'Cartão não encontrado'}
                      </span>
                    </div>
                    <div className="despesa-valor">
                      {formatCurrency(despesa.valor)}
                    </div>
                  </div>
                );
              })}
              {despesasCartao.length > 5 && (
                <div className="despesa-item mais">
                  <div className="despesa-info">
                    <span className="despesa-descricao">
                      +{despesasCartao.length - 5} outros gastos
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="total-despesas">
              <strong>Total gasto: {formatCurrency(
                despesasCartao.reduce((total, despesa) => total + despesa.valor, 0)
              )}</strong>
            </div>
          </div>
        )}

        {/* Seus cartões disponíveis */}
        <div className="cartoes-disponiveis">
          <h3>📱 Seus cartões disponíveis:</h3>
          <div className="cartoes-grid">
            {cartoes.map((cartao) => (
              <div key={cartao.id} className="cartao-disponivel">
                <div 
                  className="cartao-cor"
                  style={{ backgroundColor: cartao.cor || '#6b7280' }}
                >
                  💳
                </div>
                <div className="cartao-detalhes">
                  <span className="cartao-nome">{cartao.nome}</span>
                  <span className="cartao-limite">
                    Limite: {formatCurrency(cartao.limite || 0)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Exemplos de despesas */}
        {!temDespesasCartao && (
          <div className="exemplos-despesas">
            <h3>💡 Exemplos de gastos no cartão:</h3>
            <div className="exemplos-grid">
              {exemplosDespesas.map((exemplo, index) => (
                <div key={index} className="exemplo-item">
                  <div className="exemplo-icone">{exemplo.icone}</div>
                  <div className="exemplo-info">
                    <span className="exemplo-categoria">{exemplo.categoria}</span>
                    <span className="exemplo-descricao">{exemplo.descricao}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="exemplos-texto">
              Você pode registrar qualquer tipo de gasto feito no cartão.
            </p>
          </div>
        )}

        {/* Informações importantes */}
        <div className="info-importante">
          <div className="info-icone">💡</div>
          <div className="info-conteudo">
            <h4>Por que registrar gastos do cartão?</h4>
            <ul>
              <li>Controlar o valor das próximas faturas</li>
              <li>Evitar surpresas no vencimento</li>
              <li>Planejar compras parceladas</li>
              <li>Entender seus padrões de consumo</li>
            </ul>
          </div>
        </div>
      </DiagnosticoEtapaLayout>

      {/* Modal de despesas do cartão */}
      {modalAberto && (
        <DespesasCartaoModal
          isOpen={modalAberto}
          onClose={handleFecharModal}
          onSave={handleSalvar}
          diagnosticoMode={true}
        />
      )}

      <style jsx>{`
        .sem-cartoes {
          display: flex;
          gap: 1rem;
          padding: 2rem;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border: 1px solid #bae6fd;
          border-radius: 16px;
          margin: 2rem 0;
          text-align: center;
          flex-direction: column;
          align-items: center;
        }

        .sem-cartoes-icone {
          font-size: 3rem;
        }

        .sem-cartoes-conteudo h4 {
          margin: 0 0 1rem 0;
          font-size: 1.25rem;
          font-weight: 700;
          color: #0c4a6e;
        }

        .sem-cartoes-conteudo p {
          margin: 0;
          font-size: 1rem;
          color: #0369a1;
          line-height: 1.6;
          max-width: 400px;
        }

        .despesas-existentes {
          margin: 2rem 0;
        }

        .despesas-existentes h3 {
          margin: 0 0 1.5rem 0;
          font-size: 1.125rem;
          font-weight: 700;
          color: #374151;
          text-align: center;
        }

        .despesas-lista {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border: 1px solid #fcd34d;
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 1rem;
        }

        .despesa-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          margin-bottom: 0.75rem;
        }

        .despesa-item:last-child {
          margin-bottom: 0;
        }

        .despesa-item.mais {
          border-style: dashed;
          opacity: 0.7;
        }

        .despesa-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .despesa-descricao {
          font-weight: 600;
          color: #374151;
          font-size: 0.875rem;
        }

        .despesa-cartao {
          font-size: 0.75rem;
          color: #6b7280;
        }

        .despesa-valor {
          font-weight: 700;
          color: #dc2626;
          font-size: 0.875rem;
        }

        .total-despesas {
          text-align: center;
          padding: 1rem;
          background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
          border: 1px solid #fecaca;
          border-radius: 12px;
          color: #991b1b;
          font-size: 1.125rem;
        }

        .cartoes-disponiveis {
          margin: 2rem 0;
        }

        .cartoes-disponiveis h3 {
          margin: 0 0 1.5rem 0;
          font-size: 1.125rem;
          font-weight: 700;
          color: #374151;
          text-align: center;
        }

        .cartoes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .cartao-disponivel {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .cartao-disponivel:hover {
          border-color: #8b5cf6;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.1);
        }

        .cartao-cor {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.25rem;
          flex-shrink: 0;
        }

        .cartao-detalhes {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .cartao-nome {
          font-weight: 600;
          color: #374151;
          font-size: 0.875rem;
        }

        .cartao-limite {
          font-size: 0.75rem;
          color: #6b7280;
        }

        .exemplos-despesas {
          margin: 2rem 0;
        }

        .exemplos-despesas h3 {
          margin: 0 0 1.5rem 0;
          font-size: 1.125rem;
          font-weight: 700;
          color: #374151;
          text-align: center;
        }

        .exemplos-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .exemplo-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .exemplo-item:hover {
          border-color: #667eea;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .exemplo-icone {
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

        .exemplo-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .exemplo-categoria {
          font-weight: 600;
          color: #374151;
          font-size: 0.875rem;
        }

        .exemplo-descricao {
          font-size: 0.75rem;
          color: #6b7280;
        }

        .exemplos-texto {
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
          margin-bottom: 0.25rem;
        }

        @media (max-width: 768px) {
          .cartoes-grid,
          .exemplos-grid {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }

          .cartao-disponivel,
          .exemplo-item,
          .despesa-item {
            padding: 0.875rem;
          }

          .despesa-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .info-importante {
            flex-direction: column;
            text-align: center;
            gap: 0.75rem;
            padding: 1.25rem;
          }
        }
      `}</style>
    </>
  );
};

DespesasCartaoEtapa.propTypes = {
  onContinuar: PropTypes.func.isRequired,
  onVoltar: PropTypes.func.isRequired,
  etapaAtual: PropTypes.number,
  totalEtapas: PropTypes.number
};

export default DespesasCartaoEtapa;
// src/modules/diagnostico/onboarding/etapa02_Contas.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Wallet } from 'lucide-react';
import DiagnosticoEtapaLayout from '@modules/diagnostico/styles/DiagnosticoEtapaLayout';
import ContasModal from '@modules/contas/components/ContasModal';
import useContas from '@modules/contas/hooks/useContas';
import { formatCurrency } from '@utils/formatCurrency';

const ContasEtapa = ({ 
  onContinuar, 
  onVoltar, 
  etapaAtual = 2, 
  totalEtapas = 11 
}) => {
  const [modalAberto, setModalAberto] = useState(false);
  const { contas, loading } = useContas();

  const handleAbrirModal = () => {
    setModalAberto(true);
  };

  const handleFecharModal = () => {
    setModalAberto(false);
  };

  const handleSalvar = () => {
    console.log('✅ Conta salva!');
    // Modal fecha automaticamente
  };

  const handleContinuar = () => {
    onContinuar();
  };

  // Tipos de conta sugeridos
  const tiposContaSugeridos = [
    { icone: '🏦', nome: 'Conta Corrente', descricao: 'Para movimentação do dia a dia' },
    { icone: '💰', nome: 'Conta Poupança', descricao: 'Para guardar dinheiro' },
    { icone: '📱', nome: 'Conta Digital', descricao: 'Nubank, Inter, PicPay, etc.' },
    { icone: '💵', nome: 'Dinheiro', descricao: 'Dinheiro físico na carteira' }
  ];

  const temContas = contas && contas.length > 0;
  const podeContinuar = temContas;

  if (loading) {
    return (
      <DiagnosticoEtapaLayout
        icone="🏦"
        titulo="Carregando contas..."
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
        icone="🏦"
        titulo="Suas contas bancárias"
        subtitulo="Onde você guarda seu dinheiro?"
        descricao="Cadastre as contas que você usa no dia a dia. Isso nos ajuda a ter uma visão completa de onde está seu dinheiro e como ele se movimenta."
        temDados={temContas}
        labelBotaoPrincipal="Adicionar Conta"
        onAbrirModal={handleAbrirModal}
        onVoltar={onVoltar}
        onContinuar={handleContinuar}
        podeContinuar={podeContinuar}
        etapaAtual={etapaAtual}
        totalEtapas={totalEtapas}
        dadosExistentes={
          temContas 
            ? `${contas.length} conta${contas.length > 1 ? 's' : ''} cadastrada${contas.length > 1 ? 's' : ''}` 
            : null
        }
        dicas={[
          "Adicione apenas as contas que você realmente usa",
          "Você pode começar com sua conta principal e adicionar outras depois",
          "O saldo inicial pode ser aproximado - você pode ajustar depois"
        ]}
        alertas={
          !temContas ? ["Esta etapa é obrigatória para continuar o diagnóstico"] : null
        }
      >
        {/* Contas existentes */}
        {temContas && (
          <div className="contas-existentes">
            <h3>Suas contas cadastradas:</h3>
            <div className="contas-lista">
              {contas.map((conta) => (
                <div key={conta.id} className="conta-item">
                  <div 
                    className="conta-icone"
                    style={{ backgroundColor: conta.cor || '#6b7280' }}
                  >
                    <Wallet size={16} />
                  </div>
                  <div className="conta-info">
                    <span className="conta-nome">{conta.nome}</span>
                    <span className="conta-tipo">{conta.tipo}</span>
                  </div>
                  <div className="conta-saldo">
                    {formatCurrency(conta.saldo || 0)}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="saldo-total">
              <strong>Saldo total: {formatCurrency(
                contas.reduce((total, conta) => total + (conta.saldo || 0), 0)
              )}</strong>
            </div>
          </div>
        )}

        {/* Sugestões de tipos de conta */}
        {!temContas && (
          <div className="sugestoes-contas">
            <h3>💡 Tipos de conta mais comuns:</h3>
            <div className="tipos-grid">
              {tiposContaSugeridos.map((tipo, index) => (
                <div key={index} className="tipo-conta">
                  <div className="tipo-icone">{tipo.icone}</div>
                  <div className="tipo-info">
                    <span className="tipo-nome">{tipo.nome}</span>
                    <span className="tipo-descricao">{tipo.descricao}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="sugestoes-texto">
              Clique no botão acima para adicionar sua primeira conta.
            </p>
          </div>
        )}

        {/* Informações importantes */}
        <div className="info-importante">
          <div className="info-icone">ℹ️</div>
          <div className="info-conteudo">
            <h4>Por que precisamos disso?</h4>
            <p>
              As contas são a base do controle financeiro. Elas mostram onde seu dinheiro 
              está e nos ajudam a calcular seu patrimônio líquido e fluxo de caixa.
            </p>
          </div>
        </div>
      </DiagnosticoEtapaLayout>

      {/* Modal de contas */}
      {modalAberto && (
        <ContasModal
          isOpen={modalAberto}
          onClose={handleFecharModal}
          onSave={handleSalvar}
          diagnosticoMode={true}
        />
      )}

      <style jsx>{`
        .contas-existentes {
          margin: 2rem 0;
        }

        .contas-existentes h3 {
          margin: 0 0 1.5rem 0;
          font-size: 1.125rem;
          font-weight: 700;
          color: #374151;
          text-align: center;
        }

        .contas-lista {
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          border: 1px solid #bbf7d0;
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 1rem;
        }

        .conta-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          margin-bottom: 0.75rem;
          transition: all 0.3s ease;
        }

        .conta-item:last-child {
          margin-bottom: 0;
        }

        .conta-item:hover {
          border-color: #d1d5db;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .conta-icone {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .conta-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          flex: 1;
        }

        .conta-nome {
          font-weight: 600;
          color: #374151;
          font-size: 0.875rem;
        }

        .conta-tipo {
          font-size: 0.75rem;
          color: #6b7280;
          text-transform: capitalize;
        }

        .conta-saldo {
          font-weight: 700;
          color: #059669;
          font-size: 0.875rem;
          background: #f0fdf4;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          border: 1px solid #bbf7d0;
        }

        .saldo-total {
          text-align: center;
          padding: 1rem;
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          border: 1px solid #93c5fd;
          border-radius: 12px;
          color: #1e40af;
          font-size: 1.125rem;
        }

        .sugestoes-contas {
          margin: 2rem 0;
        }

        .sugestoes-contas h3 {
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

        .tipo-conta {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .tipo-conta:hover {
          border-color: #667eea;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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
          margin: 0 0 0.5rem 0;
          font-size: 1rem;
          font-weight: 700;
          color: #0c4a6e;
        }

        .info-conteudo p {
          margin: 0;
          font-size: 0.875rem;
          color: #0369a1;
          line-height: 1.6;
        }

        @media (max-width: 768px) {
          .tipos-grid {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }

          .tipo-conta,
          .conta-item {
            padding: 0.875rem;
          }

          .conta-icone,
          .tipo-icone {
            width: 36px;
            height: 36px;
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

ContasEtapa.propTypes = {
  onContinuar: PropTypes.func.isRequired,
  onVoltar: PropTypes.func.isRequired,
  etapaAtual: PropTypes.number,
  totalEtapas: PropTypes.number
};

export default ContasEtapa;
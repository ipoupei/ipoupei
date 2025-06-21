// src/modules/diagnostico/onboarding/etapa03_Cartoes.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { CreditCard } from 'lucide-react';
import DiagnosticoEtapaLayout from '@modules/diagnostico/styles/DiagnosticoEtapaLayout';
import CartoesModal from '@modules/cartoes/components/CartoesModal';
import useCartoes from '@modules/cartoes/hooks/useCartoesdata';
import { formatCurrency } from '@utils/formatCurrency';

const CartoesEtapa = ({ 
  onContinuar, 
  onVoltar, 
  etapaAtual = 3, 
  totalEtapas = 11 
}) => {
  const [modalAberto, setModalAberto] = useState(false);
  const { cartoes, loading } = useCartoes();

  const handleAbrirModal = () => {
    setModalAberto(true);
  };

  const handleFecharModal = () => {
    setModalAberto(false);
  };

  const handleSalvar = () => {
    console.log('✅ Cartão salvo!');
    // Modal fecha automaticamente
  };

  const handleContinuar = () => {
    onContinuar();
  };

  const handlePular = () => {
    onContinuar(); // Permite pular esta etapa
  };

  // Bandeiras mais comuns
  const bandeirasComuns = [
    { nome: 'Visa', icone: '💳', cor: '#1a365d' },
    { nome: 'Mastercard', icone: '💳', cor: '#eb1c26' },
    { nome: 'Elo', icone: '💳', cor: '#ffcc02' },
    { nome: 'American Express', icone: '💳', cor: '#006fcf' }
  ];

  const temCartoes = cartoes && cartoes.length > 0;
  const podeContinuar = true; // Sempre pode continuar (etapa opcional)

  if (loading) {
    return (
      <DiagnosticoEtapaLayout
        icone="💳"
        titulo="Carregando cartões..."
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
        icone="💳"
        titulo="Seus cartões de crédito"
        subtitulo="Controle seus cartões para evitar surpresas"
        descricao="Cadastre seus cartões de crédito para ter controle total sobre limites, faturas e gastos. Se você não usa cartão, pode pular esta etapa."
        temDados={temCartoes}
        labelBotaoPrincipal="Adicionar Cartão"
        onAbrirModal={handleAbrirModal}
        onVoltar={onVoltar}
        onContinuar={handleContinuar}
        onPular={handlePular}
        podeContinuar={podeContinuar}
        podePular={true}
        etapaAtual={etapaAtual}
        totalEtapas={totalEtapas}
        dadosExistentes={
          temCartoes 
            ? `${cartoes.length} cartão${cartoes.length > 1 ? 'ões' : ''} cadastrado${cartoes.length > 1 ? 's' : ''}` 
            : null
        }
        dicas={[
          "Cadastre apenas os cartões que você usa regularmente",
          "Informe o limite real para controle mais preciso",
          "Você pode ajustar os dados depois conforme usar o app"
        ]}
      >
        {/* Cartões existentes */}
        {temCartoes && (
          <div className="cartoes-existentes">
            <h3>Seus cartões cadastrados:</h3>
            <div className="cartoes-lista">
              {cartoes.map((cartao) => {
                const limiteDisponivel = (cartao.limite || 0) - 0; // Assumindo gasto zero para o diagnóstico
                const percentualUso = cartao.limite > 0 ? 0 : 0; // Sem gastos ainda
                
                return (
                  <div key={cartao.id} className="cartao-item">
                    <div className="cartao-header">
                      <div 
                        className="cartao-icone"
                        style={{ backgroundColor: cartao.cor || '#6b7280' }}
                      >
                        <CreditCard size={16} />
                      </div>
                      <div className="cartao-info">
                        <span className="cartao-nome">{cartao.nome}</span>
                        <span className="cartao-bandeira">{cartao.bandeira || 'Cartão'}</span>
                      </div>
                      <div className="cartao-status">
                        <span className="limite-disponivel">
                          {formatCurrency(limiteDisponivel)}
                        </span>
                        <span className="limite-total">
                          de {formatCurrency(cartao.limite || 0)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="cartao-barra">
                      <div 
                        className="barra-uso"
                        style={{ width: `${percentualUso}%` }}
                      />
                    </div>
                    
                    <div className="cartao-detalhes">
                      <span>Fechamento: dia {cartao.dia_fechamento || 1}</span>
                      <span>Vencimento: dia {cartao.dia_vencimento || 10}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="limite-total-resumo">
              <strong>Limite total: {formatCurrency(
                cartoes.reduce((total, cartao) => total + (cartao.limite || 0), 0)
              )}</strong>
            </div>
          </div>
        )}

        {/* Sugestões quando não tem cartões */}
        {!temCartoes && (
          <div className="sugestoes-cartoes">
            <h3>💡 Bandeiras mais comuns:</h3>
            <div className="bandeiras-grid">
              {bandeirasComuns.map((bandeira, index) => (
                <div key={index} className="bandeira-item">
                  <div 
                    className="bandeira-icone"
                    style={{ backgroundColor: bandeira.cor }}
                  >
                    {bandeira.icone}
                  </div>
                  <span className="bandeira-nome">{bandeira.nome}</span>
                </div>
              ))}
            </div>
            <p className="sugestoes-texto">
              Você pode adicionar cartões de qualquer banco ou bandeira.
            </p>
          </div>
        )}

        {/* Informações sobre cartões */}
        <div className="info-cartoes">
          <div className="info-icone">💡</div>
          <div className="info-conteudo">
            <h4>Por que controlar cartões?</h4>
            <ul>
              <li>Evitar surpresas na fatura</li>
              <li>Controlar o limite disponível</li>
              <li>Planejar compras parceladas</li>
              <li>Identificar gastos desnecessários</li>
            </ul>
          </div>
        </div>

        {/* Opção para quem não usa cartão */}
        {!temCartoes && (
          <div className="sem-cartao">
            <div className="sem-cartao-icone">✋</div>
            <div className="sem-cartao-conteudo">
              <h4>Não usa cartão de crédito?</h4>
              <p>
                Sem problemas! Muitas pessoas preferem usar apenas dinheiro ou débito. 
                Você pode pular esta etapa e continuar o diagnóstico.
              </p>
            </div>
          </div>
        )}
      </DiagnosticoEtapaLayout>

      {/* Modal de cartões */}
      {modalAberto && (
        <CartoesModal
          isOpen={modalAberto}
          onClose={handleFecharModal}
          onSave={handleSalvar}
          diagnosticoMode={true}
        />
      )}

      <style jsx>{`
        .cartoes-existentes {
          margin: 2rem 0;
        }

        .cartoes-existentes h3 {
          margin: 0 0 1.5rem 0;
          font-size: 1.125rem;
          font-weight: 700;
          color: #374151;
          text-align: center;
        }

        .cartoes-lista {
          background: linear-gradient(135deg, #faf5ff 0%, #e9d5ff 100%);
          border: 1px solid #ddd6fe;
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 1rem;
        }

        .cartao-item {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 1rem;
          margin-bottom: 1rem;
          transition: all 0.3s ease;
        }

        .cartao-item:last-child {
          margin-bottom: 0;
        }

        .cartao-item:hover {
          border-color: #8b5cf6;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.1);
        }

        .cartao-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.75rem;
        }

        .cartao-icone {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .cartao-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          flex: 1;
        }

        .cartao-nome {
          font-weight: 600;
          color: #374151;
          font-size: 0.875rem;
        }

        .cartao-bandeira {
          font-size: 0.75rem;
          color: #6b7280;
          text-transform: capitalize;
        }

        .cartao-status {
          text-align: right;
        }

        .limite-disponivel {
          display: block;
          font-weight: 700;
          color: #059669;
          font-size: 0.875rem;
        }

        .limite-total {
          font-size: 0.75rem;
          color: #6b7280;
        }

        .cartao-barra {
          height: 6px;
          background: #e5e7eb;
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 0.75rem;
        }

        .barra-uso {
          height: 100%;
          background: linear-gradient(90deg, #10b981, #059669);
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .cartao-detalhes {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: #6b7280;
        }

        .limite-total-resumo {
          text-align: center;
          padding: 1rem;
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          border: 1px solid #93c5fd;
          border-radius: 12px;
          color: #1e40af;
          font-size: 1.125rem;
        }

        .sugestoes-cartoes {
          margin: 2rem 0;
        }

        .sugestoes-cartoes h3 {
          margin: 0 0 1.5rem 0;
          font-size: 1.125rem;
          font-weight: 700;
          color: #374151;
          text-align: center;
        }

        .bandeiras-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .bandeira-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .bandeira-item:hover {
          border-color: #8b5cf6;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .bandeira-icone {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .bandeira-nome {
          font-size: 0.75rem;
          font-weight: 600;
          color: #374151;
          text-align: center;
        }

        .sugestoes-texto {
          text-align: center;
          color: #6b7280;
          font-size: 0.875rem;
          font-style: italic;
        }

        .info-cartoes {
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

        .sem-cartao {
          display: flex;
          gap: 1rem;
          padding: 1.5rem;
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          border: 1px solid #bbf7d0;
          border-radius: 16px;
          margin: 2rem 0;
        }

        .sem-cartao-icone {
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .sem-cartao-conteudo h4 {
          margin: 0 0 0.5rem 0;
          font-size: 1rem;
          font-weight: 700;
          color: #166534;
        }

        .sem-cartao-conteudo p {
          margin: 0;
          font-size: 0.875rem;
          color: #047857;
          line-height: 1.6;
        }

        @media (max-width: 768px) {
          .bandeiras-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 0.75rem;
          }

          .bandeira-item {
            padding: 0.875rem;
          }

          .cartao-header {
            flex-wrap: wrap;
            gap: 0.75rem;
          }

          .cartao-status {
            text-align: left;
            width: 100%;
          }

          .cartao-detalhes {
            flex-direction: column;
            gap: 0.25rem;
          }

          .info-cartoes,
          .sem-cartao {
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

CartoesEtapa.propTypes = {
  onContinuar: PropTypes.func.isRequired,
  onVoltar: PropTypes.func.isRequired,
  etapaAtual: PropTypes.number,
  totalEtapas: PropTypes.number
};

export default CartoesEtapa;
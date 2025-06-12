// src/modules/diagnostico/onboarding/etapa01_Categorias.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import DiagnosticoEtapaLayout from '@modules/diagnostico/styles/DiagnosticoEtapaLayout';
import CategoriasModal from '@modules/categorias/components/CategoriasModal';
import useCategorias from '@modules/categorias/hooks/useCategorias';

const CategoriasEtapa = ({ 
  onContinuar, 
  onVoltar, 
  etapaAtual = 1, 
  totalEtapas = 11 
}) => {
  const [modalAberto, setModalAberto] = useState(false);
  const { categorias, loading } = useCategorias();

  const handleAbrirModal = () => {
    setModalAberto(true);
  };

  const handleFecharModal = () => {
    setModalAberto(false);
  };

  const handleSalvar = () => {
    // Modal fecha automaticamente após salvar
    console.log('✅ Categoria salva!');
  };

  const handleContinuar = () => {
    onContinuar();
  };

  const handlePular = () => {
    onContinuar(); // Permite pular esta etapa
  };

  // Categorias básicas recomendadas
  const categoriasRecomendadas = [
    { icone: '🏠', nome: 'Moradia', tipo: 'despesa', cor: '#ef4444' },
    { icone: '🍽️', nome: 'Alimentação', tipo: 'despesa', cor: '#f97316' },
    { icone: '🚗', nome: 'Transporte', tipo: 'despesa', cor: '#eab308' },
    { icone: '🏥', nome: 'Saúde', tipo: 'despesa', cor: '#06b6d4' },
    { icone: '🎮', nome: 'Lazer', tipo: 'despesa', cor: '#8b5cf6' },
    { icone: '💼', nome: 'Salário', tipo: 'receita', cor: '#10b981' }
  ];

  const temCategorias = categorias && categorias.length > 0;
  const podeContinuar = temCategorias || true; // Pode pular

  if (loading) {
    return (
      <DiagnosticoEtapaLayout
        icone="📁"
        titulo="Carregando categorias..."
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
        icone="📁"
        titulo="Organize suas categorias"
        subtitulo="Como você gosta de classificar seus gastos e ganhos?"
        descricao="As categorias ajudam você a entender onde seu dinheiro vai e de onde vem. Você pode usar nossas sugestões ou criar suas próprias."
        temDados={temCategorias}
        labelBotaoPrincipal="Gerenciar Categorias"
        onAbrirModal={handleAbrirModal}
        onVoltar={onVoltar}
        onContinuar={handleContinuar}
        onPular={handlePular}
        podeContinuar={podeContinuar}
        podePular={true}
        etapaAtual={etapaAtual}
        totalEtapas={totalEtapas}
        dadosExistentes={
          temCategorias 
            ? `${categorias.length} categoria${categorias.length > 1 ? 's' : ''} criada${categorias.length > 1 ? 's' : ''}` 
            : null
        }
        dicas={[
          "Comece simples - você pode sempre criar mais categorias depois",
          "Pense em como você naturalmente organiza seus gastos na sua cabeça",
          "Categorias muito específicas podem complicar o controle inicial"
        ]}
      >
        {/* Categorias existentes */}
        {temCategorias && (
          <div className="categorias-existentes">
            <h3>Suas categorias atuais:</h3>
            <div className="categorias-grid">
              {categorias.slice(0, 6).map((categoria) => (
                <div key={categoria.id} className="categoria-card">
                  <div 
                    className="categoria-cor"
                    style={{ backgroundColor: categoria.cor }}
                  >
                    {categoria.icone || '📂'}
                  </div>
                  <div className="categoria-info">
                    <span className="categoria-nome">{categoria.nome}</span>
                    <span className="categoria-tipo">
                      {categoria.tipo === 'receita' ? 'Receita' : 'Despesa'}
                    </span>
                  </div>
                </div>
              ))}
              {categorias.length > 6 && (
                <div className="categoria-card mais">
                  <div className="categoria-cor">+</div>
                  <div className="categoria-info">
                    <span className="categoria-nome">
                      {categorias.length - 6} mais...
                    </span>
                    <span className="categoria-tipo">categorias</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sugestões de categorias */}
        {!temCategorias && (
          <div className="sugestoes-categorias">
            <h3>💡 Sugestões de categorias básicas:</h3>
            <div className="categorias-grid">
              {categoriasRecomendadas.map((categoria, index) => (
                <div key={index} className="categoria-sugestao">
                  <div 
                    className="categoria-cor"
                    style={{ backgroundColor: categoria.cor }}
                  >
                    {categoria.icone}
                  </div>
                  <div className="categoria-info">
                    <span className="categoria-nome">{categoria.nome}</span>
                    <span className="categoria-tipo">
                      {categoria.tipo === 'receita' ? 'Receita' : 'Despesa'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p className="sugestoes-texto">
              Estas são apenas sugestões. Você pode criar, editar ou excluir qualquer categoria.
            </p>
          </div>
        )}
      </DiagnosticoEtapaLayout>

      {/* Modal de categorias */}
      {modalAberto && (
        <CategoriasModal
          isOpen={modalAberto}
          onClose={handleFecharModal}
          onSave={handleSalvar}
          diagnosticoMode={true}
        />
      )}

      <style jsx>{`
        .categorias-existentes,
        .sugestoes-categorias {
          margin: 2rem 0;
        }

        .categorias-existentes h3,
        .sugestoes-categorias h3 {
          margin: 0 0 1.5rem 0;
          font-size: 1.125rem;
          font-weight: 700;
          color: #374151;
          text-align: center;
        }

        .categorias-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .categoria-card,
        .categoria-sugestao {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .categoria-card:hover,
        .categoria-sugestao:hover {
          border-color: #667eea;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .categoria-card.mais {
          border-style: dashed;
          opacity: 0.7;
        }

        .categoria-cor {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.25rem;
          font-weight: 600;
          flex-shrink: 0;
        }

        .categoria-card.mais .categoria-cor {
          background: #e5e7eb !important;
          color: #6b7280;
          font-size: 1.5rem;
          font-weight: bold;
        }

        .categoria-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .categoria-nome {
          font-weight: 600;
          color: #374151;
          font-size: 0.875rem;
        }

        .categoria-tipo {
          font-size: 0.75rem;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .sugestoes-texto {
          text-align: center;
          margin-top: 1.5rem;
          color: #6b7280;
          font-size: 0.875rem;
          font-style: italic;
        }

        @media (max-width: 768px) {
          .categorias-grid {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }

          .categoria-card,
          .categoria-sugestao {
            padding: 0.875rem;
          }

          .categoria-cor {
            width: 40px;
            height: 40px;
            font-size: 1rem;
          }
        }
      `}</style>
    </>
  );
};

CategoriasEtapa.propTypes = {
  onContinuar: PropTypes.func.isRequired,
  onVoltar: PropTypes.func.isRequired,
  etapaAtual: PropTypes.number,
  totalEtapas: PropTypes.number
};

export default CategoriasEtapa;
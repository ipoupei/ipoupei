// src/modules/diagnostico/Etapas/ContasEtapa.jsx - VERSÃO MÍNIMA
import React, { useState } from 'react';
import { Wallet, Plus, CheckCircle, ArrowRight } from 'lucide-react';

// Componentes
import ContasModal from '@modules/contas/components/ContasModal';
import Button from '@shared/components/ui/Button';

// Hooks
import useContas from '@modules/contas/hooks/useContas';

// Estilos
import '@modules/diagnostico/styles/Etapas.css';

const ContasEtapa = ({ onNext, onPrev }) => {
  const [showContasModal, setShowContasModal] = useState(false);
  const { contas, loading } = useContas();

  const handleOpenModal = () => {
    console.log('🏦 Abrindo modal de contas');
    setShowContasModal(true);
  };

  const handleCloseModal = () => {
    console.log('❌ Fechando modal de contas');
    setShowContasModal(false);
  };

  const handleContaSalva = () => {
    console.log('✅ Conta salva com sucesso!');
    // Modal fecha automaticamente
  };

  const handleNext = () => {
    console.log('➡️ Próxima etapa');
    if (onNext) onNext();
  };

  const handlePrev = () => {
    console.log('⬅️ Etapa anterior');
    if (onPrev) onPrev();
  };

  const canProceed = contas && contas.length > 0;

  if (loading) {
    return (
      <div className="etapa-container">
        <div className="etapa-loading">
          <div className="loading-spinner"></div>
          <p className="loading-text">Carregando contas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="etapa-container">
      {/* Header da Etapa */}
      <div className="etapa-header">
        <div className="etapa-icon">
          <Wallet size={32} />
        </div>
        <h2 className="etapa-title">Vamos cadastrar suas contas</h2>
        <p className="etapa-subtitle">
          Configure as contas que você usa no dia a dia
        </p>
      </div>

      {/* Conteúdo Principal */}
      <div className="etapa-content">
        {/* Texto Introdutório */}
        <div className="intro-section">
          <p className="intro-text">
            Agora vamos cadastrar as contas que você usa no seu dia a dia. 
            Essas contas podem ser bancárias, carteiras digitais, ou mesmo dinheiro em espécie.
          </p>
          <p className="intro-text secondary">
            Clique no botão abaixo e adicione as contas que deseja controlar no iPoupei. 
            Essa é a mesma forma que você usará futuramente, então aproveite para aprender na prática.
          </p>
        </div>

        {/* Botão Principal de Ação */}
        <div className="acao-principal">
          <Button
            onClick={handleOpenModal}
            className="btn-adicionar-conta"
            size="large"
            variant="primary"
          >
            <Plus size={20} />
            Adicionar Nova Conta
          </Button>
        </div>

        {/* Status das Contas Cadastradas */}
        {canProceed && (
          <div className="contas-status">
            <div className="status-header">
              <CheckCircle size={20} className="status-icon success" />
              <h4 className="status-title">
                {contas.length} conta{contas.length > 1 ? 's' : ''} cadastrada{contas.length > 1 ? 's' : ''}
              </h4>
            </div>
            
            <div className="contas-lista">
              {contas.map((conta) => (
                <div key={conta.id} className="conta-item">
                  <div className="conta-icon" style={{ backgroundColor: conta.cor || '#6b7280' }}>
                    <Wallet size={16} />
                  </div>
                  <div className="conta-info">
                    <span className="conta-nome">{conta.nome}</span>
                    <span className="conta-tipo">{conta.tipo}</span>
                  </div>
                  <div className="conta-saldo">
                    R$ {(conta.saldo || 0).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="adicionar-mais">
              <Button
                onClick={handleOpenModal}
                variant="outline"
                size="small"
              >
                <Plus size={16} />
                Adicionar mais contas
              </Button>
            </div>
          </div>
        )}

        {/* Dica para o usuário */}
        <div className="dica-section">
          <div className="dica-card">
            <div className="dica-icon">💡</div>
            <div className="dica-content">
              <h4 className="dica-title">Dica importante:</h4>
              <p className="dica-text">
                Adicione apenas as contas que você realmente usa. 
                Você pode sempre adicionar mais contas depois, mas é melhor começar 
                com as principais para não complicar o controle inicial.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navegação da Etapa */}
      <div className="etapa-navigation">
        <Button
          onClick={handlePrev}
          variant="outline"
          className="btn-voltar"
        >
          Voltar
        </Button>

        <Button
          onClick={handleNext}
          disabled={!canProceed}
          className="btn-continuar"
          variant="primary"
        >
          Continuar
          <ArrowRight size={16} />
        </Button>
      </div>

      {/* Modal de Contas */}
      {showContasModal && (
        <ContasModal
          isOpen={showContasModal}
          onClose={handleCloseModal}
          onSave={handleContaSalva}
        />
      )}
    </div>
  );
};

export default ContasEtapa;
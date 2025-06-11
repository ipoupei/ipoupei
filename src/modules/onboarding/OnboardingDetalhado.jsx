// src/modules/onboarding/OnboardingDetalhado.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, X } from 'lucide-react';

// Modais existentes
import ContasModal from '@modules/contas/components/ContasModal';
import CategoriasModal from '@modules/categorias/components/CategoriasModal';
import ReceitasModal from '@modules/transacoes/components/ReceitasModal';
import DespesasModal from '@modules/transacoes/components/DespesasModal';
import CartoesModal from '@modules/cartoes/components/CartoesModal';

// Hooks existentes
import useContas from '@modules/contas/hooks/useContas';
import useCategorias from '@modules/categorias/hooks/useCategorias';
import useTransacoes from '@modules/transacoes/hooks/useTransacoes';
import useCartoes from '@modules/cartoes/hooks/useCartoes';

const OnboardingDetalhado = () => {
  const navigate = useNavigate();
  
  // Estados dos hooks existentes
  const { contas } = useContas();
  const { categorias } = useCategorias();
  const { transacoes } = useTransacoes();
  const { cartoes } = useCartoes();
  
  // Estado do onboarding
  const [etapaAtual, setEtapaAtual] = useState(0);
  const [modalAtivo, setModalAtivo] = useState(null);
  const [etapasCompletas, setEtapasCompletas] = useState([]);

  // Definição das etapas
  const etapas = [
    {
      id: 'contas',
      titulo: 'Suas Contas Bancárias',
      descricao: 'Cadastre as contas que você usa no dia a dia',
      modal: 'ContasModal',
      icone: '🏦',
      validacao: () => contas.length > 0,
      mensagem: 'Cadastre pelo menos uma conta para continuar'
    },
    {
      id: 'categorias',
      titulo: 'Categorias de Gastos',
      descricao: 'Organize como você classifica seus gastos e ganhos',
      modal: 'CategoriasModal',
      icone: '📁',
      validacao: () => categorias.length > 0,
      mensagem: 'As categorias te ajudam a organizar melhor'
    },
    {
      id: 'receitas-fixas',
      titulo: 'Receitas Previsíveis',
      descricao: 'Cadastre sua renda fixa mensal (salário, pensão, etc.)',
      modal: 'ReceitasModal',
      icone: '💰',
      modalProps: { tipo: 'receita', titulo: 'Receitas Previsíveis' },
      validacao: () => transacoes.filter(t => t.tipo === 'receita' && t.recorrente).length > 0,
      mensagem: 'Cadastre pelo menos uma fonte de renda'
    },
    {
      id: 'receitas-pontuais',
      titulo: 'Receitas Extras',
      descricao: 'Freelances, vendas, outras receitas ocasionais',
      modal: 'ReceitasModal',
      icone: '💸',
      modalProps: { tipo: 'receita', titulo: 'Receitas Extras', recorrente: false },
      validacao: () => true, // Opcional
      mensagem: 'Esta etapa é opcional, mas recomendada'
    },
    {
      id: 'despesas-fixas',
      titulo: 'Despesas Obrigatórias',
      descricao: 'Gastos fixos que você paga todo mês',
      modal: 'DespesasModal',
      icone: '🏠',
      modalProps: { tipo: 'despesa', titulo: 'Despesas Fixas', recorrente: true },
      validacao: () => transacoes.filter(t => t.tipo === 'despesa' && t.recorrente).length > 0,
      mensagem: 'Cadastre suas principais despesas fixas'
    },
    {
      id: 'despesas-variaveis',
      titulo: 'Gastos do Dia a Dia',
      descricao: 'Despesas que variam de mês para mês',
      modal: 'DespesasModal',
      icone: '🛒',
      modalProps: { tipo: 'despesa', titulo: 'Despesas Variáveis', recorrente: false },
      validacao: () => true, // Opcional
      mensagem: 'Esta etapa é opcional'
    },
    {
      id: 'cartoes',
      titulo: 'Cartões de Crédito',
      descricao: 'Configure seus cartões para melhor controle',
      modal: 'CartoesModal',
      icone: '💳',
      validacao: () => true, // Opcional
      mensagem: 'Se você não usa cartão, pode pular esta etapa'
    }
  ];

  // Verifica etapas completas ao mudar dados
  useEffect(() => {
    const novasCompletas = etapas
      .map((etapa, index) => etapa.validacao() ? index : null)
      .filter(index => index !== null);
    
    setEtapasCompletas(novasCompletas);
  }, [contas, categorias, transacoes, cartoes]);

  // Abre o modal da etapa atual
  const abrirModal = (nomeModal, props = {}) => {
    setModalAtivo({ nome: nomeModal, props });
  };

  // Fecha modal
  const fecharModal = () => {
    setModalAtivo(null);
  };

  // Avança para próxima etapa
  const proximaEtapa = () => {
    if (etapaAtual < etapas.length - 1) {
      setEtapaAtual(etapaAtual + 1);
    } else {
      // Finalizar onboarding
      navigate('/dashboard?onboarding=complete');
    }
  };

  // Volta para etapa anterior
  const etapaAnterior = () => {
    if (etapaAtual > 0) {
      setEtapaAtual(etapaAtual - 1);
    }
  };

  // Pula etapa atual
  const pularEtapa = () => {
    proximaEtapa();
  };

  // Finaliza onboarding
  const finalizarOnboarding = () => {
    navigate('/dashboard?onboarding=complete&success=true');
  };

  const etapa = etapas[etapaAtual];
  const etapaCompleta = etapasCompletas.includes(etapaAtual);
  const progresso = Math.round(((etapaAtual + 1) / etapas.length) * 100);

  // Renderiza o modal apropriado
  const renderModal = () => {
    if (!modalAtivo) return null;

    const baseProps = {
      isOpen: true,
      onClose: fecharModal,
      diagnosticoMode: true,
      ...modalAtivo.props
    };

    switch (modalAtivo.nome) {
      case 'ContasModal':
        return <ContasModal {...baseProps} />;
      case 'CategoriasModal':
        return <CategoriasModal {...baseProps} />;
      case 'ReceitasModal':
        return <ReceitasModal {...baseProps} />;
      case 'DespesasModal':
        return <DespesasModal {...baseProps} />;
      case 'CartoesModal':
        return <CartoesModal {...baseProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="onboarding-detalhado">
      <div className="onboarding-container">
        {/* Header com progresso */}
        <div className="onboarding-header">
          <button 
            onClick={() => navigate('/dashboard')}
            className="btn-fechar"
          >
            <X size={24} />
          </button>
          
          <div className="progress-info">
            <h2>Configurando seu iPoupei</h2>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progresso}%` }}
              />
            </div>
            <span className="progress-text">
              Etapa {etapaAtual + 1} de {etapas.length} • {progresso}% completo
            </span>
          </div>
        </div>

        {/* Conteúdo da etapa */}
        <div className="onboarding-content">
          <div className="etapa-info">
            <div className="etapa-icone">{etapa.icone}</div>
            <h1 className="etapa-titulo">{etapa.titulo}</h1>
            <p className="etapa-descricao">{etapa.descricao}</p>
          </div>

          <div className="etapa-status">
            {etapaCompleta ? (
              <div className="status-completo">
                <CheckCircle size={24} color="#10b981" />
                <span>Etapa concluída!</span>
              </div>
            ) : (
              <div className="status-pendente">
                <span className="status-texto">{etapa.mensagem}</span>
              </div>
            )}
          </div>

          <div className="etapa-acoes">
            <button
              onClick={() => abrirModal(etapa.modal, etapa.modalProps)}
              className="btn-configurar"
            >
              {etapaCompleta ? 'Editar Configuração' : 'Configurar Agora'}
            </button>
            
            {!etapa.validacao() && (
              <button
                onClick={pularEtapa}
                className="btn-pular"
              >
                Pular esta etapa
              </button>
            )}
          </div>
        </div>

        {/* Navegação */}
        <div className="onboarding-navigation">
          <div className="nav-left">
            {etapaAtual > 0 && (
              <button onClick={etapaAnterior} className="btn-voltar">
                Voltar
              </button>
            )}
          </div>
          
          <div className="nav-right">
            {etapaAtual === etapas.length - 1 ? (
              <button 
                onClick={finalizarOnboarding}
                className="btn-finalizar"
              >
                Finalizar Configuração
                <ArrowRight size={20} />
              </button>
            ) : (
              <button 
                onClick={proximaEtapa}
                className="btn-continuar"
              >
                Próxima Etapa
                <ArrowRight size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Lista de etapas */}
        <div className="etapas-resumo">
          <h3>Progresso Geral:</h3>
          <div className="etapas-grid">
            {etapas.map((etapaItem, index) => (
              <div
                key={etapaItem.id}
                className={`etapa-item ${
                  index === etapaAtual ? 'atual' : 
                  etapasCompletas.includes(index) ? 'completa' : 'pendente'
                }`}
              >
                <div className="etapa-item-icone">{etapaItem.icone}</div>
                <span className="etapa-item-titulo">{etapaItem.titulo}</span>
                {etapasCompletas.includes(index) && (
                  <CheckCircle size={16} color="#10b981" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      {renderModal()}
    </div>
  );
};

export default OnboardingDetalhado;
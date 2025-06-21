// src/modules/diagnostico/components/DiagnosticoFlow.jsx
import { useEffect } from 'react';
import { useDiagnosticoFlowStore } from '@modules/diagnostico/store/diagnosticoFlowStore';

// Importar modais existentes
import ContasModal from '@modules/contas/components/ContasModal';
import CartoesModal from '@modules/cartoes/components/CartoesModal';
import ReceitasModal from '@modules/transacoes/components/ReceitasModal';
import DespesasModal from '@modules/transacoes/components/DespesasModal';

// Importar hooks existentes
import useContas from '@modules/contas/hooks/useContas';
import useCartoes from '@modules/cartoes/hooks/useCartoes';
//import useTransacoes from '@modules/transacoes/hooks/useTransacoes';

// Etapas do diagnóstico
import IntroEtapa from '@modules/diagnostico/etapas/IntroEtapa';
import PercepcaoEtapa from '@modules/diagnostico/etapas/PercepcaoEtapa';
import CadastroEtapa from '@modules/diagnostico/etapas/CadastroEtapa';
import DividasEtapa from '@modules/diagnostico/etapas/DividasEtapa';
import ProcessamentoEtapa from '@modules/diagnostico/etapas/ProcessamentoEtapa';
import ResultadoEtapa from '@modules/diagnostico/etapas/ResultadoEtapa';

import './DiagnosticoFlow.css';

const DiagnosticoFlow = () => {
  const {
    etapaAtual,
    modalAtivo,
    loading,
    progresso,
    getEtapaAtual,
    getFluxoCompleto,
    iniciarDiagnostico,
    fecharModal,
    atualizarDadosContas,
    atualizarDadosCartoes,
    atualizarDadosReceitas,
    atualizarDadosDespesas
  } = useDiagnosticoFlowStore();

  // Hooks existentes para sincronizar dados
  const { contas } = useContas();
  const { cartoes } = useCartoes();
  const { transacoes } = useTransacoes();

  // Sincronizar dados dos hooks com o store do diagnóstico
  useEffect(() => {
    if (contas.length > 0) {
      atualizarDadosContas(contas);
    }
  }, [contas, atualizarDadosContas]);

  useEffect(() => {
    if (cartoes.length > 0) {
      atualizarDadosCartoes(cartoes);
    }
  }, [cartoes, atualizarDadosCartoes]);

  useEffect(() => {
    const receitas = transacoes.filter(t => t.tipo === 'receita');
    const despesas = transacoes.filter(t => t.tipo === 'despesa');
    
    if (receitas.length > 0) {
      atualizarDadosReceitas(receitas);
    }
    
    if (despesas.length > 0) {
      // Separar despesas fixas e variáveis baseado em algum critério
      // Por exemplo, se tem recorrência ou categoria específica
      const despesasFixas = despesas.filter(d => d.recorrente || isGastoFixo(d));
      const despesasVariaveis = despesas.filter(d => !d.recorrente && !isGastoFixo(d));
      
      atualizarDadosDespesas(despesasFixas, 'fixas');
      atualizarDadosDespesas(despesasVariaveis, 'variaveis');
    }
  }, [transacoes, atualizarDadosReceitas, atualizarDadosDespesas]);

  useEffect(() => {
    iniciarDiagnostico();
  }, [iniciarDiagnostico]);

  const etapaAtualObj = getEtapaAtual();
  const fluxoCompleto = getFluxoCompleto();

  const renderizarEtapa = () => {
    switch (etapaAtualObj?.tipo) {
      case 'intro':
        return <IntroEtapa />;
      
      case 'questionario':
        if (etapaAtualObj.id === 'percepcao') {
          return <PercepcaoEtapa />;
        }
        if (etapaAtualObj.id === 'dividas') {
          return <DividasEtapa />;
        }
        break;
      
      case 'cadastro':
        return <CadastroEtapa etapa={etapaAtualObj} />;
      
      case 'processamento':
        return <ProcessamentoEtapa />;
      
      case 'resultado':
        return <ResultadoEtapa />;
      
      default:
        return <div>Etapa não encontrada</div>;
    }
  };

  const renderizarModal = () => {
    switch (modalAtivo) {
      case 'ContasModal':
        return (
          <ContasModal
            isOpen={true}
            onClose={fecharModal}
            // Passar props específicas do diagnóstico se necessário
            diagnosticoMode={true}
          />
        );
      
      case 'CartoesModal':
        return (
          <CartoesModal
            isOpen={true}
            onClose={fecharModal}
            diagnosticoMode={true}
          />
        );
      
      case 'ReceitasModal':
        return (
          <ReceitasModal
            isOpen={true}
            onClose={fecharModal}
            diagnosticoMode={true}
            // Forçar tipo receita
            tipoTransacao="receita"
          />
        );
      
      case 'DespesasModal':
        return (
          <DespesasModal
            isOpen={true}
            onClose={fecharModal}
            diagnosticoMode={true}
            // Forçar tipo despesa
            tipoTransacao="despesa"
          />
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="diagnostico-loading">
        <div className="spinner"></div>
        <p>Carregando diagnóstico...</p>
      </div>
    );
  }

  return (
    <div className="diagnostico-flow">
      {/* Header com progresso */}
      <div className="diagnostico-header">
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progresso}%` }}
            ></div>
          </div>
          <span className="progress-text">{progresso}% completo</span>
        </div>
        
        {/* Mini mapa das etapas */}
        <div className="etapas-mapa">
          {fluxoCompleto.map((etapa, index) => (
            <div
              key={etapa.id}
              className={`etapa-indicador ${
                index === etapaAtual ? 'ativa' : 
                index < etapaAtual ? 'completa' : 'pendente'
              }`}
            >
              <span className="etapa-icone">{etapa.icone}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Conteúdo da etapa atual */}
      <div className="diagnostico-content">
        {renderizarEtapa()}
      </div>

      {/* Modais */}
      {modalAtivo && renderizarModal()}
    </div>
  );
};

// Função auxiliar para determinar se um gasto é fixo
function isGastoFixo(transacao) {
  const categoriasFixas = [
    'moradia', 'aluguel', 'financiamento', 'internet', 'telefone',
    'energia', 'agua', 'gas', 'seguro', 'escola', 'faculdade',
    'plano-saude', 'academia', 'streaming'
  ];
  
  const categoria = transacao.categoria?.nome?.toLowerCase() || '';
  const descricao = transacao.descricao?.toLowerCase() || '';
  
  return categoriasFixas.some(cat => 
    categoria.includes(cat) || descricao.includes(cat)
  );
}

export default DiagnosticoFlow;
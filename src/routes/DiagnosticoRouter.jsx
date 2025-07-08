// src/routes/DiagnosticoRouter.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Importar todas as etapas
import IntroPercepcaoEtapa from '@modules/diagnostico/onboarding/etapa00_IntroPercepcao';
import CategoriasEtapa from '@modules/diagnostico/onboarding/etapa01_Categorias';
import ContasEtapa from '@modules/diagnostico/onboarding/etapa02_Contas';
import CartoesEtapa from '@modules/diagnostico/onboarding/etapa03_Cartoes';
import DespesasCartaoEtapa from '@modules/diagnostico/onboarding/etapa04_DespesasCartao';
import ReceitasEtapa from '@modules/diagnostico/onboarding/etapa05_Receitas';
import DespesasFixasEtapa from '@modules/diagnostico/onboarding/etapa06_DespesasFixas';
import DespesasVariaveisEtapa from '@modules/diagnostico/onboarding/etapa07_DespesasVariaveis';
import ResumoFinanceiroEtapa from '@modules/diagnostico/onboarding/etapa08_ResumoFinanceiro';
import FinalizacaoEtapa from '@modules/diagnostico/onboarding/etapa09_Finalizacao';
import '@modules/diagnostico/styles/DiagnosticoOnboarding.css';

const DiagnosticoRouter = () => {
  const navigate = useNavigate();
  const [etapaAtual, setEtapaAtual] = useState(0);
  const [dadosColetados, setDadosColetados] = useState({
    intro_percepcao: null,
    categorias: null,
    contas: null,
    cartoes: null,
    despesas_cartao: null,
    receitas: null,
    despesas_fixas: null,
    despesas_variaveis: null,
    resumo_financeiro: null,
    finalizacao: null
  });

  // Configuração das etapas
  const etapas = [
    {
      id: 'intro-percepcao',
      componente: IntroPercepcaoEtapa,
      obrigatoria: true,
      titulo: 'Introdução e Percepção'
    },
    {
      id: 'categorias',
      componente: CategoriasEtapa,
      obrigatoria: false,
      titulo: 'Categorias'
    },
    {
      id: 'contas',
      componente: ContasEtapa,
      obrigatoria: true,
      titulo: 'Contas Bancárias'
    },
    {
      id: 'cartoes',
      componente: CartoesEtapa,
      obrigatoria: false,
      titulo: 'Cartões de Crédito'
    },
    {
      id: 'despesas-cartao',
      componente: DespesasCartaoEtapa,
      obrigatoria: false,
      titulo: 'Despesas do Cartão',
      condicional: true,
      dependeDe: 'cartoes'
    },
    {
      id: 'receitas',
      componente: ReceitasEtapa,
      obrigatoria: true,
      titulo: 'Receitas e Fontes de Renda'
    },
    {
      id: 'despesas-fixas',
      componente: DespesasFixasEtapa,
      obrigatoria: true,
      titulo: 'Despesas Fixas Mensais'
    },
    {
      id: 'despesas-variaveis',
      componente: DespesasVariaveisEtapa,
      obrigatoria: false,
      titulo: 'Despesas Variáveis'
    },
    {
      id: 'resumo-financeiro',
      componente: ResumoFinanceiroEtapa,
      obrigatoria: true,
      titulo: 'Resumo do Diagnóstico'
    },
    {
      id: 'finalizacao',
      componente: FinalizacaoEtapa,
      obrigatoria: true,
      titulo: 'Finalização'
    }
  ];

  const totalEtapas = etapas.length;

  // ✅ FUNÇÃO CORRIGIDA - Recebe dados como parâmetro
  const devesPularEtapa = (indiceEtapa, dadosParaVerificar) => {
    const etapa = etapas[indiceEtapa];
    
    // Se não é condicional, não pula
    if (!etapa || !etapa.condicional) return false;
    
    // Verifica a condição específica
    if (etapa.id === 'despesas-cartao') {
      const dadosCartoes = dadosParaVerificar.cartoes;
      const temCartoes = dadosCartoes && dadosCartoes.totalCartoes > 0;
      
      console.log('🔍 Verificando etapa despesas-cartao (DADOS CORRETOS):', { 
        dadosCartoes, 
        temCartoes,
        totalCartoes: dadosCartoes?.totalCartoes,
        resultado: !temCartoes
      });
      
      return !temCartoes;
    }
    
    // Adicione outras condições aqui conforme necessário
    return false;
  };

  // ✅ FUNÇÃO CORRIGIDA - Recebe dados como parâmetro
  const encontrarProximaEtapa = (etapaAtualIndex, dadosParaVerificar) => {
    let proximaEtapa = etapaAtualIndex + 1;
    
    // Continua pulando até encontrar uma etapa válida ou chegar ao fim
    while (proximaEtapa < totalEtapas && devesPularEtapa(proximaEtapa, dadosParaVerificar)) {
      console.log(`🔄 Pulando etapa ${proximaEtapa}: ${etapas[proximaEtapa].titulo}`);
      proximaEtapa++;
    }
    
    console.log(`✅ Próxima etapa válida encontrada: ${proximaEtapa}`);
    return proximaEtapa;
  };

  // ✅ FUNÇÃO CORRIGIDA - Recebe dados como parâmetro
  const encontrarEtapaAnterior = (etapaAtualIndex, dadosParaVerificar) => {
    let etapaAnterior = etapaAtualIndex - 1;
    
    // Continua voltando até encontrar uma etapa válida ou chegar ao início
    while (etapaAnterior >= 0 && devesPularEtapa(etapaAnterior, dadosParaVerificar)) {
      console.log(`🔄 Pulando etapa anterior ${etapaAnterior}: ${etapas[etapaAnterior].titulo}`);
      etapaAnterior--;
    }
    
    return etapaAnterior;
  };

  const etapaConfig = etapas[etapaAtual];

  // Carregar dados salvos no localStorage
  useEffect(() => {
    const dadosSalvos = localStorage.getItem('diagnostico-dados');
    if (dadosSalvos) {
      try {
        const dadosParsed = JSON.parse(dadosSalvos);
        console.log('📂 Carregando dados salvos do diagnóstico:', dadosParsed);
        setDadosColetados(dadosParsed);
      } catch (error) {
        console.error('❌ Erro ao carregar dados salvos:', error);
      }
    }

    const etapaSalva = localStorage.getItem('diagnostico-etapa');
    if (etapaSalva) {
      const etapaNumero = parseInt(etapaSalva, 10);
      if (etapaNumero >= 0 && etapaNumero < totalEtapas) {
        console.log('📂 Carregando etapa salva:', etapaNumero);
        setEtapaAtual(etapaNumero);
      }
    }
  }, [totalEtapas]);

  // Salvar dados sempre que mudarem
  useEffect(() => {
    if (Object.keys(dadosColetados).length > 0) {
      console.log('💾 Salvando progresso do diagnóstico:', dadosColetados);
      localStorage.setItem('diagnostico-dados', JSON.stringify(dadosColetados));
      localStorage.setItem('diagnostico-etapa', etapaAtual.toString());
    }
  }, [dadosColetados, etapaAtual]);

  // ✅ FUNÇÃO PRINCIPAL CORRIGIDA
  const handleContinuar = (novosDados = null) => {
    console.log('🚀 handleContinuar - Etapa:', etapaAtual, 'Dados:', novosDados);
    
    // ✅ PASSO 1: Calcular os dados atualizados PRIMEIRO
    let dadosAtualizados = { ...dadosColetados };
    
    if (novosDados) {
      const chaveEtapa = etapaConfig.id.replace(/-/g, '_');
      console.log('💾 Salvando dados da etapa:', chaveEtapa);
      
      dadosAtualizados[chaveEtapa] = {
        ...novosDados,
        completoEm: new Date().toISOString(),
        etapa: etapaAtual
      };
      
      console.log('📋 Dados completos atualizados:', dadosAtualizados);
    }

    // ✅ PASSO 2: Usar os dados atualizados para navegação
    const proximaEtapa = encontrarProximaEtapa(etapaAtual, dadosAtualizados);
    
    // ✅ PASSO 3: Atualizar estado E navegar
    if (novosDados) {
      setDadosColetados(dadosAtualizados);
    }
    
    if (proximaEtapa < totalEtapas) {
      console.log(`✅ Avançando para etapa ${proximaEtapa}: ${etapas[proximaEtapa]?.titulo}`);
      setEtapaAtual(proximaEtapa);
    } else {
      console.log('🏁 Todas as etapas concluídas');
      handleFinalizarDiagnostico(dadosAtualizados);
    }
  };

  // ✅ FUNÇÃO VOLTAR CORRIGIDA
  const handleVoltar = () => {
    // Usar dados atuais para verificar etapa anterior
    const etapaAnterior = encontrarEtapaAnterior(etapaAtual, dadosColetados);
    
    if (etapaAnterior >= 0) {
      console.log(`⬅️ Voltando para etapa ${etapaAnterior}`);
      setEtapaAtual(etapaAnterior);
    }
  };

  // ✅ FUNÇÃO PULAR CORRIGIDA
  const handlePular = () => {
    if (!etapaConfig.obrigatoria) {
      console.log(`⏭️ Pulando etapa opcional: ${etapaConfig.titulo}`);
      
      // ✅ Criar dados atualizados com informação de que foi pulada
      const dadosAtualizados = { ...dadosColetados };
      const chaveEtapa = etapaConfig.id.replace(/-/g, '_');
      
      dadosAtualizados[chaveEtapa] = {
        pulou: true,
        motivo: 'usuario_pulou',
        completoEm: new Date().toISOString(),
        etapa: etapaAtual
      };
      
      // ✅ Usar dados atualizados para navegação
      const proximaEtapa = encontrarProximaEtapa(etapaAtual, dadosAtualizados);
      
      // ✅ Atualizar estado e navegar
      setDadosColetados(dadosAtualizados);
      
      if (proximaEtapa < totalEtapas) {
        setEtapaAtual(proximaEtapa);
      } else {
        handleFinalizarDiagnostico(dadosAtualizados);
      }
    }
  };

  const handleFinalizarDiagnostico = (dadosFinais = dadosColetados) => {
    console.log('✅ Finalizando diagnóstico com dados:', dadosFinais);
    
    // Processar e salvar dados finais
    const dadosCompletos = {
      ...dadosFinais,
      diagnostico_metadata: {
        completoEm: new Date().toISOString(),
        versao: '1.0',
        etapasCompletadas: totalEtapas,
        tempoTotalMinutos: 0
      }
    };
    
    // Marcar como completo
    localStorage.setItem('diagnostico-completo', 'true');
    localStorage.setItem('diagnostico-data-conclusao', new Date().toISOString());
    localStorage.setItem('diagnostico-dados-finais', JSON.stringify(dadosCompletos));
    
    // Limpar dados temporários
    localStorage.removeItem('diagnostico-dados');
    localStorage.removeItem('diagnostico-etapa');
    
    // Redirecionar para dashboard
    navigate('/dashboard?diagnostico=completo&primeira_vez=true');
  };

  // ✅ VERIFICAÇÃO CORRIGIDA - Usar dados atuais
  if (devesPularEtapa(etapaAtual, dadosColetados)) {
    // Auto-navegar para próxima etapa válida
    setTimeout(() => {
      const proximaEtapa = encontrarProximaEtapa(etapaAtual, dadosColetados);
      if (proximaEtapa < totalEtapas) {
        setEtapaAtual(proximaEtapa);
      }
    }, 100);

    return (
      <div className="diagnostico-container">
        <div className="diagnostico-main">
          <div className="main-icon">⏳</div>
          <h1 className="main-title">Processando...</h1>
          <p className="main-description">Redirecionando para a próxima etapa relevante.</p>
        </div>
      </div>
    );
  }

  // Renderizar etapa atual
  const ComponenteAtual = etapaConfig?.componente;

  if (!ComponenteAtual) {
    console.error('❌ Componente não encontrado para etapa:', etapaAtual, etapaConfig);
    return (
      <div className="diagnostico-container">
        <div className="diagnostico-main">
          <div className="main-icon">❌</div>
          <h1 className="main-title">Erro</h1>
          <p className="main-description">Etapa não encontrada. Verifique a configuração.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="diagnostico-router">
      <ComponenteAtual
        onContinuar={handleContinuar}
        onVoltar={handleVoltar}
        onPular={handlePular}
        etapaAtual={etapaAtual}
        totalEtapas={totalEtapas}
        dadosExistentes={dadosColetados[etapaConfig.id.replace(/-/g, '_')]}
        todosDados={dadosColetados}
      />
    </div>
  );
};

export default DiagnosticoRouter;
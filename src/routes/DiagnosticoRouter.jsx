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
import useDiagnosticoEtapa from '@modules/diagnostico/hooks/useDiagnosticoEtapa';

const DiagnosticoRouter = () => {
  const navigate = useNavigate();
  const [etapaAtual, setEtapaAtual] = useState(0);
  
  // 🆕 NOVO: Controle de inicialização
  const [isInitialized, setIsInitialized] = useState(false);
  
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

  // Hook para gerenciar etapa no banco
  const { 
    atualizarEtapaAtual, 
    buscarEtapaAtual, 
    marcarDiagnosticoCompleto,
    loading: loadingEtapa 
  } = useDiagnosticoEtapa();

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

  // ✅ CARREGAMENTO INICIAL CORRIGIDO
  useEffect(() => {
    const carregarDadosIniciais = async () => {
      console.log('🚀 === INÍCIO CARREGAMENTO DIAGNÓSTICO ===');
      console.log('🚀 URL atual:', window.location.href);
      
      // 1. Carregar dados salvos do localStorage
      const dadosSalvos = localStorage.getItem('diagnostico-dados');
      if (dadosSalvos) {
        try {
          const dadosParsed = JSON.parse(dadosSalvos);
          console.log('📂 Dados salvos encontrados:', Object.keys(dadosParsed));
          setDadosColetados(dadosParsed);
        } catch (error) {
          console.error('❌ Erro ao carregar dados salvos:', error);
        }
      } else {
        console.log('📂 Nenhum dado salvo encontrado');
      }

      // 2. ✅ VERIFICAR REDIRECIONAMENTO AUTOMÁTICO
      const etapaRedirect = sessionStorage.getItem('diagnostico-etapa-redirect');
      console.log('🔄 === VERIFICANDO REDIRECIONAMENTO ===');
      console.log('🔄 Etapa redirect no sessionStorage:', etapaRedirect);
      
      if (etapaRedirect) {
        const etapaNumero = parseInt(etapaRedirect, 10);
        console.log('✅ USANDO ETAPA DE REDIRECIONAMENTO:', etapaNumero);
        setEtapaAtual(etapaNumero);
        
        // ✅ Limpar flag
        sessionStorage.removeItem('diagnostico-etapa-redirect');
        console.log('🧹 Flag de redirecionamento removida');
        console.log('🏁 FINALIZANDO - Etapa definida via redirecionamento');
        
        // ✅ CRUCIAL: Marcar como inicializado APÓS definir etapa
        setIsInitialized(true);
        return;
      }

      // 3. ✅ BUSCAR DO BANCO
      console.log('🔍 === BUSCANDO ETAPA DO BANCO ===');
      const etapaAtualBanco = await buscarEtapaAtual();
      console.log('📋 Etapa retornada do banco:', etapaAtualBanco);
      
      if (etapaAtualBanco !== null && etapaAtualBanco >= 0) {
        console.log('✅ USANDO ETAPA DO BANCO:', etapaAtualBanco);
        setEtapaAtual(etapaAtualBanco);
        console.log('🏁 FINALIZANDO - Etapa definida via banco');
        
        // ✅ CRUCIAL: Marcar como inicializado APÓS definir etapa
        setIsInitialized(true);
        return;
      }

      // 4. ✅ FALLBACK: localStorage
      console.log('📂 === TENTANDO LOCALSTORAGE ===');
      const etapaSalva = localStorage.getItem('diagnostico-etapa');
      console.log('📂 Etapa no localStorage:', etapaSalva);
      
      if (etapaSalva) {
        const etapaNumero = parseInt(etapaSalva, 10);
        if (etapaNumero >= 0 && etapaNumero < totalEtapas) {
          console.log('✅ USANDO ETAPA DO LOCALSTORAGE:', etapaNumero);
          setEtapaAtual(etapaNumero);
          
          console.log('💾 Sincronizando com banco...');
          await atualizarEtapaAtual(etapaNumero);
          console.log('🏁 FINALIZANDO - Etapa definida via localStorage');
          
          // ✅ CRUCIAL: Marcar como inicializado
          setIsInitialized(true);
          return;
        }
      }

      // 5. ✅ ÚLTIMO CASO: zero
      console.log('🆕 === INICIANDO DO ZERO ===');
      console.log('🆕 Nenhuma etapa encontrada - começando do 0');
      setEtapaAtual(0);
      await atualizarEtapaAtual(0);
      console.log('🏁 FINALIZANDO - Etapa 0 por padrão');
      
      // ✅ CRUCIAL: Marcar como inicializado
      setIsInitialized(true);
    };

    carregarDadosIniciais();
  }, [totalEtapas, buscarEtapaAtual, atualizarEtapaAtual]);

  // ✅ SALVAR PROGRESSO CORRIGIDO - SÓ APÓS INICIALIZAÇÃO
  useEffect(() => {
    const salvarProgresso = async () => {
      // ✅ SÓ SALVAR SE JÁ INICIALIZOU
      if (!isInitialized) {
        console.log('⏳ Aguardando inicialização antes de salvar...');
        return;
      }
      
      if (Object.keys(dadosColetados).length > 0) {
        console.log('💾 Salvando progresso do diagnóstico:', dadosColetados);
        localStorage.setItem('diagnostico-dados', JSON.stringify(dadosColetados));
        localStorage.setItem('diagnostico-etapa', etapaAtual.toString());
        
        // Atualizar etapa no banco
        await atualizarEtapaAtual(etapaAtual);
      }
    };

    salvarProgresso();
  }, [dadosColetados, etapaAtual, atualizarEtapaAtual, isInitialized]); // ✅ Adicionar isInitialized

  // ✅ FUNÇÃO PRINCIPAL CORRIGIDA
  const handleContinuar = async (novosDados = null) => {
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
      
      // Atualizar etapa no banco
      await atualizarEtapaAtual(proximaEtapa);
    } else {
      console.log('🏁 Todas as etapas concluídas');
      await handleFinalizarDiagnostico(dadosAtualizados);
    }
  };

  // ✅ FUNÇÃO VOLTAR CORRIGIDA
  const handleVoltar = async () => {
    // Usar dados atuais para verificar etapa anterior
    const etapaAnterior = encontrarEtapaAnterior(etapaAtual, dadosColetados);
    
    if (etapaAnterior >= 0) {
      console.log(`⬅️ Voltando para etapa ${etapaAnterior}`);
      setEtapaAtual(etapaAnterior);
      
      // Atualizar etapa no banco
      await atualizarEtapaAtual(etapaAnterior);
    }
  };

  // ✅ FUNÇÃO PULAR CORRIGIDA
  const handlePular = async () => {
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
        
        // Atualizar etapa no banco
        await atualizarEtapaAtual(proximaEtapa);
      } else {
        await handleFinalizarDiagnostico(dadosAtualizados);
      }
    }
  };

  const handleFinalizarDiagnostico = async (dadosFinais = dadosColetados) => {
    console.log('✅ Finalizando diagnóstico com dados:', dadosFinais);
    
    // Marcar como completo no banco
    await marcarDiagnosticoCompleto();
    
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
    setTimeout(async () => {
      const proximaEtapa = encontrarProximaEtapa(etapaAtual, dadosColetados);
      if (proximaEtapa < totalEtapas) {
        setEtapaAtual(proximaEtapa);
        await atualizarEtapaAtual(proximaEtapa);
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
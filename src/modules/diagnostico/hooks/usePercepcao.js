import { useState, useCallback } from 'react';

/**
 * Hook para gerenciar o estado da percepção financeira do usuário
 * Armazena localmente as respostas subjetivas sobre a relação com dinheiro
 */
const usePercepcao = (dadosIniciais = {}) => {
  // Estado inicial da percepção
  const estadoInicial = {
    controleFinanceiro: null,      // 0-10: Nível de controle que sente ter
    ansiedadeDinheiro: null,       // 0-10: Nível de ansiedade ao pensar em dinheiro
    organizacaoFinanceira: null,   // "sim", "mais_ou_menos", "nao"
    clarezaSituacao: null,         // "totalmente", "parcialmente", "nada_claro"
    segurancaFuturo: null,         // 0-10: Segurança em relação ao futuro
    ...dadosIniciais
  };

  const [percepcao, setPercepcao] = useState(estadoInicial);
  
  // Atualiza um campo específico da percepção
  const atualizarCampo = useCallback((campo, valor) => {
    setPercepcao(prev => ({
      ...prev,
      [campo]: valor
    }));
  }, []);
  
  // Atualiza múltiplos campos de uma vez
  const atualizarPercepcao = useCallback((novosDados) => {
    setPercepcao(prev => ({
      ...prev,
      ...novosDados
    }));
  }, []);
  
  // Reseta a percepção para o estado inicial
  const resetarPercepcao = useCallback(() => {
    setPercepcao(estadoInicial);
  }, [estadoInicial]);
  
  // Valida se todos os campos obrigatórios foram preenchidos
  const validarPreenchimento = useCallback(() => {
    const camposObrigatorios = [
      'controleFinanceiro',
      'ansiedadeDinheiro', 
      'organizacaoFinanceira',
      'clarezaSituacao',
      'segurancaFuturo'
    ];
    
    return camposObrigatorios.every(campo => {
      const valor = percepcao[campo];
      return valor !== null && valor !== undefined && valor !== '';
    });
  }, [percepcao]);
  
  // Calcula o progresso do preenchimento (0-100%)
  const calcularProgresso = useCallback(() => {
    const camposObrigatorios = [
      'controleFinanceiro',
      'ansiedadeDinheiro', 
      'organizacaoFinanceira',
      'clarezaSituacao',
      'segurancaFuturo'
    ];
    
    const camposPreenchidos = camposObrigatorios.filter(campo => {
      const valor = percepcao[campo];
      return valor !== null && valor !== undefined && valor !== '';
    });
    
    return Math.round((camposPreenchidos.length / camposObrigatorios.length) * 100);
  }, [percepcao]);
  
  // Analisa o perfil emocional baseado nas respostas
  const analisarPerfilEmocional = useCallback(() => {
    if (!validarPreenchimento()) {
      return null;
    }
    
    const { 
      controleFinanceiro, 
      ansiedadeDinheiro, 
      organizacaoFinanceira,
      clarezaSituacao,
      segurancaFuturo 
    } = percepcao;
    
    // Calcula scores
    const scoreControle = controleFinanceiro || 0;
    const scoreAnsiedade = 10 - (ansiedadeDinheiro || 0); // Inverte (menos ansiedade = melhor)
    const scoreOrganizacao = organizacaoFinanceira === 'sim' ? 10 : 
                           organizacaoFinanceira === 'mais_ou_menos' ? 5 : 0;
    const scoreClareza = clarezaSituacao === 'totalmente' ? 10 :
                        clarezaSituacao === 'parcialmente' ? 5 : 0;
    const scoreSeguranca = segurancaFuturo || 0;
    
    const scoreTotal = (scoreControle + scoreAnsiedade + scoreOrganizacao + scoreClareza + scoreSeguranca) / 5;
    
    // Define perfil baseado no score
    let perfil = 'iniciante';
    let descricao = 'Você está começando sua jornada de organização financeira';
    let cor = '#f59e0b'; // amarelo
    
    if (scoreTotal >= 8) {
      perfil = 'equilibrado';
      descricao = 'Você demonstra um bom equilíbrio emocional com o dinheiro';
      cor = '#10b981'; // verde
    } else if (scoreTotal >= 6) {
      perfil = 'desenvolvendo';
      descricao = 'Você está no caminho certo para conquistar equilíbrio financeiro';
      cor = '#3b82f6'; // azul
    } else if (scoreTotal >= 4) {
      perfil = 'atencao';
      descricao = 'Alguns pontos precisam de atenção para melhorar seu bem-estar financeiro';
      cor = '#f59e0b'; // amarelo
    } else {
      perfil = 'transformacao';
      descricao = 'É hora de uma transformação profunda na sua relação com o dinheiro';
      cor = '#ef4444'; // vermelho
    }
    
    return {
      perfil,
      descricao,
      cor,
      scoreTotal: Math.round(scoreTotal),
      scores: {
        controle: scoreControle,
        ansiedade: scoreAnsiedade,
        organizacao: scoreOrganizacao,
        clareza: scoreClareza,
        seguranca: scoreSeguranca
      }
    };
  }, [percepcao, validarPreenchimento]);
  
  // Gera insights baseados nas respostas
  const gerarInsights = useCallback(() => {
    if (!validarPreenchimento()) {
      return [];
    }
    
    const insights = [];
    const { 
      controleFinanceiro, 
      ansiedadeDinheiro, 
      organizacaoFinanceira,
      clarezaSituacao,
      segurancaFuturo 
    } = percepcao;
    
    // Insights baseados no controle
    if (controleFinanceiro <= 3) {
      insights.push({
        tipo: 'atencao',
        titulo: 'Foco no controle',
        mensagem: 'Vamos trabalhar juntos para você sentir mais controle sobre seu dinheiro.',
        icone: '🎯'
      });
    } else if (controleFinanceiro >= 8) {
      insights.push({
        tipo: 'positivo',
        titulo: 'Ótimo controle!',
        mensagem: 'Você já demonstra um bom senso de controle financeiro.',
        icone: '💪'
      });
    }
    
    // Insights baseados na ansiedade
    if (ansiedadeDinheiro >= 7) {
      insights.push({
        tipo: 'atencao',
        titulo: 'Reduzindo a ansiedade',
        mensagem: 'Vamos te ajudar a transformar ansiedade em tranquilidade financeira.',
        icone: '🧘‍♀️'
      });
    } else if (ansiedadeDinheiro <= 3) {
      insights.push({
        tipo: 'positivo',
        titulo: 'Mente tranquila',
        mensagem: 'Que ótimo que o dinheiro não te causa ansiedade!',
        icone: '😌'
      });
    }
    
    // Insights baseados na organização
    if (organizacaoFinanceira === 'nao') {
      insights.push({
        tipo: 'oportunidade',
        titulo: 'Organização é poder',
        mensagem: 'A organização será sua maior aliada na transformação financeira.',
        icone: '📊'
      });
    } else if (organizacaoFinanceira === 'sim') {
      insights.push({
        tipo: 'positivo',
        titulo: 'Organização em dia',
        mensagem: 'Sua organização é um ponto forte! Vamos potencializar isso.',
        icone: '✨'
      });
    }
    
    // Insights baseados na clareza
    if (clarezaSituacao === 'nada_claro') {
      insights.push({
        tipo: 'oportunidade',
        titulo: 'Clareza é libertação',
        mensagem: 'Vamos trazer total clareza sobre sua situação financeira.',
        icone: '🔍'
      });
    }
    
    // Insights baseados na segurança futura
    if (segurancaFuturo <= 4) {
      insights.push({
        tipo: 'motivacao',
        titulo: 'Construindo segurança',
        mensagem: 'Juntos vamos construir a segurança financeira que você merece.',
        icone: '🏗️'
      });
    }
    
    return insights;
  }, [percepcao, validarPreenchimento]);
  
  // Prepara dados para salvamento (formato compatível com backend)
  const prepararParaSalvamento = useCallback(() => {
    return {
      percepcao_financeira: {
        controle_financeiro: percepcao.controleFinanceiro,
        ansiedade_dinheiro: percepcao.ansiedadeDinheiro,
        organizacao_financeira: percepcao.organizacaoFinanceira,
        clareza_situacao: percepcao.clarezaSituacao,
        seguranca_futuro: percepcao.segurancaFuturo,
        data_preenchimento: new Date().toISOString(),
        analise: analisarPerfilEmocional()
      }
    };
  }, [percepcao, analisarPerfilEmocional]);
  
  return {
    // Estado
    percepcao,
    
    // Ações
    setPercepcao,
    atualizarCampo,
    atualizarPercepcao,
    resetarPercepcao,
    
    // Validações e cálculos
    validarPreenchimento,
    calcularProgresso,
    analisarPerfilEmocional,
    gerarInsights,
    prepararParaSalvamento,
    
    // Estado computado
    estaCompleto: validarPreenchimento(),
    progresso: calcularProgresso(),
    perfilEmocional: analisarPerfilEmocional(),
    insights: gerarInsights()
  };
};

export default usePercepcao;
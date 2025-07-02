import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Clock,
  TrendingUp,
  Target,
  Shield,
  Scissors,
  CreditCard,
  PiggyBank,
  Lightbulb,
  BarChart3,
  Award,
  Brain,
  MapPin,
  Construction,
  Zap
} from 'lucide-react';
import '../styles/TrilhaDashboard.css';

// Mapeamento de ícones para cada passo
const iconesPorPasso = {
  1: TrendingUp,
  2: MapPin,
  3: Scissors,
  4: CreditCard,
  5: PiggyBank,
  6: Shield,
  7: Target,
  8: Lightbulb,
  9: BarChart3,
  10: Brain
};

const TrilhaDashboard = ({ 
  passos = [], 
  passoAtual = null,
  onPassoClick = null,
  className = '',
  isCollapsed = false
}) => {
  const [hoveredPasso, setHoveredPasso] = useState(null);

  // Dados de exemplo para demonstração - Igual ao modelo da imagem
  const dadosExemplo = [
    { "id": "1", "ordem": 1, "titulo": "Bem-vindo ao iPoupei", "status": "concluido", "descricao": "Entenda sua situação financeira atual e identifique pontos de melhoria" },
    { "id": "2", "ordem": 2, "titulo": "Configure suas Contas", "status": "concluido", "descricao": "Organize suas contas, categorias e comece a rastrear suas transações" },
    { "id": "3", "ordem": 3, "titulo": "Primeira Transação", "status": "concluido", "descricao": "Registre sua primeira transação e entenda como funciona o sistema" },
    { "id": "4", "ordem": 4, "titulo": "Categorize seus Gastos", "status": "concluido", "descricao": "Organize seus gastos por categorias para melhor controle" },
    { "id": "5", "ordem": 5, "titulo": "Configure seus Cartões", "status": "concluido", "descricao": "Adicione seus cartões de crédito e configure as faturas" },
    { "id": "6", "ordem": 6, "titulo": "Defina um Orçamento", "status": "em_progresso", "descricao": "Crie limites de gastos por categoria e acompanhe seu desempenho" },
    { "id": "7", "ordem": 7, "titulo": "Analise seus Relatórios", "status": "nao_iniciado", "descricao": "Veja relatórios detalhados e entenda seus padrões de gastos" },
    { "id": "8", "ordem": 8, "titulo": "Configure Metas", "status": "nao_iniciado", "descricao": "Defina objetivos financeiros claros e trace planos para alcançá-los" },
    { "id": "9", "ordem": 9, "titulo": "Explore Investimentos", "status": "nao_iniciado", "descricao": "Descubra opções de investimento e faça seu dinheiro trabalhar por você" },
    { "id": "10", "ordem": 10, "titulo": "Torne-se um Expert", "status": "nao_iniciado", "descricao": "Desenvolva mentalidade de longo prazo e disciplina para crescimento sustentável" }
  ];

  const dadosParaUsar = passos.length > 0 ? passos : dadosExemplo;

  // Calcular progresso
  const { progressoPercentual, passosCompletos, totalPassos } = useMemo(() => {
    if (dadosParaUsar.length === 0) return { progressoPercentual: 0, passosCompletos: 0, totalPassos: 0 };
    
    const total = dadosParaUsar.length;
    const completos = dadosParaUsar.filter(p => p.status === 'concluido').length;
    const emProgresso = dadosParaUsar.filter(p => p.status === 'em_progresso').length;
    
    // Cada passo completo = 100%, passo em progresso = 50%
    const progressoTotal = (completos + emProgresso * 0.5) / total;
    
    // Ajustar para a linha (considerando que a linha vai de centro a centro dos círculos)
    const percentual = Math.min(progressoTotal * 85, 85); // Máximo 85% para não passar do último círculo
    
    return {
      progressoPercentual: percentual,
      passosCompletos: completos,
      totalPassos: total
    };
  }, [dadosParaUsar]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'concluido':
        return '✓';
      case 'em_progresso':
        return '!';
      default:
        return '○';
    }
  };

  const isPassoAtual = (passoId) => {
    return passoAtual === passoId;
  };

  const handlePassoClick = (passo) => {
    console.log('Passo clicado:', passo);
    // Não executa ação real - apenas mostra que está em desenvolvimento
    if (onPassoClick) {
      onPassoClick(passo);
    }
  };

  // Calcular XP disponível (exemplo baseado nos passos não concluídos)
  const xpDisponivel = 300;

  return (
      <div className={`trilha-dashboard ${isCollapsed ? 'trilha-colapsada' : ''} ${className}`}>
      {/* Badge "Em Breve" */}
      <div className="trilha-overlay-em-breve">
        <div className="trilha-preview-content">    
        <Construction size={14} />
        <span>Em Desenvolvimento</span>
        
        <Zap size={12} />
          </div>
      </div>

      {/* Overlay semi-transparente */}
      <div className="trilha-overlay-em-breve">
        <div className="trilha-preview-content">
          <div className="trilha-preview-icon">
            🚀
          </div>
          <h3 className="trilha-preview-titulo">
            Trilha de Aprendizagem em Breve!
          </h3>
          <p className="trilha-preview-descricao">
            Estamos preparando uma experiência incrível de aprendizagem gamificada para você dominar suas finanças passo a passo.
          </p>
          <div className="trilha-preview-features">
            <div className="trilha-preview-feature">
              <span className="trilha-preview-feature-icon">🎯</span>
              <span>Sistema de XP e Níveis</span>
            </div>
            <div className="trilha-preview-feature">
              <span className="trilha-preview-feature-icon">🏆</span>
              <span>Conquistas e Badges</span>
            </div>
            <div className="trilha-preview-feature">
              <span className="trilha-preview-feature-icon">📚</span>
              <span>Conteúdo Educativo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cabeçalho da Trilha (com opacity reduzida) */}
      <div className="trilha-header">
        <div className="trilha-title-section">
          <h2 className="trilha-title">
            Trilha de Aprendizagem
          </h2>
          <div className="trilha-nivel-pill">
            Nível 7
          </div>
        </div>
        
        <div className="trilha-info-section">
          <div className="trilha-progresso-texto">
            {passosCompletos} de {totalPassos} etapas concluídas
          </div>
          <div className="trilha-xp-badge">
            +{xpDisponivel} XP Disponível
          </div>
        </div>
      </div>

      {/* Trilha Horizontal */}
      <div className="trilha-horizontal-container">
        {/* Linha de progresso */}
        <div className="trilha-linha-progresso">
          <div 
            className="trilha-linha-progresso-fill"
            style={{ width: `${progressoPercentual}%` }}
          />
        </div>

        {/* Passos */}
        {dadosParaUsar.map((passo, index) => {
          const IconePasso = iconesPorPasso[passo.ordem] || TrendingUp;
          const isAtual = isPassoAtual(passo.id);

          return (
            <div 
              key={passo.id}
              className={`trilha-passo ${isAtual ? 'atual' : ''}`}
              onMouseEnter={() => setHoveredPasso(passo.id)}
              onMouseLeave={() => setHoveredPasso(null)}
              onClick={() => handlePassoClick(passo)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handlePassoClick(passo);
                }
              }}
            >
              {/* Indicador "Atual" - apenas ponto vermelho */}
              {isAtual && (
                <div className="trilha-passo-atual-indicator">
                </div>
              )}

              {/* Círculo do passo */}
              <div className={`trilha-passo-circulo ${passo.status}`}>
                {/* Ícone principal */}
                <IconePasso size={20} />
                
                {/* Número do passo */}
                <div className="trilha-passo-numero">
                  {passo.ordem}
                </div>

                {/* Ícone de status sobreposto */}
                {passo.status !== 'nao_iniciado' && (
                  <div className={`trilha-passo-status-icon ${passo.status}`}>
                    {getStatusIcon(passo.status)}
                  </div>
                )}
              </div>

              {/* Título do passo */}
              <h3 className="trilha-passo-titulo">
                {passo.titulo}
              </h3>

              {/* Tooltip */}
              <div className="trilha-tooltip">
                <div className="trilha-tooltip-titulo">
                  {passo.titulo}
                </div>
                <div className="trilha-tooltip-descricao">
                  {passo.descricao || "Descrição não disponível"}
                </div>
                <div className="trilha-tooltip-em-breve">
                  🚧 Funcionalidade em desenvolvimento
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TrilhaDashboard;
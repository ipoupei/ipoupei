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
  MapPin
} from 'lucide-react';

// Importar o CSS
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
  className = ''
}) => {
  const [hoveredPasso, setHoveredPasso] = useState(null);

  // Dados de exemplo para demonstração
  const dadosExemplo = [
    { "id": "1", "ordem": 1, "titulo": "Diagnóstico", "status": "concluido", "descricao": "Entenda sua situação financeira atual e identifique pontos de melhoria" },
    { "id": "2", "ordem": 2, "titulo": "Organização", "status": "concluido", "descricao": "Organize suas contas, categorias e comece a rastrear suas transações" },
    { "id": "3", "ordem": 3, "titulo": "Corte de Gastos", "status": "em_progresso", "descricao": "Identifique e elimine gastos desnecessários para liberar dinheiro" },
    { "id": "4", "ordem": 4, "titulo": "Fim das Dívidas", "status": "nao_iniciado", "descricao": "Desenvolva estratégias para quitar dívidas de forma inteligente" },
    { "id": "5", "ordem": 5, "titulo": "1º Reserva", "status": "nao_iniciado", "descricao": "Construa uma reserva para imprevistos e emergências" },
    { "id": "6", "ordem": 6, "titulo": "Blindagem", "status": "nao_iniciado", "descricao": "Proteja suas finanças com seguros e planejamento de riscos" },
    { "id": "7", "ordem": 7, "titulo": "Metas", "status": "nao_iniciado", "descricao": "Defina objetivos financeiros claros e trace planos para alcançá-los" },
    { "id": "8", "ordem": 8, "titulo": "Investimentos", "status": "nao_iniciado", "descricao": "Comece a investir seu dinheiro para fazer ele trabalhar por você" },
    { "id": "9", "ordem": 9, "titulo": "Diversificação", "status": "nao_iniciado", "descricao": "Diversifique seus investimentos para reduzir riscos e otimizar retornos" },
    { "id": "10", "ordem": 10, "titulo": "Eu Investidor", "status": "nao_iniciado", "descricao": "Desenvolva mentalidade de longo prazo e disciplina para crescimento sustentável" }
  ];

  const dadosParaUsar = passos.length > 0 ? passos : dadosExemplo;

  // Calcular estatísticas
  const estatisticas = useMemo(() => {
    const concluidos = dadosParaUsar.filter(p => p.status === 'concluido').length;
    const emProgresso = dadosParaUsar.filter(p => p.status === 'em_progresso').length;
    const pendentes = dadosParaUsar.filter(p => p.status === 'nao_iniciado').length;
    const progressoPercentual = Math.round(((concluidos + emProgresso * 0.5) / dadosParaUsar.length) * 100);
    
    return { concluidos, emProgresso, pendentes, progressoPercentual };
  }, [dadosParaUsar]);

  // Calcular largura da linha de progresso
  const progressoLinha = useMemo(() => {
    if (dadosParaUsar.length === 0) return 0;
    
    const totalPassos = dadosParaUsar.length;
    const passosCompletos = dadosParaUsar.filter(p => p.status === 'concluido').length;
    const passosEmProgresso = dadosParaUsar.filter(p => p.status === 'em_progresso').length;
    
    // Cada passo completo = 100%, passo em progresso = 50%
    const progressoTotal = (passosCompletos + passosEmProgresso * 0.5) / totalPassos;
    
    // Ajustar para a linha (considerando que a linha vai de centro a centro dos círculos)
    return Math.min(progressoTotal * 100, 85); // Máximo 85% para não passar do último círculo
  }, [dadosParaUsar]);

  const getStatusClass = (status) => {
    switch (status) {
      case 'concluido':
        return 'trilha-passo-concluido';
      case 'em_progresso':
        return 'trilha-passo-em-progresso';
      default:
        return 'trilha-passo-nao-iniciado';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'concluido':
        return CheckCircle2;
      case 'em_progresso':
        return Clock;
      default:
        return Circle;
    }
  };

  const getBadgeText = (status) => {
    switch (status) {
      case 'concluido':
        return { icon: '✅', text: 'Concluído', class: 'concluido' };
      case 'em_progresso':
        return { icon: '🔄', text: 'Em andamento', class: 'em-progresso' };
      default:
        return { icon: '⏳', text: 'Aguardando', class: 'nao-iniciado' };
    }
  };

  const isPassoAtual = (passoId) => {
    return passoAtual === passoId;
  };

  const handlePassoClick = (passo) => {
    console.log('Passo clicado:', passo);
    if (onPassoClick) {
      onPassoClick(passo);
    }
  };

  return (
    <div className={`trilha-container ${className}`}>
      {/* Header */}
      <div className="trilha-header">


      </div>

      {/* Trilha Horizontal */}
      <div className="trilha-horizontal">
        {/* Linha de progresso */}
        <div className="trilha-linha-progresso">
          <div 
            className="trilha-linha-progresso-fill"
            style={{ 
              width: `${progressoLinha}%`,
              background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 50%, #8b5cf6 100%)',
              height: '100%',
              borderRadius: '2px',
              transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 0 8px rgba(59, 130, 246, 0.4)'
            }}
          />
        </div>

        {/* Passos */}
        {dadosParaUsar.map((passo) => {
          const IconePasso = iconesPorPasso[passo.ordem] || TrendingUp;
          const StatusIcon = getStatusIcon(passo.status);
          const statusClass = getStatusClass(passo.status);
          const badge = getBadgeText(passo.status);
          const isAtual = isPassoAtual(passo.id);

          return (
            <div 
              key={passo.id}
              className={`trilha-passo ${isAtual ? 'trilha-passo-atual' : ''}`}
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
              {/* Indicador "Você está aqui" */}
              {isAtual && (
                <div className="trilha-passo-marcador">
                  📍 Você está aqui
                </div>
              )}

              {/* Círculo do passo */}
              <div className={`trilha-passo-circulo ${statusClass}`}>
                {/* Ícone principal */}
                <IconePasso size={24} className="trilha-passo-icone" />
                
                {/* Número do passo */}
                <span className="trilha-passo-numero">
                  {passo.ordem}
                </span>

                {/* Ícone de status (pequeno) */}
                {passo.status !== 'nao_iniciado' && (
                  <div className={`trilha-passo-status-icone ${passo.status}`}>
                    <StatusIcon size={12} />
                  </div>
                )}
              </div>

              {/* Conteúdo do passo */}
              <div className="trilha-passo-conteudo">
                <h3 className="trilha-passo-titulo">
                  {passo.titulo}
                </h3>
                
                <div className={`trilha-passo-badge ${badge.class}`}>
                  <span>{badge.icon}</span>
                  <span>{badge.text}</span>
                </div>
              </div>

              {/* Tooltip */}
              {hoveredPasso === passo.id && (
                <div className="trilha-tooltip">
                  <div className="trilha-tooltip-texto">
                    {passo.descricao || "Descrição não disponível"}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>


    </div>
  );
};

export default TrilhaDashboard;
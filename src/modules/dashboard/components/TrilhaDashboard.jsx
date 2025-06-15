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
    <div className={`${className}`} style={{ 
      padding: 'var(--spacing-xl) var(--spacing-lg)',
      background: 'var(--color-bg-primary)',
      borderRadius: 'var(--radius-xl)',
      border: 'var(--border-width-thin) solid var(--color-border-light)',
      boxShadow: 'var(--shadow-sm)',
      margin: 'var(--spacing-lg) 0',
      width: '100%'
    }}>
      {/* Trilha Horizontal */}
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        gap: 'var(--spacing-sm)' // Reduzido o gap
      }}>
        {/* Linha de progresso */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '30px',
          right: '30px',
          height: '3px',
          backgroundColor: 'var(--color-gray-200)',
          borderRadius: 'var(--radius-full)',
          zIndex: 1,
          transform: 'translateY(-50%)'
        }}>
          <div style={{
            width: `${progressoLinha}%`,
            height: '100%',
            background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 50%, #8b5cf6 100%)',
            borderRadius: 'var(--radius-full)',
            transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 0 4px rgba(59, 130, 246, 0.3)'
          }} />
        </div>

        {/* Passos */}
        {dadosParaUsar.map((passo, index) => {
          const IconePasso = iconesPorPasso[passo.ordem] || TrendingUp;
          const StatusIcon = getStatusIcon(passo.status);
          const isAtual = isPassoAtual(passo.id);

          return (
            <div 
              key={passo.id}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                cursor: 'pointer',
                zIndex: 10,
                flex: 1,
                maxWidth: '90px', // Aumentado de 80px
                transition: 'all var(--transition-normal)',
                padding: 'var(--spacing-xs)',
                borderRadius: 'var(--radius-md)',
                ...(hoveredPasso === passo.id && {
                  transform: 'translateY(-2px)',
                  background: 'var(--color-bg-secondary)',
                  boxShadow: 'var(--shadow-md)'
                })
              }}
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
              {/* Indicador "Atual" */}
              {isAtual && (
                <div style={{
                  position: 'absolute',
                  top: '-25px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'var(--gradient-primary)',
                  color: 'var(--color-text-white)',
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '10px',
                  fontWeight: 'var(--font-weight-bold)',
                  whiteSpace: 'nowrap',
                  boxShadow: 'var(--shadow-sm)',
                  zIndex: 20
                }}>
                  📍 Atual
                </div>
              )}

              {/* Círculo do passo */}
              <div style={{
                position: 'relative',
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: passo.status === 'concluido' 
                  ? 'var(--gradient-success)' 
                  : passo.status === 'em_progresso'
                  ? 'var(--gradient-primary)'
                  : 'var(--color-bg-secondary)',
                border: passo.status === 'nao_iniciado' 
                  ? '2px solid var(--color-border-medium)' 
                  : 'none',
                color: passo.status === 'nao_iniciado' 
                  ? 'var(--color-text-muted)' 
                  : 'var(--color-text-white)',
                boxShadow: passo.status !== 'nao_iniciado' 
                  ? 'var(--shadow-md)' 
                  : 'var(--shadow-sm)',
                transition: 'all var(--transition-normal)',
                ...(isAtual && {
                  border: '3px solid var(--color-primary)',
                  transform: 'scale(1.05)'
                })
              }}>
                {/* Ícone principal */}
                <IconePasso size={20} style={{ zIndex: 2 }} />
                
                {/* Número do passo */}
                <span style={{
                  position: 'absolute',
                  bottom: '-3px',
                  right: '-3px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: 'var(--color-bg-primary)',
                  color: 'var(--color-text-primary)',
                  fontSize: '9px',
                  fontWeight: 'var(--font-weight-bold)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--color-border-medium)',
                  zIndex: 3
                }}>
                  {passo.ordem}
                </span>

                {/* Ícone de status sobreposto */}
                {passo.status !== 'nao_iniciado' && (
                  <div style={{
                    position: 'absolute',
                    top: '-3px',
                    left: '-3px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: passo.status === 'concluido' 
                      ? 'var(--color-success)' 
                      : 'var(--color-warning)',
                    color: 'var(--color-text-white)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--color-bg-primary)',
                    zIndex: 3
                  }}>
                    <StatusIcon size={8} />
                  </div>
                )}
              </div>

              {/* Título do passo */}
              <h3 style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-text-primary)',
                margin: 0,
                textAlign: 'center',
                lineHeight: 'var(--line-height-tight)',
                maxWidth: '85px', // Aumentado
                height: '28px', // Altura fixa para 2 linhas
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                wordBreak: 'break-word',
                overflow: 'hidden'
              }}>
                {passo.titulo}
              </h3>

              {/* Tooltip melhorado */}
              {hoveredPasso === passo.id && (
                <div style={{
                  position: 'absolute',
                  top: '-80px', // Posição fixa acima
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'var(--color-gray-800)',
                  color: 'var(--color-text-white)',
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-xs)',
                  maxWidth: '220px',
                  minWidth: '180px',
                  textAlign: 'center',
                  lineHeight: 'var(--line-height-normal)',
                  zIndex: 9999,
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4)',
                  whiteSpace: 'normal',
                  pointerEvents: 'none',
                  opacity: 1,
                  visibility: 'visible',
                  ...(index <= 1 && {
                    left: '0',
                    transform: 'translateX(0)'
                  }),
                  ...(index >= dadosParaUsar.length - 2 && {
                    left: 'auto',
                    right: '0',
                    transform: 'translateX(0)'
                  })
                }}>
                  <div style={{
                    fontWeight: 'var(--font-weight-semibold)',
                    marginBottom: '6px',
                    color: 'var(--color-text-white)',
                    fontSize: 'var(--font-size-sm)'
                  }}>
                    {passo.titulo}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    opacity: 0.95,
                    color: 'var(--color-text-white)',
                    lineHeight: '1.4'
                  }}>
                    {passo.descricao || "Descrição não disponível"}
                  </div>
                  
                  {/* Seta do tooltip */}
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 0,
                    height: 0,
                    borderLeft: '8px solid transparent',
                    borderRight: '8px solid transparent',
                    borderTop: '8px solid var(--color-gray-800)',
                    ...(index <= 1 && {
                      left: '30px',
                      transform: 'translateX(0)'
                    }),
                    ...(index >= dadosParaUsar.length - 2 && {
                      left: 'auto',
                      right: '30px',
                      transform: 'translateX(0)'
                    })
                  }} />
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
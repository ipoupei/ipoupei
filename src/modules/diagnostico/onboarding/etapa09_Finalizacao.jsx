// src/modules/diagnostico/onboarding/etapa09_Finalizacao.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ArrowRight, CheckCircle, Trophy, Star, TrendingUp, Target, Gift, Sparkles, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@lib/supabaseClient';
import useAuth from '@modules/auth/hooks/useAuth';

// CSS refatorado
import '@modules/diagnostico/styles/DiagnosticoOnboarding.css';

const FinalizacaoEtapa = ({ 
  onContinuar, 
  etapaAtual = 9, 
  totalEtapas = 10,
  dadosExistentes = null,
  todosDados = {}
}) => {
  const [loading, setLoading] = useState(false);
  const [etapaAnimacao, setEtapaAnimacao] = useState(0);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Hooks necessários
  const navigate = useNavigate();
  const { user } = useAuth();

  // Animação sequencial de conclusão
  useEffect(() => {
    const timer1 = setTimeout(() => setEtapaAnimacao(1), 500);
    const timer2 = setTimeout(() => setEtapaAnimacao(2), 1500);
    const timer3 = setTimeout(() => setEtapaAnimacao(3), 2500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  // Calcular estatísticas do diagnóstico
  const estatisticasDiagnostico = {
    etapasCompletadas: Object.keys(todosDados).filter(key => 
      todosDados[key] && !todosDados[key].pulou
    ).length,
    temReceitas: todosDados.receitas?.temReceitas || false,
    temDespesasFixas: todosDados.despesas_fixas?.temDespesasFixas || false,
    temContas: todosDados.contas?.totalContas > 0 || false,
    temCartoes: todosDados.cartoes?.totalCartoes > 0 || false,
    situacaoFinanceira: todosDados.resumo_financeiro?.resumoCalculado?.situacao?.status || 'regular'
  };

  // Mensagem personalizada baseada na situação
  const getMensagemPersonalizada = () => {
    const { situacaoFinanceira } = estatisticasDiagnostico;
    
    switch (situacaoFinanceira) {
      case 'critica':
        return {
          titulo: 'Vamos juntos reorganizar suas finanças!',
          subtitulo: 'Identificamos pontos de atenção, mas com as ferramentas certas você pode reverter a situação.',
          icone: '💪',
          cor: 'warning'
        };
      case 'atencao':
        return {
          titulo: 'Você está no caminho certo!',
          subtitulo: 'Alguns ajustes e você terá uma situação financeira ainda mais sólida.',
          icone: '📈',
          cor: 'info'
        };
      case 'regular':
        return {
          titulo: 'Boa base financeira!',
          subtitulo: 'Com algumas otimizações, você pode alcançar seus objetivos mais rapidamente.',
          icone: '🎯',
          cor: 'success'
        };
      case 'boa':
        return {
          titulo: 'Parabéns pela organização!',
          subtitulo: 'Sua situação financeira está saudável. Agora é hora de investir e crescer!',
          icone: '🚀',
          cor: 'success'
        };
      default:
        return {
          titulo: 'Diagnóstico concluído!',
          subtitulo: 'Agora você tem uma visão completa da sua situação financeira.',
          icone: '✅',
          cor: 'success'
        };
    }
  };

  const mensagem = getMensagemPersonalizada();

  // Benefícios desbloqueados
  const beneficiosDesbloqueados = [
    {
      icone: '📊',
      titulo: 'Dashboard Personalizado',
      descricao: 'Acompanhe suas finanças em tempo real'
    },
    {
      icone: '🎯',
      titulo: 'Metas Inteligentes',
      descricao: 'Objetivos baseados no seu perfil'
    },
    {
      icone: '📈',
      titulo: 'Relatórios Detalhados',
      descricao: 'Análises profundas dos seus gastos'
    },
    {
      icone: '💡',
      titulo: 'Dicas Personalizadas',
      descricao: 'Sugestões específicas para você'
    },
    {
      icone: '🔔',
      titulo: 'Alertas Inteligentes',
      descricao: 'Notificações importantes sobre suas finanças'
    },
    {
      icone: '🏆',
      titulo: 'Sistema de Conquistas',
      descricao: 'Gamificação para manter você motivado'
    }
  ];

  const handleFinalizarDiagnostico = () => {
    setLoading(true);
    
    // Dados da finalização
    const dadosFinalizacao = {
      diagnosticoCompleto: true,
      estatisticas: estatisticasDiagnostico,
      finalizadoEm: new Date().toISOString(),
      proximosPassos: [
        'dashboard_personalizado',
        'configurar_metas',
        'explorar_ferramentas'
      ]
    };
    
    console.log('🎉 Diagnóstico finalizado com sucesso!', dadosFinalizacao);
    
    // Simular processamento
    setTimeout(() => {
      onContinuar(dadosFinalizacao);
      setLoading(false);
    }, 2000);
  };

  // Função para refazer diagnóstico
  const handleRefazerDiagnostico = async () => {
    setShowResetModal(true);
  };

  const confirmarReset = async () => {
    try {
      setResetLoading(true);
      console.log('🔄 Iniciando reset do diagnóstico...');

      // Atualizar etapa no banco para 0
      const { error } = await supabase
        .from('perfil_usuario')
        .update({ diagnostico_etapa_atual: 0 })
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Limpar localStorage
      console.log('🧹 Limpando dados locais...');
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('diagnostico')) {
          localStorage.removeItem(key);
          console.log(`🗑️ Removido: ${key}`);
        }
      });
      
      console.log('✅ Reset concluído - redirecionando...');
      
      // ✅ CORREÇÃO: Usar window.location para garantir reset completo
      window.location.href = '/diagnostico';
      
    } catch (error) {
      console.error('❌ Erro ao resetar diagnóstico:', error);
      alert('Erro ao resetar o diagnóstico. Tente novamente.');
      setResetLoading(false);
      setShowResetModal(false);
    }
  };

  const progressoPercentual = 100; // 100% completo

  return (
    <div className="diagnostico-container">
      
      {/* Header Completo */}
      <div className="diagnostico-header">
        <div className="header-row">
          <div className="header-title">Diagnóstico Financeiro</div>
          <div className="header-progress">
            Completo! • {progressoPercentual}%
          </div>
        </div>

        <div className="progress-bar">
          <div 
            className="progress-fill completo"
            style={{ width: `${progressoPercentual}%` }}
          />
        </div>

        <div className="steps-row">
          {Array.from({ length: totalEtapas }, (_, i) => (
            <div key={i + 1} className="step completed">
              <div className="step-circle">✓</div>
              <div className="step-label">Etapa {i + 1}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="diagnostico-main-finalizacao">
        
        {/* Celebração Principal */}
        <div className={`celebracao-principal ${etapaAnimacao >= 1 ? 'visible' : ''}`}>
          <div className="celebracao-icon">
            <Trophy size={64} />
            <div className="sparkles">
              <Sparkles className="sparkle sparkle-1" />
              <Sparkles className="sparkle sparkle-2" />
              <Sparkles className="sparkle sparkle-3" />
            </div>
          </div>
          <h1 className="celebracao-titulo">Parabéns!</h1>
          <p className="celebracao-subtitulo">Você concluiu seu diagnóstico financeiro!</p>
        </div>

        {/* Mensagem Personalizada */}
        <div className={`mensagem-personalizada ${etapaAnimacao >= 2 ? 'visible' : ''}`}>
          <div className={`mensagem-card ${mensagem.cor}`}>
            <div className="mensagem-icon">{mensagem.icone}</div>
            <div className="mensagem-content">
              <h2>{mensagem.titulo}</h2>
              <p>{mensagem.subtitulo}</p>
            </div>
          </div>
        </div>

        {/* Estatísticas de Conquista */}
        <div className={`estatisticas-conquista ${etapaAnimacao >= 3 ? 'visible' : ''}`}>
          <h3>📊 Seu progresso no diagnóstico:</h3>
          <div className="conquistas-grid">
            
            <div className={`conquista-item ${estatisticasDiagnostico.etapasCompletadas >= 8 ? 'conquistado' : ''}`}>
              <div className="conquista-icon">
                <CheckCircle size={20} />
              </div>
              <div className="conquista-info">
                <h4>Diagnóstico Completo</h4>
                <p>{estatisticasDiagnostico.etapasCompletadas}/9 etapas concluídas</p>
              </div>
            </div>

            <div className={`conquista-item ${estatisticasDiagnostico.temReceitas ? 'conquistado' : ''}`}>
              <div className="conquista-icon">
                <TrendingUp size={20} />
              </div>
              <div className="conquista-info">
                <h4>Receitas Mapeadas</h4>
                <p>Fontes de renda cadastradas</p>
              </div>
            </div>

            <div className={`conquista-item ${estatisticasDiagnostico.temDespesasFixas ? 'conquistado' : ''}`}>
              <div className="conquista-icon">
                <Target size={20} />
              </div>
              <div className="conquista-info">
                <h4>Gastos Organizados</h4>
                <p>Despesas fixas identificadas</p>
              </div>
            </div>

            <div className={`conquista-item ${estatisticasDiagnostico.temContas ? 'conquistado' : ''}`}>
              <div className="conquista-icon">
                <Star size={20} />
              </div>
              <div className="conquista-info">
                <h4>Patrimônio Registrado</h4>
                <p>Contas e cartões cadastrados</p>
              </div>
            </div>

          </div>
        </div>

        {/* Benefícios Desbloqueados */}
        <div className="beneficios-desbloqueados">
          <h3>🎁 Benefícios desbloqueados para você:</h3>
          <div className="beneficios-grid">
            {beneficiosDesbloqueados.map((beneficio, index) => (
              <div 
                key={index} 
                className="beneficio-item"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="beneficio-icon">{beneficio.icone}</div>
                <div className="beneficio-info">
                  <h4>{beneficio.titulo}</h4>
                  <p>{beneficio.descricao}</p>
                </div>
                <div className="beneficio-badge">
                  <Gift size={12} />
                  Novo!
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Próximos Passos */}
        <div className="proximos-passos-final">
          <h3>🚀 O que acontece agora:</h3>
          <div className="passos-timeline">
            
            <div className="passo-timeline">
              <div className="passo-numero">1</div>
              <div className="passo-linha"></div>
              <div className="passo-content">
                <h4>Acesse seu Dashboard</h4>
                <p>Sua central de controle financeiro personalizada já está pronta!</p>
              </div>
            </div>

            <div className="passo-timeline">
              <div className="passo-numero">2</div>
              <div className="passo-linha"></div>
              <div className="passo-content">
                <h4>Configure suas Metas</h4>
                <p>Defina objetivos baseados no seu perfil e acompanhe o progresso.</p>
              </div>
            </div>

            <div className="passo-timeline">
              <div className="passo-numero">3</div>
              <div className="passo-linha"></div>
              <div className="passo-content">
                <h4>Explore as Ferramentas</h4>
                <p>Descubra relatórios, alertas e dicas personalizadas para você.</p>
              </div>
            </div>

            <div className="passo-timeline final">
              <div className="passo-numero">
                <Trophy size={16} />
              </div>
              <div className="passo-content">
                <h4>Alcance seus Objetivos</h4>
                <p>Com o iPoupei, você tem tudo para conquistar a liberdade financeira!</p>
              </div>
            </div>

          </div>
        </div>

        {/* Motivação Final */}
        <div className="motivacao-final">
          <div className="motivacao-content">
            <h3>💪 Você deu o primeiro passo mais importante!</h3>
            <p>
              Conhecer sua situação financeira é fundamental para tomar decisões inteligentes. 
              Agora você tem todas as ferramentas necessárias para transformar seus sonhos em realidade.
            </p>
            <div className="motivacao-quote">
              <span className="quote-icon">"</span>
              <em>O sucesso financeiro não é sobre quanto você ganha, mas sobre como você gerencia o que tem.</em>
              <span className="quote-icon">"</span>
            </div>
          </div>
        </div>

        {/* Estatísticas Finais */}
        <div className="estatisticas-finais">
          <div className="stat-final">
            <div className="stat-numero">{estatisticasDiagnostico.etapasCompletadas}</div>
            <div className="stat-label">Etapas Completadas</div>
          </div>
          <div className="stat-final">
            <div className="stat-numero">100%</div>
            <div className="stat-label">Diagnóstico Concluído</div>
          </div>
          <div className="stat-final">
            <div className="stat-numero">6</div>
            <div className="stat-label">Ferramentas Desbloqueadas</div>
          </div>
        </div>

      </div>

              {/* Navegação Final */}
      <div className="navigation final">
        <div className="nav-left">
          <button
            onClick={handleRefazerDiagnostico}
            className="btn-primary"
          >
            <RotateCcw size={16} />
            Refazer Diagnóstico
          </button>
        </div>
        
        <div className="nav-right">
          <button
            onClick={handleFinalizarDiagnostico}
            disabled={loading}
            className="btn-final"
          >
            {loading ? (
              <>
                <div className="loading-spinner"></div>
                Finalizando diagnóstico...
              </>
            ) : (
              <>
                <Trophy size={16} />
                Ir para meu Dashboard
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>

      {/* ✅ MODAL DE CONFIRMAÇÃO PERSONALIZADO */}
      {showResetModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <div className="modal-icon warning">
                <RotateCcw size={32} />
              </div>
              <h2>Refazer Diagnóstico</h2>
            </div>
            
            <div className="modal-content">
              <p>Tem certeza que deseja refazer o diagnóstico?</p>
              
              <div className="warning-list">
                <h4>Isso irá:</h4>
                <ul>
                  <li>🔄 Resetar todas as suas respostas</li>
                  <li>⏪ Voltar para a primeira etapa</li>
                  <li>🗑️ Limpar o progresso atual</li>
                </ul>
              </div>
              
              <div className="warning-note">
                <strong>⚠️ Esta ação não pode ser desfeita.</strong>
              </div>
            </div>
            
            <div className="modal-footer">
              <button
                onClick={() => setShowResetModal(false)}
                className="btn-cancel"
                disabled={resetLoading}
              >
                Cancelar
              </button>
              <button
                onClick={confirmarReset}
                className="btn-confirm-reset"
                disabled={resetLoading}
              >
                {resetLoading ? (
                  <>
                    <div className="loading-spinner small"></div>
                    Resetando...
                  </>
                ) : (
                  <>
                    <RotateCcw size={16} />
                    Sim, refazer diagnóstico
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

FinalizacaoEtapa.propTypes = {
  onContinuar: PropTypes.func.isRequired,
  etapaAtual: PropTypes.number,
  totalEtapas: PropTypes.number,
  dadosExistentes: PropTypes.object,
  todosDados: PropTypes.object
};

export default FinalizacaoEtapa;
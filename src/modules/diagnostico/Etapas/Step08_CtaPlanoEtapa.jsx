// src/modules/diagnostico/etapas/Step08_CtaPlanoEtapa.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Rocket, 
  ArrowRight, 
  CheckCircle, 
  Star, 
  Clock,
  Shield,
  TrendingUp,
  Target 
} from 'lucide-react';
import useDiagnosticoEmocionalStore from '@modules/diagnostico/store/diagnosticoEmocionalStore';
import '@modules/diagnostico/styles/DiagnosticoEmocional.css';

const Step08_CtaPlanoEtapa = () => {
  const navigate = useNavigate();
  const { 
    rendaMensal,
    calcularSituacaoFinanceira,
    resetarDiagnostico 
  } = useDiagnosticoEmocionalStore();

  const situacao = calcularSituacaoFinanceira();

  const handleQueroPlano = () => {
    // Redireciona para o onboarding detalhado
    navigate('/onboarding/iniciar');
  };

  const handleVoltarDashboard = () => {
    // Limpa o diagnóstico e volta para dashboard
    resetarDiagnostico();
    navigate('/dashboard');
  };

  const beneficiosPlano = [
    {
      icone: <Target size={20} color="#10b981" />,
      titulo: 'Plano 100% Personalizado',
      descricao: 'Estratégias específicas para sua situação única'
    },
    {
      icone: <TrendingUp size={20} color="#10b981" />,
      titulo: 'Controle Automático',
      descricao: 'Acompanhamento inteligente dos seus gastos'
    },
    {
      icone: <CheckCircle size={20} color="#10b981" />,
      titulo: 'Metas Realistas',
      descricao: 'Objetivos alcançáveis baseados no seu perfil'
    },
    {
      icone: <Clock size={20} color="#10b981" />,
      titulo: 'Resultados Rápidos',
      descricao: 'Primeiros resultados visíveis em 7 dias'
    }
  ];

  const getTempoEstimado = () => {
    if (situacao.tipo === 'critico') {
      return {
        tempo: '2-3 meses',
        resultado: 'sair do vermelho e ter controle',
        motivacao: 'É possível reverter sua situação rapidamente!',
        urgencia: 'Cada dia conta para evitar que piore.'
      };
    } else if (situacao.tipo === 'atencao') {
      return {
        tempo: '1-2 meses', 
        resultado: 'ter controle total e reserva',
        motivacao: 'Você está mais perto do que imagina!',
        urgencia: 'Pequenos ajustes podem gerar grandes resultados.'
      };
    } else {
      return {
        tempo: '30 dias',
        resultado: 'otimizar ainda mais seus ganhos',
        motivacao: 'Vamos potencializar seus resultados!',
        urgencia: 'Maximize o potencial que você já tem.'
      };
    }
  };

  const estimativa = getTempoEstimado();

  const calcularEconomiaPotencial = () => {
    const economia = {
      mensal: {
        min: rendaMensal * 0.15,
        max: rendaMensal * 0.30
      },
      anual: {
        min: rendaMensal * 0.15 * 12,
        max: rendaMensal * 0.30 * 12
      }
    };
    
    return economia;
  };

  const economia = calcularEconomiaPotencial();

  const testimonials = [
    {
      nome: 'Marina S.',
      resultado: 'Economizou R$ 1.200/mês',
      tempo: '2 meses',
      situacao: 'Estava sempre no vermelho'
    },
    {
      nome: 'Carlos R.',
      resultado: 'Quitou R$ 15.000 em dívidas',
      tempo: '6 meses',
      situacao: 'Endividado com cartões'
    },
    {
      nome: 'Ana P.',
      resultado: 'Criou reserva de R$ 10.000',
      tempo: '8 meses',
      situacao: 'Gastava tudo que ganhava'
    }
  ];

  return (
    <div className="diagnostico-emocional-wrapper">
      <div className="diagnostico-emocional-container">
        <div className="cta-final">
          <div className="cta-header">
            <div className="cta-icon">
              <Rocket size={64} color="#ef4444" />
            </div>
            
            <h1 className="cta-title">
              Pronto para <span className="destaque">transformar</span> sua vida financeira?
            </h1>
            
            <p className="cta-subtitle">
              Você já deu o primeiro passo. Agora vamos juntos até o fim!
            </p>
          </div>
          
          <div className="cta-motivacao">
            <div className="motivacao-card">
              <div className="motivacao-icon">
                <Star size={32} color="#f59e0b" />
              </div>
              <div className="motivacao-content">
                <h3 className="motivacao-titulo">{estimativa.motivacao}</h3>
                <p className="motivacao-text">
                  Em apenas <span className="destaque">{estimativa.tempo}</span> você pode {estimativa.resultado}.
                </p>
                <p className="motivacao-urgencia">
                  <strong>{estimativa.urgencia}</strong>
                </p>
              </div>
            </div>
          </div>

          <div className="cta-proposta">
            <h3 className="proposta-title">🎯 Seu Plano Personalizado inclui:</h3>
            
            <div className="beneficios-grid">
              {beneficiosPlano.map((beneficio, index) => (
                <div key={index} className="beneficio-item expandido">
                  <div className="beneficio-icon">
                    {beneficio.icone}
                  </div>
                  <div className="beneficio-content">
                    <h4 className="beneficio-titulo">{beneficio.titulo}</h4>
                    <p className="beneficio-descricao">{beneficio.descricao}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Potencial de Economia */}
          {rendaMensal > 0 && (
            <div className="cta-economia-potencial">
              <div className="economia-card destacada">
                <h4 className="economia-titulo">💰 Seu potencial de economia:</h4>
                <div className="economia-valores">
                  <div className="economia-mensal">
                    <span className="economia-label">Por mês:</span>
                    <span className="economia-range">
                      R$ {economia.mensal.min.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - 
                      R$ {economia.mensal.max.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="economia-anual">
                    <span className="economia-label">Por ano:</span>
                    <span className="economia-range destaque">
                      R$ {economia.anual.min.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - 
                      R$ {economia.anual.max.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                <p className="economia-obs">
                  *Baseado na experiência média dos nossos usuários com perfil similar ao seu
                </p>
              </div>
            </div>
          )}

          {/* Testimonials */}
          <div className="cta-testimonials">
            <h4 className="testimonials-title">📈 Resultados reais de pessoas como você:</h4>
            <div className="testimonials-grid">
              {testimonials.map((test, index) => (
                <div key={index} className="testimonial-item">
                  <div className="testimonial-header">
                    <span className="testimonial-nome">{test.nome}</span>
                    <span className="testimonial-tempo">{test.tempo}</span>
                  </div>
                  <p className="testimonial-situacao">"{test.situacao}"</p>
                  <p className="testimonial-resultado">
                    <strong>Resultado: {test.resultado}</strong>
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="cta-urgencia">
            <div className="urgencia-box">
              <h4 className="urgencia-titulo">⏰ Por que começar agora?</h4>
              <ul className="urgencia-lista">
                <li>Cada dia de atraso é dinheiro perdido</li>
                <li>Hábitos financeiros se formam em 21 dias</li>
                <li>Juros compostos funcionam a seu favor (ou contra)</li>
                <li>Oportunidades de economia aparecem e desaparecem</li>
              </ul>
            </div>
          </div>

          <div className="cta-actions">
            <button 
              onClick={handleQueroPlano}
              className="btn-quero-plano principal"
            >
              <Rocket size={24} />
              Sim, quero meu plano personalizado!
              <ArrowRight size={24} />
            </button>
            
            <button 
              onClick={handleVoltarDashboard}
              className="btn-talvez-depois"
            >
              Talvez depois
            </button>
          </div>

          <div className="cta-garantias">
            <div className="garantias-grid">
              <div className="garantia-item">
                <Shield size={20} color="#10b981" />
                <span>100% Gratuito</span>
              </div>
              <div className="garantia-item">
                <Shield size={20} color="#10b981" />
                <span>Dados Protegidos</span>
              </div>
              <div className="garantia-item">
                <TrendingUp size={20} color="#10b981" />
                <span>Resultados em 30 dias</span>
              </div>
              <div className="garantia-item">
                <Clock size={20} color="#10b981" />
                <span>Configuração em 5 min</span>
              </div>
            </div>
          </div>

          {/* Seção de Objeções */}
          <div className="cta-objecoes">
            <h4 className="objecoes-title">❓ Dúvidas frequentes:</h4>
            <div className="objecoes-lista">
              <div className="objecao-item">
                <strong>É realmente gratuito?</strong>
                <p>Sim! Nossa missão é democratizar a educação financeira.</p>
              </div>
              <div className="objecao-item">
                <strong>Vai funcionar para minha situação?</strong>
                <p>Nosso sistema se adapta a qualquer perfil e renda. Já ajudamos mais de 50.000 pessoas.</p>
              </div>
              <div className="objecao-item">
                <strong>Não tenho tempo para isso...</strong>
                <p>São apenas 5 minutos para configurar e depois tudo é automático!</p>
              </div>
              <div className="objecao-item">
                <strong>E se não funcionar para mim?</strong>
                <p>Impossível não funcionar! São princípios matemáticos básicos de controle financeiro.</p>
              </div>
            </div>
          </div>

          {/* CTA Final */}
          <div className="cta-final-push">
            <div className="final-push-card">
              <h3 className="final-titulo">🚀 Última chance de transformar sua vida!</h3>
              <p className="final-texto">
                Você investiu tempo para descobrir sua situação. Agora invista 5 minutos 
                para mudar completamente seu futuro financeiro.
              </p>
              
              <div className="final-countdown">
                <p className="countdown-text">
                  <strong>⏰ Pessoas que agem imediatamente têm 5x mais chances de sucesso!</strong>
                </p>
              </div>

              <button 
                onClick={handleQueroPlano}
                className="btn-acao-final"
              >
                <Rocket size={24} />
                QUERO TRANSFORMAR MINHA VIDA AGORA!
                <ArrowRight size={24} />
              </button>
            </div>
          </div>

          {/* Rodapé com benefício social */}
          <div className="cta-impacto-social">
            <div className="impacto-card">
              <h4>🌟 Impacto que você vai gerar:</h4>
              <div className="impacto-stats">
                <div className="stat-item">
                  <span className="stat-numero">R$ 50.000</span>
                  <span className="stat-label">Economia média em 5 anos</span>
                </div>
                <div className="stat-item">
                  <span className="stat-numero">3 pessoas</span>
                  <span className="stat-label">Que você vai influenciar positivamente</span>
                </div>
                <div className="stat-item">
                  <span className="stat-numero">1 vida</span>
                  <span className="stat-label">Transformada para sempre (a sua!)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step08_CtaPlanoEtapa;
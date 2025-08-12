import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '@modules/auth/hooks/useAuth';
import logoImage from '@assets/logo.png';
import '../styles/LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, initialized } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  // Redireciona se já estiver logado
  useEffect(() => {
    if (initialized && isAuthenticated) {
      navigate('/app/dashboard');
    }
  }, [initialized, isAuthenticated, navigate]);

  // Header scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll suave para seções
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  // Navegação
  const goToLogin = () => navigate('/login');
  const goToSignup = () => navigate('/login');

  return (
    <div className="landing">
      {/* HEADER */}
      <header className={`header ${scrolled ? 'header--scrolled' : ''}`}>
        <div className="container">
          <div className="header__content">
            <div className="logo">
              <img src={logoImage} alt="iPoupei" className="logo__image" />
            </div>

            <nav className="nav">
              <button onClick={() => scrollTo('como-funciona')} className="nav__link">
                Como Funciona
              </button>
              <button onClick={() => scrollTo('para-quem')} className="nav__link">
                Para Quem
              </button>
              <button onClick={() => scrollTo('seguranca')} className="nav__link">
                Segurança
              </button>
            </nav>

            <div className="header__actions">
              <button onClick={goToLogin} className="btn-text">
                Entrar
              </button>
              <button onClick={goToSignup} className="btn btn--primary">
                Comece Agora
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="hero">
        <div className="container">
          <div className="hero__content">
            <div className="hero__text">
              <h1 className="hero__title">
                Suas finanças no controle.<br />
                Sua vida no rumo certo.
              </h1>
              <p className="hero__subtitle">
                Você não nasceu pra viver no limite.<br />
                O iPoupei te ajuda a virar o jogo com passos simples, direto ao ponto.
              </p>
              <button onClick={goToSignup} className="btn btn--hero">
                <span>🚀</span>
                Comece agora gratuitamente
              </button>
            </div>

            <div className="hero__image">
              <div className="phone">
                <div className="phone__screen">
                  <div className="phone__icon">📱</div>
                  <h3>iPoupei App</h3>
                  <p>Suas finanças organizadas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUIZ */}
      <Quiz onComplete={goToSignup} />

      {/* SOBRE */}
      <section className="about">
        <div className="container">
          <p className="about__text">
            O iPoupei é a sua ferramenta de apoio para sair do sufoco financeiro.<br />
            Aqui você organiza suas contas, aprende o que ninguém te ensinou sobre dinheiro<br />
            e dá os primeiros passos rumo à liberdade financeira.
          </p>

          <div className="features">
            <Feature 
              icon="📊" 
              title="Organização" 
              description="Organize suas contas sem planilhas complicadas" 
            />
            <Feature 
              icon="🎯" 
              title="Diagnóstico" 
              description="Entenda sua situação financeira atual" 
            />
            <Feature 
              icon="🎓" 
              title="Educação" 
              description="Aprenda no seu ritmo, sem economês" 
            />
            <Feature 
              icon="💎" 
              title="Investimentos" 
              description="Comece a investir quando estiver pronto" 
            />
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="steps" id="como-funciona">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Como Funciona</h2>
            <p className="section-subtitle">Sua jornada em 4 passos simples</p>
          </div>

          <div className="steps__grid">
            <Step 
              number="1"
              title="Diagnóstico Financeiro"
              description="Você responde um questionário e o app entende seu perfil, sua realidade e seus desafios."
            />
            <Step 
              number="2"
              title="Organização do Caos"
              description="Você cadastra suas contas, receitas e despesas com facilidade. Aqui não tem planilha chata."
            />
            <Step 
              number="3"
              title="Educação Gamificada"
              description="Você aprende o que importa, no seu ritmo, enquanto ganha XP e desbloqueia conquistas."
            />
            <Step 
              number="4"
              title="Investimentos sem Medo"
              description="Quando estiver pronto, vai começar a investir com clareza, sem complicação."
            />
          </div>
        </div>
      </section>

      {/* PARA QUEM */}
      <section className="target" id="para-quem">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Para quem é o iPoupei?</h2>
            <p className="section-subtitle">O iPoupei foi feito pra você, que:</p>
          </div>

          <div className="checklist">
            <CheckItem text="Vive no limite do salário" />
            <CheckItem text="Já tentou se organizar e não conseguiu" />
            <CheckItem text="Tem vergonha da bagunça financeira" />
            <CheckItem text="Quer aprender, mas não sabe por onde começar" />
          </div>
        </div>
      </section>

      {/* BENEFÍCIOS */}
      <section className="benefits">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Benefícios reais</h2>
            <p className="section-subtitle">O que você vai conquistar</p>
          </div>

          <div className="benefits__grid">
            <Benefit 
              icon="👀" 
              title="Transparência Total" 
              description="Você vai finalmente entender pra onde vai seu dinheiro" 
            />
            <Benefit 
              icon="📝" 
              title="Simplicidade" 
              description="Nada de planilhas ou fórmulas difíceis" 
            />
            <Benefit 
              icon="💖" 
              title="Design Humano" 
              description="App leve, bonito e feito pra quem nunca se organizou" 
            />
            <Benefit 
              icon="🤝" 
              title="Zero Julgamento" 
              description="Tudo começa com empatia e zero julgamento" 
            />
            <Benefit 
              icon="🔒" 
              title="Segurança Total" 
              description="Seus dados são criptografados. Segurança total." 
            />
            <Benefit 
              icon="🎯" 
              title="Resultados Reais" 
              description="Feito para brasileiros que vivem a realidade financeira do país" 
            />
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="testimonials">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">O que as pessoas estão dizendo</h2>
            <p className="section-subtitle">Histórias reais de quem mudou de vida</p>
          </div>

          <div className="testimonials__grid">
            <Testimonial 
              quote="Eu vivia com vergonha de olhar meu extrato. O iPoupei foi o primeiro app que falou a minha língua."
              author="Maria Aparecida"
              details="42 anos, São Paulo"
              avatar="MA"
            />
            <Testimonial 
              quote="Parece que alguém finalmente pensou nos brasileiros de verdade. Simples e direto ao ponto."
              author="Jonas"
              details="28 anos, Rio de Janeiro"
              avatar="J"
            />
          </div>
        </div>
      </section>

      {/* SEGURANÇA */}
      <section className="security" id="seguranca">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Seus dados, sua confiança</h2>
          </div>

          <div className="security__card">
            <div className="security__icon">🔐</div>
            <p className="security__text">
              Usamos criptografia, não vendemos informações e respeitamos 100% da LGPD.
              Sua privacidade é nossa prioridade.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQ />

      {/* FOOTER */}
      <footer className="footer">
        <div className="container">
          {/* CTA Final */}
          <div className="footer__cta">
            <h2 className="footer__title">Chega de viver no sufoco.</h2>
            <button onClick={goToSignup} className="btn btn--hero">
              <span>🚀</span>
              Comece agora gratuitamente
            </button>
          </div>

          {/* Links */}
          <div className="footer__grid">
            <div className="footer__brand">
              <div className="logo">
                <img src={logoImage} alt="iPoupei" className="logo__image" />
                <span className="logo__text">iPoupei</span>
              </div>
              <p className="footer__description">
                A ferramenta de apoio para sair do sufoco financeiro. 
                Organização, educação e investimentos para brasileiros reais.
              </p>
              <div className="footer__manifesto">
                "Estamos aqui pra quem cansou de tentar sozinho. 
                Pra quem quer dignidade financeira, não milagre."
              </div>
            </div>

            <div className="footer__section">
              <h3>Produto</h3>
              <ul>
                <li><button onClick={() => scrollTo('como-funciona')}>Como Funciona</button></li>
                <li><button onClick={() => scrollTo('para-quem')}>Para Quem</button></li>
                <li><button onClick={() => scrollTo('seguranca')}>Segurança</button></li>
              </ul>
            </div>

            <div className="footer__section">
              <h3>Suporte</h3>
              <ul>
                <li><a href="#">Central de Ajuda</a></li>
                <li><a href="#">Tutoriais</a></li>
                <li><a href="#">Fale Conosco</a></li>
              </ul>
            </div>

            <div className="footer__section">
              <h3>Legal</h3>
              <ul>
                <li><button onClick={() => navigate('/termos')}>Termos de Uso</button></li>
                <li><button onClick={() => navigate('/privacidade')}>Política de Privacidade</button></li>
                <li><a href="#">Fale Conosco</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="footer__bottom">
            <p>&copy; 2025 iPoupei. Todos os direitos reservados.</p>
            <div className="footer__social">
              <a href="#">📧</a>
              <a href="#">📱</a>
              <a href="#">💬</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// ========================================
//  🧩 COMPONENTES
// ========================================

const Feature = ({ icon, title, description }) => (
  <div className="feature">
    <div className="feature__icon">{icon}</div>
    <h3 className="feature__title">{title}</h3>
    <p className="feature__description">{description}</p>
  </div>
);

const Step = ({ number, title, description }) => (
  <div className="step">
    <div className="step__number">{number}</div>
    <h3 className="step__title">{title}</h3>
    <p className="step__description">{description}</p>
  </div>
);

const CheckItem = ({ text }) => (
  <div className="check-item">
    <div className="check-item__icon">✓</div>
    <span>{text}</span>
  </div>
);

const Benefit = ({ icon, title, description }) => (
  <div className="benefit">
    <div className="benefit__icon">{icon}</div>
    <h3 className="benefit__title">{title}</h3>
    <p className="benefit__description">{description}</p>
  </div>
);

const Testimonial = ({ quote, author, details, avatar }) => (
  <div className="testimonial">
    <div className="testimonial__quote">"</div>
    <p className="testimonial__text">{quote}</p>
    <div className="testimonial__author">
      <div className="testimonial__avatar">{avatar}</div>
      <div>
        <div className="testimonial__name">{author}</div>
        <div className="testimonial__details">{details}</div>
      </div>
    </div>
  </div>
);

const Quiz = ({ onComplete }) => {
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const results = {
    limite: "Você está no caminho certo! O iPoupei vai te ajudar a organizar suas contas e encontrar sobras que você nem sabia que existiam.",
    endividado: "Não desista! Milhares de pessoas já saíram do vermelho com o iPoupei. Vamos criar um plano realista para você.",
    organizado: "Ótimo! Você já tem consciência financeira. O iPoupei vai te ajudar a dar o próximo passo rumo aos investimentos."
  };

  const handleSelect = (profile) => {
    setSelected(profile);
    setShowResult(true);
  };

  return (
    <section className="quiz">
      <div className="container">
        <div className="quiz__card">
          <h2 className="quiz__title">🎯 Descubra seu Perfil Financeiro</h2>
          <p className="quiz__subtitle">Responda uma pergunta e receba dicas personalizadas</p>

          {!showResult ? (
            <div className="quiz__question">
              <h3>Como está sua situação hoje?</h3>
              <div className="quiz__options">
                <button onClick={() => handleSelect('limite')} className="quiz__option">
                  💸 Vivo no limite do salário
                </button>
                <button onClick={() => handleSelect('endividado')} className="quiz__option">
                  🔴 Estou endividado
                </button>
                <button onClick={() => handleSelect('organizado')} className="quiz__option">
                  ✅ Quero me organizar melhor
                </button>
              </div>
            </div>
          ) : (
            <div className="quiz__result">
              <h3>🎉 Resultado personalizado!</h3>
              <p>{results[selected]}</p>
              <button onClick={onComplete} className="btn btn--quiz">
                Começar minha jornada
                <span>🚀</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

const FAQ = () => {
  const [open, setOpen] = useState(null);

  const faqs = [

    {
      id: 2,
      question: "Meus dados estão seguros?",
      answer: "Absolutamente. Usamos criptografia de ponta, seguimos a LGPD à risca e nunca vendemos seus dados. Sua privacidade é nossa prioridade número um."
    },
    {
      id: 3,
      question: "Preciso ser expert em finanças?",
      answer: "Não! O iPoupei foi feito especialmente para quem nunca conseguiu se organizar. Explicamos tudo de forma simples, sem economês, sem julgamento."
    }
  ];

  const toggle = (id) => setOpen(open === id ? null : id);

  return (
    <section className="faq">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Dúvidas Frequentes</h2>
          <p className="section-subtitle">As perguntas que todo mundo faz</p>
        </div>

        <div className="faq__items">
          {faqs.map(faq => (
            <div key={faq.id} className="faq__item">
              <button 
                onClick={() => toggle(faq.id)} 
                className="faq__question"
              >
                {faq.question}
                <span className="faq__icon">{open === faq.id ? '−' : '+'}</span>
              </button>
              {open === faq.id && (
                <div className="faq__answer">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LandingPage;
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logoImage from '@assets/logo.png';
import '../styles/TermosDeUso.css';

const TermosDeUso = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('termos');

  // Detecta se deve mostrar privacidade baseado na URL
  useEffect(() => {
    if (location.pathname === '/privacidade') {
      setActiveTab('privacidade');
    } else if (location.pathname === '/termos') {
      setActiveTab('termos');
    }
  }, [location.pathname]);

  const showTab = (tabName) => {
    setActiveTab(tabName);
    
    // Atualiza a URL sem recarregar a página
    if (tabName === 'privacidade') {
      window.history.pushState({}, '', '/privacidade');
    } else {
      window.history.pushState({}, '', '/termos');
    }
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="legal-page">
      {/* Header */}
      <header className="legal-header">
        <div className="container">
          <div className="header-content">
            <button onClick={() => navigate('/')} className="logo">
              <img src={logoImage} alt="iPoupei" className="logo-image" />
            </button>
            <button className="back-btn" onClick={goBack}>
              ← Voltar ao Início
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="nav-tabs">
        <div className="tab-container">
          <button 
            className={`tab-button ${activeTab === 'termos' ? 'active' : ''}`}
            onClick={() => showTab('termos')}
          >
            Termos de Uso
          </button>
          <button 
            className={`tab-button ${activeTab === 'privacidade' ? 'active' : ''}`}
            onClick={() => showTab('privacidade')}
          >
            Política de Privacidade
          </button>
        </div>
      </nav>

      {/* Content */}
      <main className="legal-content">
        <div className="container">
          {/* Termos de Uso */}
          {activeTab === 'termos' && (
            <div className="tab-content">
              <div className="document-header">
                <h1 className="document-title">Termos de Uso</h1>
                <p className="document-subtitle">iPoupei - Plataforma de Controle Financeiro</p>
                <span className="document-date">Vigente a partir de: Janeiro de 2025</span>
              </div>

              <div className="document">
                <p>
                  Estes Termos de Uso regulam o uso da plataforma iPoupei, desenvolvida e mantida por{' '}
                  <strong>ASTRACORTEX TECNOLOGIA LTDA</strong>, inscrita no CNPJ sob o nº 61.442.503/0001-01, 
                  com sede em São Paulo/SP. Ao utilizar nossos serviços, você concorda com todas as condições 
                  abaixo. Se não concordar, não utilize a plataforma.
                </p>

                <h2>1. Objeto</h2>
                <p>
                  O iPoupei é uma plataforma digital de organização financeira pessoal. Oferecemos ferramentas 
                  para controle de receitas, despesas, contas, cartões, metas, além de diagnóstico financeiro 
                  gamificado. O objetivo é fornecer educação financeira e apoiar o usuário em sua jornada rumo 
                  à liberdade financeira.
                </p>

                <h2>2. Aceitação dos termos</h2>
                <p>
                  Ao acessar ou usar o iPoupei, o usuário declara ter lido, compreendido e aceito integralmente 
                  estes Termos de Uso e a Política de Privacidade. A aceitação é condição obrigatória para o 
                  uso da plataforma.
                </p>

                <h2>3. Elegibilidade e cadastro</h2>
                <p>
                  A plataforma é destinada a pessoas físicas, maiores de 18 anos, em pleno gozo da capacidade civil. 
                  Menores de idade somente poderão utilizar a plataforma com o consentimento dos pais ou responsáveis legais.
                </p>
                
                <p>
                  O uso é estritamente pessoal e não comercial. É vedado o uso por empresas, organizações ou 
                  profissionais com finalidade de exploração comercial, salvo mediante contrato específico.
                </p>

                <div className="highlight-box">
                  <h4>📋 Responsabilidades do Usuário</h4>
                  <p>
                    Para utilizar funcionalidades avançadas, o usuário deverá criar uma conta com dados verdadeiros, 
                    completos e atualizados. O usuário é responsável por manter sua senha em sigilo e por todas as 
                    atividades realizadas com seu login.
                  </p>
                </div>

                <h2>4. Funcionalidades da plataforma</h2>
                <p>O iPoupei oferece, mas não se limita a:</p>
                <ul>
                  <li>Cadastro de receitas, despesas, contas e cartões</li>
                  <li>Diagnóstico financeiro com trilha gamificada</li>
                  <li>Definição de metas, alertas e acompanhamento de progresso</li>
                  <li>Relatórios e gráficos financeiros</li>
                  <li>Planejamento de investimentos (etapas futuras)</li>
                  <li>Integração com bancos por meio do Open Finance (futuramente, mediante consentimento expresso)</li>
                </ul>

                <p>
                  O iPoupei poderá atualizar, incluir, remover ou suspender funcionalidades sem aviso prévio, 
                  conforme critérios técnicos, comerciais ou legais.
                </p>

                <h2>5. Planos, assinaturas e pagamentos</h2>
                <p>
                  A plataforma poderá oferecer planos gratuitos e planos pagos com funcionalidades adicionais. 
                  Os valores, periodicidade e formas de pagamento serão apresentados ao usuário no momento da contratação.
                </p>

                <h3>5.1 Cancelamento e reembolso</h3>
                <p>
                  O usuário poderá exercer seu direito de arrependimento no prazo de 7 (sete) dias corridos após 
                  a contratação, conforme previsto no Código de Defesa do Consumidor. Após esse prazo, cancelamentos 
                  não implicarão reembolso proporcional.
                </p>

                <h2>6. Conduta do usuário</h2>
                <p>É proibido ao usuário:</p>
                <ul>
                  <li>Utilizar a plataforma para fins ilícitos ou que violem direitos de terceiros</li>
                  <li>Praticar atos que comprometam a segurança, estabilidade ou integridade do sistema</li>
                  <li>Fornecer dados falsos, imprecisos ou de terceiros sem autorização</li>
                  <li>Realizar engenharia reversa, cópia, redistribuição ou modificação do código</li>
                  <li>Enviar conteúdo ofensivo, discriminatório, difamatório ou ilegal</li>
                </ul>

                <div className="highlight-box">
                  <h4>⚠️ Importante</h4>
                  <p>
                    O descumprimento dessas regras poderá resultar em suspensão ou exclusão da conta, 
                    sem reembolso ou aviso prévio.
                  </p>
                </div>

                <h2>7. Isenções e limitações de responsabilidade</h2>
                <p>
                  O iPoupei oferece ferramentas de apoio à organização financeira. <strong>Não garante resultados financeiros</strong>, 
                  nem se responsabiliza por perdas, decisões ou estratégias tomadas com base nas informações fornecidas.
                </p>

                <h2>8. Propriedade intelectual</h2>
                <p>
                  Todos os direitos de propriedade intelectual do iPoupei pertencem à ASTRACORTEX TECNOLOGIA LTDA. 
                  Isso inclui, mas não se limita a: marca, logotipo, interface, código-fonte, imagens, textos e layout.
                </p>

                <h2>9. Suporte e contato</h2>
                <p>Em caso de dúvidas, problemas ou solicitações, o usuário poderá entrar em contato pelos seguintes canais oficiais:</p>
                <ul>
                  <li>E-mail: <a href="mailto:contato@ipoupei.com.br">contato@ipoupei.com.br</a></li>
                </ul>

                <h2>10. Legislação e foro</h2>
                <p>
                  Este documento é regido pelas leis da República Federativa do Brasil. Fica eleito o foro da 
                  comarca de <strong>São Paulo/SP</strong> para dirimir quaisquer conflitos relacionados a estes Termos.
                </p>

                <p><strong>Versão 1.0 – Atualizado em Janeiro de 2025</strong></p>
              </div>
            </div>
          )}

          {/* Política de Privacidade */}
          {activeTab === 'privacidade' && (
            <div className="tab-content">
              <div className="document-header">
                <h1 className="document-title">Política de Privacidade</h1>
                <p className="document-subtitle">iPoupei - Proteção dos seus dados pessoais</p>
                <span className="document-date">Vigente a partir de: Janeiro de 2025</span>
              </div>

              <div className="document">
                <p>
                  A sua privacidade é prioridade para a <strong>ASTRACORTEX TECNOLOGIA LTDA</strong>, inscrita no 
                  CNPJ sob o nº 61.442.503/0001-01, com sede em São Paulo/SP, empresa proprietária da plataforma iPoupei. 
                  Este documento explica, de forma clara e objetiva, como tratamos seus dados pessoais conforme a 
                  Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD).
                </p>

                <h2>1. Quais dados coletamos</h2>
                <p>Coletamos dados pessoais quando você:</p>
                <ul>
                  <li>Cria uma conta (nome, e-mail, senha, data de nascimento)</li>
                  <li>Usa a plataforma (categorias financeiras, despesas, receitas, contas, cartões, metas)</li>
                  <li>Interage com a interface (navegação, preferências, cliques, dispositivos)</li>
                  <li>Eventualmente, integra dados bancários via Open Finance (com consentimento)</li>
                </ul>

                <div className="highlight-box">
                  <h4>🔍 Dados Técnicos</h4>
                  <p>Também podemos coletar dados técnicos: IP, tipo de dispositivo, navegador, sistema operacional e cookies.</p>
                </div>

                <h2>2. Como usamos os dados</h2>
                <p>Utilizamos os dados para:</p>
                <ul>
                  <li>Permitir o funcionamento da plataforma</li>
                  <li>Oferecer uma experiência personalizada</li>
                  <li>Realizar diagnósticos financeiros</li>
                  <li>Acompanhar metas e sugerir ajustes</li>
                  <li>Aprimorar funcionalidades com base em uso real</li>
                  <li>Cumprir obrigações legais e regulatórias</li>
                  <li>Enviar e-mails transacionais, informativos ou educacionais (sem spam)</li>
                </ul>

                <h2>3. Base legal para tratamento</h2>
                <p>Tratamos seus dados com base nas seguintes hipóteses legais:</p>
                <ul>
                  <li><strong>Consentimento</strong> (quando aplicável)</li>
                  <li><strong>Execução de contrato</strong> (uso da plataforma)</li>
                  <li><strong>Legítimo interesse</strong> (aperfeiçoamento do produto, segurança, prevenção a fraudes)</li>
                  <li><strong>Cumprimento de obrigação legal</strong> ou regulatória</li>
                </ul>

                <h2>4. Compartilhamento de dados</h2>
                <p><strong>Não vendemos nem compartilhamos seus dados com terceiros para fins comerciais.</strong></p>
                <p>Podemos compartilhar com:</p>
                <ul>
                  <li>Fornecedores de serviço essenciais para operação (ex: hospedagem, autenticação, e-mail, armazenamento)</li>
                  <li>Plataformas financeiras integradas (ex: bancos via Open Finance, com seu consentimento)</li>
                  <li>Autoridades legais, quando exigido por lei</li>
                </ul>

                <div className="highlight-box">
                  <h4>🔒 Segurança</h4>
                  <p>Todos os terceiros seguem padrões de segurança e sigilo compatíveis com a LGPD.</p>
                </div>

                <h2>5. Seus direitos como titular</h2>
                <p>Você tem direito a:</p>
                <ul>
                  <li>Confirmar se tratamos seus dados</li>
                  <li>Acessar seus dados</li>
                  <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
                  <li>Solicitar a exclusão ou anonimização de dados</li>
                  <li>Portabilidade, quando aplicável</li>
                  <li>Revogar consentimento</li>
                  <li>Reclamar junto à ANPD</li>
                </ul>

                <p>Para exercer seus direitos, entre em contato pelo e-mail: <a href="mailto:privacidade@ipoupei.com.br">privacidade@ipoupei.com.br</a></p>

                <h2>6. Cookies e tecnologias de rastreamento</h2>
                <p>Utilizamos cookies para:</p>
                <ul>
                  <li>Garantir funcionamento seguro da plataforma</li>
                  <li>Lembrar preferências do usuário</li>
                  <li>Melhorar desempenho e experiência</li>
                  <li>Coletar dados estatísticos de uso</li>
                </ul>

                <p>Você pode configurar seu navegador para recusar cookies, mas isso pode afetar o funcionamento do iPoupei.</p>

                <h2>7. Armazenamento e segurança</h2>
                <p>
                  Seus dados são armazenados em ambientes seguros, com acesso controlado, criptografia e proteção contra 
                  acessos não autorizados. Utilizamos serviços de armazenamento compatíveis com padrões internacionais de segurança.
                </p>

                <p>Conservamos seus dados enquanto durar a relação com a plataforma ou enquanto forem necessários para cumprir obrigações legais.</p>

                <div className="highlight-box">
                  <h4>🗑️ Exclusão de Dados</h4>
                  <p>
                    Você pode solicitar a exclusão da sua conta a qualquer momento. Ao excluir sua conta, 
                    <strong> todos os seus dados serão permanentemente removidos, sem exceções</strong>.
                  </p>
                </div>

                <h2>8. Alterações nesta política</h2>
                <p>
                  Podemos atualizar esta Política de Privacidade periodicamente. Recomendamos que você revise o documento 
                  com frequência. Em caso de alterações relevantes, notificaremos por e-mail ou aviso na plataforma.
                </p>

                <h2>9. Contato com o encarregado de dados (DPO)</h2>
                <p>Para dúvidas, solicitações ou reclamações, entre em contato com nosso Encarregado de Dados (DPO):</p>
                <ul>
                  <li>E-mail: <a href="mailto:privacidade@ipoupei.com.br">privacidade@ipoupei.com.br</a></li>
                </ul>

                <p><strong>Versão 1.0 - Atualizado em Janeiro de 2025</strong></p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="legal-footer">
        <div className="container">
          <p>&copy; 2025 ASTRACORTEX TECNOLOGIA LTDA - Todos os direitos reservados</p>
        </div>
      </footer>
    </div>
  );
};

export default TermosDeUso;
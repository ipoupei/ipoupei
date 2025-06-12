// src/routes/DiagnosticoRouter.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Importar todas as etapas
import IntroPercepcaoEtapa from '@modules/diagnostico/onboarding/etapa00_IntroPercepcao';
import CategoriasEtapa from '@modules/diagnostico/onboarding/etapa01_Categorias';
import ContasEtapa from '@modules/diagnostico/onboarding/etapa02_Contas';
import CartoesEtapa from '@modules/diagnostico/onboarding/etapa03_Cartoes';
import DespesasCartaoEtapa from '@modules/diagnostico/onboarding/etapa04_DespesasCartao';
// Importar outras etapas conforme forem criadas
// import ReceitasEtapa from '@modules/diagnostico/onboarding/etapa05_Receitas';
// import DespesasFixasEtapa from '@modules/diagnostico/onboarding/etapa06_DespesasFixas';
// import DespesasVariaveisEtapa from '@modules/diagnostico/onboarding/etapa07_DespesasVariaveis';
// import ResumoFinanceiroEtapa from '@modules/diagnostico/onboarding/etapa08_ResumoFinanceiro';
// import PlanosMetasEtapa from '@modules/diagnostico/onboarding/etapa09_PlanosMetas';
// import FinalizacaoEtapa from '@modules/diagnostico/onboarding/etapa10_Finalizacao';

const DiagnosticoRouter = () => {
  const navigate = useNavigate();
  const [etapaAtual, setEtapaAtual] = useState(0);
  const [dadosColetados, setDadosColetados] = useState({
    percepcao: null,
    categorias: null,
    contas: null,
    cartoes: null,
    despesasCartao: null,
    receitas: null,
    despesasFixas: null,
    despesasVariaveis: null,
    resumo: null,
    planos: null
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
      titulo: 'Despesas do Cartão'
    }
    // Adicionar outras etapas conforme forem criadas
  ];

  const totalEtapas = etapas.length;
  const etapaConfig = etapas[etapaAtual];

  // Salvar dados no localStorage para persistência
  useEffect(() => {
    const dadosSalvos = localStorage.getItem('diagnostico-dados');
    if (dadosSalvos) {
      try {
        setDadosColetados(JSON.parse(dadosSalvos));
      } catch (error) {
        console.error('Erro ao carregar dados salvos:', error);
      }
    }

    const etapaSalva = localStorage.getItem('diagnostico-etapa');
    if (etapaSalva) {
      const etapaNumero = parseInt(etapaSalva, 10);
      if (etapaNumero >= 0 && etapaNumero < totalEtapas) {
        setEtapaAtual(etapaNumero);
      }
    }
  }, [totalEtapas]);

  // Salvar dados sempre que mudarem
  useEffect(() => {
    localStorage.setItem('diagnostico-dados', JSON.stringify(dadosColetados));
    localStorage.setItem('diagnostico-etapa', etapaAtual.toString());
  }, [dadosColetados, etapaAtual]);

  const handleContinuar = (novosDados = null) => {
    // Salvar dados da etapa atual
    if (novosDados) {
      setDadosColetados(prev => ({
        ...prev,
        [etapaConfig.id.replace('-', '_')]: novosDados
      }));
    }

    // Avançar para próxima etapa
    if (etapaAtual < totalEtapas - 1) {
      setEtapaAtual(etapaAtual + 1);
    } else {
      // Finalizar diagnóstico
      handleFinalizarDiagnostico();
    }
  };

  const handleVoltar = () => {
    if (etapaAtual > 0) {
      setEtapaAtual(etapaAtual - 1);
    }
  };

  const handlePular = () => {
    // Só permite pular etapas não obrigatórias
    if (!etapaConfig.obrigatoria) {
      handleContinuar();
    }
  };

  const handleFinalizarDiagnostico = () => {
    // Processar dados finais
    console.log('Dados coletados:', dadosColetados);
    
    // Marcar diagnóstico como completo
    localStorage.setItem('diagnostico-completo', 'true');
    localStorage.setItem('diagnostico-data-conclusao', new Date().toISOString());
    
    // Limpar dados temporários
    localStorage.removeItem('diagnostico-dados');
    localStorage.removeItem('diagnostico-etapa');
    
    // Redirecionar para dashboard
    navigate('/dashboard?diagnostico=completo');
  };

  const handleSairDiagnostico = () => {
    const confirmar = window.confirm(
      'Tem certeza que deseja sair do diagnóstico? Seu progresso será salvo.'
    );
    
    if (confirmar) {
      navigate('/dashboard');
    }
  };

  // Renderizar etapa atual
  const ComponenteAtual = etapaConfig.componente;

  return (
    <div className="diagnostico-router">
      {/* Header de navegação */}
      <div className="diagnostico-nav">
        <button 
          onClick={handleSairDiagnostico}
          className="btn-sair"
        >
          ← Sair do Diagnóstico
        </button>
        
        <div className="etapa-info">
          <span>Etapa {etapaAtual + 1} de {totalEtapas}</span>
          <span className="etapa-titulo">{etapaConfig.titulo}</span>
        </div>
        
        <div className="progresso-geral">
          <div 
            className="progresso-barra"
            style={{ 
              width: `${((etapaAtual + 1) / totalEtapas) * 100}%` 
            }}
          />
        </div>
      </div>

      {/* Componente da etapa atual */}
      <div className="diagnostico-content">
        <ComponenteAtual
          onContinuar={handleContinuar}
          onVoltar={handleVoltar}
          onPular={handlePular}
          etapaAtual={etapaAtual}
          totalEtapas={totalEtapas}
          dadosExistentes={dadosColetados[etapaConfig.id.replace('-', '_')]}
        />
      </div>

      <style jsx>{`
        .diagnostico-router {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          position: relative;
        }

        .diagnostico-nav {
          position: sticky;
          top: 0;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid #e5e7eb;
          padding: 1rem 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 100;
        }

        .btn-sair {
          background: none;
          border: 1px solid #e5e7eb;
          color: #6b7280;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .btn-sair:hover {
          background: #f9fafb;
          border-color: #d1d5db;
          color: #374151;
        }

        .etapa-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
        }

        .etapa-info span:first-child {
          font-size: 0.75rem;
          color: #6b7280;
          font-weight: 500;
        }

        .etapa-titulo {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
        }

        .progresso-geral {
          width: 200px;
          height: 4px;
          background: #e5e7eb;
          border-radius: 2px;
          overflow: hidden;
        }

        .progresso-barra {
          height: 100%;
          background: linear-gradient(90deg, #667eea, #764ba2);
          border-radius: 2px;
          transition: width 0.6s ease;
        }

        .diagnostico-content {
          padding: 2rem;
          min-height: calc(100vh - 80px);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @media (max-width: 768px) {
          .diagnostico-nav {
            padding: 1rem;
            flex-direction: column;
            gap: 1rem;
          }

          .etapa-info {
            order: -1;
          }

          .progresso-geral {
            width: 100%;
            order: 1;
          }

          .btn-sair {
            align-self: flex-start;
            order: 2;
          }

          .diagnostico-content {
            padding: 1rem;
          }
        }

        @media (max-width: 480px) {
          .diagnostico-nav {
            padding: 0.75rem;
          }

          .diagnostico-content {
            padding: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default DiagnosticoRouter;
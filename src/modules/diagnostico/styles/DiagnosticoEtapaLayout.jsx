// src/modules/diagnostico/styles/DiagnosticoEtapaLayout.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import Button from '@shared/components/ui/Button';
import './DiagnosticoEtapaLayout.css';

const DiagnosticoEtapaLayout = ({
  icone,
  titulo,
  subtitulo,
  descricao,
  temDados = false,
  labelBotaoPrincipal = "Configurar",
  labelBotaoVoltar = "Voltar",
  labelBotaoContinuar = "Continuar",
  onAbrirModal,
  onVoltar,
  onContinuar,
  onPular,
  podeVoltar = true,
  podeContinuar = true,
  podePular = false,
  etapaAtual,
  totalEtapas,
  children,
  dadosExistentes = null,
  dicas = null,
  alertas = null,
  className = ""
}) => {
  const progressoPercentual = Math.round(((etapaAtual + 1) / totalEtapas) * 100);

  return (
    <div className={`diagnostico-etapa-layout ${className}`}>
      {/* Header com progresso */}
      <div className="etapa-header">
        <div className="progresso-container">
          <div className="progresso-barra">
            <div 
              className="progresso-preenchido" 
              style={{ width: `${progressoPercentual}%` }}
            />
          </div>
          <span className="progresso-texto">
            Etapa {etapaAtual + 1} de {totalEtapas} • {progressoPercentual}% concluído
          </span>
        </div>
        
        <div className="etapa-info">
          <div className="etapa-icone">{icone}</div>
          <h1 className="etapa-titulo">{titulo}</h1>
          {subtitulo && <p className="etapa-subtitulo">{subtitulo}</p>}
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="etapa-conteudo">
        {/* Descrição */}
        {descricao && (
          <div className="etapa-descricao">
            <p>{descricao}</p>
          </div>
        )}

        {/* Status dos dados */}
        {temDados && dadosExistentes ? (
          <div className="dados-status dados-completos">
            <div className="status-icone">✅</div>
            <div className="status-texto">
              <h3>Dados já configurados</h3>
              <p>{dadosExistentes}</p>
            </div>
          </div>
        ) : (
          <div className="dados-status dados-pendentes">
            <div className="status-icone">⏳</div>
            <div className="status-texto">
              <h3>Aguardando configuração</h3>
              <p>Clique no botão abaixo para começar</p>
            </div>
          </div>
        )}

        {/* Botão principal de ação */}
        <div className="etapa-acao-principal">
          <Button
            onClick={onAbrirModal}
            variant="primary"
            size="large"
            className="btn-acao-principal"
          >
            {temDados ? 'Editar' : labelBotaoPrincipal}
          </Button>
          
          {podePular && !temDados && (
            <Button
              onClick={onPular}
              variant="ghost"
              size="small"
              className="btn-pular"
            >
              Pular esta etapa
            </Button>
          )}
        </div>

        {/* Conteúdo customizado da etapa */}
        {children}

        {/* Dicas */}
        {dicas && (
          <div className="etapa-dicas">
            <div className="dica-icone">💡</div>
            <div className="dica-conteudo">
              <h4>Dicas importantes:</h4>
              {Array.isArray(dicas) ? (
                <ul>
                  {dicas.map((dica, index) => (
                    <li key={index}>{dica}</li>
                  ))}
                </ul>
              ) : (
                <p>{dicas}</p>
              )}
            </div>
          </div>
        )}

        {/* Alertas */}
        {alertas && (
          <div className="etapa-alertas">
            <div className="alerta-icone">⚠️</div>
            <div className="alerta-conteudo">
              <h4>Atenção:</h4>
              {Array.isArray(alertas) ? (
                <ul>
                  {alertas.map((alerta, index) => (
                    <li key={index}>{alerta}</li>
                  ))}
                </ul>
              ) : (
                <p>{alertas}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navegação */}
      <div className="etapa-navegacao">
        <div className="nav-esquerda">
          {podeVoltar && (
            <Button
              onClick={onVoltar}
              variant="outline"
              className="btn-voltar"
            >
              <ArrowLeft size={16} />
              {labelBotaoVoltar}
            </Button>
          )}
        </div>
        
        <div className="nav-direita">
          <Button
            onClick={onContinuar}
            disabled={!podeContinuar}
            variant="primary"
            className="btn-continuar"
          >
            {labelBotaoContinuar}
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

DiagnosticoEtapaLayout.propTypes = {
  icone: PropTypes.string.isRequired,
  titulo: PropTypes.string.isRequired,
  subtitulo: PropTypes.string,
  descricao: PropTypes.string,
  temDados: PropTypes.bool,
  labelBotaoPrincipal: PropTypes.string,
  labelBotaoVoltar: PropTypes.string,
  labelBotaoContinuar: PropTypes.string,
  onAbrirModal: PropTypes.func.isRequired,
  onVoltar: PropTypes.func,
  onContinuar: PropTypes.func.isRequired,
  onPular: PropTypes.func,
  podeVoltar: PropTypes.bool,
  podeContinuar: PropTypes.bool,
  podePular: PropTypes.bool,
  etapaAtual: PropTypes.number.isRequired,
  totalEtapas: PropTypes.number.isRequired,
  children: PropTypes.node,
  dadosExistentes: PropTypes.string,
  dicas: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
  alertas: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
  className: PropTypes.string
};

export default DiagnosticoEtapaLayout;
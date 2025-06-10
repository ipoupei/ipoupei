// src/modules/transacoes/components/TipoReceitaSelector.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { 
  TrendingUp, 
  Repeat, 
  Calendar,
  DollarSign,
  Clock,
  Star,
  ArrowRight
} from 'lucide-react';

/**
 * Componente para seleção do tipo de receita
 * 3 tipos: Previsível, Parcelada, Extra
 */
const TipoReceitaSelector = ({ tipoSelecionado, onTipoChange, disabled = false }) => {
  
  const tiposReceita = [
    {
      id: 'previsivel',
      nome: 'Receita Previsível',
      icone: <Repeat size={20} />,
      descricao: 'Renda fixa que se repete',
      exemplos: ['Salário', 'Aposentadoria', 'Aluguel recebido'],
      caracteristicas: ['Automática por 20 anos', 'Edição granular'],
      cor: '#10B981',
      corFundo: 'rgba(16, 185, 129, 0.1)',
      corBorda: 'rgba(16, 185, 129, 0.2)'
    },
    {
      id: 'parcelada',
      nome: 'Receita Parcelada',
      icone: <Calendar size={20} />,
      descricao: 'Valor dividido em parcelas',
      exemplos: ['Venda parcelada', 'Freelance dividido', 'Empréstimo a receber'],
      caracteristicas: ['Número definido de parcelas', 'Controle total'],
      cor: '#3B82F6',
      corFundo: 'rgba(59, 130, 246, 0.1)',
      corBorda: 'rgba(59, 130, 246, 0.2)'
    },
    {
      id: 'extra',
      nome: 'Receita Extra',
      icone: <Star size={20} />,
      descricao: 'Valor único e pontual',
      exemplos: ['13º salário', 'Bônus', 'Venda pontual', 'Dinheiro achado'],
      caracteristicas: ['Registro único', 'Edição simples'],
      cor: '#F59E0B',
      corFundo: 'rgba(245, 158, 11, 0.1)',
      corBorda: 'rgba(245, 158, 11, 0.2)'
    }
  ];

  return (
    <div className="tipo-receita-selector">
      <div className="selector-header">
        <h3 className="selector-title">
          <TrendingUp size={18} />
          Qual tipo de receita deseja cadastrar?
        </h3>
        <p className="selector-subtitle">
          Escolha o tipo que melhor representa sua receita para um controle mais preciso
        </p>
      </div>

      <div className="tipos-grid">
        {tiposReceita.map((tipo) => (
          <div
            key={tipo.id}
            className={`tipo-card ${tipoSelecionado === tipo.id ? 'selecionado' : ''} ${disabled ? 'disabled' : ''}`}
            onClick={() => !disabled && onTipoChange(tipo.id)}
            style={{
              '--cor-principal': tipo.cor,
              '--cor-fundo': tipo.corFundo,
              '--cor-borda': tipo.corBorda
            }}
          >
            <div className="card-header">
              <div className="card-icone" style={{ color: tipo.cor }}>
                {tipo.icone}
              </div>
              <div className="card-info">
                <h4 className="card-titulo">{tipo.nome}</h4>
                <p className="card-descricao">{tipo.descricao}</p>
              </div>
              {tipoSelecionado === tipo.id && (
                <div className="card-selecionado">
                  <ArrowRight size={16} />
                </div>
              )}
            </div>

            <div className="card-exemplos">
              <div className="exemplos-header">
                <DollarSign size={14} />
                <span>Exemplos:</span>
              </div>
              <div className="exemplos-lista">
                {tipo.exemplos.map((exemplo, index) => (
                  <span key={index} className="exemplo-tag">
                    {exemplo}
                  </span>
                ))}
              </div>
            </div>

            <div className="card-caracteristicas">
              <div className="caracteristicas-header">
                <Clock size={14} />
                <span>Características:</span>
              </div>
              <ul className="caracteristicas-lista">
                {tipo.caracteristicas.map((caracteristica, index) => (
                  <li key={index}>{caracteristica}</li>
                ))}
              </ul>
            </div>

            {tipoSelecionado === tipo.id && (
              <div className="card-footer-selecionado">
                <span>✓ Selecionado</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {tipoSelecionado && (
        <div className="selector-proximos-passos">
          <div className="proximos-passos-icone">
            <ArrowRight size={16} />
          </div>
          <span>
            {tipoSelecionado === 'previsivel' && 'Configure valor, data de início e frequência'}
            {tipoSelecionado === 'parcelada' && 'Defina valor, parcelas e frequência'}
            {tipoSelecionado === 'extra' && 'Informe valor, data e descrição'}
          </span>
        </div>
      )}

      <style jsx>{`
        .tipo-receita-selector {
          width: 100%;
          margin-bottom: 24px;
        }

        .selector-header {
          text-align: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #E5E7EB;
        }

        .selector-title {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 600;
          color: #1F2937;
        }

        .selector-subtitle {
          margin: 0;
          font-size: 14px;
          color: #6B7280;
          line-height: 1.4;
        }

        .tipos-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
          margin-bottom: 20px;
        }

        @media (min-width: 768px) {
          .tipos-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .tipo-card {
          position: relative;
          background: white;
          border: 2px solid #E5E7EB;
          border-radius: 12px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.2s ease;
          overflow: hidden;
        }

        .tipo-card:hover:not(.disabled) {
          border-color: var(--cor-borda);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }

        .tipo-card.selecionado {
          border-color: var(--cor-principal);
          background: var(--cor-fundo);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }

        .tipo-card.disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .card-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 16px;
        }

        .card-icone {
          flex-shrink: 0;
          padding: 8px;
          background: var(--cor-fundo);
          border-radius: 8px;
          border: 1px solid var(--cor-borda);
        }

        .card-info {
          flex: 1;
        }

        .card-titulo {
          margin: 0 0 4px 0;
          font-size: 16px;
          font-weight: 600;
          color: #1F2937;
        }

        .card-descricao {
          margin: 0;
          font-size: 13px;
          color: #6B7280;
          line-height: 1.4;
        }

        .card-selecionado {
          color: var(--cor-principal);
          font-weight: 600;
        }

        .card-exemplos {
          margin-bottom: 16px;
        }

        .exemplos-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
          font-size: 12px;
          font-weight: 500;
          color: #4B5563;
        }

        .exemplos-lista {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .exemplo-tag {
          display: inline-block;
          padding: 4px 8px;
          background: #F3F4F6;
          border: 1px solid #D1D5DB;
          border-radius: 6px;
          font-size: 11px;
          color: #4B5563;
          white-space: nowrap;
        }

        .tipo-card.selecionado .exemplo-tag {
          background: var(--cor-fundo);
          border-color: var(--cor-borda);
          color: var(--cor-principal);
        }

        .card-caracteristicas {
          margin-bottom: 16px;
        }

        .caracteristicas-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
          font-size: 12px;
          font-weight: 500;
          color: #4B5563;
        }

        .caracteristicas-lista {
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .caracteristicas-lista li {
          position: relative;
          padding-left: 16px;
          font-size: 12px;
          color: #6B7280;
          line-height: 1.4;
          margin-bottom: 4px;
        }

        .caracteristicas-lista li:before {
          content: '•';
          position: absolute;
          left: 0;
          color: var(--cor-principal, #6B7280);
          font-weight: bold;
        }

        .caracteristicas-lista li:last-child {
          margin-bottom: 0;
        }

        .card-footer-selecionado {
          text-align: center;
          padding: 8px;
          background: var(--cor-principal);
          color: white;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          margin: -4px -4px -4px -4px;
        }

        .selector-proximos-passos {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          font-size: 13px;
          color: #4B5563;
        }

        .proximos-passos-icone {
          color: #10B981;
        }
      `}</style>
    </div>
  );
};

TipoReceitaSelector.propTypes = {
  tipoSelecionado: PropTypes.oneOf(['previsivel', 'parcelada', 'extra']),
  onTipoChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

export default React.memo(TipoReceitaSelector);
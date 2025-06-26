// src/modules/cartoes/components/GestaoCartoes/VisualizacaoConsolidada.jsx
import React from 'react';
import { Eye, EyeOff, CreditCard, ChevronRight, Plus } from 'lucide-react';
import { obterStatusUtilizacao } from '../../utils/cartoesUtils';

const VisualizacaoConsolidada = ({
  cartoesProcessados,
  totais,
  mostrarValores,
  formatarValorComPrivacidade,
  onToggleMostrarValores,
  onVerDetalheCartao
}) => {
  return (
    <div className="gestao-cartoes">
      {/* Header */}
      <div className="gestao-cartoes__header">
        <div className="gestao-cartoes__header-content">
          <div className="gestao-cartoes__title">
            <h1 className="gestao-cartoes__main-title">Faturas dos Cartões</h1>
            <p className="gestao-cartoes__subtitle">Visão consolidada das suas faturas</p>
          </div>
          <div className="gestao-cartoes__actions">
            <button
              className="gestao-cartoes__btn gestao-cartoes__btn--secondary"
              onClick={onToggleMostrarValores}
            >
              {mostrarValores ? <Eye className="icon" /> : <EyeOff className="icon" />}
              {mostrarValores ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
        </div>
      </div>

      <div className="gestao-cartoes__content">
        {/* Lista de Cartões */}
        <div className="gestao-cartoes__lista">
          {cartoesProcessados?.map((cartao) => (
            <div 
              key={cartao.id}
              className="cartao-item"
              onClick={() => onVerDetalheCartao(cartao)}
            >
              <div className="cartao-item__info">
                <div className="cartao-item__header">
                  <div 
                    className="cartao-item__cor"
                    style={{ backgroundColor: cartao.cor || '#6B7280' }}
                  ></div>
                  <div className="cartao-item__nome-container">
                    <p className="cartao-item__nome">{cartao.nome || 'Cartão sem nome'}</p>
                    <p className="cartao-item__bandeira">{cartao.bandeira || 'Bandeira'}</p>
                  </div>
                </div>
                
                <div className="cartao-item__valores">
                  <div className="cartao-item__valor-grupo">
                    {/* ✅ CORREÇÃO ID 32 */}
                    <p className="cartao-item__valor-label">Total Pendências no Cartão</p>
                    <p className="cartao-item__valor">
                      {formatarValorComPrivacidade(cartao.total_pendencias || 0)}
                    </p>
                  </div>
                  
                  <div className="cartao-item__valor-grupo">
                    <p className="cartao-item__valor-label">Limite Total</p>
                    <p className="cartao-item__valor">
                      {formatarValorComPrivacidade(cartao.limite || 0)}
                    </p>
                  </div>
                </div>

                <div className="cartao-item__utilizacao">
                  <div className="cartao-item__utilizacao-header">
                    <span className="cartao-item__utilizacao-label">Utilização</span>
                    <span className="cartao-item__utilizacao-percentual">
                      {cartao.percentual_limite_formatado}%
                    </span>
                  </div>
                  <div className="cartao-item__barra-progresso">
                    <div 
                      className={`cartao-item__progresso ${obterStatusUtilizacao(cartao.percentual_limite_formatado)}`}
                      style={{ width: `${Math.min(cartao.percentual_limite_formatado, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="cartao-item__vencimento">
                  <p className="cartao-item__valor-label">Vencimento</p>
                  <p className="cartao-item__valor">
                    {cartao.dias_vencimento} dias
                  </p>
                </div>
              </div>
              
              <ChevronRight className="cartao-item__chevron" />
            </div>
          ))}
        </div>

        {/* Empty State */}
        {(!cartoesProcessados || cartoesProcessados.length === 0) && (
          <div className="gestao-cartoes__empty">
            <div className="empty-state">
              <CreditCard className="empty-state__icon" />
              <h3 className="empty-state__title">Nenhum cartão encontrado</h3>
              <p className="empty-state__description">
                Clique no menu "Meus Cartões" aqui na esquerda e adicione seus cartões para acompanhar as faturas e gastos.
              </p>
              
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualizacaoConsolidada;
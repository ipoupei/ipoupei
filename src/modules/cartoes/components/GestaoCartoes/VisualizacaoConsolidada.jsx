// src/modules/cartoes/components/GestaoCartoes/VisualizacaoConsolidada.jsx
// ✅ CORREÇÃO: Apenas layout otimizado, mantendo toda formatação original
import React, { useMemo, useState } from 'react';
import { Eye, EyeOff, CreditCard, ChevronRight, Plus } from 'lucide-react';
import { obterStatusUtilizacao, calcularDiasVencimento } from '../../utils/cartoesUtils';
import CartoesModal from '@modules/cartoes/components/CartoesModal';

const VisualizacaoConsolidada = ({
  cartoesProcessados,
  totais,
  mostrarValores,
  formatarValorComPrivacidade,
  onToggleMostrarValores,
  onVerDetalheCartao
}) => {
  
  // ✅ Estado para controlar o modal de cartões
  const [cartoesModalAberto, setCartoesModalAberto] = useState(false);
  
  // ✅ CORREÇÃO: Processar cartões localmente para evitar contaminação de dados
  const cartoesLimpos = useMemo(() => {
    if (!cartoesProcessados || !Array.isArray(cartoesProcessados)) {
      return [];
    }

    return cartoesProcessados.map(cartao => {
      // ✅ USAR APENAS DADOS INDIVIDUAIS DO CARTÃO
      // Não depender de estados globais que podem estar contaminados
      const valorPendencia = cartao.gasto_atual || cartao.total_gastos || cartao.valor_fatura_atual || 0;
      const limite = cartao.limite || 0;
      
      // ✅ CALCULAR PERCENTUAL BASEADO APENAS NOS DADOS DO CARTÃO
      const percentualLimite = limite > 0 
        ? Math.round((valorPendencia / limite) * 100) 
        : 0;
      
      // ✅ CALCULAR DIAS DE VENCIMENTO
      const diasVencimento = cartao.proxima_fatura_vencimento 
        ? calcularDiasVencimento(cartao.proxima_fatura_vencimento)
        : (cartao.dias_vencimento || 0);
      
      // ✅ LIMPAR E RETORNAR DADOS CONSISTENTES
      return {
        id: cartao.id,
        nome: cartao.nome || 'Cartão sem nome',
        bandeira: cartao.bandeira || 'Bandeira',
        cor: cartao.cor || '#6B7280',
        limite: limite,
        // ✅ USAR VALOR CORRETO SEM CONTAMINAÇÃO
        total_pendencias: valorPendencia,
        percentual_limite_formatado: Math.min(percentualLimite, 100), // ✅ Máximo 100%
        dias_vencimento: diasVencimento,
        limite_disponivel: Math.max(0, limite - valorPendencia), // ✅ Mínimo 0
        proxima_fatura_vencimento: cartao.proxima_fatura_vencimento
      };
    });
  }, [cartoesProcessados]);

  console.log('🔍 [VisualizacaoConsolidada] Cartões processados:', {
    original: cartoesProcessados?.length || 0,
    limpos: cartoesLimpos?.length || 0,
    dadosOriginais: cartoesProcessados?.map(c => ({
      id: c.id,
      nome: c.nome,
      total_pendencias: c.total_pendencias,
      gasto_atual: c.gasto_atual
    })),
    dadosLimpos: cartoesLimpos?.map(c => ({
      id: c.id,
      nome: c.nome,
      total_pendencias: c.total_pendencias
    }))
  });

  return (
    <div className="gestao-cartoes" style={{ minHeight: 'auto', height: 'auto', overflow: 'visible' }}>
      {/* Header */}
      <div className="gestao-cartoes__header" style={{ padding: '1rem 1.5rem 0.5rem 1.5rem', margin: 0 }}>
        <div className="gestao-cartoes__header-content">
          <div className="gestao-cartoes__title">
            <h1 className="gestao-cartoes__main-title" style={{ margin: '0 0 0.25rem 0' }}>Faturas dos Cartões</h1>
            <p className="gestao-cartoes__subtitle" style={{ margin: 0 }}>Visão consolidada das suas faturas</p>
          </div>
          <div className="gestao-cartoes__actions">
            <button
              className="gestao-cartoes__btn gestao-cartoes__btn--secondary"
              onClick={onToggleMostrarValores}
              title={mostrarValores ? 'Ocultar valores' : 'Mostrar valores'}
            >
              {mostrarValores ? <Eye className="icon" /> : <EyeOff className="icon" />}
              {mostrarValores ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
        </div>
      </div>

      <div className="gestao-cartoes__content" style={{ 
        padding: '1rem 1.5rem 1.5rem 1.5rem',
        height: 'auto',
        minHeight: 0,
        overflow: 'visible'
      }}>
        {/* Lista de Cartões - Usando dados limpos */}
        <div className="gestao-cartoes__lista">
          {cartoesLimpos?.map((cartao) => (
            <div 
              key={cartao.id}
              className="cartao-item"
              onClick={() => {
                console.log('🖱️ Clicando no cartão:', {
                  id: cartao.id,
                  nome: cartao.nome,
                  total_pendencias: cartao.total_pendencias
                });
                onVerDetalheCartao(cartao);
              }}
              style={{ cursor: 'pointer' }}
            >
              <div className="cartao-item__info">
                <div className="cartao-item__header">
                  <div 
                    className="cartao-item__cor"
                    style={{ backgroundColor: cartao.cor }}
                  ></div>
                  <div className="cartao-item__nome-container">
                    <p className="cartao-item__nome">{cartao.nome}</p>
                    <p className="cartao-item__bandeira">{cartao.bandeira}</p>
                  </div>
                </div>
                
                <div className="cartao-item__valores">
                  <div className="cartao-item__valor-grupo">
                    <p className="cartao-item__valor-label">Total Pendências no Cartão</p>
                    <p className="cartao-item__valor">
                      {formatarValorComPrivacidade(cartao.total_pendencias)}
                    </p>
                  </div>
                  
                  <div className="cartao-item__valor-grupo">
                    <p className="cartao-item__valor-label">Limite Total</p>
                    <p className="cartao-item__valor">
                      {formatarValorComPrivacidade(cartao.limite)}
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
                      style={{ 
                        width: `${Math.min(cartao.percentual_limite_formatado, 100)}%`,
                        minWidth: cartao.percentual_limite_formatado > 0 ? '2px' : '0'
                      }}
                    ></div>
                  </div>
                </div>

                <div className="cartao-item__vencimento">
                  <p className="cartao-item__valor-label">Vencimento</p>
                  <p className="cartao-item__valor">
                    {cartao.dias_vencimento > 0 
                      ? `${cartao.dias_vencimento} dias`
                      : cartao.dias_vencimento === 0
                      ? 'Hoje'
                      : `${Math.abs(cartao.dias_vencimento)} dias atrás`
                    }
                  </p>
                </div>

                {/* ✅ NOVO: Indicador visual do status do cartão */}
                <div className="cartao-item__status">
                  {cartao.percentual_limite_formatado > 90 && (
                    <span className="cartao-item__badge cartao-item__badge--warning">
                      Limite Alto
                    </span>
                  )}
                  {cartao.dias_vencimento <= 3 && cartao.dias_vencimento >= 0 && (
                    <span className="cartao-item__badge cartao-item__badge--urgent">
                      Vence em Breve
                    </span>
                  )}
                  {cartao.dias_vencimento < 0 && (
                    <span className="cartao-item__badge cartao-item__badge--danger">
                      Vencido
                    </span>
                  )}
                </div>
              </div>
              
              <ChevronRight className="cartao-item__chevron" />
            </div>
          ))}
        </div>

        {/* Empty State - Melhorado */}
        {(!cartoesLimpos || cartoesLimpos.length === 0) && (
          <div className="gestao-cartoes__empty">
            <div className="empty-state">
              <CreditCard className="empty-state__icon" />
              <h3 className="empty-state__title">Nenhum cartão encontrado</h3>
              <p className="empty-state__description">
                Clique no botão abaixo para adicionar seus cartões e começar a acompanhar suas faturas e gastos.
              </p>
              <div className="empty-state__actions">
                <button 
                  className="empty-state__button"
                  onClick={() => setCartoesModalAberto(true)}
                >
                  <Plus className="icon" />
                  Adicionar Primeiro Cartão
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
      
      {/* ✅ Modal de Cartões */}
      <CartoesModal 
        isOpen={cartoesModalAberto} 
        onClose={() => setCartoesModalAberto(false)} 
        onSave={() => {
          setCartoesModalAberto(false);
        }}
      />
    </div>
  );
};

export default VisualizacaoConsolidada;
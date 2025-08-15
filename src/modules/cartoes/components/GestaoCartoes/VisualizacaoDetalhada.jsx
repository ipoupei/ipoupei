// src/modules/cartoes/components/GestaoCartoes/VisualizacaoDetalhada.jsx
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { 
  Calendar, Award, AlertTriangle, CheckCircle, Target, DollarSign, 
  ArrowLeft, Eye, EyeOff, Zap, Plus, Minus, RotateCcw, RefreshCw,
  Edit3, Trash2
} from 'lucide-react';
import { formatCurrency } from '@shared/utils/formatCurrency';
import { formatarMesPortugues, obterStatusUtilizacao, obterStatusVencimento } from '../../utils/cartoesUtils';




function parseDateAsLocal(dateString) {
  const [year, month, day] = dateString.split('T')[0].split('-');
  return new Date(+year, month - 1, +day);
}


const VisualizacaoDetalhada = ({
  cartaoSelecionado,
  cartaoProcessado,
  cartoes,
  faturaAtual,
  faturasProcessadas,
  valorFaturaAtual,
  diasVencimento,
  statusFatura,
  gastosPorCategoria,
  transacoesAgrupadasProcessadas,
  categoriasUnicas,
  filtroCategoria,
  mostrarValores,
  parcelasExpandidas,
  formatarValorComPrivacidade,
  onVoltarConsolidada,
  onTrocarCartao,
  onTrocarFatura,
  onToggleMostrarValores,
  onSetFiltroCategoria,
  onToggleParcelaExpandida,
  onEditarTransacao,
  onExcluirTransacao,
  onAbrirModalPagamento,
  onAbrirModalReabertura,
  onAbrirModalEstorno
}) => {
  const statusVencimento = obterStatusVencimento(diasVencimento);

  return (
    <div className="gestao-cartoes">
      {/* Header Detalhada */}
      <div className="gestao-cartoes__header">
        <div className="gestao-cartoes__header-content">
          <div className="gestao-cartoes__title">
            <button 
              className="gestao-cartoes__btn-voltar"
              onClick={onVoltarConsolidada}
            >
              <ArrowLeft className="icon" />
              Voltar
            </button>
            <div className="gestao-cartoes__title-info">
              <h1 className="gestao-cartoes__main-title">{cartaoSelecionado.nome || 'Cartão'}</h1>
              <p className="gestao-cartoes__subtitle">
                Fatura de {faturaAtual ? formatarMesPortugues(faturaAtual.fatura_vencimento) : 'Carregando...'}
              </p>
            </div>
          </div>
          
          <div className="gestao-cartoes__actions">
            {/* Seletor de Cartão */}
            <select 
              className="gestao-cartoes__select"
              value={cartaoSelecionado.id}
              onChange={(e) => onTrocarCartao(e.target.value)}
            >
              {cartoes?.map(c => (
                <option key={c.id} value={c.id}>{c.nome || 'Cartão sem nome'}</option>
              ))}
            </select>

            {/* Seletor de Fatura */}
            <select 
              className="gestao-cartoes__select"
              value={faturaAtual ? faturaAtual.fatura_vencimento : ''}
              onChange={(e) => onTrocarFatura(e.target.value)}
              disabled={!faturasProcessadas?.length}
            >
              {faturasProcessadas?.map(fatura => (
                <option 
                  key={fatura.fatura_vencimento} 
                  value={fatura.fatura_vencimento}
                >
                  {fatura.opcao_display}
                </option>
              ))}
            </select>

            <button
              className="gestao-cartoes__btn gestao-cartoes__btn--secondary"
              onClick={onToggleMostrarValores}
            >
              {mostrarValores ? <Eye className="icon" /> : <EyeOff className="icon" />}
            </button>
          </div>
        </div>
      </div>

      <div className="gestao-cartoes__content gestao-cartoes__content--detalhada">
        <div className="gestao-cartoes__main">
          {/* Resumo da Fatura */}
          <div className="fatura-resumo">
            <div className="fatura-resumo__valores">
              <div className="fatura-resumo__valor-item">
                <p className="fatura-resumo__label">Valor Total</p>
                <p className="fatura-resumo__valor fatura-resumo__valor--principal">
                  {formatarValorComPrivacidade(valorFaturaAtual)}
                </p>
                <p className="fatura-resumo__info">Vence em {diasVencimento} dias</p>
              </div>
              
              <div className="fatura-resumo__valor-item">
                <p className="fatura-resumo__label">Limite Usado</p>
                <p className="fatura-resumo__valor fatura-resumo__valor--limite">
                  {cartaoProcessado.percentual_limite_formatado || 0}%
                </p>
                <p className="fatura-resumo__info">
                  {formatarValorComPrivacidade(cartaoProcessado.gasto_atual || 0)} de {formatarValorComPrivacidade(cartaoProcessado.limite || 0)}
                </p>
              </div>
            </div>

            <div className="fatura-resumo__progresso">
              <div 
                className={`fatura-resumo__barra ${obterStatusUtilizacao(cartaoProcessado.percentual_limite_formatado || 0)}`}
                style={{ width: `${Math.min(cartaoProcessado.percentual_limite_formatado || 0, 100)}%` }}
              ></div>
            </div>

            {/* Botões de Ação da Fatura */}
            <div className="fatura-resumo__acoes">
              {statusFatura.status_paga ? (
                <button 
                  className="fatura-resumo__btn-reabrir"
                  onClick={onAbrirModalReabertura}
                >
                  <RotateCcw className="icon" />
                  Reabrir Fatura
                </button>
              ) : (
                <button 
                  className="fatura-resumo__btn-pagar"
                  onClick={onAbrirModalPagamento}
                >
                  <DollarSign className="icon" />
                  Pagar Fatura - {formatarValorComPrivacidade(valorFaturaAtual)}
                </button>
              )}
              
              <button 
                className="fatura-resumo__btn-estorno"
                onClick={onAbrirModalEstorno}
              >
                <RefreshCw className="icon" />
                Lançar Estorno
              </button>
            </div>
          </div>

          {/* Análise por Categoria */}
          {gastosPorCategoria.length > 0 && (
            <div className="analise-gastos">
              <h3 className="analise-gastos__titulo">Análise de Gastos</h3>
              
              <div className="analise-gastos__content">
                <div className="analise-gastos__grafico">
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie
                        data={gastosPorCategoria}
                        cx="50%"
                        cy="50%"
                        outerRadius={55}
                        fill="#8884d8"
                        dataKey="valor_total"
                        label={false}
                      >
                        {gastosPorCategoria.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.categoria_cor} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [formatCurrency(value), 'Valor']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="analise-gastos__lista">
                  {gastosPorCategoria.slice(0, 6).map((cat, index) => (
                    <div key={`categoria-${cat.categoria_id || index}`} className="categoria-item">
                      <div className="categoria-item__info">
                        <div 
                          className="categoria-item__cor"
                          style={{ backgroundColor: cat.categoria_cor }}
                        ></div>
                        <span className="categoria-item__nome">{cat.categoria_nome}</span>
                      </div>
                      <div className="categoria-item__valores">
                        <span className="categoria-item__valor">
                          {formatarValorComPrivacidade(cat.valor_total)}
                        </span>
                        <span className="categoria-item__percentual">{Math.round(cat.percentual)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Lista de Transações */}
          <ListaTransacoes
            transacoes={transacoesAgrupadasProcessadas}
            categoriasUnicas={categoriasUnicas}
            filtroCategoria={filtroCategoria}
            parcelasExpandidas={parcelasExpandidas}
            formatarValorComPrivacidade={formatarValorComPrivacidade}
            onSetFiltroCategoria={onSetFiltroCategoria}
            onToggleParcelaExpandida={onToggleParcelaExpandida}
            onEditarTransacao={onEditarTransacao}
            onExcluirTransacao={onExcluirTransacao}
          />
        </div>

        {/* Sidebar */}
        <SidebarDetalhada
          diasVencimento={diasVencimento}
          statusVencimento={statusVencimento}
          statusFatura={statusFatura}
          cartaoProcessado={cartaoProcessado}
          gastosPorCategoria={gastosPorCategoria}
        />
      </div>
    </div>
  );
};

// Componente interno para Lista de Transações
const ListaTransacoes = ({
  transacoes,
  categoriasUnicas,
  filtroCategoria,
  parcelasExpandidas,
  formatarValorComPrivacidade,
  onSetFiltroCategoria,
  onToggleParcelaExpandida,
  onEditarTransacao,
  onExcluirTransacao
}) => {
  return (
    <div className="transacoes-lista">
      <div className="transacoes-lista__header">
        <h3 className="transacoes-lista__titulo">
          Transações ({transacoes.length})
        </h3>
        {categoriasUnicas.length > 1 && (
          <select 
            className="gestao-cartoes__select gestao-cartoes__select--small"
            value={filtroCategoria}
            onChange={(e) => onSetFiltroCategoria(e.target.value)}
          >
            {categoriasUnicas.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        )}
      </div>

      <div className="transacoes-lista__items">
        {transacoes.map((transacao) => (
          <div key={`transacao-${transacao.id}`} className="transacao-item">
            <div className="transacao-item__content">
              <div className="transacao-item__info">
                
                <div className="transacao-item__detalhes">
                    <p className="transacao-item__descricao">{transacao.descricao || 'Transação'}</p>
                    
                    {/* ✅ NOVA SEÇÃO: Categoria e Subcategoria */}
                    <div className="transacao-item__categoria" style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px'
                    }}>
                      <span 
                        className="ip_indicador_cor_pequeno"
                        style={{ 
                          backgroundColor: transacao.categoria_cor || '#6B7280',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          flexShrink: 0
                        }}
                      />
                      <span style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--ip-cinza-600)',
                        fontWeight: '500'
                      }}>
                        {transacao.categoria_nome || 'Sem categoria'}
                        {transacao.subcategoria_nome && (
                          <span style={{ 
                            color: 'var(--ip-cinza-500)',
                            fontWeight: '400'
                          }}>
                            {' • '}{transacao.subcategoria_nome}
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="transacao-item__meta">
                      <span className="transacao-item__data">
                        {(transacao.data_exibicao || transacao.data) ? 
                          parseDateAsLocal(transacao.data_exibicao || transacao.data).toLocaleDateString('pt-BR', { 
                            day: '2-digit', 
                            month: '2-digit' 
                          }) : 'Data'}
                      </span>
                    {transacao.parcela_atual && transacao.total_parcelas && (
                      <>
                        <span className="transacao-item__separador">•</span>
                        <span className="transacao-item__parcela">
                          {transacao.parcela_atual}/{transacao.total_parcelas}
                        </span>
                        {transacao.temParcelas && (
                          <button
                            className="transacao-item__btn-parcelas"
                            onClick={() => onToggleParcelaExpandida(transacao.grupo_parcelamento)}
                          >
                            {parcelasExpandidas[transacao.grupo_parcelamento] ? 
                              <Minus className="icon" /> : <Plus className="icon" />
                            }
                            {parcelasExpandidas[transacao.grupo_parcelamento] ? 'Ocultar' : 'Ver todas'}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="transacao-item__valores">
                <p className="transacao-item__valor">
                  {formatarValorComPrivacidade(transacao.valor)}
                </p>
                {/* ✅ CORREÇÃO ID 36 */}
                <span className={`transacao-item__status transacao-item__status--${transacao.efetivado ? 'verde' : 'amarelo'}`}>
                  {transacao.efetivado ? 'Paga' : 'Pendente'}
                </span>
              </div>

              {/* ✅ Botões com classes CSS */}
              <div className="transacao-item__acoes">
                <div className="action-buttons">
                  <button 
                    className="action-button action-button--edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditarTransacao(transacao);
                    }}
                    title="Editar transação"
                  >
                    <Edit3 size={12} />
                  </button>
                  <button 
                    className="action-button action-button--delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      onExcluirTransacao(transacao);
                    }}
                    title="Excluir transação"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>

            {/* Parcelas Expandidas */}
            {transacao.temParcelas && parcelasExpandidas[transacao.grupo_parcelamento] && (
              <div className="transacao-item__parcelas">
                {transacao.parcelas?.map((parcela, idx) => (
                  <div key={`parcela-${parcela.id || idx}`} className="parcela-item">
                    <div className="parcela-item__info">
                      <span className="parcela-item__numero">{parcela.parcela_atual || `${idx + 1}`}</span>
                      <span className="parcela-item__separador">•</span>
                      <span className="parcela-item__data">
                        {(parcela.data_exibicao || parcela.data) ? 
                          parseDateAsLocal(parcela.data_exibicao || parcela.data).toLocaleDateString('pt-BR', { 
                            day: '2-digit', 
                            month: '2-digit' 
                          }) : 'Data'}
                      </span>
                      
                      {/* ✅ NOVA SEÇÃO: Categoria da parcela (se diferente da principal) */}
                      {(parcela.categoria_nome && parcela.categoria_nome !== transacao.categoria_nome) && (
                        <>
                          <span className="parcela-item__separador">•</span>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <span 
                              style={{ 
                                backgroundColor: parcela.categoria_cor || transacao.categoria_cor || '#6B7280',
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                display: 'inline-block'
                              }}
                            />
                            <span style={{ 
                              fontSize: '0.65rem', 
                              color: 'var(--ip-cinza-500)',
                              fontWeight: '500'
                            }}>
                              {parcela.categoria_nome}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="parcela-item__valores">
                      <span className="parcela-item__valor">
                        {formatarValorComPrivacidade(parcela.valor)}
                      </span>
                      {/* ✅ CORREÇÃO ID 36 */}
                      <span className={`parcela-item__status parcela-item__status--${parcela.efetivado ? 'verde' : 'amarelo'}`}>
                        {parcela.efetivado ? 'Paga' : 'Pendente'}
                      </span>
                    </div>
                    
                    {/* ✅ Botões com classes CSS */}
                    <div className="parcela-item__acoes">
                      <div className="action-buttons">
                        <button 
                          className="action-button action-button--edit action-button--small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditarTransacao(parcela);
                          }}
                          title="Editar parcela"
                        >
                          <Edit3 size={10} />
                        </button>
                        <button 
                          className="action-button action-button--delete action-button--small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onExcluirTransacao(parcela);
                          }}
                          title="Excluir parcela"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {transacoes.length === 0 && (
        <div className="transacoes-lista__empty">
          <p>Nenhuma transação encontrada para este filtro.</p>
        </div>
      )}
    </div>
  );
};

// Componente interno para Sidebar
const SidebarDetalhada = ({
  diasVencimento,
  statusVencimento,
  statusFatura,
  cartaoProcessado,
  gastosPorCategoria
}) => {
  return (
    <div className="gestao-cartoes__sidebar">
      {/* Vencimento */}
      <div className="sidebar-card">
        <div className="sidebar-card__header">
          <Calendar className="sidebar-card__icon" />
          <h4 className="sidebar-card__titulo">Vencimento</h4>
        </div>
        <div className="sidebar-card__content sidebar-card__content--center">
          <p className="sidebar-card__valor-principal">{diasVencimento}</p>
          <p className="sidebar-card__label">dias restantes</p>
          <span className={`sidebar-card__status ${statusVencimento.classe}`}>
            {statusVencimento.texto}
          </span>
        </div>
      </div>

      {/* Status da Fatura */}
      <div className="sidebar-card">
        <div className="sidebar-card__header">
          <CheckCircle className="sidebar-card__icon" />
          <h4 className="sidebar-card__titulo">Status da Fatura</h4>
        </div>
        <div className="sidebar-card__content sidebar-card__content--center">
          {/* ✅ CORREÇÃO ID 36 */}
          <span className={`sidebar-card__status ${statusFatura.status_paga ? 'status-verde' : 'status-amarelo'}`}>
            {statusFatura.status_paga ? 'Paga' : 'Em Aberto'}
          </span>
          <p className="sidebar-card__info">
            {statusFatura.status_paga 
              ? `${statusFatura.transacoes_efetivadas} transações efetivadas`
              : `${statusFatura.total_transacoes} transações pendentes`
            }
          </p>
        </div>
      </div>

      {/* Saúde do Cartão */}
      <div className="sidebar-card">
        <div className="sidebar-card__header">
          <Target className="sidebar-card__icon" />
          <h4 className="sidebar-card__titulo">Saúde do Cartão</h4>
        </div>
        <div className="sidebar-card__content sidebar-card__content--center">
          <div className="score-circular">
            <svg className="score-circular__svg" viewBox="0 0 100 100">
              <circle 
                cx="50" 
                cy="50" 
                r="35" 
                stroke="#10B981" 
                strokeWidth="8" 
                fill="none"
                strokeDasharray={`${((100 - (cartaoProcessado.percentual_limite_formatado || 0)) * 0.8) * 2.2} 220`}
                strokeLinecap="round"
                className="score-circular__progress"
              />
            </svg>
            <span className="score-circular__valor">
              {Math.max(0, 100 - (cartaoProcessado.percentual_limite_formatado || 0))}
            </span>
          </div>
          <p className="sidebar-card__status status-verde">
            {cartaoProcessado.percentual_limite_formatado <= 30 ? 'Excelente' : 
             cartaoProcessado.percentual_limite_formatado <= 60 ? 'Boa' : 'Atenção'}
          </p>
          <p className="sidebar-card__info">Seu uso está {cartaoProcessado.percentual_limite_formatado <= 60 ? 'saudável' : 'alto'}</p>
        </div>
      </div>

      {/* Insights */}
      <div className="sidebar-card">
        <div className="sidebar-card__header">
          <Zap className="sidebar-card__icon sidebar-card__icon--yellow" />
          <h4 className="sidebar-card__titulo">Insights</h4>
        </div>
        <div className="sidebar-card__content">
          <div className="insight-mini insight-mini--orange">
            <p className="insight-mini__titulo">Categoria Destaque</p>
            <p className="insight-mini__texto">
              <strong>{gastosPorCategoria[0]?.categoria_nome || 'Outros'}</strong> foi sua maior categoria este mês
            </p>
          </div>
          <div className="insight-mini insight-mini--blue">
            <p className="insight-mini__titulo">💡 Dica de Economia</p>
            <p className="insight-mini__texto">
              Continue controlando seus gastos!
            </p>
          </div>
        </div>
      </div>

      {/* Conquistas */}
      <div className="sidebar-card">
        <div className="sidebar-card__header">
          <Award className="sidebar-card__icon sidebar-card__icon--yellow" />
          <h4 className="sidebar-card__titulo">Conquistas</h4>
        </div>
        <div className="sidebar-card__content">
          <div className="conquista-item conquista-item--green">
            <CheckCircle className="conquista-item__icon" />
            <div className="conquista-item__info">
              <p className="conquista-item__titulo">Histórico Limpo</p>
              <p className="conquista-item__descricao">12 meses sem atraso</p>
            </div>
          </div>
          <div className="conquista-item conquista-item--blue">
            <Target className="conquista-item__icon" />
            <div className="conquista-item__info">
              <p className="conquista-item__titulo">Uso Consciente</p>
              <p className="conquista-item__descricao">Limite bem controlado</p>
            </div>
          </div>
          <div className="conquista-item conquista-item--purple">
            <Award className="conquista-item__icon" />
            <div className="conquista-item__info">
              <p className="conquista-item__titulo">Organizador</p>
              <p className="conquista-item__descricao">Categorias bem definidas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Aviso Educativo */}
      <div className="sidebar-card sidebar-card--alerta">
        <div className="sidebar-card__header">
          <AlertTriangle className="sidebar-card__icon sidebar-card__icon--orange" />
          <h4 className="sidebar-card__titulo">Importante</h4>
        </div>
        <div className="sidebar-card__content">
          <p className="sidebar-card__texto">
            Consulte taxas e encargos junto à operadora do cartão para mais detalhes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VisualizacaoDetalhada; 
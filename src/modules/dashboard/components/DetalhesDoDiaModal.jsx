import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  X, 
  TrendingUp,
  TrendingDown,
  Calendar,
  Tag,
  CreditCard,
  Landmark,
  Banknote,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@utils/formatCurrency';
import { supabase } from '@lib/supabaseClient';
import useAuth from '@modules/auth/hooks/useAuth';
import '../styles/DetalhesDoDiaModal.css';

/**
 * Modal para exibir detalhes das movimentações de um dia específico
 * ✅ VERSÃO FINAL: Apenas RPC Supabase - Método único e eficiente
 * ✅ Sem fallbacks - Performance otimizada
 * ✅ Diagnóstico integrado para troubleshooting
 */
const DetalhesDoDiaModal = ({ isOpen, onClose, dia }) => {
  const { user, isAuthenticated } = useAuth();
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [resumoDia, setResumoDia] = useState({ 
    total_receitas: 0, 
    total_despesas: 0, 
    saldo: 0, 
    total_transacoes: 0 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetchDate, setLastFetchDate] = useState(null);
  const [debugInfo, setDebugInfo] = useState([]);
  
  // ✅ FUNÇÃO PRINCIPAL: Buscar dados via RPC Supabase
  const fetchDetalhesDoDia = async (dataEspecifica) => {
    if (!isAuthenticated || !user || !dataEspecifica) {
      console.log('⚠️ Parâmetros insuficientes para buscar detalhes:', { 
        isAuthenticated, 
        hasUser: !!user, 
        hasData: !!dataEspecifica 
      });
      setMovimentacoes([]);
      setResumoDia({ total_receitas: 0, total_despesas: 0, saldo: 0, total_transacoes: 0 });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const dataFormatada = format(dataEspecifica, 'yyyy-MM-dd');
      
      console.log('📅 Buscando dados via RPC Supabase:', { 
        dataFormatada, 
        userId: user.id,
        dataOriginal: dataEspecifica
      });

      // ✅ Chamadas paralelas das funções RPC para máxima performance
      const [detalhesResult, resumoResult] = await Promise.all([
        supabase.rpc('gpt_detalhes_do_dia', {
          p_usuario_id: user.id,
          p_data_especifica: dataFormatada
        }),
        supabase.rpc('gpt_resumo_do_dia', {
          p_usuario_id: user.id,
          p_data_especifica: dataFormatada
        })
      ]);

      // ✅ Verificar erros nas funções RPC
      if (detalhesResult.error) {
        console.error('❌ Erro na função gpt_detalhes_do_dia:', detalhesResult.error);
        throw new Error(`Erro ao buscar detalhes: ${detalhesResult.error.message}`);
      }

      if (resumoResult.error) {
        console.error('❌ Erro na função gpt_resumo_do_dia:', resumoResult.error);
        throw new Error(`Erro ao buscar resumo: ${resumoResult.error.message}`);
      }

      const transacoesData = detalhesResult.data || [];
      const resumoData = resumoResult.data?.[0] || { 
        total_receitas: 0, 
        total_despesas: 0, 
        saldo: 0, 
        total_transacoes: 0 
      };

      console.log('📊 Dados RPC recebidos com sucesso:', {
        transacoes: transacoesData.length,
        resumo: resumoData,
        dataConsultada: dataFormatada
      });

      // ✅ Processar dados das transações retornadas pela RPC
      const movimentacoesProcessadas = transacoesData.map(transacao => {
        const valorProcessado = parseFloat(transacao.valor) || 0;
        
        return {
          id: transacao.id,
          descricao: transacao.descricao || 'Sem descrição',
          valor: valorProcessado,
          tipo: transacao.tipo,
          categoria: transacao.categoria_nome || 'Sem categoria',
          categoria_cor: transacao.categoria_cor || '#6B7280',
          conta: transacao.conta_nome || 'Conta não informada',
          status: 'realizado',
          observacoes: transacao.observacoes || '',
          data: transacao.data
        };
      });

      console.log('✅ Dados processados via RPC:', {
        movimentacoes: movimentacoesProcessadas.length,
        receitas: parseFloat(resumoData.total_receitas) || 0,
        despesas: parseFloat(resumoData.total_despesas) || 0,
        saldo: parseFloat(resumoData.saldo) || 0
      });
      
      // ✅ Atualizar estados
      setMovimentacoes(movimentacoesProcessadas);
      setResumoDia({
        total_receitas: parseFloat(resumoData.total_receitas) || 0,
        total_despesas: parseFloat(resumoData.total_despesas) || 0,
        saldo: parseFloat(resumoData.saldo) || 0,
        total_transacoes: parseInt(resumoData.total_transacoes) || 0
      });
      setLastFetchDate(dataFormatada);

    } catch (err) {
      console.error('❌ Erro ao carregar detalhes do dia via RPC:', err);
      
      let friendlyError = 'Erro ao carregar movimentações do dia';
      
      // ✅ Mensagens de erro específicas e úteis
      if (err.message?.includes('permission') || err.message?.includes('RLS')) {
        friendlyError = 'Sem permissão para acessar os dados. Verifique a autenticação.';
      } else if (err.message?.includes('network') || err.message?.includes('fetch')) {
        friendlyError = 'Erro de conexão. Verifique sua internet e tente novamente.';
      } else if (err.message?.includes('function') || err.message?.includes('rpc') || err.message?.includes('does not exist')) {
        friendlyError = 'Funções RPC não encontradas. Execute o SQL de criação das funções.';
      } else if (err.message?.includes('column') && err.message?.includes('does not exist')) {
        friendlyError = 'Erro na estrutura do banco. Verifique se as tabelas estão corretas.';
      } else if (err.message?.includes('structure of query does not match')) {
        friendlyError = 'Incompatibilidade nos tipos de dados das funções RPC. Execute o SQL atualizado.';
      } else if (err.message) {
        friendlyError = err.message;
      }
      
      setError(friendlyError);
      setMovimentacoes([]);
      setResumoDia({ total_receitas: 0, total_despesas: 0, saldo: 0, total_transacoes: 0 });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Função de diagnóstico das funções RPC
  const diagnosticarRPC = async () => {
    if (!user) return;
    
    try {
      console.log('🔍 Executando diagnóstico das funções RPC...');
      
      // Primeiro, teste simples de conectividade
      const { data: testSimple, error: simpleError } = await supabase.rpc('gpt_test_simple');
      
      if (simpleError) {
        console.error('❌ Erro no teste simples:', simpleError);
        setDebugInfo([
          { teste: 'Conectividade RPC', resultado: false, detalhes: simpleError.message }
        ]);
        return { success: false, error: simpleError };
      }

      // Teste completo de diagnóstico
      const { data: testResult, error: testError } = await supabase.rpc('gpt_test_functions', {
        p_usuario_id: user.id
      });
      
      if (testError) {
        console.error('❌ Erro no diagnóstico:', testError);
        setDebugInfo([
          { teste: 'Conectividade RPC', resultado: true, detalhes: 'OK' },
          { teste: 'Função de diagnóstico', resultado: false, detalhes: testError.message }
        ]);
        return { success: false, error: testError };
      }
      
      console.log('✅ Diagnóstico completo:', testResult);
      setDebugInfo([
        { teste: 'Conectividade RPC', resultado: true, detalhes: 'OK' },
        ...(testResult || [])
      ]);
      return { success: true, data: testResult };
      
    } catch (error) {
      console.error('❌ Erro no diagnóstico:', error);
      setDebugInfo([
        { teste: 'Erro na execução', resultado: false, detalhes: error.message }
      ]);
      return { success: false, error };
    }
  };

  // ✅ Handler para retry com diagnóstico automático
  const handleRetry = async () => {
    if (dia?.data) {
      // Se há erro, executa diagnóstico primeiro
      if (error) {
        console.log('🔍 Executando diagnóstico antes do retry...');
        await diagnosticarRPC();
      }
      
      fetchDetalhesDoDia(dia.data);
    }
  };

  // ✅ Carrega dados quando modal abre
  useEffect(() => {
    if (isOpen && dia?.data && isAuthenticated && user) {
      const dataFormatada = format(dia.data, 'yyyy-MM-dd');
      
      console.log('🔄 Modal aberto, carregando dados RPC para:', {
        data: dia.data,
        dataFormatada,
        userId: user.id,
        lastFetch: lastFetchDate
      });
      
      // ✅ Cache inteligente - evita refetch desnecessário
      if (lastFetchDate !== dataFormatada) {
        const timer = setTimeout(() => {
          fetchDetalhesDoDia(dia.data);
        }, 100);
        
        return () => clearTimeout(timer);
      }
    } else if (!isOpen) {
      setError(null);
      setLoading(false);
    } else if (isOpen && !isAuthenticated) {
      setError('Usuário não autenticado. Faça login novamente.');
      setLoading(false);
    } else if (isOpen && !dia?.data) {
      setError('Data inválida para buscar transações.');
      setLoading(false);
    }
  }, [isOpen, dia?.data, isAuthenticated, user, lastFetchDate]);

  // ✅ Bloquear scroll do body quando modal está aberto
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
      return () => document.body.classList.remove('modal-open');
    }
  }, [isOpen]);

  // ✅ Handler para tecla ESC
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      return () => document.removeEventListener('keydown', handleEscKey);
    }
  }, [isOpen, onClose]);

  const handleClose = () => onClose();
  const handleContentClick = (e) => e.stopPropagation();

  // ✅ Componente de item de movimentação
  const MovimentacaoItem = ({ movimentacao }) => {
    const isReceita = movimentacao.tipo === 'receita';
    const valor = parseFloat(movimentacao.valor) || 0;
    
    const getContaIcon = () => {
      if (!movimentacao.conta) return <Banknote size={12} />;
      const contaLower = movimentacao.conta.toLowerCase();
      if (contaLower.includes('cartão') || contaLower.includes('cartao')) {
        return <CreditCard size={12} />;
      }
      if (contaLower.includes('poupança') || contaLower.includes('poupanca') || contaLower.includes('investimento')) {
        return <TrendingUp size={12} />;
      }
      return <Landmark size={12} />;
    };

    return (
      <div className={`detalhes-movimentacao-item ${isReceita ? 'receita' : 'despesa'}`}>
        <div className="detalhes-movimentacao-content">
          <div className={`detalhes-movimentacao-icon ${isReceita ? 'receita' : 'despesa'}`}>
            {isReceita ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
          </div>
          
          <div className="detalhes-movimentacao-info">
            <div className="detalhes-movimentacao-main">
              <div>
                <h4 className="detalhes-movimentacao-descricao">
                  {movimentacao.descricao}
                </h4>
                <p className={`detalhes-movimentacao-valor ${isReceita ? 'receita' : 'despesa'}`}>
                  {isReceita ? '+' : '-'} {formatCurrency(valor)}
                </p>
              </div>
            </div>
            
            <div className="detalhes-movimentacao-detalhes">
              <div className="detalhes-movimentacao-detalhe">
                <div 
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: movimentacao.categoria_cor,
                    marginRight: '4px'
                  }}
                ></div>
                <Tag size={12} />
                <span>{movimentacao.categoria}</span>
              </div>
              <div className="detalhes-movimentacao-detalhe">
                {getContaIcon()}
                <span>{movimentacao.conta}</span>
              </div>
            </div>
            
            {movimentacao.observacoes && (
              <p className="detalhes-movimentacao-observacoes">
                {movimentacao.observacoes}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ✅ Estado de loading
  const renderLoadingState = () => (
    <div className="detalhes-modal-body">
      <div className="detalhes-empty-state">
        <div className="detalhes-loading-spinner" style={{
          width: '32px',
          height: '32px',
          border: '3px solid #f3f4f6',
          borderTop: '3px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '16px'
        }}></div>
        <h3 className="detalhes-empty-title">
          Carregando movimentações...
        </h3>
        <p className="detalhes-empty-description">
          Buscando dados via RPC Supabase
        </p>
      </div>
    </div>
  );

  // ✅ Estado de erro com diagnóstico integrado
  const renderErrorState = () => (
    <div className="detalhes-modal-body">
      <div className="detalhes-empty-state">
        <div className="detalhes-empty-icon" style={{ color: '#ef4444' }}>
          <AlertCircle size={32} />
        </div>
        <h3 className="detalhes-empty-title" style={{ color: '#ef4444' }}>
          Erro ao carregar dados
        </h3>
        <p className="detalhes-empty-description">
          {error}
        </p>
        
        {/* Informações de diagnóstico */}
        {debugInfo.length > 0 && (
          <div style={{ 
            margin: '16px 0', 
            padding: '12px', 
            background: '#f9fafb', 
            borderRadius: '8px',
            fontSize: '0.875rem',
            maxWidth: '100%'
          }}>
            <div style={{ fontWeight: '500', marginBottom: '8px', color: '#374151' }}>
              Diagnóstico das funções RPC:
            </div>
            {debugInfo.slice(0, 4).map((info, index) => (
              <div key={index} style={{ 
                display: 'flex', 
                gap: '6px', 
                marginBottom: '4px',
                fontSize: '0.8rem'
              }}>
                <span>{info.resultado ? '✅' : '❌'}</span>
                <span style={{ color: '#6b7280' }}>
                  <strong>{info.teste}:</strong> {info.detalhes}
                </span>
              </div>
            ))}
          </div>
        )}

        {dia?.data && (
          <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '8px 0' }}>
            Data: {format(dia.data, 'dd/MM/yyyy')} • 
            Usuário: {user?.id?.substring(0, 8)}... • 
            Método: RPC Supabase
            {error?.includes('does not exist') && (
              <><br /><span style={{ color: '#ef4444', fontWeight: '500' }}>
                💡 Execute o SQL de criação das funções RPC
              </span></>
            )}
          </p>
        )}

        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
          <button 
            onClick={handleRetry}
            disabled={loading}
            style={{
              padding: '8px 16px',
              backgroundColor: loading ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Carregando...' : 'Tentar novamente'}
          </button>
          
          <button 
            onClick={diagnosticarRPC}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            Diagnosticar RPC
          </button>
          
          <button 
            onClick={() => {
              setError(null);
              setMovimentacoes([]);
              setResumoDia({ total_receitas: 0, total_despesas: 0, saldo: 0, total_transacoes: 0 });
              setDebugInfo([]);
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            Limpar
          </button>
        </div>
      </div>
    </div>
  );

  if (!isOpen || !dia) return null;

  return (
    <div className="detalhes-modal-overlay" onClick={handleClose}>
      <div className="detalhes-modal-container" onClick={handleContentClick}>
        {/* Header do Modal */}
        <div className="detalhes-modal-header">
          <button onClick={handleClose} className="detalhes-modal-close-button">
            <X size={24} />
          </button>
          
          <h2 className="detalhes-modal-title">
            {dia?.data ? format(dia.data, 'dd \'de\' MMMM', { locale: ptBR }) : 'Detalhes do Dia'}
          </h2>
          <p className="detalhes-modal-subtitle">
            {dia?.data ? format(dia.data, 'EEEE', { locale: ptBR }) : ''}
          </p>
          
          {/* Resumo do Dia - dados do RPC */}
          {!loading && !error && (
            <div className="detalhes-modal-resumo">
              <div className="detalhes-resumo-item">
                <p className="detalhes-resumo-label">Receitas</p>
                <p className="detalhes-resumo-valor positivo">
                  {formatCurrency(resumoDia.total_receitas)}
                </p>
              </div>
              <div className="detalhes-resumo-item">
                <p className="detalhes-resumo-label">Despesas</p>
                <p className="detalhes-resumo-valor negativo">
                  {formatCurrency(resumoDia.total_despesas)}
                </p>
              </div>
              <div className="detalhes-resumo-item">
                <p className="detalhes-resumo-label">Saldo</p>
                <p className={`detalhes-resumo-valor ${resumoDia.saldo >= 0 ? 'positivo' : 'negativo'}`}>
                  {formatCurrency(resumoDia.saldo)}
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Conteúdo do Modal */}
        {loading ? (
          renderLoadingState()
        ) : error ? (
          renderErrorState()
        ) : movimentacoes.length === 0 ? (
          <div className="detalhes-modal-body">
            <div className="detalhes-empty-state">
              <div className="detalhes-empty-icon">
                <Calendar size={32} />
              </div>
              <h3 className="detalhes-empty-title">
                Nenhuma movimentação registrada
              </h3>
              <p className="detalhes-empty-description">
                Não há receitas ou despesas cadastradas para este dia.
              </p>
              {dia?.data && (
                <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '8px' }}>
                  Data consultada: {format(dia.data, 'dd/MM/yyyy')} via RPC Supabase
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="detalhes-modal-body">
            {/* Cabeçalho da lista */}
            <div className="detalhes-movimentacoes-header">
              <h3 className="detalhes-movimentacoes-title">
                Movimentações ({resumoDia.total_transacoes || movimentacoes.length})
                
              </h3>
              <p className="detalhes-movimentacoes-subtitle">
                {dia?.data ? format(dia.data, 'dd/MM/yyyy', { locale: ptBR }) : ''}
              </p>
            </div>
            
            {/* Lista de movimentações */}
            <div className="detalhes-movimentacoes-lista">
              {movimentacoes.map((movimentacao, index) => (
                <MovimentacaoItem 
                  key={movimentacao.id || index} 
                  movimentacao={movimentacao} 
                />
              ))}
            </div>
            
            {/* Resumo adicional */}
            <div className="detalhes-resumo-adicional">
              <div className="detalhes-resumo-grid">
                <div className="detalhes-resumo-coluna">
                  <p className="detalhes-resumo-coluna-label">Total de Transações</p>
                  <p className="detalhes-resumo-coluna-valor neutro">
                    {resumoDia.total_transacoes || movimentacoes.length}
                  </p>
                </div>
                <div className="detalhes-resumo-coluna">
                  <p className="detalhes-resumo-coluna-label">Receitas</p>
                  <p className="detalhes-resumo-coluna-valor positivo">
                    {formatCurrency(resumoDia.total_receitas)}
                  </p>
                </div>
                <div className="detalhes-resumo-coluna">
                  <p className="detalhes-resumo-coluna-label">Despesas</p>
                  <p className="detalhes-resumo-coluna-valor negativo">
                    {formatCurrency(resumoDia.total_despesas)}
                  </p>
                </div>
                <div className="detalhes-resumo-coluna">
                  <p className="detalhes-resumo-coluna-label">Resultado</p>
                  <p className={`detalhes-resumo-coluna-valor ${resumoDia.saldo >= 0 ? 'positivo' : 'negativo'}`}>
                    {formatCurrency(resumoDia.saldo)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Footer do Modal */}
        <div className="detalhes-modal-footer">
          <div className="detalhes-modal-info">
            {loading ? (
              'Carregando via RPC Supabase...'
            ) : error ? (
              'Erro ao carregar dados'
            ) : (
              <>
                {resumoDia.total_transacoes || movimentacoes.length} movimentação{(resumoDia.total_transacoes || movimentacoes.length) !== 1 ? 'ões' : ''} • 
                Saldo do dia: <span className={`detalhes-modal-saldo-info ${resumoDia.saldo >= 0 ? 'positivo' : 'negativo'}`}>
                  {formatCurrency(resumoDia.saldo)}
                </span>
              </>
            )}
          </div>
          <div className="detalhes-modal-actions">
            <button onClick={handleClose} className="detalhes-modal-button secondary">
              Fechar
            </button>
            <button
              onClick={() => {
                handleClose();
                window.location.href = '/transacoes';
              }}
              className="detalhes-modal-button primary"
              disabled={loading}
            >
              Ver todas as transações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

DetalhesDoDiaModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  dia: PropTypes.shape({
    data: PropTypes.instanceOf(Date),
    movimentos: PropTypes.array,
    totais: PropTypes.object
  })
};

export default DetalhesDoDiaModal;
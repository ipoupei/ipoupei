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

/**
 * Modal para exibir detalhes das movimentações de um dia específico
 * ✅ VERSÃO REFATORADA: Usando FormsModal.css unificado
 * ✅ Sem CSS específico - Máxima reutilização
 * ✅ Performance otimizada com RPC Supabase
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
        supabase.rpc('ip_prod_detalhes_do_dia', {
          p_usuario_id: user.id,
          p_data_especifica: dataFormatada
        }),
        supabase.rpc('ip_prod_resumo_do_dia', {
          p_usuario_id: user.id,
          p_data_especifica: dataFormatada
        })
      ]);

      // ✅ Verificar erros nas funções RPC
      if (detalhesResult.error) {
        console.error('❌ Erro na função ip_prod_detalhes_do_dia:', detalhesResult.error);
        throw new Error(`Erro ao buscar detalhes: ${detalhesResult.error.message}`);
      }

      if (resumoResult.error) {
        console.error('❌ Erro na função ip_prod_resumo_do_dia:', resumoResult.error);
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
      const { data: testSimple, error: simpleError } = await supabase.rpc('ip_prod_gpt_test_simple');
      
      if (simpleError) {
        console.error('❌ Erro no teste simples:', simpleError);
        setDebugInfo([
          { teste: 'Conectividade RPC', resultado: false, detalhes: simpleError.message }
        ]);
        return { success: false, error: simpleError };
      }

      // Teste completo de diagnóstico
      const { data: testResult, error: testError } = await supabase.rpc('ip_prod_test_functions', {
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

  // ✅ Carrega dados quando modal abre - OTIMIZADO
  useEffect(() => {
    if (isOpen && dia?.data && isAuthenticated && user) {
      const dataFormatada = format(dia.data, 'yyyy-MM-dd');
      
      console.log('🔄 Modal aberto, analisando dados recebidos:', {
        data: dia.data,
        dataFormatada,
        userId: user.id,
        temMovimentos: dia.movimentos?.length || 0,
        temTotais: !!dia.totais,
        lastFetch: lastFetchDate
      });
      
      // ✅ OTIMIZAÇÃO: Se já temos dados do calendário, usar direto
      if (dia.movimentos && dia.totais && dia.movimentos.length > 0) {
        console.log('✅ Usando dados já processados pelo calendário:', {
          movimentos: dia.movimentos.length,
          totais: dia.totais
        });
        
        // Usar dados já processados pelo calendário
        setMovimentacoes(dia.movimentos);
        setResumoDia(dia.totais);
        setLastFetchDate(dataFormatada);
        setLoading(false);
        setError(null);
        return;
      }
      
      // ✅ Só fazer RPC se não temos dados ou o cache está desatualizado
      if (lastFetchDate !== dataFormatada) {
        console.log('🔄 Cache desatualizado, buscando via RPC...');
        const timer = setTimeout(() => {
          fetchDetalhesDoDia(dia.data);
        }, 100);
        
        return () => clearTimeout(timer);
      } else {
        console.log('✅ Cache válido, mantendo dados atuais');
        setLoading(false);
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
    } else if (isOpen && dia?.data && (!dia.movimentos || dia.movimentos.length === 0)) {
      // Caso especial: dia sem movimentos
      console.log('📭 Dia sem movimentos, definindo estado vazio');
      setMovimentacoes([]);
      setResumoDia({ total_receitas: 0, total_despesas: 0, saldo: 0, total_transacoes: 0 });
      setLastFetchDate(format(dia.data, 'yyyy-MM-dd'));
      setLoading(false);
      setError(null);
    }
  }, [isOpen, dia?.data, dia?.movimentos, dia?.totais, isAuthenticated, user, lastFetchDate]);

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

  // ✅ Componente de item de movimentação - USANDO CLASSES DO FORMSMODAL
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
      <div className={`movimentacao-item ${isReceita ? 'receita' : 'despesa'}`}>
        <div className="movimentacao-content">
          <div className={`movimentacao-icon ${isReceita ? 'receita' : 'despesa'}`}>
            {isReceita ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
          </div>
          
          <div className="movimentacao-info">
            <div className="movimentacao-main">
              <div>
                <h4 className="movimentacao-descricao">
                  {movimentacao.descricao}
                </h4>
                <p className={`movimentacao-valor ${isReceita ? 'receita' : 'despesa'}`}>
                  {isReceita ? '+' : '-'} {formatCurrency(valor)}
                </p>
              </div>
            </div>
            
            <div className="movimentacao-detalhes">
              <div className="movimentacao-detalhe">
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
              <div className="movimentacao-detalhe">
                {getContaIcon()}
                <span>{movimentacao.conta}</span>
              </div>
            </div>
            
            {movimentacao.observacoes && (
              <p className="movimentacao-observacoes">
                {movimentacao.observacoes}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ✅ Estado de loading - USANDO CLASSES DO FORMSMODAL
  const renderLoadingState = () => (
    <div className="modal-body">
      <div className="modal-loading-state">
        <div className="modal-loading-spinner"></div>
        <h3 className="empty-state-title">
          Carregando movimentações...
        </h3>
        <p className="empty-state-description">
          Buscando dados via RPC Supabase
        </p>
      </div>
    </div>
  );

  // ✅ Estado de erro - USANDO CLASSES DO FORMSMODAL
  const renderErrorState = () => (
    <div className="modal-body">
      <div className="empty-state">
        <div className="empty-state-icon" style={{ color: '#ef4444' }}>
          <AlertCircle size={32} />
        </div>
        <h3 className="empty-state-title" style={{ color: '#ef4444' }}>
          Erro ao carregar dados
        </h3>
        <p className="empty-state-description">
          {error}
        </p>
        
        {/* Informações de diagnóstico */}
        {debugInfo.length > 0 && (
          <div className="diagnostico-container">
            <div className="diagnostico-title">
              Diagnóstico das funções RPC:
            </div>
            {debugInfo.slice(0, 4).map((info, index) => (
              <div key={index} className="diagnostico-item">
                <span>{info.resultado ? '✅' : '❌'}</span>
                <span>
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

        <div className="error-actions">
          <button 
            onClick={handleRetry}
            disabled={loading}
            className="btn-retry"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Carregando...' : 'Tentar novamente'}
          </button>
          
          <button 
            onClick={diagnosticarRPC}
            className="btn-diagnose"
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
            className="btn-clear"
          >
            Limpar
          </button>
        </div>
      </div>
    </div>
  );

  if (!isOpen || !dia) return null;

  return (
    <div className="modal-overlay active" onClick={handleClose}>
      <div className="forms-modal-container detalhes-modal" onClick={handleContentClick}>
        {/* Header do Modal - USANDO CLASSES DO FORMSMODAL */}
        <div className="modal-header modal-header-gradient">
          <button onClick={handleClose} className="modal-close">
            <X size={20} />
          </button>
          
          <h2 className="modal-title">
            {dia?.data ? format(dia.data, 'dd \'de\' MMMM', { locale: ptBR }) : 'Detalhes do Dia'}
          </h2>
          <p className="modal-subtitle">
            {dia?.data ? format(dia.data, 'EEEE', { locale: ptBR }) : ''}
          </p>
          
          {/* Resumo do Dia - USANDO CLASSES DO FORMSMODAL */}
          {!loading && !error && (
            <div className="modal-header-resumo">
              <div className="modal-header-resumo-item">
                <p className="modal-header-resumo-label">Receitas</p>
                <p className="modal-header-resumo-valor">
                  {formatCurrency(resumoDia.total_receitas)}
                </p>
              </div>
              <div className="modal-header-resumo-item">
                <p className="modal-header-resumo-label">Despesas</p>
                <p className="modal-header-resumo-valor">
                  {formatCurrency(resumoDia.total_despesas)}
                </p>
              </div>
              <div className="modal-header-resumo-item">
                <p className="modal-header-resumo-label">Saldo</p>
                <p className="modal-header-resumo-valor">
                  {formatCurrency(resumoDia.saldo)}
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Conteúdo do Modal - USANDO CLASSES DO FORMSMODAL */}
        {loading ? (
          renderLoadingState()
        ) : error ? (
          renderErrorState()
        ) : movimentacoes.length === 0 ? (
          <div className="modal-body">
            <div className="empty-state">
              <div className="empty-state-icon">
                <Calendar size={32} />
              </div>
              <h3 className="empty-state-title">
                Nenhuma movimentação registrada
              </h3>
              <p className="empty-state-description">
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
          <div className="modal-body">
            {/* Cabeçalho da lista */}
            <div className="secao-header">
              <h3 className="secao-title">
                Movimentações ({resumoDia.total_transacoes || movimentacoes.length})
              </h3>
              <p className="secao-subtitle">
                {dia?.data ? format(dia.data, 'dd/MM/yyyy', { locale: ptBR }) : ''}
              </p>
            </div>
            
            {/* Lista de movimentações */}
            <div className="movimentacoes-lista">
              {movimentacoes.map((movimentacao, index) => (
                <MovimentacaoItem 
                  key={movimentacao.id || index} 
                  movimentacao={movimentacao} 
                />
              ))}
            </div>
            
            {/* Resumo adicional */}
            <div className="resumo-adicional">
              <div className="resumo-grid-4">
                <div className="resumo-coluna">
                  <p className="resumo-coluna-label">Total de Transações</p>
                  <p className="resumo-coluna-valor neutro">
                    {resumoDia.total_transacoes || movimentacoes.length}
                  </p>
                </div>
                <div className="resumo-coluna">
                  <p className="resumo-coluna-label">Receitas</p>
                  <p className="resumo-coluna-valor positive">
                    {formatCurrency(resumoDia.total_receitas)}
                  </p>
                </div>
                <div className="resumo-coluna">
                  <p className="resumo-coluna-label">Despesas</p>
                  <p className="resumo-coluna-valor negative">
                    {formatCurrency(resumoDia.total_despesas)}
                  </p>
                </div>
                <div className="resumo-coluna">
                  <p className="resumo-coluna-label">Resultado</p>
                  <p className={`resumo-coluna-valor ${resumoDia.saldo >= 0 ? 'positive' : 'negative'}`}>
                    {formatCurrency(resumoDia.saldo)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Footer do Modal - USANDO CLASSES DO FORMSMODAL */}
        <div className="modal-footer">
          <div className="modal-footer-info">
            {loading ? (
              'Carregando via RPC Supabase...'
            ) : error ? (
              'Erro ao carregar dados'
            ) : (
              <>
                {resumoDia.total_transacoes || movimentacoes.length} {((resumoDia.total_transacoes || movimentacoes.length) === 1 ? 'movimentação' : 'movimentações')} • 
                Saldo do dia: <span className={`modal-footer-saldo ${resumoDia.saldo >= 0 ? 'positive' : 'negative'}`}>
                  {formatCurrency(resumoDia.saldo)}
                </span>
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handleClose} className="btn-cancel">
              Fechar
            </button>
            <button
              onClick={() => {
                handleClose();
                window.location.href = '/transacoes';
              }}
              className="btn-primary"
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
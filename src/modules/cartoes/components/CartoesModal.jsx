// src/modules/cartoes/components/CartoesModal.jsx - VERSÃO CORRIGIDA BUG 002 e 003
import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { CreditCard, Plus, Archive, Trash2, X } from 'lucide-react';
import { useAuthStore } from '@modules/auth/store/authStore';
import { useUIStore } from '@store/uiStore';
import { supabase } from '@lib/supabaseClient';
import CartaoForm from '@modules/cartoes/components/CartaoForm';
import CartaoItem from '@modules/cartoes/components/CartaoItem';
import '@modules/cartoes/styles/CartoesModal.css';

/**
 * Modal para gerenciamento de cartões de crédito
 * ✅ CORREÇÃO BUG 002: Carregamento de contas antes de renderizar
 * ✅ CORREÇÃO BUG 003: Tratamento de erros melhorado + logs detalhados
 * ✅ CORREÇÃO BUG 004: Verificação de usuario_id na inserção
 */
const CartoesModal = ({ isOpen, onClose, onSave }) => {
  const { user } = useAuthStore();
  const { showNotification } = useUIStore();
  
  // Estados locais
  const [cartoes, setCartoes] = useState([]);
  const [contas, setContas] = useState([]); // ✅ CORREÇÃO BUG 002: Estado para contas
  const [cartoesAtivos, setCartoesAtivos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingContas, setLoadingContas] = useState(false); // ✅ Estado específico para contas
  const [modoFormulario, setModoFormulario] = useState(false);
  const [cartaoEditando, setCartaoEditando] = useState(null);
  const [feedback, setFeedback] = useState({ show: false, message: '', type: '' });
  const [confirmacao, setConfirmacao] = useState({ show: false, action: null, cartaoId: null, message: '' });
  
  // ✅ CORREÇÃO BUG 002: Carregar contas ANTES de exibir o modal
  const carregarContas = useCallback(async () => {
    if (!user) {
      console.log('🚫 carregarContas: Usuário não encontrado');
      return;
    }
    
    console.log('🏦 Iniciando carregamento de contas...');
    setLoadingContas(true);
    
    try {
      const { data, error } = await supabase
        .from('contas')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('ativo', true)
        .order('nome');
      
      if (error) {
        console.error('❌ Erro ao carregar contas:', error);
        throw error;
      }
      
      console.log('✅ Contas carregadas:', data?.length || 0, 'contas');
      setContas(data || []);
      
      return data || [];
    } catch (error) {
      console.error('❌ Erro crítico ao carregar contas:', error);
      showNotification('Erro ao carregar contas. Tente novamente.', 'error');
      return [];
    } finally {
      setLoadingContas(false);
    }
  }, [user, showNotification]);

  // Carregar cartões
  const carregarCartoes = useCallback(async () => {
    if (!user) {
      console.log('🚫 carregarCartoes: Usuário não encontrado');
      return;
    }
    
    console.log('💳 Iniciando carregamento de cartões...');
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('cartoes')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('ativo', true)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('❌ Erro ao carregar cartões:', error);
        throw error;
      }
      
      console.log('✅ Cartões carregados:', data?.length || 0, 'cartões');
      setCartoes(data || []);
      
      return data || [];
    } catch (error) {
      console.error('❌ Erro crítico ao carregar cartões:', error);
      showNotification('Erro ao carregar cartões. Tente novamente.', 'error');
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, showNotification]);

  // ✅ CORREÇÃO BUG 002: Carregar CONTAS e CARTÕES ao abrir modal
  useEffect(() => {
    if (isOpen && user) {
      console.log('🔓 Modal aberto, carregando dados...');
      Promise.all([
        carregarContas(),
        carregarCartoes()
      ]).then(() => {
        console.log('✅ Todos os dados carregados com sucesso');
      }).catch(error => {
        console.error('❌ Erro ao carregar dados iniciais:', error);
      });
    }
  }, [isOpen, user, carregarContas, carregarCartoes]);

  // Filtrar cartões ativos quando a lista muda
  useEffect(() => {
    if (cartoes) {
      setCartoesAtivos(cartoes.filter(cartao => cartao.ativo));
    }
  }, [cartoes]);
  
  // Se o modal não estiver aberto, não renderiza
  if (!isOpen) return null;
  
  // Função para exibir mensagem de feedback
  const showFeedback = (message, type = 'success') => {
    setFeedback({ show: true, message, type });
    setTimeout(() => {
      setFeedback({ show: false, message: '', type: '' });
    }, 3000);
  };
  
  // Abre o formulário de novo cartão
  const handleNovoCartao = () => {
    console.log('➕ Iniciando novo cartão...');
    setCartaoEditando(null);
    setModoFormulario(true);
  };
  
  // Abre o formulário para editar um cartão
  const handleEditarCartao = (cartao) => {
    console.log('✏️ Editando cartão:', cartao.id);
    setCartaoEditando(cartao);
    setModoFormulario(true);
  };
  
  // ✅ CORREÇÃO BUG 003: Salvar cartão com tratamento de erro MELHORADO
  const handleSalvarCartao = async (dadosCartao, criarNovo = false) => {
    console.log('💾 Iniciando salvamento de cartão...');
    console.log('📊 Dados recebidos:', dadosCartao);
    console.log('👤 Usuário atual:', user?.id);
    console.log('🔄 Modo edição:', Boolean(cartaoEditando));
    
    try {
      // ✅ VERIFICAÇÃO CRÍTICA: Garantir que usuario_id está presente
      if (!user?.id) {
        console.error('❌ ERRO CRÍTICO: usuario_id não encontrado');
        throw new Error('Usuário não autenticado. Faça login novamente.');
      }
      
      // ✅ PREPARAR DADOS com usuario_id GARANTIDO
      const dadosCompletos = {
        ...dadosCartao,
        usuario_id: user.id, // ✅ CORREÇÃO BUG 003: Garantir usuario_id
        ativo: true,
        updated_at: new Date().toISOString()
      };
      
      if (cartaoEditando) {
        console.log('📝 Atualizando cartão existente:', cartaoEditando.id);
        
        // Atualizar cartão existente
        const { data, error } = await supabase
          .from('cartoes')
          .update(dadosCompletos)
          .eq('id', cartaoEditando.id)
          .eq('usuario_id', user.id) // ✅ Dupla verificação de segurança
          .select();
        
        if (error) {
          console.error('❌ Erro do Supabase ao atualizar:', error);
          throw new Error(`Erro ao atualizar cartão: ${error.message} (Código: ${error.code})`);
        }
        
        console.log('✅ Cartão atualizado com sucesso:', data);
        showFeedback('Cartão atualizado com sucesso!');
        
      } else {
        console.log('➕ Criando novo cartão...');
        
        // ✅ ADICIONAR campos obrigatórios para INSERT
        const dadosInsert = {
          ...dadosCompletos,
          created_at: new Date().toISOString()
        };
        
        console.log('📤 Dados para inserção:', dadosInsert);
        
        // Adicionar novo cartão
        const { data, error } = await supabase
          .from('cartoes')
          .insert([dadosInsert])
          .select();
        
        if (error) {
          console.error('❌ Erro do Supabase ao inserir:', error);
          console.error('❌ Detalhes do erro:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          });
          throw new Error(`Erro ao criar cartão: ${error.message} (Código: ${error.code})`);
        }
        
        console.log('✅ Cartão criado com sucesso:', data);
        showFeedback('Cartão adicionado com sucesso!');
      }
      
      // ✅ Recarregar lista de cartões
      await carregarCartoes();
      
      // ✅ Notificar componente pai
      if (onSave) {
        console.log('📢 Notificando componente pai...');
        onSave();
      }
      
      // Se for para criar um novo logo em seguida, resetar apenas o cartão editando
      if (criarNovo) {
        console.log('🔄 Preparando para próximo cartão...');
        setCartaoEditando(null);
      } else {
        // Senão, sai do modo formulário
        console.log('✅ Finalizando e fechando formulário');
        setModoFormulario(false);
        setCartaoEditando(null);
      }
      
    } catch (error) {
      console.error('❌ Erro ao salvar cartão:', error);
      
      // ✅ CORREÇÃO BUG 003: Mensagem de erro mais específica
      let mensagemErro = 'Erro inesperado ao salvar cartão.';
      
      if (error.message.includes('usuario_id')) {
        mensagemErro = 'Erro de autenticação. Faça login novamente.';
      } else if (error.message.includes('unique')) {
        mensagemErro = 'Já existe um cartão com esses dados.';
      } else if (error.message.includes('not null')) {
        mensagemErro = 'Preencha todos os campos obrigatórios.';
      } else {
        mensagemErro = `Erro: ${error.message}`;
      }
      
      showFeedback(mensagemErro, 'error');
    }
  };
  
  // Pede confirmação para arquivar um cartão
  const handleArquivarCartao = (cartaoId) => {
    console.log('📦 Solicitando arquivamento do cartão:', cartaoId);
    setConfirmacao({
      show: true,
      action: 'arquivar',
      cartaoId,
      message: 'Tem certeza que deseja arquivar este cartão? Ele não aparecerá mais na lista, mas seus dados serão mantidos.'
    });
  };
  
  // Pede confirmação para excluir um cartão
  const handleExcluirCartao = (cartaoId) => {
    console.log('🗑️ Solicitando exclusão do cartão:', cartaoId);
    setConfirmacao({
      show: true,
      action: 'excluir',
      cartaoId,
      message: 'Tem certeza que deseja excluir este cartão? Esta ação não pode ser desfeita.'
    });
  };
  
  // Confirma a ação escolhida (arquivar ou excluir)
  const handleConfirmarAcao = async () => {
    console.log('✅ Confirmando ação:', confirmacao.action, 'para cartão:', confirmacao.cartaoId);
    
    try {
      const { action, cartaoId } = confirmacao;
      
      if (action === 'arquivar') {
        console.log('📦 Arquivando cartão...');
        
        // Arquivar cartão (mudar status para inativo)
        const { error } = await supabase
          .from('cartoes')
          .update({ 
            ativo: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', cartaoId)
          .eq('usuario_id', user.id); // ✅ Verificação de segurança
        
        if (error) {
          console.error('❌ Erro ao arquivar:', error);
          throw error;
        }
        
        showFeedback('Cartão arquivado com sucesso!');
        
      } else if (action === 'excluir') {
        console.log('🗑️ Excluindo cartão...');
        
        // Excluir cartão
        const { error } = await supabase
          .from('cartoes')
          .delete()
          .eq('id', cartaoId)
          .eq('usuario_id', user.id); // ✅ Verificação de segurança
        
        if (error) {
          console.error('❌ Erro ao excluir:', error);
          throw error;
        }
        
        showFeedback('Cartão excluído com sucesso!');
      }
      
      // ✅ Recarregar lista de cartões
      await carregarCartoes();
      
      // ✅ Notificar componente pai
      if (onSave) {
        onSave();
      }
      
      // Limpar estado de confirmação
      setConfirmacao({ show: false, action: null, cartaoId: null, message: '' });
      
    } catch (error) {
      console.error('❌ Erro ao executar ação:', error);
      showFeedback(`Erro ao ${confirmacao.action === 'arquivar' ? 'arquivar' : 'excluir'} cartão: ${error.message}`, 'error');
    }
  };
  
  // Cancela a ação de confirmação
  const handleCancelarConfirmacao = () => {
    console.log('❌ Cancelando confirmação');
    setConfirmacao({ show: false, action: null, cartaoId: null, message: '' });
  };
  
  // Conteúdo do modal (lista de cartões ou formulário)
  const renderConteudo = () => {
    // ✅ EXIBIR LOADING enquanto carrega dados essenciais
    if (loadingContas || (loading && cartoes.length === 0)) {
      return (
        <div className="cartoes-loading" style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          padding: '40px',
          gap: '16px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #f3f4f6',
            borderTop: '3px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: '#6b7280', margin: 0 }}>
            {loadingContas ? 'Carregando contas...' : 'Carregando cartões...'}
          </p>
        </div>
      );
    }
    
    if (modoFormulario) {
      // ✅ CORREÇÃO BUG 002: Passar contas carregadas para o formulário
      console.log('📋 Renderizando formulário com', contas.length, 'contas disponíveis');
      
      return (
        <CartaoForm 
          cartao={cartaoEditando}
          contas={contas} // ✅ CORREÇÃO BUG 002: Contas já carregadas
          onSave={handleSalvarCartao}
          onCancel={() => {
            console.log('❌ Cancelando formulário');
            setModoFormulario(false);
            setCartaoEditando(null);
          }}
        />
      );
    }
    
    // Lista de cartões
    return (
      <>
        <div className="cartoes-header">
          <h3>Meus Cartões de Crédito</h3>
          <button 
            className="btn-novo-cartao"
            onClick={handleNovoCartao}
            disabled={contas.length === 0} // ✅ Desabilitar se não há contas
          >
            <Plus size={18} />
            <span>Novo Cartão</span>
          </button>
        </div>
        
        {/* ✅ AVISO se não há contas cadastradas */}
        {contas.length === 0 && (
          <div style={{
            background: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '24px' }}>⚠️</span>
            <div>
              <div style={{ fontWeight: '600', color: '#92400e', marginBottom: '4px' }}>
                Nenhuma conta cadastrada
              </div>
              <div style={{ fontSize: '0.875rem', color: '#92400e' }}>
                Para criar cartões, você precisa ter pelo menos uma conta cadastrada para pagamento das faturas.
              </div>
            </div>
          </div>
        )}
        
        {loading ? (
          <div className="cartoes-loading">Carregando cartões...</div>
        ) : cartoesAtivos.length > 0 ? (
          <div className="cartoes-lista">
            {cartoesAtivos.map(cartao => (
              <CartaoItem 
                key={cartao.id}
                cartao={cartao}
                onEdit={() => handleEditarCartao(cartao)}
                onArchive={() => handleArquivarCartao(cartao.id)}
                onDelete={() => handleExcluirCartao(cartao.id)}
              />
            ))}
          </div>
        ) : (
          <div className="cartoes-empty">
            <CreditCard size={48} strokeWidth={1} />
            <p>Você ainda não tem cartões cadastrados</p>
            {contas.length > 0 ? (
              <button 
                className="btn-primary"
                onClick={handleNovoCartao}
              >
                <Plus size={18} />
                <span>Adicionar meu primeiro cartão</span>
              </button>
            ) : (
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '8px' }}>
                Cadastre uma conta primeiro para poder criar cartões.
              </p>
            )}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="cartoes-modal-overlay">
      <div className="cartoes-modal-container">
        {/* Cabeçalho do modal */}
        <div className="cartoes-modal-header">
          <h2>
            <CreditCard size={20} className="icon-header" />
            <span>Gerenciar Cartões de Crédito</span>
          </h2>
          <button 
            className="btn-fechar" 
            onClick={onClose}
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Conteúdo do modal */}
        <div className="cartoes-modal-content">
          {/* Feedback ao usuário */}
          {feedback.show && (
            <div className={`feedback-message ${feedback.type}`}>
              {feedback.message}
            </div>
          )}
          
          {/* Lista de cartões ou formulário */}
          {renderConteudo()}
        </div>
        
        {/* Rodapé do modal (apenas no modo lista) */}
        {!modoFormulario && (
          <div className="cartoes-modal-footer">
            <button 
              className="btn-fechar-modal" 
              onClick={onClose}
            >
              Fechar
            </button>
          </div>
        )}
        
        {/* Modal de confirmação (arquivar/excluir) */}
        {confirmacao.show && (
          <div className="confirmacao-overlay">
            <div className="confirmacao-container">
              <h3>Confirmar ação</h3>
              <p>{confirmacao.message}</p>
              <div className="confirmacao-actions">
                <button 
                  className="btn-secondary"
                  onClick={handleCancelarConfirmacao}
                >
                  Cancelar
                </button>
                <button 
                  className={`btn-primary ${confirmacao.action === 'excluir' ? 'btn-danger' : ''}`}
                  onClick={handleConfirmarAcao}
                >
                  {confirmacao.action === 'arquivar' ? 'Arquivar' : 'Excluir'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* ✅ Adicionar CSS para animação de loading */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

CartoesModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func
};

export default CartoesModal;
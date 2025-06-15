import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { CreditCard, Plus, Archive, Trash2, X, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '@modules/auth/store/authStore';
import { useUIStore } from '@store/uiStore';
import { supabase } from '@lib/supabaseClient';
import CartaoForm from '@modules/cartoes/components/CartaoForm';
import CartaoItem from '@modules/cartoes/components/CartaoItem';
import '@shared/styles/FormsModal.css';

/**
 * Modal para gerenciamento de cartões de crédito
 * Versão migrada para FormsModal.css
 */
const CartoesModal = ({ isOpen, onClose, onSave }) => {
  const { user } = useAuthStore();
  const { showNotification } = useUIStore();
  
  // Estados locais
  const [cartoes, setCartoes] = useState([]);
  const [contas, setContas] = useState([]);
  const [cartoesAtivos, setCartoesAtivos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingContas, setLoadingContas] = useState(false);
  const [modoFormulario, setModoFormulario] = useState(false);
  const [cartaoEditando, setCartaoEditando] = useState(null);
  const [confirmacao, setConfirmacao] = useState({ 
    show: false, 
    action: null, 
    cartaoId: null, 
    message: '',
    cartaoNome: ''
  });

  // Effect para controle da tecla ESC
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen && !confirmacao.show) {
        if (modoFormulario) {
          setModoFormulario(false);
          setCartaoEditando(null);
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, modoFormulario, confirmacao.show, onClose]);
  
  // Carregar contas
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

  // Carregar dados ao abrir modal
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
  
  // Salvar cartão
  const handleSalvarCartao = async (dadosCartao, criarNovo = false) => {
    console.log('💾 Iniciando salvamento de cartão...');
    console.log('📊 Dados recebidos:', dadosCartao);
    console.log('👤 Usuário atual:', user?.id);
    console.log('🔄 Modo edição:', Boolean(cartaoEditando));
    
    try {
      // Verificação crítica: Garantir que usuario_id está presente
      if (!user?.id) {
        console.error('❌ ERRO CRÍTICO: usuario_id não encontrado');
        throw new Error('Usuário não autenticado. Faça login novamente.');
      }
      
      // Preparar dados com usuario_id garantido
      const dadosCompletos = {
        ...dadosCartao,
        usuario_id: user.id,
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
          .eq('usuario_id', user.id)
          .select();
        
        if (error) {
          console.error('❌ Erro do Supabase ao atualizar:', error);
          throw new Error(`Erro ao atualizar cartão: ${error.message} (Código: ${error.code})`);
        }
        
        console.log('✅ Cartão atualizado com sucesso:', data);
        showNotification('Cartão atualizado com sucesso!', 'success');
        
      } else {
        console.log('➕ Criando novo cartão...');
        
        // Adicionar campos obrigatórios para INSERT
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
        showNotification('Cartão adicionado com sucesso!', 'success');
      }
      
      // Recarregar lista de cartões
      await carregarCartoes();
      
      // Notificar componente pai
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
      
      // Mensagem de erro mais específica
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
      
      showNotification(mensagemErro, 'error');
    }
  };
  
  // Pede confirmação para arquivar um cartão
  const handleArquivarCartao = (cartaoId) => {
    const cartao = cartoes.find(c => c.id === cartaoId);
    console.log('📦 Solicitando arquivamento do cartão:', cartaoId);
    setConfirmacao({
      show: true,
      action: 'arquivar',
      cartaoId,
      cartaoNome: cartao?.nome || 'Cartão',
      message: 'Tem certeza que deseja arquivar este cartão? Ele não aparecerá mais na lista, mas seus dados serão mantidos.'
    });
  };
  
  // Pede confirmação para excluir um cartão
  const handleExcluirCartao = (cartaoId) => {
    const cartao = cartoes.find(c => c.id === cartaoId);
    console.log('🗑️ Solicitando exclusão do cartão:', cartaoId);
    setConfirmacao({
      show: true,
      action: 'excluir',
      cartaoId,
      cartaoNome: cartao?.nome || 'Cartão',
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
          .eq('usuario_id', user.id);
        
        if (error) {
          console.error('❌ Erro ao arquivar:', error);
          throw error;
        }
        
        showNotification('Cartão arquivado com sucesso!', 'success');
        
      } else if (action === 'excluir') {
        console.log('🗑️ Excluindo cartão...');
        
        // Excluir cartão
        const { error } = await supabase
          .from('cartoes')
          .delete()
          .eq('id', cartaoId)
          .eq('usuario_id', user.id);
        
        if (error) {
          console.error('❌ Erro ao excluir:', error);
          throw error;
        }
        
        showNotification('Cartão excluído com sucesso!', 'success');
      }
      
      // Recarregar lista de cartões
      await carregarCartoes();
      
      // Notificar componente pai
      if (onSave) {
        onSave();
      }
      
      // Limpar estado de confirmação
      setConfirmacao({ show: false, action: null, cartaoId: null, message: '', cartaoNome: '' });
      
    } catch (error) {
      console.error('❌ Erro ao executar ação:', error);
      showNotification(`Erro ao ${confirmacao.action === 'arquivar' ? 'arquivar' : 'excluir'} cartão: ${error.message}`, 'error');
    }
  };
  
  // Cancela a ação de confirmação
  const handleCancelarConfirmacao = () => {
    console.log('❌ Cancelando confirmação');
    setConfirmacao({ show: false, action: null, cartaoId: null, message: '', cartaoNome: '' });
  };

  // Renderização do modal de confirmação
  const renderModalConfirmacao = () => {
    if (!confirmacao.show) return null;

    return (
      <div className="modal-overlay active">
        <div className="forms-modal-container modal-small">
          <div className="modal-header">
            <div className="modal-header-content">
              <div className={`modal-icon-container ${confirmacao.action === 'excluir' ? 'modal-icon-danger' : 'modal-icon-warning'}`}>
                {confirmacao.action === 'excluir' ? <Trash2 size={18} /> : <Archive size={18} />}
              </div>
              <div>
                <h2 className="modal-title">
                  {confirmacao.action === 'arquivar' ? 'Arquivar Cartão' : 'Excluir Cartão'}
                </h2>
                <p className="modal-subtitle">
                  {confirmacao.cartaoNome}
                </p>
              </div>
            </div>
          </div>

          <div className="modal-body">
            <div className="confirmation-message">
              {confirmacao.message}
            </div>
          </div>

          <div className="modal-footer">
            <button 
              className="btn-cancel"
              onClick={handleCancelarConfirmacao}
            >
              Cancelar
            </button>
            <button 
              className={`btn-secondary--${confirmacao.action === 'excluir' ? 'danger' : 'warning'}`}
              onClick={handleConfirmarAcao}
            >
              {confirmacao.action === 'arquivar' ? (
                <>
                  <Archive size={14} />
                  Arquivar
                </>
              ) : (
                <>
                  <Trash2 size={14} />
                  Excluir
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Conteúdo do modal (lista de cartões ou formulário)
  const renderConteudo = () => {
    // Exibir loading enquanto carrega dados essenciais
    if (loadingContas || (loading && cartoes.length === 0)) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">
            {loadingContas ? 'Carregando contas...' : 'Carregando cartões...'}
          </p>
        </div>
      );
    }
    
    if (modoFormulario) {
      // Renderizar formulário com contas carregadas
      console.log('📋 Renderizando formulário com', contas.length, 'contas disponíveis');
      
      return (
        <CartaoForm 
          isOpen={true}
          cartao={cartaoEditando}
          contas={contas}
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
        {/* Aviso se não há contas cadastradas */}
        {contas.length === 0 && (
          <div className="summary-panel warning mb-3">
            <div className="summary-header">
              <AlertTriangle size={16} />
              <strong>Nenhuma conta cadastrada</strong>
            </div>
            <p className="summary-value" style={{ fontSize: '14px', margin: '8px 0 0 0' }}>
              Para criar cartões, você precisa ter pelo menos uma conta cadastrada para pagamento das faturas.
            </p>
          </div>
        )}
        
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Carregando cartões...</p>
          </div>
        ) : cartoesAtivos.length > 0 ? (
          <>
            <div className="controls-container mb-3">
              <div className="summary-stats">
                <div className="stat-item">
                  <div className="stat-label">Total de Cartões</div>
                  <div className="stat-value">{cartoesAtivos.length}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Limite Total</div>
                  <div className="stat-value positive">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(cartoesAtivos.reduce((total, cartao) => total + (cartao.limite || 0), 0))}
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Contas Vinculadas</div>
                  <div className="stat-value">{contas.length}</div>
                </div>
              </div>
              <button 
                className="btn-primary"
                onClick={handleNovoCartao}
                disabled={contas.length === 0}
              >
                <Plus size={16} />
                Novo Cartão
              </button>
            </div>
            
            <div className="account-list">
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
          </>
        ) : (
          <div className="empty-state">
            <CreditCard size={48} className="empty-state-icon" />
            <h3 className="empty-state-title">Nenhum cartão cadastrado</h3>
            <p className="empty-state-description">
              {contas.length > 0 
                ? 'Adicione seu primeiro cartão de crédito para começar a gerenciar suas faturas.'
                : 'Cadastre uma conta primeiro para poder criar cartões.'
              }
            </p>
            {contas.length > 0 && (
              <button 
                className="btn-primary"
                onClick={handleNovoCartao}
              >
                <Plus size={16} />
                Adicionar meu primeiro cartão
              </button>
            )}
          </div>
        )}
      </>
    );
  };

  return (
    <>
      <div className="modal-overlay active">
        <div className="forms-modal-container">
          {/* CABEÇALHO */}
          <div className="modal-header">
            <div className="modal-header-content">
              <div className="modal-icon-container modal-icon-purple">
                <CreditCard size={18} />
              </div>
              <div>
                <h2 className="modal-title">Gerenciar Cartões</h2>
                <p className="modal-subtitle">
                  {modoFormulario 
                    ? (cartaoEditando ? 'Editando cartão existente' : 'Cadastrando novo cartão')
                    : `${cartoesAtivos.length} cartão${cartoesAtivos.length !== 1 ? 'ões' : ''} cadastrado${cartoesAtivos.length !== 1 ? 's' : ''}`
                  }
                </p>
              </div>
            </div>
            <button className="modal-close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          {/* CORPO */}
          <div className="modal-body">
            {renderConteudo()}
          </div>

          {/* RODAPÉ - apenas no modo lista */}
          {!modoFormulario && (
            <div className="modal-footer">
              <button 
                className="btn-cancel"
                onClick={onClose}
              >
                Fechar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmação */}
      {renderModalConfirmacao()}
    </>
  );
};

CartoesModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func
};

export default CartoesModal;
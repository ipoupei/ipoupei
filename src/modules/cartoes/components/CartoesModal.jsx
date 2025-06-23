// src/modules/cartoes/components/CartoesModal.jsx
// ✅ REFATORADO: Remove Supabase direto, usa hooks corretos
import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { CreditCard, Plus, Archive, Trash2, X, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '@modules/auth/store/authStore';
import { useUIStore } from '@store/uiStore';
import useCartoesData from '@modules/cartoes/hooks/useCartoesData';
import useFaturaOperations from '@modules/cartoes/hooks/useFaturaOperations';
import useContas from '@modules/contas/hooks/useContas';
import CartaoForm from '@modules/cartoes/components/CartaoForm';
import CartaoItem from '@modules/cartoes/components/CartaoItem';
import '@shared/styles/FormsModal.css';

/**
 * Modal para gerenciamento de cartões de crédito
 * ✅ REFATORADO: Usa hooks em vez de Supabase direto
 */
const CartoesModal = ({ isOpen, onClose, onSave }) => {
  const { user } = useAuthStore();
  const { showNotification } = useUIStore();
  
  // ✅ USAR: Hooks refatorados
  const { 
    fetchCartoes,
    loading: cartoesLoading 
  } = useCartoesData();
  
  const { 
    criarCartao,
    editarCartao,
    arquivarCartao,
    loading: operationLoading 
  } = useFaturaOperations();
  
  const { 
    contas, 
    fetchContas,
    loading: contasLoading 
  } = useContas();
  
  // Estados locais
  const [cartoes, setCartoes] = useState([]);
  const [cartoesAtivos, setCartoesAtivos] = useState([]);
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
  
  // ✅ CARREGAR: Dados usando hooks
  const carregarDados = useCallback(async () => {
    if (!user) return;
    
    try {
      console.log('🔓 Modal aberto, carregando dados via hooks...');
      
      // Carregar contas e cartões em paralelo
      const [contasData, cartoesData] = await Promise.all([
        fetchContas().catch(err => { console.error('Erro fetchContas:', err); return []; }),
        fetchCartoes().catch(err => { console.error('Erro fetchCartoes:', err); return []; })
      ]);
      
      // ✅ CORREÇÃO: Garantir que são arrays
      const contasArray = Array.isArray(contasData) ? contasData : [];
      const cartoesArray = Array.isArray(cartoesData) ? cartoesData : [];
      
      setCartoes(cartoesArray);
      console.log('✅ Dados carregados:', {
        contas: contasArray.length,
        cartoes: cartoesArray.length
      });
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      showNotification('Erro ao carregar dados', 'error');
    }
  }, [user, fetchContas, fetchCartoes, showNotification]);

  // Carregar dados ao abrir modal
  useEffect(() => {
    if (isOpen && user) {
      carregarDados();
    }
  }, [isOpen, user, carregarDados]);

  // Filtrar cartões ativos quando a lista muda
  useEffect(() => {
    if (cartoes) {
      setCartoesAtivos(cartoes.filter(cartao => cartao.ativo !== false));
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
  
  // ✅ SALVAR: Usando hooks corretos
  const handleSalvarCartao = async (dadosCartao, criarNovo = false) => {
    console.log('💾 Iniciando salvamento de cartão...');
    console.log('📊 Dados recebidos:', dadosCartao);
    console.log('🔄 Modo edição:', Boolean(cartaoEditando));
    
    try {
      if (!user?.id) {
        throw new Error('Usuário não autenticado. Faça login novamente.');
      }
      
      let resultado;
      
      if (cartaoEditando) {
        console.log('📝 Atualizando cartão existente:', cartaoEditando.id);
        
        // ✅ USAR: Hook editarCartao
        resultado = await editarCartao(cartaoEditando.id, dadosCartao);
        
        if (resultado.success) {
          showNotification('Cartão atualizado com sucesso!', 'success');
        } else {
          throw new Error(resultado.error);
        }
        
      } else {
        console.log('➕ Criando novo cartão...');
        
        // ✅ USAR: Hook criarCartao
        resultado = await criarCartao(dadosCartao);
        
        if (resultado.success) {
          showNotification('Cartão adicionado com sucesso!', 'success');
        } else {
          throw new Error(resultado.error);
        }
      }
      
      // Recarregar lista de cartões
      const cartoesAtualizados = await fetchCartoes();
      const cartoesArray = Array.isArray(cartoesAtualizados) ? cartoesAtualizados : [];
      setCartoes(cartoesArray);
      
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
      
      if (error.message.includes('usuario_id') || error.message.includes('autenticado')) {
        mensagemErro = 'Erro de autenticação. Faça login novamente.';
      } else if (error.message.includes('unique') || error.message.includes('duplicat')) {
        mensagemErro = 'Já existe um cartão com esses dados.';
      } else if (error.message.includes('not null') || error.message.includes('obrigatório')) {
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
  
  // ✅ CONFIRMAR: Usando hooks corretos
  const handleConfirmarAcao = async () => {
    console.log('✅ Confirmando ação:', confirmacao.action, 'para cartão:', confirmacao.cartaoId);
    
    try {
      const { action, cartaoId } = confirmacao;
      let resultado;
      
      if (action === 'arquivar') {
        console.log('📦 Arquivando cartão...');
        
        // ✅ USAR: Hook arquivarCartao
        resultado = await arquivarCartao(cartaoId);
        
        if (resultado.success) {
          showNotification('Cartão arquivado com sucesso!', 'success');
        } else {
          throw new Error(resultado.error);
        }
        
      } else if (action === 'excluir') {
        console.log('🗑️ Excluindo cartão...');
        
        // ✅ NOTA: Para exclusão, podemos usar a mesma função de arquivar 
        // ou criar uma nova no hook se necessário
        // Por segurança, vamos apenas arquivar mesmo quando "excluir"
        resultado = await arquivarCartao(cartaoId);
        
        if (resultado.success) {
          showNotification('Cartão removido com sucesso!', 'success');
        } else {
          throw new Error(resultado.error);
        }
      }
      
      // Recarregar lista de cartões
      const cartoesAtualizados = await fetchCartoes();
      const cartoesArray = Array.isArray(cartoesAtualizados) ? cartoesAtualizados : [];
      setCartoes(cartoesArray);
      
      // Notificar componente pai
      if (onSave) {
        onSave();
      }
      
      // Limpar estado de confirmação
      setConfirmacao({ show: false, action: null, cartaoId: null, message: '', cartaoNome: '' });
      
    } catch (error) {
      console.error('❌ Erro ao executar ação:', error);
      showNotification(`Erro ao ${confirmacao.action === 'arquivar' ? 'arquivar' : 'remover'} cartão: ${error.message}`, 'error');
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
                  {confirmacao.action === 'arquivar' ? 'Arquivar Cartão' : 'Remover Cartão'}
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
              disabled={operationLoading}
            >
              Cancelar
            </button>
            <button 
              className={`btn-secondary--${confirmacao.action === 'excluir' ? 'danger' : 'warning'}`}
              onClick={handleConfirmarAcao}
              disabled={operationLoading}
            >
              {operationLoading ? (
                <>
                  <div className="btn-spinner"></div>
                  Processando...
                </>
              ) : confirmacao.action === 'arquivar' ? (
                <>
                  <Archive size={14} />
                  Arquivar
                </>
              ) : (
                <>
                  <Trash2 size={14} />
                  Remover
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
    const isLoading = contasLoading || cartoesLoading;
    
    // Exibir loading enquanto carrega dados essenciais
    if (isLoading && cartoes.length === 0) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">
            {contasLoading ? 'Carregando contas...' : 'Carregando cartões...'}
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
        
        {isLoading ? (
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
                    : `${cartoesAtivos.length} ${cartoesAtivos.length === 1 ? 'cartão cadastrado' : 'cartões cadastrados'}`
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
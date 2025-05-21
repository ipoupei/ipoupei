import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { CreditCard, Plus, Archive, Trash2, X } from 'lucide-react';
import useCartoes from '../hooks/useCartoes';
import useContas from '../hooks/useContas';
import CartaoForm from './CartaoForm';
import CartaoItem from './CartaoItem';
import './CartoesModal.css';

/**
 * Modal para gerenciamento de cartões de crédito
 * Permite cadastrar, visualizar e excluir cartões
 * 
 * @param {Object} props - Propriedades do componente
 * @param {boolean} props.isOpen - Define se o modal está aberto
 * @param {Function} props.onClose - Função para fechar o modal
 */
const CartoesModal = ({ isOpen, onClose }) => {
  // Hooks para cartões e contas
  const { cartoes, loading, addCartao, updateCartao, deleteCartao } = useCartoes();
  const { contas } = useContas();
  
  // Estados locais
  const [cartoesAtivos, setCartoesAtivos] = useState([]);
  const [modoFormulario, setModoFormulario] = useState(false);
  const [cartaoEditando, setCartaoEditando] = useState(null);
  const [feedback, setFeedback] = useState({ show: false, message: '', type: '' });
  const [confirmacao, setConfirmacao] = useState({ show: false, action: null, cartaoId: null, message: '' });
  
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
    setCartaoEditando(null);
    setModoFormulario(true);
  };
  
  // Abre o formulário para editar um cartão
  const handleEditarCartao = (cartao) => {
    setCartaoEditando(cartao);
    setModoFormulario(true);
  };
  
  // Salva um novo cartão ou atualiza um existente
  const handleSalvarCartao = async (dadosCartao, criarNovo = false) => {
    try {
      if (cartaoEditando) {
        // Atualizar cartão existente
        await updateCartao(cartaoEditando.id, dadosCartao);
        showFeedback('Cartão atualizado com sucesso!');
      } else {
        // Adicionar novo cartão
        await addCartao(dadosCartao);
        showFeedback('Cartão adicionado com sucesso!');
      }
      
      // Se for para criar um novo logo em seguida, resetar apenas o cartão editando
      if (criarNovo) {
        setCartaoEditando(null);
      } else {
        // Senão, sai do modo formulário
        setModoFormulario(false);
        setCartaoEditando(null);
      }
    } catch (error) {
      console.error('Erro ao salvar cartão:', error);
      showFeedback('Erro ao salvar cartão. Tente novamente.', 'error');
    }
  };
  
  // Pede confirmação para arquivar um cartão
  const handleArquivarCartao = (cartaoId) => {
    setConfirmacao({
      show: true,
      action: 'arquivar',
      cartaoId,
      message: 'Tem certeza que deseja arquivar este cartão? Ele não aparecerá mais na lista, mas seus dados serão mantidos.'
    });
  };
  
  // Pede confirmação para excluir um cartão
  const handleExcluirCartao = (cartaoId) => {
    setConfirmacao({
      show: true,
      action: 'excluir',
      cartaoId,
      message: 'Tem certeza que deseja excluir este cartão? Esta ação não pode ser desfeita.'
    });
  };
  
  // Confirma a ação escolhida (arquivar ou excluir)
  const handleConfirmarAcao = async () => {
    try {
      const { action, cartaoId } = confirmacao;
      
      if (action === 'arquivar') {
        // Arquivar cartão (mudar status para inativo)
        await updateCartao(cartaoId, { ativo: false });
        showFeedback('Cartão arquivado com sucesso!');
      } else if (action === 'excluir') {
        // Excluir cartão
        await deleteCartao(cartaoId);
        showFeedback('Cartão excluído com sucesso!');
      }
      
      // Limpar estado de confirmação
      setConfirmacao({ show: false, action: null, cartaoId: null, message: '' });
    } catch (error) {
      console.error('Erro ao executar ação:', error);
      showFeedback(`Erro ao ${confirmacao.action === 'arquivar' ? 'arquivar' : 'excluir'} cartão. Tente novamente.`, 'error');
    }
  };
  
  // Cancela a ação de confirmação
  const handleCancelarConfirmacao = () => {
    setConfirmacao({ show: false, action: null, cartaoId: null, message: '' });
  };
  
  // Conteúdo do modal (lista de cartões ou formulário)
  const renderConteudo = () => {
    if (modoFormulario) {
      // Formulário de cartão (novo ou edição)
      return (
        <CartaoForm 
          cartao={cartaoEditando}
          contas={contas}
          onSave={handleSalvarCartao}
          onCancel={() => {
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
          >
            <Plus size={18} />
            <span>Novo Cartão</span>
          </button>
        </div>
        
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
            <button 
              className="btn-primary"
              onClick={handleNovoCartao}
            >
              <Plus size={18} />
              <span>Adicionar meu primeiro cartão</span>
            </button>
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
    </div>
  );
};

CartoesModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default CartoesModal;
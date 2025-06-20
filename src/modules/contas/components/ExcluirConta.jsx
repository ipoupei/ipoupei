import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  AlertTriangle, 
  Download, 
  Shield, 
  Clock, 
  CheckCircle, 
  XCircle,
  FileText,
  UserX
} from 'lucide-react';

// Mock do hook para demonstração
const mockUseDeleteAccount = () => ({
  loading: false,
  error: null,
  backupData: {
    contas: [{ id: 1, nome: 'Conta Corrente' }, { id: 2, nome: 'Poupança' }],
    cartoes: [{ id: 1, nome: 'Visa' }],
    transacoes: Array(150).fill().map((_, i) => ({ id: i })),
    categorias: [{ id: 1, nome: 'Alimentação' }, { id: 2, nome: 'Transporte' }],
    dividas: [],
    amigos: [{ id: 1, nome: 'João' }]
  },
  generateBackup: async () => ({ success: true }),
  downloadBackup: () => true,
  validateDeletion: async () => ({ 
    success: true, 
    issues: [
      {
        type: 'warning',
        title: 'Transações pendentes',
        message: 'Você possui 3 transações futuras agendadas que serão perdidas.'
      },
      {
        type: 'error',
        title: 'Relacionamentos ativos',
        message: 'Existe 1 relacionamento ativo que precisa ser resolvido antes da exclusão.'
      }
    ]
  }),
  deleteAccount: async () => ({ success: true }),
  deactivateAccount: async () => ({ success: true })
});

const mockUseAuth = () => ({
  user: { id: '123', email: 'usuario@exemplo.com' }
});

/**
 * Modal de Confirmação Básico usando FormsModal.css
 */
const BasicModal = ({ isOpen, onClose, title, children, variant = 'warning' }) => {
  if (!isOpen) return null;

  const getIconVariant = () => {
    switch (variant) {
      case 'danger': return 'modal-icon-danger';
      case 'warning': return 'modal-icon-warning';
      case 'success': return 'modal-icon-success';
      case 'info': return 'modal-icon-primary';
      default: return 'modal-icon-warning';
    }
  };

  const getIcon = () => {
    switch (variant) {
      case 'danger': return '⚠️';
      case 'warning': return '⚠️';
      case 'success': return '✅';
      case 'info': return 'ℹ️';
      default: return '⚠️';
    }
  };

  return (
    <div className="modal-overlay active">
      <div className="forms-modal-container">
        <div className="modal-header">
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
          <div className="modal-header-content">
            <div className={`modal-icon-container ${getIconVariant()}`}>
              {getIcon()}
            </div>
            <div>
              <h2 className="modal-title">{title}</h2>
            </div>
          </div>
        </div>
        
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

/**
 * Componente para exclusão de conta - REFATORADO COM FORMSMODAL.CSS
 */
const ExcluirConta = () => {
  const { user } = mockUseAuth();
  const {
    loading,
    error,
    backupData,
    generateBackup,
    downloadBackup,
    validateDeletion,
    deleteAccount,
    deactivateAccount
  } = mockUseDeleteAccount();

  // Estados locais
  const [currentStep, setCurrentStep] = useState(1);
  const [validationIssues, setValidationIssues] = useState([]);
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deletionType, setDeletionType] = useState('delete');
  const [message, setMessage] = useState({ type: '', text: '' });

  // Limpa mensagens após 5 segundos
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Gera backup dos dados
  const handleGenerateBackup = async () => {
    const result = await generateBackup();
    if (result.success) {
      setMessage({
        type: 'success',
        text: 'Backup gerado com sucesso! Você pode baixá-lo agora.'
      });
      setCurrentStep(2);
    } else {
      setMessage({
        type: 'error',
        text: result.error || 'Erro ao gerar backup'
      });
    }
  };

  // Baixa o backup
  const handleDownloadBackup = () => {
    const success = downloadBackup();
    if (success) {
      setMessage({
        type: 'success',
        text: 'Backup baixado com sucesso!'
      });
    }
  };

  // Valida se pode excluir
  const handleValidateDeletion = async () => {
    const result = await validateDeletion();
    if (result.success) {
      setValidationIssues(result.issues || []);
      setCurrentStep(3);
    } else {
      setMessage({
        type: 'error',
        text: result.error || 'Erro ao validar exclusão'
      });
    }
  };

  // Processa exclusão
  const handleDeleteAccount = async () => {
    if (confirmText !== 'EXCLUIR MINHA CONTA') {
      setMessage({
        type: 'error',
        text: 'Digite exatamente "EXCLUIR MINHA CONTA" para confirmar'
      });
      return;
    }

    const result = await deleteAccount(password, confirmText);
    if (result.success) {
      setMessage({
        type: 'success',
        text: 'Conta excluída com sucesso. Você será desconectado.'
      });
      setShowDeleteModal(false);
    } else {
      setMessage({
        type: 'error',
        text: result.error || 'Erro ao excluir conta'
      });
    }
  };

  // Processa desativação
  const handleDeactivateAccount = async () => {
    const result = await deactivateAccount();
    if (result.success) {
      setMessage({
        type: 'success',
        text: 'Conta desativada com sucesso. Você pode reativá-la fazendo login novamente.'
      });
      setShowDeactivateModal(false);
    } else {
      setMessage({
        type: 'error',
        text: result.error || 'Erro ao desativar conta'
      });
    }
  };

  // Renderiza o passo atual
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="modal-body">
            <div className="text-center mb-3">
              <AlertTriangle size={64} color="#ef4444" />
              <h3 className="section-title">Exclusão de Conta</h3>
              <p className="text-muted">
                Esta ação é irreversível. Todos os seus dados serão permanentemente removidos.
              </p>
            </div>

            <div className="summary-panel danger">
              <h4 className="summary-title">O que será excluído:</h4>
              <div>
                <p className="mb-1">• Todas as suas transações e histórico financeiro</p>
                <p className="mb-1">• Contas bancárias e cartões de crédito cadastrados</p>
                <p className="mb-1">• Categorias personalizadas e configurações</p>
                <p className="mb-1">• Relacionamentos com amigos e familiares</p>
                <p className="mb-1">• Dados do perfil e preferências</p>
                <p className="mb-0">• Acesso ao aplicativo e aos dados</p>
              </div>
            </div>

            <div className="summary-panel">
              <h4 className="summary-title">Antes de prosseguir:</h4>
              <div>
                <p className="mb-1">• Faça um backup dos seus dados importantes</p>
                <p className="mb-1">• Quite todas as dívidas pendentes</p>
                <p className="mb-1">• Informe amigos sobre transações compartilhadas</p>
                <p className="mb-0">• Considere desativar temporariamente ao invés de excluir</p>
              </div>
            </div>

            <button
              className={`btn-primary ${loading ? 'disabled' : ''}`}
              onClick={handleGenerateBackup}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="btn-spinner"></span>
                  Gerando...
                </>
              ) : (
                'Gerar Backup dos Dados'
              )}
            </button>
          </div>
        );

      case 2:
        return (
          <div className="modal-body">
            <div className="text-center mb-3">
              <FileText size={64} color="#3b82f6" />
              <h3 className="section-title">Backup Gerado</h3>
              <p className="text-muted">
                Seus dados foram compilados em um arquivo de backup.
              </p>
            </div>

            {backupData && (
              <div className="summary-panel success">
                <h4 className="summary-title">Backup inclui:</h4>
                <div>
                  {backupData.contas && (
                    <p className="mb-1">• {backupData.contas.length} conta(s) bancária(s)</p>
                  )}
                  {backupData.cartoes && (
                    <p className="mb-1">• {backupData.cartoes.length} cartão(ões) de crédito</p>
                  )}
                  {backupData.transacoes && (
                    <p className="mb-1">• {backupData.transacoes.length} transação(ões)</p>
                  )}
                  {backupData.categorias && (
                    <p className="mb-1">• {backupData.categorias.length} categoria(s)</p>
                  )}
                  {backupData.dividas && (
                    <p className="mb-1">• {backupData.dividas.length} dívida(s)</p>
                  )}
                  {backupData.amigos && (
                    <p className="mb-0">• {backupData.amigos.length} relacionamento(s)</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                className="btn-secondary"
                onClick={handleDownloadBackup}
                disabled={!backupData}
              >
                <Download size={16} /> Baixar Backup
              </button>
              <button
                className={`btn-primary ${loading ? 'disabled' : ''}`}
                onClick={handleValidateDeletion}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="btn-spinner"></span>
                    Validando...
                  </>
                ) : (
                  'Continuar'
                )}
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="modal-body">
            <div className="text-center mb-3">
              <Shield size={64} color="#f59e0b" />
              <h3 className="section-title">Validação de Exclusão</h3>
              <p className="text-muted">
                Verificamos sua conta e encontramos os seguintes pontos de atenção:
              </p>
            </div>

            {validationIssues.length > 0 ? (
              <div className="mb-3">
                {validationIssues.map((issue, index) => (
                  <div 
                    key={index}
                    className={`summary-panel ${issue.type === 'warning' ? 'warning' : 'danger'} mb-2`}
                  >
                    <div className="flex gap-2">
                      <AlertTriangle size={20} color={issue.type === 'warning' ? '#f59e0b' : '#ef4444'} />
                      <div>
                        <h4 className="summary-title mb-1">
                          {issue.title}
                        </h4>
                        <p className="text-muted mb-0">
                          {issue.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="summary-panel success mb-3">
                <div className="flex gap-2">
                  <CheckCircle size={20} color="#16a34a" />
                  <p className="mb-0">
                    Sua conta está pronta para ser excluída sem problemas.
                  </p>
                </div>
              </div>
            )}

            <div className="summary-panel mb-3">
              <h4 className="summary-title">Alternativas à exclusão:</h4>
              <button
                onClick={() => setShowDeactivateModal(true)}
                className="account-card"
              >
                <div className="account-icon" style={{ backgroundColor: '#f59e0b', color: 'white' }}>
                  <Clock size={18} />
                </div>
                <div className="account-info">
                  <h4 className="account-name">Desativar temporariamente</h4>
                  <p className="account-type">Suspende sua conta mas mantém os dados para reativação futura</p>
                </div>
              </button>
            </div>

            <div className="flex gap-2">
              <button
                className="btn-secondary"
                onClick={() => setCurrentStep(2)}
              >
                Voltar
              </button>
              <button
                className="btn-secondary--danger"
                onClick={() => setShowDeleteModal(true)}
              >
                Prosseguir com Exclusão
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="forms-modal-container modal-large">
      {/* Header com progresso */}
      <div className="modal-header">
        <div className="modal-header-content">
          <div className="modal-icon-container modal-icon-danger">
            <UserX size={20} />
          </div>
          <div>
            <h2 className="modal-title">Exclusão de Conta</h2>
            <p className="modal-subtitle">
              Etapa {currentStep} de 3 - {Math.round((currentStep / 3) * 100)}% concluído
            </p>
          </div>
        </div>
        
        {/* Barra de progresso */}
        <div className="summary-panel mt-2">
          <div className="progress-bar-bg">
            <div 
              className="progress-bar-fill"
              style={{ 
                width: `${(currentStep / 3) * 100}%`,
                height: '6px',
                backgroundColor: '#008080',
                borderRadius: '3px',
                transition: 'width 0.3s ease'
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Mensagens de feedback */}
      {message.text && (
        <div className={`summary-panel ${message.type === 'success' ? 'success' : 'danger'}`}>
          <div className="flex gap-2">
            {message.type === 'success' ? (
              <CheckCircle size={18} />
            ) : (
              <XCircle size={18} />
            )}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      {/* Erro geral */}
      {error && (
        <div className="summary-panel danger">
          <XCircle size={18} className="mr-2" />
          {error}
        </div>
      )}

      {/* Conteúdo da etapa atual */}
      {renderStep()}

      {/* Modal de Confirmação de Exclusão */}
      <BasicModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirmar Exclusão"
        variant="danger"
      >
        <div className="flex flex-col gap-3">
          <div className="summary-panel danger">
            <p className="mb-0">
              Esta ação é irreversível. Todos os seus dados serão permanentemente excluídos.
            </p>
          </div>

          <div>
            <label className="form-label">
              Digite exatamente: <strong>EXCLUIR MINHA CONTA</strong>
            </label>
            <input
              className="input-text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="EXCLUIR MINHA CONTA"
              style={{ fontFamily: 'monospace' }}
            />
          </div>

          <div className="modal-footer">
            <button
              className="btn-cancel"
              onClick={() => setShowDeleteModal(false)}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              className={`btn-secondary--danger ${loading || confirmText !== 'EXCLUIR MINHA CONTA' ? 'disabled' : ''}`}
              onClick={handleDeleteAccount}
              disabled={loading || confirmText !== 'EXCLUIR MINHA CONTA'}
            >
              {loading ? (
                <>
                  <span className="btn-spinner"></span>
                  Excluindo...
                </>
              ) : (
                'Excluir Conta Permanentemente'
              )}
            </button>
          </div>
        </div>
      </BasicModal>

      {/* Modal de Desativação */}
      <BasicModal
        isOpen={showDeactivateModal}
        onClose={() => setShowDeactivateModal(false)}
        title="Desativar Conta Temporariamente"
        variant="warning"
      >
        <div className="flex flex-col gap-3">
          <div className="summary-panel">
            <p className="mb-0">
              Sua conta será desativada, mas seus dados ficarão salvos. 
              Você pode reativar a qualquer momento fazendo login novamente.
            </p>
          </div>

          <div className="modal-footer">
            <button
              className="btn-cancel"
              onClick={() => setShowDeactivateModal(false)}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              className={`btn-secondary--warning ${loading ? 'disabled' : ''}`}
              onClick={handleDeactivateAccount}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="btn-spinner"></span>
                  Desativando...
                </>
              ) : (
                'Desativar Conta'
              )}
            </button>
          </div>
        </div>
      </BasicModal>
    </div>
  );
};

// Componente demonstrativo
const ExemploExclusaoConta = () => {
  const [modalAberto, setModalAberto] = useState(false);

  return (
    <div style={{ padding: '20px', fontFamily: 'Roboto, sans-serif' }}>
      <h1>Demonstração - Modal Exclusão de Conta</h1>
      
      <button 
        className="btn-secondary--danger"
        onClick={() => setModalAberto(true)}
      >
        🗑️ Excluir Conta
      </button>

      {modalAberto && (
        <div className="modal-overlay active">
          <ExcluirConta />
          <button 
            className="modal-close" 
            onClick={() => setModalAberto(false)}
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              zIndex: 1001,
              background: 'rgba(0,0,0,0.5)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default ExemploExclusaoConta;
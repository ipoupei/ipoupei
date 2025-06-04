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
import useDeleteAccount from '@modules/auth/hooks/useDeleteAccount';
import useAuth from '@/modules/auth/hooks/useAuth';
import Card from '@shared/components/ui/Card';
import Input from '@shared/components/ui/Input';
import Button from '@shared/components/ui/Button';
import BasicModal from '@shared/components/ui/ModalBase';


/**
 * Componente para exclusão de conta - VERSÃO COM FORMATAÇÃO CORRIGIDA
 * Processo completo com backup, validações e confirmações
 */
const ExcluirConta = () => {
  const { user } = useAuth();
  const {
    loading,
    error,
    backupData,
    generateBackup,
    downloadBackup,
    validateDeletion,
    deleteAccount,
    deactivateAccount
  } = useDeleteAccount();

  // Estados locais
  const [currentStep, setCurrentStep] = useState(1); // 1: Info, 2: Backup, 3: Validação, 4: Confirmação
  const [validationIssues, setValidationIssues] = useState([]);
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deletionType, setDeletionType] = useState('delete'); // 'delete' ou 'deactivate'
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
          <div className="delete-step-container">
            <div className="step-icon-container">
              <AlertTriangle size={64} style={{ color: '#ef4444', marginBottom: '1rem' }} />
              <h3 className="step-title">Exclusão de Conta</h3>
              <p className="step-description">
                Esta ação é irreversível. Todos os seus dados serão permanentemente removidos.
              </p>
            </div>

            <div className="warning-box">
              <h4 className="warning-title">O que será excluído:</h4>
              <ul className="warning-list">
                <li>• Todas as suas transações e histórico financeiro</li>
                <li>• Contas bancárias e cartões de crédito cadastrados</li>
                <li>• Categorias personalizadas e configurações</li>
                <li>• Relacionamentos com amigos e familiares</li>
                <li>• Dados do perfil e preferências</li>
                <li>• Acesso ao aplicativo e aos dados</li>
              </ul>
            </div>

            <div className="info-box">
              <h4 className="info-title">Antes de prosseguir:</h4>
              <ul className="info-list">
                <li>• Faça um backup dos seus dados importantes</li>
                <li>• Quite todas as dívidas pendentes</li>
                <li>• Informe amigos sobre transações compartilhadas</li>
                <li>• Considere desativar temporariamente ao invés de excluir</li>
              </ul>
            </div>

            <div className="button-group">
              <Button
                variant="primary"
                onClick={handleGenerateBackup}
                disabled={loading}
                fullWidth
              >
                {loading ? 'Gerando...' : 'Gerar Backup dos Dados'}
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="delete-step-container">
            <div className="step-icon-container">
              <FileText size={64} style={{ color: '#3b82f6', marginBottom: '1rem' }} />
              <h3 className="step-title">Backup Gerado</h3>
              <p className="step-description">
                Seus dados foram compilados em um arquivo de backup.
              </p>
            </div>

            {backupData && (
              <div className="backup-success-box">
                <h4 className="backup-title">Backup inclui:</h4>
                <div className="backup-grid">
                  {backupData.contas && (
                    <div>• {backupData.contas.length} conta(s) bancária(s)</div>
                  )}
                  {backupData.cartoes && (
                    <div>• {backupData.cartoes.length} cartão(ões) de crédito</div>
                  )}
                  {backupData.transacoes && (
                    <div>• {backupData.transacoes.length} transação(ões)</div>
                  )}
                  {backupData.categorias && (
                    <div>• {backupData.categorias.length} categoria(s)</div>
                  )}
                  {backupData.dividas && (
                    <div>• {backupData.dividas.length} dívida(s)</div>
                  )}
                  {backupData.amigos && (
                    <div>• {backupData.amigos.length} relacionamento(s)</div>
                  )}
                </div>
              </div>
            )}

            <div className="button-group">
              <Button
                variant="secondary"
                onClick={handleDownloadBackup}
                icon={<Download size={16} />}
                disabled={!backupData}
              >
                Baixar Backup
              </Button>
              <Button
                variant="primary"
                onClick={handleValidateDeletion}
                disabled={loading}
              >
                {loading ? 'Validando...' : 'Continuar'}
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="delete-step-container">
            <div className="step-icon-container">
              <Shield size={64} style={{ color: '#f59e0b', marginBottom: '1rem' }} />
              <h3 className="step-title">Validação de Exclusão</h3>
              <p className="step-description">
                Verificamos sua conta e encontramos os seguintes pontos de atenção:
              </p>
            </div>

            {validationIssues.length > 0 ? (
              <div style={{ marginBottom: '1.5rem' }}>
                {validationIssues.map((issue, index) => (
                  <div 
                    key={index}
                    className={`validation-issue ${issue.type}`}
                  >
                    <div className="validation-issue-content">
                      <AlertTriangle className={`validation-issue-icon ${
                        issue.type === 'warning' ? 'text-yellow-500' : 'text-red-500'
                      }`} size={20} />
                      <div>
                        <h4 className="validation-issue-title">
                          {issue.title}
                        </h4>
                        <p className="validation-issue-message">
                          {issue.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ 
                backgroundColor: '#f0fdf4', 
                border: '1px solid #bbf7d0', 
                borderRadius: '0.5rem', 
                padding: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircle size={20} style={{ color: '#16a34a', marginRight: '0.5rem' }} />
                  <p style={{ color: '#15803d', margin: 0 }}>
                    Sua conta está pronta para ser excluída sem problemas.
                  </p>
                </div>
              </div>
            )}

            <div className="alternatives-box">
              <h4 className="alternatives-title">Alternativas à exclusão:</h4>
              <button
                onClick={() => setShowDeactivateModal(true)}
                className="alternative-option"
              >
                <Clock className="alternative-icon" />
                <div className="alternative-text">
                  <h4>Desativar temporariamente</h4>
                  <p>Suspende sua conta mas mantém os dados para reativação futura</p>
                </div>
              </button>
            </div>

            <div className="button-group">
              <Button
                variant="secondary"
                onClick={() => setCurrentStep(2)}
              >
                Voltar
              </Button>
              <Button
                variant="danger"
                onClick={() => setShowDeleteModal(true)}
              >
                Prosseguir com Exclusão
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="delete-account-container">
      {/* Progresso */}
      <div className="progress-bar-container">
        <div className="progress-info">
          <span className="progress-text">Etapa {currentStep} de 3</span>
          <span className="progress-text">
            {Math.round((currentStep / 3) * 100)}% concluído
          </span>
        </div>
        <div className="progress-bar-bg">
          <div 
            className="progress-bar-fill"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Mensagens */}
      {message.text && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '1rem',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem',
          backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
          color: message.type === 'success' ? '#15803d' : '#b91c1c',
          border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`
        }}>
          {message.type === 'success' ? (
            <CheckCircle size={18} style={{ marginRight: '0.5rem', flexShrink: 0 }} />
          ) : (
            <XCircle size={18} style={{ marginRight: '0.5rem', flexShrink: 0 }} />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Erro geral */}
      {error && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#b91c1c',
          padding: '0.75rem 1rem',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem'
        }}>
          {error}
        </div>
      )}

      {/* Conteúdo da etapa atual */}
      {renderStep()}

      {/* Modal de Confirmação de Exclusão */}
      <BasicModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="⚠️ Confirmar Exclusão"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '0.5rem',
            padding: '1rem'
          }}>
            <p style={{ 
              color: '#b91c1c', 
              fontWeight: '500',
              margin: 0
            }}>
              Esta ação é irreversível. Todos os seus dados serão permanentemente excluídos.
            </p>
          </div>

          <div>
            <Input
              label={
                <span>
                  Digite exatamente: <strong>EXCLUIR MINHA CONTA</strong>
                </span>
              }
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="EXCLUIR MINHA CONTA"
              style={{ fontFamily: 'monospace' }}
            />
          </div>

          <div style={{ 
            display: 'flex', 
            gap: '0.75rem', 
            paddingTop: '1rem' 
          }}>
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
              fullWidth
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteAccount}
              fullWidth
              disabled={loading || confirmText !== 'EXCLUIR MINHA CONTA'}
            >
              {loading ? 'Excluindo...' : 'Excluir Conta Permanentemente'}
            </Button>
          </div>
        </div>
      </BasicModal>

      {/* Modal de Desativação */}
      <BasicModal
        isOpen={showDeactivateModal}
        onClose={() => setShowDeactivateModal(false)}
        title="Desativar Conta Temporariamente"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '0.5rem',
            padding: '1rem'
          }}>
            <p style={{ 
              color: '#1e40af',
              margin: 0
            }}>
              Sua conta será desativada, mas seus dados ficarão salvos. 
              Você pode reativar a qualquer momento fazendo login novamente.
            </p>
          </div>

          <div style={{ 
            display: 'flex', 
            gap: '0.75rem', 
            paddingTop: '1rem' 
          }}>
            <Button
              variant="secondary"
              onClick={() => setShowDeactivateModal(false)}
              fullWidth
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              variant="warning"
              onClick={handleDeactivateAccount}
              fullWidth
              disabled={loading}
            >
              {loading ? 'Desativando...' : 'Desativar Conta'}
            </Button>
          </div>
        </div>
      </BasicModal>
    </div>
  );
};

export default ExcluirConta;
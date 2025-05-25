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
import useDeleteAccount from '../hooks/useDeleteAccount';
import useAuth from '../hooks/useAuth';
import Card from '../Components/ui/Card';
import Input from '../Components/ui/Input';
import Button from '../Components/ui/Button';
import BasicModal from '../Components/BasicModal';

/**
 * Componente para exclusão de conta
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
          <div className="space-y-6">
            <div className="text-center">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Exclusão de Conta
              </h3>
              <p className="text-gray-600">
                Esta ação é irreversível. Todos os seus dados serão permanentemente removidos.
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-800 mb-2">O que será excluído:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Todas as suas transações e histórico financeiro</li>
                <li>• Contas bancárias e cartões de crédito cadastrados</li>
                <li>• Categorias personalizadas e configurações</li>
                <li>• Relacionamentos com amigos e familiares</li>
                <li>• Dados do perfil e preferências</li>
                <li>• Acesso ao aplicativo e aos dados</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Antes de prosseguir:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Faça um backup dos seus dados importantes</li>
                <li>• Quite todas as dívidas pendentes</li>
                <li>• Informe amigos sobre transações compartilhadas</li>
                <li>• Considere desativar temporariamente ao invés de excluir</li>
              </ul>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="primary"
                onClick={handleGenerateBackup}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Gerando...' : 'Gerar Backup dos Dados'}
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <FileText className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Backup Gerado
              </h3>
              <p className="text-gray-600">
                Seus dados foram compilados em um arquivo de backup.
              </p>
            </div>

            {backupData && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-2">Backup inclui:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-green-700">
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

            <div className="flex space-x-3">
              <Button
                variant="secondary"
                onClick={handleDownloadBackup}
                icon={<Download size={16} />}
                disabled={!backupData}
                className="flex-1"
              >
                Baixar Backup
              </Button>
              <Button
                variant="primary"
                onClick={handleValidateDeletion}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Validando...' : 'Continuar'}
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Shield className="w-16 h-16 text-orange-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Validação de Exclusão
              </h3>
              <p className="text-gray-600">
                Verificamos sua conta e encontramos os seguintes pontos de atenção:
              </p>
            </div>

            {validationIssues.length > 0 ? (
              <div className="space-y-3">
                {validationIssues.map((issue, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg border ${
                      issue.type === 'warning' 
                        ? 'bg-yellow-50 border-yellow-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start">
                      <AlertTriangle className={`w-5 h-5 mt-0.5 mr-2 ${
                        issue.type === 'warning' ? 'text-yellow-500' : 'text-red-500'
                      }`} />
                      <div>
                        <h4 className={`font-medium ${
                          issue.type === 'warning' ? 'text-yellow-800' : 'text-red-800'
                        }`}>
                          {issue.title}
                        </h4>
                        <p className={`text-sm ${
                          issue.type === 'warning' ? 'text-yellow-700' : 'text-red-700'
                        }`}>
                          {issue.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  <p className="text-green-700">
                    Sua conta está pronta para ser excluída sem problemas.
                  </p>
                </div>
              </div>
            )}

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-3">Alternativas à exclusão:</h4>
              <div className="space-y-2">
                <button
                  onClick={() => setShowDeactivateModal(true)}
                  className="flex items-center w-full p-3 text-left bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Clock className="w-5 h-5 text-blue-500 mr-3" />
                  <div>
                    <p className="font-medium text-gray-800">Desativar temporariamente</p>
                    <p className="text-sm text-gray-600">
                      Suspende sua conta mas mantém os dados para reativação futura
                    </p>
                  </div>
                </button>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="secondary"
                onClick={() => setCurrentStep(2)}
                className="flex-1"
              >
                Voltar
              </Button>
              <Button
                variant="danger"
                onClick={() => setShowDeleteModal(true)}
                className="flex-1"
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
    <div className="max-w-2xl mx-auto">
      <Card>
        <div className="p-6">
          {/* Progresso */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-600">Etapa {currentStep} de 3</span>
              <span className="text-sm text-gray-600">
                {Math.round((currentStep / 3) * 100)}% concluído
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 3) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Mensagens */}
          {message.text && (
            <div className={`flex items-center p-4 rounded-lg mb-6 ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle size={18} className="mr-2 flex-shrink-0" />
              ) : (
                <XCircle size={18} className="mr-2 flex-shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Erro geral */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Conteúdo da etapa atual */}
          {renderStep()}
        </div>
      </Card>

      {/* Modal de Confirmação de Exclusão */}
      <BasicModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="⚠️ Confirmar Exclusão"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 font-medium">
              Esta ação é irreversível. Todos os seus dados serão permanentemente excluídos.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Digite exatamente: <strong>EXCLUIR MINHA CONTA</strong>
            </label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="EXCLUIR MINHA CONTA"
              className="font-mono"
            />
          </div>

          <div className="flex space-x-3 pt-4">
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
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-700">
              Sua conta será desativada, mas seus dados ficarão salvos. 
              Você pode reativar a qualquer momento fazendo login novamente.
            </p>
          </div>

          <div className="flex space-x-3 pt-4">
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
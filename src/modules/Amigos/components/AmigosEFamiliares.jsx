import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Mail, Heart, Check, X, Trash2, Clock, AlertCircle } from 'lucide-react';
import useAmigos from '@modules/Amigos/hooks/useAmigos';
import Card from '@shared/components/ui/Card';
import Input from '@shared/components/ui/Input';
import Button from '@shared/components/ui/Button';



/**
 * Componente para gerenciar amigos e familiares
 * Permite enviar convites, aceitar/rejeitar e remover relacionamentos
 */
const AmigosEFamiliares = () => {
  const { 
    amigos, 
    loading, 
    error, 
    enviarConvite, 
    aceitarConvite, 
    rejeitarConvite, 
    removerAmigo,
    getConvitesPendentes 
  } = useAmigos();

  // Estados locais
  const [showConviteModal, setShowConviteModal] = useState(false);
  const [convitesPendentes, setConvitesPendentes] = useState([]);
  const [formData, setFormData] = useState({
    email: '',
    nome: '',
    tipo: 'amigo'
  });
  const [formErrors, setFormErrors] = useState({});
  const [loadingAction, setLoadingAction] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Carrega convites pendentes
  useEffect(() => {
    const loadConvitesPendentes = async () => {
      const convites = await getConvitesPendentes();
      setConvitesPendentes(convites);
    };
    
    if (!loading) {
      loadConvitesPendentes();
    }
  }, [loading, getConvitesPendentes, amigos]);

  // Limpa mensagens após 3 segundos
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Manipulador para mudanças no formulário
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpa erro do campo
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Valida o formulário
  const validateForm = () => {
    const errors = {};
    
    if (!formData.email.trim()) {
      errors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email inválido';
    }
    
    if (!formData.nome.trim()) {
      errors.nome = 'Nome é obrigatório';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Envia convite
  const handleEnviarConvite = async () => {
    if (!validateForm()) return;
    
    setLoadingAction(true);
    
    try {
      const { success, error } = await enviarConvite(
        formData.email, 
        formData.nome, 
        formData.tipo
      );
      
      if (success) {
        setMessage({
          type: 'success',
          text: 'Convite enviado com sucesso!'
        });
        setFormData({ email: '', nome: '', tipo: 'amigo' });
        setShowConviteModal(false);
      } else {
        setMessage({
          type: 'error',
          text: error || 'Erro ao enviar convite'
        });
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: 'Erro inesperado ao enviar convite'
      });
    } finally {
      setLoadingAction(false);
    }
  };

  // Aceita convite
  const handleAceitarConvite = async (conviteId) => {
    setLoadingAction(true);
    
    try {
      const { success, error } = await aceitarConvite(conviteId);
      
      if (success) {
        setMessage({
          type: 'success',
          text: 'Convite aceito com sucesso!'
        });
      } else {
        setMessage({
          type: 'error',
          text: error || 'Erro ao aceitar convite'
        });
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: 'Erro inesperado ao aceitar convite'
      });
    } finally {
      setLoadingAction(false);
    }
  };

  // Rejeita convite
  const handleRejeitarConvite = async (conviteId) => {
    setLoadingAction(true);
    
    try {
      const { success, error } = await rejeitarConvite(conviteId);
      
      if (success) {
        setMessage({
          type: 'success',
          text: 'Convite rejeitado'
        });
      } else {
        setMessage({
          type: 'error',
          text: error || 'Erro ao rejeitar convite'
        });
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: 'Erro inesperado ao rejeitar convite'
      });
    } finally {
      setLoadingAction(false);
    }
  };

  // Remove amigo
  const handleRemoverAmigo = async (amigoId, nomeAmigo) => {
    if (!window.confirm(`Tem certeza que deseja remover ${nomeAmigo} da sua lista?`)) {
      return;
    }
    
    setLoadingAction(true);
    
    try {
      const { success, error } = await removerAmigo(amigoId);
      
      if (success) {
        setMessage({
          type: 'success',
          text: 'Amigo removido com sucesso'
        });
      } else {
        setMessage({
          type: 'error',
          text: error || 'Erro ao remover amigo'
        });
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: 'Erro inesperado ao remover amigo'
      });
    } finally {
      setLoadingAction(false);
    }
  };

  // Filtra amigos por status
  const amigosAceitos = amigos.filter(amigo => amigo.status === 'aceito');
  const convitesEnviados = amigos.filter(amigo => amigo.status === 'pendente');

  // Função para obter nome do amigo
  const getNomeAmigo = (amigo) => {
    // Se é um convite que eu enviei
    if (amigo.nome_convidado) {
      return amigo.nome_convidado;
    }
    // Se é um amigo que já aceitou
    if (amigo.usuario_convidado?.nome) {
      return amigo.usuario_convidado.nome;
    }
    if (amigo.usuario_proprietario?.nome) {
      return amigo.usuario_proprietario.nome;
    }
    return 'Usuário';
  };

  // Função para obter email do amigo
  const getEmailAmigo = (amigo) => {
    if (amigo.email_convidado) {
      return amigo.email_convidado;
    }
    if (amigo.usuario_convidado?.email) {
      return amigo.usuario_convidado.email;
    }
    if (amigo.usuario_proprietario?.email) {
      return amigo.usuario_proprietario.email;
    }
    return '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Amigos e Familiares</h2>
          <p className="text-gray-600">
            Adicione pessoas próximas para facilitar o controle de despesas compartilhadas
          </p>
        </div>
        <Button
          variant="primary"
          icon={<UserPlus size={18} />}
          onClick={() => setShowConviteModal(true)}
          className="mt-4 sm:mt-0"
        >
          Convidar Pessoa
        </Button>
      </div>

      {/* Mensagens de feedback */}
      {message.text && (
        <div className={`flex items-center p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <Check size={18} className="mr-2 flex-shrink-0" />
          ) : (
            <AlertCircle size={18} className="mr-2 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Erro geral */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Convites Pendentes Recebidos */}
      {convitesPendentes.length > 0 && (
        <Card title="Convites Recebidos" icon={<Mail size={20} />}>
          <div className="space-y-3">
            {convitesPendentes.map((convite) => (
              <div 
                key={convite.id}
                className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {convite.usuario_proprietario?.nome} te convidou
                    </p>
                    <p className="text-sm text-gray-600">
                      {convite.tipo_relacionamento === 'familia' ? 'Familiar' : 'Amigo'}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => handleAceitarConvite(convite.id)}
                    disabled={loadingAction}
                  >
                    <Check size={14} />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleRejeitarConvite(convite.id)}
                    disabled={loadingAction}
                  >
                    <X size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Lista de Amigos Aceitos */}
      <Card 
        title={`Meus Relacionamentos (${amigosAceitos.length})`}
        icon={<Users size={20} />}
      >
        {amigosAceitos.length === 0 ? (
          <div className="text-center py-8">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-2">Nenhum amigo ou familiar adicionado ainda</p>
            <p className="text-sm text-gray-400">
              Convide pessoas próximas para facilitar o controle de gastos compartilhados
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {amigosAceitos.map((amigo) => (
              <div 
                key={amigo.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    amigo.tipo_relacionamento === 'familia' 
                      ? 'bg-pink-100 text-pink-600' 
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    {amigo.tipo_relacionamento === 'familia' ? (
                      <Heart size={18} />
                    ) : (
                      <Users size={18} />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {getNomeAmigo(amigo)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {getEmailAmigo(amigo)} • {amigo.tipo_relacionamento === 'familia' ? 'Familiar' : 'Amigo'}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemoverAmigo(amigo.id, getNomeAmigo(amigo))}
                  disabled={loadingAction}
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Convites Enviados */}
      {convitesEnviados.length > 0 && (
        <Card title="Convites Enviados" icon={<Clock size={20} />}>
          <div className="space-y-3">
            {convitesEnviados.map((convite) => (
              <div 
                key={convite.id}
                className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Clock size={18} className="text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {getNomeAmigo(convite)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {getEmailAmigo(convite)} • Aguardando resposta
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Modal de Convite */}
      <BasicModal
        isOpen={showConviteModal}
        onClose={() => setShowConviteModal(false)}
        title="Convidar Pessoa"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Convide amigos ou familiares para facilitar o controle de despesas compartilhadas.
          </p>
          
          <Input
            label="Nome completo"
            name="nome"
            value={formData.nome}
            onChange={handleFormChange}
            placeholder="Digite o nome da pessoa"
            error={formErrors.nome}
            required
          />
          
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleFormChange}
            placeholder="email@exemplo.com"
            error={formErrors.email}
            required
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de relacionamento
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                formData.tipo === 'amigo' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="tipo"
                  value="amigo"
                  checked={formData.tipo === 'amigo'}
                  onChange={handleFormChange}
                  className="sr-only"
                />
                <Users size={18} className="text-blue-600 mr-2" />
                <span className="text-sm font-medium">Amigo</span>
              </label>
              
              <label className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                formData.tipo === 'familia' 
                  ? 'border-pink-500 bg-pink-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="tipo"
                  value="familia"
                  checked={formData.tipo === 'familia'}
                  onChange={handleFormChange}
                  className="sr-only"
                />
                <Heart size={18} className="text-pink-600 mr-2" />
                <span className="text-sm font-medium">Familiar</span>
              </label>
            </div>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowConviteModal(false)}
              fullWidth
              disabled={loadingAction}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleEnviarConvite}
              fullWidth
              disabled={loadingAction}
            >
              {loadingAction ? 'Enviando...' : 'Enviar Convite'}
            </Button>
          </div>
        </div>
      </BasicModal>
    </div>
  );
};

export default AmigosEFamiliares;
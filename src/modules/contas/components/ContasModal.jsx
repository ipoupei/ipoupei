// src/modules/contas/components/ContasModal.jsx - VERSÃO CORRIGIDA COM STORE
import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { 
  Building, 
  Plus, 
  Edit, 
  Archive,
  ArchiveRestore,
  X, 
  Calculator,
  DollarSign,
  Palette,
  FileText,
  Eye,
  EyeOff,
  Lock,
  AlertCircle,
  Check  
} from 'lucide-react';

import { useAuthStore } from '@modules/auth/store/authStore';
import { useUIStore } from '@store/uiStore';
import { formatCurrency } from '@utils/formatCurrency';
import useContas from '@modules/contas/hooks/useContas';
//import '@shared/styles/FormsModal.css';
import '@shared/styles/PrincipalArquivoDeClasses.css';
import useContasStore from '@/modules/contas/store/contasStore';


/**
 * Modal de Gerenciamento de Contas - VERSÃO CORRIGIDA COM STORE
 * ✅ Usa useContas que agora funciona com store
 * ✅ Elimina dependências diretas do Supabase
 * ✅ Interface limpa e consistente
 */
const ContasModal = ({ isOpen, onClose, onSave }) => {
  const { user } = useAuthStore();
  const { showNotification } = useUIStore();
  
  // ✅ USAR HOOK REFATORADO COM STORE
  const {
    contas,
    contasArquivadas,
    loading,
    addConta,
    updateConta,
    arquivarConta,
    desarquivarConta,
    corrigirSaldoConta,
    fetchContasArquivadas,
    // ✅ REMOVIDO: recalcularSaldos - não existe mais, pois store gerencia automaticamente
  } = useContas();
  
  const nomeInputRef = useRef(null);

  // =============================================================================
  // ESTADOS PRINCIPAIS
  // =============================================================================
  
  const [submitting, setSubmitting] = useState(false);
  const [mostrarArquivadas, setMostrarArquivadas] = useState(false);
  
  // Estados do formulário de conta
  const [modoFormulario, setModoFormulario] = useState(null); // null, 'criar', 'editar'
  const [contaEditando, setContaEditando] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'corrente',
    banco: '',
    saldoInicial: '0,00',
    cor: '#3B82F6'
  });
  const [formErrors, setFormErrors] = useState({});

  // Estados dos modais de ação
  const [modalCorreirSaldo, setModalCorrigirSaldo] = useState({
    ativo: false,
    conta: null,
    novoSaldo: '',
    metodo: 'ajuste', // 'ajuste' ou 'saldo_inicial'
    motivo: ''
  });

  const [modalArquivar, setModalArquivar] = useState({
    ativo: false,
    conta: null,
    motivo: ''
  });

  const [modalDesarquivar, setModalDesarquivar] = useState({
    ativo: false,
    conta: null
  });

  // =============================================================================
  // CONFIGURAÇÕES E CONSTANTES
  // =============================================================================
  
  const tiposConta = [
    { value: 'corrente', label: 'Conta Corrente', icon: '🏦' },
    { value: 'poupanca', label: 'Poupança', icon: '🐷' },
    { value: 'investimento', label: 'Investimentos', icon: '📈' },
    { value: 'carteira', label: 'Carteira', icon: '👛' }
  ];

    const coresPredefinidas = [
      // Linha 1 - Cores vibrantes e principais
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
      '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
      // Linha 2 - Cores complementares e neutras
      '#14B8A6', '#F43F5E', '#8B5A2B', '#7C3AED', '#DC2626',
      '#059669', '#0EA5E9', '#D97706', '#7C2D12', '#4C1D95'
    ];

  // =============================================================================
  // UTILITÁRIOS
  // =============================================================================
  
  const formatarValorInput = useCallback((valor) => {
    const apenasNumeros = valor.toString().replace(/\D/g, '');
    if (!apenasNumeros || apenasNumeros === '0') return '';
    const valorEmCentavos = parseInt(apenasNumeros, 10);
    const valorEmReais = valorEmCentavos / 100;
    return valorEmReais.toLocaleString('pt-BR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  }, []);

  const parseValorInput = useCallback((valorString) => {
    if (!valorString) return 0;
    
    const valorLimpo = valorString.toString();
    if (valorLimpo.includes(',')) {
      const partes = valorLimpo.split(',');
      const inteira = partes[0].replace(/\./g, '');
      const decimal = partes[1] || '00';
      const valorFinal = parseFloat(`${inteira}.${decimal}`);
      return isNaN(valorFinal) ? 0 : valorFinal;
    } else {
      const apenasNumeros = valorLimpo.replace(/\./g, '');
      const valorFinal = parseFloat(apenasNumeros) / 100;
      return isNaN(valorFinal) ? 0 : valorFinal;
    }
  }, []);

  const resetFormulario = useCallback(() => {
    setFormData({
      nome: '',
      tipo: 'corrente',
      banco: '',
      saldoInicial: '0,00',
      cor: '#3B82F6'
    });
    setFormErrors({});
    setContaEditando(null);
    setModoFormulario(null);
  }, []);

  // =============================================================================
  // CÁLCULOS E RESUMOS
  // =============================================================================
  
  const resumo = React.useMemo(() => {
    const saldoTotal = contas.reduce((sum, conta) => sum + (conta.saldo_atual || conta.saldo || 0), 0);
    const contasPositivas = contas.filter(conta => (conta.saldo_atual || conta.saldo || 0) > 0).length;
    const contasNegativas = contas.filter(conta => (conta.saldo_atual || conta.saldo || 0) < 0).length;
    
    return { 
      saldoTotal, 
      contasPositivas, 
      contasNegativas, 
      totalAtivas: contas.length,
      totalArquivadas: contasArquivadas.length
    };
  }, [contas, contasArquivadas]);

  // =============================================================================
  // HANDLERS DE EVENTOS
  // =============================================================================
  
  // Carregar arquivadas quando necessário
  useEffect(() => {
    if (isOpen && mostrarArquivadas && user) {
      fetchContasArquivadas();
    }
  }, [isOpen, mostrarArquivadas, user, fetchContasArquivadas]);

  // ESC para fechar - CORRIGIDO para fechar modais aninhados primeiro
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        // Prioridade: fechar modais aninhados primeiro
        if (modalCorreirSaldo.ativo) {
          setModalCorrigirSaldo({ ativo: false, conta: null, novoSaldo: '', metodo: 'ajuste', motivo: '' });
        } else if (modalArquivar.ativo) {
          setModalArquivar({ ativo: false, conta: null, motivo: '' });
        } else if (modalDesarquivar.ativo) {
          setModalDesarquivar({ ativo: false, conta: null });
        } else if (modoFormulario) {
          resetFormulario();
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, modoFormulario, modalCorreirSaldo.ativo, modalArquivar.ativo, modalDesarquivar.ativo, resetFormulario, onClose]);

  // =============================================================================
  // HANDLERS DO FORMULÁRIO
  // =============================================================================
  
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  }, [formErrors]);

  const handleSaldoChange = useCallback((e) => {
    const valorOriginal = e.target.value;
    
    if (valorOriginal === '' || valorOriginal === '-') {
      setFormData(prev => ({ ...prev, saldoInicial: valorOriginal }));
      if (formErrors.saldoInicial) {
        setFormErrors(prev => ({ ...prev, saldoInicial: null }));
      }
      return;
    }
    
    const isNegativo = valorOriginal.startsWith('-');
    const valorSemSinal = valorOriginal.replace('-', '');
    const valorFormatado = formatarValorInput(valorSemSinal);
    const valorFinal = isNegativo ? `-${valorFormatado}` : valorFormatado;
    
    setFormData(prev => ({ ...prev, saldoInicial: valorFinal }));
    if (formErrors.saldoInicial) {
      setFormErrors(prev => ({ ...prev, saldoInicial: null }));
    }
  }, [formatarValorInput, formErrors.saldoInicial]);

  const handleCorChange = useCallback((cor) => {
    setFormData(prev => ({ ...prev, cor }));
  }, []);

  // =============================================================================
  // AÇÕES DO FORMULÁRIO
  // =============================================================================
  
  const iniciarCriacaoConta = useCallback(() => {
    resetFormulario();
    setModoFormulario('criar');
    setTimeout(() => nomeInputRef.current?.focus(), 100);
  }, [resetFormulario]);

  const iniciarEdicaoConta = useCallback((conta) => {
    setFormData({
      nome: conta.nome,
      tipo: conta.tipo,
      banco: conta.banco || '',
      saldoInicial: '', // ✅ Não preenchemos para edição
      cor: conta.cor || '#3B82F6'
    });
    setContaEditando(conta);
    setModoFormulario('editar');
    setTimeout(() => nomeInputRef.current?.focus(), 100);
  }, []);

  const validarFormulario = useCallback(() => {
    const erros = {};
    
    if (!formData.nome.trim()) {
      erros.nome = "Nome é obrigatório";
    }
    if (!formData.tipo) {
      erros.tipo = "Tipo é obrigatório";
    }
    
    // ✅ Saldo inicial obrigatório apenas na criação
    if (modoFormulario === 'criar' && !formData.saldoInicial) {
      erros.saldoInicial = "Saldo inicial é obrigatório";
    }
    
    setFormErrors(erros);
    return Object.keys(erros).length === 0;
  }, [formData, modoFormulario]);

  // ✅ FUNÇÃO CORRIGIDA - Usa hooks em vez de Supabase direto
  const submeterFormulario = useCallback(async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      showNotification('Por favor, corrija os erros no formulário', 'error');
      return;
    }
    
    try {
      setSubmitting(true);
      
      if (modoFormulario === 'editar' && contaEditando) {
        // ✅ USAR HOOK EM VEZ DE SUPABASE DIRETO
        await updateConta(contaEditando.id, {
          nome: formData.nome.trim(),
          tipo: formData.tipo,
          banco: formData.banco.trim(),
          cor: formData.cor
        });
        
        showNotification('Conta atualizada com sucesso!', 'success');

        
        
      } else {
        // ✅ USAR HOOK EM VEZ DE SUPABASE DIRETO
        const saldoInicial = parseValorInput(formData.saldoInicial);
        
        await addConta({
          nome: formData.nome.trim(),
          tipo: formData.tipo,
          banco: formData.banco.trim(),
          saldoInicial: saldoInicial,
          cor: formData.cor
        });
        
        const { forceRefreshContas } = useContasStore.getState();
        forceRefreshContas(); // 🔁
        showNotification('Conta criada com sucesso!', 'success');
      }
      
      // ✅ NÃO PRECISA MAIS recalcularSaldos - store atualiza automaticamente
      resetFormulario();
      if (onSave) onSave();
      
    } catch (error) {
      console.error('Erro ao salvar conta:', error);
      showNotification('Erro ao salvar conta', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [validarFormulario, modoFormulario, contaEditando, formData, parseValorInput, updateConta, addConta, resetFormulario, onSave, showNotification]);

  window.dispatchEvent(new CustomEvent('conta_atualizada'));

  // =============================================================================
  // AÇÕES DE CORREÇÃO DE SALDO
  // =============================================================================
  
  const iniciarCorrecaoSaldo = useCallback((conta) => {
    setModalCorrigirSaldo({
      ativo: true,
      conta,
      novoSaldo: (conta.saldo_atual || conta.saldo || 0).toLocaleString('pt-BR', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      }),
      metodo: 'ajuste',
      motivo: ''
    });
  }, []);

  const processarCorrecaoSaldo = useCallback(async () => {
    if (!modalCorreirSaldo.conta) return;

    const novoSaldoNumerico = parseFloat(
      modalCorreirSaldo.novoSaldo.replace(/\./g, '').replace(',', '.')
    );

    if (isNaN(novoSaldoNumerico)) {
      showNotification('Valor inválido', 'error');
      return;
    }

    setSubmitting(true);
    try {
      // ✅ USAR HOOK EM VEZ DE LÓGICA PRÓPRIA
      const resultado = await corrigirSaldoConta(
        modalCorreirSaldo.conta.id,
        novoSaldoNumerico,
        modalCorreirSaldo.metodo,
        modalCorreirSaldo.motivo
      );

      if (resultado.success) {
        setModalCorrigirSaldo({ ativo: false, conta: null, novoSaldo: '', metodo: 'ajuste', motivo: '' });
        if (onSave) onSave();
      }
    } catch (error) {
      console.error('Erro ao corrigir saldo:', error);
    } finally {
      setSubmitting(false);
    }
  }, [modalCorreirSaldo, corrigirSaldoConta, onSave, showNotification]);

  // =============================================================================
  // AÇÕES DE ARQUIVAMENTO
  // =============================================================================
  
  const iniciarArquivamento = useCallback((conta) => {
    setModalArquivar({ ativo: true, conta, motivo: '' });
  }, []);

  const processarArquivamento = useCallback(async () => {
    if (!modalArquivar.conta) return;
    
    setSubmitting(true);
    try {
      // ✅ USAR HOOK EM VEZ DE LÓGICA PRÓPRIA
      const resultado = await arquivarConta(modalArquivar.conta.id, modalArquivar.motivo);
      
      if (resultado.success) {
        setModalArquivar({ ativo: false, conta: null, motivo: '' });
        if (onSave) onSave();
      }
    } catch (error) {
      console.error('Erro ao arquivar:', error);
    } finally {
      setSubmitting(false);
    }
  }, [modalArquivar, arquivarConta, onSave]);

  const iniciarDesarquivamento = useCallback((conta) => {
    setModalDesarquivar({ ativo: true, conta });
  }, []);

  const processarDesarquivamento = useCallback(async () => {
    if (!modalDesarquivar.conta) return;
    
    setSubmitting(true);
    try {
      // ✅ USAR HOOK EM VEZ DE LÓGICA PRÓPRIA
      const resultado = await desarquivarConta(modalDesarquivar.conta.id);
      
      if (resultado.success) {
        setModalDesarquivar({ ativo: false, conta: null });
        if (onSave) onSave();
      }
    } catch (error) {
      console.error('Erro ao desarquivar:', error);
    } finally {
      setSubmitting(false);
    }
  }, [modalDesarquivar, desarquivarConta, onSave]);

  // =============================================================================
  // RENDER COMPONENTS
  // =============================================================================
// Função renderConta ajustada para usar as classes existentes
const renderConta = useCallback((conta, isArquivada = false) => {
  const saldoAtual = conta.saldo_atual || conta.saldo || 0;
  const saldoInicial = conta.saldo_inicial || 0;
  const temDiferenca = Math.abs(saldoAtual - saldoInicial) > 0.01;
  
  return (
    <div 
      key={conta.id} 
      className={`ip_card_item_destaque ${isArquivada ? 'ip_estado_inativo' : ''}`}
      style={{ borderLeftColor: conta.cor }}
    >
      {/* Ações no canto superior direito */}
      <div className="ip_acoes_item_posicionadas">
        {!isArquivada && (
          <button
            type="button"
            className="ip_botao_icone_pequeno_card"
            onClick={() => iniciarCorrecaoSaldo(conta)}
            disabled={submitting}
            title="Corrigir saldo"
          >
            <Calculator size={11} />
          </button>
        )}
        
        {!isArquivada && (
          <button
            type="button"
            className="ip_botao_icone_pequeno_card"
            onClick={() => iniciarEdicaoConta(conta)}
            disabled={submitting}
            title="Editar conta"
          >
            <Edit size={11} />
          </button>
        )}
        
        <button
          type="button"
          className={`ip_botao_icone_pequeno_card ${isArquivada ? 'verde' : 'vermelho'}`}
          onClick={() => {
            if (isArquivada) {
              iniciarDesarquivamento(conta);
            } else {
              iniciarArquivamento(conta);
            }
          }}
          disabled={submitting}
          title={isArquivada ? "Desarquivar conta" : "Arquivar conta"}
        >
          {isArquivada ? <ArchiveRestore size={11} /> : <Archive size={11} />}
        </button>
      </div>

      {/* Header com informações principais */}
      <div className="ip_header_item">
        <div 
          className="ip_icone_item" 
          style={{ backgroundColor: conta.cor }}
        >
          {tiposConta.find(t => t.value === conta.tipo)?.icon || '💳'}
        </div>
        
        <div className="ip_info_item">
          <div className="ip_nome_item">
            {conta.nome}
            {isArquivada && (
              <span className="ip_badge_amarelo">ARQUIVADA</span>
            )}
          </div>
          
          <div className="ip_tipo_item">
            {tiposConta.find(t => t.value === conta.tipo)?.label}
            {conta.banco && ` • ${conta.banco}`}
          </div>
          
          <div className="ip_valores_item">
            <div className={saldoAtual >= 0 ? 'ip_valor_verde' : 'ip_valor_vermelho'}>
              {formatCurrency(saldoAtual)}
            </div>
            {temDiferenca && (
              <div className="ip_valor_secundario">
                (inicial: {formatCurrency(saldoInicial)})
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}, [tiposConta, submitting, iniciarCorrecaoSaldo, iniciarEdicaoConta, iniciarArquivamento, iniciarDesarquivamento]);
// =============================================================================
// RENDER PRINCIPAL
// =============================================================================

if (!isOpen) return null;

return (
  <>
    {/* MODAL PRINCIPAL - Z-INDEX: 1000 */}
    <div className="ip_modal_fundo" style={{ zIndex: 1000 }}>
      <div className="ip_modal_medio">
        {/* Header */}
        <div className="ip_modal_header ip_header_azul">
          <div className="ip_flex ip_gap_3">
            <div className="ip_icone_item">
              <Building size={24} />
            </div>
            <div>
              <h2 className="ip_modal_titulo">Gerenciar Contas</h2>
              <p className="ip_modal_subtitulo">
                {resumo.totalAtivas} ativa{resumo.totalAtivas !== 1 ? 's' : ''} • 
                {resumo.totalArquivadas > 0 && ` ${resumo.totalArquivadas} arquivada${resumo.totalArquivadas !== 1 ? 's' : ''} • `}
                Total: {formatCurrency(resumo.saldoTotal)}
              </p>
            </div>
          </div>
          <button className="ip_modal_close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="ip_modal_content">
          {loading ? (
            <div className="ip_loading_container">
              <div className="ip_loading_spinner"></div>
              <p className="ip_loading_texto">Carregando contas...</p>
            </div>
          ) : (
            <>
              {/* Controles superiores */}
              <div className="ip_flex ip_gap_4 ip_mb_4" style={{justifyContent: 'space-between', alignItems: 'center'}}>
                <button
                  onClick={() => setMostrarArquivadas(!mostrarArquivadas)}
                  className={`ip_botao_base ip_botao_pequeno ${mostrarArquivadas ? 'ip_botao_azul_outline' : 'ip_botao_cinza'}`}
                >
                  {mostrarArquivadas ? <EyeOff size={14} /> : <Eye size={14} />}
                  {mostrarArquivadas ? 'Ocultar Arquivadas' : 'Ver Arquivadas'}
                  {resumo.totalArquivadas > 0 && (
                    <span className="ip_badge_amarelo">{resumo.totalArquivadas}</span>
                  )}
                </button>
                
                <div className="ip_flex ip_gap_2">
                  {!modoFormulario ? (
                    <button
                      onClick={iniciarCriacaoConta}
                      disabled={submitting}
                      className="ip_botao_base ip_botao_azul ip_botao_pequeno"
                    >
                      <Plus size={14} />
                      Nova Conta
                    </button>
                  ) : (
                    <button
                      onClick={resetFormulario}
                      disabled={submitting}
                      className="ip_botao_base ip_botao_cinza ip_botao_pequeno"
                    >
                      <X size={14} />
                      Cancelar
                    </button>
                  )}
                </div>
              </div>

              {/* Resumo financeiro */}
              {(contas.length > 0 || contasArquivadas.length > 0) && (
                <div className="ip_card_pequeno ip_mb_2">
                  <div className="ip_grid_3_colunas">
                    <div className="ip_card_estatistica saldo">
                      <div className="ip_icone_estatistica">💰</div>
                      <div className="ip_conteudo_estatistica">
                        <div className="ip_label_estatistica">Saldo Total</div>
                        <div className={`ip_valor_estatistica ${resumo.saldoTotal >= 0 ? 'positivo' : 'negativo'}`}>
                          {formatCurrency(resumo.saldoTotal)}
                        </div>
                      </div>
                    </div>
                    <div className="ip_card_estatistica receitas">
                      <div className="ip_icone_estatistica">📈</div>
                      <div className="ip_conteudo_estatistica">
                        <div className="ip_label_estatistica">Positivas</div>
                        <div className="ip_valor_estatistica">{resumo.contasPositivas}</div>
                      </div>
                    </div>
                    <div className="ip_card_estatistica despesas">
                      <div className="ip_icone_estatistica">📉</div>
                      <div className="ip_conteudo_estatistica">
                        <div className="ip_label_estatistica">Negativas</div>
                        <div className="ip_valor_estatistica">{resumo.contasNegativas}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
{/* Formulário de conta */}
{modoFormulario && (
  <div className="ip_card_grande ip_mb_3">
    <h3 className="ip_header_secundario">
      {modoFormulario === 'editar' ? 'Editar Conta' : 'Nova Conta'}
    </h3>

    <form onSubmit={submeterFormulario}>
      {/* Nome e Tipo */}
      <div className="ip_flex ip_gap_3 ip_mb_3">
        <div className="ip_grupo_formulario ip_w_100">
          <label className="ip_label">
            <Building size={14} />
            Nome da Conta *
          </label>
          <input
            ref={nomeInputRef}
            type="text"
            name="nome"
            value={formData.nome}
            onChange={handleInputChange}
            placeholder="Ex: Conta conjunta, Conta salário, etc..."
            disabled={submitting}
            className={`ip_input_base ${formErrors.nome ? 'ip_input_erro' : ''}`}
          />
          {formErrors.nome && <div className="ip_erro_formulario">{formErrors.nome}</div>}
        </div>
        
        <div className="ip_grupo_formulario ip_w_100">
          <label className="ip_label">
            <FileText size={14} />
            Tipo *
          </label>
          <select
            name="tipo"
            value={formData.tipo}
            onChange={handleInputChange}
            disabled={submitting}
            className={`ip_input_base ip_input_select ${formErrors.tipo ? 'ip_input_erro' : ''}`}
          >
            {tiposConta.map(tipo => (
              <option key={tipo.value} value={tipo.value}>
                {tipo.icon} {tipo.label}
              </option>
            ))}
          </select>
          {formErrors.tipo && <div className="ip_erro_formulario">{formErrors.tipo}</div>}
        </div>
      </div>

      {/* Banco e Saldo */}
      <div className="ip_flex ip_gap_3 ip_mb_3">
        <div className="ip_grupo_formulario ip_w_100">
          <label className="ip_label">
            <Building size={14} />
            Banco (opcional)
          </label>
          <input
            type="text"
            name="banco"
            value={formData.banco}
            onChange={handleInputChange}
            placeholder="Ex: Itaú, Santander"
            disabled={submitting}
            className="ip_input_base"
          />
        </div>
        
        <div className="ip_grupo_formulario ip_w_100">
          {modoFormulario === 'criar' ? (
            <>
              <label className="ip_label">
                <DollarSign size={14} />
                Saldo Inicial * (Ex: 1000 ou -500,00)
              </label>
              <input
                type="text"
                value={formData.saldoInicial}
                onChange={handleSaldoChange}
                placeholder="0,00"
                disabled={submitting}
                className={`ip_input_base ip_input_dinheiro ${parseValorInput(formData.saldoInicial) >= 0 ? 'ip_valor_verde' : 'ip_valor_vermelho'} ${formErrors.saldoInicial ? 'ip_input_erro' : ''}`}
              />
              {formErrors.saldoInicial && <div className="ip_erro_formulario">{formErrors.saldoInicial}</div>}
            </>
          ) : (
            <>
              <label className="ip_label">
                <Lock size={14} />
                Saldo Inicial (somente leitura)
              </label>
              <input
                type="text"
                value={formatCurrency(contaEditando?.saldo_inicial || 0)}
                disabled={true}
                className="ip_input_base ip_input_dinheiro ip_input_desabilitado"
                readOnly
              />
              <div className="ip_mensagem_feedback info ip_mt_2">
                <AlertCircle size={16} />
                <p>Para alterar o saldo, use a opção <strong>"Corrigir Saldo"</strong> na lista de contas.</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Informações adicionais na edição */}
      {modoFormulario === 'editar' && contaEditando && (
        <div className="ip_card_medio ip_mb_3">
          <div className="ip_flex ip_gap_2 ip_mb_3">
            <Calculator size={16} />
            <strong>Informações da Conta</strong>
          </div>
          <div className="ip_grid_3_colunas">
            <div className="ip_card_estatistica">
              <div className="ip_conteudo_estatistica">
                <div className="ip_label_estatistica">Saldo Inicial</div>
                <div className="ip_valor_estatistica ip_valor_neutro">
                  {formatCurrency(contaEditando.saldo_inicial || 0)}
                </div>
              </div>
            </div>
            <div className="ip_card_estatistica saldo">
              <div className="ip_conteudo_estatistica">
                <div className="ip_label_estatistica">Saldo Atual</div>
                <div className={`ip_valor_estatistica ${(contaEditando.saldo_atual || contaEditando.saldo || 0) >= 0 ? 'positivo' : 'negativo'}`}>
                  {formatCurrency(contaEditando.saldo_atual || contaEditando.saldo || 0)}
                </div>
              </div>
            </div>
            <div className="ip_card_estatistica">
              <div className="ip_conteudo_estatistica">
                <div className="ip_label_estatistica">Diferença</div>
                <div className={`ip_valor_estatistica ${((contaEditando.saldo_atual || contaEditando.saldo || 0) - (contaEditando.saldo_inicial || 0)) >= 0 ? 'positivo' : 'negativo'}`}>
                  {formatCurrency((contaEditando.saldo_atual || contaEditando.saldo || 0) - (contaEditando.saldo_inicial || 0))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

        {/* Seletor de Cor */}
        <div className="ip_grupo_formulario ip_mb_3">
          <label className="ip_label">
            <Palette size={14} />
            Cor da Conta
          </label>
          
          {/* Grid de Cores */}
          <div className="ip_color_palette">
            {coresPredefinidas.map((cor) => (
              <button
                key={cor}
                type="button"
                onClick={() => handleCorChange(cor)}
                disabled={submitting}
                className={`ip_color_swatch ${formData.cor === cor ? 'ip_selected' : ''}`}
                style={{ backgroundColor: cor }}
                title={cor}
              >
                {formData.cor === cor && (
                  <Check size={12} className="ip_color_check" />
                )}
              </button>
            ))}
          </div>
          
          {/* Preview e Input Personalizado */}
          <div className="ip_color_custom">
            <div className="ip_color_preview_group">
              <div 
                className="ip_color_preview" 
                style={{ backgroundColor: formData.cor }}
              />
              <div>
                <span className="ip_color_code">{formData.cor}</span>
                <p className="ip_color_hint">Cor selecionada</p>
              </div>
            </div>
            
            <div className="ip_color_custom_section">
              <label className="ip_color_custom_label">
                Criar cor personalizada
              </label>
              <input
                type="color"
                value={formData.cor}
                onChange={(e) => handleCorChange(e.target.value)}
                disabled={submitting}
                className="ip_color_input"
                title="Clique para escolher uma cor personalizada"
              />
            </div>
          </div>
        </div>

      {/* Ações do formulário */}
      <div className="ip_flex ip_gap_3">
        <button
          type="button"
          onClick={resetFormulario}
          disabled={submitting}
          className="ip_botao_base ip_botao_cinza"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="ip_botao_base ip_botao_azul"
        >
          {submitting ? (
            <>
              <span className="ip_loading_spinner_pequeno"></span>
              Salvando...
            </>
          ) : (
            <>
              {modoFormulario === 'editar' ? <Edit size={14} /> : <Plus size={14} />}
              {modoFormulario === 'editar' ? 'Atualizar Conta' : 'Criar Conta'}
            </>
          )}
        </button>
      </div>
    </form>
  </div>
)}

{/* Lista de Contas Ativas */}
{!modoFormulario && contas.length > 0 && (
  <div className="ip_mb_3">
    <h3 className="ip_header_secundario">Contas Ativas ({contas.length})</h3>
    <div className="ip_grid_responsivo_cards">
      {contas.map(conta => renderConta(conta, false))}
    </div>
  </div>
)}

{/* Lista de Contas Arquivadas */}
{!modoFormulario && mostrarArquivadas && contasArquivadas.length > 0 && (
  <div className="ip_mb_3">
    <h3 className="ip_header_secundario">Contas Arquivadas ({contasArquivadas.length})</h3>
    <div className="ip_grid_responsivo_cards">
      {contasArquivadas.map(conta => renderConta(conta, true))}
    </div>
  </div>
)}

{/* Estado vazio */}
{!modoFormulario && contas.length === 0 && !loading && (
  <div className="ip_estado_vazio">
    <Building size={48} className="ip_estado_vazio_icone" />
    <h3 className="ip_estado_vazio_titulo">
      {contasArquivadas.length > 0 ? 
        'Todas as contas estão arquivadas' : 
        'Nenhuma conta cadastrada'
      }
    </h3>
    <p className="ip_estado_vazio_descricao">
      {contasArquivadas.length > 0 ? 
        'Use o botão "Ver Arquivadas" para visualizar suas contas arquivadas' :
        'Crie sua primeira conta para começar a controlar suas finanças'
      }
    </p>
    <button
      onClick={iniciarCriacaoConta}
      className="ip_botao_base ip_botao_azul"
    >
      <Plus size={16} />
      Criar Primeira Conta
    </button>
  </div>
)}
              </>
            )}
          </div>
        </div>
      </div>

{/* MODAIS ANINHADOS - Z-INDEX: 1100 */}

{/* Modal de Correção de Saldo */}
{modalCorreirSaldo.ativo && (
  <div className="ip_modal_fundo" style={{ zIndex: 1100 }}>
    <div className="ip_modal_pequeno">
      <div className="ip_modal_header ip_header_azul">
        <div className="ip_flex ip_gap_3">
          <div className="ip_icone_item">
            <Calculator size={18} />
          </div>
          <div>
            <h2 className="ip_modal_titulo">Corrigir Saldo da Conta</h2>
            <p className="ip_modal_subtitulo">Ajuste o saldo conforme necessário</p>
          </div>
        </div>
        <button 
          className="ip_modal_close" 
          onClick={() => setModalCorrigirSaldo({ ativo: false, conta: null, novoSaldo: '', metodo: 'ajuste', motivo: '' })}
        >
          <X size={18} />
        </button>
      </div>
      
      <div className="ip_modal_content">
        <div className="ip_card_pequeno ip_mb_3">
          <h4>{modalCorreirSaldo.conta?.nome}</h4>
          <div className="ip_flex ip_gap_4">
            <div>Saldo inicial: <strong>{formatCurrency(modalCorreirSaldo.conta?.saldo_inicial || 0)}</strong></div>
            <div>Saldo atual: <strong>{formatCurrency(modalCorreirSaldo.conta?.saldo_atual || modalCorreirSaldo.conta?.saldo || 0)}</strong></div>
          </div>
        </div>
        
        <div className="ip_grupo_formulario ip_mb_3">
          <label className="ip_label">Novo saldo desejado:</label>
          <input
            type="text"
            value={modalCorreirSaldo.novoSaldo}
            onChange={(e) => {
              const valor = e.target.value.replace(/[^\d,-]/g, '');
              setModalCorrigirSaldo(prev => ({ ...prev, novoSaldo: valor }));
            }}
            placeholder="0,00"
            className="ip_input_base ip_input_dinheiro"
          />
        </div>

        <div className="ip_grupo_formulario ip_mb_3">
          <label className="ip_label">Como corrigir o saldo:</label>
          <div className="ip_flex ip_gap_2 ip_flex_coluna">
            <label className={`ip_card_pequeno ${modalCorreirSaldo.metodo === 'ajuste' ? 'ip_estado_selecionado ' : ''}`}>
              <input
                type="radio"
                name="metodo"
                value="ajuste"
                checked={modalCorreirSaldo.metodo === 'ajuste'}
                onChange={(e) => setModalCorrigirSaldo(prev => ({ ...prev, metodo: e.target.value }))}
                className="ip_sr_only"
              />
              <div>
                <div className="ip_valor_verde">💰 Criar transação de ajuste</div>
                <div className="ip_label_estatistica">Mantém o histórico completo e registra o motivo do ajuste</div>
              </div>
            </label>
            
            <label className={`ip_card_pequeno ${modalCorreirSaldo.metodo === 'saldo_inicial' ? 'ip_estado_selecionado ' : ''}`}>
              <input
                type="radio"
                name="metodo"
                value="saldo_inicial"
                checked={modalCorreirSaldo.metodo === 'saldo_inicial'}
                onChange={(e) => setModalCorrigirSaldo(prev => ({ ...prev, metodo: e.target.value }))}
                className="ip_sr_only"
              />
              <div>
                <div className="ip_valor_neutro">⚙️ Alterar saldo inicial</div>
                <div className="ip_label_estatistica">Modifica o valor base da conta (use para correções iniciais)</div>
              </div>
            </label>
          </div>
        </div>

        {modalCorreirSaldo.metodo === 'ajuste' && (
          <div className="ip_grupo_formulario ip_mb_3">
            <label className="ip_label">
              Motivo da correção (opcional)
            </label>
            <input
              type="text"
              value={modalCorreirSaldo.motivo}
              onChange={(e) => setModalCorrigirSaldo(prev => ({ ...prev, motivo: e.target.value }))}
              placeholder="Ex: Correção de divergência, transação não registrada"
              className="ip_input_base"
              maxLength={200}
            />
          </div>
        )}
      </div>
      
      <div className="ip_modal_footer">
        <button 
          onClick={() => setModalCorrigirSaldo({ ativo: false, conta: null, novoSaldo: '', metodo: 'ajuste', motivo: '' })}
          className="ip_botao_base ip_botao_cinza"
          disabled={submitting}
        >
          Cancelar
        </button>
        <button 
          onClick={processarCorrecaoSaldo}
          disabled={submitting || !modalCorreirSaldo.novoSaldo}
          className="ip_botao_base ip_botao_verde"
        >
          {submitting ? (
            <>
              <span className="ip_loading_spinner_pequeno"></span>
              Corrigindo...
            </>
          ) : (
            <>
              <Calculator size={14} />
              Corrigir Saldo
            </>
          )}
        </button>
      </div>
    </div>
  </div>
)}

{/* Modal de Arquivamento */}
{modalArquivar.ativo && (
  <div className="ip_modal_fundo" style={{ zIndex: 1100 }}>
    <div className="ip_modal_pequeno">
      <div className="ip_modal_header ip_header_vermelho">
        <div className="ip_flex ip_gap_3">
          <div className="ip_icone_item">
            <Archive size={18} />
          </div>
          <div>
            <h2 className="ip_modal_titulo">Arquivar Conta</h2>
            <p className="ip_modal_subtitulo">Esta ação pode ser desfeita</p>
          </div>
        </div>
        <button 
          className="ip_modal_close" 
          onClick={() => setModalArquivar({ ativo: false, conta: null, motivo: '' })}
        >
          <X size={18} />
        </button>
      </div>
      
      <div className="ip_modal_content">
        <div className="ip_mensagem_feedback aviso ip_mb_3">
          <Archive size={16} />
          <div>
            <strong>{modalArquivar.conta?.nome}</strong>
            <p>
              Você está arquivando esta conta. O saldo de{' '}
              <strong>{formatCurrency(modalArquivar.conta?.saldo_atual || modalArquivar.conta?.saldo || 0)}</strong>{' '}
              será removido do dashboard. As transações continuarão visíveis nos relatórios.
            </p>
          </div>
        </div>
        
        <div className="ip_grupo_formulario ip_mb_3">
          <label className="ip_label">
            Motivo do arquivamento (opcional)
          </label>
          <input
            type="text"
            value={modalArquivar.motivo}
            onChange={(e) => setModalArquivar(prev => ({ ...prev, motivo: e.target.value }))}
            placeholder="Ex: Conta encerrada, não utilizo mais"
            className="ip_input_base"
            maxLength={200}
          />
        </div>
      </div>
      
      <div className="ip_modal_footer">
        <button 
          onClick={() => setModalArquivar({ ativo: false, conta: null, motivo: '' })}
          className="ip_botao_base ip_botao_cinza"
          disabled={submitting}
        >
          Cancelar
        </button>
        <button 
          onClick={processarArquivamento}
          disabled={submitting}
          className="ip_botao_base ip_botao_vermelho"
        >
          {submitting ? (
            <>
              <span className="ip_loading_spinner_pequeno"></span>
              Arquivando...
            </>
          ) : (
            <>
              <Archive size={14} />
              Arquivar Conta
            </>
          )}
        </button>
      </div>
    </div>
  </div>
)}
{/* Modal de Desarquivamento */}
{modalDesarquivar.ativo && (
  <div className="ip_modal_fundo" style={{ zIndex: 1100 }}>
    <div className="ip_modal_pequeno">
      <div className="ip_modal_header ip_header_verde">
        <div className="ip_flex ip_gap_3">
          <div className="ip_icone_item">
            <ArchiveRestore size={18} />
          </div>
          <div>
            <h2 className="ip_modal_titulo">Desarquivar Conta</h2>
            <p className="ip_modal_subtitulo">Reativar conta arquivada</p>
          </div>
        </div>
        <button 
          className="ip_modal_close" 
          onClick={() => setModalDesarquivar({ ativo: false, conta: null })}
        >
          <X size={18} />
        </button>
      </div>
      
      <div className="ip_modal_content">
        <div className="ip_mensagem_feedback sucesso ip_mb_3">
          <ArchiveRestore size={16} />
          <div>
            <strong>{modalDesarquivar.conta?.nome}</strong>
            <p>
              Esta conta será reativada e voltará a aparecer no dashboard. O saldo de{' '}
              <strong>{formatCurrency(modalDesarquivar.conta?.saldo_atual || modalDesarquivar.conta?.saldo || 0)}</strong>{' '}
              será incluído nos cálculos totais novamente.
            </p>
          </div>
        </div>
      </div>
      
      <div className="ip_modal_footer">
        <button 
          onClick={() => setModalDesarquivar({ ativo: false, conta: null })}
          className="ip_botao_base ip_botao_cinza"
          disabled={submitting}
        >
          Cancelar
        </button>
        <button 
          onClick={processarDesarquivamento}
          disabled={submitting}
          className="ip_botao_base ip_botao_verde"
        >
          {submitting ? (
            <>
              <span className="ip_loading_spinner_pequeno"></span>
              Desarquivando...
            </>
          ) : (
            <>
              <ArchiveRestore size={14} />
              Desarquivar Conta
            </>
          )}
        </button>
      </div>
    </div>
        </div>
      )}
    </>
  );
};

ContasModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func
};

export default React.memo(ContasModal);
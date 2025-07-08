// src/modules/transacoes/components/DespesasCartaoModalEdit.jsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { 
  CreditCard, 
  Calendar, 
  FileText, 
  Tag, 
  DollarSign, 
  X,
  Search,
  Edit3,
  AlertCircle,
  HelpCircle,
  Receipt
} from 'lucide-react';

import { useAuthStore } from '@modules/auth/store/authStore';
import { useUIStore } from '@store/uiStore';
import { formatCurrency } from '@utils/formatCurrency';
import { supabase } from '@lib/supabaseClient';
import { useTransactions } from '@modules/transacoes/store/transactionsStore';
import InputMoney from '@shared/components/ui/InputMoney';
import '@shared/styles/FormsModal.css';

const DespesasCartaoModalEdit = ({ isOpen, onClose, onSave, transacaoEditando }) => {
  const { user } = useAuthStore();
  const { showNotification } = useUIStore();
  const { updateGrupoValor, isParceladaOuRecorrente } = useTransactions();
  
  const valorInputRef = useRef(null);

  // Validação obrigatória
  if (!transacaoEditando && isOpen) {
    console.error('DespesasCartaoModalEdit: transacaoEditando é obrigatória');
    return null;
  }

  // Estados principais
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estados para dados
  const [cartoes, setCartoes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);

  // Estados para dropdowns
  const [categoriaDropdownOpen, setCategoriaDropdownOpen] = useState(false);
  const [subcategoriaDropdownOpen, setSubcategoriaDropdownOpen] = useState(false);
  const [categoriasFiltradas, setCategoriasFiltradas] = useState([]);
  const [subcategoriasFiltradas, setSubcategoriasFiltradas] = useState([]);

  // Estado para confirmação de criação de categoria/subcategoria
  const [confirmacao, setConfirmacao] = useState({
    show: false,
    type: '',
    nome: '',
    categoriaId: ''
  });

  // Estados para edição de grupos
  const [mostrarEscopoEdicao, setMostrarEscopoEdicao] = useState(false);
  const [escopoEdicao, setEscopoEdicao] = useState('atual');
  const [transacaoInfo, setTransacaoInfo] = useState(null);
  const [valorOriginal, setValorOriginal] = useState(0);

  // Estado do formulário (SEM observacoes)
  const [formData, setFormData] = useState({
    valor: '',
    data: new Date().toISOString().split('T')[0],
    descricao: '',
    categoria: '',
    categoriaTexto: '',
    subcategoria: '',
    subcategoriaTexto: '',
    cartao: ''
  });

  const [errors, setErrors] = useState({});

  // ===== IDENTIFICAÇÃO AUTOMÁTICA DO TIPO =====
  const tipoTransacao = useMemo(() => {
    if (!transacaoEditando) return 'extra';

    console.log('🔍 Identificando tipo da transação do cartão:', {
      id: transacaoEditando.id,
      grupo_parcelamento: transacaoEditando.grupo_parcelamento,
      parcela_atual: transacaoEditando.parcela_atual,
      total_parcelas: transacaoEditando.total_parcelas
    });

    if (transacaoEditando.grupo_parcelamento) {
      console.log('✅ Transação é PARCELADA (grupo_parcelamento presente)');
      return 'parcelada';
    }

    console.log('✅ Transação é ÚNICA (sem grupo de parcelamento)');
    return 'unica';
  }, [transacaoEditando]);

  // ===== CONFIGURAÇÕES DE TIPO =====
  const tiposCartao = [
    { 
      id: 'unica', 
      nome: 'Compra Única', 
      icone: <CreditCard size={16} />, 
      descricao: 'À vista no cartão', 
      cor: '#3B82F6'
    },
    { 
      id: 'parcelada', 
      nome: 'Compra Parcelada', 
      icone: <Receipt size={16} />, 
      descricao: 'Dividida em parcelas', 
      cor: '#8B5CF6'
    }
  ];

  // ===== FUNÇÕES UTILITÁRIAS =====
  const formatarValor = useCallback((valor) => {
    // Se contém operadores matemáticos, não formatar
    if (/[+\-*/()]/.test(valor)) {
      return valor;
    }
    
    // Formatação normal apenas para números puros
    const apenasNumeros = valor.toString().replace(/\D/g, '');
    if (!apenasNumeros || apenasNumeros === '0') return '';
    const valorEmCentavos = parseInt(apenasNumeros, 10);
    const valorEmReais = valorEmCentavos / 100;
    return valorEmReais.toLocaleString('pt-BR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  }, []);

  // Valor numérico processado
  const valorNumerico = useMemo(() => {
    if (!formData.valor) return 0;
    const valorString = formData.valor.toString();
    
    // Se contém operadores, não converter ainda
    if (/[+\-*/()]/.test(valorString)) {
      return 0;
    }
    
    // Conversão normal apenas para números formatados
    if (valorString.includes(',')) {
      const partes = valorString.split(',');
      const inteira = partes[0].replace(/\./g, '');
      const decimal = partes[1] || '00';
      const valorFinal = parseFloat(`${inteira}.${decimal}`);
      return isNaN(valorFinal) ? 0 : valorFinal;
    } else {
      const apenasNumeros = valorString.replace(/\./g, '');
      const valorFinal = parseFloat(apenasNumeros) / 100;
      return isNaN(valorFinal) ? 0 : valorFinal;
    }
  }, [formData.valor]);

  // Cartões ativos
  const cartoesAtivos = useMemo(() => 
    cartoes.filter(cartao => cartao.ativo !== false), 
    [cartoes]
  );

  // Categoria selecionada
  const categoriaSelecionada = useMemo(() => 
    categorias.find(cat => cat.id === formData.categoria), 
    [categorias, formData.categoria]
  );

  // Subcategorias da categoria
  const subcategoriasDaCategoria = useMemo(() => 
    subcategorias.filter(sub => sub.categoria_id === formData.categoria), 
    [subcategorias, formData.categoria]
  );

  // ===== PREVIEW DINÂMICO =====
  const previewInfo = useMemo(() => {
    const valor = valorNumerico;
    const tipo = tipoTransacao;
    
    if (tipo === 'parcelada' && transacaoInfo) {
      return {
        tipo: 'parcelada',
        icone: <Receipt size={16} />,
        mensagemPrincipal: `Parcela ${transacaoInfo.parcelaAtual} de ${transacaoInfo.totalParcelas}`,
        mensagemSecundaria: `Valor: ${formatCurrency(valor)}`,
        cor: '#8B5CF6'
      };
    }
    
    return {
      tipo: 'unica',
      icone: <CreditCard size={16} />,
      mensagemPrincipal: formatCurrency(valor),
      mensagemSecundaria: 'Compra única no cartão',
      cor: '#3B82F6'
    };
  }, [valorNumerico, tipoTransacao, transacaoInfo]);

  // ===== CARREGAR DADOS =====
  const carregarCartoes = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('cartoes')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('ativo', true)
        .order('nome');
      
      if (error) throw error;
      setCartoes(data || []);
    } catch (error) {
      console.error('Erro ao carregar cartões:', error);
      showNotification('Erro ao carregar cartões', 'error');
    }
  }, [user, showNotification]);

  const carregarDados = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [categoriasRes, subcategoriasRes] = await Promise.all([
        supabase.from('categorias').select('*').eq('usuario_id', user.id).eq('tipo', 'despesa').eq('ativo', true).order('nome'),
        supabase.from('subcategorias').select('*').eq('usuario_id', user.id).eq('ativo', true).order('nome')
      ]);

      setCategorias(categoriasRes.data || []);
      setSubcategorias(subcategoriasRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showNotification('Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, showNotification]);

  // Carregar subcategorias por categoria
  const getSubcategoriasPorCategoria = useCallback(async (categoriaId) => {
    if (!categoriaId || !user?.id) return [];
    
    try {
      const { data, error } = await supabase
        .from('subcategorias')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('categoria_id', categoriaId)
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Erro ao carregar subcategorias:', error);
      return [];
    }
  }, [user?.id]);

  // ===== PREENCHER FORMULÁRIO PARA EDIÇÃO =====
  const preencherFormularioEdicao = useCallback(async () => {
    if (!transacaoEditando || !categorias.length) return;
    
    console.log('🖊️ Preenchendo formulário para edição:', transacaoEditando);
    
    const valorFormatado = transacaoEditando.valor ? 
      transacaoEditando.valor.toLocaleString('pt-BR', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      }) : '';
    
    const categoria = categorias.find(c => c.id === transacaoEditando.categoria_id);
    let subcategoriaTexto = '';
    let subcategoriaId = '';

    if (transacaoEditando.subcategoria_id) {
      console.log('🔍 Carregando subcategoria:', transacaoEditando.subcategoria_id);
      
      try {
        const { data: subcategoriaData, error } = await supabase
          .from('subcategorias')
          .select('*')
          .eq('id', transacaoEditando.subcategoria_id)
          .eq('usuario_id', user.id)
          .single();

        if (!error && subcategoriaData) {
          subcategoriaTexto = subcategoriaData.nome;
          subcategoriaId = subcategoriaData.id;
          console.log('✅ Subcategoria carregada:', subcategoriaData.nome);
          
          const subcategoriasCarregadas = await getSubcategoriasPorCategoria(transacaoEditando.categoria_id);
          setSubcategorias(prev => {
            const semCategoriasAntigas = prev.filter(sub => sub.categoria_id !== transacaoEditando.categoria_id);
            return [...semCategoriasAntigas, ...subcategoriasCarregadas];
          });
        }
      } catch (error) {
        console.error('❌ Erro ao carregar subcategoria:', error);
      }
    }
    
    // SEM observacoes
    setFormData({
      valor: valorFormatado,
      data: transacaoEditando.data || new Date().toISOString().split('T')[0],
      descricao: transacaoEditando.descricao || '', // Permite vazio
      categoria: transacaoEditando.categoria_id || '',
      categoriaTexto: categoria?.nome || '',
      subcategoria: subcategoriaId,
      subcategoriaTexto: subcategoriaTexto,
      cartao: transacaoEditando.cartao_id || ''
    });

    console.log('✅ Formulário preenchido para edição');
  }, [transacaoEditando, categorias, user?.id, getSubcategoriasPorCategoria]);

  // ===== IDENTIFICAR TIPO E GRUPO =====
  useEffect(() => {
    if (transacaoEditando) {
      console.log('🔍 Analisando transação para edição:', transacaoEditando);
      
      const infoGrupo = isParceladaOuRecorrente(transacaoEditando);
      console.log('🎯 Análise do grupo via store:', infoGrupo);
      
      setTransacaoInfo(infoGrupo);
      
      const valorOrig = transacaoEditando.valor || 0;
      setValorOriginal(valorOrig);
      console.log('💰 Valor original armazenado:', valorOrig);
    } else {
      setTransacaoInfo(null);
      setValorOriginal(0);
    }
  }, [transacaoEditando, isParceladaOuRecorrente]);

  // ===== EFFECTS PARA FILTROS =====
  useEffect(() => {
    if (!categorias.length) return;
    const filtradas = formData.categoriaTexto 
      ? categorias.filter(cat => cat.nome.toLowerCase().includes(formData.categoriaTexto.toLowerCase()))
      : categorias;
    setCategoriasFiltradas(filtradas);
  }, [formData.categoriaTexto, categorias]);

  useEffect(() => {
    if (!subcategoriasDaCategoria.length) {
      setSubcategoriasFiltradas([]);
      return;
    }
    const filtradas = formData.subcategoriaTexto 
      ? subcategoriasDaCategoria.filter(sub => sub.nome.toLowerCase().includes(formData.subcategoriaTexto.toLowerCase()))
      : subcategoriasDaCategoria;
    setSubcategoriasFiltradas(filtradas);
  }, [formData.subcategoriaTexto, subcategoriasDaCategoria]);

  // ===== HANDLERS DE INPUT =====
  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    let inputValue = type === 'checkbox' ? checked : value;
    
    if (name === 'categoria') {
      setFormData(prev => ({ 
        ...prev, 
        [name]: inputValue, 
        subcategoria: '', 
        subcategoriaTexto: '' 
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: inputValue }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  }, [errors]);

  // Handle de valor
  const handleValorChange = useCallback((valorNumericoRecebido) => {
    // Se receber um número do InputMoney (calculadora processou)
    if (typeof valorNumericoRecebido === 'number') {
      const valorFormatado = valorNumericoRecebido.toLocaleString('pt-BR', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      });
      setFormData(prev => ({ ...prev, valor: valorFormatado }));
    } else {
      setFormData(prev => ({ ...prev, valor: valorNumericoRecebido }));
    }
    
    // Verificar mudança de valor para grupos
    if (transacaoInfo && transacaoInfo.isParcelada) {
      if (typeof valorNumericoRecebido === 'number') {
        const novoValor = valorNumericoRecebido;
        
        if (novoValor !== valorOriginal && novoValor > 0) {
          setMostrarEscopoEdicao(true);
        } else {
          setMostrarEscopoEdicao(false);
        }
      }
    } else {
      setMostrarEscopoEdicao(false);
    }
    
    if (errors.valor) {
      setErrors(prev => ({ ...prev, valor: null }));
    }
  }, [errors.valor, transacaoInfo, valorOriginal]);

  // ===== HANDLERS DE CATEGORIA =====
  const handleCategoriaChange = useCallback((e) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      categoriaTexto: value,
      categoria: '',
      subcategoria: '',
      subcategoriaTexto: ''
    }));
    setCategoriaDropdownOpen(true);
    if (errors.categoria) {
      setErrors(prev => ({ ...prev, categoria: null }));
    }
  }, [errors.categoria]);

  const handleSelecionarCategoria = useCallback(async (categoria) => {
    setFormData(prev => ({
      ...prev,
      categoria: categoria.id,
      categoriaTexto: categoria.nome,
      subcategoria: '',
      subcategoriaTexto: ''
    }));
    setCategoriaDropdownOpen(false);
    
    const subcategoriasCarregadas = await getSubcategoriasPorCategoria(categoria.id);
    setSubcategorias(prev => {
      const semCategoriasAntigas = prev.filter(sub => sub.categoria_id !== categoria.id);
      return [...semCategoriasAntigas, ...subcategoriasCarregadas];
    });
  }, [getSubcategoriasPorCategoria]);

  const handleCategoriaBlur = useCallback(() => {
    const timer = setTimeout(() => {
      setCategoriaDropdownOpen(false);
      if (formData.categoriaTexto && !formData.categoria) {
        const existe = categorias.find(cat => 
          cat.nome.toLowerCase() === formData.categoriaTexto.toLowerCase()
        );
        if (!existe) {
          setConfirmacao({
            show: true,
            type: 'categoria',
            nome: formData.categoriaTexto,
            categoriaId: ''
          });
        }
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [formData.categoriaTexto, formData.categoria, categorias]);

  // ===== HANDLERS DE SUBCATEGORIA =====
  const handleSubcategoriaChange = useCallback((e) => {
    const { value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      subcategoriaTexto: value, 
      subcategoria: '' 
    }));
    if (categoriaSelecionada) {
      setSubcategoriaDropdownOpen(true);
    }
  }, [categoriaSelecionada]);

  const handleSelecionarSubcategoria = useCallback((subcategoria) => {
    setFormData(prev => ({
      ...prev,
      subcategoria: subcategoria.id,
      subcategoriaTexto: subcategoria.nome
    }));
    setSubcategoriaDropdownOpen(false);
  }, []);

  const handleSubcategoriaBlur = useCallback(() => {
    const timer = setTimeout(() => {
      setSubcategoriaDropdownOpen(false);
      if (formData.subcategoriaTexto && !formData.subcategoria && categoriaSelecionada) {
        const existe = subcategoriasDaCategoria.find(sub => 
          sub.nome.toLowerCase() === formData.subcategoriaTexto.toLowerCase()
        );
        if (!existe) {
          setConfirmacao({
            show: true,
            type: 'subcategoria',
            nome: formData.subcategoriaTexto,
            categoriaId: formData.categoria
          });
        }
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [formData.subcategoriaTexto, formData.subcategoria, formData.categoria, categoriaSelecionada, subcategoriasDaCategoria]);

  // ===== CRIAR CATEGORIA/SUBCATEGORIA =====
  const handleConfirmarCriacao = useCallback(async () => {
    try {
      if (confirmacao.type === 'categoria') {
        const { data, error } = await supabase
          .from('categorias')
          .insert([{
            nome: confirmacao.nome,
            tipo: 'despesa',
            cor: '#EF4444',
            usuario_id: user.id,
            ativo: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();
        
        if (error) throw error;
        
        setFormData(prev => ({
          ...prev,
          categoria: data.id,
          categoriaTexto: data.nome
        }));
        
        setCategorias(prev => [...prev, data]);
        showNotification(`Categoria "${confirmacao.nome}" criada com sucesso!`, 'success');
        
      } else if (confirmacao.type === 'subcategoria') {
        const { data, error } = await supabase
          .from('subcategorias')
          .insert([{
            nome: confirmacao.nome,
            categoria_id: confirmacao.categoriaId,
            usuario_id: user.id,
            ativo: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();
        
        if (error) throw error;
        
        setFormData(prev => ({
          ...prev,
          subcategoria: data.id,
          subcategoriaTexto: data.nome
        }));
        
        setSubcategorias(prev => [...prev, data]);
        showNotification(`Subcategoria "${confirmacao.nome}" criada com sucesso!`, 'success');
      }
    } catch (error) {
      console.error('❌ Erro ao criar categoria/subcategoria:', error);
      showNotification('Erro inesperado. Tente novamente.', 'error');
    }
    
    setConfirmacao({ show: false, type: '', nome: '', categoriaId: '' });
  }, [confirmacao, user.id, showNotification]);

  // ===== RESET FORM =====
  const resetForm = useCallback(() => {
    // SEM observacoes
    setFormData({
      valor: '',
      data: new Date().toISOString().split('T')[0],
      descricao: '',
      categoria: '',
      categoriaTexto: '',
      subcategoria: '',
      subcategoriaTexto: '',
      cartao: ''
    });
    setErrors({});
    setEscopoEdicao('atual');
    setMostrarEscopoEdicao(false);
    setTransacaoInfo(null);
    setValorOriginal(0);
    setCategoriaDropdownOpen(false);
    setSubcategoriaDropdownOpen(false);
    setConfirmacao({ show: false, type: '', nome: '', categoriaId: '' });
  }, []);

  // ===== VALIDAÇÃO =====
  const validateForm = useCallback(() => {
    const newErrors = {};
    
    if (!valorNumerico || valorNumerico === 0) {
      newErrors.valor = "Valor é obrigatório";
    }
    if (!formData.data) {
      newErrors.data = "Data é obrigatória";
    }
    // REMOVIDO: Validação obrigatória de descrição
    if (!formData.categoria && !formData.categoriaTexto.trim()) {
      newErrors.categoria = "Categoria é obrigatória";
    }
    if (!formData.cartao) {
      newErrors.cartao = "Cartão é obrigatório";
    }
    // REMOVIDO: Validação de observações
    
    if (transacaoInfo && mostrarEscopoEdicao && !escopoEdicao) {
      newErrors.escopoEdicao = "Escolha o escopo da alteração";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, valorNumerico, transacaoInfo, mostrarEscopoEdicao, escopoEdicao]);

  // ===== ATUALIZAR TRANSAÇÃO =====
  const atualizarTransacao = useCallback(async () => {
    try {
      if (transacaoInfo && mostrarEscopoEdicao && transacaoInfo.isParcelada) {
        console.log('🔄 Atualizando grupo de transações do cartão:', {
          transacaoId: transacaoEditando.id,
          escopoEdicao,
          valorNumerico,
          transacaoInfo
        });

        const resultado = await updateGrupoValor(
          transacaoEditando.id,
          escopoEdicao,
          valorNumerico
        );

        if (!resultado.success) {
          throw new Error(resultado.error || 'Erro ao atualizar grupo de transações');
        }

        showNotification(resultado.message || 'Transações atualizadas com sucesso!', 'success');
        return true;
      }

      // CORRIGIDO - descrição sempre preenchida (campo obrigatório no banco)
      const dadosAtualizacao = {
        data: formData.data,
        descricao: formData.descricao.trim() || 'Compra cartão', // Valor padrão se vazio
        categoria_id: formData.categoria,
        subcategoria_id: formData.subcategoria || null,
        cartao_id: formData.cartao,
        valor: valorNumerico,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('transacoes')
        .update(dadosAtualizacao)
        .eq('id', transacaoEditando.id)
        .eq('usuario_id', user.id);

      if (error) throw error;

      showNotification('Despesa do cartão atualizada com sucesso!', 'success');
      return true;
    } catch (error) {
      console.error('❌ Erro ao atualizar despesa do cartão:', error);
      throw error;
    }
  }, [formData, valorNumerico, transacaoEditando, user.id, showNotification, transacaoInfo, mostrarEscopoEdicao, escopoEdicao, updateGrupoValor]);

  // ===== SUBMISSÃO =====
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showNotification('Por favor, corrija os erros no formulário', 'error');
      return;
    }
    
    try {
      setSubmitting(true);
      
      await atualizarTransacao();
      await carregarCartoes();
      
      if (onSave) onSave();
      
      setTimeout(() => {
        resetForm();
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('❌ Erro ao salvar despesa do cartão:', error);
      showNotification(`Erro ao salvar despesa do cartão: ${error.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  }, [validateForm, atualizarTransacao, carregarCartoes, onSave, showNotification, resetForm, onClose]);

  const handleCancelar = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  // ===== EFFECTS =====
  useEffect(() => {
    if (isOpen && user) {
      carregarCartoes();
      carregarDados();
    }
  }, [isOpen, user, carregarCartoes, carregarDados]);

  useEffect(() => {
    if (isOpen && categorias.length > 0 && transacaoEditando) {
      preencherFormularioEdicao();
    }
  }, [isOpen, categorias.length, transacaoEditando, preencherFormularioEdicao]);

  useEffect(() => {
    if (isOpen && transacaoEditando) {
      setTimeout(() => valorInputRef.current?.focus(), 150);
    }
  }, [isOpen, transacaoEditando]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleCancelar();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, handleCancelar]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay active">
      <div className="forms-modal-container">
        {/* Modal de Confirmação de Criação */}
        {confirmacao.show && (
          <div className="modal-overlay-confirmation">
            <div className="forms-modal-container modal-small">
              <div className="modal-header">
                <div className="modal-header-content">
                  <div className="modal-icon-container modal-icon-purple">
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <h2 className="modal-title">
                      Criar Nova {confirmacao.type === 'categoria' ? 'Categoria' : 'Subcategoria'}
                    </h2>
                    <p className="modal-subtitle">
                      {confirmacao.type === 'categoria' ? 'A categoria' : 'A subcategoria'}{' '}
                      <strong>"{confirmacao.nome}"</strong> não existe. Deseja criá-la?
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button 
                  onClick={() => setConfirmacao({ show: false, type: '', nome: '', categoriaId: '' })}
                  className="btn-cancel"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleConfirmarCriacao}
                  className="btn-primary"
                >
                  Criar {confirmacao.type === 'categoria' ? 'Categoria' : 'Subcategoria'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <div className="modal-icon-container modal-icon-purple">
              <Edit3 size={18} />
            </div>
            <div>
              <h2 className="modal-title">Editar Despesa do Cartão</h2>
              <p className="modal-subtitle">
                {transacaoInfo?.isParcelada && `Parcela ${transacaoInfo.parcelaAtual}/${transacaoInfo.totalParcelas}`}
                {!transacaoInfo && 'Compra única no cartão'}
              </p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p className="loading-text">Carregando dados...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              
              {/* ESCOPO DE EDIÇÃO */}
              {transacaoInfo && mostrarEscopoEdicao && transacaoInfo.isParcelada && (
                <div className="confirmation-warning mb-3">
                  <AlertCircle size={16} />
                  <div>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
                      Compra Parcelada Detectada
                    </h4>
                    <p style={{ margin: '0 0 12px 0', fontSize: '13px', lineHeight: '1.4' }}>
                      Esta é a parcela {transacaoInfo.parcelaAtual} de {transacaoInfo.totalParcelas}. Você alterou o valor.
                      <br />Escolha o escopo da alteração:
                    </p>
                    
                    <div className="confirmation-options" style={{ gap: '8px' }}>
                      <label className={`confirmation-option ${escopoEdicao === 'atual' ? 'active' : ''}`}>
                        <input
                          type="radio"
                          name="escopoEdicao"
                          value="atual"
                          checked={escopoEdicao === 'atual'}
                          onChange={(e) => setEscopoEdicao(e.target.value)}
                          disabled={submitting}
                        />
                        <div className="confirmation-option-content">
                          <div className="confirmation-option-header">
                            <CreditCard size={16} />
                            <span>Alterar apenas esta parcela</span>
                          </div>
                          <p className="confirmation-option-description">
                            Modifica somente a parcela atual, mantendo as demais com o valor original
                          </p>
                        </div>
                      </label>
                      
                      <label className={`confirmation-option ${escopoEdicao === 'futuras' ? 'active' : ''}`}>
                        <input
                          type="radio"
                          name="escopoEdicao"
                          value="futuras"
                          checked={escopoEdicao === 'futuras'}
                          onChange={(e) => setEscopoEdicao(e.target.value)}
                          disabled={submitting}
                        />
                        <div className="confirmation-option-content">
                          <div className="confirmation-option-header">
                            <AlertCircle size={16} />
                            <span>Alterar esta e todas as parcelas futuras</span>
                          </div>
                          <p className="confirmation-option-description">
                            Modifica esta parcela e todas as parcelas ainda não efetivadas
                          </p>
                        </div>
                      </label>
                    </div>
                    
                    {errors.escopoEdicao && <div className="form-error">{errors.escopoEdicao}</div>}
                  </div>
                </div>
              )}

              {/* TIPO DE COMPRA - APENAS DISPLAY */}
              <div className="flex flex-col mb-3">
                <div 
                  className="type-selector mb-2" 
                  style={{ 
                    background: '#f8fafc', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '6px', 
                    padding: '4px',
                    display: 'flex',
                    gap: '2px'
                  }}
                >
                  {tiposCartao.map((tipo) => (
                    <div
                      key={tipo.id}
                      className={`type-option ${tipoTransacao === tipo.id ? 'active' : 'inactive'}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        background: tipoTransacao === tipo.id ? tipo.cor + '15' : 'transparent',
                        border: tipoTransacao === tipo.id ? `1px solid ${tipo.cor}` : '1px solid transparent',
                        opacity: tipoTransacao === tipo.id ? 1 : 0.4,
                        flex: 1,
                        cursor: 'default',
                        minHeight: '44px'
                      }}
                    >
                      <div style={{ 
                        color: tipo.cor, 
                        marginRight: '6px', 
                        fontSize: '16px',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        {tipo.icone}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ 
                          fontWeight: '600', 
                          fontSize: '13px', 
                          lineHeight: '1.2',
                          color: tipoTransacao === tipo.id ? '#111827' : '#9ca3af'
                        }}>
                          {tipo.nome}
                        </div>
                        <div style={{ 
                          fontSize: '11px', 
                          color: '#6b7280',
                          lineHeight: '1.2',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {tipo.descricao}
                        </div>
                      </div>
                      {tipoTransacao === tipo.id && (
                        <div style={{ 
                          color: tipo.cor, 
                          fontWeight: 'bold',
                          fontSize: '14px',
                          marginLeft: '4px'
                        }}>
                          ✓
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {transacaoInfo && transacaoInfo.isParcelada && (
                  <div className="confirmation-info-box" style={{ 
                    marginTop: '4px',
                    padding: '6px 8px',
                    fontSize: '12px'
                  }}>
                    <HelpCircle size={14} />
                    <p style={{ margin: 0 }}>
                      💳 Parcela {transacaoInfo.parcelaAtual} de {transacaoInfo.totalParcelas}
                    </p>
                  </div>
                )}
              </div>

              {/* VALOR E DATA */}
              <div className="flex gap-3 row mb-3">
                <div>
                  <label className="form-label">
                    <DollarSign size={14} />
                    Valor *
                  </label>
                  <InputMoney
                    ref={valorInputRef}
                    value={typeof formData.valor === 'string' && /[+\-*/()]/.test(formData.valor) ? 0 : valorNumerico}
                    onChange={handleValorChange}
                    placeholder="R$ 0,00 (ou 5+3,50)"
                    disabled={submitting}
                    enableCalculator={true}
                    showCalculationFeedback={true}
                    className={`input-money-highlight ${errors.valor ? 'error' : ''}`}
                  />
                  {errors.valor && <div className="form-error">{errors.valor}</div>}
                </div>
                
                <div>
                  <label className="form-label">
                    <Calendar size={14} />
                    Data da Compra *
                  </label>
                  <input
                    type="date"
                    name="data"
                    value={formData.data}
                    onChange={handleInputChange}
                    disabled={submitting}
                    className={`input-date ${errors.data ? 'error' : ''}`}
                  />
                  {errors.data && <div className="form-error">{errors.data}</div>}
                </div>
              </div>

              {/* PREVIEW */}
              {valorNumerico > 0 && (
                <div className="summary-panel summary-panel-purple mb-3" style={{ borderColor: previewInfo.cor }}>
                  <div className="summary-header">
                    {previewInfo.icone}
                    <strong>Editando {tiposCartao.find(t => t.id === tipoTransacao)?.nome}</strong>
                  </div>
                  <h4 className="summary-title">{previewInfo.mensagemPrincipal}</h4>
                  <p className="summary-value">{previewInfo.mensagemSecundaria}</p>
                </div>
              )}

              {/* DESCRIÇÃO - OPCIONAL NA INTERFACE MAS OBRIGATÓRIA NO BANCO */}
              <div className="flex flex-col mb-3">
                <label className="form-label">
                  <FileText size={14} />
                  Descrição
                </label>
                <input
                  type="text"
                  name="descricao"
                  placeholder="Ex: Compra na Amazon, Supermercado, Combustível..."
                  value={formData.descricao}
                  onChange={handleInputChange}
                  disabled={submitting}
                  className={`input-text ${errors.descricao ? 'error' : ''}`}
                />
                {errors.descricao && <div className="form-error">{errors.descricao}</div>}
              </div>

              {/* CATEGORIA */}
              <div className="flex flex-col mb-3">
                <label className="form-label">
                  <Tag size={14} />
                  Categoria *
                </label>
                <div className="dropdown-container">
                  <div style={{position: 'relative'}}>
                    <input
                      type="text"
                      value={formData.categoriaTexto}
                      onChange={handleCategoriaChange}
                      onBlur={handleCategoriaBlur}
                      onFocus={() => setCategoriaDropdownOpen(true)}
                      placeholder="Digite ou selecione uma categoria"
                      disabled={submitting}
                      autoComplete="off"
                      className={`input-text input-with-icon ${!formData.categoria ? 'input-muted' : ''} ${errors.categoria ? 'error' : ''}`}
                      style={{
                        paddingLeft: categoriaSelecionada ? '28px' : '10px'
                      }}
                    />
                    {categoriaSelecionada && (
                      <div
                        style={{
                          position: 'absolute',
                          left: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: categoriaSelecionada.cor || '#ef4444',
                          pointerEvents: 'none'
                        }}
                      />
                    )}
                    <Search size={14} className="input-search-icon" />
                  </div>
                  
                  {categoriaDropdownOpen && categoriasFiltradas.length > 0 && (
                    <div className="dropdown-options">
                      {categoriasFiltradas.map(categoria => (
                        <div
                          key={categoria.id}
                          onMouseDown={() => handleSelecionarCategoria(categoria)}
                          className="dropdown-option"
                        >
                          <div 
                            className="category-color-tag"
                            style={{backgroundColor: categoria.cor || '#ef4444'}}
                          ></div>
                          {categoria.nome}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {errors.categoria && <div className="form-error">{errors.categoria}</div>}
              </div>

              {/* SUBCATEGORIA */}
              {categoriaSelecionada && (
                <div className="flex flex-col mb-3">
                  <label className="form-label">
                    <Tag size={14} />
                    Subcategoria <span className="form-label-small">({subcategoriasDaCategoria.length} disponíveis)</span>
                  </label>
                  <div className="dropdown-container">
                    <div style={{position: 'relative'}}>
                      <input
                        type="text"
                        value={formData.subcategoriaTexto}
                        onChange={handleSubcategoriaChange}
                        onBlur={handleSubcategoriaBlur}
                        onFocus={() => setSubcategoriaDropdownOpen(true)}
                        placeholder="Digite ou selecione uma subcategoria"
                        disabled={submitting}
                        autoComplete="off"
                        className="input-text input-with-icon"
                        style={{
                          paddingLeft: '28px'
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          left: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: categoriaSelecionada.cor || '#ef4444',
                          pointerEvents: 'none'
                        }}
                      />
                      <Search size={14} className="input-search-icon" />
                    </div>
                    
                    {subcategoriaDropdownOpen && subcategoriasFiltradas.length > 0 && (
                      <div className="dropdown-options">
                        {subcategoriasFiltradas.map(subcategoria => (
                          <div
                            key={subcategoria.id}
                            onMouseDown={() => handleSelecionarSubcategoria(subcategoria)}
                            className="dropdown-option"
                          >
                            <div 
                              className="category-color-tag"
                              style={{backgroundColor: categoriaSelecionada.cor || '#ef4444'}}
                            ></div>
                            {subcategoria.nome}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* CARTÃO */}
              <div className="flex flex-col mb-3">
                <label className="form-label">
                  <CreditCard size={14} />
                  Cartão *
                </label>
                <div className="select-search">
                  <select
                    name="cartao"
                    value={formData.cartao}
                    onChange={handleInputChange}
                    disabled={submitting}
                    className={errors.cartao ? 'error' : ''}
                  >
                    <option value="">Selecione um cartão</option>
                    {cartoesAtivos.map(cartao => (
                      <option key={cartao.id} value={cartao.id}>
                        {cartao.nome} ({cartao.bandeira})
                      </option>
                    ))}
                  </select>
                </div>
                {errors.cartao && <div className="form-error">{errors.cartao}</div>}
                
                {cartoesAtivos.length === 0 && (
                  <div className="form-info">
                    Nenhum cartão ativo encontrado. Crie um cartão primeiro.
                  </div>
                )}
              </div>

            </form>
          )}
        </div>

        {/* AÇÕES */}
        <div className="modal-footer">
          <button
            type="button"
            onClick={handleCancelar}
            disabled={submitting}
            className="btn-cancel"
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary"
          >
            {submitting ? (
              <>
                <span className="btn-spinner"></span>
                Atualizando...
              </>
            ) : (
              <>
                <Edit3 size={14} />
                {mostrarEscopoEdicao ? 'Atualizar Grupo' : 'Atualizar Compra'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

DespesasCartaoModalEdit.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func,
  transacaoEditando: PropTypes.object.isRequired
};

export default React.memo(DespesasCartaoModalEdit);
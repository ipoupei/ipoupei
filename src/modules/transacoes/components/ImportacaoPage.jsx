// src/modules/transacoes/components/ImportacaoPage.jsx - VERSÃO REFATORADA COM CARTÕES
import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Check, X, Search, TrendingUp, TrendingDown, CheckCircle, AlertCircle, Eye, Trash2, Save, Settings, CheckSquare, Code, Database, Tag, Building, ArrowLeft, CreditCard, Calendar } from 'lucide-react';
import { useUIStore } from '@store/uiStore';
import useAuth from '@modules/auth/hooks/useAuth';
import useCartoesData from '@modules/cartoes/hooks/useCartoesData';
import useFaturaOperations from '@modules/cartoes/hooks/useFaturaOperations';
import PageContainer from '@shared/components/layouts/PageContainer';
import '@modules/importacao/styles/ImportacaoModal.css';
import { PDFExtractor } from '@modules/importacao/utils/parsers/extractors/pdfExtractor.js';
import { CSVExtractor } from '@modules/importacao/utils/parsers/extractors/csvExtractor.js';
import { ExcelExtractor } from '@modules/importacao/utils/parsers/extractors/excelExtractor.js';
import { saveFailedFile } from '@utils/failedFilesSaver';

const formatarValorBR = (valor) => {
  return valor.toString().replace('.', ',');
};

const ImportacaoPage = () => {
  const navigate = useNavigate();
  
  // ===== ESTADOS LOCAIS EXISTENTES =====
  const [currentStep, setCurrentStep] = useState('upload');
  const [file, setFile] = useState(null);
  const [transacoes, setTransacoes] = useState([]);
  const [selectedTransactions, setSelectedTransactions] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ search: '', type: '', status: '' });
  
  // Estados para dropdowns
  const [categoriaDropdownOpen, setCategoriaDropdownOpen] = useState({});
  const [subcategoriaDropdownOpen, setSubcategoriaDropdownOpen] = useState({});
  
  // Estados locais para dados
  const [contas, setContas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  
  // ===== NOVOS ESTADOS PARA CARTÕES =====
  const [tipoImportacao, setTipoImportacao] = useState(''); // 'conta' | 'cartao'
  const [contaSelecionada, setContaSelecionada] = useState('');
  const [cartaoSelecionado, setCartaoSelecionado] = useState('');
  const [faturaVencimento, setFaturaVencimento] = useState('');
  const [cartoes, setCartoes] = useState([]);
  const [opcoesFaturaImportacao, setOpcoesFaturaImportacao] = useState([]);
  
  const fileInputRef = useRef(null);


// Adicionar no topo do componente
const [showProgressDetail, setShowProgressDetail] = useState(false);
const [showDetailedSummary, setShowDetailedSummary] = useState(false);
const [showImportInfo, setShowImportInfo] = useState(false);


  // ===== HOOKS =====
  const { user } = useAuth();
  const { showNotification } = useUIStore();
  
  // ✅ NOVOS HOOKS PARA CARTÕES
  const { 
    fetchCartoes,
    calcularFaturaVencimento,
    loading: cartoesLoading 
  } = useCartoesData();
  
  const { 
    criarDespesaCartao,
    loading: operationLoading 
  } = useFaturaOperations();

  // ===== FUNÇÕES AUXILIARES (mantidas) =====
  const updateTransaction = (id, field, value) => {
    setTransacoes(prev => prev.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    ));
  };

  const toggleTransactionSelection = (id) => {
    setSelectedTransactions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // ===== FUNÇÕES PARA CARREGAR DADOS (expandidas) =====
  const carregarContas = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { default: supabase } = await import('@lib/supabaseClient');
      const { data, error } = await supabase
        .from('contas')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('ativo', true)
        .order('nome');
      
      if (error) throw error;
      setContas(data || []);
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
    }
  }, [user?.id]);

  // ✅ NOVA FUNÇÃO: Carregar cartões
  const carregarCartoes = useCallback(async () => {
    if (!user?.id) return;
    try {
      console.log('🎯 Carregando cartões para importação...');
      const cartoesData = await fetchCartoes();
      const cartoesAtivos = cartoesData.filter(c => c.ativo !== false);
      setCartoes(cartoesAtivos);
      console.log('✅ Cartões carregados:', cartoesAtivos.length);
    } catch (error) {
      console.error('❌ Erro ao carregar cartões:', error);
      showNotification('Erro ao carregar cartões', 'error');
    }
  }, [user?.id, fetchCartoes, showNotification]);

  // ✅ NOVA FUNÇÃO: Calcular faturas do cartão selecionado
  const calcularOpcoesFaturaImportacao = useCallback(async () => {
    if (!cartaoSelecionado) {
      setOpcoesFaturaImportacao([]);
      return;
    }

    try {
      console.log('🎯 Calculando faturas para cartão:', cartaoSelecionado);
      
      const cartao = cartoes.find(c => c.id === cartaoSelecionado);
      if (!cartao) return;

      const hoje = new Date();
      const dataReferencia = hoje.toISOString().split('T')[0];
      
      const faturaCalculada = await calcularFaturaVencimento(cartaoSelecionado, dataReferencia);
      
      if (!faturaCalculada) {
        console.warn('⚠️ Não foi possível calcular fatura, usando fallback');
        setOpcoesFaturaImportacao([]);
        return;
      }
      
      const opcoes = [];
      const dataBase = faturaCalculada.data_vencimento;
      
      // Gerar 6 opções: 2 anteriores + atual + 3 próximas
      for (let i = -12; i <= 3; i++) {
        const partes = dataBase.split('-');
        const ano = parseInt(partes[0]);
        const mes = parseInt(partes[1]) - 1;
        const dia = parseInt(partes[2]);
        
        const novaData = new Date(ano, mes + i, dia);
        const dataFormatada = `${novaData.getFullYear()}-${String(novaData.getMonth() + 1).padStart(2, '0')}-${String(novaData.getDate()).padStart(2, '0')}`;
        
        opcoes.push({
          value: dataFormatada,
          label: `${novaData.toLocaleDateString('pt-BR', { 
            month: 'short', 
            year: 'numeric' 
          }).replace('.', '')} - Venc: ${novaData.toLocaleDateString('pt-BR')}`,
          isDefault: i === 0
        });
      }
      
      setOpcoesFaturaImportacao(opcoes);
      
      // Auto-selecionar a fatura padrão
      const faturaDefault = opcoes.find(opcao => opcao.isDefault);
      if (faturaDefault && !faturaVencimento) {
        setFaturaVencimento(faturaDefault.value);
      }
      
      console.log('✅ Faturas calculadas:', opcoes);
      
    } catch (error) {
      console.error('❌ Erro ao calcular faturas:', error);
      setOpcoesFaturaImportacao([]);
    }
  }, [cartaoSelecionado, cartoes, calcularFaturaVencimento, faturaVencimento]);

  const carregarCategorias = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { default: supabase } = await import('@lib/supabaseClient');
      const [categoriasRes, subcategoriasRes] = await Promise.all([
        supabase.from('categorias').select('*').eq('usuario_id', user.id).eq('ativo', true).order('nome'),
        supabase.from('subcategorias').select('*').eq('usuario_id', user.id).eq('ativo', true).order('nome')
      ]);

      setCategorias(categoriasRes.data || []);
      setSubcategorias(subcategoriasRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  }, [user?.id]);

  // ===== EFEITOS (expandidos) =====
  useEffect(() => {
    if (user?.id) {
      setLoadingData(true);
      Promise.all([carregarContas(), carregarCartoes(), carregarCategorias()])
        .finally(() => setLoadingData(false));
    }
  }, [user?.id, carregarContas, carregarCartoes, carregarCategorias]);

  // ✅ NOVO EFEITO: Calcular faturas quando cartão mudar
  useEffect(() => {
    if (tipoImportacao === 'cartao' && cartaoSelecionado) {
      calcularOpcoesFaturaImportacao();
    } else {
      setOpcoesFaturaImportacao([]);
      setFaturaVencimento('');
    }
  }, [tipoImportacao, cartaoSelecionado, calcularOpcoesFaturaImportacao]);

  // Auto-selecionar primeira opção disponível
  useEffect(() => {
    if (tipoImportacao === 'conta' && contas.length > 0 && !contaSelecionada) {
      setContaSelecionada(contas[0].id);
    } else if (tipoImportacao === 'cartao' && cartoes.length > 0 && !cartaoSelecionado) {
      setCartaoSelecionado(cartoes[0].id);
    }
  }, [tipoImportacao, contas, cartoes, contaSelecionada, cartaoSelecionado]);

  // ===== DADOS COMPUTADOS =====
  const categoriasReceita = useMemo(() => 
    categorias.filter(cat => cat.tipo === 'receita'), [categorias]
  );
  
  const categoriasDespesa = useMemo(() => 
    categorias.filter(cat => cat.tipo === 'despesa'), [categorias]
  );

  // ===== FUNÇÕES AUXILIARES PARA SUBCATEGORIAS (mantidas) =====
  const getSubcategoriasPorCategoria = useCallback((categoriaId) => {
    return subcategorias.filter(sub => sub.categoria_id === categoriaId);
  }, [subcategorias]);

  const getSubcategoriasFiltradas = useCallback((categoriaId, searchText = '') => {
    let subs = getSubcategoriasPorCategoria(categoriaId);
    if (searchText) {
      subs = subs.filter(sub => 
        sub.nome.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    return subs;
  }, [getSubcategoriasPorCategoria]);

  // ===== CARREGADOR E CONFIGURADOR DE PDF.JS (mantido) =====
  const loadPDFJS = useCallback(async () => {
    if (typeof window !== 'undefined' && window.pdfjsLib) {
      console.log('✅ PDF.js já está carregado');
      return true;
    }
    
    try {
      console.log('📦 Carregando PDF.js...');
      
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.async = true;
        
        script.onload = () => {
          console.log('✅ PDF.js carregado');
          resolve();
        };
        
        script.onerror = () => {
          console.error('❌ Erro ao carregar PDF.js');
          reject(new Error('Falha ao carregar PDF.js'));
        };
        
        document.head.appendChild(script);
      });
      
      if (window.pdfjsLib && !window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      }
      
      console.log('✅ PDF.js configurado com sucesso');
      return true;
      
    } catch (error) {
      console.error('❌ Erro ao carregar PDF.js:', error);
      return false;
    }
  }, []);

  // ===== PARSER DE PDF (mantido) =====
const parsePDF = useCallback(async (file) => {
  try {
    console.log('📄 Iniciando parse PDF com PDFExtractor...');
    
    // Usar seu PDFExtractor para extrair dados
    const rawData = await PDFExtractor.extract(file);
    
    // Validar dados extraídos
    const validation = PDFExtractor.validate(rawData);
    if (!validation.isValid) {
      throw new Error(`PDF inválido: ${validation.errors.join(', ')}`);
    }
    
    // Converter para transações
    let transacoes = PDFExtractor.parseTransactions(rawData);
    
    // Aplicar configurações da importação (conta/cartão)
    transacoes = transacoes.map((t, index) => ({
      ...t,
      id: index + 1,
      // Aplicar regras baseadas no tipo de importação
      tipo: tipoImportacao === 'cartao' ? 'despesa' : t.tipo,
      conta_id: tipoImportacao === 'conta' ? contaSelecionada : '',
      cartao_id: tipoImportacao === 'cartao' ? cartaoSelecionado : '',
      fatura_vencimento: tipoImportacao === 'cartao' ? faturaVencimento : '',
      efetivado: tipoImportacao === 'conta' ? t.efetivado : false
    }));
    
    console.log('✅ PDF processado:', transacoes.length, 'transações');
    return transacoes;
    
  } catch (error) {
    console.error('❌ Erro no PDFExtractor:', error);
    throw new Error(`Erro ao processar PDF: ${error.message}`);
  }
}, [tipoImportacao, contaSelecionada, cartaoSelecionado, faturaVencimento]);

  // ===== FUNÇÃO BASEADA NO HTML DEMONSTRATIVO (ajustada) =====
  const analisarTransacoesPDF = useCallback((texto, tipo, conta, cartao, fatura) => {
    const transacoes = [];
    const linhas = texto.split('\n');
    
    const tipoDocumento = detectarTipoDocumento(texto);
    console.log('📄 Tipo detectado:', tipoDocumento);
    console.log('🎯 Parâmetros recebidos:', { tipo, conta, cartao, fatura });
    
    console.log('📋 Analisando', linhas.length, 'linhas de texto');
    
    const padroes = [
      /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([+-]?\d{1,3}(?:\.\d{3})*,\d{2})/g,
      /(\d{2}\/\d{2})\s+(.+?)\s+([+-]?\d{1,3}(?:\.\d{3})*,\d{2})/g,
      /([+-]?\d{1,3}(?:\.\d{3})*,\d{2})\s+(.+?)\s+(\d{2}\/\d{2})/g,
    ];

    for (const linha of linhas) {
      for (const padrao of padroes) {
        const matches = [...linha.matchAll(padrao)];
        
        for (const match of matches) {
          let data, descricao, valor;
          
          if (padrao === padroes[0]) {
            [, data, descricao, valor] = match;
          } else if (padrao === padroes[1]) {
            [, data, descricao, valor] = match;
            data = data + '/' + new Date().getFullYear();
          } else if (padrao === padroes[2]) {
            [, valor, descricao, data] = match;
            data = data + '/' + new Date().getFullYear();
          }

          descricao = descricao.trim().replace(/\s+/g, ' ');
          valor = parseFloat(valor.replace(/\./g, '').replace(',', '.'));
          
          // ✅ AJUSTE: Determinar tipo baseado na importação
          let tipoTransacao;
          if (tipo === 'cartao') {
            tipoTransacao = 'despesa'; // Para cartão, sempre despesa
          } else {
            // Para conta, usar lógica original
            if (tipoDocumento === 'fatura_cartao') {
              tipoTransacao = 'despesa';
            } else {
              tipoTransacao = valor >= 0 ? 'receita' : 'despesa';
            }
          }
          valor = Math.abs(valor);

          if (valor > 0 && descricao.length > 3) {
            const novaTransacao = {
              id: transacoes.length,
              data: converterData(data),
              descricao: descricao,
              valor: valor,
              tipo: tipoTransacao,
              categoria_id: '',
              categoriaTexto: '',
              subcategoria_id: '',
              subcategoriaTexto: '',
              // ✅ AJUSTE: Usar conta ou cartão baseado no tipo
              conta_id: tipo === 'conta' ? conta : '',
              cartao_id: tipo === 'cartao' ? cartao : '',
              fatura_vencimento: tipo === 'cartao' ? fatura : '',
              efetivado: tipo === 'conta' ? true : false, // Cartão sempre false
              observacoes: 'Importado via PDF',
              origem: 'PDF'
            };
            
            console.log('📄 Transação criada (PDF):', {
              tipo: tipo,
              cartao_id: novaTransacao.cartao_id,
              conta_id: novaTransacao.conta_id,
              fatura_vencimento: novaTransacao.fatura_vencimento
            });
            
            transacoes.push(novaTransacao);
          }
        }
      }
    }

    const transacoesUnicas = transacoes.filter((transacao, index, self) => 
      index === self.findIndex(t => 
        t.data === transacao.data && 
        t.descricao === transacao.descricao && 
        t.valor === transacao.valor
      )
    );

    console.log('📊 Resultado da análise:', {
      totalEncontradas: transacoes.length,
      totalUnicas: transacoesUnicas.length,
      duplicatasRemovidas: transacoes.length - transacoesUnicas.length
    });

    return transacoesUnicas.sort((a, b) => new Date(a.data) - new Date(b.data));
  }, []);

  // ===== DETECÇÃO DE TIPO DE DOCUMENTO (mantida) =====
  const detectarTipoDocumento = (texto) => {
    const textoLower = texto.toLowerCase();
    
    const indicadoresFatura = [
      'fatura', 'cartão', 'card', 'credit',
      'limite disponível', 'limite de crédito',
      'vencimento da fatura', 'valor da fatura',
      'visa', 'mastercard', 'elo', 'amex',
      'pagamento mínimo', 'total da fatura'
    ];
    
    const scoreFatura = indicadoresFatura.reduce((score, termo) => {
      return score + (textoLower.includes(termo) ? 1 : 0);
    }, 0);
    
    return scoreFatura >= 3 ? 'fatura_cartao' : 'extrato_conta';
  };

  // ===== CONVERSOR DE DATA (mantido) =====
  const converterData = useCallback((dataStr) => {
    const partes = dataStr.split('/');
    if (partes.length === 3) {
      return `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
    }
    return dataStr;
  }, []);

  // ===== PARSERS ORIGINAIS (mantidos) =====
  const parseOFX = (content, tipo, conta, cartao, fatura) => {
    const transacoes = [];
    const transacaoRegex = /<STMTTRN>(.*?)<\/STMTTRN>/gs;
    let match;
    let counter = 1;
    
    console.log('🎯 parseOFX - Parâmetros recebidos:', { tipo, conta, cartao, fatura });
    
    while ((match = transacaoRegex.exec(content)) !== null) {
      const xml = match[1];
      const dataMatch = xml.match(/<DTPOSTED>([^<]+)/);
      const valorMatch = xml.match(/<TRNAMT>([^<]+)/);
      const memoMatch = xml.match(/<MEMO>([^<]+)/);
      
      if (dataMatch && valorMatch && memoMatch) {
        const dataOFX = dataMatch[1];
        const ano = dataOFX.substring(0, 4);
        const mes = dataOFX.substring(4, 6);
        const dia = dataOFX.substring(6, 8);
        const dataFormatada = `${ano}-${mes}-${dia}`;
        
        const valor = parseFloat(valorMatch[1]) || 0;
        const descricao = memoMatch[1].trim();
        
        // ✅ AJUSTE: Tipo baseado na importação
        let tipoTransacao;
        if (tipo === 'cartao') {
          tipoTransacao = 'despesa';
        } else {
          tipoTransacao = valor >= 0 ? 'receita' : 'despesa';
        }
        
        const novaTransacao = {
          id: counter++,
          data: dataFormatada,
          descricao,
          valor: Math.abs(valor),
          tipo: tipoTransacao,
          categoria_id: '',
          categoriaTexto: '',
          subcategoria_id: '',
          subcategoriaTexto: '',
          conta_id: tipo === 'conta' ? conta : '',
          cartao_id: tipo === 'cartao' ? cartao : '',
          fatura_vencimento: tipo === 'cartao' ? fatura : '',
          efetivado: tipo === 'conta' ? (new Date(dataFormatada) <= new Date()) : false,
          observacoes: '',
          origem: 'OFX'
        };
        
        console.log('📄 Transação criada (OFX):', {
          tipo: tipo,
          cartao_id: novaTransacao.cartao_id,
          conta_id: novaTransacao.conta_id,
          fatura_vencimento: novaTransacao.fatura_vencimento
        });
        
        transacoes.push(novaTransacao);
      }
    }
    
    return transacoes;
  };

  
  // ===== HANDLERS =====
  const handleFileUpload = (event) => {
    const uploadedFile = event.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
    }
  };

  // ✅ HANDLER MODIFICADO: Validar tipo de importação antes de analisar
  const handleAnalyze = async () => {
    if (!file) return;
    
    // ✅ VALIDAÇÃO EXPANDIDA
    if (!tipoImportacao) {
      setError('Selecione o tipo de importação (Conta ou Cartão)');
      return;
    }
    
    if (tipoImportacao === 'conta' && !contaSelecionada) {
      setError('Selecione uma conta para importar as transações');
      return;
    }
    
    if (tipoImportacao === 'cartao') {
      if (!cartaoSelecionado) {
        setError('Selecione um cartão para importar as transações');
        return;
      }
      if (!faturaVencimento) {
        setError('Selecione a fatura de vencimento para as transações');
        return;
      }
    }
    
    setLoading(true);
    setError(null);
    
  try {
    const fileName = file.name.toLowerCase();
    const fileType = file.type.toLowerCase();
    let parsedTransactions = [];
    
    if (fileName.endsWith('.pdf') || fileType.includes('pdf')) {
      console.log('📄 Processando arquivo PDF');
      parsedTransactions = await parsePDF(file);
      
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || 
               fileType.includes('spreadsheet') || fileType.includes('excel')) {
      console.log('📊 Processando arquivo Excel com ExcelExtractor');
      console.log('🎯 Estado atual para Excel:', {
        tipoImportacao,
        cartaoSelecionado,
        faturaVencimento,
        contaSelecionada
      });
      
      // ✅ USAR ExcelExtractor
      const rawData = await ExcelExtractor.extract(file);
      const validation = ExcelExtractor.validate(rawData);
      
      if (!validation.isValid) {
        throw new Error(`Excel inválido: ${validation.errors.join(', ')}`);
      }
      
      parsedTransactions = ExcelExtractor.parseTransactions(rawData, {
        tipoImportacao: tipoImportacao,
        contaId: contaSelecionada,
        cartaoId: cartaoSelecionado,
        faturaVencimento: faturaVencimento
      });
      
    } else if (fileName.includes('ofx') || fileType.includes('ofx')) {
      console.log('📄 Processando arquivo OFX');
      const text = await file.text();
      parsedTransactions = parseOFX(text, tipoImportacao, contaSelecionada, cartaoSelecionado, faturaVencimento);
      
    } else {
      console.log('📄 Processando arquivo CSV/TXT com CSVExtractor');
      console.log('🎯 Estado atual para CSV:', {
        tipoImportacao,
        cartaoSelecionado,
        faturaVencimento,
        contaSelecionada
      });
      
      // ✅ USAR CSVExtractor
      const rawData = await CSVExtractor.extract(file);
      const validation = CSVExtractor.validate(rawData);
      
      if (!validation.isValid) {
        throw new Error(`CSV inválido: ${validation.errors.join(', ')}`);
      }
      
      parsedTransactions = CSVExtractor.parseTransactions(rawData, {
        tipoImportacao: tipoImportacao,
        contaId: contaSelecionada,
        cartaoId: cartaoSelecionado,
        faturaVencimento: faturaVencimento
      });
    }
    
    if (parsedTransactions.length === 0) {
      setError('Nenhuma transação encontrada no arquivo');
       saveFailedFile(file, errorMsg);
      return;
    }
    
    setTransacoes(parsedTransactions);
    setSelectedTransactions(new Set(parsedTransactions.map(t => t.id)));
    setCurrentStep('analysis');
    
  } catch (err) {
    console.error('❌ Erro ao processar arquivo:', err);
      saveFailedFile(file, err.message);
    setError('Erro ao processar arquivo: ' + err.message);
  } finally {
    setLoading(false);
  }
};

  // ===== HANDLERS DE CATEGORIA/SUBCATEGORIA (mantidos) =====
  const handleCategoriaChange = (transactionId, value) => {
    const categoria = categorias.find(cat => cat.id === value);
    updateTransaction(transactionId, 'categoria_id', value);
    updateTransaction(transactionId, 'categoriaTexto', categoria?.nome || '');
    updateTransaction(transactionId, 'subcategoria_id', '');
    updateTransaction(transactionId, 'subcategoriaTexto', '');
    
    setCategoriaDropdownOpen(prev => ({ ...prev, [transactionId]: false }));
  };

  const handleSubcategoriaChange = (transactionId, value) => {
    const transacao = transacoes.find(t => t.id === transactionId);
    const subcategoria = getSubcategoriasPorCategoria(transacao.categoria_id)
      .find(sub => sub.id === value);
    
    updateTransaction(transactionId, 'subcategoria_id', value);
    updateTransaction(transactionId, 'subcategoriaTexto', subcategoria?.nome || '');
    
    setSubcategoriaDropdownOpen(prev => ({ ...prev, [transactionId]: false }));
  };

  const handleCategoriaTextChange = (transactionId, value) => {
    updateTransaction(transactionId, 'categoriaTexto', value);
    updateTransaction(transactionId, 'categoria_id', '');
    setCategoriaDropdownOpen(prev => ({ ...prev, [transactionId]: true }));
  };

  const handleSubcategoriaTextChange = (transactionId, value) => {
    updateTransaction(transactionId, 'subcategoriaTexto', value);
    updateTransaction(transactionId, 'subcategoria_id', '');
    setSubcategoriaDropdownOpen(prev => ({ ...prev, [transactionId]: true }));
  };

  const getCategoriasFiltradasPorTipo = (tipo) => {
    return tipo === 'receita' ? categoriasReceita : categoriasDespesa;
  };

  // ===== VALIDAÇÃO DE CAMPOS OBRIGATÓRIOS (ajustada) =====
  const validateTransactions = () => {
    const selectedTransList = transacoes.filter(t => selectedTransactions.has(t.id));
    const errors = [];
    
    selectedTransList.forEach((transaction, index) => {
      const transactionErrors = [];
      
      if (!transaction.data) {
        transactionErrors.push('Data é obrigatória');
      }
      
      if (!transaction.descricao || !transaction.descricao.trim()) {
        transactionErrors.push('Descrição é obrigatória');
      }
      
      if (!transaction.categoria_id) {
        transactionErrors.push('Categoria é obrigatória');
      }
      
      // ✅ VALIDAÇÃO ESPECÍFICA POR TIPO (CORRIGIDA)
      if (tipoImportacao === 'conta') {
        if (!transaction.conta_id) {
          transactionErrors.push('Conta é obrigatória');
        }
      } else if (tipoImportacao === 'cartao') {
        if (!transaction.cartao_id) {
          transactionErrors.push('Cartão é obrigatório');
        }
        if (!transaction.fatura_vencimento) {
          transactionErrors.push('Fatura de vencimento é obrigatória');
        }
      }
      
      if (!transaction.valor || transaction.valor <= 0) {
        transactionErrors.push('Valor deve ser maior que zero');
      }
      
      if (transactionErrors.length > 0) {
        errors.push({
          transactionIndex: index + 1,
          description: transaction.descricao || 'Sem descrição',
          errors: transactionErrors
        });
      }
    });
    
    return errors;
  };

  // ===== HANDLER DE IMPORTAÇÃO (modificado para cartões) =====
  const handleImport = async () => {
    const validationErrors = validateTransactions();
    
    if (validationErrors.length > 0) {
      let errorMessage = `Algumas transações têm campos obrigatórios em branco:\n\n`;
      
      validationErrors.slice(0, 5).forEach(error => {
        errorMessage += `• Transação ${error.transactionIndex} (${error.description}):\n`;
        error.errors.forEach(err => errorMessage += `  - ${err}\n`);
        errorMessage += '\n';
      });
      
      if (validationErrors.length > 5) {
        errorMessage += `... e mais ${validationErrors.length - 5} transações com problemas.`;
      }
      
      errorMessage += '\nPreencha todos os campos obrigatórios antes de importar.';
      
      setError(errorMessage);
      showNotification('Preencha todos os campos obrigatórios', 'error');
      return;
    }
    
    setLoading(true);
    
    try {
      const selectedTransList = transacoes.filter(t => selectedTransactions.has(t.id));
      
      console.log('🚀 Iniciando importação:', {
        tipo: tipoImportacao,
        quantidade: selectedTransList.length,
        conta: contaSelecionada,
        cartao: cartaoSelecionado,
        fatura: faturaVencimento
      });
      
      // ✅ DUAS ESTRATÉGIAS DE IMPORTAÇÃO
      if (tipoImportacao === 'conta') {
        await importarParaContas(selectedTransList);
      } else if (tipoImportacao === 'cartao') {
        await importarParaCartao(selectedTransList);
      }
      
      showNotification(
        `${selectedTransList.length} transação(ões) importada(s) com sucesso!`,
        'success'
      );
      
      setCurrentStep('success');
      
    } catch (err) {
      console.error('❌ Erro na importação:', err);
      setError('Erro na importação: ' + err.message);
      showNotification('Erro ao importar transações', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ✅ NOVA FUNÇÃO: Importar para contas (lógica atual)
  const importarParaContas = async (selectedTransList) => {
    const { default: supabase } = await import('@lib/supabaseClient');
    
    const transacoesParaInserir = selectedTransList.map(transacao => ({
      usuario_id: user.id,
      data: transacao.data,
      tipo: transacao.tipo,
      valor: transacao.valor,
      descricao: transacao.descricao.trim(),
      conta_id: transacao.conta_id,
      categoria_id: transacao.categoria_id,
      subcategoria_id: transacao.subcategoria_id || null,
      efetivado: transacao.efetivado,
      observacoes: transacao.observacoes || `Importado de ${transacao.origem || 'arquivo'} - ${file.name}`,
      recorrente: false,
      transferencia: false,
      grupo_recorrencia: null,
      grupo_parcelamento: null,
      parcela_atual: null,
      total_parcelas: null,
      numero_recorrencia: null,
      total_recorrencias: null,
      eh_recorrente: false,
      tipo_recorrencia: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    console.log('💾 Inserindo transações de conta no banco:', transacoesParaInserir);
    
    const { data, error } = await supabase
      .from('transacoes')
      .insert(transacoesParaInserir);
    
    if (error) {
      console.error('❌ Erro do Supabase (contas):', error);
      throw error;
    }
    
    console.log('✅ Transações de conta inseridas com sucesso:', data);
  };

  // ✅ NOVA FUNÇÃO: Importar para cartão (usando hook)
  const importarParaCartao = async (selectedTransList) => {
    console.log('💳 Iniciando importação para cartão usando hook');
    
    // Para cada transação, usar a lógica do DespesasCartaoModal
    for (const transacao of selectedTransList) {
      try {
        console.log('💳 Criando despesa de cartão:', {
          descricao: transacao.descricao,
          valor: transacao.valor,
          cartao: cartaoSelecionado,
          fatura: faturaVencimento
        });
        
        const resultado = await criarDespesaCartao({
          cartao_id: cartaoSelecionado,
          categoria_id: transacao.categoria_id,
          subcategoria_id: transacao.subcategoria_id || null,
          descricao: transacao.descricao.trim(),
          valor: transacao.valor,
          data_compra: transacao.data,
          fatura_vencimento: faturaVencimento,
          observacoes: transacao.observacoes || `Importado de ${transacao.origem || 'arquivo'} - ${file.name}`
        });
        
        if (!resultado.success) {
          throw new Error(resultado.error);
        }
        
        console.log('✅ Despesa de cartão criada:', resultado.data);
        
      } catch (error) {
        console.error('❌ Erro ao criar despesa de cartão:', error);
        throw new Error(`Erro na transação "${transacao.descricao}": ${error.message}`);
      }
    }
    
    console.log('✅ Todas as despesas de cartão foram criadas com sucesso');
  };

  // ===== DADOS COMPUTADOS PARA EXIBIÇÃO =====
  const filteredTransactions = useMemo(() => {
    return transacoes.filter(t => {
      const matchesSearch = t.descricao.toLowerCase().includes(filters.search.toLowerCase());
      const matchesType = !filters.type || t.tipo === filters.type;
      const matchesStatus = !filters.status || (filters.status === 'efetivado' ? t.efetivado : !t.efetivado);
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [transacoes, filters]);

  const selectedTransList = transacoes.filter(t => selectedTransactions.has(t.id));
  const totalReceitas = selectedTransList.filter(t => t.tipo === 'receita').reduce((sum, t) => sum + t.valor, 0);
  const totalDespesas = selectedTransList.filter(t => t.tipo === 'despesa').reduce((sum, t) => sum + t.valor, 0);

  // ===== HANDLERS DE NAVEGAÇÃO =====
  const handleVoltar = () => {
    navigate('/transacoes');
  };

  const handleNovaImportacao = () => {
    setCurrentStep('upload');
    setFile(null);
    setTransacoes([]);
    setSelectedTransactions(new Set());
    setFilters({ search: '', type: '', status: '' });
    setError(null);
    setCategoriaDropdownOpen({});
    setSubcategoriaDropdownOpen({});
    // ✅ RESETAR NOVOS ESTADOS
    setTipoImportacao('');
    setContaSelecionada('');
    setCartaoSelecionado('');
    setFaturaVencimento('');
    setOpcoesFaturaImportacao([]);
  };

  // ===== RENDERIZAÇÃO =====
const renderUploadStep = () => (
  <div className="space-y-4">
    {/* Header compacto */}
    <div className="text-center">
      <h2 style={{ 
        fontSize: '1.25rem', 
        fontWeight: '700', 
        color: '#111827', 
        margin: '0 0 0.25rem 0' 
      }}>
        💰 Importação de Transações
      </h2>
      <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
        Importe extratos bancários e faturas de cartão
      </p>
    </div>

    {/* Loading de dados - compacto */}
    {loadingData && (
      <div style={{ 
        textAlign: 'center', 
        padding: '1rem',
        backgroundColor: '#f8fafc',
        borderRadius: '0.5rem',
        border: '1px solid #e2e8f0'
      }}>
        <div className="loading-spinner" style={{ margin: '0 auto 0.5rem' }}></div>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Carregando dados...</p>
      </div>
    )}

    {/* Card principal com configurações */}
    {!loadingData && (
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '0.75rem',
        padding: '1rem',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        {/* Layout em linha para os comboboxes */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: tipoImportacao === 'cartao' && cartaoSelecionado ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)', 
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          {/* Tipo de Importação */}
          <div>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '0.5rem'
            }}>
              <Settings size={14} />
              Tipo
              {tipoImportacao && (
                <span 
                  style={{ 
                    fontSize: '0.75rem', 
                    color: '#6b7280',
                    cursor: 'help'
                  }}
                  title={tipoImportacao === 'conta' 
                    ? 'As transações serão registradas diretamente na conta selecionada'
                    : 'As transações serão registradas como despesas do cartão na fatura selecionada'
                  }
                >
                  💡
                </span>
              )}
            </label>
            <select
              value={tipoImportacao}
              onChange={(e) => {
                setTipoImportacao(e.target.value);
                setContaSelecionada('');
                setCartaoSelecionado('');
                setFaturaVencimento('');
                setOpcoesFaturaImportacao([]);
              }}
              style={{
                width: '100%',
                padding: '0.5rem',
                fontSize: '0.875rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                backgroundColor: '#ffffff'
              }}
            >
              <option value="">Selecione...</option>
              <option value="conta">🏦 Conta</option>
              <option value="cartao">💳 Cartão</option>
            </select>
          </div>

          {/* Seleção da Conta ou Cartão */}
          {tipoImportacao && (
            <div>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '0.5rem'
              }}>
                {tipoImportacao === 'conta' ? <Building size={14} /> : <CreditCard size={14} />}
                {tipoImportacao === 'conta' ? 'Conta' : 'Cartão'}
              </label>
              <select
                value={tipoImportacao === 'conta' ? contaSelecionada : cartaoSelecionado}
                onChange={(e) => {
                  if (tipoImportacao === 'conta') {
                    setContaSelecionada(e.target.value);
                  } else {
                    setCartaoSelecionado(e.target.value);
                    setFaturaVencimento('');
                  }
                }}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  fontSize: '0.875rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  backgroundColor: '#ffffff'
                }}
              >
                <option value="">
                  {tipoImportacao === 'conta' ? 'Selecionar conta...' : 'Selecionar cartão...'}
                </option>
                {tipoImportacao === 'conta' 
                  ? contas.map(conta => (
                      <option key={conta.id} value={conta.id}>
                        {conta.nome} ({conta.tipo}) - R$ {(conta.saldo || 0).toFixed(2).replace('.', ',')}
                      </option>
                    ))
                  : cartoes.map(cartao => (
                      <option key={cartao.id} value={cartao.id}>
                        {cartao.nome} ({cartao.bandeira}) - R$ {(cartao.limite || 0).toFixed(2).replace('.', ',')}
                      </option>
                    ))
                }
              </select>
            </div>
          )}

          {/* Seleção da Fatura - só aparece se cartão selecionado */}
          {tipoImportacao === 'cartao' && cartaoSelecionado && (
            <div>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '0.5rem'
              }}>
                <Calendar size={14} />
                Fatura
                {faturaVencimento && (
                  <span 
                    style={{ 
                      fontSize: '0.75rem', 
                      color: '#6b7280',
                      cursor: 'help'
                    }}
                    title="Todas as transações serão registradas nesta fatura como despesas únicas"
                  >
                    💡
                  </span>
                )}
              </label>
              <select
                value={faturaVencimento}
                onChange={(e) => setFaturaVencimento(e.target.value)}
                disabled={opcoesFaturaImportacao.length === 0}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  fontSize: '0.875rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  backgroundColor: opcoesFaturaImportacao.length === 0 ? '#f9fafb' : '#ffffff',
                  cursor: opcoesFaturaImportacao.length === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                <option value="">
                  {opcoesFaturaImportacao.length === 0 ? "Calculando..." : "Selecionar..."}
                </option>
                {opcoesFaturaImportacao.map(opcao => (
                  <option key={opcao.value} value={opcao.value}>
                    {opcao.label} {opcao.isDefault ? '(Recomendada)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    )}

    {/* Upload de Arquivo - mais compacto */}
    {!loadingData && tipoImportacao && (tipoImportacao === 'conta' ? contaSelecionada : (cartaoSelecionado && faturaVencimento)) && (
      <div 
        style={{ 
          border: '2px dashed #d1d5db',
          borderRadius: '0.75rem',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          minHeight: '140px',
          padding: '1rem',
          textAlign: 'center',
          backgroundColor: file ? '#f0f9ff' : '#fafafa',
          borderColor: file ? '#3b82f6' : '#d1d5db'
        }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        onMouseEnter={(e) => {
          if (!file) e.target.style.borderColor = '#9ca3af';
        }}
        onMouseLeave={(e) => {
          if (!file) e.target.style.borderColor = '#d1d5db';
        }}
      >
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: '100%',
          gap: '0.5rem'
        }}>
          <Upload size={32} style={{ color: file ? '#3b82f6' : '#9ca3af' }} />
          
          {file ? (
            <>
              <h3 style={{ 
                fontSize: '0.875rem', 
                fontWeight: '600', 
                color: '#1e40af',
                margin: 0
              }}>
                📁 {file.name}
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {(file.size / 1024).toFixed(1)} KB
              </span>
            </>
          ) : (
            <>
              <h3 style={{ 
                fontSize: '0.875rem', 
                fontWeight: '600', 
                color: '#374151',
                margin: '0 0 0.25rem 0'
              }}>
                Arraste seu extrato aqui ou clique para selecionar
              </h3>
              <p style={{ 
                fontSize: '0.75rem', 
                color: '#6b7280', 
                margin: 0 
              }}>
                Formatos: .pdf, .csv, .txt, .ofx
              </p>
            </>
          )}
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
            accept=".csv,.txt,.ofx,.pdf,.xlsx,.xls"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
      </div>
    )}

    {/* Botão de Análise - compacto e centralizado */}
    {!loadingData && file && tipoImportacao && (tipoImportacao === 'conta' ? contaSelecionada : (cartaoSelecionado && faturaVencimento)) && (
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={handleAnalyze}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1.25rem',
            fontSize: '0.875rem',
            fontWeight: '600',
            backgroundColor: loading ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}
          onMouseEnter={(e) => {
            if (!loading) e.target.style.backgroundColor = '#2563eb';
          }}
          onMouseLeave={(e) => {
            if (!loading) e.target.style.backgroundColor = '#3b82f6';
          }}
        >
          {loading ? (
            <>
              <div className="btn-spinner" style={{ width: '16px', height: '16px' }}></div>
              Analisando...
            </>
          ) : (
            <>
              <FileText size={16} />
              Analisar Arquivo
            </>
          )}
        </button>
      </div>
    )}
  </div>
);

const renderAnalysisStep = () => (
  <div className="space-y-6">
    <div className="transactions-table-card">
      {/* Header super compacto */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.75rem 1rem',
        backgroundColor: '#ecfdf5',
        borderRadius: '0.5rem',
        border: '1px solid #bbf7d0',
        marginBottom: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={14} style={{ color: '#10b981' }} />
          <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#166534' }}>
            ✅ Análise Concluída
          </span>
          <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '0.5rem' }}>
            {selectedTransList.length} selecionadas | 
            {tipoImportacao === 'conta' ? (
              ` 🏦 ${contas.find(c => c.id === contaSelecionada)?.nome || 'Conta'}`
            ) : (
              ` 💳 ${cartoes.find(c => c.id === cartaoSelecionado)?.nome || 'Cartão'}`
            )}
          </span>
        </div>
        
        {/* Progresso compacto inline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {validateTransactions().length > 0 ? (
            <>
              <AlertCircle size={12} style={{ color: '#f59e0b' }} />
              <span style={{ fontSize: '0.75rem', color: '#92400e' }}>
                {selectedTransList.length - validateTransactions().length}/{selectedTransList.length} prontas
              </span>
              <div style={{
                width: '40px',
                height: '6px',
                backgroundColor: '#fde68a',
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${((selectedTransList.length - validateTransactions().length) / selectedTransList.length) * 100}%`,
                  height: '100%',
                  backgroundColor: '#f59e0b',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </>
          ) : (
            <>
              <CheckCircle size={12} style={{ color: '#10b981' }} />
              <span style={{ fontSize: '0.75rem', color: '#166534' }}>
                {selectedTransList.length}/{selectedTransList.length} ✅
              </span>
            </>
          )}
          
          {/* Botão para expandir detalhes */}
          <button
            onClick={() => setShowProgressDetail(!showProgressDetail)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.75rem',
              color: '#6b7280',
              padding: '0.25rem'
            }}
            title="Ver detalhes do progresso"
          >
            {showProgressDetail ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Detalhes expandíveis do progresso */}
      {showProgressDetail && validateTransactions().length > 0 && (
        <div style={{
          padding: '0.75rem',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '0.5rem',
          marginBottom: '1rem',
          animation: 'fadeIn 0.3s ease'
        }}>
          <p style={{ margin: '0 0 0.5rem 0', color: '#dc2626', fontSize: '0.875rem' }}>
            {validateTransactions().length === 1 
              ? '1 transação com campos obrigatórios em branco.'
              : `${validateTransactions().length} transações com campos obrigatórios em branco.`
            }
          </p>
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>
            Campos obrigatórios: Data, Descrição, Categoria e Valor maior que zero.
          </p>
        </div>
      )}

      {/* Stats super compactos em linha */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '0.5rem', 
        margin: '0 0 1rem 0',
        padding: '0.5rem',
        backgroundColor: '#f8fafc',
        borderRadius: '0.5rem'
      }}>
        <div style={{ textAlign: 'center', padding: '0.5rem' }}>
          <div style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>📊</div>
          <div style={{ fontSize: '0.6875rem', color: '#6b7280' }}>Total</div>
          <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>
            {transacoes.length}
          </div>
        </div>
        
        {tipoImportacao === 'conta' && (
          <div style={{ textAlign: 'center', padding: '0.5rem' }}>
            <div style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>💰</div>
            <div style={{ fontSize: '0.6875rem', color: '#6b7280' }}>Receitas</div>
            <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#10b981' }}>
              R$ {totalReceitas.toFixed(2).replace('.', ',')}
            </div>
          </div>
        )}
        
        <div style={{ textAlign: 'center', padding: '0.5rem' }}>
          <div style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>💸</div>
          <div style={{ fontSize: '0.6875rem', color: '#6b7280' }}>
            {tipoImportacao === 'cartao' ? 'Cartão' : 'Despesas'}
          </div>
          <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#ef4444' }}>
            R$ {totalDespesas.toFixed(2).replace('.', ',')}
          </div>
        </div>
        
        <div style={{ textAlign: 'center', padding: '0.5rem' }}>
          <div style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>✅</div>
          <div style={{ fontSize: '0.6875rem', color: '#6b7280' }}>Selecionadas</div>
          <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#3b82f6' }}>
            {selectedTransList.length}
          </div>
        </div>
      </div>

      {/* Barra de filtros fixa/sticky */}
      <div style={{
        position: 'sticky',
        top: '0',
        zIndex: 10,
        backgroundColor: '#ffffff',
        padding: '0.75rem 0',
        borderBottom: '1px solid #e5e7eb',
        marginBottom: '0.5rem',
        display: 'flex',
        gap: '0.75rem',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <div style={{ flex: '1', minWidth: '200px' }}>
          <input
            type="text"
            placeholder="🔍 Buscar transações..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="nav-btn"
            style={{ 
              width: '100%', 
              height: '36px', 
              fontSize: '0.875rem',
              padding: '0.5rem',
              textAlign: 'left'
            }}
          />
        </div>
        
        {tipoImportacao === 'conta' && (
          <div style={{ minWidth: '130px' }}>
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="nav-btn"
              style={{ 
                width: '100%', 
                height: '36px', 
                fontSize: '0.875rem',
                padding: '0.5rem'
              }}
            >
              <option value="">Todos tipos</option>
              <option value="receita">💰 Receitas</option>
              <option value="despesa">💸 Despesas</option>
            </select>
          </div>
        )}
        
        {tipoImportacao === 'conta' && (
          <div style={{ minWidth: '130px' }}>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="nav-btn"
              style={{ 
                width: '100%', 
                height: '36px', 
                fontSize: '0.875rem',
                padding: '0.5rem'
              }}
            >
              <option value="">Todos status</option>
              <option value="efetivado">✅ Efetivado</option>
              <option value="pendente">⏳ Pendente</option>
            </select>
          </div>
        )}

        {/* Info tooltip compacto */}
        <button
          onClick={() => setShowImportInfo(!showImportInfo)}
          style={{
            background: 'none',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            color: '#6b7280',
            padding: '0.5rem',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}
          title="Informações sobre importação"
        >
          ℹ️
        </button>
      </div>

      {/* Modal de informações (quando necessário) */}
      {showImportInfo && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#dbeafe',
          border: '1px solid #3b82f6',
          borderRadius: '0.5rem',
          padding: '1rem',
          maxWidth: '400px',
          zIndex: 50,
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h4 style={{ 
                fontSize: '0.875rem', 
                fontWeight: '600', 
                color: '#1e40af',
                margin: '0 0 0.5rem 0'
              }}>
                ℹ️ Tipo de importação
              </h4>
              <p style={{ 
                fontSize: '0.875rem', 
                color: '#1e40af', 
                margin: 0,
                lineHeight: '1.4'
              }}>
                {tipoImportacao === 'conta' ? (
                  'Transações extras (únicas) na conta. Sem recorrência automática.'
                ) : (
                  'Despesas únicas do cartão na fatura. Sem parcelamento automático.'
                )}
              </p>
            </div>
            <button
              onClick={() => setShowImportInfo(false)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.25rem',
                color: '#1e40af',
                lineHeight: '1',
                marginLeft: '1rem'
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Overlay para modal */}
      {showImportInfo && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.1)',
            zIndex: 49
          }}
          onClick={() => setShowImportInfo(false)}
        />
      )}

      {/* TABELA - Agora com 70%+ da altura disponível */}
      <div style={{ 
        height: 'calc(100vh - 400px)', // Altura fixa para garantir espaço
        minHeight: '500px',
        overflowY: 'auto',
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        paddingBottom: '200px' // ✅ FOLGA PARA DROPDOWN
      }}>
  

  <table className="transactions-table">
    <thead>
      <tr>
        <th style={{ width: '50px', textAlign: 'center' }}>
          <input
            type="checkbox"
            checked={selectedTransactions.size === filteredTransactions.length && filteredTransactions.length > 0}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedTransactions(new Set(filteredTransactions.map(t => t.id)));
              } else {
                setSelectedTransactions(new Set());
              }
            }}
            style={{ width: '16px', height: '16px' }}
          />
        </th>
        <th style={{ width: '140px', color: '#ef4444', fontWeight: '700', textAlign: 'left' }}>Data *</th>
        <th style={{ color: '#ef4444', fontWeight: '700', minWidth: '320px', textAlign: 'left' }}>Descrição *</th>
        <th style={{ width: '110px', color: '#ef4444', fontWeight: '700', textAlign: 'right', paddingRight: '1rem' }}>Valor *</th>
        {tipoImportacao === 'conta' && <th style={{ width: '80px', textAlign: 'center' }}>Tipo</th>}
        <th style={{ width: '280px', color: '#ef4444', fontWeight: '700', textAlign: 'left' }}>Categoria *</th>
        {tipoImportacao === 'conta' && <th style={{ width: '90px', textAlign: 'center' }}>Status</th>}
        <th style={{ width: '60px', textAlign: 'center' }}>Obs</th>
      </tr>
    </thead>
    <tbody>
      {filteredTransactions.map((transaction) => {
        const categoriasDisponiveis = tipoImportacao === 'cartao' ? categoriasDespesa : getCategoriasFiltradasPorTipo(transaction.tipo);
        const subcategoriasDisponiveis = getSubcategoriasFiltradas(transaction.categoria_id, transaction.subcategoriaTexto);
        const categoriaSelecionada = categorias.find(c => c.id === transaction.categoria_id);
        const hasErrors = (!transaction.categoria_id || !transaction.descricao?.trim() || !transaction.valor || transaction.valor <= 0);
        
        return (
          <tr 
            key={transaction.id} 
            className={`transaction-row ${hasErrors ? 'transaction-row--error' : ''}`}
            style={{
              backgroundColor: hasErrors ? '#fef2f2' : 'transparent' // Fundo rosado sutil para linhas com erro
            }}
          >
            <td style={{ textAlign: 'center', padding: '4px' }}>
              <input
                type="checkbox"
                checked={selectedTransactions.has(transaction.id)}
                onChange={() => toggleTransactionSelection(transaction.id)}
                style={{ width: '16px', height: '16px' }}
              />
            </td>
            
            {/* Data */}
            <td style={{ padding: '4px' }}>
              <input
                type="date"
                value={transaction.data}
                onChange={(e) => updateTransaction(transaction.id, 'data', e.target.value)}
                className="nav-btn"
                style={{ 
                  fontSize: '0.875rem', 
                  padding: '0.5rem',
                  width: '100%',
                  height: '38px',
                  textAlign: 'left',
                  border: !transaction.data ? '2px solid #ef4444' : '1px solid #e5e7eb'
                }}
                required
              />
            </td>
            
            {/* Descrição */}
            <td style={{ padding: '4px' }}>
              <input
                type="text"
                value={transaction.descricao}
                onChange={(e) => updateTransaction(transaction.id, 'descricao', e.target.value)}
                className="nav-btn"
                style={{ 
                  fontSize: '0.875rem', 
                  padding: '0.5rem',
                  width: '100%',
                  height: '38px',
                  textAlign: 'left',
                  border: !transaction.descricao?.trim() ? '2px solid #ef4444' : '1px solid #e5e7eb'
                }}
                placeholder="Digite a descrição"
                required
              />
            </td>
            
            {/* Valor - Alinhamento forçado à direita */}
            <td style={{ padding: '4px', textAlign: 'right' }}>
              <input
                type="text"
                inputMode="decimal"
                value={formatarValorBR(transaction.valor)}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d.,]/g, '');
                  updateTransaction(transaction.id, 'valor', parseFloat(value.replace(',', '.')) || 0);
                }}
                className="nav-btn"
                style={{ 
                  fontSize: '0.875rem', 
                  padding: '0.5rem',
                  paddingRight: '1rem', // Extra padding à direita para alinhamento
                  width: '100%',
                  height: '38px',
                  textAlign: 'right',
                  fontVariantNumeric: 'tabular-nums',
                  fontWeight: '600',
                  color: transaction.tipo === 'receita' ? '#10b981' : '#ef4444',
                  border: (!transaction.valor || transaction.valor <= 0) ? '2px solid #ef4444' : '1px solid #e5e7eb'
                }}
                placeholder="0,00"
                required
              />
            </td>
            
            {/* Tipo */}
            {tipoImportacao === 'conta' && (
              <td style={{ padding: '4px', textAlign: 'center' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '38px',
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  backgroundColor: transaction.tipo === 'receita' ? '#dcfce7' : '#fee2e2',
                  color: transaction.tipo === 'receita' ? '#166534' : '#dc2626',
                  border: '1px solid ' + (transaction.tipo === 'receita' ? '#bbf7d0' : '#fecaca'),
                  transition: 'all 0.15s ease'
                }}
                onClick={() => {
                  const novoTipo = transaction.tipo === 'receita' ? 'despesa' : 'receita';
                  updateTransaction(transaction.id, 'tipo', novoTipo);
                  updateTransaction(transaction.id, 'categoria_id', '');
                  updateTransaction(transaction.id, 'categoriaTexto', '');
                  updateTransaction(transaction.id, 'subcategoria_id', '');
                  updateTransaction(transaction.id, 'subcategoriaTexto', '');
                }}
                >
                  {transaction.tipo === 'receita' ? (
                    <>
                      <TrendingUp size={12} style={{ marginRight: '2px' }} />
                      REC
                    </>
                  ) : (
                    <>
                      <TrendingDown size={12} style={{ marginRight: '2px' }} />
                      DESP
                    </>
                  )}
                </div>
              </td>
            )}
            
            {/* Categoria + Subcategoria - Sem texto repetitivo */}
            <td style={{ padding: '4px', position: 'relative' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {/* Campo Principal de Categoria */}
                <div className="dropdown-container">
                  <input
                    type="text"
                    value={transaction.categoriaTexto}
                    onChange={(e) => handleCategoriaTextChange(transaction.id, e.target.value)}
                    onFocus={() => setCategoriaDropdownOpen(prev => ({ ...prev, [transaction.id]: true }))}
                    onBlur={() => setTimeout(() => setCategoriaDropdownOpen(prev => ({ ...prev, [transaction.id]: false })), 200)}
                    placeholder="Selecione categoria"
                    className="nav-btn"
                    style={{
                      fontSize: '0.875rem',
                      padding: '0.5rem',
                      paddingLeft: categoriaSelecionada ? '2.5rem' : (!transaction.categoria_id ? '2.5rem' : '0.5rem'),
                      paddingRight: '2rem',
                      width: '100%',
                      height: '38px',
                      textAlign: 'left',
                      color: '#111827', // Texto sempre escuro para melhor contraste
                      border: !transaction.categoria_id ? '2px solid #ef4444' : '1px solid #e5e7eb'
                    }}
                    required
                  />
                  
                  {/* Ícone de aviso quando categoria não selecionada */}
                  {!transaction.categoria_id && (
                    <div
                      style={{
                        position: 'absolute',
                        left: '1rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: '14px',
                        color: '#ef4444'
                      }}
                      title="Categoria obrigatória"
                    >
                      ⚠️
                    </div>
                  )}
                  
                  {/* Indicador de cor quando categoria selecionada */}
                  {categoriaSelecionada && (
                    <div
                      className="category-color-tag"
                      style={{
                        position: 'absolute',
                        left: '1rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: categoriaSelecionada.cor || '#6b7280'
                      }}
                    />
                  )}
                  
                  <Tag 
                    size={14} 
                    style={{
                      position: 'absolute',
                      right: '0.5rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: !transaction.categoria_id ? '#ef4444' : '#9ca3af'
                    }}
                  />
                  
                  {categoriaDropdownOpen[transaction.id] && categoriasDisponiveis.length > 0 && (
                    <div className="dropdown-options">
                      {categoriasDisponiveis
                        .filter(cat => !transaction.categoriaTexto || cat.nome.toLowerCase().includes(transaction.categoriaTexto.toLowerCase()))
                        .map(categoria => (
                          <div
                            key={categoria.id}
                            onMouseDown={() => handleCategoriaChange(transaction.id, categoria.id)}
                            className="dropdown-option"
                          >
                            <div
                              className="category-color-tag"
                              style={{ backgroundColor: categoria.cor || '#6b7280' }}
                            />
                            {categoria.nome}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
                
                {/* Campo de Subcategoria - Só aparece se categoria selecionada */}
                {transaction.categoria_id && (
                  <div className="dropdown-container">
                    <input
                      type="text"
                      value={transaction.subcategoriaTexto}
                      onChange={(e) => handleSubcategoriaTextChange(transaction.id, e.target.value)}
                      onFocus={() => setSubcategoriaDropdownOpen(prev => ({ ...prev, [transaction.id]: true }))}
                      onBlur={() => setTimeout(() => setSubcategoriaDropdownOpen(prev => ({ ...prev, [transaction.id]: false })), 200)}
                      placeholder="Subcategoria..."
                      className="nav-btn"
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.375rem',
                        paddingLeft: '1.5rem',
                        paddingRight: '1.5rem',
                        width: '100%',
                        height: '28px',
                        textAlign: 'left',
                        backgroundColor: '#f8fafc',
                        borderColor: '#d1d5db',
                        color: '#374151'
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        left: '0.5rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: categoriaSelecionada?.cor || '#6b7280'
                      }}
                    />
                    
                    {subcategoriaDropdownOpen[transaction.id] && subcategoriasDisponiveis.length > 0 && (
                      <div className="dropdown-options">
                        {subcategoriasDisponiveis.map(subcategoria => (
                          <div
                            key={subcategoria.id}
                            onMouseDown={() => handleSubcategoriaChange(transaction.id, subcategoria.id)}
                            className="dropdown-option"
                          >
                            <div
                              className="category-color-tag"
                              style={{ backgroundColor: categoriaSelecionada?.cor || '#6b7280' }}
                            />
                            {subcategoria.nome}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </td>
            
            {/* Status */}
            {tipoImportacao === 'conta' && (
              <td style={{ padding: '4px', textAlign: 'center' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '38px',
                    borderRadius: '0.375rem',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    backgroundColor: transaction.efetivado ? '#dcfce7' : '#fef3c7',
                    color: transaction.efetivado ? '#166534' : '#92400e',
                    border: '1px solid ' + (transaction.efetivado ? '#bbf7d0' : '#fde68a'),
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => updateTransaction(transaction.id, 'efetivado', !transaction.efetivado)}
                  title={transaction.efetivado ? 'Efetivado - Clique para marcar como pendente' : 'Pendente - Clique para efetivar'}
                >
                  {transaction.efetivado ? (
                    <>
                      <CheckCircle size={12} style={{ marginRight: '2px' }} />
                      EFET
                    </>
                  ) : (
                    <>
                      <AlertCircle size={12} style={{ marginRight: '2px' }} />
                      PEND
                    </>
                  )}
                </div>
              </td>
            )}
            
            {/* Observações */}
            <td style={{ padding: '4px', textAlign: 'center' }}>
              <button
                className="nav-btn"
                style={{
                  width: '38px',
                  height: '38px',
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: transaction.observacoes ? '#dbeafe' : '#f8fafc',
                  color: transaction.observacoes ? '#1d4ed8' : '#6b7280',
                  border: transaction.observacoes ? '1px solid #93c5fd' : '1px solid #d1d5db'
                }}
                onClick={() => {
                  const novaObs = prompt('Observações:', transaction.observacoes || '');
                  if (novaObs !== null) {
                    updateTransaction(transaction.id, 'observacoes', novaObs);
                  }
                }}
                title={transaction.observacoes ? `Observação: ${transaction.observacoes}` : 'Adicionar observação'}
              >
                {transaction.observacoes ? '📝' : '✏️'}
              </button>
            </td>
          </tr>
        );
      })}
    </tbody>
  </table>
</div>
      </div>
    </div>
  );

const renderConfirmationStep = () => {
  // Modo compacto automático baseado na quantidade
  const isAutoCompact = selectedTransList.length <= 3;
  
  return (
    <div className="space-y-6">
      {/* Header compacto com alinhamento perfeito */}
      <div className="text-center">
        <CheckCircle size={48} style={{ color: '#10b981', margin: '0 auto 0.75rem' }} />
        <h2 style={{ 
          fontSize: '1.25rem', 
          fontWeight: '700', 
          color: '#111827', 
          margin: '0 0 0.25rem 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          lineHeight: '1.2' // Melhor alinhamento vertical
        }}>
          🎯 Confirmação de Importação
          <button
            onClick={() => setShowImportInfo(!showImportInfo)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem',
              opacity: 0.7,
              display: 'flex',
              alignItems: 'center', // Alinhamento perfeito
              justifyContent: 'center',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              lineHeight: '1'
            }}
            title="Informações sobre importação"
          >
            ❓
          </button>
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
          Revise o resumo antes de finalizar
        </p>
      </div>

      <div className="transactions-table-card">
        {/* Stats principais com gap menor */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: isAutoCompact ? '0.75rem' : '0.5rem', // Gap dinâmico
          margin: '1rem 0'
        }}>
          <div className="stat-card saldo" style={{ 
            padding: isAutoCompact ? '1rem' : '0.75rem', 
            textAlign: 'center',
            transition: 'all 0.2s ease'
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>📋</div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Transações</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111827' }}>
              {selectedTransList.length}
            </div>
          </div>
          
          {/* Card de saldo com coloração condicional melhorada */}
          <div className="stat-card saldo" style={{ 
            padding: isAutoCompact ? '1rem' : '0.75rem', 
            textAlign: 'center',
            transition: 'all 0.2s ease'
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>📊</div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Saldo Líquido</div>
            <div style={{ 
              fontSize: '1.25rem', 
              fontWeight: '700',
              color: (totalReceitas - totalDespesas) === 0 ? '#6b7280' : 
                     (totalReceitas - totalDespesas) > 0 ? '#10b981' : '#ef4444',
              transition: 'color 0.2s ease'
            }}>
              R$ {(totalReceitas - totalDespesas).toFixed(2).replace('.', ',')}
            </div>
          </div>

          <div className="stat-card" style={{ 
            padding: isAutoCompact ? '1rem' : '0.75rem', 
            textAlign: 'center',
            transition: 'all 0.2s ease'
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
              {tipoImportacao === 'conta' ? '🏦' : '💳'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Destino</div>
            <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>
              {tipoImportacao === 'conta' ? (
                (() => {
                  const conta = contas.find(c => c.id === contaSelecionada);
                  return conta ? conta.nome : 'N/A';
                })()
              ) : (
                (() => {
                  const cartao = cartoes.find(c => c.id === cartaoSelecionado);
                  return cartao ? cartao.nome : 'N/A';
                })()
              )}
            </div>
          </div>

          <div className="stat-card" style={{ 
            padding: isAutoCompact ? '1rem' : '0.75rem', 
            textAlign: 'center',
            transition: 'all 0.2s ease'
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>⚡</div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Tipo</div>
            <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#3b82f6' }}>
              {tipoImportacao === 'conta' ? 'Extras' : 'Únicas'}
            </div>
          </div>
        </div>

        {/* Resumo compacto colapsável com microanimação */}
        <div className="summary-panel">
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: (showDetailedSummary && !isAutoCompact) ? '1rem' : '0'
          }}>
            <h3 className="summary-title">📊 Resumo das transações</h3>
            
            {/* Só mostrar botão se não for auto-compacto */}
            {!isAutoCompact && (
              <button
                onClick={() => setShowDetailedSummary(!showDetailedSummary)}
                className="nav-btn"
                style={{
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.5rem',
                  height: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                {showDetailedSummary ? 'Ocultar' : 'Ver detalhes'}
                {/* Chevron com microanimação */}
                <span style={{ 
                  transform: showDetailedSummary ? 'rotate(180deg)' : 'rotate(0deg)', 
                  transition: 'transform 0.2s ease',
                  display: 'inline-block'
                }}>
                  ▾
                </span>
              </button>
            )}
          </div>

          {/* Resumo inline compacto */}
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '1rem', 
            alignItems: 'center',
            fontSize: '0.875rem',
            color: '#374151'
          }}>
            {tipoImportacao === 'conta' && totalReceitas > 0 && (
              <span>
                💰 <strong>{selectedTransList.filter(t => t.tipo === 'receita').length}</strong> receitas 
                (R$ {totalReceitas.toFixed(2).replace('.', ',')}) — Média: R$ {(totalReceitas / selectedTransList.filter(t => t.tipo === 'receita').length).toFixed(2).replace('.', ',')}
              </span>
            )}
            
            {totalDespesas > 0 && (
              <span>
                💸 <strong>{selectedTransList.filter(t => t.tipo === 'despesa').length}</strong> despesas 
                (R$ {totalDespesas.toFixed(2).replace('.', ',')}) — Média: R$ {(totalDespesas / selectedTransList.filter(t => t.tipo === 'despesa').length).toFixed(2).replace('.', ',')}
              </span>
            )}
          </div>

          {/* Categorias principais inline */}
          {(() => {
            const categoriasSummary = selectedTransList.reduce((acc, t) => {
              const cat = categorias.find(c => c.id === t.categoria_id);
              const nome = cat?.nome || 'Sem categoria';
              if (!acc[nome]) acc[nome] = { count: 0, total: 0 };
              acc[nome].count++;
              acc[nome].total += t.valor;
              return acc;
            }, {});
            
            const topCategorias = Object.entries(categoriasSummary)
              .sort(([,a], [,b]) => b.total - a.total)
              .slice(0, isAutoCompact ? 5 : 2); // Mais categorias no modo compacto
              
            return topCategorias.length > 0 && (
              <div style={{ 
                marginTop: '0.75rem',
                fontSize: '0.75rem',
                color: '#6b7280'
              }}>
                📈 {isAutoCompact ? 'Categorias' : 'Principais'}: {topCategorias.map(([nome, data]) => `${nome} (${data.count}x)`).join(', ')}
              </div>
            );
          })()}

          {/* Detalhes expandidos - sempre visível no modo auto-compacto */}
          {(showDetailedSummary || isAutoCompact) && !isAutoCompact && (
            <div style={{ 
              marginTop: '1rem',
              padding: '1rem',
              backgroundColor: '#f8fafc',
              borderRadius: '0.5rem',
              border: '1px solid #e2e8f0',
              animation: 'fadeIn 0.3s ease'
            }}>
              {/* Informações detalhadas do destino */}
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: '600', margin: '0 0 0.5rem 0' }}>
                  {tipoImportacao === 'conta' ? '🏦 Detalhes da conta' : '💳 Detalhes do cartão'}
                </h4>
                {tipoImportacao === 'conta' ? (
                  (() => {
                    const conta = contas.find(c => c.id === contaSelecionada);
                    return conta && (
                      <p style={{ fontSize: '0.875rem', margin: 0, color: '#374151' }}>
                        {conta.nome} ({conta.tipo}) - Saldo atual: R$ {(conta.saldo || 0).toFixed(2).replace('.', ',')}
                      </p>
                    );
                  })()
                ) : (
                  (() => {
                    const cartao = cartoes.find(c => c.id === cartaoSelecionado);
                    return cartao && (
                      <div style={{ fontSize: '0.875rem', color: '#374151' }}>
                        <p style={{ margin: '0 0 0.25rem 0' }}>
                          {cartao.nome} ({cartao.bandeira}) - Limite: R$ {(cartao.limite || 0).toFixed(2).replace('.', ',')}
                        </p>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                          📅 Fatura: {faturaVencimento ? new Date(faturaVencimento + 'T12:00:00').toLocaleDateString('pt-BR') : 'N/A'}
                        </p>
                      </div>
                    );
                  })()
                )}
              </div>

              {/* Grid de categorias detalhado */}
              {(() => {
                const categoriasSummary = selectedTransList.reduce((acc, t) => {
                  const cat = categorias.find(c => c.id === t.categoria_id);
                  const nome = cat?.nome || 'Sem categoria';
                  if (!acc[nome]) acc[nome] = { count: 0, total: 0 };
                  acc[nome].count++;
                  acc[nome].total += t.valor;
                  return acc;
                }, {});
                
                const todasCategorias = Object.entries(categoriasSummary)
                  .sort(([,a], [,b]) => b.total - a.total);
                  
                return todasCategorias.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: '600', margin: '0 0 0.5rem 0' }}>
                      📈 Todas as categorias:
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {todasCategorias.map(([nome, data]) => (
                        <span key={nome} style={{
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#ffffff',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          color: '#374151'
                        }}>
                          {nome}: {data.count}x (R$ {data.total.toFixed(2).replace('.', ',')})
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Modal/tooltip de informações sobre importação */}
        {showImportInfo && (
          <div className="summary-panel" style={{ 
            backgroundColor: '#dbeafe',
            borderColor: '#3b82f6',
            animation: 'fadeIn 0.3s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ 
                  fontWeight: '600', 
                  marginBottom: '0.5rem', 
                  color: '#1e40af',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem'
                }}>
                  <AlertCircle size={14} />
                  ℹ️ Como será a importação
                </h4>
                
                <p style={{ 
                  margin: 0, 
                  lineHeight: '1.4', 
                  fontSize: '0.875rem',
                  color: '#1e40af'
                }}>
                  {tipoImportacao === 'conta' ? (
                    <>
                      Transações <strong>extras</strong> (únicas) na conta. 
                      Sem recorrência automática. Você pode configurar depois individualmente.
                    </>
                  ) : (
                    <>
                      <strong>Despesas únicas</strong> do cartão na fatura. 
                      Sem parcelamento automático. Você pode criar parcelamentos depois.
                    </>
                  )}
                </p>
              </div>
              
              <button
                onClick={() => setShowImportInfo(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.25rem',
                  color: '#1e40af',
                  padding: '0 0 0 0.5rem',
                  lineHeight: '1'
                }}
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
 const renderSuccessStep = () => (
  <div className="space-y-4">
    {/* Header compacto */}
    <div className="text-center" style={{ padding: '0.5rem 0' }}>
      <div style={{
        width: '48px',
        height: '48px',
        backgroundColor: '#dcfce7',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 0.75rem',
        animation: 'bounce 1s infinite'
      }}>
        <CheckCircle size={24} style={{ color: '#10b981' }} />
      </div>
      <h2 style={{ 
        fontSize: '1.25rem', 
        fontWeight: '700', 
        color: '#111827', 
        margin: '0 0 0.5rem 0' 
      }}>
        🎉 Importação Concluída!
      </h2>
      <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
        {selectedTransactions.size} transações foram importadas com sucesso
      </p>
    </div>

    {/* Layout em 2 colunas usando grid */}
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
      gap: '1rem' 
    }}>
      {/* Card esquerdo - Resumo financeiro */}
      <div style={{
        backgroundColor: '#f8fafc',
        borderRadius: '0.75rem',
        padding: '0.75rem',
        border: '1px solid #e2e8f0'
      }}>
        <h4 style={{ 
          fontSize: '0.875rem', 
          fontWeight: '600', 
          color: '#111827', 
          margin: '0 0 0.75rem 0',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          📊 Resumo Financeiro
        </h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#6b7280' }}>Transações</span>
            <span style={{ fontWeight: '600', color: '#111827' }}>{selectedTransactions.size}</span>
          </div>
          
          {tipoImportacao === 'conta' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#10b981' }}>Receitas</span>
              <span style={{ fontWeight: '600', color: '#10b981' }}>R$ {totalReceitas.toFixed(2).replace('.', ',')}</span>
            </div>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#ef4444' }}>
              {tipoImportacao === 'cartao' ? 'Despesas do Cartão' : 'Despesas'}
            </span>
            <span style={{ fontWeight: '600', color: '#ef4444' }}>R$ {totalDespesas.toFixed(2).replace('.', ',')}</span>
          </div>
          
          {tipoImportacao === 'conta' && (
            <>
              <div style={{ 
                borderTop: '1px solid #e2e8f0', 
                paddingTop: '0.5rem', 
                marginTop: '0.5rem' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '600', color: '#111827' }}>Saldo líquido</span>
                  <span style={{ 
                    fontWeight: '700', 
                    color: (totalReceitas - totalDespesas) >= 0 ? '#10b981' : '#ef4444' 
                  }}>
                    R$ {(totalReceitas - totalDespesas).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Card direito - Destino */}
      <div style={{
        backgroundColor: '#f8fafc',
        borderRadius: '0.75rem',
        padding: '0.75rem',
        border: '1px solid #e2e8f0'
      }}>
        <h4 style={{ 
          fontSize: '0.875rem', 
          fontWeight: '600', 
          color: '#111827', 
          margin: '0 0 0.75rem 0',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {tipoImportacao === 'conta' ? '🏦 Destino' : '💳 Destino'}
        </h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
          <div>
            <span style={{ 
              display: 'block', 
              fontSize: '0.75rem', 
              color: '#6b7280',
              marginBottom: '0.25rem'
            }}>
              {tipoImportacao === 'conta' ? 'Conta' : 'Cartão'}
            </span>
            <span style={{ fontWeight: '600', color: '#111827' }}>
              {tipoImportacao === 'conta' ? (
                (() => {
                  const conta = contas.find(c => c.id === contaSelecionada);
                  return conta ? conta.nome : 'N/A';
                })()
              ) : (
                (() => {
                  const cartao = cartoes.find(c => c.id === cartaoSelecionado);
                  return cartao ? cartao.nome : 'N/A';
                })()
              )}
            </span>
          </div>

          {tipoImportacao === 'cartao' && (
            <div>
              <span style={{ 
                display: 'block', 
                fontSize: '0.75rem', 
                color: '#6b7280',
                marginBottom: '0.25rem'
              }}>
                Fatura de vencimento
              </span>
              <span style={{ fontWeight: '600', color: '#111827' }}>
                {faturaVencimento ? new Date(faturaVencimento + 'T12:00:00').toLocaleDateString('pt-BR') : 'N/A'}
              </span>
            </div>
          )}

          <div>
            <span style={{ 
              display: 'block', 
              fontSize: '0.75rem', 
              color: '#6b7280',
              marginBottom: '0.25rem'
            }}>
              Tipo de transações
            </span>
            <span style={{ fontWeight: '600', color: '#3b82f6' }}>
              {tipoImportacao === 'conta' ? 'Transações extras' : 'Despesas únicas'}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

  return (
    <PageContainer title="">

      
        {/* Progress Steps */}
        <div className="transactions-table-card" style={{ 
          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
          color: 'white',
          marginBottom: '1.5rem'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem', 
            padding: '1rem',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            {[
              { step: 'upload', label: 'Upload', icon: '📁' },
              { step: 'analysis', label: 'Análise', icon: '🔍' },
              { step: 'confirmation', label: 'Confirmação', icon: '✅' },
              { step: 'success', label: 'Sucesso', icon: '🎉' },
            ].map((item, index) => {
              const isActive = currentStep === item.step;
              const isCompleted = ['upload', 'analysis', 'confirmation', 'success'].indexOf(currentStep) > index;
              
              return (
                <div key={item.step} style={{
                  display: 'flex',
                  alignItems: 'center',
                  color: isActive ? 'white' : isCompleted ? 'white' : 'rgba(255,255,255,0.6)',
                  transition: 'all 0.3s ease'
                }}>
                  <div className="stat-icon" style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.875rem',
                    fontWeight: '700',
                    backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : 
                                  isCompleted ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
                    border: isActive ? '3px solid rgba(255,255,255,0.5)' : '2px solid rgba(255,255,255,0.2)',
                    boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                    transform: isActive ? 'scale(1.05)' : 'scale(1)'
                  }}>
                    {isCompleted && !isActive ? <Check size={16} /> : index + 1}
                  </div>
                  <span style={{ 
                    marginLeft: '0.75rem', 
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    display: window.innerWidth > 640 ? 'block' : 'none'
                  }}>
                    <span style={{ marginRight: '0.25rem' }}>{item.icon}</span>
                    {item.label}
                  </span>
                  
                  {/* Linha conectora */}
                  {index < 3 && (
                    <div style={{
                      width: '40px',
                      height: '2px',
                      backgroundColor: isCompleted ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)',
                      marginLeft: '1rem',
                      display: window.innerWidth > 640 ? 'block' : 'none'
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

      {/* Main Content */}
      <div className="space-y-6">
        {currentStep === 'upload' && renderUploadStep()}
        {currentStep === 'analysis' && renderAnalysisStep()}
        {currentStep === 'confirmation' && renderConfirmationStep()}
        {currentStep === 'success' && renderSuccessStep()}
      </div>

{/* Footer com botões */}
{currentStep !== 'success' && (
  <div className="transactions-table-card" style={{ 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: '2rem',
    flexWrap: 'wrap',
    gap: '1rem'
  }}>
    <div>
      {currentStep === 'analysis' && (
        <button
          onClick={() => setCurrentStep('upload')}
          className="nav-btn"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            fontSize: '0.875rem'
          }}
        >
          <ArrowLeft size={16} />
          Voltar
        </button>
      )}
      {currentStep === 'confirmation' && (
        <button
          onClick={() => setCurrentStep('analysis')}
          className="nav-btn"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            fontSize: '0.875rem'
          }}
        >
          <ArrowLeft size={16} />
          Voltar
        </button>
      )}
    </div>
    
    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
      <button
        onClick={handleVoltar}
        className="nav-btn"
        style={{ 
          padding: '0.75rem 1rem',
          fontSize: '0.875rem',
          fontWeight: '500'
        }}
      >
        Cancelar
      </button>
      
      {currentStep === 'analysis' && (
        <button
          onClick={() => setCurrentStep('confirmation')}
          disabled={selectedTransactions.size === 0 || validateTransactions().length > 0}
          className="nav-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            fontSize: '0.875rem',
            fontWeight: '600',
            backgroundColor: validateTransactions().length > 0 ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            opacity: validateTransactions().length > 0 ? 0.7 : 1,
            cursor: validateTransactions().length > 0 ? 'not-allowed' : 'pointer',
            minWidth: '200px',
            justifyContent: 'center'
          }}
          title={validateTransactions().length > 0 ? 'Preencha todos os campos obrigatórios antes de continuar' : ''}
        >
          {validateTransactions().length > 0 ? (
            <>
              <AlertCircle size={16} />
              {validateTransactions().length === 1 
                ? '1 Campo Pendente'
                : `${validateTransactions().length} Campos Pendentes`
              }
            </>
          ) : (
            <>
              <CheckCircle size={16} />
              Importar {selectedTransactions.size} 
              {selectedTransactions.size === 1 ? ' Transação' : ' Transações'}
            </>
          )}
        </button>
      )}
      
      {currentStep === 'confirmation' && (
        <button
          onClick={handleImport}
          disabled={loading || selectedTransactions.size === 0}
          className="nav-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            fontSize: '0.875rem',
            fontWeight: '600',
            backgroundColor: loading || selectedTransactions.size === 0 ? '#9ca3af' : '#10b981',
            color: 'white',
            border: 'none',
            opacity: loading || selectedTransactions.size === 0 ? 0.7 : 1,
            cursor: loading || selectedTransactions.size === 0 ? 'not-allowed' : 'pointer',
            minWidth: '180px',
            justifyContent: 'center'
          }}
        >
          {loading ? (
            <>
              <div className="loading-spinner" style={{ width: '16px', height: '16px' }}></div>
              Importando...
            </>
          ) : (
            <>
              <Save size={16} />
              Confirmar Importação
            </>
          )}
        </button>
      )}
    </div>
  </div>
)}

{/* Footer especial para success */}
{currentStep === 'success' && (
  <div className="transactions-table-card" style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    gap: '1rem', 
    marginTop: '2rem',
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981',
    flexWrap: 'wrap'
  }}>
    <button
      onClick={handleNovaImportacao}
      className="nav-btn"
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.5rem',
        padding: '0.75rem 1.5rem',
        fontSize: '0.875rem',
        fontWeight: '500',
        backgroundColor: '#ffffff',
        color: '#3b82f6',
        border: '2px solid #3b82f6'
      }}
    >
      🔄 Nova Importação
    </button>
    <button
      onClick={handleVoltar}
      className="nav-btn"
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.5rem',
        padding: '0.75rem 1.5rem',
        fontSize: '0.875rem',
        fontWeight: '600',
        backgroundColor: '#10b981',
        color: 'white',
        border: 'none'
      }}
    >
      ✅ Voltar para Transações
    </button>
  </div>
)}
      
{/* Error Toast - Versão melhorada */}
{error && (
  <div className="fixed top-6 right-6 max-w-md z-50">
    <div className="error-banner">
      <AlertCircle size={18} className="error-icon" />
      <div className="flex-1">
        <div className="error-title">Erro</div>
        <div className="error-message">{error}</div>
      </div>
      <button
        onClick={() => setError(null)}
        className="error-close"
      >
        <X size={14} />
      </button>
    </div>
  </div>
)}

          {/* Loading Overlay */}
          {loading && (
            <div style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 50,
              backdropFilter: 'blur(4px)'
            }}>
              <div className="transactions-table-card" style={{
                maxWidth: '400px',
                margin: '1rem',
                textAlign: 'center',
                animation: 'fadeIn 0.3s ease-out'
              }}>
                <div className="summary-panel" style={{
                  border: 'none',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                }}>
                  <div className="stat-icon" style={{
                    width: '64px',
                    height: '64px',
                    margin: '0 auto 1.5rem',
                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    color: 'white',
                    animation: 'pulse 2s infinite'
                  }}>
                    <Upload size={32} />
                  </div>
                  
                  <h3 style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: '700', 
                    color: '#111827',
                    margin: '0 0 0.5rem 0' 
                  }}>
                    {currentStep === 'upload' ? 'Analisando arquivo...' : 'Importando transações...'}
                  </h3>
                  
                  <p style={{ 
                    color: '#6b7280', 
                    margin: '0 0 1.5rem 0',
                    lineHeight: '1.5'
                  }}>
                    {currentStep === 'upload' 
                      ? 'Processando seu extrato e identificando as transações automaticamente.'
                      : tipoImportacao === 'conta'
                        ? 'Salvando as transações na sua conta...'
                        : 'Criando despesas no seu cartão de crédito...'
                    }
                  </p>
                  
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '0.75rem',
                    padding: '1rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '0.5rem',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div className="loading-spinner" style={{ 
                      width: '24px', 
                      height: '24px',
                      borderWidth: '3px',
                      borderTopColor: '#3b82f6'
                    }}></div>
                    <span style={{ 
                      fontSize: '0.875rem', 
                      color: '#64748b',
                      fontWeight: '500'
                    }}>
                      Processando...
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
    </PageContainer>
  );
};

export default ImportacaoPage;
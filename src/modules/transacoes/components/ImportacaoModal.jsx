// src/modules/transacoes/components/ImportacaoModal.jsx - VERSÃO COM SUPORTE PDF
import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Upload, FileText, Check, X, Search, TrendingUp, TrendingDown, CheckCircle, AlertCircle, Eye, Trash2, Save, Settings, CheckSquare, Code, Database, Tag, Building } from 'lucide-react';
import { supabase } from '@lib/supabaseClient';
import { useUIStore } from '@store/uiStore';
import useAuth from '@modules/auth/hooks/useAuth';
import '@modules/transacoes/styles/ImportacaoModal.css';

const ImportacaoModal = ({ isOpen, onClose }) => {
  // ===== ESTADOS LOCAIS =====
  const [currentStep, setCurrentStep] = useState('upload');
  const [file, setFile] = useState(null);
  const [transacoes, setTransacoes] = useState([]);
  const [selectedTransactions, setSelectedTransactions] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ search: '', type: '', status: '' });
  const [contaSelecionada, setContaSelecionada] = useState('');
  
  // Estados para dropdowns
  const [categoriaDropdownOpen, setCategoriaDropdownOpen] = useState({});
  const [subcategoriaDropdownOpen, setSubcategoriaDropdownOpen] = useState({});
  
  // Estados locais para dados
  const [contas, setContas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  
  const fileInputRef = useRef(null);

  // ===== HOOKS BÁSICOS =====
  const { user } = useAuth();
  const { showNotification } = useUIStore();

  // ===== FUNÇÕES PARA CARREGAR DADOS =====
  const carregarContas = useCallback(async () => {
    if (!user?.id) return;
    try {
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

  const carregarCategorias = useCallback(async () => {
    if (!user?.id) return;
    try {
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

  // ===== EFEITOS =====
  useEffect(() => {
    if (isOpen && user?.id) {
      setLoadingData(true);
      Promise.all([carregarContas(), carregarCategorias()])
        .finally(() => setLoadingData(false));
    }
  }, [isOpen, user?.id, carregarContas, carregarCategorias]);

  useEffect(() => {
    if (!isOpen) {
      // Reset ao fechar modal
      setCurrentStep('upload');
      setFile(null);
      setTransacoes([]);
      setSelectedTransactions(new Set());
      setError(null);
      setFilters({ search: '', type: '', status: '' });
      setContaSelecionada('');
      setCategoriaDropdownOpen({});
      setSubcategoriaDropdownOpen({});
    }
  }, [isOpen]);

  // Auto-selecionar primeira conta disponível
  useEffect(() => {
    if (contas.length > 0 && !contaSelecionada) {
      setContaSelecionada(contas[0].id);
    }
  }, [contas, contaSelecionada]);

  // ===== DADOS COMPUTADOS =====
  const categoriasReceita = useMemo(() => 
    categorias.filter(cat => cat.tipo === 'receita'), [categorias]
  );
  
  const categoriasDespesa = useMemo(() => 
    categorias.filter(cat => cat.tipo === 'despesa'), [categorias]
  );

  // ===== FUNÇÕES AUXILIARES PARA SUBCATEGORIAS =====
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

  // ===== CARREGADOR E CONFIGURADOR DE PDF.JS =====
  const loadPDFJS = useCallback(async () => {
    // Verificar se já está carregado
    if (typeof window !== 'undefined' && window.pdfjsLib) {
      console.log('✅ PDF.js já está carregado');
      return true;
    }
    
    try {
      console.log('📦 Carregando PDF.js...');
      
      // Carregar script principal
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
      
      // Configurar worker
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

  // ===== PARSER DE PDF (BASEADO NO HTML DEMONSTRATIVO) =====
  const parsePDF = useCallback(async (file) => {
    try {
      console.log('📄 Iniciando parse de PDF:', file.name);
      
      // Garantir que PDF.js está carregado
      const pdfReady = await loadPDFJS();
      if (!pdfReady) {
        throw new Error('Falha ao carregar PDF.js');
      }
      
      // Converter arquivo para ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Carregar PDF
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      console.log('📖 PDF carregado:', {
        numPages: pdf.numPages,
        fingerprint: pdf.fingerprint
      });
      
      // Extrair texto de todas as páginas
      let textoCompleto = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        console.log(`📄 Processando página ${i}/${pdf.numPages}`);
        
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Extrair texto da página
        const pageText = textContent.items.map(item => item.str).join(' ');
        textoCompleto += pageText + '\n';
      }
      
      if (!textoCompleto.trim()) {
        throw new Error('Nenhum texto foi extraído do PDF');
      }
      
      console.log('📝 Texto extraído:', textoCompleto.length, 'caracteres');
      
      // Analisar transações usando a lógica do HTML demonstrativo
      return analisarTransacoesPDF(textoCompleto);
      
    } catch (error) {
      console.error('❌ Erro ao processar PDF:', error);
      throw error;
    }
  }, [loadPDFJS]);

  // ===== FUNÇÃO BASEADA NO HTML DEMONSTRATIVO =====
  const analisarTransacoesPDF = useCallback((texto) => {
    const transacoes = [];
    const linhas = texto.split('\n');
    
    // Detectar tipo de documento
    const tipoDocumento = detectarTipoDocumento(texto);
    console.log('📄 Tipo detectado:', tipoDocumento);
    
    console.log('📋 Analisando', linhas.length, 'linhas de texto');
    
    // Padrões regex EXATOS do HTML demonstrativo
    const padroes = [
      // Padrão 1: DD/MM/YYYY DESCRIÇÃO VALOR
      /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([+-]?\d{1,3}(?:\.\d{3})*,\d{2})/g,
      // Padrão 2: DD/MM DESCRIÇÃO VALOR
      /(\d{2}\/\d{2})\s+(.+?)\s+([+-]?\d{1,3}(?:\.\d{3})*,\d{2})/g,
      // Padrão 3: VALOR DESCRIÇÃO DD/MM
      /([+-]?\d{1,3}(?:\.\d{3})*,\d{2})\s+(.+?)\s+(\d{2}\/\d{2})/g,
    ];

    for (const linha of linhas) {
      for (const padrao of padroes) {
        const matches = [...linha.matchAll(padrao)];
        
        for (const match of matches) {
          let data, descricao, valor;
          
          if (padrao === padroes[0]) { // DD/MM/YYYY DESCRIÇÃO VALOR
            [, data, descricao, valor] = match;
          } else if (padrao === padroes[1]) { // DD/MM DESCRIÇÃO VALOR
            [, data, descricao, valor] = match;
            data = data + '/' + new Date().getFullYear();
          } else if (padrao === padroes[2]) { // VALOR DESCRIÇÃO DD/MM
            [, valor, descricao, data] = match;
            data = data + '/' + new Date().getFullYear();
          }

          // Limpar e processar dados - LÓGICA EXATA DO HTML
          descricao = descricao.trim().replace(/\s+/g, ' ');
          valor = parseFloat(valor.replace(/\./g, '').replace(',', '.'));
          
          // Determinar tipo (receita ou despesa)
          let tipo;
          if (tipoDocumento === 'fatura_cartao') {
            tipo = 'despesa'; // Fatura de cartão = sempre despesa
          } else {
            tipo = valor >= 0 ? 'receita' : 'despesa';
          }
          valor = Math.abs(valor);

          // Filtrar transações válidas - LÓGICA EXATA DO HTML
          if (valor > 0 && descricao.length > 3) {
            transacoes.push({
              id: transacoes.length,
              data: converterData(data),
              descricao: descricao,
              valor: valor,
              tipo: tipo,
              categoria_id: '',
              categoriaTexto: '',
              subcategoria_id: '',
              subcategoriaTexto: '',
              conta_id: contaSelecionada,
              efetivado: true,
              observacoes: 'Importado via PDF',
              origem: 'PDF'
            });
          }
        }
      }
    }

    // Remover duplicatas - LÓGICA EXATA DO HTML
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

    // Ordenar por data - LÓGICA EXATA DO HTML
    return transacoesUnicas.sort((a, b) => new Date(a.data) - new Date(b.data));
  }, [contaSelecionada]);

  // ===== DETECÇÃO DE TIPO DE DOCUMENTO =====
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

  // ===== CONVERSOR DE DATA DO HTML DEMONSTRATIVO =====
  const converterData = useCallback((dataStr) => {
    const partes = dataStr.split('/');
    if (partes.length === 3) {
      return `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
    }
    return dataStr;
  }, []);

  // ===== PARSERS ORIGINAIS (mantidos) =====
  const parseOFX = (content) => {
    const transacoes = [];
    const transacaoRegex = /<STMTTRN>(.*?)<\/STMTTRN>/gs;
    let match;
    let counter = 1;
    
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
        
        transacoes.push({
          id: counter++,
          data: dataFormatada,
          descricao,
          valor: Math.abs(valor),
          tipo: valor >= 0 ? 'receita' : 'despesa',
          categoria_id: '',
          categoriaTexto: '',
          subcategoria_id: '',
          subcategoriaTexto: '',
          conta_id: contaSelecionada,
          efetivado: new Date(dataFormatada) <= new Date(),
          observacoes: '',
          origem: 'OFX'
        });
      }
    }
    
    return transacoes;
  };

  const parseCSV = (content) => {
    const lines = content.split('\n').filter(line => line.trim());
    const transacoes = [];
    
    // Detectar separador
    const separadores = [';', ',', '\t'];
    let separador = ';';
    let maxColunas = 0;
    
    for (const sep of separadores) {
      const cols = lines[0]?.split(sep) || [];
      if (cols.length > maxColunas) {
        maxColunas = cols.length;
        separador = sep;
      }
    }
    
    // Pular cabeçalho se existir
    const startIndex = lines[0]?.toLowerCase().includes('data') ? 1 : 0;
    
    lines.slice(startIndex).forEach((line, index) => {
      const parts = line.split(separador).map(p => p.trim());
      
      if (parts.length >= 3) {
        const [dataStr, descricao, valorStr] = parts;
        
        if (dataStr && descricao && valorStr) {
          const data = parseDate(dataStr);
          const valor = parseValue(valorStr);
          
          if (data && !isNaN(valor)) {
            transacoes.push({
              id: index + 1,
              data,
              descricao: descricao.trim(),
              valor: Math.abs(valor),
              tipo: valor >= 0 ? 'receita' : 'despesa',
              categoria_id: '',
              categoriaTexto: '',
              subcategoria_id: '',
              subcategoriaTexto: '',
              conta_id: contaSelecionada,
              efetivado: new Date(data) <= new Date(),
              observacoes: '',
              origem: 'CSV'
            });
          }
        }
      }
    });
    
    return transacoes;
  };

  const parseDate = (dateStr) => {
    const formats = [
      /(\d{2})\/(\d{2})\/(\d{4})/,
      /(\d{4})-(\d{2})-(\d{2})/,
      /(\d{2})-(\d{2})-(\d{4})/
    ];
    
    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        if (format === formats[1]) {
          return `${match[1]}-${match[2]}-${match[3]}`;
        } else {
          return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
        }
      }
    }
    return new Date().toISOString().split('T')[0];
  };

  const parseValue = (valueStr) => {
    if (!valueStr) return 0;
    
    let cleaned = valueStr.toString().replace(/[^\d,.()-]/g, '');
    const isNegative = cleaned.includes('(') || cleaned.startsWith('-');
    cleaned = cleaned.replace(/[()-]/g, '');
    
    if (/,\d{2}$/.test(cleaned)) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    }
    
    const value = parseFloat(cleaned) || 0;
    return isNegative ? -value : value;
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

  const handleAnalyze = async () => {
    if (!file) return;
    
    if (!contaSelecionada) {
      setError('Selecione uma conta para importar as transações');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const text = await file.text();
      let parsedTransactions = [];
      
      // Detectar tipo de arquivo
      const fileName = file.name.toLowerCase();
      const fileType = file.type.toLowerCase();
      
      if (fileName.endsWith('.pdf') || fileType.includes('pdf')) {
        console.log('📄 Processando arquivo PDF');
        parsedTransactions = await parsePDF(file);
      } else if (text.includes('<OFX>') || text.includes('OFXHEADER')) {
        console.log('📄 Processando arquivo OFX');
        parsedTransactions = parseOFX(text);
      } else {
        console.log('📄 Processando arquivo CSV/TXT');
        parsedTransactions = parseCSV(text);
      }
      
      if (parsedTransactions.length === 0) {
        setError('Nenhuma transação encontrada no arquivo');
        return;
      }
      
      // Atualizar conta_id de todas as transações
      parsedTransactions = parsedTransactions.map(t => ({
        ...t,
        conta_id: contaSelecionada
      }));
      
      setTransacoes(parsedTransactions);
      setSelectedTransactions(new Set(parsedTransactions.map(t => t.id)));
      setCurrentStep('analysis');
      
    } catch (err) {
      console.error('❌ Erro ao processar arquivo:', err);
      setError('Erro ao processar arquivo: ' + err.message);
    } finally {
      setLoading(false);
    }
  };


  // ===== HANDLERS DE CATEGORIA/SUBCATEGORIA =====
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

  // ===== VALIDAÇÃO DE CAMPOS OBRIGATÓRIOS =====
  const validateTransactions = () => {
    const selectedTransList = transacoes.filter(t => selectedTransactions.has(t.id));
    const errors = [];
    
    selectedTransList.forEach((transaction, index) => {
      const transactionErrors = [];
      
      // Validar campos obrigatórios
      if (!transaction.data) {
        transactionErrors.push('Data é obrigatória');
      }
      
      if (!transaction.descricao || !transaction.descricao.trim()) {
        transactionErrors.push('Descrição é obrigatória');
      }
      
      if (!transaction.categoria_id) {
        transactionErrors.push('Categoria é obrigatória');
      }
      
      if (!transaction.conta_id) {
        transactionErrors.push('Conta é obrigatória');
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

  // ===== HANDLER DE IMPORTAÇÃO =====
  const handleImport = async () => {
    // Validar antes de importar
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
      
      console.log('🚀 Iniciando importação de', selectedTransList.length, 'transações');
      
      // Preparar dados para inserção direta
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
        // SEMPRE COMO TRANSAÇÃO EXTRA (nunca previsível ou parcelada)
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
      
      console.log('💾 Inserindo transações no banco:', transacoesParaInserir);
      
      // Inserção direta no Supabase
      const { data, error } = await supabase
        .from('transacoes')
        .insert(transacoesParaInserir);
      
      if (error) {
        console.error('❌ Erro do Supabase:', error);
        throw error;
      }
      
      console.log('✅ Transações inseridas com sucesso:', data);
      
      // Recarregar contas para atualizar saldos
      await carregarContas();
      
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

  // ===== RENDERIZAÇÃO =====
  if (!isOpen) return null;

  const renderUploadStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="modal-title">💰 Importação de Transações</h2>
        <p className="modal-subtitle">Importe extratos bancários e faturas de cartão</p>
      </div>

      {/* Loading de dados */}
      {loadingData && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Carregando dados...</p>
        </div>
      )}

      {/* Seleção da Conta */}
      {!loadingData && (
        <div className="summary-panel">
          <h3 className="summary-title">
            <Building size={16} />
            Selecione a conta de destino
          </h3>
          <div className="select-search">
            <select
              value={contaSelecionada}
              onChange={(e) => setContaSelecionada(e.target.value)}
            >
              <option value="">Selecionar conta...</option>
              {contas.map(conta => (
                <option key={conta.id} value={conta.id}>
                  {conta.nome} ({conta.tipo}) - R$ {(conta.saldo || 0).toFixed(2)}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Upload de Arquivo */}
      {!loadingData && (
        <div className="empty-state" style={{ 
          border: '2px dashed #e5e7eb',
          borderRadius: '1rem',
          cursor: 'pointer',
          transition: 'border-color 0.15s ease',
          minHeight: '200px'
        }}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={48} style={{ color: '#9ca3af', marginBottom: '1rem' }} />
          {file ? (
            <div>
              <h3 className="empty-state-title">📁 Arquivo selecionado:</h3>
              <p style={{ color: '#3b82f6', fontWeight: '600' }}>{file.name}</p>
              <span className="text-sm text-gray-600">({(file.size / 1024).toFixed(1)} KB)</span>
            </div>
          ) : (
            <div>
              <h3 className="empty-state-title">Arraste seu extrato aqui ou clique para selecionar</h3>
              <p className="empty-state-description">Formatos aceitos: .pdf, .csv, .txt, .ofx</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt,.ofx,.pdf"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </div>
      )}

      {/* Botão de Análise */}
      {!loadingData && (
        <div className="text-center">
          <button
            onClick={handleAnalyze}
            disabled={!file || loading || !contaSelecionada}
            className="btn-primary"
            style={{ padding: '0.75rem 1.5rem' }}
          >
            {loading ? (
              <>
                <div className="btn-spinner"></div>
                Analisando...
              </>
            ) : (
              <>
                <FileText size={18} />
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
        <div className="summary-panel success">
          <h3 className="summary-title">
            <CheckCircle size={18} />
            ✅ Análise Concluída
          </h3>
        </div>
        
        {/* Indicador de transações com problemas */}
        {transacoes.length > 0 && (
          <div className="summary-panel" style={{ 
            background: validateTransactions().length > 0 ? '#fef2f2' : '#f0fdf4',
            border: `1px solid ${validateTransactions().length > 0 ? '#fecaca' : '#bbf7d0'}`
          }}>
            <h3 className="summary-title">
              {validateTransactions().length > 0 ? (
                <>
                  <AlertCircle size={16} style={{ color: '#ef4444' }} />
                  ⚠️ Campos obrigatórios pendentes
                </>
              ) : (
                <>
                  <CheckCircle size={16} style={{ color: '#10b981' }} />
                  ✅ Todas as transações válidas
                </>
              )}
            </h3>
            {validateTransactions().length > 0 ? (
              <div>
                <p style={{ margin: '0 0 8px 0', color: '#ef4444', fontSize: '0.875rem' }}>
                  {validateTransactions().length} transação(ões) com campos obrigatórios em branco.
                </p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>
                  Campos obrigatórios: Data, Descrição, Categoria e Valor maior que zero.
                </p>
                
                {/* Barra de progresso */}
                <div style={{ marginTop: '0.75rem' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '0.25rem'
                  }}>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      Progresso de preenchimento
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>
                      {selectedTransList.length - validateTransactions().length}/{selectedTransList.length}
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '6px',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${((selectedTransList.length - validateTransactions().length) / selectedTransList.length) * 100}%`,
                      height: '100%',
                      backgroundColor: validateTransactions().length > 0 ? '#f59e0b' : '#10b981',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ margin: '0 0 8px 0', color: '#10b981', fontSize: '0.875rem' }}>
                  Todas as transações selecionadas estão prontas para importação.
                </p>
                
                {/* Barra de progresso completa */}
                <div style={{ marginTop: '0.75rem' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '0.25rem'
                  }}>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      Progresso de preenchimento
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#10b981' }}>
                      {selectedTransList.length}/{selectedTransList.length} ✅
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '6px',
                    backgroundColor: '#10b981',
                    borderRadius: '3px'
                  }} />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="stats-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '1rem', 
          margin: '1.5rem 0' 
        }}>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <span className="stat-label">Total</span>
              <span className="stat-value">{transacoes.length}</span>
            </div>
          </div>
          <div className="stat-card receitas">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <span className="stat-label">Receitas</span>
              <span className="stat-value">R$ {totalReceitas.toFixed(2)}</span>
            </div>
          </div>
          <div className="stat-card despesas">
            <div className="stat-icon">💸</div>
            <div className="stat-content">
              <span className="stat-label">Despesas</span>
              <span className="stat-value">R$ {totalDespesas.toFixed(2)}</span>
            </div>
          </div>
          <div className="stat-card saldo">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <span className="stat-label">Selecionadas</span>
              <span className="stat-value">{selectedTransList.length}</span>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-3 row" style={{ marginBottom: '1rem' }}>
          <div>
            <input
              type="text"
              placeholder="🔍 Buscar transações..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="input-text"
            />
          </div>
          <div>
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="input-base"
            >
              <option value="">Todos os tipos</option>
              <option value="receita">💰 Receitas</option>
              <option value="despesa">💸 Despesas</option>
            </select>
          </div>
          <div>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="input-base"
            >
              <option value="">Todos status</option>
              <option value="efetivado">✅ Efetivado</option>
              <option value="pendente">⏳ Pendente</option>
            </select>
          </div>
        </div>

        {/* Tabela de Transações */}
        <div style={{ 
          overflowX: 'auto', 
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 500px)',
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem'
        }}>
          <table className="transactions-table">
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>
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
                  />
                </th>
                <th className="required-header">Data</th>
                <th className="required-header">Descrição</th>
                <th className="required-header">Valor</th>
                <th>Tipo</th>
                <th className="required-header">Categoria</th>
                <th>Subcategoria</th>
                <th>Status</th>
                <th>Observações</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => {
                const categoriasDisponiveis = getCategoriasFiltradasPorTipo(transaction.tipo);
                const subcategoriasDisponiveis = getSubcategoriasFiltradas(transaction.categoria_id, transaction.subcategoriaTexto);
                const categoriaSelecionada = categorias.find(c => c.id === transaction.categoria_id);
                
                return (
                  <tr key={transaction.id} className={`transaction-row ${
                    // Destacar linhas com campos obrigatórios em branco
                    (!transaction.categoria_id || !transaction.descricao?.trim() || !transaction.valor || transaction.valor <= 0) 
                      ? 'transaction-row--error' 
                      : ''
                  }`}>
                    <td style={{ textAlign: 'center', padding: '0.75rem' }}>
                      <input
                        type="checkbox"
                        checked={selectedTransactions.has(transaction.id)}
                        onChange={() => toggleTransactionSelection(transaction.id)}
                        style={{ width: '16px', height: '16px' }}
                      />
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <input
                        type="date"
                        value={transaction.data}
                        onChange={(e) => updateTransaction(transaction.id, 'data', e.target.value)}
                        className={`input-date ${!transaction.data ? 'input-error' : ''}`}
                        style={{ fontSize: '0.75rem', padding: '0.25rem' }}
                        required
                      />
                      {!transaction.data && (
                        <div className="field-error">Data obrigatória</div>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <input
                        type="text"
                        value={transaction.descricao}
                        onChange={(e) => updateTransaction(transaction.id, 'descricao', e.target.value)}
                        className={`input-text ${!transaction.descricao?.trim() ? 'input-error' : ''}`}
                        style={{ fontSize: '0.75rem', padding: '0.25rem' }}
                        placeholder="Descrição obrigatória"
                        required
                      />
                      {!transaction.descricao?.trim() && (
                        <div className="field-error">Descrição obrigatória</div>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div className={`flex items-center valor ${transaction.tipo === 'receita' ? 'receita' : 'despesa'}`}>
                        {transaction.tipo === 'receita' ? 
                          <TrendingUp size={14} style={{ marginRight: '0.25rem' }} /> : 
                          <TrendingDown size={14} style={{ marginRight: '0.25rem' }} />
                        }
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={transaction.valor}
                          onChange={(e) => updateTransaction(transaction.id, 'valor', parseFloat(e.target.value) || 0)}
                          className={`input-money ${(!transaction.valor || transaction.valor <= 0) ? 'input-error' : ''}`}
                          style={{ 
                            width: '80px', 
                            fontSize: '0.75rem', 
                            padding: '0.25rem',
                            background: 'none',
                            fontVariantNumeric: 'tabular-nums'
                          }}
                          placeholder="0,00"
                          required
                        />
                      </div>
                      {(!transaction.valor || transaction.valor <= 0) && (
                        <div className="field-error">Valor obrigatório</div>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <select
                        value={transaction.tipo}
                        onChange={(e) => {
                          updateTransaction(transaction.id, 'tipo', e.target.value);
                          updateTransaction(transaction.id, 'categoria_id', '');
                          updateTransaction(transaction.id, 'categoriaTexto', '');
                          updateTransaction(transaction.id, 'subcategoria_id', '');
                          updateTransaction(transaction.id, 'subcategoriaTexto', '');
                        }}
                        className="input-base"
                        style={{ fontSize: '0.75rem', padding: '0.25rem' }}
                      >
                        <option value="receita">💰 Receita</option>
                        <option value="despesa">💸 Despesa</option>
                      </select>
                    </td>
                    <td style={{ padding: '0.75rem', minWidth: '180px' }}>
                      <div className="dropdown-container">
                        <input
                          type="text"
                          value={transaction.categoriaTexto}
                          onChange={(e) => handleCategoriaTextChange(transaction.id, e.target.value)}
                          onFocus={() => setCategoriaDropdownOpen(prev => ({ ...prev, [transaction.id]: true }))}
                          onBlur={() => setTimeout(() => setCategoriaDropdownOpen(prev => ({ ...prev, [transaction.id]: false })), 200)}
                          placeholder="Categoria obrigatória *"
                          className={`input-text ${!transaction.categoria_id ? 'input-error' : ''}`}
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.25rem',
                            paddingLeft: categoriaSelecionada ? '20px' : '8px',
                            paddingRight: '24px'
                          }}
                          required
                        />
                        {categoriaSelecionada && (
                          <div
                            className="category-color-tag"
                            style={{
                              position: 'absolute',
                              left: '6px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: categoriaSelecionada.cor || '#6b7280'
                            }}
                          />
                        )}
                        <Tag 
                          size={12} 
                          style={{
                            position: 'absolute',
                            right: '6px',
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
                      {!transaction.categoria_id && (
                        <div className="field-error">Categoria obrigatória</div>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem', minWidth: '180px' }}>
                      <div className="dropdown-container">
                        <input
                          type="text"
                          value={transaction.subcategoriaTexto}
                          onChange={(e) => handleSubcategoriaTextChange(transaction.id, e.target.value)}
                          onFocus={() => setSubcategoriaDropdownOpen(prev => ({ ...prev, [transaction.id]: true }))}
                          onBlur={() => setTimeout(() => setSubcategoriaDropdownOpen(prev => ({ ...prev, [transaction.id]: false })), 200)}
                          placeholder="Subcategoria..."
                          disabled={!transaction.categoria_id}
                          className="input-text input-disabled"
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.25rem',
                            paddingLeft: categoriaSelecionada ? '20px' : '8px',
                            paddingRight: '24px'
                          }}
                        />
                        {categoriaSelecionada && (
                          <div
                            className="category-color-tag"
                            style={{
                              position: 'absolute',
                              left: '6px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: categoriaSelecionada.cor || '#6b7280'
                            }}
                          />
                        )}
                        <Tag 
                          size={12} 
                          style={{
                            position: 'absolute',
                            right: '6px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#9ca3af'
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
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <select
                        value={transaction.efetivado ? 'efetivado' : 'pendente'}
                        onChange={(e) => updateTransaction(transaction.id, 'efetivado', e.target.value === 'efetivado')}
                        className="input-base"
                        style={{ fontSize: '0.75rem', padding: '0.25rem' }}
                      >
                        <option value="efetivado">✅ Efetivado</option>
                        <option value="pendente">⏳ Pendente</option>
                      </select>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <input
                        type="text"
                        value={transaction.observacoes}
                        onChange={(e) => updateTransaction(transaction.id, 'observacoes', e.target.value)}
                        placeholder="Observações..."
                        className="input-text"
                        style={{ fontSize: '0.75rem', padding: '0.25rem' }}
                        maxLength="300"
                      />
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

  const renderConfirmationStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle size={64} style={{ color: '#10b981', margin: '0 auto 1rem' }} />
        <h2 className="modal-title">🎯 Confirmação de Importação</h2>
        <p className="modal-subtitle">Revise o resumo antes de finalizar</p>
      </div>

      <div className="transactions-table-card">
        <div className="stats-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '1.5rem', 
          margin: '1.5rem 0' 
        }}>
          <div className="stat-card saldo">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <span className="stat-label">Transações</span>
              <span className="stat-value">{selectedTransList.length}</span>
            </div>
          </div>
          <div className="stat-card saldo">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <span className="stat-label">Saldo Líquido</span>
              <span className={`stat-value ${(totalReceitas - totalDespesas) >= 0 ? 'positive' : 'negative'}`}>
                R$ {(totalReceitas - totalDespesas).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Informações da conta */}
        <div className="summary-panel">
          <h3 className="summary-title">
            <Building size={16} />
            Conta de destino
          </h3>
          {(() => {
            const conta = contas.find(c => c.id === contaSelecionada);
            return conta ? (
              <p className="summary-value" style={{ fontSize: '1rem', margin: 0 }}>
                {conta.nome} ({conta.tipo}) - Saldo atual: R$ {(conta.saldo || 0).toFixed(2)}
              </p>
            ) : (
              <p style={{ color: '#ef4444', margin: 0 }}>Conta não selecionada</p>
            );
          })()}
        </div>

        {/* Resumo das transações */}
        <div className="summary-panel">
          <h3 className="summary-title">📊 Resumo das transações</h3>
          <div className="stats-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: '1rem' 
          }}>
            <div className="stat-card receitas">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <span className="stat-label">Receitas</span>
                <span className="stat-value">{selectedTransList.filter(t => t.tipo === 'receita').length} transações</span>
                <span className="stat-count">R$ {totalReceitas.toFixed(2)}</span>
              </div>
            </div>
            <div className="stat-card despesas">
              <div className="stat-icon">💸</div>
              <div className="stat-content">
                <span className="stat-label">Despesas</span>
                <span className="stat-value">{selectedTransList.filter(t => t.tipo === 'despesa').length} transações</span>
                <span className="stat-count">R$ {totalDespesas.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Aviso sobre tipo de transação */}
        <div className="confirmation-info-box">
          <AlertCircle size={16} />
          <div>
            <h4 style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#1e40af' }}>
              ℹ️ Informação sobre importação
            </h4>
            <p style={{ margin: 0 }}>
              Todas as transações serão importadas como <strong>transações extras</strong> (únicas). 
              Elas não serão criadas como receitas previsíveis ou despesas parceladas. 
              Caso precise configurar recorrências, você pode editar individualmente após a importação.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="text-center space-y-6">
      <div style={{ animation: 'bounce 1s infinite' }}>
        <CheckCircle size={96} style={{ color: '#10b981', margin: '0 auto' }} />
      </div>
      
      <div>
        <h2 className="modal-title">🎉 Importação Concluída!</h2>
        <p className="modal-subtitle" style={{ fontSize: '1.25rem', marginTop: '1rem' }}>
          {selectedTransactions.size} transações foram importadas com sucesso!
        </p>
      </div>

      <div className="transactions-table-card">
        <div className="extra-stats">
          <div className="extra-stat">
            <span className="extra-stat-label">Transações importadas</span>
            <span className="extra-stat-value">{selectedTransactions.size}</span>
          </div>
          <div className="extra-stat">
            <span className="extra-stat-label">Receitas</span>
            <span className="extra-stat-value positive">R$ {totalReceitas.toFixed(2)}</span>
          </div>
          <div className="extra-stat">
            <span className="extra-stat-label">Despesas</span>
            <span className="extra-stat-value negative">R$ {totalDespesas.toFixed(2)}</span>
          </div>
          <div className="extra-stat" style={{ borderTop: '1px solid #e5e7eb', paddingTop: '0.75rem' }}>
            <span className="extra-stat-label" style={{ fontWeight: '600' }}>Saldo líquido</span>
            <span className={`extra-stat-value ${(totalReceitas - totalDespesas) >= 0 ? 'positive' : 'negative'}`} style={{ fontWeight: '700' }}>
              R$ {(totalReceitas - totalDespesas).toFixed(2)}
            </span>
          </div>
          <div className="extra-stat">
            <span className="extra-stat-label">Conta de destino</span>
            <span className="extra-stat-value">
              {(() => {
                const conta = contas.find(c => c.id === contaSelecionada);
                return conta ? conta.nome : 'N/A';
              })()}
            </span>
          </div>
          <div className="extra-stat">
            <span className="extra-stat-label">Tipo de transações</span>
            <span className="extra-stat-value" style={{ color: '#3b82f6' }}>Transações extras</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="modal-overlay active" style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 0,
      margin: 0
    }}>
      <div 
        className="forms-modal-container modal-importacao" 
        style={{
          width: '100vw',
          height: '100vh',
          maxWidth: 'none',
          maxHeight: 'none',
          minWidth: 'none',
          minHeight: 'none',
          margin: 0,
          backgroundColor: 'white',
          borderRadius: 0,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div className="modal-header modal-header-gradient">
          <div className="modal-header-content">
            <div className="modal-icon-container modal-icon-primary">
              <Upload size={18} />
            </div>
            <div>
              <h2 className="modal-title">iPoupei - Importação</h2>
              <p className="modal-subtitle">Importe extratos bancários e faturas de cartão</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
          
          {/* Progress Steps */}
          <div className="flex items-center gap-4 mt-4">
            {[
              { step: 'upload', label: 'Upload', icon: '📁' },
              { step: 'analysis', label: 'Análise', icon: '🔍' },
              { step: 'confirmation', label: 'Confirmação', icon: '✅' },
              { step: 'success', label: 'Sucesso', icon: '🎉' },
            ].map((item, index) => {
              const isActive = currentStep === item.step;
              const isCompleted = ['upload', 'analysis', 'confirmation', 'success'].indexOf(currentStep) > index;
              
              return (
                <div key={item.step} className={`flex items-center ${
                  isActive ? 'text-white' : 
                  isCompleted ? 'text-white' : 'text-white opacity-60'
                }`}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 
                                   isCompleted ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.1)',
                    border: isActive ? '2px solid rgba(255,255,255,0.4)' : '2px solid transparent'
                  }}>
                    {isCompleted && !isActive ? <Check size={16} /> : index + 1}
                  </div>
                  <span className="ml-2 font-medium hidden sm:block">{item.icon} {item.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="modal-body" style={{
          flex: 1,
          overflow: 'auto',
          padding: '1.5rem'
        }}>
          {currentStep === 'upload' && renderUploadStep()}
          {currentStep === 'analysis' && renderAnalysisStep()}
          {currentStep === 'confirmation' && renderConfirmationStep()}
          {currentStep === 'success' && renderSuccessStep()}
        </div>

        {/* Footer com botões */}
        {currentStep !== 'success' && (
          <div className="modal-footer">
            <div className="footer-left">
              {currentStep === 'analysis' && (
                <button
                  onClick={() => setCurrentStep('upload')}
                  className="btn-cancel"
                >
                  ← Voltar
                </button>
              )}
              {currentStep === 'confirmation' && (
                <button
                  onClick={() => setCurrentStep('analysis')}
                  className="btn-cancel"
                >
                  ← Voltar
                </button>
              )}
            </div>
            <div className="footer-right">
              {currentStep === 'analysis' && (
                <button
                  onClick={() => setCurrentStep('confirmation')}
                  disabled={selectedTransactions.size === 0 || validateTransactions().length > 0}
                  className={`btn-primary ${validateTransactions().length > 0 ? 'btn-disabled' : ''}`}
                  title={validateTransactions().length > 0 ? 'Preencha todos os campos obrigatórios antes de continuar' : ''}
                >
                  {validateTransactions().length > 0 ? (
                    <>
                      <AlertCircle size={14} />
                      {validateTransactions().length} Campo(s) Pendente(s)
                    </>
                  ) : (
                    <>
                      Importar {selectedTransactions.size} Transações
                    </>
                  )}
                </button>
              )}
              {currentStep === 'confirmation' && (
                <button
                  onClick={handleImport}
                  disabled={loading || selectedTransactions.size === 0}
                  className="btn-primary"
                >
                  {loading ? (
                    <>
                      <div className="btn-spinner"></div>
                      Importando...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
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
          <div className="modal-footer">
            <div className="footer-right">
              <button
                onClick={() => {
                  setCurrentStep('upload');
                  setFile(null);
                  setTransacoes([]);
                  setSelectedTransactions(new Set());
                  setFilters({ search: '', type: '', status: '' });
                  setError(null);
                  setCategoriaDropdownOpen({});
                  setSubcategoriaDropdownOpen({});
                }}
                className="btn-secondary"
              >
                🔄 Nova Importação
              </button>
              <button
                onClick={onClose}
                className="btn-primary"
              >
                ✅ Concluir
              </button>
            </div>
          </div>
        )}

        {/* Error Toast */}
        {error && (
          <div className="feedback-message error" style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            maxWidth: '400px',
            zIndex: 20,
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            borderRadius: '0.5rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '0.125rem' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Erro</div>
              <div style={{ fontSize: '0.875rem' }}>{error}</div>
            </div>
            <button
              onClick={() => setError(null)}
              style={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                padding: '0.25rem',
                flexShrink: 0
              }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 30
          }}>
            <div className="transactions-table-card" style={{
              textAlign: 'center',
              maxWidth: '400px',
              margin: '0 1rem'
            }}>
              <Upload size={48} style={{ color: '#3b82f6', margin: '0 auto 1rem', animation: 'pulse 2s infinite' }} />
              <h3 className="modal-title" style={{ marginBottom: '0.5rem' }}>
                {currentStep === 'upload' ? 'Analisando arquivo...' : 'Importando transações...'}
              </h3>
              <p className="modal-subtitle" style={{ marginBottom: '1rem' }}>
                {currentStep === 'upload' 
                  ? 'Processando seu extrato e identificando as transações automaticamente.'
                  : 'Salvando as transações no seu sistema iPoupei...'
                }
              </p>
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <div className="loading-text">Processando...</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportacaoModal;
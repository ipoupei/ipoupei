// src/modules/transacoes/components/ImportacaoModal.jsx
import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Upload, FileText, Check, X, Search, TrendingUp, TrendingDown, CheckCircle, AlertCircle, Eye, Trash2, Save, Settings, CheckSquare, Code, Database, Tag, Building } from 'lucide-react';
import useContas from '@modules/contas/hooks/useContas';
import useCategorias from '@modules/categorias/hooks/useCategorias';
import { useTransactions } from '@modules/transacoes/store/transactionsStore';
import { useUIStore } from '@store/uiStore';
import useAuth from '@modules/auth/hooks/useAuth';

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
  
  const fileInputRef = useRef(null);

  // ===== HOOKS PADRONIZADOS =====
  const { user } = useAuth();
  const { contas, loading: loadingContas } = useContas();
  const { categorias, loading: loadingCategorias } = useCategorias();
  const { addTransacao } = useTransactions();
  const { showNotification } = useUIStore();

  // ===== EFEITOS =====
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

  // ===== FUNÇÕES AUXILIARES PARA SUBCATEGORIAS (USANDO HOOK) =====
  const getSubcategoriasPorCategoria = useCallback((categoriaId) => {
    const categoria = categorias.find(cat => cat.id === categoriaId);
    return categoria?.subcategorias || [];
  }, [categorias]);

  const getSubcategoriasFiltradas = useCallback((categoriaId, searchText = '') => {
    let subs = getSubcategoriasPorCategoria(categoriaId);
    if (searchText) {
      subs = subs.filter(sub => 
        sub.nome.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    return subs;
  }, [getSubcategoriasPorCategoria]);

  // ===== PARSERS (mantidos do original) =====
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
      
      if (text.includes('<OFX>') || text.includes('OFXHEADER')) {
        parsedTransactions = parseOFX(text);
      } else {
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
      setError('Erro ao processar arquivo: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestFile = (type) => {
    let content = '';
    let filename = '';
    
    if (type === 'csv') {
      content = `Data,Descrição,Valor
12/06/2025,REMUNERACAO/SALARIO,8456.10
12/06/2025,COR RENDIMENTO KNSC11,157.30
12/06/2025,INT CLARO S.A,-41.34
13/06/2025,MERCADO ATACADAO,-150.75
14/06/2025,COMBUSTIVEL SHELL,-80.50`;
      filename = 'teste.csv';
    } else if (type === 'txt') {
      content = `12/06/2025;REMUNERACAO/SALARIO;8456.10
12/06/2025;COR RENDIMENTO KNSC11;157.30
12/06/2025;INT CLARO S.A;-41.34
13/06/2025;MERCADO ATACADAO;-150.75
16/06/2025;FINANC IMOBILIARIO;-1704.43`;
      filename = 'extrato.txt';
    } else if (type === 'ofx') {
      content = `<OFX>
<BANKMSGSRSV1>
<STMTTRNRS>
<STMTRS>
<BANKTRANLIST>
<STMTTRN>
<DTPOSTED>20250612100000
<TRNAMT>157.30
<MEMO>COR RENDIMENTO KNSC11
</STMTTRN>
<STMTTRN>
<DTPOSTED>20250612100000
<TRNAMT>-41.34
<MEMO>INT CLARO S A
</STMTTRN>
<STMTTRN>
<DTPOSTED>20250613100000
<TRNAMT>8456.10
<MEMO>REMUNERACAO SALARIO
</STMTTRN>
</BANKTRANLIST>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>`;
      filename = 'extrato.ofx';
    }
    
    const mockFile = new File([content], filename, { type: 'text/plain' });
    setFile(mockFile);
  };

  const updateTransaction = (id, field, value) => {
    setTransacoes(prev => prev.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    ));
  };

  const toggleTransactionSelection = (id) => {
    const newSelection = new Set(selectedTransactions);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedTransactions(newSelection);
  };

  // ===== HANDLERS DE CATEGORIA/SUBCATEGORIA (REFATORADOS) =====
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

  // ===== HANDLER DE IMPORTAÇÃO (REFATORADO) =====
  const handleImport = async () => {
    setLoading(true);
    
    try {
      const selectedTransList = transacoes.filter(t => selectedTransactions.has(t.id));
      
      console.log('🚀 Iniciando importação de', selectedTransList.length, 'transações');
      
      // Importar transações uma por uma usando o hook padronizado
      let sucessos = 0;
      let erros = 0;
      
      for (const transacao of selectedTransList) {
        try {
          // Preparar dados para o formato do banco - SEMPRE COMO EXTRA
          const transacaoData = {
            data: transacao.data,
            tipo: transacao.tipo,
            valor: transacao.valor,
            descricao: transacao.descricao,
            conta_id: transacao.conta_id,
            categoria_id: transacao.categoria_id || null,
            subcategoria_id: transacao.subcategoria_id || null,
            efetivado: transacao.efetivado,
            observacoes: transacao.observacoes || `Importado de ${transacao.origem || 'arquivo'} - ${file.name}`,
            // IMPORTANTE: Sempre salvar como extra (nunca previsível ou parcelada)
            tipo_receita: transacao.tipo === 'receita' ? 'extra' : undefined,
            tipo_despesa: transacao.tipo === 'despesa' ? 'extra' : undefined,
            recorrente: false,
            grupo_recorrencia: null,
            grupo_parcelamento: null
          };
          
          console.log('💾 Salvando transação:', transacaoData);
          
          const resultado = await addTransacao(transacaoData);
          
          if (resultado.success) {
            sucessos++;
          } else {
            console.error('Erro ao salvar transação:', resultado.error);
            erros++;
          }
          
        } catch (transacaoError) {
          console.error('Erro ao processar transação:', transacaoError);
          erros++;
        }
      }
      
      console.log(`✅ Importação concluída: ${sucessos} sucessos, ${erros} erros`);
      
      if (sucessos > 0) {
        showNotification(
          `${sucessos} transação(ões) importada(s) com sucesso!`,
          'success'
        );
        setCurrentStep('success');
      } else {
        throw new Error('Nenhuma transação foi importada com sucesso');
      }
      
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

      {/* Seleção da Conta */}
      <div className="summary-panel">
        <h3 className="summary-title">
          <Building size={16} />
          Selecione a conta de destino
        </h3>
        <div className="select-search">
          <select
            value={contaSelecionada}
            onChange={(e) => setContaSelecionada(e.target.value)}
            disabled={loadingContas}
          >
            <option value="">Selecionar conta...</option>
            {contas.map(conta => (
              <option key={conta.id} value={conta.id}>
                {conta.nome} ({conta.tipo}) - R$ {(conta.saldo || 0).toFixed(2)}
              </option>
            ))}
          </select>
        </div>
        {loadingContas && (
          <p className="text-sm text-gray-600 mt-1">Carregando contas...</p>
        )}
      </div>

      {/* Upload de Arquivo */}
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
            <p className="empty-state-description">Formatos aceitos: .csv, .txt, .ofx</p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt,.ofx"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
      </div>

      {/* Botão de Análise */}
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

      {/* Arquivos de Teste */}
      <div className="section-block">
        <h3 className="section-title">🧪 Testar com Arquivos de Exemplo</h3>
        <div className="flex gap-3 row">
          <button 
            onClick={() => handleTestFile('csv')}
            className="btn-secondary"
            style={{ 
              flexDirection: 'column', 
              padding: '1rem',
              background: '#f3f4f6',
              border: '1px solid #d1d5db'
            }}
          >
            <Code size={20} style={{ marginBottom: '0.5rem', color: '#8b5cf6' }} />
            <div style={{ fontWeight: '500' }}>Testar CSV</div>
          </button>
          <button 
            onClick={() => handleTestFile('txt')}
            className="btn-secondary"
            style={{ 
              flexDirection: 'column', 
              padding: '1rem',
              background: '#f3f4f6',
              border: '1px solid #d1d5db'
            }}
          >
            <FileText size={20} style={{ marginBottom: '0.5rem', color: '#3b82f6' }} />
            <div style={{ fontWeight: '500' }}>Testar TXT</div>
          </button>
          <button 
            onClick={() => handleTestFile('ofx')}
            className="btn-secondary"
            style={{ 
              flexDirection: 'column', 
              padding: '1rem',
              background: '#f3f4f6',
              border: '1px solid #d1d5db'
            }}
          >
            <Database size={20} style={{ marginBottom: '0.5rem', color: '#10b981' }} />
            <div style={{ fontWeight: '500' }}>Testar OFX</div>
          </button>
        </div>
      </div>
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
        
        {/* Estatísticas */}
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
        <div style={{ overflowX: 'auto' }}>
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
                <th>Data</th>
                <th>Descrição</th>
                <th>Valor</th>
                <th>Tipo</th>
                <th>Categoria</th>
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
                  <tr key={transaction.id} className="transaction-row">
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
                        className="input-date"
                        style={{ fontSize: '0.75rem', padding: '0.25rem' }}
                      />
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <input
                        type="text"
                        value={transaction.descricao}
                        onChange={(e) => updateTransaction(transaction.id, 'descricao', e.target.value)}
                        className="input-text"
                        style={{ fontSize: '0.75rem', padding: '0.25rem' }}
                      />
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
                          value={transaction.valor}
                          onChange={(e) => updateTransaction(transaction.id, 'valor', parseFloat(e.target.value) || 0)}
                          className="input-money"
                          style={{ 
                            width: '80px', 
                            fontSize: '0.75rem', 
                            padding: '0.25rem',
                            background: 'none',
                            fontVariantNumeric: 'tabular-nums'
                          }}
                        />
                      </div>
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
                          placeholder="Digite categoria..."
                          className="input-text"
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
    <div className="modal-overlay active">
      <div className="forms-modal-container modal-importacao">
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
        <div className="modal-body">
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
                  disabled={selectedTransactions.size === 0}
                  className="btn-primary"
                >
                  Importar {selectedTransactions.size} Transações
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

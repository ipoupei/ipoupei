// src/hooks/useImportacao.js
import { useState, useCallback } from 'react';
import { supabase } from '@lib/supabaseClient';
import useAuth from '@/modules/auth/hooks/useAuth'; 

/**
 * Hook personalizado para gerenciar importação de despesas
 * Suporta CSV e Excel (XLSX)
 */
const useImportacao = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dadosImportados, setDadosImportados] = useState([]);
  const [estatisticas, setEstatisticas] = useState({
    total: 0,
    validas: 0,
    invalidas: 0,
    valorTotal: 0
  });

  const { user, isAuthenticated } = useAuth();

  // Função para processar arquivo CSV
  const processarCSV = useCallback(async (arquivo) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const linhas = text.split('\n').map(linha => linha.trim()).filter(linha => linha);
          
          if (linhas.length < 2) {
            reject(new Error('Arquivo deve conter pelo menos cabeçalho e uma linha de dados'));
            return;
          }

          // Primeira linha como cabeçalho
          const cabecalho = linhas[0].split(/[,;]/).map(col => col.trim().replace(/"/g, ''));
          
          // Processar dados
          const dados = [];
          for (let i = 1; i < linhas.length; i++) {
            const valores = linhas[i].split(/[,;]/).map(val => val.trim().replace(/"/g, ''));
            const item = {};
            
            cabecalho.forEach((col, index) => {
              item[col] = valores[index] || '';
            });
            
            if (Object.values(item).some(val => val)) { // Linha não vazia
              dados.push(item);
            }
          }
          
          resolve({ cabecalho, dados });
        } catch (err) {
          reject(new Error('Erro ao processar CSV: ' + err.message));
        }
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsText(arquivo, 'UTF-8');
    });
  }, []);

  // Função para processar arquivo Excel (implementação mais robusta)
  const processarExcel = useCallback(async (arquivo) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          // Por enquanto, rejeitar Excel e sugerir conversão para CSV
          reject(new Error('Formato Excel ainda não implementado. Por favor, salve o arquivo como CSV e tente novamente. Você pode fazer isso no Excel: Arquivo > Salvar Como > CSV (delimitado por vírgulas).'));
          
        } catch (err) {
          reject(new Error('Erro ao processar Excel: ' + err.message));
        }
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsArrayBuffer(arquivo);
    });
  }, []);

  // Mapear colunas para campos esperados
  const mapearColunas = useCallback((cabecalho, dados) => {
    const mapeamento = {
      data: ['data', 'date', 'Data', 'DATE', 'dt', 'DT'],
      descricao: ['descricao', 'description', 'desc', 'Descrição', 'DESCRIÇÃO', 'nome', 'Nome'],
      valor: ['valor', 'value', 'amount', 'Valor', 'VALOR', 'preco', 'Preço'],
      categoria: ['categoria', 'category', 'cat', 'Categoria', 'CATEGORIA'],
      observacoes: ['obs', 'observacoes', 'observações', 'notes', 'Observações', 'OBS']
    };

    const colunasMapeadas = {};
    
    // Tentar mapear automaticamente
    Object.keys(mapeamento).forEach(campo => {
      const colunaEncontrada = cabecalho.find(col => 
        mapeamento[campo].some(variacao => 
          col.toLowerCase().includes(variacao.toLowerCase())
        )
      );
      if (colunaEncontrada) {
        colunasMapeadas[campo] = colunaEncontrada;
      }
    });

    return colunasMapeadas;
  }, []);

  // Validar e normalizar dados
  const validarDados = useCallback((dados, mapeamento) => {
    const resultados = [];
    let validas = 0;
    let invalidas = 0;
    let valorTotal = 0;

    dados.forEach((item, index) => {
      const dadosNormalizados = {
        id: `temp_${index}`,
        linha: index + 2, // +2 porque começa do 1 e pula cabeçalho
        data: '',
        descricao: '',
        valor: 0,
        categoria: '',
        subcategoria: '',
        observacoes: '',
        conta_id: '',
        categoria_id: '',
        subcategoria_id: '',
        efetivado: true,
        tipo: 'despesa',
        erros: [],
        ignorar: false,
        original: item
      };

      // Mapear dados
      if (mapeamento.data) {
        const dataTexto = item[mapeamento.data];
        if (dataTexto) {
          // Tentar diferentes formatos de data
          const dataFormatos = [
            /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
            /(\d{2})\/(\d{2})\/(\d{4})/, // DD/MM/YYYY
            /(\d{2})-(\d{2})-(\d{4})/, // DD-MM-YYYY
          ];
          
          let dataConvertida = null;
          for (const formato of dataFormatos) {
            const match = dataTexto.match(formato);
            if (match) {
              if (formato === dataFormatos[0]) { // YYYY-MM-DD
                dataConvertida = dataTexto;
              } else { // DD/MM/YYYY ou DD-MM-YYYY
                dataConvertida = `${match[3]}-${match[2]}-${match[1]}`;
              }
              break;
            }
          }
          
          if (dataConvertida && !isNaN(Date.parse(dataConvertida))) {
            dadosNormalizados.data = dataConvertida;
          } else {
            dadosNormalizados.erros.push('Data inválida');
          }
        } else {
          dadosNormalizados.erros.push('Data não informada');
        }
      }

      if (mapeamento.descricao) {
        const descricao = item[mapeamento.descricao]?.trim();
        if (descricao) {
          dadosNormalizados.descricao = descricao;
        } else {
          dadosNormalizados.erros.push('Descrição não informada');
        }
      }

      if (mapeamento.valor) {
        const valorTexto = item[mapeamento.valor];
        if (valorTexto) {
          // Limpar e converter valor
          const valorLimpo = valorTexto
            .replace(/[^\d,.-]/g, '') // Remove tudo exceto números, vírgula, ponto e hífen
            .replace(',', '.'); // Converte vírgula em ponto
          
          const valor = parseFloat(valorLimpo);
          if (!isNaN(valor) && valor > 0) {
            dadosNormalizados.valor = Math.abs(valor); // Garantir que seja positivo
            valorTotal += dadosNormalizados.valor;
          } else {
            dadosNormalizados.erros.push('Valor inválido');
          }
        } else {
          dadosNormalizados.erros.push('Valor não informado');
        }
      }

      if (mapeamento.categoria) {
        dadosNormalizados.categoria = item[mapeamento.categoria]?.trim() || '';
      }

      if (mapeamento.observacoes) {
        dadosNormalizados.observacoes = item[mapeamento.observacoes]?.trim() || '';
      }

      // Verificar se é válida
      if (dadosNormalizados.erros.length === 0) {
        validas++;
      } else {
        invalidas++;
      }

      resultados.push(dadosNormalizados);
    });

    setEstatisticas({
      total: resultados.length,
      validas,
      invalidas,
      valorTotal
    });

    return resultados;
  }, []);

  // Função principal de importação
  const importarArquivo = useCallback(async (arquivo) => {
    if (!isAuthenticated || !user) {
      throw new Error('Usuário não autenticado');
    }

    setLoading(true);
    setError(null);
    setDadosImportados([]);

    try {
      let dadosProcessados;
      
      if (arquivo.type === 'text/csv' || arquivo.name.endsWith('.csv')) {
        dadosProcessados = await processarCSV(arquivo);
      } else if (arquivo.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || arquivo.name.endsWith('.xlsx')) {
        dadosProcessados = await processarExcel(arquivo);
      } else {
        throw new Error('Formato de arquivo não suportado. Use CSV ou XLSX.');
      }

      const { cabecalho, dados } = dadosProcessados;
      
      if (dados.length === 0) {
        throw new Error('Nenhum dado encontrado no arquivo');
      }

      // Mapear colunas automaticamente
      const mapeamento = mapearColunas(cabecalho, dados);
      
      // Validar e normalizar
      const dadosValidados = validarDados(dados, mapeamento);
      
      setDadosImportados(dadosValidados);
      
      return {
        success: true,
        dados: dadosValidados,
        cabecalho,
        mapeamento,
        estatisticas: {
          total: dadosValidados.length,
          validas: dadosValidados.filter(d => d.erros.length === 0).length,
          invalidas: dadosValidados.filter(d => d.erros.length > 0).length,
          valorTotal: dadosValidados.reduce((sum, d) => sum + d.valor, 0)
        }
      };

    } catch (err) {
      console.error('❌ Erro na importação:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, processarCSV, processarExcel, mapearColunas, validarDados]);

  // Atualizar item importado
  const atualizarItem = useCallback((id, dadosAtualizados) => {
    setDadosImportados(prev => prev.map(item => 
      item.id === id ? { ...item, ...dadosAtualizados } : item
    ));
  }, []);

  // Marcar item para ignorar
  const ignorarItem = useCallback((id, ignorar = true) => {
    setDadosImportados(prev => prev.map(item => 
      item.id === id ? { ...item, ignorar } : item
    ));
  }, []);

  // Definir conta para todos os itens
  const definirContaGlobal = useCallback((contaId) => {
    setDadosImportados(prev => prev.map(item => ({
      ...item,
      conta_id: contaId
    })));
  }, []);

  // Salvar despesas no banco
  const salvarDespesas = useCallback(async () => {
    if (!isAuthenticated || !user) {
      throw new Error('Usuário não autenticado');
    }

    setLoading(true);
    setError(null);

    try {
      // Filtrar apenas itens válidos e não ignorados
      const itensParaSalvar = dadosImportados.filter(item => 
        !item.ignorar && 
        item.erros.length === 0 && 
        item.conta_id &&
        item.categoria_id
      );

      if (itensParaSalvar.length === 0) {
        throw new Error('Nenhuma despesa válida para salvar');
      }

      // Preparar dados para inserção
      const despesasParaInserir = itensParaSalvar.map(item => ({
        usuario_id: user.id,
        data: item.data,
        descricao: item.descricao,
        categoria_id: item.categoria_id,
        subcategoria_id: item.subcategoria_id || null,
        conta_id: item.conta_id,
        valor: item.valor,
        tipo: 'despesa',
        efetivado: item.efetivado,
        observacoes: item.observacoes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      // Inserir no banco
      const { data, error } = await supabase
        .from('transacoes')
        .insert(despesasParaInserir)
        .select();

      if (error) throw error;

      return {
        success: true,
        despesasSalvas: data?.length || 0,
        dados: data
      };

    } catch (err) {
      console.error('❌ Erro ao salvar despesas:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, dadosImportados]);

  // Limpar dados
  const limparDados = useCallback(() => {
    setDadosImportados([]);
    setEstatisticas({
      total: 0,
      validas: 0,
      invalidas: 0,
      valorTotal: 0
    });
    setError(null);
  }, []);

  return {
    loading,
    error,
    dadosImportados,
    estatisticas,
    importarArquivo,
    atualizarItem,
    ignorarItem,
    definirContaGlobal,
    salvarDespesas,
    limparDados,
    // Dados derivados
    itensValidos: dadosImportados.filter(item => !item.ignorar && item.erros.length === 0),
    itensInvalidos: dadosImportados.filter(item => item.erros.length > 0),
    itensIgnorados: dadosImportados.filter(item => item.ignorar),
    valorTotalValido: dadosImportados
      .filter(item => !item.ignorar && item.erros.length === 0)
      .reduce((sum, item) => sum + item.valor, 0)
  };
};

export default useImportacao;
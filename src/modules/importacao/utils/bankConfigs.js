// src/modules/importacao/utils/bankConfigs.js

/**
 * Configurações para detecção e parsing de arquivos bancários
 * Cada banco tem suas particularidades de formato
 */
export const BANK_CONFIGS = {
  nubank: {
    name: 'Nubank',
    detection: {
      keywords: ['nubank', 'nu pagamentos'],
      separator: ',',
      patterns: [
        'nubank.*csv',
        'extrato.*nubank'
      ]
    },
    parsing: {
      separator: ',',
      dateFormat: 'DD/MM/YYYY',
      encoding: 'UTF-8',
      hasHeader: true,
      columns: {
        date: 0,
        description: 1,
        value: 2,
        type: null // Inferido pelo valor
      },
      dateProcessor: (dateStr) => {
        // Nubank usa formato DD/MM/YYYY
        const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
        if (match) {
          const [, day, month, year] = match;
          return `${year}-${month}-${day}`;
        }
        return null;
      },
      valueProcessor: (valueStr) => {
        // Nubank usa formato brasileiro: R$ 1.234,56
        return parseFloat(
          valueStr
            .replace(/[R$\s]/g, '')
            .replace(/\./g, '')
            .replace(',', '.')
        );
      }
    }
  },

  itau: {
    name: 'Banco Itaú',
    detection: {
      keywords: ['itau', 'itaú', 'banco itau'],
      separator: ';',
      patterns: [
        '\\d{2}/\\d{2}/\\d{4};.*?;-?\\d+,\\d{2}$',
        'extrato.*itau',
        'itau.*txt'
      ]
    },
    parsing: {
      separator: ';',
      dateFormat: 'DD/MM/YYYY',
      encoding: 'UTF-8',
      hasHeader: false, // Arquivo do Itaú não tem header
      columns: {
        date: 0,      // Primeira coluna: data
        description: 1, // Segunda coluna: descrição
        value: 2,     // Terceira coluna: valor
        type: null    // Não há coluna de tipo, será inferido pelo valor
      },
      dateProcessor: (dateStr) => {
        console.log('🔧 Itaú dateProcessor:', dateStr);
        const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
        if (match) {
          const [, day, month, year] = match;
          const result = `${year}-${month}-${day}`;
          console.log('✅ Data convertida:', result);
          return result;
        }
        console.warn('⚠️ Data não convertida:', dateStr);
        return null;
      },
      valueProcessor: (valueStr) => {
        console.log('🔧 Itaú valueProcessor:', valueStr);
        // Itaú usa formato: -20,00 ou 1234,56
        let cleanValue = valueStr.replace(/[^\d,.-]/g, '');
        
        // Se tem vírgula, é decimal brasileiro
        if (cleanValue.includes(',')) {
          cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
        }
        
        const result = parseFloat(cleanValue) || 0;
        console.log('✅ Valor convertido:', result);
        return result;
      }
    }
  },

  bradesco: {
    name: 'Banco Bradesco',
    detection: {
      keywords: ['bradesco', 'bco bradesco'],
      separator: ';',
      patterns: [
        'extrato.*bradesco',
        'bradesco.*txt'
      ]
    },
    parsing: {
      separator: ';',
      dateFormat: 'DD/MM/YYYY',
      encoding: 'UTF-8',
      hasHeader: true,
      columns: {
        date: 0,
        description: 2,
        value: 4,
        type: 3
      }
    }
  },

  santander: {
    name: 'Banco Santander',
    detection: {
      keywords: ['santander', 'bco santander'],
      separator: ';',
      patterns: [
        'extrato.*santander',
        'santander.*txt'
      ]
    },
    parsing: {
      separator: ';',
      dateFormat: 'DD/MM/YYYY',
      encoding: 'UTF-8',
      hasHeader: true,
      columns: {
        date: 0,
        description: 1,
        value: 3,
        type: 2
      }
    }
  },

  inter: {
    name: 'Banco Inter',
    detection: {
      keywords: ['inter', 'banco inter'],
      separator: ',',
      patterns: [
        'extrato.*inter',
        'inter.*csv'
      ]
    },
    parsing: {
      separator: ',',
      dateFormat: 'DD/MM/YYYY',
      encoding: 'UTF-8',
      hasHeader: true,
      columns: {
        date: 0,
        description: 1,
        value: 2,
        type: null
      }
    }
  },

  c6: {
    name: 'C6 Bank',
    detection: {
      keywords: ['c6 bank', 'c6bank', 'banco c6'],
      separator: ',',
      patterns: [
        'extrato.*c6',
        'c6.*csv'
      ]
    },
    parsing: {
      separator: ',',
      dateFormat: 'DD/MM/YYYY',
      encoding: 'UTF-8',
      hasHeader: true,
      columns: {
        date: 0,
        description: 1,
        value: 2,
        type: null
      }
    }
  },

  generic: {
    name: 'Parser Genérico',
    detection: {
      keywords: [],
      separator: null,
      patterns: []
    },
    parsing: {
      separator: ',', // Será detectado automaticamente
      dateFormat: 'DD/MM/YYYY',
      encoding: 'UTF-8',
      hasHeader: true,
      columns: {
        date: 0,
        description: 1,
        value: 2,
        type: null
      },
      dateProcessor: (dateStr) => {
        // Tentar vários formatos
        const formats = [
          /(\d{2})\/(\d{2})\/(\d{4})/, // DD/MM/YYYY
          /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
          /(\d{2})\.(\d{2})\.(\d{4})/ // DD.MM.YYYY
        ];

        for (const format of formats) {
          const match = dateStr.match(format);
          if (match) {
            if (format.source.startsWith('(\\d{4})')) {
              // YYYY-MM-DD
              const [, year, month, day] = match;
              return `${year}-${month}-${day}`;
            } else {
              // DD/MM/YYYY ou DD.MM.YYYY
              const [, day, month, year] = match;
              return `${year}-${month}-${day}`;
            }
          }
        }
        return null;
      },
      valueProcessor: (valueStr) => {
        // Remover símbolos e normalizar
        let cleaned = valueStr
          .replace(/[R$\s]/g, '')
          .replace(/[()]/g, '-'); // Parênteses = negativo

        // Se tem vírgula e ponto, vírgula é decimal
        if (cleaned.includes(',') && cleaned.includes('.')) {
          const lastComma = cleaned.lastIndexOf(',');
          const lastDot = cleaned.lastIndexOf('.');
          
          if (lastComma > lastDot) {
            // Vírgula é decimal
            cleaned = cleaned.replace(/\./g, '').replace(',', '.');
          } else {
            // Ponto é decimal
            cleaned = cleaned.replace(/,/g, '');
          }
        } else if (cleaned.includes(',')) {
          // Só vírgula - pode ser decimal ou milhares
          const parts = cleaned.split(',');
          if (parts.length === 2 && parts[1].length <= 2) {
            // Decimal
            cleaned = cleaned.replace(',', '.');
          } else {
            // Milhares
            cleaned = cleaned.replace(/,/g, '');
          }
        }

        return parseFloat(cleaned) || 0;
      }
    }
  }
};
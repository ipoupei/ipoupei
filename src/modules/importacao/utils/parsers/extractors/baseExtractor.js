// src/modules/importacao/utils/parsers/extractors/baseExtractor.js
// Interface base para todos os extractors de arquivo

/**
 * Classe abstrata que define a interface comum para todos os extractors
 * Cada tipo de arquivo (PDF, CSV, Excel) terá seu próprio extractor
 * que herda desta classe base.
 */
export class BaseExtractor {
  /**
   * Verifica se o extractor pode processar este tipo de arquivo
   * @param {File} file - Arquivo para verificar
   * @returns {boolean} True se pode processar
   */
  static canHandle(file) {
    throw new Error('canHandle() deve ser implementado pela classe filha');
  }
  
  /**
   * Extrai dados brutos do arquivo
   * @param {File} file - Arquivo para processar
   * @returns {Promise<RawData>} Dados brutos extraídos
   */
  static async extract(file) {
    throw new Error('extract() deve ser implementado pela classe filha');
  }
  
  /**
   * Valida se os dados extraídos estão em formato válido
   * @param {RawData} rawData - Dados para validar
   * @returns {ValidationResult} Resultado da validação
   */
  static validate(rawData) {
    return {
      isValid: true,
      errors: [],
      warnings: []
    };
  }
  
  /**
   * Obtém metadados do arquivo processado
   * @param {File} file - Arquivo original
   * @param {RawData} rawData - Dados extraídos
   * @returns {FileMetadata} Metadados do arquivo
   */
  static getMetadata(file, rawData) {
    return {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      lastModified: new Date(file.lastModified),
      extractedAt: new Date(),
      rowCount: this._countRows(rawData),
      encoding: 'UTF-8'
    };
  }
  
  /**
   * Conta número de linhas nos dados brutos
   * @param {RawData} rawData 
   * @returns {number} Número de linhas
   */
  static _countRows(rawData) {
    if (typeof rawData === 'string') {
      return rawData.split('\n').filter(line => line.trim()).length;
    }
    if (Array.isArray(rawData)) {
      return rawData.length;
    }
    return 0;
  }
  
  /**
   * Limpa e normaliza dados brutos básicos
   * @param {string} text - Texto para limpar
   * @returns {string} Texto limpo
   */
  static _cleanText(text) {
    if (!text) return '';
    
    return text
      .replace(/\r\n/g, '\n')  // Normalizar quebras de linha
      .replace(/\r/g, '\n')    // Normalizar quebras de linha
      .replace(/\0/g, '')      // Remover caracteres nulos
      .trim();
  }
  
  /**
   * Detecta encoding do arquivo (UTF-8, ISO-8859-1, etc)
   * @param {ArrayBuffer} buffer - Buffer do arquivo
   * @returns {string} Encoding detectado
   */
  static _detectEncoding(buffer) {
    // Implementação básica - detecta BOM UTF-8
    const uint8Array = new Uint8Array(buffer);
    
    // BOM UTF-8: EF BB BF
    if (uint8Array.length >= 3 && 
        uint8Array[0] === 0xEF && 
        uint8Array[1] === 0xBB && 
        uint8Array[2] === 0xBF) {
      return 'UTF-8';
    }
    
    // BOM UTF-16 LE: FF FE
    if (uint8Array.length >= 2 && 
        uint8Array[0] === 0xFF && 
        uint8Array[1] === 0xFE) {
      return 'UTF-16LE';
    }
    
    // BOM UTF-16 BE: FE FF
    if (uint8Array.length >= 2 && 
        uint8Array[0] === 0xFE && 
        uint8Array[1] === 0xFF) {
      return 'UTF-16BE';
    }
    
    // Default UTF-8
    return 'UTF-8';
  }
  
  /**
   * Converte ArrayBuffer para texto com encoding específico
   * @param {ArrayBuffer} buffer - Buffer para converter
   * @param {string} encoding - Encoding a usar
   * @returns {string} Texto convertido
   */
  static _bufferToText(buffer, encoding = 'UTF-8') {
    try {
      const decoder = new TextDecoder(encoding);
      return decoder.decode(buffer);
    } catch (error) {
      console.warn(`Erro ao decodificar com ${encoding}, usando UTF-8:`, error);
      const decoder = new TextDecoder('UTF-8');
      return decoder.decode(buffer);
    }
  }
  
  /**
   * Gera preview dos dados para debug
   * @param {RawData} rawData - Dados para preview
   * @param {number} maxLength - Tamanho máximo do preview
   * @returns {string} Preview dos dados
   */
  static generatePreview(rawData, maxLength = 500) {
    if (typeof rawData === 'string') {
      return rawData.length > maxLength 
        ? rawData.substring(0, maxLength) + '...'
        : rawData;
    }
    
    if (Array.isArray(rawData)) {
      const preview = rawData.slice(0, 10).join('\n');
      return preview.length > maxLength 
        ? preview.substring(0, maxLength) + '...'
        : preview;
    }
    
    return JSON.stringify(rawData, null, 2).substring(0, maxLength);
  }
}

/**
 * Factory para criar extractors baseado no tipo de arquivo
 */
export class ExtractorFactory {
  static extractors = new Map();
  
  /**
   * Registra um extractor
   * @param {string} name - Nome do extractor
   * @param {BaseExtractor} extractorClass - Classe do extractor
   */
  static register(name, extractorClass) {
    this.extractors.set(name, extractorClass);
  }
  
  /**
   * Obtém o extractor apropriado para o arquivo
   * @param {File} file - Arquivo para processar
   * @returns {BaseExtractor|null} Extractor apropriado ou null
   */
  static getExtractor(file) {
    for (const [name, extractorClass] of this.extractors) {
      if (extractorClass.canHandle(file)) {
        return extractorClass;
      }
    }
    return null;
  }
  
  /**
   * Lista todos os extractors registrados
   * @returns {Array<string>} Nomes dos extractors
   */
  static listExtractors() {
    return Array.from(this.extractors.keys());
  }
}

// Tipos para documentação (não executados em JS)
/**
 * @typedef {string|Array|Object} RawData
 * Dados brutos extraídos do arquivo - pode ser texto, array de linhas, ou objeto estruturado
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Se os dados são válidos
 * @property {Array<string>} errors - Lista de erros críticos
 * @property {Array<string>} warnings - Lista de avisos não críticos
 */

/**
 * @typedef {Object} FileMetadata
 * @property {string} fileName - Nome do arquivo
 * @property {number} fileSize - Tamanho em bytes
 * @property {string} fileType - MIME type
 * @property {Date} lastModified - Data de modificação
 * @property {Date} extractedAt - Data de extração
 * @property {number} rowCount - Número de linhas/registros
 * @property {string} encoding - Encoding detectado
 */

export default BaseExtractor;
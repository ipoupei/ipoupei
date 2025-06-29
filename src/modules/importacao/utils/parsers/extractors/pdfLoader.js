// src/modules/importacao/utils/pdfLoader.js
// Utilitário para carregar e configurar PDF.js dinamicamente

/**
 * Carrega PDF.js dinamicamente se não estiver disponível
 * @returns {Promise<boolean>} true se carregado com sucesso
 */
export async function loadPDFJS() {
  // Verificar se já está carregado
  if (typeof window !== 'undefined' && window.pdfjsLib) {
    console.log('✅ PDF.js já está carregado');
    configurePDFJS();
    return true;
  }
  
  try {
    console.log('📦 Carregando PDF.js...');
    
    // Carregar script principal
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
    
    // Verificar se carregou
    if (!window.pdfjsLib) {
      throw new Error('PDF.js não foi carregado corretamente');
    }
    
    // Configurar
    configurePDFJS();
    
    console.log('✅ PDF.js carregado e configurado com sucesso');
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao carregar PDF.js:', error);
    throw new Error(`Falha ao carregar PDF.js: ${error.message}`);
  }
}

/**
 * Configura PDF.js com as opções ideais
 */
function configurePDFJS() {
  if (typeof window !== 'undefined' && window.pdfjsLib) {
    // Configurar worker
    if (!window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
    
    console.log('⚙️ PDF.js configurado:', {
      version: window.pdfjsLib.version || 'unknown',
      workerSrc: window.pdfjsLib.GlobalWorkerOptions.workerSrc
    });
  }
}

/**
 * Carrega script dinamicamente
 * @param {string} src - URL do script
 * @returns {Promise<void>}
 */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    // Verificar se já existe
    const existingScript = document.querySelector(`script[src="${src}"]`);
    if (existingScript) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    
    script.onload = () => {
      console.log('✅ Script carregado:', src);
      resolve();
    };
    
    script.onerror = () => {
      console.error('❌ Erro ao carregar script:', src);
      reject(new Error(`Falha ao carregar ${src}`));
    };
    
    document.head.appendChild(script);
  });
}

/**
 * Verifica se PDF.js está disponível e configurado
 * @returns {boolean}
 */
export function isPDFJSReady() {
  return typeof window !== 'undefined' && 
         window.pdfjsLib && 
         window.pdfjsLib.GlobalWorkerOptions.workerSrc;
}

/**
 * Obtém informações sobre o PDF.js carregado
 * @returns {Object}
 */
export function getPDFJSInfo() {
  if (!isPDFJSReady()) {
    return { available: false };
  }
  
  return {
    available: true,
    version: window.pdfjsLib.version || 'unknown',
    workerSrc: window.pdfjsLib.GlobalWorkerOptions.workerSrc,
    build: window.pdfjsLib.build || 'unknown'
  };
}

export default { loadPDFJS, isPDFJSReady, getPDFJSInfo };
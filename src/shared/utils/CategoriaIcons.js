/**
 * Biblioteca Unificada de Ícones para Categorias iPoupei
 * 🎯 Combina o melhor das duas bibliotecas existentes
 * 📱 Base única para Mobile e Web
 * 🎨 ~600+ ícones organizados por categoria
 * ✅ Compatível com sistema atual do modal
 */

/**
 * Ícones simples profissionais - Material Design style
 * Ideal para destacar cores de categoria e visual clean
 */
const iconesMaterial = {
  'financas': [
    'attach_money', 'euro_symbol', 'credit_card', 'account_balance_wallet',
    'account_balance', 'savings', 'monetization_on', 'payment',
    'trending_up', 'trending_down', 'show_chart', 'analytics',
    'assessment', 'bar_chart', 'timeline', 'business_center',
    'work_outline', 'corporate_fare', 'apartment', 'star_outline',
    'diamond', 'emoji_events', 'military_tech'
  ],
  
  'alimentacao': [
    'restaurant', 'fastfood', 'dinner_dining', 'lunch_dining',
    'breakfast_dining', 'local_dining', 'room_service', 'takeout_dining',
    'local_cafe', 'local_bar', 'wine_bar', 'coffee',
    'emoji_food_beverage', 'local_drink', 'liquor', 'sports_bar',
    'local_grocery_store', 'shopping_cart', 'store', 'storefront',
    'kitchen', 'microwave', 'blender', 'countertops'
  ],
  
  'transporte': [
    'directions_car', 'car_rental', 'local_taxi', 'car_repair',
    'garage', 'local_gas_station', 'local_parking', 'traffic',
    'directions_bus', 'directions_subway', 'train', 'tram',
    'directions_railway', 'subway', 'bus_alert', 'commute',
    'directions_bike', 'motorcycle', 'electric_scooter', 'skateboarding',
    'flight', 'local_airport', 'directions_boat', 'sailing'
  ],
  
  'moradia': [
    'home', 'house', 'apartment', 'villa', 'cottage', 'cabin',
    'bungalow', 'chalet', 'bed', 'chair', 'table_restaurant',
    'weekend', 'living', 'kitchen', 'bathroom', 'balcony',
    'electrical_services', 'plumbing', 'carpenter', 'handyman',
    'build', 'construction', 'engineering', 'architecture',
    'lock', 'security', 'vpn_key', 'key'
  ],
  
  'saude': [
    'local_hospital', 'medical_services', 'medication', 'vaccines',
    'healing', 'monitor_heart', 'emergency', 'psychology',
    'biotech', 'science', 'medical_information', 'health_and_safety',
    'masks', 'sanitizer', 'thermostat', 'fitness_center',
    'sports_gymnastics', 'directions_run', 'directions_walk', 'self_improvement',
    'spa', 'hot_tub', 'pool'
  ],
  
  'educacao': [
    'school', 'auto_stories', 'menu_book', 'library_books',
    'book', 'bookmark_outline', 'class', 'groups',
    'edit', 'create', 'draw', 'format_paint',
    'highlight', 'text_fields', 'title', 'article',
    'computer', 'laptop', 'tablet', 'phone_android',
    'cast_for_education', 'screen_share', 'slideshow'
  ],
  
  'trabalho': [
    'work_outline', 'business_center', 'corporate_fare', 'apartment',
    'domain', 'meeting_room', 'co_present', 'computer',
    'laptop', 'desktop_windows', 'keyboard', 'mouse',
    'phone', 'headset', 'print', 'description',
    'article', 'assignment', 'folder', 'folder_open',
    'insert_drive_file', 'picture_as_pdf', 'text_snippet', 'email',
    'message', 'chat', 'video_call', 'call', 'contacts'
  ],
  
  'outros': [
    'folder', 'folder_open', 'create_new_folder', 'topic',
    'label', 'bookmark_outline', 'push_pin', 'flag',
    'star_outline', 'grade', 'emoji_events', 'diamond',
    'auto_awesome', 'bolt', 'flash_on', 'wb_sunny',
    'arrow_upward', 'arrow_downward', 'arrow_forward', 'arrow_back',
    'refresh', 'sync', 'swap_horiz', 'compare_arrows'
  ]
};

/**
 * Ícones emoji coloridos e expressivos
 * Sistema principal usado no modal atual
 */
const iconesEmoji = {
  // FINANÇAS - Símbolos financeiros e investimentos
  'financas': [
    '💰', '💵', '💴', '💶', '💷', '💳', '💎', '🪙',
    '📊', '📈', '📉', '💹', '🏦', '💸', '🎯', '⭐',
    '✨', '🌟', '💥', '🚀', '⚡', '🔥', '💫', '🏆'
  ],

  // ALIMENTAÇÃO - Comidas, bebidas e refeições
  'alimentacao': [
    '🍽️', '🍕', '🍔', '🍟', '🌮', '🍱', '🥗', '🍜',
    '🍖', '🍇', '🥘', '🍲', '🥙', '🌯', '🥪', '🍞',
    '🥖', '🥨', '🧀', '🥓', '🍳', '🥞', '🧇', '🍯',
    '🥛', '☕', '🍵', '🧃', '🥤', '🍷', '🍺', '🥂',
    '🍎', '🍌', '🍊', '🍓', '🥝', '🍑', '🍒', '🥭'
  ],

  // TRANSPORTE - Veículos e locomoção
  'transporte': [
    '🚗', '🚕', '🚙', '🚌', '🚎', '🏍️', '🚲', '🛵',
    '✈️', '🚢', '🚁', '🚃', '🚄', '🚅', '🚆', '🚇',
    '🚈', '🚉', '🚊', '🚝', '🚞', '🚋', '🚘', '🚖',
    '🚛', '🚚', '🚐', '🛻', '🏎️', '🚓', '🚑', '🚒',
    '⛽', '🅿️', '🚧', '🛣️', '🗺️', '🧭', '🛴', '🛹'
  ],

  // MORADIA - Casa, móveis e utensílios domésticos
  'moradia': [
    '🏠', '🏡', '🏢', '🏨', '🏩', '🏪', '🏬', '🏭',
    '🛏️', '🛋️', '🪑', '🚿', '🛁', '🚽', '🪞', '🚪',
    '🪟', '🔑', '🗝️', '🔒', '💡', '⚡', '🔌', '💧',
    '🔥', '📡', '📶', '🌐', '⚙️', '🔧', '🔨', '🪛',
    '🧹', '🧽', '🧴', '🧻', '🗑️', '♻️', '🪴', '🌿'
  ],

  // SAÚDE - Medicina e bem-estar
  'saude': [
    '🏥', '⚕️', '🩺', '💊', '💉', '🌡️', '🧬', '🧪',
    '🔬', '🦷', '🦴', '🧠', '💪', '🧘', '💚', '👨‍⚕️',
    '👩‍⚕️', '🚑', '🩹', '🧻', '🪥', '🧴', '💆', '🤸',
    '🏃', '🚶', '🧘‍♀️', '🧘‍♂️', '💤', '🛌', '🍎', '🥗'
  ],

  // EDUCAÇÃO - Estudos e aprendizado
  'educacao': [
    '📚', '📖', '📝', '✏️', '✒️', '🖋️', '🖊️', '🖍️',
    '📄', '📃', '📑', '📊', '📈', '📋', '📌', '📍',
    '📎', '✂️', '🎓', '🎒', '🏫', '💻', '⌨️', '🖱️',
    '📱', '📺', '🖥️', '💾', '📀', '🔍', '🔎', '📐',
    '📏', '🧮', '🔬', '🧬', '🌍', '🌎', '🌏', '🗺️'
  ],

  // TRABALHO - Atividades profissionais
  'trabalho': [
    '💼', '👔', '💻', '⌨️', '🖥️', '📊', '📈', '📉',
    '💰', '🏢', '📋', '📝', '☎️', '📞', '💳', '⚙️',
    '🔧', '📧', '💌', '📠', '🖨️', '📺', '📻', '⏰',
    '🕐', '📅', '📆', '🗓️', '📇', '🗂️', '📁', '📂',
    '🗄️', '📎', '📌', '✂️', '📏', '📐', '🔍', '💡'
  ],

  // LAZER - Entretenimento e diversão
  'lazer': [
    '🎉', '🎮', '🕹️', '🎲', '🎯', '🎪', '🎨', '🎭',
    '🎬', '🎤', '🎧', '🎵', '🎶', '🎼', '🎹', '🥁',
    '🎷', '🎺', '🎸', '🎻', '🍿', '🎫', '🎟️', '🎊',
    '🎈', '🎁', '🎀', '🔮', '🪄', '🎪', '🎡', '🎢',
    '🎠', '🎳', '🏓', '🎱', '🃏', '🧩', '🪀', '🪁'
  ],

  // ESPORTES - Atividades físicas
  'esportes': [
    '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉',
    '🥏', '🎱', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏',
    '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️', '🥌', '🎿',
    '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '⭐', '🌟',
    '💪', '🏃‍♂️', '🏃‍♀️', '🚴‍♂️', '🚴‍♀️', '🏊‍♂️', '🏊‍♀️', '🧗‍♂️'
  ],

  // FAMÍLIA - Relacionamentos e cuidados
  'familia': [
    '👨‍👩‍👧‍👦', '👪', '👫', '👬', '👭', '💑', '💏', '👶',
    '👧', '🧒', '👦', '👩', '🧑', '👨', '🧓', '👴',
    '👵', '💐', '🎂', '💝', '💕', '💖', '💗', '💘',
    '💙', '💚', '💛', '🧡', '💜', '🖤', '🤍', '🤎',
    '❤️', '🩷', '💔', '❣️', '💟', '♥️', '💯', '💫'
  ],

  // PETS - Animais de estimação
  'pets': [
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
    '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐾',
    '🦴', '🥎', '🏠', '💖', '🐕', '🐈', '🐇', '🐀',
    '🐁', '🐿️', '🦔', '🐉', '🐲', '🦄', '🐝', '🐛',
    '🦋', '🐌', '🐞', '🐜', '🦗', '🕷️', '🕸️', '🦂'
  ],

  // VIAGEM - Turismo e aventuras
  'viagem': [
    '✈️', '🛫', '🛬', '🪂', '💺', '🚁', '🚟', '🚠',
    '🚡', '🛶', '⛵', '🚤', '🛥️', '🛳️', '⛴️', '🚢',
    '🏖️', '🏝️', '🌴', '🗻', '🏔️', '⛰️', '🏕️', '⛺',
    '🧳', '🎒', '👕', '👖', '👗', '👞', '🧢', '👒',
    '🕶️', '📷', '📸', '🎥', '📹', '📱', '🗺️', '🧭'
  ],

  // COMPRAS - Produtos e serviços
  'compras': [
    '🛍️', '🛒', '🏪', '🏬', '💳', '💰', '💵', '🏧',
    '👕', '👖', '👗', '👞', '👠', '🧴', '🧷', '🧹',
    '🧺', '🧻', '🧼', '💄', '💋', '👄', '👁️', '👃',
    '👂', '🦷', '🦴', '🧠', '🫀', '🫁', '🦵', '🦶',
    '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏'
  ],

  // OUTROS - Diversos e genéricos
  'outros': [
    '📁', '💼', '📋', '⭐', '🎯', '💡', '🔥', '💎',
    '🚀', '⚡', '🌟', '💫', '🎪', '🎨', '🎭', '📱',
    '⚙️', '🔧', '🏷️', '📌', '📍', '🗺️', '🧭', '⏰',
    '⏱️', '⏲️', '🕰️', '⌚', '📅', '📆', '🗓️', '📇',
    '🗃️', '🗄️', '📂', '📁', '🗂️', '📋', '📊', '📈'
  ]
};

/**
 * Mapeamento de sinônimos e variações para categorias principais
 */
const sinonimos = {
  // Finanças
  'finanças': 'financas',
  'dinheiro': 'financas',
  'banco': 'financas',
  'investimento': 'financas',
  'poupança': 'financas',
  'poupanca': 'financas',
  'cartão': 'financas',
  'cartao': 'financas',
  'empréstimo': 'financas',
  'emprestimo': 'financas',
  'salário': 'financas',
  'salario': 'financas',

  // Alimentação
  'alimentação': 'alimentacao',
  'comida': 'alimentacao',
  'restaurante': 'alimentacao',
  'supermercado': 'alimentacao',
  'mercado': 'alimentacao',
  'lanche': 'alimentacao',
  'fast food': 'alimentacao',
  'delivery': 'alimentacao',
  'feira': 'alimentacao',
  'açougue': 'alimentacao',

  // Transporte
  'carro': 'transporte',
  'combustível': 'transporte',
  'combustivel': 'transporte',
  'gasolina': 'transporte',
  'uber': 'transporte',
  'taxi': 'transporte',
  'ônibus': 'transporte',
  'onibus': 'transporte',
  'metrô': 'transporte',
  'metro': 'transporte',
  'trem': 'transporte',
  'avião': 'transporte',
  'aviao': 'transporte',

  // Moradia
  'casa': 'moradia',
  'aluguel': 'moradia',
  'condomínio': 'moradia',
  'condominio': 'moradia',
  'energia': 'moradia',
  'luz': 'moradia',
  'água': 'moradia',
  'agua': 'moradia',
  'gás': 'moradia',
  'gas': 'moradia',
  'internet': 'moradia',

  // Saúde
  'saúde': 'saude',
  'médico': 'saude',
  'medico': 'saude',
  'hospital': 'saude',
  'farmácia': 'saude',
  'farmacia': 'saude',
  'medicamento': 'saude',
  'dentista': 'saude',
  'consulta': 'saude',

  // Educação
  'educação': 'educacao',
  'escola': 'educacao',
  'curso': 'educacao',
  'livro': 'educacao',
  'faculdade': 'educacao',
  'universidade': 'educacao',
  'material escolar': 'educacao',

  // Trabalho
  'escritório': 'trabalho',
  'escritorio': 'trabalho',
  'office': 'trabalho',
  'reunião': 'trabalho',
  'reuniao': 'trabalho',
  'projeto': 'trabalho',

  // Lazer
  'cinema': 'lazer',
  'filme': 'lazer',
  'jogo': 'lazer',
  'diversão': 'lazer',
  'diversao': 'lazer',
  'festa': 'lazer',
  'música': 'lazer',
  'musica': 'lazer',

  // Pets
  'pet': 'pets',
  'cachorro': 'pets',
  'gato': 'pets',
  'veterinário': 'pets',
  'veterinario': 'pets',
  'vet': 'pets',

  // Esportes
  'esporte': 'esportes',
  'futebol': 'esportes',
  'academia': 'esportes',
  'ginástica': 'esportes',
  'ginastica': 'esportes',

  // Família
  'família': 'familia',
  'criança': 'familia',
  'crianca': 'familia',
  'bebê': 'familia',
  'bebe': 'familia',

  // Compras
  'shopping': 'compras',
  'roupa': 'compras',
  'vestuário': 'compras',
  'vestuario': 'compras'
};

/**
 * Mapeamento para busca por palavras-chave
 */
const buscaPorPalavra = {
  'casa': ['🏠', '🏡', '🛏️', '🛋️', '🚪', '🔑', '💡'],
  'dinheiro': ['💰', '💵', '💳', '🏦', '💎', '💸', '📊'],
  'comida': ['🍽️', '🍕', '🍔', '🥗', '🍜', '🥘', '🍖'],
  'carro': ['🚗', '🚕', '🚙', '⛽', '🅿️', '🚧'],
  'trabalho': ['💼', '💻', '📊', '📈', '🏢', '👔'],
  'saude': ['🏥', '💊', '🩺', '👨‍⚕️', '💉', '⚕️'],
  'escola': ['🏫', '📚', '📖', '✏️', '🎓', '👩‍🏫'],
  'diversao': ['🎉', '🎮', '🎬', '🎵', '🎪', '🎨'],
  'esporte': ['⚽', '🏀', '🎾', '🏆', '💪', '🏃'],
  'pet': ['🐶', '🐱', '🐾', '🦴', '💖', '🏠'],
  'viagem': ['✈️', '🏖️', '🗻', '🧳', '📸', '🌍'],
  'familia': ['👨‍👩‍👧‍👦', '👶', '💕', '🎂', '🏠', '❤️'],
  'compras': ['🛍️', '🛒', '🏪', '💳', '👕', '👞']
};

/**
 * Classe principal para gerenciar ícones - VERSÃO UNIFICADA
 */
class CategoriaIcons {
  
  /**
   * Obtém ícones sugeridos para uma categoria
   * @param {string} categoriaNome - Nome da categoria
   * @param {string} tipoIcone - 'emoji' ou 'material'
   * @param {number} limite - Número máximo de ícones
   * @returns {Array} Array de ícones
   */
  static getSuggestedIcons(categoriaNome, tipoIcone = 'emoji', limite = 24) {
    const nome = this.normalizarNome(categoriaNome);
    
    // Buscar categoria principal
    const categoriaKey = sinonimos[nome] || nome;
    
    // Selecionar biblioteca baseada no tipo
    const biblioteca = tipoIcone === 'material' ? iconesMaterial : iconesEmoji;
    
    // Obter ícones da categoria
    let icones = biblioteca[categoriaKey] || biblioteca['outros'] || [];
    
    // Se não encontrou nada, tentar busca por palavra-chave
    if (icones.length === 0) {
      icones = this.buscarPorPalavraChave(nome, tipoIcone);
    }
    
    return icones.slice(0, limite);
  }
  
  /**
   * Obtém ícones padrão para quando não há categoria específica
   * @param {string} tipoIcone - 'emoji' ou 'material'
   * @returns {Array} Array de ícones padrão
   */
  static getDefaultIcons(tipoIcone = 'emoji') {
    if (tipoIcone === 'material') {
      return [
        'folder', 'star_outline', 'label', 'push_pin', 'menu_book', 
        'settings', 'build', 'business_center', 'show_chart', 'trending_up',
        'description', 'assignment', 'lightbulb_outline', 'target', 'flash_on',
        'diamond', 'auto_awesome', 'rocket_launch'
      ];
    } else {
      return [
        '📁', '💼', '📋', '⭐', '🎯', '💡', '🔥', '💎',
        '🚀', '⚡', '🌟', '💫', '🎪', '🎨', '🎭', '🎬',
        '🎮', '📱', '💻', '📊', '📈', '💰', '🏆', '🎉'
      ];
    }
  }
  
  /**
   * Busca ícones por palavra-chave ou termo
   * @param {string} termo - Termo de busca
   * @param {string} tipoIcone - 'emoji' ou 'material'
   * @returns {Array} Array de ícones encontrados
   */
  static searchIcons(termo, tipoIcone = 'emoji') {
    const termoBusca = this.normalizarNome(termo);
    
    // Buscar por palavra-chave direta
    if (buscaPorPalavra[termoBusca]) {
      return buscaPorPalavra[termoBusca];
    }
    
    // Buscar por sinônimos
    const categoriaEncontrada = sinonimos[termoBusca];
    if (categoriaEncontrada) {
      const biblioteca = tipoIcone === 'material' ? iconesMaterial : iconesEmoji;
      const icones = biblioteca[categoriaEncontrada];
      if (icones) {
        return icones.slice(0, 20);
      }
    }
    
    // Buscar parcialmente nas palavras-chave
    for (const [palavra, icones] of Object.entries(buscaPorPalavra)) {
      if (palavra.includes(termoBusca) || termoBusca.includes(palavra)) {
        return icones;
      }
    }
    
    // Busca fuzzy em categorias
    const biblioteca = tipoIcone === 'material' ? iconesMaterial : iconesEmoji;
    for (const [categoria, icones] of Object.entries(biblioteca)) {
      if (categoria.includes(termoBusca) || termoBusca.includes(categoria)) {
        return icones.slice(0, 15);
      }
    }
    
    // Se não encontrou nada, retornar ícones padrão
    return this.getDefaultIcons(tipoIcone).slice(0, 10);
  }
  
  /**
   * Busca por palavra-chave específica
   * @param {string} palavra - Palavra a buscar
   * @param {string} tipoIcone - 'emoji' ou 'material'
   * @returns {Array} Array de ícones
   */
  static buscarPorPalavraChave(palavra, tipoIcone = 'emoji') {
    if (buscaPorPalavra[palavra]) {
      return buscaPorPalavra[palavra];
    }
    
    // Buscar em categorias relacionadas
    const biblioteca = tipoIcone === 'material' ? iconesMaterial : iconesEmoji;
    const resultados = [];
    
    for (const [categoria, icones] of Object.entries(biblioteca)) {
      if (categoria.includes(palavra) || palavra.includes(categoria)) {
        resultados.push(...icones.slice(0, 5));
      }
    }
    
    return resultados.length > 0 ? resultados : this.getDefaultIcons(tipoIcone);
  }
  
  /**
   * Normaliza nome removendo acentos e convertendo para minúsculo
   * @param {string} nome - Nome a normalizar
   * @returns {string} Nome normalizado
   */
  static normalizarNome(nome) {
    return nome.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }
  
  /**
   * Valida se um ícone é válido
   * @param {string} icone - Ícone a validar
   * @returns {boolean} Se é válido
   */
  static validateIcon(icone) {
    // Verificação se é um emoji
    return /[\u{1F000}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(icone) || 
           icone.length <= 3; // Para caracteres especiais simples
  }
  
  /**
   * Obtém um ícone aleatório de uma categoria
   * @param {string} categoria - Categoria base
   * @param {string} tipoIcone - 'emoji' ou 'material'
   * @returns {string} Ícone aleatório
   */
  static getRandomIcon(categoria = 'outros', tipoIcone = 'emoji') {
    const icones = this.getSuggestedIcons(categoria, tipoIcone, 50);
    return icones[Math.floor(Math.random() * icones.length)] || '📁';
  }
  
  /**
   * Obtém todas as categorias disponíveis
   * @returns {Array} Lista de categorias
   */
  static getCategorias() {
    return Object.keys(iconesEmoji);
  }
  
  /**
   * Obtém ícones por categoria específica
   * @param {string} categoria - Nome da categoria
   * @param {string} tipoIcone - 'emoji' ou 'material'
   * @returns {Array} Ícones da categoria
   */
  static getIconsByCategory(categoria, tipoIcone = 'emoji') {
    const biblioteca = tipoIcone === 'material' ? iconesMaterial : iconesEmoji;
    const categoriaKey = this.normalizarNome(categoria);
    const categoriaFinal = sinonimos[categoriaKey] || categoriaKey;
    
    return biblioteca[categoriaFinal] || [];
  }
  
  /**
   * Obtém sugestões de ícones para categoria brasileira
   * @param {string} nomeCategoria - Nome em português
   * @returns {Array} Ícones sugeridos
   */
  static getSuggestionsForBrazilianCategory(nomeCategoria) {
    const categoriaMap = {
      'alimentação': ['🍽️', '🍕', '🍔', '🥗', '☕', '🍞', '🥐', '🍎'],
      'transporte': ['🚗', '🚌', '🚇', '✈️', '⛽', '🚲', '🛵', '🚕'],
      'moradia': ['🏠', '💡', '💧', '🔥', '🔑', '🛏️', '🚿', '📺'],
      'saúde': ['🏥', '💊', '🩺', '💉', '🦷', '👨‍⚕️', '🧘', '💪'],
      'educação': ['📚', '✏️', '🎓', '🏫', '💻', '📖', '📝', '🔬'],
      'trabalho': ['💼', '💻', '📊', '🏢', '☎️', '📧', '⏰', '📅'],
      'lazer': ['🎮', '🎬', '🎵', '🎨', '🎪', '🎯', '🎲', '🎭'],
      'família': ['👨‍👩‍👧‍👦', '👶', '🎂', '💕', '🏠', '🎁', '📷', '❤️'],
      'pets': ['🐶', '🐱', '🐾', '🦴', '💖', '🏠', '🥎', '🐕'],
      'compras': ['🛍️', '🛒', '💳', '👕', '👞', '🏪', '💄', '📱']
    };
    
    const categoria = this.normalizarNome(nomeCategoria);
    return categoriaMap[categoria] || this.getDefaultIcons('emoji');
  }
  
  /**
   * Obtém estatísticas da biblioteca
   * @returns {Object} Estatísticas
   */
  static getStats() {
    const totalEmojis = Object.values(iconesEmoji)
      .reduce((total, arr) => total + arr.length, 0);
    
    const totalMaterial = Object.values(iconesMaterial)
      .reduce((total, arr) => total + arr.length, 0);
    
    return {
      totalIcones: totalEmojis + totalMaterial,
      iconesEmoji: totalEmojis,
      iconesMaterial: totalMaterial,
      categorias: Object.keys(iconesEmoji).length,
      sinonimos: Object.keys(sinonimos).length,
      palavrasChave: Object.keys(buscaPorPalavra).length
    };
  }
  
  /**
   * Obtém ícones mais populares por categoria
   * @param {string} categoria - Categoria
   * @param {number} limite - Limite de ícones
   * @returns {Array} Ícones mais usados
   */
  static getPopularIcons(categoria = null, limite = 12) {
    if (categoria) {
      return this.getSuggestedIcons(categoria, 'emoji', limite);
    }
    
    // Ícones mais populares gerais
    return [
      '💰', '🏠', '🍽️', '🚗', '🏥', '📚', '💼', '🎮',
      '👨‍👩‍👧‍👦', '🐶', '✈️', '🛍️', '⚽', '🎬', '☕', '📱',
      '💡', '🎯', '🔥', '⭐', '💎', '🚀', '🌟', '🏆'
    ].slice(0, limite);
  }
  
  /**
   * Pesquisa avançada com múltiplos termos
   * @param {string} query - Query de busca
   * @param {string} tipoIcone - Tipo de ícone
   * @param {number} limite - Limite de resultados
   * @returns {Array} Ícones encontrados
   */
  static advancedSearch(query, tipoIcone = 'emoji', limite = 20) {
    const termos = query.toLowerCase().split(' ').map(t => t.trim());
    const resultados = new Set();
    
    termos.forEach(termo => {
      const icones = this.searchIcons(termo, tipoIcone);
      icones.forEach(icone => resultados.add(icone));
    });
    
    return Array.from(resultados).slice(0, limite);
  }
  
  /**
   * Filtra ícones por tema ou contexto
   * @param {string} tema - Tema (ex: 'business', 'personal', 'fun')
   * @param {string} tipoIcone - Tipo de ícone
   * @returns {Array} Ícones do tema
   */
  static getIconsByTheme(tema, tipoIcone = 'emoji') {
    const temas = {
      'business': ['financas', 'trabalho'],
      'personal': ['familia', 'saude', 'educacao'],
      'fun': ['lazer', 'esportes', 'viagem'],
      'daily': ['alimentacao', 'transporte', 'moradia'],
      'care': ['pets', 'familia', 'saude']
    };
    
    const categorias = temas[tema] || ['outros'];
    const biblioteca = tipoIcone === 'material' ? iconesMaterial : iconesEmoji;
    const resultados = [];
    
    categorias.forEach(categoria => {
      if (biblioteca[categoria]) {
        resultados.push(...biblioteca[categoria].slice(0, 8));
      }
    });
    
    return resultados;
  }
  
  /**
   * Valida e sanitiza entrada de ícone
   * @param {string} icone - Ícone a validar
   * @returns {string} Ícone validado ou padrão
   */
  static sanitizeIcon(icone) {
    if (!icone || typeof icone !== 'string') {
      return '📁';
    }
    
    // Remove espaços e caracteres especiais
    const cleaned = icone.trim();
    
    if (this.validateIcon(cleaned)) {
      return cleaned;
    }
    
    return '📁';
  }
}

// =====================================
// EXPORTAÇÕES PARA COMPATIBILIDADE
// =====================================

/**
 * Exportações nomeadas para manter compatibilidade com código existente
 */
export const getIconSuggestions = (nome, tipo = 'emoji', limite = 24) => {
  return CategoriaIcons.getSuggestedIcons(nome, tipo, limite);
};

export const searchIcons = (termo, tipo = 'emoji') => {
  return CategoriaIcons.searchIcons(termo, tipo);
};

export const getRandomIcon = (categoria = 'outros', tipo = 'emoji') => {
  return CategoriaIcons.getRandomIcon(categoria, tipo);
};

export const validateIcon = (icone) => {
  return CategoriaIcons.validateIcon(icone);
};

export const getDefaultIcons = (tipo = 'emoji') => {
  return CategoriaIcons.getDefaultIcons(tipo);
};

export const getPopularIcons = (categoria = null, limite = 12) => {
  return CategoriaIcons.getPopularIcons(categoria, limite);
};

export const getBrazilianSuggestions = (categoria) => {
  return CategoriaIcons.getSuggestionsForBrazilianCategory(categoria);
};

// =====================================
// CONSTANTES EXPORTADAS
// =====================================

/**
 * Lista das categorias principais
 */
export const CATEGORIAS_PRINCIPAIS = [
  'financas',
  'alimentacao',
  'transporte', 
  'moradia',
  'saude',
  'educacao',
  'trabalho',
  'lazer',
  'esportes',
  'familia',
  'pets',
  'viagem',
  'compras',
  'outros'
];

/**
 * Tipos de ícones disponíveis
 */
export const TIPOS_ICONES = {
  EMOJI: 'emoji',
  MATERIAL: 'material'
};

/**
 * Temas predefinidos
 */
export const TEMAS_ICONES = {
  BUSINESS: 'business',
  PERSONAL: 'personal',
  FUN: 'fun',
  DAILY: 'daily',
  CARE: 'care'
};

/**
 * Ícones mais populares para quick access
 */
export const ICONES_POPULARES = [
  '💰', '🏠', '🍽️', '🚗', '🏥', '📚', '💼', '🎮',
  '👨‍👩‍👧‍👦', '🐶', '✈️', '🛍️', '⚽', '🎬', '☕', '📱'
];

/**
 * Cores sugeridas por categoria
 */
export const CORES_POR_CATEGORIA = {
  'financas': ['#2E7D32', '#388E3C', '#43A047', '#4CAF50'],
  'alimentacao': ['#E64A19', '#F57C00', '#FF9800', '#FFC107'],
  'transporte': ['#1976D2', '#1E88E5', '#2196F3', '#03A9F4'],
  'moradia': ['#5D4037', '#6D4C41', '#795548', '#8D6E63'],
  'saude': ['#C2185B', '#E91E63', '#F06292', '#F48FB1'],
  'educacao': ['#512DA8', '#673AB7', '#9C27B0', '#BA68C8'],
  'trabalho': ['#455A64', '#546E7A', '#607D8B', '#78909C'],
  'lazer': ['#FF5722', '#FF7043', '#FF8A65', '#FFAB91'],
  'esportes': ['#FF6F00', '#FF8F00', '#FFA000', '#FFB300'],
  'familia': ['#AD1457', '#C2185B', '#E91E63', '#F06292'],
  'pets': ['#8BC34A', '#9CCC65', '#AED581', '#C5E1A5'],
  'viagem': ['#00ACC1', '#26C6DA', '#4DD0E1', '#80DEEA'],
  'compras': ['#8E24AA', '#9C27B0', '#AB47BC', '#BA68C8'],
  'outros': ['#424242', '#616161', '#757575', '#9E9E9E']
};

// =====================================
// UTILITÁRIOS ADICIONAIS
// =====================================

/**
 * Utilitário para debug e desenvolvimento
 */
export const DEBUG_UTILS = {
  listAllIcons: () => {
    console.log('📊 Estatísticas da biblioteca:', CategoriaIcons.getStats());
    console.log('📂 Categorias disponíveis:', CategoriaIcons.getCategorias());
  },
  
  testSearch: (termo) => {
    console.log(`🔍 Busca por "${termo}":`);
    console.log('Emojis:', CategoriaIcons.searchIcons(termo, 'emoji'));
    console.log('Material:', CategoriaIcons.searchIcons(termo, 'material'));
  },
  
  validateLibrary: () => {
    const stats = CategoriaIcons.getStats();
    console.log('✅ Biblioteca validada:', stats);
    return stats.totalIcones > 0;
  }
};

/**
 * Export default da classe principal
 */
export default CategoriaIcons;
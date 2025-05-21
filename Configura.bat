echo "======================================================="
echo "Criando estrutura de projeto - Plataforma de Finanças Pessoais"
echo "======================================================="




echo
echo "[1/7] Criando aplicação React com Vite..."
echo

read -p "Nome do projeto (default: financas-pessoais): " APP_NAME
APP_NAME=${APP_NAME:-financas-pessoais}

npm create vite@latest $APP_NAME -- --template react
if [ $? -ne 0 ]; then
    echo "[ERRO] Falha ao criar projeto React."
    exit 1
fi

cd $APP_NAME


echo
echo "[2/7] Instalando dependências principais..."
echo

npm install


echo
echo "[3/7] Instalando Tailwind CSS e outras dependências..."
echo

npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p


echo
echo "[4/7] Instalando bibliotecas adicionais..."
echo

npm install react-router-dom @supabase/supabase-js recharts lucide-react


echo
echo "[5/7] Instalando plugins do Tailwind..."
echo

npm install -D @tailwindcss/forms @tailwindcss/typography @tailwindcss/aspect-ratio


echo
echo "[6/7] Criando estrutura de diretórios..."
echo

mkdir -p src/assets
mkdir -p src/components/ui
mkdir -p src/components/layout
mkdir -p src/components/charts
mkdir -p src/hooks
mkdir -p src/lib
mkdir -p src/utils
mkdir -p src/context
mkdir -p src/styles
mkdir -p src/data


echo
echo "[7/7] Criando arquivos de configuração..."
echo


cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e3f2fd',
          100: '#bbdefb',
          500: '#2196f3',
          600: '#1e88e5',
          700: '#1976d2',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
};
EOF


cat > src/styles/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
}
EOF


echo '@import "./styles/globals.css";' > src/index.css


cat > src/lib/supabaseClient.js << 'EOF'
// src/lib/supabaseClient.js

/**
 * Configuração do cliente Supabase
 * Em produção, utilize suas credenciais reais
 */

// Mock do cliente Supabase para desenvolvimento
export const supabaseClient = {
  auth: {
    // Métodos mockados
    signInWithPassword: async () => ({}),
    signUp: async () => ({}),
    signOut: async () => ({})
  },
  from: () => ({
    select: () => Promise.resolve({ data: [] })
  })
};

export default supabaseClient;
EOF


cat > README.md << 'EOF'


Aplicação para controle de finanças pessoais com React e Tailwind CSS.



```bash

npm install


npm run dev


npm run build
```
EOF


cat > src/App.jsx << 'EOF'
import { useState } from 'react'
import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Plataforma de Finanças Pessoais</h1>
        <p className="text-gray-600">Estrutura base do projeto criada com sucesso!</p>
      </div>
    </div>
  )
}

export default App
EOF

echo
echo "======================================================="
echo "Estrutura criada com sucesso!"
echo "======================================================="
echo
echo "Para iniciar o servidor de desenvolvimento, execute:"
echo "cd $APP_NAME"
echo "npm run dev"
echo
echo "Visite http://localhost:5173 para ver a aplicação"
echo
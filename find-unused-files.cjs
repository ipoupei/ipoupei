// find-unused-files.js
const fg = require('fast-glob');
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.resolve(__dirname, 'src');

(async () => {
  const allFiles = await fg(['**/*.{js,jsx,ts,tsx}'], { cwd: SRC_DIR, absolute: true });

  const usedFiles = new Set();

  for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    for (const otherFile of allFiles) {
      if (otherFile === file) continue;
      const relative = './' + path.relative(path.dirname(otherFile), file).replace(/\\/g, '/').replace(/\.(js|jsx|ts|tsx)$/, '');
      const match = new RegExp(`['"\`]${relative}['"\`]`);
      if (match.test(fs.readFileSync(otherFile, 'utf-8'))) {
        usedFiles.add(file);
        break;
      }
    }
  }

  const unusedFiles = allFiles.filter(file => !usedFiles.has(file));
  console.log('\n🧹 Arquivos **possivelmente não utilizados**:\n');
  unusedFiles.forEach(f => console.log(' -', path.relative(SRC_DIR, f)));

  console.log(`\nTotal: ${unusedFiles.length} arquivos não utilizados encontrados.\n`);
})();

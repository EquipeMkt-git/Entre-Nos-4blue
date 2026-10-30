// Copia as regras, o servidor e o baralho do site para o Apps Script, para os dois lados nunca divergirem.
// Uso: node tools/gerar-gs.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const pares = [
  [['site/js/logica.js'], 'apps-script/Logica.gs'],
  [['site/js/servico.js'], 'apps-script/Servico.gs'],
  [['site/js/cartas.js'], 'apps-script/Cartas.gs']
];
for (const [origens, para] of pares) {
  const aviso = `/* GERADO de ${origens.join(' + ')} por tools/gerar-gs.mjs. Não edite aqui: edite o original e rode o script de novo. */\n`;
  writeFileSync(join(raiz, para), aviso + origens.map((de) => readFileSync(join(raiz, de), 'utf8')).join('\n'));
  console.log('ok', para);
}

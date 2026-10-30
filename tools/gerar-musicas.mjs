// Copia as músicas de assets/ para o site (nomes sem espaço nem acento) e escreve site/js/musicas.js.
// Pasta: "assets/para o jogo normal" toca na mesa.
// Uso: node tools/gerar-musicas.mjs   (rode de novo sempre que puser ou tirar músicas)
import { readdirSync, mkdirSync, copyFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { dirname, join, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const pastas = { classico: 'para o jogo normal' };
const destinos = { classico: 'normal' };
const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const lista = {};
for (const [baralho, pasta] of Object.entries(pastas)) {
  const de = join(raiz, 'assets', pasta);
  const para = join(raiz, 'site', 'musicas', destinos[baralho]);
  lista[baralho] = [];
  if (!existsSync(de)) continue;
  mkdirSync(para, { recursive: true });
  for (const arq of readdirSync(de).sort()) {
    if (!/\.(mp3|m4a|ogg|wav)$/i.test(arq)) continue;
    const titulo = basename(arq, extname(arq)).normalize('NFC').replace(/_$/, '?');
    const nome = slug(titulo) + extname(arq).toLowerCase();
    const alvo = join(para, nome);
    if (!existsSync(alvo) || statSync(alvo).size !== statSync(join(de, arq)).size) copyFileSync(join(de, arq), alvo);
    lista[baralho].push({ arq: 'musicas/' + destinos[baralho] + '/' + nome, titulo });
  }
}
writeFileSync(join(raiz, 'site', 'js', 'musicas.js'),
  '/* GERADO por tools/gerar-musicas.mjs a partir da pasta assets/. Cada baralho tem a sua lista. */\nvar MUSICAS = ' + JSON.stringify(lista, null, 2) + ';\n');
console.log('Músicas:', lista.classico.length);

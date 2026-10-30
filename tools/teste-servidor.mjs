// Roda o Apps Script (Code.gs + Servico.gs + Logica.gs + Cartas.gs) com planilha, cache e trava de mentira:
// cria contas, abre mesas, convida quem está online e joga uma partida inteira.
// Uso: node tools/teste-servidor.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHmac, randomUUID } from 'node:crypto';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const ler = (f) => readFileSync(join(raiz, 'apps-script', f), 'utf8');
const semAspa = (x) => (typeof x === 'string' && x.startsWith("'") ? x.slice(1) : x); // o Sheets guarda '=x como =x

function planilhaFalsa() {
  const abas = {};
  function aba(nome) {
    const linhas = [];
    const sh = {
      linhas,
      getLastRow: () => linhas.length,
      getRange(l, c, nl = 1, nc = 1) {
        if (typeof l === 'string') { // 'B2' ou 'A2:B2'
          const m = l.match(/([A-Z])(\d+)(?::([A-Z])(\d+))?/);
          c = m[1].charCodeAt(0) - 64; l = Number(m[2]);
          nc = m[3] ? m[3].charCodeAt(0) - 64 - c + 1 : 1; nl = 1;
        }
        const r = {
          getValues: () => Array.from({ length: nl }, (_, i) => Array.from({ length: nc }, (_, j) => (linhas[l - 1 + i] || [])[c - 1 + j] ?? '')),
          getValue: () => (linhas[l - 1] || [])[c - 1] ?? '',
          setValue(v) { linhas[l - 1] = linhas[l - 1] || []; linhas[l - 1][c - 1] = semAspa(v); return r; },
          setValues(v) { v.forEach((row, i) => { linhas[l - 1 + i] = linhas[l - 1 + i] || []; row.forEach((x, j) => { linhas[l - 1 + i][c - 1 + j] = semAspa(x); }); }); return r; },
          setFontWeight: () => r,
          createTextFinder: (t) => {
            let caixa = true;
            const f = {
              matchEntireCell: () => f,
              matchCase: (b) => { caixa = b; return f; },
              findNext: () => {
                const igual = (x) => (caixa ? String(x) === t : String(x).toLowerCase() === t.toLowerCase());
                for (let i = 0; i < nl; i++) if (igual((linhas[l - 1 + i] || [])[c - 1])) return { getRow: () => l + i };
                return null;
              }
            };
            return f;
          }
        };
        return r;
      },
      appendRow(row) { linhas.push(row.map(semAspa)); },
      setFrozenRows() {}
    };
    return sh;
  }
  return { getSheetByName: (n) => abas[n] || null, insertSheet: (n) => (abas[n] = aba(n)), abas };
}

let relogio = Date.now();
Date.now = () => (relogio += 1000); // cada chamada anda 1 s
const ss = planilhaFalsa();
const cacheMap = new Map();
const props = {};
const bytes = (b) => Array.from(b, (x) => (x > 127 ? x - 256 : x)); // o Apps Script devolve bytes com sinal
const ctx = {
  console, Date, Math, JSON, Error, Number, String, Object, Array, parseInt,
  SpreadsheetApp: { getActive: () => ss },
  CacheService: { getScriptCache: () => ({
    get: (k) => cacheMap.get(k) ?? null,
    put: (k, v) => { assert.ok(String(v).length < 100000, 'valor grande demais para o cache'); cacheMap.set(k, String(v)); },
    getAll: (ks) => Object.fromEntries(ks.filter((k) => cacheMap.has(k)).map((k) => [k, cacheMap.get(k)]))
  }) },
  PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => props[k] ?? null, setProperty: (k, v) => { props[k] = v; } }) },
  LockService: { getScriptLock: () => ({ tryLock: () => true, waitLock: () => {}, releaseLock: () => {} }) },
  ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (t) => ({ setMimeType: () => ({ texto: t }) }) },
  Utilities: {
    getUuid: () => randomUUID(),
    newBlob: (s) => ({ getBytes: () => bytes(Buffer.from(s, 'utf8')) }),
    computeHmacSha256Signature: (v, k) => {
      const buf = (x) => (typeof x === 'string' ? Buffer.from(x, 'utf8') : Buffer.from(x.map((b) => b & 255)));
      return bytes(createHmac('sha256', buf(k)).update(buf(v)).digest());
    }
  },
  Logger: { log: () => {} }
};
vm.createContext(ctx);
for (const f of ['Cartas.gs', 'Logica.gs', 'Servico.gs', 'Code.gs']) vm.runInContext(ler(f), ctx, { filename: f });

const post = (p) => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(p) } }).texto);
const ok = (r) => { assert.ok(r.ok, r.erro); return r.dados; };

ctx.setup();
const senhaAdm = ss.getSheetByName('Config').getRange('B2').getValue();
assert.equal(senhaAdm.length, 8);
assert.equal(ss.getSheetByName('Cartas').getLastRow(), 66);
assert.ok(props.segredo.length > 40);

// ---------- contas ----------
const conta = (apelido, extra = {}) => ({ acao: 'cadastro', nome: apelido + ' Silva', email: apelido.toLowerCase() + '@ex.com', apelido, senha: 'segredo123', ...extra });
assert.match(post(conta('Ana', { senha: 'curta' })).erro, /8 caracteres/);
assert.match(post(conta('Ana', { email: 'ana@' })).erro, /e-mail/);
assert.match(post(conta('=SOMA(1)')).erro, /só letras/);
const ana = ok(post(conta('Ana')));
assert.match(post(conta('ANA', { email: 'outra@ex.com' })).erro, /apelido já tem dono/);
assert.match(post(conta('Outra', { email: 'ANA@ex.com' })).erro, /Já existe uma conta/);
const linhaAna = ss.getSheetByName('Usuarios').linhas[1];
assert.ok(!linhaAna.includes('segredo123'), 'senha em texto puro na planilha');
assert.equal(linhaAna[6].length, 64);

assert.equal(post({ acao: 'login', email: 'ana@ex.com', senha: 'errada123' }).erro, 'E-mail ou senha não conferem.');
const ana2 = ok(post({ acao: 'login', email: ' ANA@ex.com ', senha: 'segredo123' }));
assert.equal(ana2.eu.apelido, 'Ana');
assert.equal(ok(post({ acao: 'eu', ses: ana2.ses })).eu.uid, ana.eu.uid);
// sessão adulterada ou de outra pessoa não passa
const [uid, exp, sig] = ana.ses.split('.');
const falsa = post({ acao: 'eu', ses: 'uaaaaaaaaaaa.' + exp + '.' + sig });
assert.ok(falsa.sessao && !falsa.ok);
assert.ok(post({ acao: 'eu', ses: uid + '.zzzzzz.' + sig }).sessao);
assert.ok(post({ acao: 'painel' }).sessao);
// muitas tentativas bloqueiam o e-mail
for (let i = 0; i < 8; i++) post({ acao: 'login', email: 'beto@ex.com', senha: 'x' });
assert.match(post({ acao: 'login', email: 'beto@ex.com', senha: 'x' }).erro, /Espere 15 minutos/);

const beto = ok(post(conta('Beto'))), caio = ok(post(conta('Caio'))), duda = ok(post(conta('Duda'))), edu = ok(post(conta('Edu')));
const S = { [ana.eu.uid]: ana, [beto.eu.uid]: beto, [caio.eu.uid]: caio, [duda.eu.uid]: duda };

// ---------- salão: online e convites ----------
ok(post({ acao: 'painel', ses: beto.ses }));
const pAna = ok(post({ acao: 'painel', ses: ana.ses }));
assert.deepEqual(pAna.online.map((x) => x.apelido), ['Beto']);

const m = ok(post({ acao: 'criar', ses: ana.ses, cap: 4, baralho: 'classico', modo: 'completo' }));
assert.match(m.mesa, /^[a-z0-9]{12}$/);
assert.equal(m.vista.monte, 65);
const mesa = m.mesa;
assert.match(post({ acao: 'entrar', ses: beto.ses, mesa: 'abc' }).erro, /link de mesa está incompleto/);
assert.match(post({ acao: 'entrar', ses: beto.ses, mesa: 'aaaaaaaaaaaa' }).erro, /não existe/);
assert.match(post({ acao: 'convidar', ses: beto.ses, mesa, para: caio.eu.uid }).erro, /Sente à mesa/);

const cv = ok(post({ acao: 'convidar', ses: ana.ses, mesa, para: beto.eu.uid }));
assert.equal(cv.para, 'Beto');
const pBeto = ok(post({ acao: 'painel', ses: beto.ses }));
assert.equal(pBeto.convites.length, 1);
assert.equal(pBeto.convites[0].de, 'Ana');
assert.equal(pBeto.convites[0].mesa, mesa);
let v = ok(post({ acao: 'entrar', ses: beto.ses, mesa }));
assert.equal(ok(post({ acao: 'painel', ses: beto.ses })).convites.length, 0, 'convite aceito continua na lista');
assert.equal(ok(post({ acao: 'painel', ses: beto.ses })).mesas[0].mesa, mesa);
assert.match(post({ acao: 'convidar', ses: ana.ses, mesa, para: beto.eu.uid }).erro, /já está nesta mesa/);

ok(post({ acao: 'convidar', ses: ana.ses, mesa, para: edu.eu.uid }));
const cvEdu = ok(post({ acao: 'painel', ses: edu.ses })).convites[0];
assert.equal(ok(post({ acao: 'recusar', ses: edu.ses, convite: cvEdu.id })).convites.length, 0);

ok(post({ acao: 'entrar', ses: caio.ses, mesa }));
ok(post({ acao: 'entrar', ses: duda.ses, mesa }));
assert.match(post({ acao: 'entrar', ses: edu.ses, mesa }).erro, /cheia/);
assert.match(post({ acao: 'convidar', ses: ana.ses, mesa, para: edu.eu.uid }).erro, /cheia/);

// estado com a lista de quem está online, para convidar de dentro da mesa
v = ok(post({ acao: 'estado', ses: ana.ses, mesa, desde: 0, online: 1 }));
assert.ok(Array.isArray(v.online));
assert.equal(v.jogadores.length, 4);
assert.ok(v.jogadores.every((j) => !('tok' in j)));
const txt = JSON.stringify(v);
for (const u of Object.values(S)) assert.ok(!txt.includes(u.ses.split('.')[2]), 'vazou sessão');
const chaves = ss.getSheetByName('Usuarios').linhas.slice(1).map((l) => l[7]);
assert.ok(chaves.every((k) => !txt.includes(k)), 'vazou a chave de alguém');

// ---------- partida ----------
assert.match(post({ acao: 'iniciar', ses: beto.ses, mesa }).erro, /Só quem abriu/);
v = ok(post({ acao: 'iniciar', ses: ana.ses, mesa }));
assert.equal(v.status, 'jogo');
const vistos = new Set();
for (let rodada = 0; rodada < 20; rodada++) {
  const vez = S[v.vezId];
  const outro = Object.values(S).find((x) => x !== vez);
  assert.match(post({ acao: 'tirar', ses: outro.ses, mesa }).erro, /não é a sua vez/);
  v = ok(post({ acao: 'tirar', ses: vez.ses, mesa, pos: rodada % 7 }));
  assert.ok(!vistos.has(v.carta.id), 'carta repetida antes do monte acabar');
  vistos.add(v.carta.id);
  if (rodada === 3) { v = ok(post({ acao: 'trocar', ses: vez.ses, mesa })); vistos.add(v.carta.id); }
  v = ok(post({ acao: 'msg', ses: vez.ses, mesa, txt: '=HYPERLINK("x")  resposta ' + rodada, desde: v.seq - 1 }));
  assert.equal(v.msgs.at(-1).tipo, 'resp');
  v = ok(post({ acao: rodada % 5 === 0 ? 'passar' : 'concluir', ses: vez.ses, mesa }));
  assert.equal(v.carta, null);
}
// o texto que parece fórmula entra na planilha como texto
const logMsgs = ss.getSheetByName('Mensagens').linhas;
assert.ok(logMsgs.some((l) => String(l[4]).startsWith('=HYPERLINK')));

// reação
v = ok(post({ acao: 'msg', ses: beto.ses, mesa, rea: 'risada', desde: v.seq }));
assert.equal(v.msgs.at(-1).tipo, 'rea');

// pular a vez de quem sumiu
const vez = S[v.vezId];
const terceiro = Object.values(S).find((x) => x !== vez && x.eu.uid !== v.anfitriao);
cacheMap.set('o_' + mesa + '_' + vez.eu.uid, String(Date.now() - 60000));
v = ok(post({ acao: 'concluir', ses: terceiro.ses, mesa }));
assert.match(v.msgs.map((x) => x.txt).join('|'), /pulou a vez/);

// quem organiza tira alguém: essa pessoa não volta pelo link
v = ok(post({ acao: 'remover', ses: ana.ses, mesa, alvo: duda.eu.uid }));
assert.match(post({ acao: 'entrar', ses: duda.ses, mesa }).erro, /tirou você/);
assert.equal(ok(post({ acao: 'estado', ses: duda.ses, mesa })).fora, true);
// quem sai por conta própria volta
ok(post({ acao: 'sair', ses: caio.ses, mesa }));
ok(post({ acao: 'entrar', ses: caio.ses, mesa }));

// cache some: mesa e conta voltam da planilha
cacheMap.clear();
assert.equal(ok(post({ acao: 'estado', ses: beto.ses, mesa })).status, 'jogo');

// ---------- só o baralho Normal: pedir +18 cai no Normal ----------
const p18 = ok(post({ acao: 'criar', ses: beto.ses, cap: 2, baralho: 'picante', modo: 'tudo18' }));
assert.equal(p18.vista.baralho, 'classico');
assert.equal(p18.vista.modo, 'completo');
assert.equal(ok(post({ acao: 'criar', ses: caio.ses, cap: 4, baralho: 'classico', modo: 'engracado' })).vista.monte,
  vm.runInContext('CARTAS', ctx).filter((c) => [1, 3, 6, 7].includes(c.cat)).length);
assert.ok(vm.runInContext('CARTAS', ctx).every((c) => c.id < 100), 'sobrou carta +18');
v = ok(post({ acao: 'msg', ses: beto.ses, mesa, rea: 'estrela', desde: 0 }));
assert.equal(post({ acao: 'msg', ses: caio.ses, mesa, rea: 'fogo' }).erro, 'Reação desconhecida.');

// ---------- organizador ----------
assert.equal(post({ acao: 'admin', senha: 'x' }).erro, 'Senha incorreta.');
const adm = ok(post({ acao: 'admin', senha: senhaAdm, op: 'encerrar', cod: mesa }));
assert.equal(adm.salas.find((s) => s.cod === mesa).status, 'fim');
assert.equal(adm.totais.contas, 5);
assert.ok(adm.usuarios.every((u) => !('hash' in u) && !('sal' in u)));
assert.ok(adm.cartas.length > 15);
assert.equal(post({ acao: 'xyz', ses: ana.ses }).erro, 'Ação desconhecida.');

console.log('Tudo certo:', vistos.size, 'cartas tiradas,', adm.totais.contas, 'contas,', adm.totais.salas, 'mesas,', logMsgs.length - 1, 'linhas de registro.');

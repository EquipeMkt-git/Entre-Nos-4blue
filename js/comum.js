/* Entre Nós — peças usadas em todas as telas */
var ICONES = {
  enviar: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  trocar: '<path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22"/><path d="m18 2 4 4-4 4"/><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2"/><path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8"/><path d="m18 14 4 4-4 4"/>',
  passar: '<polygon points="5 4 15 12 5 20 5 4"/><line x1="19" x2="19" y1="5" y2="19"/>',
  ok: '<path d="M20 6 9 17l-5-5"/>',
  copiar: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  coroa: '<path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"/><path d="M5 21h14"/>',
  sair: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
  pessoas: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  jogar: '<polygon points="6 3 20 12 6 21 6 3"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  conversa: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  baralho: '<rect width="12" height="16" x="8" y="5" rx="1"/><path d="M4 17V4a1 1 0 0 1 1-1h10"/>',
  coracao: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  fogo: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  brilho: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>',
  cereja: '<path d="M2 17a5 5 0 0 0 10 0c0-2.76-2.5-5-5-3-2.5-2-5 .24-5 3Z"/><path d="M12 17a5 5 0 0 0 10 0c0-2.76-2.5-5-5-3-2.5-2-5 .24-5 3Z"/><path d="M7 14c3.22-2.91 4.29-8.75 5-12 1.66 2.38 4.94 9 5 12"/><path d="M22 9c-4.29 0-7.14-2.33-10-7 5.71 0 10 4.67 10 7Z"/>',
  infinito: '<path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.33-6 4Z"/>',
  cadeado: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  dado: '<rect width="18" height="18" x="3" y="3" rx="3" ry="3"/><path d="M16 8h.01"/><path d="M8 8h.01"/><path d="M8 16h.01"/><path d="M16 16h.01"/><path d="M12 12h.01"/>',
  risada: '<circle cx="12" cy="12" r="10"/><path d="M18 13a6 6 0 0 1-6 5 6 6 0 0 1-6-5h12Z"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/>',
  uau: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="15.5" r="2.2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/>',
  escudo: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  livro: '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
  envelope: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  olho: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
  estrela: '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
  lua: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  sorriso: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/>',
  chamar: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/>',
  mais: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  voltar: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  musica: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  semSom: '<path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/>',
  olhoFechado: '<path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/>'
};

var REACAO_NOME = { coracao: 'mandou amor', fogo: 'achou quente', risada: 'riu', uau: 'ficou de boca aberta', estrela: 'achou incrível' };

/* baralho da tela atual (fica no body para trocar o verso das cartas) */
function baralhoAtual() { return (document.body && document.body.dataset.baralho) || 'classico'; }

/* Os três baralhos como aparecem para quem joga */
var BARALHO_INFO = {
  classico: { nome: 'Normal', icone: 'sorriso', cor: '#2f7bff', desc: 'Perguntas para rir, lembrar e se conhecer de verdade.' }
};

function totalCartas(modo) {
  var cats = Logica.MODOS[modo].cats;
  return CARTAS.filter(function (c) { return cats.indexOf(c.cat) >= 0; }).length;
}

/* o maior tom do baralho diz quantas cartas ele tem */
function cartasDoBaralho(b) {
  return Math.max.apply(null, Logica.BARALHOS[b].modos.map(totalCartas));
}

function avatar(nome, cor) {
  return '<span class="ini" style="--c:' + (cor || '#ff86a6') + '" aria-hidden="true">' + esc(String(nome || '?').charAt(0).toUpperCase()) + '</span>';
}

/* Uma chuva de símbolos saindo do centro de um elemento (cartas viradas, reações) */
function explodir(el, nomes, qtd) {
  if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var r = el.getBoundingClientRect();
  var box = document.createElement('div');
  box.className = 'estouro';
  box.setAttribute('aria-hidden', 'true');
  box.style.left = (r.left + r.width / 2) + 'px';
  box.style.top = (r.top + r.height / 2) + 'px';
  qtd = qtd || 14;
  for (var i = 0; i < qtd; i++) {
    var a = (Math.PI * 2 * i) / qtd + Math.random() * 0.5;
    var d = 70 + Math.random() * 110;
    var s = document.createElement('span');
    s.style.setProperty('--dx', Math.round(Math.cos(a) * d) + 'px');
    s.style.setProperty('--dy', Math.round(Math.sin(a) * d - 40) + 'px');
    s.style.setProperty('--rot', Math.round(Math.random() * 120 - 60) + 'deg');
    s.style.setProperty('--tam', (14 + Math.random() * 16) + 'px');
    s.style.animationDelay = Math.round(Math.random() * 120) + 'ms';
    var nome = nomes[i % nomes.length];
    s.className = 'faisca f-' + nome;
    s.innerHTML = '<svg viewBox="0 0 24 24">' + ICONES[nome] + '</svg>';
    box.appendChild(s);
  }
  document.body.appendChild(box);
  setTimeout(function () { box.remove(); }, 1600);
}

function icone(nome, rotulo) {
  return '<svg class="ico" viewBox="0 0 24 24" ' + (rotulo ? 'role="img" aria-label="' + rotulo + '"' : 'aria-hidden="true"') + '>' + ICONES[nome] + '</svg>';
}

function esc(t) {
  return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function categoria(id) {
  for (var i = 0; i < CATEGORIAS.length; i++) if (CATEGORIAS[i].id === id) return CATEGORIAS[i];
  return CATEGORIAS[0];
}

function carta(id) {
  for (var i = 0; i < CARTAS.length; i++) if (CARTAS[i].id === id) return CARTAS[i];
  return null;
}

function pad2(n) { return (n < 10 ? '0' : '') + n; }

/* O verso: moldura arredondada, uma estampa de símbolos e o selo do baralho no meio */
var VERSOS = {
  classico: { fundo: '#2f7bff', miolo: '#1d5fd8', estampa: '#7fb0ff', selo: 'EN', simbolos: ['estrela'] }
};
function versoSVG(baralho) {
  var v = VERSOS[baralho || baralhoAtual()] || VERSOS.classico;
  var estampa = '', n = 0;
  for (var y = 0; y < 6; y++) for (var x = 0; x < 4; x++) {
    if ((x + y) % 2) continue;
    var nome = v.simbolos[n++ % v.simbolos.length];
    estampa += '<g transform="translate(' + (22 + x * 48) + ' ' + (22 + y * 46) + ') scale(.55)">' + ICONES[nome] + '</g>';
  }
  return '<svg class="verso-arte" viewBox="0 0 200 280" preserveAspectRatio="none" aria-hidden="true">' +
    '<rect width="200" height="280" fill="' + v.fundo + '"/>' +
    '<rect x="10" y="10" width="180" height="260" rx="16" fill="' + v.miolo + '"/>' +
    '<g fill="' + v.estampa + '" stroke="none" opacity=".55">' + estampa + '</g>' +
    '<circle cx="100" cy="140" r="46" fill="#fff1f4"/>' +
    '<text x="100" y="155" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="600" font-size="' + (v.selo.length > 2 ? 40 : 44) + '" fill="' + v.miolo + '">' + v.selo + '</text>' +
    '</svg>';
}

/* A frente da carta. op.virada = começa de costas (para girar depois). */
function cartaHTML(id, op) {
  op = op || {};
  var c = carta(id);
  if (!c) return '';
  var cat = categoria(c.cat);
  /* no topo vai o nome mais curto do maço; no pé, o outro */
  var curto = cat.nome.length <= cat.sub.length ? cat.nome : cat.sub;
  var longo = curto === cat.nome ? cat.sub : cat.nome;
  var corpo = '';
  if (c.titulo) {
    corpo = '<p class="titulo">' + esc(c.titulo) + '</p><p class="perg instrucao">' + esc(c.txt) + '</p>';
  } else {
    corpo = '<p class="perg' + (c.txt.length > 80 ? ' longa' : '') + '">' + esc(c.txt) + '</p>';
  }
  if (c.todos) corpo += '<span class="todos">Todos respondem</span>';
  if (cat.simbolo) corpo += '<span class="simbolo" aria-hidden="true"><svg viewBox="0 0 24 24">' + ICONES[cat.simbolo] + '</svg></span>';
  return '<div class="carta ' + (op.virada ? 'virada' : 'so-frente') + ' ' + (op.classe || '') + '" style="--cat:' + cat.cor + '" role="img" aria-label="Carta ' + c.id + ', ' + esc(cat.nome) + ': ' + esc((c.titulo ? c.titulo + '. ' : '') + c.txt) + '">' +
    '<div class="giro">' +
      '<div class="face"><div class="cab"><span>' + esc(curto) + '</span><span>Nº ' + pad2(c.id) + '</span></div>' + corpo +
        '<div class="pe"><span>' + esc(longo) + '</span></div></div>' +
      '<div class="verso">' + versoSVG() + '</div>' +
    '</div></div>';
}

var _toastT;
function toast(msg, erro) {
  var el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.toggle('erro', !!erro);
  el.classList.add('on');
  clearTimeout(_toastT);
  _toastT = setTimeout(function () { el.classList.remove('on'); }, erro ? 4200 : 2600);
}

/* Folha que sobe de baixo no celular (e vira janela no meio da tela no computador) */
function abrirFolha(titulo, html, op) {
  op = op || {};
  fecharFolha();
  var antes = document.activeElement;
  var f = document.createElement('div');
  f.className = 'folha-fundo';
  f.innerHTML = '<div class="folha ' + (op.classe || '') + '" role="dialog" aria-modal="true" aria-labelledby="folha-t">' +
    '<div class="folha-cab"><h2 id="folha-t">' + esc(titulo) + '</h2>' +
    '<button class="fechar" type="button" aria-label="Fechar">' + icone('x') + '</button></div>' +
    '<div class="folha-corpo">' + html + '</div></div>';
  document.body.appendChild(f);
  document.documentElement.classList.add('com-folha');
  function fechar() { fecharFolha(); if (antes && antes.focus) antes.focus(); }
  f.addEventListener('click', function (e) { if (e.target === f || e.target.closest('.fechar')) fechar(); });
  f._tecla = function (e) { if (e.key === 'Escape') fechar(); };
  document.addEventListener('keydown', f._tecla);
  f.querySelector('.fechar').focus();
  if (op.aoFechar) f._aoFechar = op.aoFechar;
  return f.querySelector('.folha');
}
function fecharFolha() {
  var f = document.querySelector('.folha-fundo');
  if (!f) return;
  document.removeEventListener('keydown', f._tecla);
  if (f._aoFechar) f._aoFechar();
  f.remove();
  document.documentElement.classList.remove('com-folha');
}

/* Regras e como se joga: ficam guardadas atrás de um botão */
function abrirRegras() {
  var passos = [
    ['envelope', 'Abra uma mesa', 'Escolha o tom e quantos lugares. Chame o time pelo link ou direto pela lista de quem está online.'],
    ['baralho', 'Tire uma carta', 'Na sua vez, escolha uma das cartas viradas e responda no chat. Todo mundo da mesa lê.'],
    ['trocar', 'Troque ou passe', 'Não curtiu a pergunta? Troque até duas vezes ou passe a vez, sem precisar explicar.'],
    ['pessoas', 'Cartas para todos', 'Algumas cartas chamam a mesa inteira: cada um responde e vocês comparam.']
  ];
  var casa = [
    ['escudo', '#14a88e', 'Tudo é opcional', 'Passar a vez é sempre uma resposta válida. Ninguém cobra explicação.'],
    ['olhoFechado', '#9b6bff', 'O que é dito aqui fica aqui', 'Nada de print ou de levar a conversa para fora da mesa sem combinar com quem falou.'],
    ['coracao', '#ff5f8a', 'Respeito acima da resposta', 'Ninguém é julgado pelo que conta. Zoeira, só se a pessoa entrou na brincadeira.'],
    ['sorriso', '#ffb84d', 'Clima de time', 'É para se conhecer melhor, não para expor ninguém. Pegue leve com quem está chegando.']
  ];
  abrirFolha('Como se joga',
    '<ol class="passos">' + passos.map(function (p, i) {
      return '<li style="--i:' + i + '"><span class="bola">' + icone(p[0]) + '</span><div><b>' + p[1] + '</b><p>' + p[2] + '</p></div></li>';
    }).join('') + '</ol>' +
    '<h3>Regras da casa</h3><ul class="casa">' + casa.map(function (r, i) {
      return '<li style="--c:' + r[1] + ';--i:' + (i + 4) + '"><span class="bola">' + icone(r[0]) + '</span><div><b>' + r[2] + '</b><p>' + r[3] + '</p></div></li>';
    }).join('') + '</ul>' +
    '<h3>Os baralhos</h3><ul class="baralhos-info">' + Object.keys(Logica.BARALHOS).map(function (b) {
      var info = BARALHO_INFO[b], B = Logica.BARALHOS[b];
      return '<li style="--c:' + info.cor + '"><span class="bola">' + icone(info.icone) + '</span><div><b>' + info.nome + ' · ' + cartasDoBaralho(b) + ' cartas</b><p>' + info.desc +
        ' Tons: ' + B.modos.map(function (m) { return Logica.MODOS[m].nome; }).join(', ') + '.</p></div></li>';
    }).join('') + '</ul>',
    { classe: 'regras' });
}

/* Copiar ou compartilhar um link (no celular abre o menu de compartilhar) */
function compartilhar(link, texto) {
  if (navigator.share && matchMedia('(pointer: coarse)').matches) {
    navigator.share({ title: 'Entre Nós', text: texto, url: link }).catch(function () {});
    return;
  }
  (navigator.clipboard ? navigator.clipboard.writeText(link) : Promise.reject())
    .then(function () { toast('Link copiado. Agora é só mandar.'); })
    .catch(function () { prompt('Copie o link da mesa:', link); });
}

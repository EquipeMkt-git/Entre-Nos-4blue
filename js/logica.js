/* Entre Nós — regras da mesa.
   O mesmo arquivo roda no navegador (modo demonstração) e no Apps Script (Logica.gs).
   Nada aqui toca em rede, planilha ou tela: recebe o estado da mesa, aplica a ação e devolve. */
var Logica = (function () {
  var MAX_MSGS = 80;
  var MAX_TXT = 300;
  var MAX_NOME = 20;
  var AUSENTE_MS = 45000;
  var ONLINE_MS = 20000;
  var CAPS = [2, 4, 6, 8];
  var MODOS = {
    completo: { nome: 'Baralho completo', baralho: 'classico', cats: [1, 2, 3, 4, 5, 6, 7] },
    tranquilo: { nome: 'Tranquilo', baralho: 'classico', cats: [1, 2, 3, 4, 6, 7] },
    engracado: { nome: 'Engraçado', baralho: 'classico', cats: [1, 3, 6, 7] },
    profundo: { nome: 'Profundo', baralho: 'classico', cats: [2, 4, 5, 6, 7] }
  };
  /* Os três baralhos que aparecem no começo, cada um com seus tons e o tom já marcado */
  var BARALHOS = {
    classico: { nome: 'Normal', modos: ['completo', 'tranquilo', 'engracado', 'profundo'], padrao: 'completo' }
  };
  var REACOES = ['coracao', 'estrela', 'risada', 'uau'];
  var CORES = ['#e0b154', '#a9bb63', '#e08a74', '#7fbcae', '#d99ab0', '#9db5dc', '#e6d197', '#c4a283'];

  function erro(msg) { var e = new Error(msg); e.jogo = true; return e; }
  function agora() { return Date.now(); }

  function limpa(txt, max) {
    return String(txt == null ? '' : txt)
      .replace(/[\u0000-\u001f\u007f]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, max);
  }

  function embaralha(lista, rnd) {
    for (var i = lista.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t = lista[i]; lista[i] = lista[j]; lista[j] = t;
    }
    return lista;
  }

  function cartaPorId(cartas, id) {
    for (var i = 0; i < cartas.length; i++) if (cartas[i].id === id) return cartas[i];
    return null;
  }

  function jogador(s, pid) {
    for (var i = 0; i < s.jogadores.length; i++) if (s.jogadores[i].id === pid) return s.jogadores[i];
    return null;
  }

  function ativos(s) { return s.jogadores.filter(function (j) { return !j.saiu; }); }

  function mensagem(s, m) {
    s.seq += 1;
    m.n = s.seq;
    m.t = agora();
    s.msgs.push(m);
    while (s.msgs.length > MAX_MSGS) s.msgs.shift();
    return m;
  }

  function aviso(s, txt) { return mensagem(s, { tipo: 'sis', txt: txt }); }

  function nomeLivre(s, nome) {
    var base = nome, n = 2;
    var usado = function (x) {
      return ativos(s).some(function (j) { return j.nome.toLowerCase() === x.toLowerCase(); });
    };
    while (usado(nome)) { nome = base.slice(0, MAX_NOME - 3) + ' ' + n; n++; }
    return nome;
  }

  /* id é a conta da pessoa; tok é uma chave dela que o servidor guarda e nunca mostra */
  function sentar(s, nomeBruto, id, tok) {
    var nome = limpa(nomeBruto, MAX_NOME);
    if (nome.length < 2) throw erro('Escreva um nome com pelo menos 2 letras.');
    if (!id || !tok) throw erro('Entre na sua conta para sentar à mesa.');
    var usadas = ativos(s).map(function (j) { return j.cor; });
    var cor = CORES.filter(function (c) { return usadas.indexOf(c) < 0; })[0] || CORES[s.jogadores.length % CORES.length];
    var j = {
      id: id,
      tok: tok,
      nome: nomeLivre(s, nome),
      cor: cor,
      entrou: agora(),
      saiu: false,
      ultMsg: 0
    };
    s.jogadores.push(j);
    return j;
  }

  function autentica(s, o) {
    var j = jogador(s, o.pid);
    if (!j || j.tok !== o.tok || j.saiu) throw erro('Você não está nesta mesa. Entre de novo pelo link do convite.');
    return j;
  }

  function daVez(s) { return s.vezId ? jogador(s, s.vezId) : null; }

  function passaVez(s) {
    var n = s.jogadores.length;
    var i = -1;
    for (var k = 0; k < n; k++) if (s.jogadores[k].id === s.vezId) i = k;
    for (var p = 1; p <= n; p++) {
      var c = s.jogadores[(i + p) % n];
      if (!c.saiu) {
        if (i + p >= n) s.rodada += 1;
        s.vezId = c.id;
        return c;
      }
    }
    s.vezId = null;
    return null;
  }

  function devolveCarta(s) {
    if (s.carta) { s.descarte.push(s.carta.id); s.carta = null; }
  }

  function puxa(s, pos, rnd) {
    if (!s.monte.length) {
      s.monte = embaralha(s.descarte.slice(), rnd);
      s.descarte = [];
    }
    if (!s.monte.length) throw erro('O baralho acabou.');
    var limite = Math.min(7, s.monte.length);
    var i = Math.floor(Number(pos));
    if (!(i >= 0 && i < limite)) i = Math.floor(rnd() * limite);
    return s.monte.splice(i, 1)[0];
  }

  function exigeJogo(s) {
    if (s.status === 'espera') throw erro('A partida ainda não começou.');
    if (s.status === 'fim') throw erro('Esta mesa foi encerrada.');
  }

  /* ---------- ações ---------- */

  function criarSala(o, ctx) {
    var cap = Number(o.cap);
    if (CAPS.indexOf(cap) < 0) throw erro('Escolha 2, 4, 6 ou 8 lugares.');
    var modo = MODOS[o.modo] ? o.modo : 'completo';
    var ids = ctx.cartas
      .filter(function (c) { return MODOS[modo].cats.indexOf(c.cat) >= 0; })
      .map(function (c) { return c.id; });
    var t = agora();
    var s = {
      v: 2, cod: o.cod, criada: t, atualizada: t, cap: cap, modo: modo, status: 'espera',
      anfitriao: null, jogadores: [], vezId: null, rodada: 1,
      monte: embaralha(ids, ctx.rnd), descarte: [], carta: null,
      msgs: [], seq: 0, sorteadas: 0
    };
    var j = sentar(s, o.nome, o.pid, o.tok);
    s.anfitriao = j.id;
    aviso(s, j.nome + ' abriu a mesa.');
    return { sala: s, jogador: j };
  }

  function entrar(s, o, ctx) {
    var volta = o.pid ? jogador(s, o.pid) : null;
    if (volta && volta.tok === o.tok) {
      if (volta.saiu) {
        if (volta.fora) throw erro('Quem organiza a mesa tirou você dela.');
        if (s.status === 'fim') return volta;
        if (ativos(s).length >= s.cap) throw erro('A mesa está cheia.');
        volta.saiu = false;
        aviso(s, volta.nome + ' voltou para a mesa.');
      }
      return volta;
    }
    if (s.status === 'fim') throw erro('Esta mesa foi encerrada.');
    if (ativos(s).length >= s.cap) throw erro('A mesa está cheia: todos os ' + s.cap + ' lugares estão ocupados.');
    var j = sentar(s, o.nome, o.pid, o.tok);
    aviso(s, j.nome + ' sentou à mesa.');
    if (!s.anfitriao || !jogador(s, s.anfitriao) || jogador(s, s.anfitriao).saiu) s.anfitriao = j.id;
    return j;
  }

  function iniciar(s, o, ctx) {
    var j = autentica(s, o);
    if (s.anfitriao !== j.id) throw erro('Só quem abriu a mesa pode começar.');
    if (s.status !== 'espera') throw erro('A partida já começou.');
    var a = ativos(s);
    if (a.length < 2) throw erro('Espere pelo menos mais uma pessoa chegar.');
    s.status = 'jogo';
    s.vezId = a[Math.floor(ctx.rnd() * a.length)].id;
    aviso(s, 'A partida começou. ' + daVez(s).nome + ' abre o baralho.');
  }

  function tirar(s, o, ctx) {
    var j = autentica(s, o);
    exigeJogo(s);
    if (s.vezId !== j.id) throw erro('Ainda não é a sua vez.');
    if (s.carta) throw erro('Você já tem uma carta na mão.');
    var id = puxa(s, o.pos, ctx.rnd);
    var c = cartaPorId(ctx.cartas, id);
    s.carta = { id: id, por: j.id, trocas: 0, todos: !!(c && c.todos) };
    s.sorteadas += 1;
    mensagem(s, { tipo: 'carta', de: j.id, carta: id });
  }

  function trocar(s, o, ctx) {
    var j = autentica(s, o);
    exigeJogo(s);
    if (s.vezId !== j.id || !s.carta) throw erro('Não há carta sua para trocar.');
    if (s.carta.trocas >= 2) throw erro('Você já trocou de carta duas vezes nesta vez.');
    var trocas = s.carta.trocas + 1;
    devolveCarta(s);
    var id = puxa(s, null, ctx.rnd);
    var c = cartaPorId(ctx.cartas, id);
    s.carta = { id: id, por: j.id, trocas: trocas, todos: !!(c && c.todos) };
    s.sorteadas += 1;
    mensagem(s, { tipo: 'carta', de: j.id, carta: id, troca: true });
  }

  function encerrarVez(s, o, ctx, passou) {
    var j = autentica(s, o);
    exigeJogo(s);
    var vez = daVez(s);
    var dono = vez && vez.id === j.id;
    var ultimo = ctx.online && vez ? ctx.online[vez.id] || 0 : 0;
    var ausente = vez && agora() - ultimo > AUSENTE_MS;
    if (!dono && s.anfitriao !== j.id && !ausente) throw erro('Só quem está na vez pode encerrá-la.');
    devolveCarta(s);
    if (dono) aviso(s, passou ? j.nome + ' passou a vez.' : j.nome + ' encerrou a vez.');
    else aviso(s, j.nome + ' pulou a vez de ' + (vez ? vez.nome : 'alguém') + '.');
    var prox = passaVez(s);
    if (prox) aviso(s, 'Vez de ' + prox.nome + '.');
  }

  function retirar(s, alvo, texto) {
    alvo.saiu = true;
    aviso(s, texto);
    var restam = ativos(s);
    if (s.anfitriao === alvo.id && restam.length) {
      s.anfitriao = restam[0].id;
      aviso(s, restam[0].nome + ' agora organiza a mesa.');
    }
    if (!restam.length) { s.status = 'fim'; s.vezId = null; devolveCarta(s); return; }
    if (s.status === 'jogo' && s.vezId === alvo.id) {
      devolveCarta(s);
      var prox = passaVez(s);
      if (prox) aviso(s, 'Vez de ' + prox.nome + '.');
    }
  }

  function sair(s, o) {
    var j = autentica(s, o);
    retirar(s, j, j.nome + ' saiu da mesa.');
  }

  function remover(s, o) {
    var j = autentica(s, o);
    if (s.anfitriao !== j.id) throw erro('Só quem organiza a mesa pode tirar alguém.');
    var alvo = jogador(s, o.alvo);
    if (!alvo || alvo.saiu || alvo.id === j.id) throw erro('Essa pessoa não está na mesa.');
    alvo.fora = true;
    retirar(s, alvo, alvo.nome + ' saiu da mesa a pedido de quem organiza.');
  }

  function falar(s, o) {
    var j = autentica(s, o);
    if (s.status === 'fim') throw erro('Esta mesa foi encerrada.');
    var t = agora();
    if (o.rea) {
      if (REACOES.indexOf(o.rea) < 0) throw erro('Reação desconhecida.');
      if (t - (j.ultMsg || 0) < 600) throw erro('Calma, uma reação de cada vez.');
      j.ultMsg = t;
      mensagem(s, { tipo: 'rea', de: j.id, rea: o.rea });
      return;
    }
    var txt = limpa(o.txt, MAX_TXT);
    if (!txt) throw erro('Escreva alguma coisa antes de enviar.');
    if (t - (j.ultMsg || 0) < 600) throw erro('Uma mensagem de cada vez.');
    j.ultMsg = t;
    var m = { tipo: 'msg', de: j.id, txt: txt };
    if (s.carta && (s.carta.por === j.id || s.carta.todos)) { m.tipo = 'resp'; m.carta = s.carta.id; }
    mensagem(s, m);
  }

  function encerrarMesa(s, quem) {
    devolveCarta(s);
    s.status = 'fim';
    s.vezId = null;
    aviso(s, quem ? quem + ' encerrou a mesa.' : 'A mesa foi encerrada pela organização.');
  }

  function fechar(s, o) {
    var j = autentica(s, o);
    if (s.anfitriao !== j.id) throw erro('Só quem organiza a mesa pode encerrá-la.');
    encerrarMesa(s, j.nome);
  }

  var ACOES = {
    iniciar: iniciar,
    tirar: tirar,
    trocar: trocar,
    concluir: function (s, o, ctx) { encerrarVez(s, o, ctx, false); },
    passar: function (s, o, ctx) { encerrarVez(s, o, ctx, true); },
    sair: sair,
    remover: remover,
    msg: falar,
    fechar: fechar
  };

  function aplicar(s, acao, o, ctx) {
    if (!ACOES[acao]) throw erro('Ação desconhecida.');
    ACOES[acao](s, o, ctx);
    s.atualizada = agora();
  }

  /* O que cada pessoa recebe: sem os tokens e sem a ordem do monte. */
  function vista(s, pid, desde, online) {
    var t = agora();
    desde = Number(desde) || 0;
    return {
      cod: s.cod, cap: s.cap, modo: s.modo, modoNome: MODOS[s.modo].nome, baralho: MODOS[s.modo].baralho, status: s.status,
      anfitriao: s.anfitriao, vezId: s.vezId, rodada: s.rodada,
      carta: s.carta ? { id: s.carta.id, por: s.carta.por, trocas: s.carta.trocas, todos: s.carta.todos } : null,
      monte: s.monte.length, descarte: s.descarte.length, sorteadas: s.sorteadas, seq: s.seq,
      jogadores: s.jogadores.map(function (j) {
        var visto = online ? online[j.id] || 0 : 0;
        return { id: j.id, nome: j.nome, cor: j.cor, saiu: j.saiu, online: t - visto < ONLINE_MS, ausente: t - visto > AUSENTE_MS };
      }),
      msgs: s.msgs.filter(function (m) { return m.n > desde; }),
      eu: pid || null
    };
  }

  return {
    CAPS: CAPS, MODOS: MODOS, BARALHOS: BARALHOS, REACOES: REACOES, MAX_TXT: MAX_TXT, MAX_NOME: MAX_NOME,
    criarSala: criarSala, jogador: jogador, entrar: entrar, aplicar: aplicar,
    vista: vista, encerrarMesa: encerrarMesa, ativos: ativos, cartaPorId: cartaPorId, limpa: limpa
  };
})();

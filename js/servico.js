/* Entre Nós — o que o servidor faz: contas, sessões, quem está online, convites e as mesas.
   O mesmo arquivo roda no Apps Script (Servico.gs) e no navegador (modo demonstração).
   Tudo o que toca planilha, cache, trava ou criptografia chega pronto em "io". */
var Servico = function (io) {
  var SESSAO_DIAS = 30;
  var ONLINE_MS = 30000;
  var CONVITE_MS = 15 * 60000;
  var RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var RE_APELIDO = /^[\p{L}\p{N} ._-]+$/u;
  var RE_MESA = /^[a-z0-9]{12}$/;
  var ACOES_MESA = ['iniciar', 'tirar', 'trocar', 'concluir', 'passar', 'sair', 'remover', 'msg', 'fechar'];

  function erro(msg, extra) { var e = new Error(msg); e.jogo = true; if (extra) e[extra] = true; return e; }
  function agora() { return io.agora(); }

  /* ---------- sessão: uid.validade.assinatura, nada guardado no servidor ---------- */
  function abrirSessao(u) {
    var exp = Math.floor(agora() / 1000 + SESSAO_DIAS * 86400).toString(36);
    var corpo = u.uid + '.' + exp;
    return corpo + '.' + io.assina('s.' + corpo).slice(0, 40);
  }

  function sessao(p) {
    var partes = String(p.ses || '').split('.');
    var sair = erro('Sua sessão terminou. Entre de novo na sua conta.', 'sessao');
    if (partes.length !== 3) throw sair;
    var corpo = partes[0] + '.' + partes[1];
    if (io.assina('s.' + corpo).slice(0, 40) !== partes[2]) throw sair;
    if (parseInt(partes[1], 36) * 1000 < agora()) throw sair;
    var u = io.usuarios.porId(partes[0]);
    if (!u) throw sair;
    return u;
  }

  function publico(u) { return { uid: u.uid, nome: u.nome, apelido: u.apelido, email: u.email }; }

  /* ---------- contas ---------- */
  function cadastro(p) {
    var nome = Logica.limpa(p.nome, 60);
    var email = String(p.email || '').trim().toLowerCase().slice(0, 120);
    var apelido = Logica.limpa(p.apelido, Logica.MAX_NOME);
    var senha = String(p.senha || '');
    if (nome.length < 2) throw erro('Escreva seu nome.');
    if (!RE_EMAIL.test(email)) throw erro('Esse e-mail não parece certo. Confira.');
    if (apelido.length < 2) throw erro('O apelido precisa de pelo menos 2 letras.');
    if (!RE_APELIDO.test(apelido)) throw erro('No apelido, use só letras, números, espaço, ponto, hífen ou sublinhado.');
    if (senha.length < 8) throw erro('A senha precisa de pelo menos 8 caracteres.');
    if (senha.length > 100) throw erro('Senha longa demais.');
    return io.trava(function () {
      var n = Number(io.kv.get('cad_n') || 0);
      if (n > 60) throw erro('Muitos cadastros agora. Tente de novo em alguns minutos.');
      if (io.usuarios.porEmail(email)) throw erro('Já existe uma conta com esse e-mail. Use a aba Entrar.');
      if (io.usuarios.porApelido(apelido)) throw erro('Esse apelido já tem dono. Tente outro.');
      var sal = io.id(16);
      var u = {
        uid: 'u' + io.id(11), criado: agora(), nome: nome, email: email, apelido: apelido,
        sal: sal, hash: io.hashSenha(senha, sal), chave: io.id(24)
      };
      io.usuarios.criar(u);
      io.kv.put('cad_n', n + 1, 600);
      return { ses: abrirSessao(u), eu: publico(u) };
    });
  }

  function login(p) {
    var email = String(p.email || '').trim().toLowerCase().slice(0, 120);
    var senha = String(p.senha || '');
    var chave = 'lf_' + email;
    var falhas = Number(io.kv.get(chave) || 0);
    if (falhas >= 8) throw erro('Muitas tentativas com esse e-mail. Espere 15 minutos.');
    var u = email && senha ? io.usuarios.porEmail(email) : null;
    if (!u || io.hashSenha(senha, u.sal) !== u.hash) {
      io.kv.put(chave, falhas + 1, 900);
      throw erro('E-mail ou senha não conferem.');
    }
    if (falhas) io.kv.put(chave, 0, 1);
    if (io.usuarios.entrou) io.usuarios.entrou(u.uid, agora());
    return { ses: abrirSessao(u), eu: publico(u) };
  }

  /* ---------- quem está online: um mapa curto, regravado no máximo a cada 15 s por pessoa ---------- */
  function marcarOnline(u, mesa) {
    var mapa = io.kv.get('online') || {};
    var meu = mapa[u.uid];
    if (meu && agora() - meu[1] < 15000 && meu[2] === mesa) return mapa;
    try {
      return io.trava(function () {
        var m = io.kv.get('online') || {};
        var t = agora();
        Object.keys(m).forEach(function (k) { if (t - m[k][1] > 120000) delete m[k]; });
        m[u.uid] = [u.apelido, t, mesa || ''];
        io.kv.put('online', m, 600);
        return m;
      });
    } catch (e) { return mapa; } // servidor ocupado: marca na próxima
  }

  function listaOnline(mapa, uid) {
    var t = agora();
    return Object.keys(mapa)
      .filter(function (k) { return k !== uid && t - mapa[k][1] < ONLINE_MS; })
      .map(function (k) { return { uid: k, apelido: mapa[k][0], jogando: !!mapa[k][2] }; })
      .sort(function (a, b) { return a.apelido.localeCompare(b.apelido); })
      .slice(0, 60);
  }

  function convitesDe(uid) {
    var t = agora();
    return (io.kv.get('cv_' + uid) || []).filter(function (c) { return t - c.t < CONVITE_MS; });
  }

  function lembrarMesa(uid, mesa) {
    var l = (io.kv.get('um_' + uid) || []).filter(function (x) { return x !== mesa; });
    l.unshift(mesa);
    io.kv.put('um_' + uid, l.slice(0, 6), 21600);
  }

  function minhasMesas(uid) {
    return (io.kv.get('um_' + uid) || []).map(function (id) {
      var s = io.salas.ler(id);
      if (!s || s.status === 'fim') return null;
      var j = Logica.jogador(s, uid);
      if (!j || j.fora) return null;
      return { mesa: id, baralho: Logica.MODOS[s.modo].baralho, modoNome: Logica.MODOS[s.modo].nome,
        status: s.status, pessoas: Logica.ativos(s).length, cap: s.cap, saiu: j.saiu };
    }).filter(Boolean);
  }

  function painel(p) {
    var u = sessao(p);
    var mapa = marcarOnline(u, '');
    return { eu: publico(u), online: listaOnline(mapa, u.uid), convites: convitesDe(u.uid), mesas: minhasMesas(u.uid) };
  }

  /* ---------- mesas ---------- */
  function mesaId(p) {
    var id = String(p.mesa || '').trim().toLowerCase();
    if (!RE_MESA.test(id)) throw erro('Este link de mesa está incompleto. Peça o convite de novo.');
    return id;
  }

  function carregar(id) {
    var s = io.salas.ler(id);
    if (!s) throw erro('Esta mesa não existe ou o link está incompleto.');
    return s;
  }

  function ctx(id, s) { return { rnd: io.rnd, cartas: io.cartas, online: s ? online(id, s) : {} }; }

  function tocar(id, uid) { io.kv.put('o_' + id + '_' + uid, agora(), 600); }

  function online(id, s) {
    var got = io.kv.getAll(s.jogadores.map(function (j) { return 'o_' + id + '_' + j.id; }));
    var on = {};
    s.jogadores.forEach(function (j) { var v = got['o_' + id + '_' + j.id]; if (v) on[j.id] = Number(v); });
    return on;
  }

  function vista(id, s, uid, desde) { return Logica.vista(s, uid, desde, online(id, s)); }

  function criar(p) {
    var u = sessao(p);
    var b = Logica.BARALHOS[p.baralho] ? p.baralho : 'classico';
    var modo = Logica.BARALHOS[b].modos.indexOf(p.modo) >= 0 ? p.modo : Logica.BARALHOS[b].padrao;
    return io.trava(function () {
      var id;
      do { id = io.id(12); } while (io.salas.ler(id));
      var r = Logica.criarSala({ cod: id, nome: u.apelido, pid: u.uid, tok: u.chave, cap: p.cap, modo: modo }, ctx(id));
      io.salas.gravar(r.sala, 0);
      tocar(id, u.uid);
      lembrarMesa(u.uid, id);
      return { mesa: id, vista: vista(id, r.sala, u.uid, 0) };
    });
  }

  function entrar(p) {
    var u = sessao(p);
    var id = mesaId(p);
    return io.trava(function () {
      var s = carregar(id);
      var antes = s.seq;
      Logica.entrar(s, { nome: u.apelido, pid: u.uid, tok: u.chave }, ctx(id, s));
      if (s.seq !== antes) { s.atualizada = agora(); io.salas.gravar(s, antes); }
      tocar(id, u.uid);
      lembrarMesa(u.uid, id);
      var cv = io.kv.get('cv_' + u.uid);
      if (cv && cv.some(function (c) { return c.mesa === id; })) {
        io.kv.put('cv_' + u.uid, cv.filter(function (c) { return c.mesa !== id; }), 900);
      }
      return vista(id, s, u.uid, 0);
    });
  }

  function estado(p) {
    var u = sessao(p);
    var id = mesaId(p);
    var s = carregar(id);
    var j = Logica.jogador(s, u.uid);
    var sentado = j && !j.saiu;
    if (sentado) tocar(id, u.uid);
    var mapa = marcarOnline(u, sentado && s.status !== 'fim' ? id : '');
    var v = vista(id, s, u.uid, p.desde);
    v.fora = !!(j && j.fora);
    if (p.online) v.online = listaOnline(mapa, u.uid);
    return v;
  }

  function convidar(p) {
    var u = sessao(p);
    var id = mesaId(p);
    var s = carregar(id);
    var eu = Logica.jogador(s, u.uid);
    if (!eu || eu.saiu) throw erro('Sente à mesa antes de convidar alguém.');
    if (s.status === 'fim') throw erro('Esta mesa foi encerrada.');
    if (Logica.ativos(s).length >= s.cap) throw erro('A mesa está cheia.');
    var alvo = io.usuarios.porId(String(p.para || ''));
    if (!alvo || alvo.uid === u.uid) throw erro('Não encontramos essa pessoa.');
    var la = Logica.jogador(s, alvo.uid);
    if (la && !la.saiu) throw erro(alvo.apelido + ' já está nesta mesa.');
    if (la && la.fora) throw erro(alvo.apelido + ' foi tirado desta mesa.');
    return io.trava(function () {
      var n = Number(io.kv.get('cvn_' + u.uid) || 0);
      if (n >= 30) throw erro('Você mandou muitos convites seguidos. Espere alguns minutos.');
      io.kv.put('cvn_' + u.uid, n + 1, 600);
      var l = convitesDe(alvo.uid).filter(function (c) { return c.mesa !== id; });
      l.unshift({ id: io.id(8), mesa: id, de: u.apelido, baralho: Logica.MODOS[s.modo].baralho,
        modoNome: Logica.MODOS[s.modo].nome, pessoas: Logica.ativos(s).length, cap: s.cap, t: agora() });
      io.kv.put('cv_' + alvo.uid, l.slice(0, 10), 900);
      return { ok: true, para: alvo.apelido };
    });
  }

  function recusar(p) {
    var u = sessao(p);
    return io.trava(function () {
      io.kv.put('cv_' + u.uid, convitesDe(u.uid).filter(function (c) { return c.id !== p.convite; }), 900);
      return { convites: convitesDe(u.uid) };
    });
  }

  function jogada(acao, p) {
    var u = sessao(p);
    var id = mesaId(p);
    return io.trava(function () {
      var s = carregar(id);
      var antes = s.seq;
      var o = {};
      Object.keys(p).forEach(function (k) { if (k !== 'ses') o[k] = p[k]; });
      o.pid = u.uid; o.tok = u.chave;
      Logica.aplicar(s, acao, o, ctx(id, s));
      io.salas.gravar(s, antes);
      tocar(id, u.uid);
      return vista(id, s, u.uid, p.desde);
    });
  }

  var ROTAS = {
    cadastro: cadastro, login: login,
    eu: function (p) { return { eu: publico(sessao(p)) }; },
    painel: painel, criar: criar, entrar: entrar, estado: estado, convidar: convidar, recusar: recusar
  };

  return {
    rotear: function (p) {
      var acao = String(p.acao || '');
      if (ROTAS[acao]) return ROTAS[acao](p);
      if (ACOES_MESA.indexOf(acao) >= 0) return jogada(acao, p);
      throw erro('Ação desconhecida.');
    }
  };
};

/* Resumo da área do organizador, montado igual no Apps Script e no modo demonstração */
function resumoAdmin(salas, contagem, usuarios) {
  salas.sort(function (a, b) { return b.atualizada - a.atualizada; });
  var tot = { salas: salas.length, abertas: 0, jogadores: 0, sorteadas: 0, mensagens: 0, contas: usuarios.length };
  salas.forEach(function (s) {
    if (s.status !== 'fim') tot.abertas++;
    tot.jogadores += s.jogadores; tot.sorteadas += s.sorteadas; tot.mensagens += s.mensagens;
  });
  var ranking = Object.keys(contagem).map(function (id) { return { id: Number(id), vezes: contagem[id] }; })
    .sort(function (a, b) { return b.vezes - a.vezes; });
  usuarios.sort(function (a, b) { return b.criado - a.criado; });
  return { totais: tot, salas: salas.slice(0, 60), cartas: ranking, usuarios: usuarios.slice(0, 200) };
}

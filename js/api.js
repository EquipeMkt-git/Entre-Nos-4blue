/* Entre Nós — conversa com o servidor (Apps Script) ou, sem servidor, com um servidor de mentira guardado no navegador. */

/* Em localhost, abrir qualquer página com ?demo força o modo demonstração nesta aba (para testar sem mexer no config.js) */
var URL_SERVIDOR = (function () {
  try {
    if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname) && /[?&]demo\b/.test(location.search)) sessionStorage.setItem('en_demo', '1');
    if (sessionStorage.getItem('en_demo') === '1') return '';
  } catch (e) {}
  return (window.CONFIG && CONFIG.API_URL || '').trim();
})();
var Sessao = (function () {
  var remoto = !!URL_SERVIDOR;
  /* No modo demonstração a conta fica só nesta aba, para testar várias pessoas no mesmo navegador */
  var loja = function () { return remoto ? localStorage : sessionStorage; };
  return {
    ler: function () { try { return JSON.parse(loja().getItem('en_sessao')) || null; } catch (e) { return null; } },
    gravar: function (r) { try { loja().setItem('en_sessao', JSON.stringify({ ses: r.ses, eu: r.eu })); } catch (e) {} },
    sair: function () { try { loja().removeItem('en_sessao'); } catch (e) {} },
    /* manda para a entrada e volta para esta página depois do login */
    exigir: function () {
      var s = this.ler();
      if (!s) location.replace('./?volta=' + encodeURIComponent(location.pathname.split('/').pop() + location.search));
      return s;
    }
  };
})();

var Api = (function () {
  var URL_API = URL_SERVIDOR;
  var remoto = !!URL_API;

  function falha(msg, sessao) { var e = new Error(msg); if (sessao) e.sessao = true; return e; }

  function remota(acao, dados) {
    var corpo = Object.assign({ acao: acao }, dados || {});
    /* text/plain evita a checagem prévia de CORS que o Apps Script não responde; POST tira a sessão do endereço */
    return fetch(URL_API, { method: 'POST', body: JSON.stringify(corpo) })
      .then(function (r) { return r.json(); })
      .catch(function () { throw falha('Sem conexão com o servidor. Tentando de novo...'); })
      .then(function (r) {
        if (!r.ok) throw falha(r.erro || 'Algo deu errado.', r.sessao);
        return r.dados;
      });
  }

  /* ---------- modo demonstração: o mesmo Servico, com o localStorage no lugar da planilha ---------- */
  var servidorLocal = null;
  function hashDemo(txt) {
    var out = '';
    for (var k = 0; k < 4; k++) {
      var h1 = 0xdeadbeef ^ k, h2 = 0x41c6ce57 ^ k;
      for (var i = 0; i < txt.length; i++) {
        var ch = txt.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677);
      }
      h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
      h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
      out += (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
    }
    return out;
  }
  function lerJSON(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function gravarJSON(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  function usuarios() { return lerJSON('en_demo_usuarios') || []; }

  function local() {
    if (servidorLocal) return servidorLocal;
    var ALFA = 'abcdefghijkmnpqrstuvwxyz23456789';
    var kv = {
      get: function (k) {
        var x = lerJSON('en_demo_kv_' + k);
        return x && x.ate > Date.now() ? x.v : null;
      },
      put: function (k, v, seg) { gravarJSON('en_demo_kv_' + k, { v: v, ate: Date.now() + seg * 1000 }); },
      getAll: function (ks) {
        var o = {};
        ks.forEach(function (k) { var v = kv.get(k); if (v != null) o[k] = JSON.stringify(v); });
        return o;
      }
    };
    servidorLocal = Servico({
      agora: Date.now,
      rnd: Math.random,
      id: function (n) {
        var b = new Uint8Array(n), s = '';
        crypto.getRandomValues(b);
        for (var i = 0; i < n; i++) s += ALFA.charAt(b[i] % ALFA.length);
        return s;
      },
      hashSenha: function (senha, sal) { return hashDemo(sal + ':' + senha); },
      assina: function (txt) { return hashDemo('demo:' + txt); },
      trava: function (fn) { return fn(); },
      cartas: CARTAS,
      kv: kv,
      salas: {
        ler: function (id) { return lerJSON('en_demo_sala_' + id); },
        gravar: function (s) { gravarJSON('en_demo_sala_' + s.cod, s); }
      },
      usuarios: {
        porId: function (uid) { return usuarios().filter(function (u) { return u.uid === uid; })[0] || null; },
        porEmail: function (e) { return usuarios().filter(function (u) { return u.email === e.toLowerCase(); })[0] || null; },
        porApelido: function (a) { return usuarios().filter(function (u) { return u.apelido.toLowerCase() === a.toLowerCase(); })[0] || null; },
        criar: function (u) { var l = usuarios(); u.ultimo = u.criado; l.push(u); gravarJSON('en_demo_usuarios', l); },
        entrou: function (uid, t) {
          var l = usuarios();
          l.forEach(function (u) { if (u.uid === uid) u.ultimo = t; });
          gravarJSON('en_demo_usuarios', l);
        }
      }
    });
    return servidorLocal;
  }

  function adminLocal(d) {
    if (d.senha !== 'demo') throw falha('Senha incorreta. No modo demonstração a senha é demo.');
    var salas = [];
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k.indexOf('en_demo_sala_') === 0) { var s = lerJSON(k); if (s && s.jogadores) salas.push(s); }
    }
    if (d.op === 'encerrar') {
      salas.forEach(function (s) {
        if (s.cod === d.cod && s.status !== 'fim') { Logica.encerrarMesa(s); gravarJSON('en_demo_sala_' + s.cod, s); }
      });
    }
    var contagem = {};
    salas.forEach(function (s) {
      s.msgs.forEach(function (m) { if (m.tipo === 'carta') contagem[m.carta] = (contagem[m.carta] || 0) + 1; });
    });
    return resumoAdmin(salas.map(function (s) {
      var a = Logica.ativos(s);
      return { cod: s.cod, criada: s.criada, atualizada: s.atualizada, status: s.status, cap: s.cap, modo: Logica.MODOS[s.modo].nome,
        jogadores: a.length, nomes: a.map(function (j) { return j.nome; }).join(', '), sorteadas: s.sorteadas, mensagens: s.seq };
    }), contagem, usuarios().map(function (u) {
      return { apelido: u.apelido, nome: u.nome, email: u.email, criado: u.criado, ultimo: u.ultimo || u.criado };
    }));
  }

  function chamarLocal(acao, d) {
    return new Promise(function (ok) { setTimeout(ok, 120); }).then(function () {
      try {
        return acao === 'admin' ? adminLocal(d) : local().rotear(Object.assign({ acao: acao }, d));
      } catch (e) {
        throw falha(e.message, e.sessao);
      }
    });
  }

  return {
    remoto: remoto,
    /* Chama o servidor já com a sessão. Sessão vencida: limpa e volta para a entrada. */
    chamar: function (acao, dados) {
      var s = Sessao.ler();
      var d = Object.assign({}, dados || {});
      if (s && acao !== 'admin') d.ses = s.ses;
      var p = remoto ? remota(acao, d) : chamarLocal(acao, d);
      return p.catch(function (e) {
        if (e.sessao && acao !== 'login' && acao !== 'cadastro') {
          Sessao.sair();
          Sessao.exigir();
        }
        throw e;
      });
    }
  };
})();

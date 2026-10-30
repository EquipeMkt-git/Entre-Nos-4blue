/* Entre Nós — salão: abrir mesa, convites recebidos, quem está online e as mesas em andamento */
(function () {
  var sessao = Sessao.exigir();
  if (!sessao) return;
  if (!Api.remoto) document.getElementById('demo-aviso').hidden = false;

  var form = document.getElementById('f-mesa');
  var caixaConvites = document.getElementById('convites');
  var listaOnline = document.getElementById('online');
  var chamarJa = document.getElementById('chamar-ja');
  var escolhidos = {};      // uid -> apelido de quem vai receber convite ao abrir a mesa
  var vistosConvites = {};
  var timer = null;
  var painel = null;

  /* ---------- quem sou eu ---------- */
  function desenharEu(eu) {
    document.getElementById('b-eu').innerHTML = avatar(eu.apelido, '#ffb84d') + '<span class="some-celular">' + esc(eu.apelido) + '</span>';
  }
  desenharEu(sessao.eu);
  document.getElementById('b-eu').addEventListener('click', function () {
    var eu = (painel && painel.eu) || sessao.eu;
    var f = abrirFolha('Sua conta',
      '<div class="perfil">' + avatar(eu.apelido, '#ffb84d') + '<div><b>' + esc(eu.apelido) + '</b><p>' + esc(eu.nome) + '</p><p>' + esc(eu.email) + '</p></div></div>' +
      '<p class="dica">Seu apelido é o que aparece para os outros jogadores.</p>' +
      '<button class="btn btn-fantasma" type="button" id="b-sair-conta">' + icone('sair') + 'Sair da conta</button>');
    f.querySelector('#b-sair-conta').addEventListener('click', function () { Sessao.sair(); location.href = './'; });
  });

  /* ---------- baralho, tom e lugares ---------- */
  var grade = document.getElementById('baralhos');
  grade.innerHTML = Object.keys(Logica.BARALHOS).map(function (b, i) {
    var info = BARALHO_INFO[b], B = Logica.BARALHOS[b];
    return '<label class="baralho-op" style="--c:' + info.cor + ';--i:' + i + '">' +
      '<input type="radio" name="baralho" value="' + b + '"' + (i === 0 ? ' checked' : '') + '>' +
      '<span class="cartinha">' + versoSVG(b) + '</span>' +
      '<span class="txt"><b>' + info.nome + '</b><small>' + info.desc + '</small><em>' + cartasDoBaralho(b) + ' cartas</em></span>' +
      '</label>';
  }).join('');

  try { var ultimo = localStorage.getItem('en_baralho'); if (Logica.BARALHOS[ultimo]) form.baralho.value = ultimo; } catch (e) {}

  function desenharTons() {
    var b = form.baralho.value;
    var B = Logica.BARALHOS[b];
    document.getElementById('tons').innerHTML = '<legend>Tom</legend>' + B.modos.map(function (m) {
      return '<label><input type="radio" name="modo" value="' + m + '"' + (m === B.padrao ? ' checked' : '') + '><span>' +
        esc(Logica.MODOS[m].nome) + '<small>' + totalCartas(m) + '</small></span></label>';
    }).join('');
    document.body.dataset.baralho = b;
  }
  grade.addEventListener('change', function (e) {
    desenharTons();
    var op = e.target.closest('.baralho-op');
    if (op) explodir(op.querySelector('.cartinha'), [BARALHO_INFO[e.target.value].icone, 'coracao', 'estrela'], 10);
  });
  desenharTons();

  /* ---------- abrir a mesa ---------- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var erro = document.getElementById('erro-mesa');
    var b = document.getElementById('b-abrir');
    erro.textContent = '';
    b.disabled = true;
    b.lastChild.textContent = 'Abrindo a mesa...';
    try { localStorage.setItem('en_baralho', form.baralho.value); } catch (x) {}
    Api.chamar('criar', { baralho: form.baralho.value, modo: form.modo.value, cap: form.cap.value })
      .then(function (r) {
        var uids = Object.keys(escolhidos);
        /* um convite de cada vez para não brigar pela trava do servidor */
        return uids.reduce(function (p, uid) {
          return p.then(function () { return Api.chamar('convidar', { mesa: r.mesa, para: uid }).catch(function () {}); });
        }, Promise.resolve()).then(function () {
          try { sessionStorage.setItem('en_chamados_' + r.mesa, JSON.stringify(uids)); } catch (x) {}
          location.href = 'jogo.html?mesa=' + r.mesa;
        });
      })
      .catch(function (err) { erro.textContent = err.message; b.disabled = false; b.lastChild.textContent = 'Abrir a mesa'; });
  });

  /* ---------- quem está online ---------- */
  function desenharOnline(lista) {
    document.getElementById('n-online').textContent = lista.length ? lista.length + (lista.length === 1 ? ' pessoa' : ' pessoas') : '';
    Object.keys(escolhidos).forEach(function (uid) {
      if (!lista.some(function (p) { return p.uid === uid; })) delete escolhidos[uid];
    });
    listaOnline.innerHTML = lista.length ? lista.map(function (p) {
      var sel = !!escolhidos[p.uid];
      return '<li><button type="button" class="pessoa" data-uid="' + esc(p.uid) + '" data-apelido="' + esc(p.apelido) + '" aria-pressed="' + sel + '">' +
        avatar(p.apelido) + '<span class="nome">' + esc(p.apelido) + '<small>' + (p.jogando ? 'jogando agora' : 'no salão') + '</small></span>' +
        '<span class="marca-chamar">' + icone(sel ? 'ok' : 'chamar') + '<span>' + (sel ? 'Vai junto' : 'Chamar') + '</span></span></button></li>';
    }).join('') : '<li class="vazio">Ninguém mais por aqui agora. Abra a mesa e mande o link no grupo.</li>';
    desenharChamarJa();
  }
  listaOnline.addEventListener('click', function (e) {
    var b = e.target.closest('.pessoa');
    if (!b) return;
    if (escolhidos[b.dataset.uid]) delete escolhidos[b.dataset.uid];
    else escolhidos[b.dataset.uid] = b.dataset.apelido;
    desenharOnline((painel && painel.online) || []);
  });
  function desenharChamarJa() {
    var nomes = Object.keys(escolhidos).map(function (k) { return escolhidos[k]; });
    chamarJa.hidden = !nomes.length;
    chamarJa.innerHTML = nomes.length ? icone('envelope') + '<span>Convite vai para <b>' + esc(nomes.join(', ')) + '</b> assim que a mesa abrir.</span>' : '';
  }

  /* ---------- convites recebidos ---------- */
  function desenharConvites(lista) {
    caixaConvites.hidden = !lista.length;
    caixaConvites.innerHTML = lista.map(function (c) {
      var info = BARALHO_INFO[c.baralho] || BARALHO_INFO.classico;
      var novo = !vistosConvites[c.id];
      vistosConvites[c.id] = 1;
      return '<article class="convite' + (novo ? ' novo' : '') + '" style="--c:' + info.cor + '">' +
        '<span class="bola">' + icone('envelope') + '</span>' +
        '<div class="txt"><b>' + esc(c.de) + ' chamou você para uma mesa</b><small>' + info.nome + ' · ' + esc(c.modoNome) + ' · ' + c.pessoas + ' de ' + c.cap + ' lugares</small></div>' +
        '<div class="acoes"><a class="btn btn-peq" href="jogo.html?mesa=' + esc(c.mesa) + '">Entrar</a>' +
        '<button class="btn btn-fantasma btn-peq" type="button" data-recusar="' + esc(c.id) + '">Agora não</button></div></article>';
    }).join('');
    var novo = caixaConvites.querySelector('.convite.novo .bola');
    if (novo) { explodir(novo, ['envelope', 'coracao', 'estrela'], 10); if (document.hidden) document.title = 'Novo convite · Entre Nós'; }
  }
  caixaConvites.addEventListener('click', function (e) {
    var b = e.target.closest('[data-recusar]');
    if (!b) return;
    b.closest('.convite').classList.add('saindo');
    Api.chamar('recusar', { convite: b.dataset.recusar })
      .then(function (r) { painel.convites = r.convites; desenharConvites(r.convites); })
      .catch(function (err) { toast(err.message, true); });
  });

  /* ---------- mesas em andamento ---------- */
  function desenharMinhas(lista) {
    document.getElementById('minhas').hidden = !lista.length;
    document.getElementById('lista-minhas').innerHTML = lista.map(function (m) {
      var info = BARALHO_INFO[m.baralho] || BARALHO_INFO.classico;
      return '<li style="--c:' + info.cor + '"><a href="jogo.html?mesa=' + esc(m.mesa) + '">' +
        '<span class="bola">' + icone(info.icone) + '</span><span class="nome">' + info.nome + ' · ' + esc(m.modoNome) +
        '<small>' + (m.status === 'jogo' ? 'Partida rolando' : 'Esperando o grupo') + ' · ' + m.pessoas + ' de ' + m.cap + '</small></span>' +
        '<span class="ir">' + (m.saiu ? 'Voltar' : 'Abrir') + '</span></a></li>';
    }).join('');
  }

  /* ---------- atualiza tudo a cada poucos segundos ---------- */
  function puxar() {
    clearTimeout(timer);
    Api.chamar('painel', {})
      .then(function (p) {
        painel = p;
        desenharEu(p.eu);
        desenharOnline(p.online);
        desenharConvites(p.convites);
        desenharMinhas(p.mesas);
        timer = setTimeout(puxar, document.hidden ? 15000 : (Api.remoto ? 5000 : 1500));
      })
      .catch(function (err) {
        if (!err.sessao) timer = setTimeout(puxar, 8000);
      });
  }
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) { document.title = 'Salão · Entre Nós 4blue'; puxar(); }
  });
  puxar();
})();

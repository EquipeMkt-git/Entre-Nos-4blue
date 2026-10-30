/* Entre Nós — a mesa: entrada pelo convite, saguão, leque de cartas, vez de cada um e a conversa */
(function () {
  var sessao = Sessao.exigir();
  if (!sessao) return;

  var palco = document.getElementById('palco');
  var chat = document.getElementById('chat');
  var caixaMsgs = document.getElementById('mensagens');
  var form = document.getElementById('compor');
  var texto = document.getElementById('texto');
  var contador = document.getElementById('contador');
  var reacoes = document.getElementById('reacoes');

  var mesa = String(new URLSearchParams(location.search).get('mesa') || '').toLowerCase();
  var eu = sessao.eu.uid;
  var vista = null;
  var online = [];
  var chamados = {};
  var seq = 0;
  var vistas = {};
  var chavePalco = '';
  var cartaMostrada = 0;
  var ocupado = false;
  var timer = null;
  var falhas = 0;
  var folhaConvite = null;

  if (!Api.remoto) document.getElementById('demo-aviso').hidden = false;
  /* quem já foi chamado no salão, ao abrir a mesa */
  try { (JSON.parse(sessionStorage.getItem('en_chamados_' + mesa)) || []).forEach(function (u) { chamados[u] = 1; }); } catch (e) {}
  if (!/^[a-z0-9]{12}$/.test(mesa)) { semMesa('Este link de mesa está incompleto. Peça o convite de novo.'); return; }

  function linkConvite() { return location.origin + location.pathname + '?mesa=' + mesa; }

  function semMesa(msg) {
    palco.innerHTML = '<div class="entrada"><h1>Mesa não encontrada</h1><p>' + esc(msg) + '</p>' +
      '<div><a class="btn" href="salao.html">Ir para o salão</a></div></div>';
  }

  function nomeDe(pid) {
    var j = vista && vista.jogadores.filter(function (x) { return x.id === pid; })[0];
    return j || { nome: 'Alguém', cor: '#c9b597' };
  }
  function sentado() {
    if (!vista) return false;
    var j = vista.jogadores.filter(function (x) { return x.id === eu; })[0];
    return !!(j && !j.saiu);
  }
  function ativos() { return vista.jogadores.filter(function (j) { return !j.saiu; }); }
  function souAnfitriao() { return vista.anfitriao === eu; }
  function minhaVez() { return vista.vezId === eu; }
  function precisaOnline() { return !!folhaConvite || (vista && sentado() && vista.status === 'espera'); }

  /* ---------- conversa com o servidor ---------- */
  function agendar(ms) {
    clearTimeout(timer);
    var base = Api.remoto ? 2200 : 900;
    timer = setTimeout(puxar, ms != null ? ms : (document.hidden ? base * 3 : base));
  }

  function puxar() {
    Api.chamar('estado', { mesa: mesa, desde: seq, online: precisaOnline() ? 1 : 0 })
      .then(function (v) { falhas = 0; aplicar(v); agendar(); })
      .catch(function (err) {
        if (err.sessao) return;
        if (!vista) { semMesa(err.message); return; }
        falhas++;
        if (falhas === 2) toast('Conexão instável. Tentando de novo...', true);
        agendar(Math.min(10000, 2000 * falhas));
      });
  }

  function acao(nome, extra) {
    if (ocupado) return Promise.resolve();
    ocupado = true;
    return Api.chamar(nome, Object.assign({ mesa: mesa, desde: seq }, extra || {}))
      .then(function (v) { aplicar(v); })
      .catch(function (err) { toast(err.message, true); chavePalco = ''; render(); throw err; })
      .finally(function () { ocupado = false; });
  }

  function aplicar(v) {
    if (vista && v.seq < seq) return;
    if (v.online) { online = v.online; desenharOnline(); }
    vista = v;
    document.body.dataset.baralho = v.baralho;
    if (sentado()) Musica.baralho(v.baralho);
    v.msgs.forEach(function (m) { if (!vistas[m.n]) { vistas[m.n] = 1; desenharMsg(m); } });
    seq = Math.max(seq, v.seq);
    render();
  }

  /* ---------- telas ---------- */
  function rotuloMesa() {
    var info = BARALHO_INFO[vista.baralho] || BARALHO_INFO.classico;
    return info.nome + ' · ' + vista.modoNome;
  }

  function render() {
    if (!vista) return;
    var info = document.getElementById('info-sala');
    info.hidden = false;
    info.textContent = rotuloMesa();
    info.style.setProperty('--c', (BARALHO_INFO[vista.baralho] || BARALHO_INFO.classico).cor);
    var dentro = sentado();
    document.getElementById('acoes-barra').hidden = !dentro;
    chat.hidden = !dentro && vista.status !== 'fim';
    form.hidden = !dentro || vista.status === 'fim';
    contador.hidden = form.hidden;
    reacoes.hidden = form.hidden;
    document.getElementById('chat-quem').textContent = ativos().length + (ativos().length === 1 ? ' pessoa' : ' pessoas');
    document.title = (dentro && vista.status === 'jogo' && minhaVez() ? 'Sua vez · ' : rotuloMesa() + ' · ') + 'Entre Nós 4blue';
    atualizarPlaceholder();

    var chave = JSON.stringify([dentro, vista.status, vista.vezId, vista.anfitriao, vista.carta, vista.monte, vista.fora,
      vista.jogadores.map(function (j) { return [j.id, j.saiu, j.online, j.ausente]; })]);
    if (chave === chavePalco) return;
    chavePalco = chave;

    if (!dentro) return telaEntrada();
    if (vista.status === 'espera') return telaSaguao();
    if (vista.status === 'jogo') return telaJogo();
    return telaFim();
  }

  function lugaresHTML(comVazios) {
    var h = ativos().map(function (j) {
      var cls = 'lugar' + (j.online ? ' on' : '') + (vista.status === 'jogo' && j.id === vista.vezId ? ' vez' : '');
      var tirar = sentado() && souAnfitriao() && j.id !== eu
        ? '<button class="tirar" type="button" data-tirar="' + j.id + '" aria-label="Tirar ' + esc(j.nome) + ' da mesa">' + icone('x') + '</button>' : '';
      return '<li class="' + cls + '" style="--c:' + j.cor + '"><span class="ini" aria-hidden="true">' + esc(j.nome.charAt(0).toUpperCase()) + '</span>' +
        '<span>' + esc(j.nome) + (j.id === eu ? ' (você)' : '') + '</span>' +
        (j.id === vista.anfitriao ? '<svg class="ico coroa" viewBox="0 0 24 24" role="img" aria-label="organiza a mesa">' + ICONES.coroa + '</svg>' : '') +
        (j.online ? '' : '<span class="oculto">fora do ar</span>') + tirar + '</li>';
    }).join('');
    if (comVazios) for (var i = ativos().length; i < vista.cap; i++) h += '<li class="lugar vazio"><span class="ini" aria-hidden="true"></span><span>Lugar livre</span></li>';
    return '<ul class="lugares" aria-label="Quem está na mesa">' + h + '</ul>';
  }

  function telaEntrada() {
    if (vista.status === 'fim') return telaFim();
    var info = BARALHO_INFO[vista.baralho] || BARALHO_INFO.classico;
    var cheia = ativos().length >= vista.cap;
    var dono = nomeDe(vista.anfitriao).nome;
    var corpo;
    if (vista.fora) corpo = '<p><b>Quem organiza esta mesa tirou você dela.</b> Você pode abrir a sua no salão.</p><div><a class="btn" href="salao.html">Ir para o salão</a></div>';
    else if (cheia) corpo = '<p><b>Todos os ' + vista.cap + ' lugares estão ocupados.</b> Peça para alguém sair ou abra uma mesa nova.</p><div><a class="btn" href="salao.html">Ir para o salão</a></div>';
    else corpo = '<p class="aviso-erro" id="erro-entrar" role="alert"></p>' +
      '<div><button class="btn btn-grande" type="button" id="b-sentar">' + icone('jogar') + 'Sentar à mesa como ' + esc(sessao.eu.apelido) + '</button></div>';
    palco.innerHTML =
      '<div class="entrada" style="--c:' + info.cor + '">' +
        '<div class="entrada-topo"><span class="cartinha">' + versoSVG(vista.baralho) + '</span>' +
        '<div><p class="cab">Convite de ' + esc(dono) + '</p><h1>Mesa ' + esc(rotuloMesa()) + '</h1>' +
        '<p>' + ativos().length + ' de ' + vista.cap + ' lugares ocupados' + (vista.status === 'jogo' ? ' · a partida já começou' : '') + '</p></div></div>' +
        lugaresHTML(false) + corpo +
      '</div>';
    var b = document.getElementById('b-sentar');
    if (b) b.addEventListener('click', function () {
      b.disabled = true;
      Api.chamar('entrar', { mesa: mesa })
        .then(function (v) {
          seq = 0; vistas = {}; caixaMsgs.innerHTML = ''; chavePalco = '';
          aplicar(v);
          explodir(palco.querySelector('.lugares') || palco, ['coracao', 'estrela', 'brilho'], 12);
          agendar(0);
        })
        .catch(function (err) { document.getElementById('erro-entrar').textContent = err.message; b.disabled = false; });
    });
  }

  function onlineHTML() {
    var dentro = {};
    ativos().forEach(function (j) { dentro[j.id] = 1; });
    var lista = online.filter(function (p) { return !dentro[p.uid]; });
    if (!lista.length) return '<li class="vazio">Ninguém mais online agora. Mande o link pelo WhatsApp ou onde o grupo conversa.</li>';
    return lista.map(function (p) {
      var foi = chamados[p.uid];
      return '<li><div class="pessoa">' + avatar(p.apelido) + '<span class="nome">' + esc(p.apelido) + '<small>' + (p.jogando ? 'jogando agora' : 'no salão') + '</small></span>' +
        '<button class="btn btn-peq' + (foi ? ' btn-fantasma' : '') + '" type="button" data-chamar="' + esc(p.uid) + '"' + (foi ? ' disabled' : '') + '>' +
        icone(foi ? 'ok' : 'chamar') + (foi ? 'Chamado' : 'Chamar') + '</button></div></li>';
    }).join('');
  }

  function conviteHTML() {
    return '<div class="convite-cartao">' +
      '<p class="cab">' + icone('link') + 'Link de convite</p>' +
      '<p>Só entra quem receber este link. Quem abrir cria a conta, se ainda não tiver, e senta.</p>' +
      '<div class="link"><label class="oculto" for="link-conv">Link de convite</label><input id="link-conv" readonly value="' + esc(linkConvite()) + '">' +
      '<button class="btn btn-peq" type="button" data-copiar>' + icone('copiar') + 'Copiar</button></div></div>' +
      '<div class="bloco-online"><h2>' + icone('chamar') + 'Chamar quem está online</h2><ul class="gente" data-lista-online>' + onlineHTML() + '</ul></div>';
  }

  function desenharOnline() {
    document.querySelectorAll('[data-lista-online]').forEach(function (ul) { ul.innerHTML = onlineHTML(); });
  }

  function telaSaguao() {
    var n = ativos().length;
    var dono = souAnfitriao();
    palco.innerHTML =
      '<h1 class="status">Esperando o grupo</h1>' +
      '<p class="status-sub">' + n + ' de ' + vista.cap + ' lugares ocupados · ' + vista.monte + ' cartas no baralho.</p>' +
      '<div class="saguao">' +
        '<div class="saguao-convite">' + conviteHTML() + '</div>' +
        '<div class="saguao-lugares">' + lugaresHTML(true) +
          (dono
            ? '<div><button class="btn btn-ocre btn-grande" type="button" data-acao="iniciar"' + (n < 2 ? ' disabled' : '') + '>' + icone('jogar') + 'Começar a partida</button></div>' +
              '<p class="status-sub">' + (n < 2 ? 'Precisa de pelo menos mais uma pessoa.' : 'Pode começar agora ou esperar os lugares encherem. Quem chegar depois ainda senta.') + '</p>'
            : '<p class="status-sub">' + esc(nomeDe(vista.anfitriao).nome) + ' começa a partida quando todos chegarem.</p>') +
        '</div>' +
      '</div>';
  }

  function telaJogo() {
    var vez = nomeDe(vista.vezId);
    var minha = minhaVez();
    var c = vista.carta;
    var titulo, sub;
    if (minha && !c) { titulo = 'Sua vez. Escolha uma carta.'; sub = 'Estão todas viradas para baixo: qualquer uma serve.'; }
    else if (minha) { titulo = 'Sua carta'; sub = c.todos ? 'Esta é para todos: cada um responde no chat.' : 'Responda no chat. Quando terminar, encerre a sua vez.'; }
    else if (!c) { titulo = 'Vez de ' + vez.nome; sub = vez.nome + ' está escolhendo uma carta.'; }
    else { titulo = 'Carta de ' + vez.nome; sub = c.todos ? 'Esta é para todos: responda também no chat.' : 'Acompanhe a resposta no chat. Pode perguntar mais, se ' + vez.nome + ' topar.'; }

    var area;
    if (c) {
      var nova = c.id !== cartaMostrada;
      area = '<div class="carta-mao' + (nova ? ' entrando' : '') + '">' + cartaHTML(c.id, { virada: nova }) + '</div>';
    } else {
      var qtd = Math.min(7, vista.monte);
      area = '<div class="leque' + (minha ? ' ativo' : '') + '" role="group" aria-label="Cartas viradas para baixo">';
      for (var i = 0; i < qtd; i++) {
        var meio = (qtd - 1) / 2, a = (i - meio) * 7, dx = (i - meio) * 13;
        area += '<button class="carta-monte" type="button" data-pos="' + i + '" style="--i:' + i + ';transform:translateX(calc(-50% + ' + dx + '%)) rotate(' + a + 'deg)"' +
          (minha ? ' aria-label="Tirar a carta ' + (i + 1) + ' de ' + qtd + '"' : ' tabindex="-1" aria-hidden="true"') + '>' + versoSVG(vista.baralho) + '</button>';
      }
      area += '</div>';
    }

    var bt = '';
    if (minha && c) {
      bt += '<button class="btn btn-ocre" type="button" data-acao="concluir">' + icone('ok') + 'Encerrar minha vez</button>';
      if (c.trocas < 2) bt += '<button class="btn btn-fantasma" type="button" data-acao="trocar">' + icone('trocar') + 'Trocar carta (' + (2 - c.trocas) + ')</button>';
      bt += '<button class="btn btn-fantasma" type="button" data-acao="passar">' + icone('passar') + 'Passar a vez</button>';
    } else if (minha) {
      bt += '<button class="btn btn-fantasma" type="button" data-acao="passar">' + icone('passar') + 'Passar a vez</button>';
    } else if (souAnfitriao() || vez.ausente) {
      bt += '<button class="btn btn-fantasma" type="button" data-acao="concluir">' + icone('passar') + 'Pular a vez de ' + esc(vez.nome) + '</button>';
    }

    palco.innerHTML = lugaresHTML(false) +
      '<h1 class="status">' + esc(titulo) + '</h1><p class="status-sub">' + esc(sub) + '</p>' +
      '<div class="area-carta">' + area + '</div>' +
      '<div class="botoes-vez">' + bt + '</div>' +
      '<p class="status-sub">Rodada ' + vista.rodada + ' · ' + vista.monte + ' cartas no monte' +
      (souAnfitriao() ? ' · <button type="button" data-acao="fechar" class="link-fino">encerrar a mesa</button>' : '') + '</p>';

    if (c && c.id !== cartaMostrada) {
      cartaMostrada = c.id;
      var el = palco.querySelector('.carta');
      var simb = categoria((carta(c.id) || { cat: 1 }).cat).simbolo || 'coracao';
      setTimeout(function () { el && el.classList.remove('virada'); }, 260);
      setTimeout(function () { explodir(el, [simb, 'coracao', 'brilho', 'estrela'], 16); }, 700);
    } else if (!c) cartaMostrada = 0;
  }

  function telaFim() {
    palco.innerHTML = '<div class="fim-mesa"><h1 class="status">Esta mesa terminou</h1>' +
      '<p class="status-sub">' + vista.sorteadas + ' cartas foram tiradas. A conversa continua aqui para quem quiser reler.</p>' +
      '<a class="btn btn-ocre" href="salao.html">Abrir uma mesa nova</a></div>';
    chat.hidden = false;
  }

  /* ---------- convidar ---------- */
  function chamar(b) {
    var uid = b.dataset.chamar;
    b.disabled = true;
    Api.chamar('convidar', { mesa: mesa, para: uid })
      .then(function (r) {
        chamados[uid] = 1;
        desenharOnline();
        toast('Convite enviado para ' + r.para + '.');
      })
      .catch(function (err) { b.disabled = false; toast(err.message, true); });
  }

  function abrirConvite() {
    folhaConvite = abrirFolha('Chamar para a mesa', conviteHTML(), { classe: 'folha-convite', aoFechar: function () { folhaConvite = null; } });
    folhaConvite.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      if (b.hasAttribute('data-copiar')) compartilhar(linkConvite(), 'Bora jogar Entre Nós com o time? Entra na minha mesa: ' + linkConvite());
      if (b.dataset.chamar) chamar(b);
    });
    agendar(0);
  }

  /* ---------- cliques no palco ---------- */
  palco.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b || b.disabled) return;
    if (b.hasAttribute('data-copiar')) return compartilhar(linkConvite(), 'Bora jogar Entre Nós com o time? Entra na minha mesa: ' + linkConvite());
    if (b.dataset.chamar) return chamar(b);
    if (b.dataset.tirar) {
      var alvo = nomeDe(b.dataset.tirar);
      if (confirm('Tirar ' + alvo.nome + ' da mesa? Essa pessoa não volta pelo link.')) acao('remover', { alvo: b.dataset.tirar }).catch(function () {});
      return;
    }
    if (b.dataset.pos != null) {
      if (!minhaVez() || ocupado) return;
      b.style.transform += ' translateY(-60px)';
      b.classList.add('saindo');
      palco.querySelectorAll('.carta-monte').forEach(function (x) { x.disabled = true; });
      acao('tirar', { pos: b.dataset.pos }).catch(function () {});
      return;
    }
    var nome = b.dataset.acao;
    if (!nome) return;
    if (nome === 'fechar' && !confirm('Encerrar a mesa para todos?')) return;
    b.disabled = true;
    acao(nome).catch(function () {});
  });

  Musica.botao(document.getElementById('b-musica'));
  document.getElementById('b-convidar').addEventListener('click', abrirConvite);
  document.getElementById('b-sair').addEventListener('click', function () {
    if (!confirm('Sair desta mesa? Você pode voltar pelo mesmo link enquanto houver lugar.')) return;
    acao('sair').then(function () { location.href = 'salao.html'; }).catch(function () {});
  });

  /* ---------- chat ---------- */
  function hora(t) { var d = new Date(t); return pad2(d.getHours()) + ':' + pad2(d.getMinutes()); }

  function desenharMsg(m) {
    var perto = caixaMsgs.scrollHeight - caixaMsgs.scrollTop - caixaMsgs.clientHeight < 120;
    var el = document.createElement('div');
    var p = m.de ? nomeDe(m.de) : null;
    var minha = m.de === eu;
    if (m.tipo === 'sis') {
      el.className = 'msg sis';
      el.textContent = m.txt;
    } else if (m.tipo === 'rea') {
      el.className = 'msg sis rea r-' + m.rea;
      el.innerHTML = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">' + (ICONES[m.rea] || '') + '</svg>' +
        esc((minha ? 'Você' : p.nome) + ' ' + (REACAO_NOME[m.rea] || 'reagiu'));
      if (Date.now() - m.t < 8000) explodir(!reacoes.hidden ? reacoes : caixaMsgs, [m.rea], 9);
    } else if (m.tipo === 'carta') {
      var c = carta(m.carta) || { txt: '', cat: 1 };
      el.className = 'msg mini-carta';
      el.style.setProperty('--cat', categoria(c.cat).cor);
      el.innerHTML = '<div><span class="quem">' + esc(p.nome) + (m.troca ? ' trocou e tirou' : ' tirou') + ' a carta Nº ' + pad2(m.carta) + ' · ' + esc(categoria(c.cat).sub) + '</span>' +
        '<q>' + esc((c.titulo ? c.titulo + ': ' : '') + c.txt) + '</q></div>';
    } else {
      el.className = 'msg' + (minha ? ' minha' : '') + (m.tipo === 'resp' ? ' resp' : '');
      el.style.setProperty('--c', p.cor);
      if (m.carta) el.style.setProperty('--cat', categoria((carta(m.carta) || { cat: 1 }).cat).cor);
      el.innerHTML = '<div class="quem">' + esc(minha ? 'Você' : p.nome) + '<time>' + hora(m.t) + '</time></div>' +
        '<div class="bolha">' + (m.tipo === 'resp' ? '<span class="marca-resp">Resposta à carta Nº ' + pad2(m.carta) + '</span>' : '') + esc(m.txt) + '</div>';
    }
    caixaMsgs.appendChild(el);
    if (perto || minha) caixaMsgs.scrollTop = caixaMsgs.scrollHeight;
  }

  function atualizarPlaceholder() {
    var c = vista && vista.carta;
    var ph = 'Escreva para a mesa';
    if (vista && vista.status === 'jogo' && c) {
      if (c.por === eu) ph = 'Escreva sua resposta';
      else if (c.todos) ph = 'Esta carta é para todos: escreva sua resposta';
      else ph = 'Comente ou pergunte mais a ' + nomeDe(c.por).nome;
    }
    if (texto.placeholder !== ph) texto.placeholder = ph;
  }

  function ajustarAltura() {
    texto.style.height = 'auto';
    texto.style.height = Math.min(140, texto.scrollHeight) + 'px';
    var resta = 300 - texto.value.length;
    contador.textContent = resta < 60 ? resta + ' caracteres restantes' : '';
  }
  texto.addEventListener('input', ajustarAltura);
  texto.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit(); }
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var t = texto.value.trim();
    if (!t || !sentado()) return;
    texto.value = ''; ajustarAltura();
    Api.chamar('msg', { mesa: mesa, desde: seq, txt: t }).then(aplicar).catch(function (err) {
      toast(err.message, true);
      if (!texto.value) { texto.value = t; ajustarAltura(); }
    });
    texto.focus();
  });

  reacoes.addEventListener('click', function (e) {
    var b = e.target.closest('[data-rea]');
    if (!b || !sentado()) return;
    b.classList.remove('pulou'); void b.offsetWidth; b.classList.add('pulou');
    Api.chamar('msg', { mesa: mesa, desde: seq, rea: b.dataset.rea })
      .then(aplicar).catch(function (err) { toast(err.message, true); });
  });

  document.addEventListener('visibilitychange', function () { if (!document.hidden) agendar(0); });

  puxar();
})();

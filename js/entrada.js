/* Entre Nós — entrada: criar conta ou entrar, com cartas de amostra na capa */
(function () {
  /* volta só para páginas deste site (nada de redirecionar para fora) */
  var volta = new URLSearchParams(location.search).get('volta') || '';
  if (!/^(jogo\.html\?mesa=[a-z0-9]{12}|salao\.html)$/.test(volta)) volta = 'salao.html';
  if (Sessao.ler()) { location.replace(volta); return; }

  /* ---------- os três baralhos ---------- */
  document.getElementById('chips-baralho').innerHTML = CATEGORIAS.map(function (c, i) {
    var n = CARTAS.filter(function (x) { return x.cat === c.id; }).length;
    return '<li style="--c:' + c.cor + ';--i:' + i + '"><span class="bola">' + icone(c.simbolo) + '</span>' +
      '<span><b>' + esc(c.nome.length <= c.sub.length ? c.nome : c.sub) + '</b><small>' + n + ' cartas</small></span></li>';
  }).join('');

  /* ---------- capa: três cartas, uma de cada baralho; tocar tira outras ---------- */
  var capa = document.getElementById('capa');
  function sortear(cats) {
    var l = CARTAS.filter(function (c) { return cats.indexOf(c.cat) >= 0 && !c.titulo; });
    return l[Math.floor(Math.random() * l.length)].id;
  }
  function tirarCapa(festa) {
    var ids = [sortear([1, 3]), sortear([2, 4, 6]), sortear([3, 5, 6])];
    capa.innerHTML = ids.map(function (id, i) {
      return '<span class="capa-carta c' + i + '">' + cartaHTML(id, { virada: true }) + '</span>';
    }).join('');
    capa.querySelectorAll('.carta').forEach(function (el, i) {
      setTimeout(function () { el.classList.remove('virada'); }, 200 + i * 160);
    });
    if (festa) setTimeout(function () { explodir(capa, ['coracao', 'estrela', 'brilho', 'sorriso'], 14); }, 650);
  }
  capa.addEventListener('click', function () { tirarCapa(true); });
  tirarCapa(false);

  /* ---------- abas ---------- */
  var abas = { cadastro: document.getElementById('aba-cadastro'), login: document.getElementById('aba-login') };
  var forms = { cadastro: document.getElementById('f-cadastro'), login: document.getElementById('f-login') };
  function mostrar(qual, foco) {
    Object.keys(abas).forEach(function (k) {
      var on = k === qual;
      abas[k].setAttribute('aria-selected', String(on));
      abas[k].tabIndex = on ? 0 : -1;
      forms[k].hidden = !on;
    });
    if (foco) forms[qual].querySelector('input').focus();
  }
  abas.cadastro.addEventListener('click', function () { mostrar('cadastro', true); });
  abas.login.addEventListener('click', function () { mostrar('login', true); });
  document.querySelector('.abas').addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    var prox = abas.cadastro.getAttribute('aria-selected') === 'true' ? 'login' : 'cadastro';
    mostrar(prox); abas[prox].focus();
  });
  try { if (localStorage.getItem('en_ja_entrou')) mostrar('login'); } catch (e) {}

  document.querySelectorAll('.ver-senha').forEach(function (b) {
    b.addEventListener('click', function () {
      var inp = b.parentNode.querySelector('input');
      var ver = inp.type === 'password';
      inp.type = ver ? 'text' : 'password';
      b.setAttribute('aria-pressed', String(ver));
      b.setAttribute('aria-label', ver ? 'Esconder senha' : 'Mostrar senha');
    });
  });

  /* ---------- enviar ---------- */
  function ocupado(form, sim, texto) {
    var b = form.querySelector('button[type="submit"]');
    if (!b.dataset.txt) b.dataset.txt = b.textContent;
    b.disabled = sim;
    b.textContent = sim ? texto : b.dataset.txt;
  }

  function explicar(err) {
    if (err.message === 'Ação desconhecida.') {
      return 'O servidor do jogo ainda está na versão antiga. Quem administra precisa publicar a nova versão do Apps Script.';
    }
    return err.message;
  }

  function entrou(r) {
    Sessao.gravar(r);
    try { localStorage.setItem('en_ja_entrou', '1'); } catch (e) {}
    location.href = volta;
  }

  forms.cadastro.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = forms.cadastro, erro = document.getElementById('erro-cadastro');
    var d = { nome: f.nome.value, email: f.email.value, apelido: f.apelido.value, senha: f.senha.value };
    var falta = Logica.limpa(d.nome, 60).length < 2 ? [f.nome, 'Escreva seu nome.']
      : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email.trim()) ? [f.email, 'Esse e-mail não parece certo. Confira.']
      : Logica.limpa(d.apelido, 20).length < 2 ? [f.apelido, 'Escolha um apelido com pelo menos 2 letras.']
      : d.senha.length < 8 ? [f.senha, 'A senha precisa de pelo menos 8 caracteres.'] : null;
    if (falta) { erro.textContent = falta[1]; falta[0].focus(); return; }
    erro.textContent = '';
    ocupado(f, true, 'Criando sua conta...');
    Api.chamar('cadastro', d).then(entrou).catch(function (err) { erro.textContent = explicar(err); ocupado(f, false); });
  });

  forms.login.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = forms.login, erro = document.getElementById('erro-login');
    if (!f.email.value.trim() || !f.senha.value) { erro.textContent = 'Preencha e-mail e senha.'; return; }
    erro.textContent = '';
    ocupado(f, true, 'Entrando...');
    Api.chamar('login', { email: f.email.value, senha: f.senha.value }).then(entrou)
      .catch(function (err) { erro.textContent = explicar(err); ocupado(f, false); });
  });

  if (/^jogo/.test(volta)) {
    var aviso = document.createElement('p');
    aviso.className = 'aviso-convite';
    aviso.innerHTML = icone('envelope') + '<span>Você recebeu um convite para uma mesa. Crie sua conta ou entre para sentar.</span>';
    document.querySelector('.conta').prepend(aviso);
  }
})();

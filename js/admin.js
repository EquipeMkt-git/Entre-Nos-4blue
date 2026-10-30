/* Entre Nós — área do organizador */
(function () {
  var senha = '';
  try { senha = sessionStorage.getItem('en_admin') || ''; } catch (e) {}
  var fLogin = document.getElementById('f-login');
  var painel = document.getElementById('painel');
  var SITUACAO = { espera: 'Esperando', jogo: 'Jogando', fim: 'Encerrada' };

  function data(t) {
    if (!t) return '';
    var d = new Date(t);
    return pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1) + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }

  function carregar(extra) {
    return Api.chamar('admin', Object.assign({ senha: senha, op: 'resumo' }, extra || {})).then(desenhar);
  }

  function desenhar(r) {
    fLogin.hidden = true;
    painel.hidden = false;
    var t = r.totais;
    document.getElementById('numeros').innerHTML = [
      [t.salas, 'mesas abertas no total'], [t.abertas, 'mesas em andamento'], [t.jogadores, 'pessoas sentadas'],
      [t.sorteadas, 'cartas tiradas'], [t.mensagens, 'mensagens e avisos'], [t.contas, 'contas criadas']
    ].map(function (n) { return '<div><b>' + n[0] + '</b><span>' + n[1] + '</span></div>'; }).join('');

    document.getElementById('salas').innerHTML = r.salas.length ? r.salas.map(function (s) {
      return '<tr><td><a href="jogo.html?mesa=' + esc(s.cod) + '">' + esc(s.cod.slice(0, 6)) + '</a></td><td>' + (SITUACAO[s.status] || s.status) + '</td>' +
        '<td>' + s.jogadores + ' de ' + s.cap + '</td><td>' + esc(s.modo) + '</td><td>' + esc(s.nomes) + '</td>' +
        '<td>' + s.sorteadas + '</td><td>' + s.mensagens + '</td><td>' + data(s.atualizada) + '</td>' +
        '<td>' + (s.status !== 'fim' ? '<button class="btn btn-fantasma btn-peq" type="button" data-encerrar="' + esc(s.cod) + '">Encerrar</button>' : '') + '</td></tr>';
    }).join('') : '<tr><td colspan="9">Nenhuma mesa aberta ainda.</td></tr>';

    document.getElementById('contas').innerHTML = r.usuarios.length ? r.usuarios.map(function (u) {
      return '<tr><td>' + esc(u.apelido) + '</td><td>' + esc(u.nome) + '</td><td>' + esc(u.email) + '</td><td>' + data(u.criado) + '</td><td>' + data(u.ultimo) + '</td></tr>';
    }).join('') : '<tr><td colspan="5">Ninguém criou conta ainda.</td></tr>';

    var rk = document.getElementById('ranking');
    rk.innerHTML = r.cartas.length ? r.cartas.slice(0, 24).map(function (x) {
      var c = carta(x.id);
      if (!c) return '';
      return '<li style="--cat:' + categoria(c.cat).cor + '"><i></i><span>Nº ' + pad2(c.id) + ' · ' + esc(c.titulo || c.txt) + '</span><b>' + x.vezes + '</b></li>';
    }).join('') : '<li style="--cat:#8a6bff"><i></i><span>Nenhuma carta tirada ainda.</span><b></b></li>';
  }

  fLogin.addEventListener('submit', function (e) {
    e.preventDefault();
    senha = fLogin.senha.value;
    var erro = document.getElementById('erro-login');
    erro.textContent = '';
    carregar().then(function () {
      try { sessionStorage.setItem('en_admin', senha); } catch (x) {}
    }).catch(function (err) { erro.textContent = err.message; });
  });

  document.getElementById('b-atualizar').addEventListener('click', function () {
    carregar().then(function () { toast('Painel atualizado.'); }).catch(function (err) { toast(err.message, true); });
  });
  document.getElementById('b-sair').addEventListener('click', function () {
    try { sessionStorage.removeItem('en_admin'); } catch (x) {}
    location.reload();
  });
  document.getElementById('salas').addEventListener('click', function (e) {
    var b = e.target.closest('[data-encerrar]');
    if (!b || !confirm('Encerrar esta mesa para todos?')) return;
    carregar({ op: 'encerrar', cod: b.dataset.encerrar }).then(function () { toast('Mesa encerrada.'); }).catch(function (err) { toast(err.message, true); });
  });

  if (!Api.remoto) document.querySelector('#f-login p').textContent += ' No modo demonstração a senha é demo.';
  if (senha) carregar().catch(function () { senha = ''; });
})();

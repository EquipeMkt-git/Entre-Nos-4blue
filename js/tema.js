/* Entre Nós — ícones, o botão de regras e o céu de símbolos ao fundo (todas as páginas) */
(function () {
  document.documentElement.classList.remove('sem-js');

  /* <i data-ico="fogo"></i> e %%fogo%% dentro de botões viram o desenho do ícone */
  document.querySelectorAll('[data-ico]').forEach(function (el) {
    el.outerHTML = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">' + (ICONES[el.dataset.ico] || '') + '</svg>';
  });
  document.querySelectorAll('button, a.btn').forEach(function (b) {
    if (b.innerHTML.indexOf('%%') >= 0) b.innerHTML = b.innerHTML.replace(/%%(\w+)%%/g, function (m, n) { return icone(n); });
  });

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-regras]')) { e.preventDefault(); abrirRegras(); }
  });

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var nomes = ['coracao', 'estrela', 'brilho', 'coracao', 'cereja', 'lua'];
  var cores = ['#2f7bff', '#5c97ff', '#ffb84d', '#7fb0ff', '#3fb0e8', '#ff86a6'];
  var ceu = document.createElement('div');
  ceu.className = 'ceu';
  ceu.setAttribute('aria-hidden', 'true');
  var n = innerWidth < 720 ? 9 : 16;
  for (var i = 0; i < n; i++) {
    var s = document.createElement('span');
    s.style.left = Math.round(Math.random() * 96) + '%';
    s.style.setProperty('--t', Math.round(14 + Math.random() * 22) + 'px');
    s.style.setProperty('--c', cores[i % cores.length]);
    s.style.setProperty('--dur', Math.round(16 + Math.random() * 16) + 's');
    s.style.setProperty('--atraso', '-' + Math.round(Math.random() * 30) + 's');
    s.style.setProperty('--x', Math.round(Math.random() * 80 - 40) + 'px');
    s.innerHTML = '<svg viewBox="0 0 24 24">' + ICONES[nomes[i % nomes.length]] + '</svg>';
    ceu.appendChild(s);
  }
  document.body.prepend(ceu);
})();

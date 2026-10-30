/* Entre Nós — trilha da mesa: cada baralho tem a sua lista (js/musicas.js), tocada em ordem embaralhada.
   O navegador só deixa tocar som depois de um toque na página; até lá a música fica esperando. */
var Musica = (function () {
  var audio = new Audio();
  audio.volume = 0.35;
  audio.preload = 'none';
  var fila = [], baralho = '', esperandoToque = false;
  var ligada = true;
  try { ligada = localStorage.getItem('en_musica') !== '0'; } catch (e) {}
  var botao = null;

  function embaralhar(l) {
    l = l.slice();
    for (var i = l.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = l[i]; l[i] = l[j]; l[j] = t; }
    return l;
  }

  function proxima() {
    var lista = (window.MUSICAS && MUSICAS[baralho]) || [];
    if (!lista.length) return;
    if (!fila.length) fila = embaralhar(lista);
    var m = fila.shift();
    audio.src = m.arq;
    audio.dataset.titulo = m.titulo;
    tocar(true);
  }

  function tocar(avisar) {
    if (!ligada || !audio.src) return;
    audio.play().then(function () {
      if (avisar) toast('Tocando: ' + audio.dataset.titulo);
    }).catch(function () {
      /* sem toque na página ainda: tenta de novo no primeiro toque */
      if (esperandoToque) return;
      esperandoToque = true;
      var vai = function () {
        esperandoToque = false;
        document.removeEventListener('pointerdown', vai);
        document.removeEventListener('keydown', vai);
        tocar(true);
      };
      document.addEventListener('pointerdown', vai);
      document.addEventListener('keydown', vai);
    });
  }

  function pintar() {
    if (!botao) return;
    botao.setAttribute('aria-pressed', String(ligada));
    botao.setAttribute('aria-label', ligada ? 'Desligar a música' : 'Ligar a música');
    botao.innerHTML = icone(ligada ? 'musica' : 'semSom') + '<span>Música</span>';
  }

  audio.addEventListener('ended', proxima);
  audio.addEventListener('error', function () { setTimeout(proxima, 800); });

  return {
    /* troca a lista quando a mesa mostra de qual baralho ela é */
    baralho: function (b) {
      if (b === baralho) return;
      baralho = b;
      fila = [];
      if (ligada) proxima();
    },
    botao: function (el) {
      botao = el;
      pintar();
      el.addEventListener('click', function () {
        ligada = !ligada;
        try { localStorage.setItem('en_musica', ligada ? '1' : '0'); } catch (e) {}
        pintar();
        if (!ligada) audio.pause();
        else if (audio.src) tocar(true);
        else proxima();
      });
    }
  };
})();

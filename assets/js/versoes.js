/**
 * Página de notas das versões — o selo segue o que está publicado.
 *
 * Antes o selo "Atual" era escrito à mão no HTML, junto com a entrada da
 * versão. O problema é de ordem: a entrada é escrita ANTES de o build rodar, e
 * o build leva uns quarenta minutos. Nessa janela a página anunciava a versão
 * nova como atual enquanto o botão de download — que consulta a API a cada
 * visita — continuava, corretamente, oferecendo a anterior.
 *
 * Quem comparava as duas telas concluía que o botão estava velho. Não estava: a
 * página é que afirmava algo que ainda não era verdade.
 *
 * Agora as duas telas leem a mesma fonte. Aqui o selo é posto na versão que a
 * API devolve como a mais recente publicada, e as entradas acima dela — as que
 * já foram escritas mas ainda não saíram — aparecem como "em preparação", que é
 * o que de fato são.
 *
 * Se a API não responder, o HTML fica como está: sem selo alterado e sem
 * mentira nova. A página continua legível, que é o que ela precisa ser.
 */

(function () {
  'use strict';

  var OWNER = 'Dev-Washington';
  var REPO = 'liveshop-tools';
  var API = 'https://api.github.com/repos/' + OWNER + '/' + REPO + '/releases/latest';

  var artigos = Array.prototype.slice.call(document.querySelectorAll('.release[data-version]'));
  if (!artigos.length || !window.fetch) return;

  /**
   * Compara duas versões "x.y.z" numericamente.
   * Devolve >0 se `a` for maior, <0 se menor, 0 se iguais.
   *
   * Numérico por componente, e não alfabético: "6.10.0" é maior que "6.9.0",
   * embora venha antes numa ordenação de texto.
   */
  function comparar(a, b) {
    var pa = String(a).split('.');
    var pb = String(b).split('.');
    for (var i = 0; i < Math.max(pa.length, pb.length); i++) {
      var na = parseInt(pa[i], 10) || 0;
      var nb = parseInt(pb[i], 10) || 0;
      if (na !== nb) return na - nb;
    }
    return 0;
  }

  function selo(artigo, texto, estado) {
    var titulo = artigo.querySelector('.release__version');
    if (!titulo) return;

    var marca = document.createElement('span');
    marca.className = 'release__badge';
    marca.textContent = texto;
    marca.setAttribute('data-state', estado);
    titulo.appendChild(marca);
  }

  function aviso(artigo, texto) {
    var nota = document.createElement('p');
    nota.className = 'release__pending';
    nota.textContent = texto;

    var cabecalho = artigo.querySelector('.release__head');
    if (cabecalho && cabecalho.nextSibling) {
      artigo.insertBefore(nota, cabecalho.nextSibling);
    } else {
      artigo.appendChild(nota);
    }
  }

  fetch(API, { headers: { Accept: 'application/vnd.github+json' } })
    .then(function (resposta) {
      if (!resposta.ok) throw new Error('HTTP ' + resposta.status);
      return resposta.json();
    })
    .then(function (release) {
      var publicada = String(release.tag_name || '').replace(/^v/, '');
      if (!publicada) return;

      artigos.forEach(function (artigo) {
        var versao = artigo.getAttribute('data-version');
        var diferenca = comparar(versao, publicada);

        if (diferenca === 0) {
          artigo.setAttribute('data-current', 'true');
          selo(artigo, 'Atual', 'atual');
          return;
        }

        if (diferenca > 0) {
          // Escrita, ainda não publicada: o instalador dela não existe.
          artigo.setAttribute('data-pending', 'true');
          selo(artigo, 'Em preparação', 'preparo');
          aviso(
            artigo,
            'Esta versão ainda está sendo preparada. O botão de download passa a oferecê-la ' +
              'assim que ficar pronta — até lá, a versão para baixar é a ' +
              publicada +
              '.'
          );
        }
      });
    })
    .catch(function () {
      /*
       * Silêncio proposital. Sem resposta da API não há como saber o que está
       * publicado, e chutar seria pior: o HTML sem selo nenhum não afirma nada
       * de errado, e o histórico — que é o conteúdo desta página — continua
       * inteiro.
       */
    });
})();

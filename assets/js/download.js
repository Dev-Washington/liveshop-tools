/**
 * Botão de download da landing page.
 *
 * Resolve o .exe da última release pela GitHub Releases API, em vez de um link
 * fixo — link fixo quebra a cada versão publicada.
 *
 * Se a API falhar (rate limit de 60 req/h por IP, rede fora, repositório
 * privado), o botão continua funcionando: ele já nasce apontando para a página
 * de Releases, e o texto avisa o que aconteceu. Nunca fica quebrado.
 */

(function () {
  'use strict';

  /*
   * Repositório PÚBLICO de distribuição. O código-fonte fica no privado
   * (liveshop-tools-desktop); aqui só moram a landing e as Releases, porque
   * a API de releases de um repositório privado devolve 404 sem token e o
   * botão de download quebraria.
   */
  var OWNER = 'Dev-Washington';
  var REPO = 'liveshop-tools';
  var API = 'https://api.github.com/repos/' + OWNER + '/' + REPO + '/releases/latest';
  var RELEASES_URL = 'https://github.com/' + OWNER + '/' + REPO + '/releases';

  var button = document.getElementById('downloadButton');
  var label = document.getElementById('downloadLabel');
  var meta = document.getElementById('downloadMeta');
  var note = document.getElementById('downloadNote');
  var osWarning = document.getElementById('osWarning');
  var osWarningText = document.getElementById('osWarningText');
  var footerVersion = document.getElementById('footerVersion');

  // ── formatação ────────────────────────────────────────────────────────────

  function formatBytes(value) {
    if (!value) return '';
    var units = ['B', 'KB', 'MB', 'GB'];
    var size = value;
    var unit = 0;
    while (size >= 1024 && unit < units.length - 1) {
      size /= 1024;
      unit++;
    }
    return size.toFixed(size >= 10 || unit === 0 ? 0 : 1) + ' ' + units[unit];
  }

  function formatDate(value) {
    if (!value) return '';
    var date = new Date(value);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  // ── detecção de sistema ───────────────────────────────────────────────────

  /**
   * Usa userAgentData quando existe (Chromium moderno) e cai no userAgent nos
   * demais. Só precisa distinguir "Windows" de "não Windows".
   */
  function detectPlatform() {
    var data = navigator.userAgentData;
    var platform = data && data.platform ? data.platform : navigator.platform || '';
    var agent = navigator.userAgent || '';

    if (/Win/i.test(platform) || /Windows/i.test(agent)) return 'windows';
    if (/Mac/i.test(platform) || /Mac OS X/i.test(agent)) return 'macos';
    if (/Android/i.test(agent)) return 'android';
    if (/iPhone|iPad|iPod/i.test(agent)) return 'ios';
    if (/Linux|X11/i.test(platform) || /Linux/i.test(agent)) return 'linux';
    return 'outro';
  }

  var PLATFORM_MESSAGE = {
    macos: 'Você está num Mac. O LiveShop Tools Desktop existe apenas para Windows 10/11 (64 bits).',
    linux: 'Você está no Linux. O LiveShop Tools Desktop existe apenas para Windows 10/11 (64 bits).',
    android: 'Você está num dispositivo Android. O LiveShop Tools Desktop existe apenas para Windows 10/11 (64 bits).',
    ios: 'Você está num iPhone ou iPad. O LiveShop Tools Desktop existe apenas para Windows 10/11 (64 bits).',
    outro: 'Não conseguimos identificar seu sistema. O LiveShop Tools Desktop existe apenas para Windows 10/11 (64 bits).'
  };

  function applyPlatform() {
    var platform = detectPlatform();
    if (platform === 'windows') return;

    osWarningText.textContent =
      PLATFORM_MESSAGE[platform] +
      ' Você ainda pode baixar o instalador para instalar num computador com Windows.';
    osWarning.hidden = false;
    button.classList.add('download-button--secondary');
  }

  // ── release ───────────────────────────────────────────────────────────────

  function pickInstaller(assets) {
    if (!assets || !assets.length) return null;
    for (var i = 0; i < assets.length; i++) {
      var asset = assets[i];
      if (/\.exe$/i.test(asset.name) && /setup/i.test(asset.name)) return asset;
    }
    for (var j = 0; j < assets.length; j++) {
      if (/\.exe$/i.test(assets[j].name)) return assets[j];
    }
    return null;
  }

  function fallback(message) {
    button.href = RELEASES_URL;
    label.textContent = 'Ver versões disponíveis';
    meta.textContent = 'Página de Releases no GitHub';
    note.textContent = message;
    note.dataset.tone = 'warn';
  }

  function loadRelease() {
    if (!window.fetch) {
      fallback('Seu navegador não suporta a consulta automática. A página de Releases tem o arquivo.');
      return;
    }

    fetch(API, { headers: { Accept: 'application/vnd.github+json' } })
      .then(function (response) {
        if (response.status === 403 || response.status === 429) {
          throw new Error(
            'O GitHub limitou temporariamente as consultas deste IP (rate limit). Use a página de Releases.'
          );
        }
        if (response.status === 404) {
          throw new Error('Nenhuma versão publicada ainda. Assim que sair a primeira release, o botão aparece aqui.');
        }
        if (!response.ok) throw new Error('Não foi possível consultar as versões (HTTP ' + response.status + ').');
        return response.json();
      })
      .then(function (release) {
        var asset = pickInstaller(release.assets);
        if (!asset) {
          throw new Error('A última versão não traz um instalador .exe. Veja a página de Releases.');
        }

        var version = String(release.tag_name || release.name || '').replace(/^v/, '');

        button.href = asset.browser_download_url;
        button.setAttribute('download', asset.name);
        label.textContent = 'Baixar para Windows';
        meta.textContent =
          'Versão ' + version + ' · ' + formatBytes(asset.size) + ' · ' + formatDate(release.published_at);

        note.textContent = 'Windows 10/11 (64 bits) · arquivo ' + asset.name;
        note.dataset.tone = 'info';

        if (footerVersion) footerVersion.textContent = 'Versão publicada: ' + version + '.';
        document.title = 'LiveShop Tools ' + version + ' para Windows — download';
      })
      .catch(function (error) {
        fallback(error && error.message ? error.message : 'Falha ao consultar as versões.');
      });
  }

  applyPlatform();
  loadRelease();
})();

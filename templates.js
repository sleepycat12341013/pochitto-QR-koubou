(function () {
    'use strict';

    const SAMPLE = 'https://smartqr.studio';

    const FREE_PRESETS = [
      { color: '#D97706', name: 'アンバー' },
      { color: '#0891B2', name: 'スカイシアン' },
      { color: '#BE185D', name: 'ホットピンク' },
      { color: '#064E3B', name: 'ディープエメラルド' },
      { color: '#7C2D12', name: 'テラコッタ' },
      { color: '#1E1B4B', name: 'ミッドナイト' },
    ];

    const PREMIUM_PRESETS = [
      { color: '#0F766E', name: 'オーシャンティール' },
      { color: '#C2410C', name: 'サンセットオレンジ' },
      { color: '#4338CA', name: 'インディゴ' },
      { color: '#BE185D', name: 'ローズピンク' },
      { color: '#92400E', name: 'ウォームブラウン' },
      { color: '#374151', name: 'スレートグレー' },
    ];

    function buildGrid(containerId, presets, isPremium) {
      const grid = document.getElementById(containerId);
      presets.forEach((p, i) => {
        const card = document.createElement('div');
        card.className = 'template-card';
        card.title = isPremium ? 'プレミアムプラン限定' : p.name;

        const qrDiv = document.createElement('div');
        qrDiv.className = 'template-qr';
        qrDiv.id = containerId + '-qr-' + i;

        const swatch = document.createElement('div');
        swatch.className = 'template-swatch';
        swatch.style.background = p.color;

        const name = document.createElement('p');
        name.className = 'template-name';
        name.textContent = p.name;

        const hex = document.createElement('p');
        hex.className = 'template-hex';
        hex.textContent = p.color;

        const badge = document.createElement('span');
        badge.className = 'template-badge' + (isPremium ? '' : ' template-badge--free');
        badge.textContent = isPremium ? 'プレミアム' : '無料';

        card.append(qrDiv, swatch, name, hex, badge);
        grid.appendChild(card);

        if (isPremium) {
          card.style.opacity = '.55';
          card.style.filter = 'grayscale(40%)';
          card.style.cursor = 'not-allowed';
        } else {
          card.addEventListener('click', () => {
            const params = new URLSearchParams({ color: p.color });
            location.href = 'index.html?' + params.toString();
          });
        }

        new QRCode(document.getElementById(qrDiv.id), {
          text: SAMPLE,
          width: 120, height: 120,
          colorDark: isPremium ? '#9CA3AF' : p.color,
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.M,
        });
      });
    }

    buildGrid('template-grid-free', FREE_PRESETS, false);
    buildGrid('template-grid-premium', PREMIUM_PRESETS, true);
  })();

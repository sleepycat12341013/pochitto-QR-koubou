(function () {
  'use strict';
  if (!document.getElementById('dash-grid')) return;

  const grid     = document.getElementById('dash-grid');
  const empty    = document.getElementById('dash-empty');
  const countEl  = document.getElementById('dash-count');
  const clearBtn = document.getElementById('dash-clear');
  const TYPE_LABEL = {
    link: 'リンク', text: 'テキスト', contact: '連絡先',
    video: '動画', email: 'メール', map: '地図',
  };

  function pad(n) { return String(n).padStart(2, '0'); }
  function formatDate(iso) {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.getFullYear() + '/' + pad(d.getMonth() + 1) + '/' + pad(d.getDate()) +
           ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function download(item) {
    const holder = document.createElement('div');
    holder.style.cssText = 'position:fixed;left:-9999px;top:0;';
    document.body.appendChild(holder);
    try {
      new QRCode(holder, {
        text: item.content, width: 1024, height: 1024,
        colorDark: item.color || '#B91C1C', colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M,
      });
    } catch (e) { document.body.removeChild(holder); return; }
    setTimeout(function () {
      const canvas = holder.querySelector('canvas');
      const img    = holder.querySelector('img');
      let src = canvas;
      if (!canvas && img) {
        src = document.createElement('canvas');
        src.width = 1024; src.height = 1024;
        src.getContext('2d').drawImage(img, 0, 0, 1024, 1024);
      }
      if (src) {
        const a = document.createElement('a');
        a.download = 'qrcode_' + item.ts.slice(0, 19).replace(/[:.]/g, '-') + '.png';
        a.href = src.toDataURL('image/png');
        a.click();
      }
      document.body.removeChild(holder);
    }, 60);
  }

  function card(item) {
    const el = document.createElement('div');
    el.className = 'dash-card';

    const qr = document.createElement('div');
    qr.className = 'dash-qr';
    try {
      new QRCode(qr, {
        text: item.content, width: 132, height: 132,
        colorDark: item.color || '#B91C1C', colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M,
      });
    } catch (e) { qr.textContent = '⚠'; }

    const meta = document.createElement('div');
    meta.className = 'dash-meta';
    const type = document.createElement('span');
    type.className = 'dash-type';
    type.textContent = TYPE_LABEL[item.type] || item.type;
    const label = document.createElement('p');
    label.className = 'dash-label';
    label.textContent = item.label;
    label.title = item.label;
    const date = document.createElement('p');
    date.className = 'dash-date';
    date.textContent = formatDate(item.ts);
    meta.append(type, label, date);

    const actions = document.createElement('div');
    actions.className = 'dash-actions';
    const dl = document.createElement('button');
    dl.className = 'btn-secondary dash-btn';
    dl.textContent = 'PNG保存';
    dl.addEventListener('click', function () { download(item); });
    const del = document.createElement('button');
    del.className = 'dash-btn dash-btn--del';
    del.textContent = '削除';
    del.addEventListener('click', function () { QRHistory.remove(item.ts); render(); });
    actions.append(dl, del);

    el.append(qr, meta, actions);
    return el;
  }

  function render() {
    const items = window.QRHistory ? QRHistory.all() : [];
    grid.innerHTML = '';
    empty.hidden = items.length > 0;
    clearBtn.hidden = items.length === 0;
    countEl.textContent = items.length
      ? items.length + ' / ' + QRHistory.CAP + ' 件（この端末に保存）'
      : '';
    items.forEach(function (item) { grid.appendChild(card(item)); });
  }

  clearBtn.addEventListener('click', function () {
    if (confirm('保存されたQRコードの履歴をすべて削除しますか？')) {
      QRHistory.clear();
      render();
    }
  });

  render();
})();

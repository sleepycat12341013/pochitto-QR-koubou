'use strict';

// ─── QR履歴（localStorage・端末内のみ／QR画像は保存せず「内容＋設定」だけ保持） ───
window.QRHistory = (function () {
  const KEY = 'qrHistory';
  const CAP = 100;
  function read() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch (e) { return []; }
  }
  function write(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, CAP))); }
    catch (e) { /* 容量超過・プライベートモード等は黙って無視 */ }
  }
  return {
    CAP: CAP,
    add: function (item) {
      if (!item || !item.content) return;
      const list = read().filter(function (x) {
        return !(x.content === item.content && x.type === item.type);
      });
      list.unshift({
        type:    item.type || 'link',
        content: item.content,
        label:   item.label || item.content,
        color:   item.color || '#B91C1C',
        ts:      new Date().toISOString(),
      });
      write(list);
    },
    all:    function () { return read(); },
    remove: function (ts) { write(read().filter(function (x) { return x.ts !== ts; })); },
    clear:  function () { write([]); },
  };
})();

// ─── index.html: タブ切り替え + QR生成 ─────────────────────────────
if (document.getElementById('panel-link')) {

  let activeTab    = 'link';
  let qrInstance   = null;
  let currentColor = '#B91C1C';
  let lastContent  = '';
  let lastLabel    = '';

  const elQrcode    = document.getElementById('qrcode');
  const elQrEmpty   = document.getElementById('qr-empty');
  const elQrFrame   = document.getElementById('qr-frame');
  const elUrlLabel  = document.getElementById('qr-url-label');
  const elErrorMsg  = document.getElementById('error-msg');
  const btnGenerate = document.getElementById('btn-generate');
  const btnDownload    = document.getElementById('btn-download');
  const btnDownloadSvg = document.getElementById('btn-download-svg');
  btnDownloadSvg.addEventListener('click', () => { window.location.href = 'pricing.html'; });
  const swatches    = document.querySelectorAll('.swatch:not(.swatch--custom)');
  const customColor = document.getElementById('custom-color');

  // タブ切り替え（WAI-ARIA Tabs パターン）
  const tablistEl = document.querySelector('.input-type-tabs');
  const tabBtns   = Array.from(tablistEl.querySelectorAll('.tab-btn[data-tab]'));
  tabBtns.forEach(b => {
    const t = b.dataset.tab;
    b.id = `tab-${t}`;
    b.setAttribute('aria-controls', `panel-${t}`);
    b.tabIndex = (t === activeTab) ? 0 : -1;
    const panel = document.getElementById(`panel-${t}`);
    if (panel) {
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', `tab-${t}`);
      panel.tabIndex = 0;
    }
    b.addEventListener('click', () => { if (t !== activeTab) switchTab(t); });
  });
  tablistEl.addEventListener('keydown', e => {
    const i = tabBtns.indexOf(document.activeElement);
    if (i < 0) return;
    let n = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown')   n = (i + 1) % tabBtns.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + tabBtns.length) % tabBtns.length;
    else if (e.key === 'Home')                             n = 0;
    else if (e.key === 'End')                              n = tabBtns.length - 1;
    else return;
    e.preventDefault();
    tabBtns[n].focus();
    switchTab(tabBtns[n].dataset.tab);
  });

  function switchTab(tab) {
    activeTab = tab;
    tabBtns.forEach(b => {
      const sel = b.dataset.tab === tab;
      b.classList.toggle('tab-btn--active', sel);
      b.setAttribute('aria-selected', sel ? 'true' : 'false');
      b.tabIndex = sel ? 0 : -1;
    });
    document.querySelectorAll('.tab-panel').forEach(p => { p.hidden = true; });
    document.getElementById(`panel-${tab}`).hidden = false;
    btnGenerate.disabled = (tab === 'file');
    clearQR();
    clearError();
  }

  // リンクパネル
  const elUrlInput = document.getElementById('input-url');
  const elClearUrl = document.getElementById('btn-clear-url');
  elUrlInput.addEventListener('input', () => { elClearUrl.hidden = !elUrlInput.value; clearError(); });
  elUrlInput.addEventListener('keydown', e => { if (e.key === 'Enter') generate(); });
  elClearUrl.addEventListener('click', () => {
    elUrlInput.value = ''; elClearUrl.hidden = true; elUrlInput.focus(); clearQR(); clearError();
  });

  // テキストパネル
  const elTextInput = document.getElementById('input-text');
  const elCharCount = document.getElementById('char-count');
  const MAX_CHARS   = 500;
  elTextInput.addEventListener('input', () => {
    const len = elTextInput.value.length;
    elCharCount.textContent = `${len} / ${MAX_CHARS}`;
    elCharCount.classList.toggle('over', len > MAX_CHARS);
    clearError();
  });

  // 連絡先パネル - 入力時にエラー解除
  ['contact-name', 'contact-phone', 'contact-email'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => {
      document.getElementById(id).classList.remove('url-input--error');
      clearError();
    });
  });

  // 動画パネル
  const elVideoInput = document.getElementById('input-video');
  const elClearVideo = document.getElementById('btn-clear-video');
  elVideoInput.addEventListener('input', () => { elClearVideo.hidden = !elVideoInput.value; clearError(); });
  elVideoInput.addEventListener('keydown', e => { if (e.key === 'Enter') generate(); });
  elClearVideo.addEventListener('click', () => {
    elVideoInput.value = ''; elClearVideo.hidden = true; elVideoInput.focus(); clearQR(); clearError();
  });

  // 生成ボタン
  btnGenerate.addEventListener('click', generate);

  function generate() {
    clearError();
    let content = '', label = '';

    if (activeTab === 'link') {
      content = elUrlInput.value.trim();
      if (!content) { showError('URLを入力してください'); return; }
      try { new URL(content); } catch { showError('URLの形式が正しくありません（例: https://example.com）'); return; }
      label = content;

    } else if (activeTab === 'text') {
      content = elTextInput.value.trim();
      if (!content) { showError('テキストを入力してください'); return; }
      if (content.length > MAX_CHARS) { showError(`${MAX_CHARS}文字以内で入力してください`); return; }
      label = content.length > 32 ? content.slice(0, 32) + '…' : content;

    } else if (activeTab === 'contact') {
      const nameEl  = document.getElementById('contact-name');
      const phoneEl = document.getElementById('contact-phone');
      const emailEl = document.getElementById('contact-email');
      const name  = nameEl.value.trim();
      const phone = phoneEl.value.trim();
      const email = emailEl.value.trim();
      const org   = document.getElementById('contact-org').value.trim();
      const url   = document.getElementById('contact-url').value.trim();

      let hasError = false;
      if (!name) { nameEl.classList.add('url-input--error'); hasError = true; }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        emailEl.classList.add('url-input--error'); hasError = true;
      }
      if (phone && !/^[0-9+\-\s()]+$/.test(phone)) {
        phoneEl.classList.add('url-input--error'); hasError = true;
      }
      if (hasError) { showError('入力内容を確認してください'); return; }

      let vcard = 'BEGIN:VCARD\nVERSION:3.0\n';
      vcard += `FN:${name}\n`;
      if (phone) vcard += `TEL;TYPE=CELL:${phone}\n`;
      if (email) vcard += `EMAIL:${email}\n`;
      if (org)   vcard += `ORG:${org}\n`;
      if (url)   vcard += `URL:${url}\n`;
      vcard += 'END:VCARD';
      content = vcard;
      label = `連絡先: ${name}`;

    } else if (activeTab === 'video') {
      content = elVideoInput.value.trim();
      if (!content) { showError('動画URLを入力してください'); return; }
      try { new URL(content); } catch { showError('URLの形式が正しくありません'); return; }
      label = content;
    }

    if (content) {
      renderQR(content, label);
      if (lastContent) QRHistory.add({ type: activeTab, content: content, label: label, color: currentColor });
    }
  }

  function renderQR(text, label) {
    lastContent = text;
    lastLabel   = label || text;
    const SIZE  = 180;
    if (qrInstance) { qrInstance.clear(); elQrcode.innerHTML = ''; qrInstance = null; }
    try {
      qrInstance = new QRCode(elQrcode, {
        text, width: SIZE, height: SIZE,
        colorDark: currentColor, colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M,
      });
    } catch (e) {
      const msg = (e && e.message) ? e.message : '';
      if (msg.toLowerCase().includes('overflow') || msg.toLowerCase().includes('length')) {
        showError('データが長すぎてQRコードを生成できません。内容を短くしてください。');
      } else if (msg) {
        showError(`QR生成に失敗しました: ${msg}`);
      } else {
        showError('QRコードの生成に失敗しました。入力内容を確認してください。');
      }
      lastContent = '';
      return;
    }
    elQrEmpty.style.display = 'none';
    elQrFrame.classList.add('has-qr');
    const display = lastLabel.length > 40 ? lastLabel.slice(0, 40) + '…' : lastLabel;
    elUrlLabel.textContent = display.replace(/[\n\r]/g, ' ');
    elUrlLabel.hidden = false;
    btnDownload.disabled = false;
  }

  // カラー
  const elColorWarn  = document.getElementById('color-warn');
  const customSwatch = document.querySelector('.swatch--custom');

  // 相対輝度（WCAG）。明るすぎる色はQRのスキャン性を損なうため警告する
  function relLuminance(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex);
    if (!m) return 0;
    const n = parseInt(m[1], 16);
    const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  }
  function checkColorContrast() {
    if (elColorWarn) elColorWarn.hidden = relLuminance(currentColor) <= 0.5;
  }

  swatches.forEach(btn => {
    btn.setAttribute('aria-pressed', btn.classList.contains('swatch--active') ? 'true' : 'false');
    btn.addEventListener('click', () => {
      selectColor(btn.dataset.color);
      swatches.forEach(s => { s.classList.remove('swatch--active'); s.setAttribute('aria-pressed', 'false'); });
      customSwatch.classList.remove('swatch--active');
      btn.classList.add('swatch--active');
      btn.setAttribute('aria-pressed', 'true');
    });
  });
  customColor.addEventListener('input', () => {
    selectColor(customColor.value);
    swatches.forEach(s => { s.classList.remove('swatch--active'); s.setAttribute('aria-pressed', 'false'); });
    customSwatch.classList.add('swatch--active');
  });
  function selectColor(color) {
    currentColor = color;
    checkColorContrast();
    if (lastContent) renderQR(lastContent, lastLabel);
  }

  // ダウンロード（画面表示は180pxだが、印刷・マーケ用途のため1024pxで再描画して保存）
  const DOWNLOAD_SIZE = 1024;
  btnDownload.addEventListener('click', () => {
    if (!lastContent) return;
    const holder = document.createElement('div');
    holder.style.cssText = 'position:fixed;left:-9999px;top:0;';
    document.body.appendChild(holder);
    try {
      new QRCode(holder, {
        text: lastContent, width: DOWNLOAD_SIZE, height: DOWNLOAD_SIZE,
        colorDark: currentColor, colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M,
      });
    } catch (e) {
      document.body.removeChild(holder);
      const c = elQrcode.querySelector('canvas');   // 高解像度生成に失敗したら画面のものを保存
      if (c) save(c);
      return;
    }
    setTimeout(() => {
      const canvas = holder.querySelector('canvas');
      const img    = holder.querySelector('img');
      if (canvas) save(canvas);
      else if (img) {
        const tmp = document.createElement('canvas');
        tmp.width = DOWNLOAD_SIZE; tmp.height = DOWNLOAD_SIZE;
        tmp.getContext('2d').drawImage(img, 0, 0, DOWNLOAD_SIZE, DOWNLOAD_SIZE);
        save(tmp);
      }
      document.body.removeChild(holder);
    }, 60);
  });

  function save(canvas) {
    const ts = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    const a  = document.createElement('a');
    a.download = `qrcode_${ts}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  }

  function clearQR() {
    lastContent = '';
    if (qrInstance) { qrInstance.clear(); qrInstance = null; }
    elQrcode.innerHTML = '';
    elQrEmpty.style.display = '';
    elQrFrame.classList.remove('has-qr');
    elUrlLabel.hidden = true;
    btnDownload.disabled = true;
  }

  function showError(msg) { elErrorMsg.textContent = msg; elErrorMsg.hidden = false; }
  function clearError()   { elErrorMsg.hidden = true; elErrorMsg.textContent = ''; }
}

// ─── 全ページ共通: モバイルナビ ──────────────────────────────────────
const hamburger = document.querySelector('.hamburger');
const mobileNav = document.querySelector('.mobile-nav');
const backdrop  = document.querySelector('.mobile-nav-backdrop');
const closeBtn  = document.querySelector('.mobile-nav-close');

if (hamburger) {
  const openNav  = () => {
    mobileNav.classList.add('is-open');
    backdrop.classList.add('is-open');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    sessionStorage.setItem('mobileNavOpen', '1');
  };
  const closeNav = () => {
    mobileNav.classList.remove('is-open');
    backdrop.classList.remove('is-open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    sessionStorage.removeItem('mobileNavOpen');
  };
  hamburger.addEventListener('click', openNav);
  closeBtn.addEventListener('click', closeNav);
  backdrop.addEventListener('click', closeNav);
  if (sessionStorage.getItem('mobileNavOpen') === '1') openNav();
}

// href="#" のスクロール防止
document.querySelectorAll('a[href="#"]').forEach(a => a.addEventListener('click', e => e.preventDefault()));

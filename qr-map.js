(function() {
    'use strict';
    var activeMode  = 'address';
    var elModeAddr  = document.getElementById('mode-address');
    var elModeUrl   = document.getElementById('mode-url');
    var elPanelAddr = document.getElementById('panel-address');
    var elPanelUrl  = document.getElementById('panel-url');
    var elMapAddr   = document.getElementById('map-address');
    var elMapUrl    = document.getElementById('map-url');
    var elGenerate  = document.getElementById('btn-generate');
    var elErrorMsg  = document.getElementById('error-msg');
    var elQrcode    = document.getElementById('qrcode');
    var elQrEmpty   = document.getElementById('qr-empty');
    var elQrFrame   = document.getElementById('qr-frame');
    var elUrlLabel  = document.getElementById('qr-url-label');
    var elDownload = document.getElementById('btn-download');
    document.getElementById('btn-download-svg').addEventListener('click', function() { window.location.href = 'pricing.html'; });
    var swatches    = document.querySelectorAll('.swatch:not(.swatch--custom)');
    var customColor = document.getElementById('custom-color');

    var currentColor = '#B91C1C';
    var lastContent  = '';
    var lastLabel    = '';
    var qrInstance   = null;

    elModeAddr.addEventListener('click', function() {
      activeMode = 'address';
      elModeAddr.classList.add('active'); elModeUrl.classList.remove('active');
      elPanelAddr.hidden = false; elPanelUrl.hidden = true;
      clearError();
    });
    elModeUrl.addEventListener('click', function() {
      activeMode = 'url';
      elModeUrl.classList.add('active'); elModeAddr.classList.remove('active');
      elPanelUrl.hidden = false; elPanelAddr.hidden = true;
      clearError();
    });

    elGenerate.addEventListener('click', generate);
    elMapAddr.addEventListener('keydown', function(e) { if (e.key === 'Enter') generate(); });
    elMapUrl.addEventListener('keydown', function(e) { if (e.key === 'Enter') generate(); });

    function generate() {
      clearError();
      var mapsUrl, label;
      if (activeMode === 'address') {
        var addr = elMapAddr.value.trim();
        if (!addr) { showError('住所または場所名を入力してください'); elMapAddr.focus(); return; }
        mapsUrl = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(addr);
        label = '地図: ' + addr;
      } else {
        var url = elMapUrl.value.trim();
        if (!url) { showError('Google Maps URLを入力してください'); elMapUrl.focus(); return; }
        try { new URL(url); } catch(e) { showError('正しいURLの形式で入力してください'); elMapUrl.focus(); return; }
        mapsUrl = url;
        label = '地図リンク';
      }
      lastLabel = label;
      renderQR(mapsUrl, label);
      if (lastContent && window.QRHistory) QRHistory.add({ type: 'map', content: lastContent, label: label, color: currentColor });
    }

    function renderQR(text, label) {
      lastContent = text;
      if (qrInstance) { qrInstance.clear(); elQrcode.innerHTML = ''; qrInstance = null; }
      qrInstance = new QRCode(elQrcode, {
        text: text, width: 180, height: 180,
        colorDark: currentColor, colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M,
      });
      elQrEmpty.hidden = false;
      elQrEmpty.style.display = 'none';
      elQrFrame.classList.add('has-qr');
      var display = label.length > 40 ? label.slice(0, 40) + '…' : label;
      elUrlLabel.textContent = display;
      elUrlLabel.hidden = false;
      elDownload.disabled = false;
    }

    swatches.forEach(function(btn) {
      btn.addEventListener('click', function() {
        currentColor = btn.dataset.color;
        swatches.forEach(function(s) { s.classList.remove('swatch--active'); });
        document.querySelector('.swatch--custom').classList.remove('swatch--active');
        btn.classList.add('swatch--active');
        if (lastContent) renderQR(lastContent, lastLabel);
      });
    });

    customColor.addEventListener('input', function() {
      currentColor = customColor.value;
      swatches.forEach(function(s) { s.classList.remove('swatch--active'); });
      document.querySelector('.swatch--custom').classList.add('swatch--active');
      if (lastContent) renderQR(lastContent, lastLabel);
    });

    // 画面は180pxだが、印刷・マーケ用途のため1024pxで再描画して保存
    var DOWNLOAD_SIZE = 1024;
    elDownload.addEventListener('click', function() {
      if (!lastContent) return;
      var holder = document.createElement('div');
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
        var c = elQrcode.querySelector('canvas');
        if (c) save(c);
        return;
      }
      setTimeout(function() {
        var canvas = holder.querySelector('canvas');
        var img    = holder.querySelector('img');
        if (canvas) save(canvas);
        else if (img) {
          var tmp = document.createElement('canvas');
          tmp.width = DOWNLOAD_SIZE; tmp.height = DOWNLOAD_SIZE;
          tmp.getContext('2d').drawImage(img, 0, 0, DOWNLOAD_SIZE, DOWNLOAD_SIZE); save(tmp);
        }
        document.body.removeChild(holder);
      }, 60);
    });

    function save(canvas) {
      var ts = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
      var a  = document.createElement('a');
      a.download = 'qrcode_map_' + ts + '.png';
      a.href = canvas.toDataURL('image/png');
      a.click();
    }

    function showError(msg) { elErrorMsg.textContent = msg; elErrorMsg.hidden = false; }
    function clearError()   { elErrorMsg.hidden = true; elErrorMsg.textContent = ''; }
  })();

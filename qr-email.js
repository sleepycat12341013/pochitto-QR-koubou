(function() {
    'use strict';
    var elTo       = document.getElementById('email-to');
    var elSubject  = document.getElementById('email-subject');
    var elBody     = document.getElementById('email-body');
    var elGenerate = document.getElementById('btn-generate');
    var elErrorMsg = document.getElementById('error-msg');
    var elQrcode   = document.getElementById('qrcode');
    var elQrEmpty  = document.getElementById('qr-empty');
    var elQrFrame  = document.getElementById('qr-frame');
    var elUrlLabel = document.getElementById('qr-url-label');
    var elDownload    = document.getElementById('btn-download');
    document.getElementById('btn-download-svg').addEventListener('click', function() { window.location.href = 'pricing.html'; });
    var swatches   = document.querySelectorAll('.swatch:not(.swatch--custom)');
    var customColor = document.getElementById('custom-color');

    var currentColor = '#B91C1C';
    var lastContent  = '';
    var lastLabel    = '';
    var qrInstance   = null;

    elGenerate.addEventListener('click', generate);

    function generate() {
      clearError();
      var to      = elTo.value.trim();
      var subject = elSubject.value.trim();
      var body    = elBody.value.trim();
      if (!to) { showError('宛先メールアドレスを入力してください'); elTo.focus(); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) { showError('正しいメールアドレスの形式で入力してください'); elTo.focus(); return; }

      var mailto = 'mailto:' + encodeURIComponent(to);
      var params = [];
      if (subject) params.push('subject=' + encodeURIComponent(subject));
      if (body)    params.push('body='    + encodeURIComponent(body));
      if (params.length) mailto += '?' + params.join('&');

      lastLabel = 'メール: ' + to;
      renderQR(mailto, lastLabel);
      if (lastContent && window.QRHistory) QRHistory.add({ type: 'email', content: lastContent, label: lastLabel, color: currentColor });
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
      a.download = 'qrcode_email_' + ts + '.png';
      a.href = canvas.toDataURL('image/png');
      a.click();
    }

    function showError(msg) { elErrorMsg.textContent = msg; elErrorMsg.hidden = false; }
    function clearError()   { elErrorMsg.hidden = true; elErrorMsg.textContent = ''; }
  })();

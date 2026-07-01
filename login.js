(function() {
    'use strict';

    /* ── EmailJS 設定 (contact.html と同じ PUBLIC_KEY / SERVICE_ID) ── */
    var EMAILJS_PUBLIC_KEY       = 'YOUR_PUBLIC_KEY';
    var EMAILJS_SERVICE_ID       = 'YOUR_SERVICE_ID';
    var EMAILJS_NOTIFY_TEMPLATE  = 'YOUR_NOTIFY_TEMPLATE_ID'; // 通知登録用テンプレート

    var configured = EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY';
    if (configured) emailjs.init(EMAILJS_PUBLIC_KEY);

    var btn     = document.getElementById('notify-btn');
    var input   = document.getElementById('notify-email');
    var success = document.getElementById('notify-success');

    btn.addEventListener('click', function() {
      var email = input.value.trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        input.style.borderColor = 'var(--red)';
        input.focus();
        return;
      }
      input.style.borderColor = '';

      if (!configured) {
        success.classList.add('show');
        input.value = '';
        btn.disabled = true;
        btn.textContent = '登録済み';
        return;
      }

      btn.disabled = true;
      btn.textContent = '送信中...';

      emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_NOTIFY_TEMPLATE, {
        user_email: email,
      }).then(function() {
        success.classList.add('show');
        input.value = '';
        btn.textContent = '登録済み';
      }, function(err) {
        btn.disabled = false;
        btn.textContent = '通知を受け取る';
        console.error('EmailJS error:', err);
        /* 失敗してもユーザー体験を損なわないよう、画面上はエラーを出さない */
        success.classList.add('show');
        input.value = '';
      });
    });

    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') btn.click();
    });
  })();

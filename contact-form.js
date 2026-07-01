(function () {
        "use strict";

        /* ── EmailJS 設定 ─────────────────────────────────────────────
       emailjs.com でアカウント作成後に以下を置き換えてください。
       テンプレート変数: {{from_name}} {{from_email}} {{category}} {{message}}
    ─────────────────────────────────────────────────────────── */
        var EMAILJS_PUBLIC_KEY = "UlBt4NvCcEAZSlnX_"; // Account → Public Key
        var EMAILJS_SERVICE_ID = "service_npsuqek"; // Email Services → Service ID
        var EMAILJS_TEMPLATE_ID = "template_ex16vx7"; // Email Templates → Template ID

        var configured = EMAILJS_PUBLIC_KEY !== "YOUR_PUBLIC_KEY";
        if (configured) emailjs.init(EMAILJS_PUBLIC_KEY);

        var form = document.getElementById("contact-form");
        var elName = document.getElementById("cf-name");
        var elEmail = document.getElementById("cf-email");
        var elCat = document.getElementById("cf-category");
        var elMsg = document.getElementById("cf-message");
        var elError = document.getElementById("cf-error");
        var elSubmit = document.getElementById("cf-submit");
        var successBox = document.getElementById("success-box");

        form.addEventListener("submit", function (e) {
          e.preventDefault();
          elError.hidden = true;

          var name = elName.value.trim();
          var email = elEmail.value.trim();
          var category = elCat.value;
          var message = elMsg.value.trim();

          if (!name) {
            showError("お名前を入力してください");
            elName.focus();
            return;
          }
          if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showError("正しいメールアドレスを入力してください");
            elEmail.focus();
            return;
          }
          if (!category) {
            showError("お問い合わせ種別を選択してください");
            elCat.focus();
            return;
          }
          if (!message) {
            showError("お問い合わせ内容を入力してください");
            elMsg.focus();
            return;
          }

          elSubmit.disabled = true;
          elSubmit.textContent = "送信中...";

          emailjs
            .send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
              from_name: name,
              from_email: email,
              category: category,
              message: message,
            })
            .then(
              function () {
                successBox.classList.add("show");
                form.style.display = "none";
              },
              function (err) {
                elSubmit.disabled = false;
                elSubmit.textContent = "送信する";
                showError(
                  "送信に失敗しました。しばらく経ってから再度お試しください。",
                );
                console.error("EmailJS error:", err);
              },
            );
        });

        function showError(msg) {
          elError.textContent = msg;
          elError.hidden = false;
        }
      })();

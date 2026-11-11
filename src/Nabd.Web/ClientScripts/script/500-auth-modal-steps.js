
    function setRegStep(n) {
      document.getElementById('reg-step-1')?.classList.toggle('is-on', n === 1);
      document.getElementById('reg-step-2')?.classList.toggle('is-on', n === 2);
      document.getElementById('reg-dot-2')?.classList.toggle('on', n === 2);
      document.getElementById('reg-bar')?.classList.toggle('on', n === 2);
      document.getElementById('reg-error-msg')?.classList.add('hidden');
      document.getElementById('reg-submit-error')?.classList.add('hidden');
    }

    function switchAuthModalTab(tab) {
      const isLogin = tab === 'login';
      document.getElementById('auth-pane-login')?.classList.toggle('hidden', !isLogin);
      document.getElementById('auth-pane-register')?.classList.toggle('hidden', isLogin);
      const title = document.getElementById('auth-modal-title');
      if (title) title.textContent = isLogin ? 'تسجيل الدخول' : 'إنشاء حساب';
      if (!isLogin) setRegStep(1);
    }


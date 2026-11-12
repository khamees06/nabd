/* =========================================================================
   Sign-in and registration as pages (ADR 0012). The screen is the legacy one (openAuthModal,
   closeAuthModal, switchAuthModalTab, setRegStep and the forms keep their behaviour); this file only:
   - keeps the address and the title in step with it: /login or /register while it is open, back to the
     address it was opened from when it closes (also after a successful sign-in), so the browser's Back
     button closes it and a link to /login or /register opens it. The history moves that belong to the
     screen are kept from the rest of the client (the ER room's own Back handler) and from the browser's
     scroll restoration and #fragment jumps, so closing the screen leaves the page where the legacy modal did;
   - on /login and /register (served open by AccountController), runs the legacy opening once the client has
     started, or goes to the signed-in home when an account is already signed in on this device;
   - keeps keyboard focus on the screen while it is open (the application behind it is covered), and gives
     focus a place when the focused button disappears (switching forms or registration steps);
   - shows and hides the password, and explains the Microsoft and Google buttons, which are not connected yet.
   ========================================================================= */
(function () {
  'use strict';

  const modal = document.getElementById('auth-modal');
  const loginPane = document.getElementById('auth-pane-login');
  if (!modal || !loginPane) return;

  const TITLES = { login: 'تسجيل الدخول | نَبْض الأردن', register: 'إنشاء حساب | نَبْض الأردن' };
  const HOME_TITLE = 'نَبْض الأردن | أكاديمية المحاكاة السريرية';
  // Routing is case-insensitive on the server, so the address is compared the same way.
  const onAuthAddress = () => /\/(login|register)\/?$/i.test(location.pathname);
  const baseTitle = modal.dataset.authPage || onAuthAddress() ? HOME_TITLE : document.title;
  // Relative to the current address, so the site also works below a path (…/app/login → …/app/).
  const address = page => new URL(page === 'home' ? './' : page, location.href).href;
  const isOpen = () => !modal.classList.contains('hidden');
  const currentTab = () => (loginPane.classList.contains('hidden') ? 'register' : 'login');
  const signedIn = () => typeof authState !== 'undefined' && !!authState && !!authState.isAuthenticated;

  // The page the address shows (null when it is not a sign-in page); whether the current entry is one this
  // script added when the screen opened (closing it then goes back to the entry it was opened from); and
  // whether the next popstate is the screen's own closing.
  let shown = modal.dataset.authPage || null;
  let pushed = false;
  let closing = false;

  // Going back to the entry the screen was opened from must leave the page where it is: the browser would
  // otherwise restore that entry's old scroll offset (over a signed-in home that has just scrolled to its top),
  // and jump to the address's #fragment (/#nl-method) on the first traversal after a load. So, the first time the
  // screen adds an entry, scroll restoration becomes manual for the rest of the visit (the application positions
  // its views itself), and the opener's #fragment is dropped, as navigateTo's own sign-in prompt already does.
  let manualScroll = false;
  function ownTheScroll() {
    if (!manualScroll && 'scrollRestoration' in history) { history.scrollRestoration = 'manual'; manualScroll = true; }
    if (location.hash) history.replaceState(history.state, '', location.href.split('#')[0]);
  }

  function sync() {
    const open = isOpen(), tab = currentTab();
    if (modal.dataset.authTab !== tab) modal.dataset.authTab = tab;
    document.title = open ? TITLES[tab] : baseTitle;
    if (open) {
      // A page of its own: the page behind it does not scroll (the legacy class, used on touch screens too).
      document.documentElement.classList.add('nb-auth-open');
      if (shown === tab) return;
      modal.scrollTop = 0; // the screen scrolls itself; a newly shown form starts at its top
      try {
        if (shown === null && !onAuthAddress()) {
          ownTheScroll();
          history.pushState({ nbAuth: tab, nbAuthOwn: true }, '', address(tab));
          pushed = true;
        } else history.replaceState({ nbAuth: tab, nbAuthOwn: pushed }, '', address(tab));
      } catch (e) { /* history is not available (a file: address): the screen still works */ }
      shown = tab;
    } else if (shown !== null) {
      shown = null;
      try {
        if (pushed) { pushed = false; closing = true; history.back(); }
        else history.replaceState(null, '', address('home'));
      } catch (e) { closing = false; /* see above */ }
    }
  }
  const watch = new MutationObserver(() => { sync(); keepFocus(); });
  for (const el of [modal, loginPane, document.getElementById('reg-step-1'), document.getElementById('reg-step-2')])
    if (el) watch.observe(el, { attributes: true, attributeFilter: ['class'] });

  // Registered in the capture phase, so it runs before the other popstate listeners (the ER room's Back handler
  // is added later, without capture) and can keep the screen's own history moves from them.
  window.addEventListener('popstate', e => {
    const want = e.state && e.state.nbAuth;
    if (closing) {
      // The screen has just closed and gone back to the entry it was opened from: nothing else to do.
      closing = false;
      e.stopImmediatePropagation();
      return;
    }
    if (want === 'login' || want === 'register') {
      // Forward to an entry of the screen.
      e.stopImmediatePropagation();
      const own = !!e.state.nbAuthOwn;
      if (signedIn()) {
        // Signed in since: there is nothing to sign in to. Go back to where the user was (or, for an entry this
        // script did not add, show the home address in its place).
        shown = null;
        pushed = false;
        try {
          if (own) { closing = true; history.back(); }
          else history.replaceState(null, '', address('home'));
        } catch (err) { closing = false; }
        return;
      }
      shown = want;
      pushed = own; // closing goes back again, without leaving a duplicate entry behind
      if ((!isOpen() || currentTab() !== want) && typeof window.openAuthModal === 'function') window.openAuthModal(want);
    } else if (isOpen()) {
      // Back while the screen is open closes the screen, and only the screen.
      e.stopImmediatePropagation();
      pushed = false;
      shown = null;
      if (typeof window.closeAuthModal === 'function') window.closeAuthModal();
    }
  }, true);

  /* ---------- /login and /register ---------- */
  if (shown) {
    document.documentElement.classList.add('nb-auth-open');
    document.title = TITLES[shown];
    const start = () => {
      if (signedIn() && typeof window.closeAuthModal === 'function') window.closeAuthModal();
      else if (typeof window.openAuthModal === 'function') window.openAuthModal(shown);
    };
    // The legacy start-up (initNabdApp) listens for DOMContentLoaded on window; this listener is added to window
    // after it (script.js runs before this file), so it runs once the start-up has restored any saved account.
    if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', start);
    else start();
  }

  /* ---------- keyboard focus ---------- */
  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const visible = el => !!el && el.offsetParent !== null;
  // Switching forms or registration steps hides the button that had focus; focus then goes to the screen's
  // title (no keyboard pops up on a phone), and the next Tab continues into the form that is now shown.
  function keepFocus() {
    if (!isOpen()) return;
    const active = document.activeElement;
    if (active && active !== document.body && modal.contains(active) && visible(active)) return;
    if (active && active !== document.body && !modal.contains(active)) return;
    document.getElementById('auth-modal-title')?.focus({ preventScroll: true });
  }
  // Tab stays on the screen while it is open (the application behind it is covered).
  document.addEventListener('keydown', e => {
    if (e.key !== 'Tab' || !isOpen()) return;
    const active = document.activeElement;
    if (!active || active === document.body) return; // the browser continues from where focus was
    const items = [...modal.querySelectorAll(FOCUSABLE)].filter(el => visible(el) || el === active);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (!modal.contains(active)) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
    else if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
  });

  /* ---------- the brand link goes to the home page (the landing, or the signed-in home) ---------- */
  modal.addEventListener('click', e => {
    const home = e.target.closest('[data-auth-home]');
    if (!home || typeof window.closeAuthModal !== 'function') return;
    e.preventDefault();
    window.closeAuthModal();
    if (typeof window.navigateTo === 'function') window.navigateTo(signedIn() ? 'home' : 'index');
    window.scrollTo(0, 0);
  });

  /* ---------- show or hide the password (the button's name stays; its pressed state says which) ---------- */
  modal.addEventListener('click', e => {
    const btn = e.target.closest('[data-auth-reveal]');
    if (!btn) return;
    const input = document.getElementById(btn.dataset.authReveal);
    if (!input) return;
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.setAttribute('aria-pressed', String(show));
  });

  /* ---------- Microsoft and Google: not connected yet (docs/auth-external-providers.md) ---------- */
  modal.addEventListener('click', e => {
    const btn = e.target.closest('[data-auth-provider]');
    if (!btn) return;
    const note = btn.closest('.nl-auth-sso')?.querySelector('.nl-auth-sso-note');
    if (!note) return;
    if (!note.dataset.text) note.dataset.text = note.textContent;
    note.classList.add('is-visible');
    // Emptied and written again, so that a screen reader announces it on every press.
    note.textContent = '';
    window.setTimeout(() => { note.textContent = note.dataset.text; }, 30);
  });
})();

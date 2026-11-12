/* =========================================================================
   Nabd public landing, design V6.2: the interactions of the public header, the landing sections,
   the public footer and the landing dialog. Written for the application, not taken from the prototype:
   - sign-in and registration go to the application's existing sign-in (openAuthModal), never to the
     prototype's demonstration forms;
   - the header's own login/register/brand buttons are already bound by the legacy client (script.js);
     this file adds the mobile menu, the in-page links, the remaining auth buttons and the dialog;
   - the mobile menu is the header's own menu and never opens the signed-in sidebar.
   ========================================================================= */
(function () {
  'use strict';

  const header = document.getElementById('public-header');
  const nav = document.getElementById('public-main-nav');
  const toggle = document.getElementById('public-menu-toggle');
  const dialog = document.getElementById('nl-dialog');
  if (!header || !nav || !toggle) return;

  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MOBILE = window.matchMedia('(max-width: 820px)');

  /* ---------- mobile menu ---------- */
  function setMenu(open) {
    nav.classList.toggle('nl-is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'إغلاق القائمة' : 'فتح القائمة');
  }
  const menuOpen = () => nav.classList.contains('nl-is-open');
  toggle.addEventListener('click', () => {
    const open = !menuOpen();
    setMenu(open);
    if (open) nav.querySelector('a, button')?.focus();
  });
  document.addEventListener('click', e => {
    if (menuOpen() && !nav.contains(e.target) && !toggle.contains(e.target)) setMenu(false);
  });
  MOBILE.addEventListener('change', () => { if (!MOBILE.matches) setMenu(false); });

  /* ---------- in-page links (#nl-..., #site-footer) ---------- */
  function scrollToSection(id, focus) {
    const target = id === 'nl-home' ? document.getElementById('view-index') : document.getElementById(id);
    if (!target || target.offsetParent === null) return false;
    const top = id === 'nl-home' ? 0 : target.getBoundingClientRect().top + window.scrollY - header.offsetHeight - 8;
    window.scrollTo({ top: Math.max(0, top), behavior: reduceMotion() ? 'auto' : 'smooth' });
    if (focus) {
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
    return true;
  }
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href^="#nl-"], a[href="#site-footer"]');
    if (!link || !link.closest('.nabd-landing')) return;
    const id = link.getAttribute('href').slice(1);
    // The legacy client binds the brand link to navigateTo('index'); here it only scrolls to the top.
    if (scrollToSection(id, link.id !== 'public-brand-btn')) e.preventDefault();
    setMenu(false);
  });

  /* ---------- sign-in and registration: the application's own flow ---------- */
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-nl-auth]');
    if (!btn) return;
    setMenu(false);
    if (typeof window.openAuthModal === 'function') window.openAuthModal(btn.dataset.nlAuth === 'register' ? 'register' : 'login');
  });

  /* ---------- the landing dialog (an explained preview, not a fake form) ---------- */
  const COPY = {
    academic: ['نبض للمؤسسات التعليمية', 'تستهدف نبض دعم برامج التعليم السريري في كليات الطب والتمريض من خلال تجربة محاكاة تعليمية قابلة للتطوير والمواءمة مع الاحتياجات الأكاديمية.']
  };
  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';
  let returnFocus = null;
  function openDialog(kind, trigger) {
    if (!dialog) return;
    const copy = COPY[kind] || COPY.academic;
    document.getElementById('nl-dialog-title').textContent = copy[0];
    document.getElementById('nl-dialog-message').textContent = copy[1];
    returnFocus = trigger || document.activeElement;
    setMenu(false);
    dialog.classList.add('nl-is-open');
    dialog.setAttribute('aria-hidden', 'false');
    document.getElementById('nl-dialog-close')?.focus();
  }
  function closeDialog() {
    if (!dialog || !dialog.classList.contains('nl-is-open')) return false;
    dialog.classList.remove('nl-is-open');
    dialog.setAttribute('aria-hidden', 'true');
    if (returnFocus && typeof returnFocus.focus === 'function') returnFocus.focus();
    returnFocus = null;
    return true;
  }
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-nl-dialog]');
    if (btn) openDialog(btn.dataset.nlDialog, btn);
  });
  if (dialog) {
    document.getElementById('nl-dialog-close')?.addEventListener('click', closeDialog);
    document.getElementById('nl-dialog-ok')?.addEventListener('click', closeDialog);
    dialog.addEventListener('click', e => { if (e.target === dialog) closeDialog(); });
  }

  /* ---------- keyboard: Escape closes the top layer; Tab stays inside the dialog ---------- */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (closeDialog()) return;
      if (menuOpen()) { setMenu(false); toggle.focus(); }
    }
    if (e.key === 'Tab' && dialog && dialog.classList.contains('nl-is-open')) {
      const items = [...dialog.querySelectorAll(FOCUSABLE)].filter(el => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- a link such as /#nl-method opens at that section ---------- */
  if (/^#(nl-[\w-]+|site-footer)$/.test(location.hash)) {
    window.addEventListener('load', () => setTimeout(() => scrollToSection(location.hash.slice(1), false), 50));
  }
})();

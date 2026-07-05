/* -----------------------------------------------------------------------
 * System Design — dark / light theme toggle
 * Injects a moon/sun button into mdBook's right-buttons toolbar.
 * Persists the choice in localStorage under the key mdBook already uses.
 * Falls back to the OS preference (prefers-color-scheme) on first load.
 * ----------------------------------------------------------------------- */
(function () {
  'use strict';

  var STORAGE_KEY  = 'mdbook-theme';
  var DARK_THEMES  = ['navy', 'coal', 'ayu'];
  var DEFAULT_DARK  = 'navy';
  var DEFAULT_LIGHT = 'light';
  var BTN_ID = 'dark-light-toggle';

  /* ---- helpers ---- */

  function savedTheme() {
    return localStorage.getItem(STORAGE_KEY);
  }

  function systemPrefersDark() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function resolvedTheme() {
    var t = savedTheme();
    if (t) return t;
    return systemPrefersDark() ? DEFAULT_DARK : DEFAULT_LIGHT;
  }

  function isDark(theme) {
    return DARK_THEMES.indexOf(theme) !== -1;
  }

  function applyTheme(theme) {
    /* mirror exactly what mdBook's own theme-picker does */
    var html = document.querySelector('html');
    if (html) {
      html.className = theme;
    }
    localStorage.setItem(STORAGE_KEY, theme);
  }

  /* ---- SVG icons ---- */

  function moonSVG() {
    /* shown in light mode — click to go dark */
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" ' +
        'viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
        '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>' +
      '</svg>'
    );
  }

  function sunSVG() {
    /* shown in dark mode — click to go light */
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" ' +
        'viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
        'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<circle cx="12" cy="12" r="5"/>' +
        '<line x1="12" y1="1"  x2="12" y2="3"/>' +
        '<line x1="12" y1="21" x2="12" y2="23"/>' +
        '<line x1="4.22"  y1="4.22"  x2="5.64"  y2="5.64"/>' +
        '<line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>' +
        '<line x1="1"  y1="12" x2="3"  y2="12"/>' +
        '<line x1="21" y1="12" x2="23" y2="12"/>' +
        '<line x1="4.22"  y1="19.78" x2="5.64"  y2="18.36"/>' +
        '<line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"/>' +
      '</svg>'
    );
  }

  /* ---- button ---- */

  function updateButton(btn, theme) {
    var dark = isDark(theme);
    btn.innerHTML       = dark ? sunSVG() : moonSVG();
    btn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    btn.title           = dark ? 'Switch to light theme'           : 'Switch to dark theme';
  }

  function createButton() {
    var btn = document.createElement('button');
    btn.id        = BTN_ID;
    btn.type      = 'button';
    btn.className = 'icon-button theme-toggle-btn';
    updateButton(btn, resolvedTheme());

    btn.addEventListener('click', function () {
      var current = resolvedTheme();
      var next    = isDark(current) ? DEFAULT_LIGHT : DEFAULT_DARK;
      applyTheme(next);
      updateButton(btn, next);
    });

    /* Enter / Space already fire click on <button> — keyboard accessible by default */
    return btn;
  }

  /* ---- injection ---- */

  function inject() {
    /* avoid double-inject on page transitions */
    if (document.getElementById(BTN_ID)) return;

    var target = document.querySelector('.right-buttons');
    if (!target) return;

    var btn = createButton();
    /* insert before the first child so it leads the right-side buttons */
    target.insertBefore(btn, target.firstChild);
  }

  /* ---- OS preference listener ---- */

  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
      /* only update if the user has NOT explicitly chosen a theme */
      if (!savedTheme()) {
        var theme = e.matches ? DEFAULT_DARK : DEFAULT_LIGHT;
        applyTheme(theme);
        var btn = document.getElementById(BTN_ID);
        if (btn) updateButton(btn, theme);
      }
    });
  }

  /* ---- init ---- */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();

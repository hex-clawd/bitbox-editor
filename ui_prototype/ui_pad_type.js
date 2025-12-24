/* Pad Type -> show/hide "Specific — ..." sections in Pad Details
   file:// safe, no modules, no fetch

   IMPORTANT: this project treats hiding as a style change (visibility/display),
   not the HTML boolean `hidden` attribute. */
(function () {
  function norm(s) { return String(s || '').trim().toLowerCase(); }

  function getPadTypeSelect() {
    return document.querySelector('[data-pad-type-select]') ||
           document.querySelector('select[aria-label="Pad Type"]');
  }

  function getSpecificSections() {
    return Array.from(document.querySelectorAll('[data-specific-section]'));
  }

  function hideEl(el) {
    // Hide in the way this UI expects.
    el.style.visibility = 'hidden';
    el.style.display = 'none';
  }

  function showEl(el) {
    el.style.visibility = '';
    el.style.display = '';
  }

  function showOnly(modeLabel) {
    var want = norm(modeLabel) || 'sample';
    var sections = getSpecificSections();
    if (!sections.length) return;

    for (var i = 0; i < sections.length; i++) {
      var sec = sections[i];
      var mode = norm(sec.getAttribute('data-mode'));
      if (mode === want) showEl(sec);
      else hideEl(sec);
    }
  }

  function enforceDefaultAndApply() {
    var sel = getPadTypeSelect();
    var sections = getSpecificSections();
    if (!sel || !sections.length) return false;

    // Force default on load: Sample
    if (!sel.value || norm(sel.value) === '') sel.value = 'Sample';

    showOnly(sel.value);
    return true;
  }

  function onAnyPadTypeChange(e) {
    var t = e && e.target;
    if (!t) return;

    if (t.matches && (t.matches('[data-pad-type-select]') || t.matches('select[aria-label="Pad Type"]'))) {
      showOnly(t.value);
    }
  }

  function boot() {
    // Delegated handler survives re-renders
    if (!document.__padTypeDelegatedBound) {
      document.addEventListener('change', onAnyPadTypeChange);
      document.__padTypeDelegatedBound = true;
    }

    // Apply once (if possible right now)
    enforceDefaultAndApply();

    // Re-apply whenever templates render / DOM changes
    var obs = new MutationObserver(function () {
      enforceDefaultAndApply();
    });

    obs.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

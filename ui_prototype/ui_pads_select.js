(function () {
  const STATE = {
    selected: new Set(),
    anchor: null
  };

  function isPadEl(el){
    return !!el && el.classList && el.classList.contains('pad');
  }

  function getPadIndex(padEl){
    const v = padEl.getAttribute('data-pad-index');
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  function allPads(container){
    return Array.from(container.querySelectorAll('.pad[data-pad-index]'));
  }

  function applySelection(container){
    const pads = allPads(container);
    for (const pad of pads){
      const idx = getPadIndex(pad);
      if (idx == null) continue;
      pad.classList.toggle('is-selected', STATE.selected.has(idx));
    }
  }

  function clearAndSelect(container, idx){
    STATE.selected.clear();
    STATE.selected.add(idx);
    STATE.anchor = idx;
    applySelection(container);
  }

  function toggleOne(container, idx){
    if (STATE.selected.has(idx)) STATE.selected.delete(idx);
    else STATE.selected.add(idx);
    STATE.anchor = idx;
    applySelection(container);
  }

  function selectRange(container, a, b, additive){
    const min = Math.min(a, b);
    const max = Math.max(a, b);
    if (!additive) STATE.selected.clear();
    for (let i = min; i <= max; i++) STATE.selected.add(i);
    applySelection(container);
  }

  function onPadClick(e){
    const container = e.currentTarget;
    const pad = e.target.closest('.pad');
    if (!isPadEl(pad) || !container.contains(pad)) return;

    const idx = getPadIndex(pad);
    if (idx == null) return;

    const isCtrl = !!(e.ctrlKey || e.metaKey);
    const isShift = !!e.shiftKey;

    if (isShift){
      const anchor = (STATE.anchor != null) ? STATE.anchor : idx;
      selectRange(container, anchor, idx, isCtrl);
      STATE.anchor = idx;
      return;
    }

    if (isCtrl){
      toggleOne(container, idx);
      return;
    }

    clearAndSelect(container, idx);
  }

  function initPadsSelection(){
    const container = document.querySelector('.pads');
    if (!container) return false;

    // Already initialized?
    if (container.__padsSelectInit) return true;
    container.__padsSelectInit = true;

    container.addEventListener('click', onPadClick);

    // Default selection: pad 1
    if (STATE.selected.size === 0){
      STATE.selected.add(0);
      STATE.anchor = 0;
    }
    applySelection(container);
    return true;
  }

  function boot(){
    // ui.js likely injects templates; retry a few times.
    let tries = 0;
    const maxTries = 30;
    const tick = () => {
      tries++;
      if (initPadsSelection()) return;
      if (tries < maxTries) setTimeout(tick, 25);
    };
    tick();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

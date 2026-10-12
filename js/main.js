/* Einstieg, Spielschleife, Speichern */
'use strict';
HK.SPEEDS = { 0: 0, 1: 20 * 60 * 1000, 2: 2 * 60 * 1000, 3: 6000 }; // ms je Tag
HK.last = 0;
HK.AUTO_SAVE_MS = 120000;
HK.lastSaveAt = 0;
HK.saveDue = 0;
HK.scheduleSave = function () { if (HK.state && !HK.preview && !HK.saveDue) HK.saveDue = Date.now() + 2000; };

HK.loop = function (ts) {
  const dt = Math.min(0.1, (ts - HK.last) / 1000 || 0); HK.last = ts;
  const st = HK.state;
  if (st) {
    if (!st.gameOver && st.speed > 0 && !HK.UI.modalOpen) {
      HK.Scene.clock += dt * 1000 / HK.SPEEDS[st.speed];
      if (HK.Scene.clock >= 1) { HK.Scene.clock -= 1; HK.tick(st); HK.UI.renderAll(); HK.scheduleSave(); }
      else if (Math.floor(ts / 500) !== Math.floor((ts - dt * 1000) / 500)) HK.UI.renderHeader();
    }
    if (HK.preview) HK.Scene.clock = (HK.Scene.clock + dt / 240) % 1;
    st.timeOfDay = HK.Scene.clock;
    if(HK.advanceNightCargo(st)) HK.UI.renderAll();
    HK.Scene.update(dt);
    HK.Scene.draw();
    if (Math.floor(ts / 400) !== Math.floor((ts - dt * 1000) / 400)) HK.UI.syncBackdrop();
    if (!HK.preview && ((HK.saveDue && Date.now() >= HK.saveDue) || Date.now() - HK.lastSaveAt >= HK.AUTO_SAVE_MS)) HK.autosave();
  }
  requestAnimationFrame(HK.loop);
};
HK.setSpeed = function (n) { if (HK.state) { HK.state.speed = n; HK.lehrgangWeiter(HK.state); HK.UI.renderHeader(); if (HK.UI.tab === 'missions') HK.UI.renderSidebar(); HK.UI.renderTabs(); } };
HK.stepDay = function () { if (HK.state && !HK.state.gameOver) { HK.tick(HK.state); HK.Scene.clock = 0.3; HK.UI.renderAll(); HK.autosave(); } };

HK.autosave = function () {
  if (!HK.state || HK.preview) return false;
  HK.state.timeOfDay = HK.Scene.clock;
  // Back off after a failure rather than retrying every animation frame.
  HK.lastSaveAt = Date.now(); HK.saveDue = 0;
  try { localStorage.setItem(HK.SAVE_KEY, HK.serialize(HK.state)); HK.saveFailed = false; return true; }
  catch (e) { if (!HK.saveFailed) HK.UI.toast(HK.t('saveFailed'), 'bad', 6000); HK.saveFailed = true; return false; }
};
HK.saveGame = function () { if (HK.autosave()) HK.UI.toast(HK.t('saved'), 'good'); };
HK.loadGame = function () {
  try {
    const json = localStorage.getItem(HK.SAVE_KEY);
    if (!json) { HK.UI.toast(HK.t('noSave'), 'bad'); return false; }
    HK.startWithState(HK.deserialize(json)); HK.UI.toast(HK.t('loaded'), 'good'); return true;
  } catch (e) { HK.UI.toast(HK.t('importError'), 'bad'); return false; }
};
HK.exportGame = function () {
  HK.state.timeOfDay = HK.Scene.clock;
  const blob = new Blob([HK.serialize(HK.state)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = 'sundhaven-' + HK.state.name.replace(/\s+/g, '_') + '-' + HK.state.day + '.json'; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};
HK.importGame = function (file) {
  const r = new FileReader();
  r.onload = () => { try { HK.startWithState(HK.deserialize(r.result)); HK.UI.toast(HK.t('loaded'), 'good'); } catch (e) { HK.UI.toast(HK.t('importError'), 'bad'); } };
  r.readAsText(file);
};
HK.startWithState = function (st) {
  HK.state = st; st.speed = 0; HK.preview = false;
  HK.Scene.snapShips(); HK.Scene.resetCam(); HK.Scene.selected = 'kontor'; HK.Scene.clock = Number.isFinite(st.timeOfDay) ? HK.clamp(st.timeOfDay, 0, 0.999999) : 0.35; HK.Scene.weatherDay = -1;
  HK.UI.panel = 'kontor'; HK.UI.selectedVisitor = null; HK.UI.closeModal(); HK.UI.showGame(); HK.UI.setTab('place'); HK.UI.renderAll();
  HK.lastSaveAt = Date.now(); HK.saveDue = 0; HK.scheduleSave();
  HK.Audio?.start();
};
HK.setLang = function (lang) {
  HK.LANG = lang;
  try { localStorage.setItem('hanse-kontor-lang', lang); } catch (e) { /* */ }
  document.documentElement.lang = lang;
  HK.UI.applyStaticTexts();
  if (HK.state) HK.UI.renderAll();
  if (HK.UI.modalOpen && HK.UI.modalRender) HK.UI.modalRender();
  if (HK.UI.titleRender && !document.getElementById('title-screen').hidden) HK.UI.titleRender();
};
document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('visibilitychange', () => { if (document.hidden) HK.autosave(); });
  window.addEventListener('pagehide', () => HK.autosave());
  let stored = null; try { stored = localStorage.getItem('hanse-kontor-lang'); } catch (e) { /* */ }
  if (stored) HK.LANG = stored; else if (navigator.language && !navigator.language.startsWith('de')) HK.LANG = 'en';
  document.documentElement.lang = HK.LANG;
  HK.UI.init(); HK.Scene.init(document.getElementById('scene'));
  HK.onLog = e => HK.UI.onLog(e);
  HK.onWin = () => HK.UI.showEnd(true);
  HK.onTitle = t => HK.UI.showTitleWon(t);
  HK.onDecision = ch => HK.UI.showDecision(ch);
  HK.onOffer = o => HK.UI.showOffer(o);
  HK.onSuccession = h => HK.UI.showSuccession(h);
  HK.onChronicle = () => HK.UI.showChronicle();
  HK.onGameOver = () => HK.UI.showEnd(false);
  let hasSave = false; try { hasSave = !!localStorage.getItem(HK.SAVE_KEY); } catch (e) { /* */ }
  // Vorschau der Stadt im Abendlicht hinter dem Titelbild
  HK.state = HK.newGame({ name: '', difficulty: 'normal' }); HK.preview = true; HK.Scene.snapShips(); HK.Scene.clock = 0.7; HK.Scene.weatherDay = 0; HK.Scene.weather = 'clear';
  HK.UI.showTitle(hasSave);
  requestAnimationFrame(HK.loop);
});

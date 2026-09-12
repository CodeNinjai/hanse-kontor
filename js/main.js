/* Einstieg, Spielschleife, Speichern */
'use strict';

HK.SPEEDS = { 0: 0, 1: 2000, 2: 900, 3: 300 }; // ms je Tag
HK.timer = null; HK.lastTick = 0;

HK.loop = function (ts) {
  const st = HK.state;
  if (st && !st.gameOver && st.speed > 0 && !HK.UI.modalOpen) {
    if (ts - HK.lastTick >= HK.SPEEDS[st.speed]) {
      HK.lastTick = ts;
      HK.tick(st);
      HK.UI.renderAll();
      if (st.day % 10 === 0) HK.autosave();
    }
  }
  requestAnimationFrame(HK.loop);
};

HK.setSpeed = function (n) { if (HK.state) { HK.state.speed = n; HK.lastTick = performance.now(); HK.UI.renderHeader(); } };
HK.stepDay = function () { if (HK.state && !HK.state.gameOver) { HK.tick(HK.state); HK.UI.renderAll(); } };

HK.autosave = function () { try { localStorage.setItem(HK.SAVE_KEY, HK.serialize(HK.state)); } catch (e) { /* ignorieren */ } };
HK.saveGame = function () { HK.autosave(); HK.UI.toast(HK.t('saved'), 'good'); };
HK.loadGame = function () {
  try {
    const json = localStorage.getItem(HK.SAVE_KEY);
    if (!json) { HK.UI.toast(HK.t('noSave'), 'bad'); return false; }
    HK.startWithState(HK.deserialize(json));
    HK.UI.toast(HK.t('loaded'), 'good');
    return true;
  } catch (e) { HK.UI.toast(HK.t('importError'), 'bad'); return false; }
};
HK.exportGame = function () {
  const blob = new Blob([HK.serialize(HK.state)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'hanse-kontor-' + HK.state.playerName.replace(/\s+/g, '_') + '-' + HK.t('day') + HK.state.day + '.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};
HK.importGame = function (file) {
  const r = new FileReader();
  r.onload = () => { try { HK.startWithState(HK.deserialize(r.result)); HK.UI.toast(HK.t('loaded'), 'good'); } catch (e) { HK.UI.toast(HK.t('importError'), 'bad'); } };
  r.readAsText(file);
};

HK.startWithState = function (state) {
  HK.state = state;
  state.speed = 0;
  HK.UI.selectedCity = state.home;
  HK.UI.selectedShip = state.ships.length ? state.ships[0].id : null;
  HK.UI.closeModal();
  HK.UI.showGame();
  HK.UI.renderAll();
};

HK.setLang = function (lang) {
  HK.LANG = lang;
  try { localStorage.setItem('hanse-kontor-lang', lang); } catch (e) { /* */ }
  document.documentElement.lang = lang;
  HK.UI.applyStaticTexts();
  if (HK.Map.svg) HK.Map.relabel();
  if (HK.state) HK.UI.renderAll();
  if (HK.UI.modalOpen && HK.UI.modalRender) HK.UI.modalRender();
};

document.addEventListener('DOMContentLoaded', () => {
  let storedLang = null;
  try { storedLang = localStorage.getItem('hanse-kontor-lang'); } catch (e) { /* */ }
  if (storedLang) HK.LANG = storedLang;
  else if (navigator.language && !navigator.language.startsWith('de')) HK.LANG = 'en';
  document.documentElement.lang = HK.LANG;
  HK.UI.init();
  HK.Map.init(document.getElementById('map'));
  HK.onLog = (entry) => HK.UI.onLog(entry);
  HK.onPromotion = (rank) => HK.UI.toast(HK.t('promoted', { rank: HK.name(HK.RANKS[rank]) }), 'good', 6000);
  HK.onWin = () => HK.UI.showEnd(true);
  HK.onGameOver = () => HK.UI.showEnd(false);
  let hasSave = false;
  try { hasSave = !!localStorage.getItem(HK.SAVE_KEY); } catch (e) { /* */ }
  HK.UI.showTitle(hasSave);
  requestAnimationFrame(HK.loop);
});

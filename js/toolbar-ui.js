/* Persistent game controls, separate from the selected building and its books. */
'use strict';
{
 const text={toolbarLabel:['Spielsteuerung','Game controls'],toolbarTools:['Ansicht und Spieloptionen','View and game options'],toolbarSettings:['Einstellungen','Settings'],toolbarLanguage:['Sprache','Language'],toolbarMainMenu:['Hauptmenü','Main menu'],toolbarResume:['Weiter','Resume'],toolbarTime:['Zeit','Time']};
 for(const[k,v]of Object.entries(text))for(const[i,lang]of ['de','en'].entries())HK.I18N[lang][k]=v[i];
 const icons={
  map:'<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2zm6-2v16m6-14v16"/>',
  save:'<path d="M5 3h12l4 4v14H3V3zm2 0v6h9V3M7 21v-8h10v8"/>',
  help:'<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 4m0 3h.01"/>',
  settings:'<path d="m9 3 6 0 .7 3 2 .9 2.8-.9 2 5-2.4 1.8-.1 2.2 2 2-3.7 4-2.5-1.5-2.2.5-1.4 2.5-5-2 .4-2.9-1.5-1.7-2.9-.3.1-5.4 2.9-.7L8 6z" transform="translate(1 0) scale(.88)"/><circle cx="12" cy="12" r="3"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
  home:'<path d="m3 11 9-8 9 8M5 9v12h14V9M9 21v-7h6v7"/>',
  play:'<path d="m8 4 12 8-12 8z" fill="currentColor" stroke="none"/>',
  pause:'<path d="M7 4h3v16H7zm7 0h3v16h-3z" fill="currentColor" stroke="none"/>',
 };
 const icon=key=>`<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${icons[key]}</svg>`;
 HK.UI.updateToolbarTime=function(st){
  const button=this.$('btn-pause'),paused=!st.speed;
  if(st.speed)this.resumeSpeed=st.speed;
  const shape=button.querySelector('.pause-icon'),kind=paused?'play':'pause';
  if(shape.dataset.shape!==kind){shape.innerHTML=icon(kind);shape.dataset.shape=kind;}
  button.querySelector('.pause-label').textContent=HK.t(paused?'toolbarResume':'pause');
  button.title=HK.t(paused?'resumeTime':'pause');button.setAttribute('aria-label',button.title);button.setAttribute('aria-pressed',String(paused));
  this.$('time-toggle').querySelector('.time-caption').textContent=HK.t('toolbarTime');
  for(let i=1;i<=3;i++)this.$('btn-s'+i).setAttribute('aria-pressed',String(st.speed===i));
 };
 const init=HK.UI.init;
 HK.UI.init=function(){
  document.querySelectorAll('[data-tool-icon]').forEach(el=>el.innerHTML=icon(el.dataset.toolIcon));
  init.call(this);
 };
}

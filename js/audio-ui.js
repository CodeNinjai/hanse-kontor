/* Compact persistent controls; changing sliders does not touch the save or game clock. */
'use strict';
Object.assign(HK.UI,{
  audioStatus() {
    const A=HK.Audio,button=this.$('btn-audio-mute'),status=this.$('audio-status'),retry=this.$('audio-retry');
    if(button){button.innerHTML=`<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 9h4l5-4v14l-5-4H4z"/>${A.settings.muted?'<path d="m17 9 5 6m0-6-5 6"/>':'<path d="M17 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>'}</svg>`;button.setAttribute('aria-pressed',String(A.settings.muted));button.title=HK.t(A.settings.muted?'audioUnmute':'audioMute');button.setAttribute('aria-label',button.title);}
    if(status)status.textContent=A.error?HK.t(A.error):A.settings.muted||A.settings.master===0||(A.settings.music===0&&A.settings.ambience===0)?HK.t('audioMuted'):A.settings.music===0?HK.t('audioAmbienceOnly'):A.track?HK.t('audioPlaying',{track:A.tracks[A.track].title})+' · '+HK.t('audioStyle_'+A.tracks[A.track].style):HK.t('audioReady');
    if(retry)retry.hidden=A.error==='audioUnavailable'||(!A.error&&A.context?.state==='running');
    const gull=this.$('audio-gull');if(gull)gull.disabled=A.settings.muted||A.settings.master===0||A.settings.ambience===0;
    const toggle=this.$('audio-muted');if(toggle)toggle.checked=A.settings.muted;
  },
  showAudio() {
    const render=()=>{
      const A=HK.Audio;
      const html=`<h2>${HK.t('audioTitle')}</h2><p class="hint">${HK.t('audioHint')}</p><div class="audio-sliders">${[['master','audioMaster'],['music','audioMusic'],['ambience','audioAmbience']].map(([key,label])=>`<label for="audio-${key}"><span>${HK.t(label)}</span><output id="audio-${key}-value" for="audio-${key}">${Math.round(A.settings[key]*100)} %</output><input type="range" id="audio-${key}" data-audio-setting="${key}" min="0" max="100" step="1" value="${Math.round(A.settings[key]*100)}"></label>`).join('')}</div><label class="check"><input type="checkbox" id="audio-muted" ${A.settings.muted?'checked':''}>${HK.t('audioMute')}</label><p id="audio-status" role="status"></p><div class="btn-row"><button id="audio-gull">${HK.t('audioGullPreview')}</button><button id="audio-next">${HK.t('audioNext')}</button><button id="audio-retry">${HK.t('audioRetry')}</button><button data-close>${HK.t('close')}</button></div><details class="music-credits"><summary>${HK.t('audioCredits')}</summary><p>${Object.values(A.tracks).map(t=>`<a href="https://incompetech.com/music/royalty-free/index.html?isrc=${t.isrc}" target="_blank" rel="noopener">${t.title}</a>`).join(', ')} — <a href="https://incompetech.com/" target="_blank" rel="noopener">Kevin MacLeod</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a></p><small>${HK.t('audioChanges')}</small><p>${HK.t('audioFieldCredits')} <a href="https://opengameart.org/content/rpg-sound-package" target="_blank" rel="noopener">Tuomo Untinen</a> · <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noopener">CC BY 3.0</a>. <a href="assets/audio/ambience/CREDITS.txt" target="_blank" rel="noopener">${HK.t('audioSources')}</a></p></details>`;
      const modal=this.modal(html);this.modalRender=render;
      modal.querySelectorAll('[data-audio-setting]').forEach(input=>input.addEventListener('input',()=>{A.set(input.dataset.audioSetting,+input.value/100);this.$(input.id+'-value').textContent=input.value+' %';if(!A.activated&&!A.settings.muted)A.start();}));
      this.$('audio-muted').addEventListener('change',e=>{A.set('muted',e.target.checked);if(!A.settings.muted)A.start();});
      this.$('audio-gull').addEventListener('click',async()=>{if(await A.start())A.effect('gull',.9);});
      this.$('audio-next').addEventListener('click',()=>A.skipTrack());
      this.$('audio-retry').addEventListener('click',()=>{A.set('muted',false);A.start();});this.audioStatus();
    };render();
  },
});
const audioUIInit=HK.UI.init,audioStaticTexts=HK.UI.applyStaticTexts;
HK.UI.init=function(){audioUIInit.call(this);HK.Audio.readSettings();this.$('btn-audio').addEventListener('click',()=>this.showAudio());this.$('btn-audio-mute').addEventListener('click',()=>{HK.Audio.set('muted',!HK.Audio.settings.muted);if(!HK.Audio.settings.muted)HK.Audio.start();});document.addEventListener('visibilitychange',()=>HK.Audio.visibility());window.addEventListener('pagehide',()=>HK.Audio.silence());this.audioStatus();};
HK.UI.applyStaticTexts=function(){audioStaticTexts.call(this);this.audioStatus();};

Object.assign(HK.I18N.de,{audioGullPreview:'Möwen anhören'});
Object.assign(HK.I18N.en,{audioGullPreview:'Listen to gulls'});

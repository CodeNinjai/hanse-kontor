'use strict';
{
 const texts={
 diceTitle:['Der letzte Wurf','One more throw'],
 diceIntro:['Sammle Augen. Bei einer Eins ist dein Einsatz verloren. Du entscheidest vor jedem Wurf: ein Würfel, zwei Würfel oder auszahlen lassen.','Collect points. Any one loses your stake. Before each throw, choose one die, two dice or cash out.'],
 diceTerms:['9 Augen bringen deinen Einsatz zurück, 18 verdoppeln ihn. Höchstens 6 Würfe pro Runde.','9 points return your stake; 18 double it. At most 6 throws per round.'],
 diceStart:['Platz nehmen · Einsatz setzen','Take a seat · Place stake'],
 diceStakeError:['Wähle einen ganzen Einsatz zwischen 1 und 200 Mark.','Choose a whole-number stake between 1 and 200 marks.'],
 diceAlreadyPlaying:['Deine Runde läuft noch.','Your round is still in progress.'],
 diceStakeLimit:['Tischlimit: 200 Mark','Table limit: 200 marks'],
 dicePoints:['Augen','Points'],diceThrows:['Wurf {n} von 6','Throw {n} of 6'],
 diceStake:['Gesetzter Einsatz','Stake placed'],dicePayout:['Auszahlung beim Aufhören','Cash out now'],diceNet:['Ergebnis nach Einsatz','Net result'],
 diceOne:['Mit einem Würfel','Roll one die'],diceTwo:['Mit zwei Würfeln','Roll two dice'],
 diceOneRisk:['2–6 Augen · Verlustrisiko 16,7 %','2–6 points · 16.7% loss risk'],
 diceTwoRisk:['4–12 Augen · Verlustrisiko 30,6 %','4–12 points · 30.6% loss risk'],
 diceBank:['{n} Mark nehmen · Runde beenden','Take {n} marks · End round'],
 diceBelow:['Noch unter deinem Einsatz. Nimm den Rest zurück oder riskiere einen weiteren Wurf.','Still below your stake. Take the remainder back or risk another throw.'],
 diceAhead:['Du kannst jetzt mit Gewinn aufhören. Beim Weiterwürfeln steht die ganze Auszahlung auf dem Spiel.','You can leave with a profit now. Another throw risks the entire payout.'],
 diceEven:['Dein Einsatz ist gedeckt. Nimm ihn zurück oder spiele auf Gewinn.','Your stake is covered. Take it back or play for a profit.'],
 diceFirst:['Dein Einsatz liegt auf dem Tisch. Wähle deine Würfel für den ersten Wurf.','Your stake is on the table. Choose your dice for the first throw.'],
 diceBust:['Eine Eins! Die Runde ist verloren.','A one! This round is lost.'],
 diceBanked:['Ausgezahlt. Die Runde ist beendet.','Paid out. This round is over.'],
 diceLast:['Sechster Wurf: Deine Punkte wurden automatisch ausgezahlt.','Sixth throw: your points were cashed out automatically.'],
 dicePaid:['Ausgezahlt, einschließlich Einsatz','Paid, including returned stake'],
 diceFaith:['Frömmigkeit −{n}','Piety −{n}'],diceAgain:['Nächste Runde vorbereiten','Prepare another round'],
 diceFace:['Würfel: {n}','Die: {n}'],diceHistory:['Deine Würfe','Your throws'],diceEmpty:['Noch kein Wurf','No throw yet'],
 diceReceipt:['Würfeltisch: {stake} Mark Einsatz, {payout} Mark Auszahlung. Ergebnis: {net} Mark.','Dice table: {stake} marks staked, {payout} marks paid. Net result: {net} marks.'],
 gambleHelp:['In der Taverne „Zum Goldenen Hering“ spielst du „Der letzte Wurf“. Setze 1–200 Mark; der Einsatz wird sofort aus der Kasse genommen. Vor jedem Wurf wählst du einen oder zwei faire Würfel. Fällt irgendwo eine Eins, endet die Runde und der Einsatz ist verloren. Andernfalls werden alle Augen zu deinen Punkten addiert. Nach jedem erfolgreichen Wurf kannst du aufhören: Auszahlung = Einsatz × Punkte ÷ 9, auf ganze Mark abgerundet. Diese Auszahlung enthält den zurückgewonnenen Einsatz. Beispiel: 90 Mark Einsatz und 12 Augen ergeben 120 Mark Auszahlung, also 30 Mark Gewinn. Mit einem Würfel beträgt das Verlustrisiko 1/6 (16,7 %), mit zwei Würfeln 11/36 (30,6 %). Nach sechs erfolgreichen Würfen wird automatisch ausgezahlt. Eine neue Runde erfordert einen neuen Einsatz. Pro beendeter Runde besteht unabhängig vom Ergebnis eine Chance von 15 Prozent auf einen verlorenen Frömmigkeitspunkt. Laufende Runden und ihr Zufallszustand werden gespeichert; Verlassen und Wiederöffnen setzen sie fort.','At the Golden Herring Tavern, play One more throw. Stake 1–200 marks, deducted immediately. Before each throw, choose one or two fair dice. Any one ends the round and loses the stake. Otherwise, add every die to your score. After any successful throw, cash out: stake × score ÷ 9, rounded down to whole marks. This payment includes the returned stake. Example: 90 marks staked and 12 points pay 120 marks, a net profit of 30. One die has a 1/6 loss risk (16.7%); two dice have an 11/36 loss risk (30.6%). Six successful throws cash out automatically. Each new round requires another stake. Each completed round independently has a 15 percent chance of costing one piety point. Your round and its random state are saved; leaving and returning resumes it.']
 };
 for(const [key,value]of Object.entries(texts)){HK.I18N.de[key]=value[0];HK.I18N.en[key]=value[1];}
}
Object.assign(HK.UI,{
 diceFace(n){
  const spots={1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]};
  return `<span class="dice-face ${n===1?'dice-danger':''}" role="img" aria-label="${HK.t('diceFace',{n})}"><svg viewBox="0 0 60 60" aria-hidden="true">${spots[n].map(i=>`<circle cx="${14+(i%3)*16}" cy="${14+Math.floor(i/3)*16}" r="5"/>`).join('')}</svg></span>`;
 },
 diceTable(){
  const r=HK.state.diceGame?.round,active=r?.status==='playing',showResult=r&&!active&&this.diceDismissed!==r.id;
  let h=`<section class="tavern-dice">${this.helpHeading('diceTitle','gambleHelp')}<p>${HK.t('diceIntro')}</p>`;
  if(active||showResult){
   const payout=active?HK.dicePayout(r):r.payout,net=payout-r.stake,faces=r.throws.at(-1);
   h+=`<div class="dice-board"><div class="dice-board-heading"><span>${HK.t('diceThrows',{n:r.throws.length})}</span><strong>${r.score} <small>${HK.t('dicePoints')}</small></strong></div><div class="dice-tray">${faces?faces.map(n=>this.diceFace(n)).join(''):`<span class="hint">${HK.t('diceEmpty')}</span>`}</div><div class="dice-history" aria-label="${HK.t('diceHistory')}">${r.throws.map((dice,i)=>`<span class="${dice.includes(1)?'bust':''}">${i+1}. ${dice.join(' + ')}</span>`).join('')}</div></div>`;
   h+=`<dl class="dice-account"><div><dt>${HK.t('diceStake')}</dt><dd>${this.money(r.stake)}</dd></div><div><dt>${HK.t(active?'dicePayout':'dicePaid')}</dt><dd>${this.money(payout)}</dd></div><div class="${net>0?'positive':net<0?'negative':''}"><dt>${HK.t('diceNet')}</dt><dd>${this.money(net,true)}</dd></div></dl>`;
   const message=active?(!r.throws.length?'diceFirst':net<0?'diceBelow':net>0?'diceAhead':'diceEven'):r.status==='bust'?'diceBust':r.throws.length===6?'diceLast':'diceBanked';
   h+=`<p class="dice-message" role="status">${HK.t(message)}</p>`;
   if(active){
    h+=`<div class="dice-choices">${[1,2].map(n=>`<button data-action="diceroll" data-count="${n}" data-id="${r.id}" data-turn="${r.throws.length}"><b>${HK.t(n===1?'diceOne':'diceTwo')}</b><small>${HK.t(n===1?'diceOneRisk':'diceTwoRisk')}</small></button>`).join('')}</div>${r.throws.length?`<button class="primary dice-bank" data-action="dicebank" data-id="${r.id}" data-turn="${r.throws.length}">${HK.t('diceBank',{n:HK.fmt(payout)})}</button>`:''}`;
   }else h+=`${r.pietyLoss?`<p class="hint">${HK.t('diceFaith',{n:r.pietyLoss})}</p>`:''}<button data-action="diceagain">${HK.t('diceAgain')}</button>`;
  }else h+=`<div class="dice-board dice-welcome"><div class="dice-tray">${[4,5].map(n=>this.diceFace(n)).join('')}</div><p>${HK.t('diceTerms')}</p></div><label for="bet-input">${HK.t('bet')} (${HK.t('mark')})</label><div class="btn-row"><input id="bet-input" type="number" min="1" max="200" step="1" data-field="bet" value="${this.esc(this.inputs.bet)}"><button class="primary" data-action="dicestart">${HK.t('diceStart')}</button></div><small class="hint">${HK.t('diceStakeLimit')}</small>`;
  return h+'</section>';
 }
});
{
 const action=HK.UI.action;
 HK.UI.action=function(d){
  if(!['dicestart','diceroll','dicebank','diceagain'].includes(d.action))return action.call(this,d);
  const st=HK.state;if(!st||st.gameOver)return;
  if(d.action==='diceagain'){this.diceDismissed=st.diceGame?.round?.id;this.renderSidebar();this.sidebar.querySelector('#bet-input')?.focus();return;}
  const r=d.action==='dicestart'?HK.diceStart(st,Number(this.inputs.bet)):d.action==='diceroll'?HK.diceRoll(st,Number(d.count),Number(d.id),Number(d.turn)):HK.diceBank(st,Number(d.id),Number(d.turn));
  if(!this.result(r))return;
  HK.scheduleSave?.();this.renderAll();
  // Results are already committed; decoration never decides or delays payment.
  if(d.action==='diceroll'&&!matchMedia('(prefers-reduced-motion: reduce)').matches)this.sidebar.querySelectorAll('.dice-tray .dice-face').forEach((el,i)=>el.animate([{transform:'translateY(-12px) rotate(-18deg)',opacity:.45},{transform:'translateY(2px) rotate(7deg)',opacity:1},{transform:'none'}],{duration:380,delay:i*55,easing:'ease-out'}));
  this.sidebar.querySelector(st.diceGame.round.status==='playing'?'[data-action="diceroll"]':'[data-action="diceagain"]')?.focus({preventScroll:true});
 };
}

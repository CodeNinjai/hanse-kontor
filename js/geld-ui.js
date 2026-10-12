/* Currency decoration stays in the UI; translations, save data and amounts are
   plain text. Never reinterpret unrelated numeric game statistics as money. */
'use strict';
HK.UI.money=function(n,signed=false){return `<span class="money-amount">${signed&&n>0?'+':''}${HK.fmt(Object.is(n,-0)?0:n)} <small>${HK.t('mark')}</small></span>`;};
HK.MoneyUI={
 decorate(root){
  if(!root)return;
  const skip='.money-amount,script,style,svg,select,option,textarea,input,[contenteditable],#hud,.no-money-decoration';
  const full=/^[+−–-]?\s*\d[\d.,\s\u00a0]*\s+(?:Mark|marks?)$/i;
  // Prices with a separate <small>currency</small> keep their existing markup.
  for(const el of root.querySelectorAll('strong,b,dd,.decision-price')){
   if(!el.closest(skip)&&full.test(el.textContent.trim())&&!el.querySelector('.money-amount,button,input,select'))el.classList.add('money-amount');
  }
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];
  while(walker.nextNode()){const node=walker.currentNode;if(node.parentElement&&!node.parentElement.closest(skip))nodes.push(node);}
  const pattern=/[+−–-]?\d[\d.,]*(?:[ \u00a0\u202f]\d{3})*\s+(?:Mark|marks?)\b/gi;
  for(const node of nodes){
   const value=node.nodeValue;pattern.lastIndex=0;const matches=[...value.matchAll(pattern)];if(!matches.length)continue;
   const fragment=document.createDocumentFragment();let end=0;
   for(const m of matches){fragment.append(value.slice(end,m.index));const amount=document.createElement('span');amount.className='money-amount';amount.textContent=m[0];fragment.append(amount);end=m.index+m[0].length;}
   fragment.append(value.slice(end));node.replaceWith(fragment);
  }
  // Explicit currency cells whose column heading already provides the unit.
  for(const el of root.querySelectorAll('[data-money],.commodity-prices>span')){
   if(el.closest('.money-amount'))continue;
   for(const node of [...el.childNodes])if(node.nodeType===Node.TEXT_NODE&&/^[+−–-]?\s*\d[\d.,\s]*$/.test(node.textContent)&&node.textContent.trim()){
    const amount=document.createElement('span');amount.className='money-amount';amount.textContent=node.textContent;node.replaceWith(amount);
   }
   for(const child of el.querySelectorAll('b,strong'))if(!child.closest('.money-amount')&&/^[+−–-]?\s*\d[\d.,\s]*$/.test(child.textContent))child.classList.add('money-amount');
  }
  // Native number inputs cannot contain SVG; their visible control gets a coin.
  for(const input of root.querySelectorAll('input[data-field="loan"],input[data-field="bill"],input[data-field="bet"],input[data-field="donate"]')){
   if(input.parentElement.classList.contains('money-input'))continue;
   const wrap=document.createElement('span');wrap.className='money-input';input.before(wrap);wrap.append(input);
  }
 },
};
{
 const U=HK.UI;
 for(const name of ['renderSidebar','modal','toast']){
  const original=U[name];U[name]=function(...args){const result=original.apply(this,args);HK.MoneyUI.decorate(name==='renderSidebar'?this.sidebar:this.$(name==='modal'?'modal':'toasts'));return result;};
 }
 // Incremental quotes and dialog updates also receive the same treatment.
 const pending=new Set();let queued=false;
 const observer=new MutationObserver(records=>{
  for(const r of records){const root=r.target.nodeType===1?r.target:r.target.parentElement;
   if(root&&!root.closest('.money-amount,.money-input'))pending.add(root);
  }
  if(!queued&&pending.size){queued=true;queueMicrotask(()=>{queued=false;const roots=[...pending].filter(el=>el.isConnected);pending.clear();for(const el of roots)if(!roots.some(other=>other!==el&&other.contains(el)))HK.MoneyUI.decorate(el);});}
 });
 for(const id of ['sidebar','modal','toasts']){const root=U.$(id);if(root)observer.observe(root,{childList:true,characterData:true,subtree:true});}
}

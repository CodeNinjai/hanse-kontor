'use strict';
HK.UI.deliveryCalculation=function(c,status){
 if(c.type!=='deliver'||c.saltStory)return'';
 const finished=['done','failed'].includes(status),r=finished?c.receipt:HK.deliveryProjection(HK.state,c);
 if(!r)return `<small>${HK.t('deliveryOldReceipt')}</small>`;
 const money=v=>HK.fmt(Math.round(v)),value=r.contribution;
 return `<div class="delivery-result"><span>${HK.t(finished?'deliverySettled':'deliveryEstimate')}</span><strong class="${value<0?'negative':'positive'}">${value>0?'+':''}${money(value)} ${HK.t('mark')}</strong></div><details class="delivery-calculation"><summary>${HK.t('deliveryCalculation')}</summary><dl><dt>${HK.t('deliveryRevenue')}</dt><dd>${money(c.receipt?.revenue??c.reward)} ${HK.t('mark')}</dd><dt>${HK.t('deliveryBasis')}</dt><dd>${money(r.basis??r.stock)} ${HK.t('mark')}</dd>${!finished?`<dt>${HK.t('deliveryShortfall')}</dt><dd>${money(r.cost)} ${HK.t('mark')}</dd>`:''}<dt>${HK.t('deliveryExtras')}</dt><dd>${money(r.extras)} ${HK.t('mark')}</dd></dl>${r.pending?`<small>${HK.t('deliveryBound',{qty:r.pending,cost:money(r.bound)})}</small>`:''}${r.available===false?`<small class="plan-risk">${HK.t('deliveryUnavailable')}</small>`:''}${!finished?`<small>${HK.t('deliveryEstimateRisk')}</small>${c.shady?`<small class="plan-risk">${HK.t('deliveryShadyRisk')}</small>`:''}`:''}${this.contextualHelp('deliveryCalculationHelp',HK.t('deliveryCalculation'))}</details>`;
};
{
 const card=HK.UI.missionContractCard;HK.UI.missionContractCard=function(c,status){const html=card.call(this,c,status),calculation=this.deliveryCalculation(c,status);return html.includes('<div class="mission-progress">')?html.replace('<div class="mission-progress">',calculation+'<div class="mission-progress">'):html.replace('</article>',calculation+'</article>');};
 const plan=HK.UI.tradePlanCard;HK.UI.tradePlanCard=function(c,active){return plan.call(this,c,active).replace('<p class="plan-stock">',this.deliveryCalculation(c,active?'active':'available')+'<p class="plan-stock">');};
}

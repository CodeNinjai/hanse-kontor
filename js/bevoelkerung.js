/* Persistent identities for the people visible in town. Cosmetic biographies do
   not invent purchases, production, relationships or extra business income. */
'use strict';
HK.CITIZEN_JOBS = {
 citizen:['Stadtbewohner','Resident'],merchant:['Kaufmann','Merchant'],fisher:['Fischer','Fisher'],beggar:['Tagelöhner','Day labourer'],monk:['Klosterbruder','Friar'],guard:['Stadtwache','Town guard'],child:['Schulkind','Schoolchild'],pilgrim:['Pilger','Pilgrim'],porter:['Hafenträger','Dock worker'],
 vendor:['Markthändler','Market trader'],customer:['Marktbesucher','Market customer'],read:['Schreiber','Scribe'],drink:['Reisender','Traveller'],work:['Handwerker','Craftsperson'],talk:['Seemann','Sailor'],mend:['Netzflicker','Net mender'],dice:['Seemann','Sailor'],fiddle:['Spielmann','Musician'],hammer:['Böttcher','Cooper'],fish:['Angler','Angler'],
 grainfarm:['Bauer','Farmer'],fiberfarm:['Flachsbauer','Flax farmer'],sheepfarm:['Schäfer','Shepherd'],cattlefarm:['Viehhalter','Cattle farmer'],dairy:['Milchwirt','Dairy worker'],windmill:['Müller','Miller'],woodcutter:['Holzfäller','Woodcutter'],hunter:['Jäger','Hunter'],quarry:['Steinbrecher','Quarry worker'],stonemason:['Steinmetz','Stonemason'],hopgarden:['Hopfenbauer','Hop grower'],malthouse:['Mälzer','Maltster'],
};
HK.citizenHash=s=>Array.from(s).reduce((n,c)=>(Math.imul(n,31)+c.charCodeAt(0))>>>0,7);
HK.citizenBuilding=id=>HK.BUILDING[id]||HK.RURAL_BUILDINGS?.[id];
HK.citizenText=pair=>pair[HK.LANG==='en'?1:0];
// Preserve identities from old saves; presentation follows their existing name.
HK.citizenAppearance=function(p){
 const female=['Mette','Geseke','Wiebke','Alheit','Taleke','Lutgard','Margrete','Hille','Anneke','Grete'];
 p.gender ||= female.includes(p.name.split(' ')[0])?'female':'male';
 p.look ||= {hair:'#69513d',cap:'cap',width:1};
 if(p.gender==='female'){
  const h=HK.citizenHash(p.id);p.look.dress=true;p.look.beard=null;
  p.look.cap=['coif','veil','braid'][h%3];p.look.apron=h%3?'#d0c3a2':null;
 }
 if(p.type==='child')p.look.beard=null;
 return p;
};
HK.CITIZEN_JOBS_FEMALE={citizen:'Stadtbewohnerin',merchant:'Kauffrau',fisher:'Fischerin',beggar:'Tagelöhnerin',monk:'Klosterhelferin',pilgrim:'Pilgerin',porter:'Hafenträgerin',vendor:'Markthändlerin',customer:'Marktbesucherin',read:'Schreiberin',drink:'Reisende',work:'Handwerkerin',talk:'Seefahrerin',mend:'Netzflickerin',dice:'Seefahrerin',fiddle:'Spielfrau',hammer:'Böttcherin',fish:'Anglerin',grainfarm:'Bäuerin',fiberfarm:'Flachsbäuerin',sheepfarm:'Schäferin',cattlefarm:'Viehhalterin',dairy:'Milchwirtin',windmill:'Müllerin',woodcutter:'Holzfällerin',hunter:'Jägerin',quarry:'Steinbrecherin',stonemason:'Steinmetzin',hopgarden:'Hopfenbäuerin',malthouse:'Mälzerin'};
HK.populationInit=function(st){
 const P=st.population ||= {version:1,people:{}};P.people ||= {};
 const homes=HK.BURGHER_HOUSES.map(b=>b.id),first=['Mette','Arnd','Geseke','Henneke','Wiebke','Clawes','Alheit','Harmen','Taleke','Bernd','Lutgard','Jost','Margrete','Willem','Hille','Reimer'];
 const family=['Bode','Kremer','Voss','Timmermann','Finke','Sander','Westphal','Rademacher','Rosen','Witte','Albers','Knoop','Becker','Holm','Kruse','Tiedeke'];
 const add=(id,opts)=>{
  if(P.people[id])return;
  const h=HK.citizenHash(id),i=Object.keys(P.people).length,home=opts.home||homes[i%homes.length];
  P.people[id]={id,name:first[i%first.length]+' '+family[Math.floor(i/first.length)%family.length],home,age:opts.type==='child'?10+h%5:22+h%39,
   look:{hair:['#69513d','#a49883','#4e4035','#957044'][h%4],cap:['none','cap','bonnet','beret'][h%4],beard:opts.type!=='child'&&i%2?['short','moustache','full'][h%3]:undefined,width:.94+(h%5)*.04},history:[],met:null,origin:opts.guest?['luebeck','danzig','riga','umland'][h%4]:null,arrival:st.day,departure:opts.guest?st.day+3+h%5:null,
   story:h%8,color:['#867049','#667a69','#87606a','#586d83','#927d57','#805044'][h%6],skin:['#dcc3aa','#d2aa91','#c59570'][h%3],...opts};
 };
 const links={priest:'church',customs:'customs',innkeeper:'tavern',guild:'guild',bailiff:'bailiff',changer:'bank',shipwright:'shipyard',mayor:'townhall',abbot:'monastery',craftmaster:'craftguild',harbourmaster:'harbourmaster',divekeeper:'dive',schoolmaster:'school',weighmaster:'weighhouse'};
 for(const n of HK.STATIC_NPCS)add('contact:'+n.person,{name:HK.PERSON[n.person].name,contact:n.person,group:'contact',type:'citizen',job:n.person,work:links[n.person],point:[n.x,n.y],color:n.color,hours:n.person==='divekeeper'?[.5,.94]:[.26,.83]});
 for(const a of HK.CITY_ACTORS||[])add('actor:'+a.id,{group:'actor',actor:a.id,type:'citizen',job:a.action,point:[a.x,a.y],work:a.district==='harbour'?'harbour':a.district==='church'?'church':a.district==='craft'?'craftguild':'market',color:a.color,hours:a.hours||[.30,a.evening?.93:.77],guest:['fiddle','dice','drink'].includes(a.action),...(['fiddle','dice','drink'].includes(a.action)?{home:'inn'}:{})});
 for(let i=0;i<6;i++)add('vendor:'+i,{group:'vendor',index:i,type:'merchant',job:'vendor',work:'market',hours:[.24,.83]});
 for(let i=0;i<6;i++)add('customer:'+i,{group:'customer',index:i,type:'citizen',job:'customer',work:'market',hours:[.30+i*.012,.74+i*.009]});
 const types=['citizen','citizen','merchant','fisher','child','citizen','porter','monk','beggar','guard'];
 const work={citizen:'market',merchant:'guild',fisher:'fishermen',child:'school',porter:'harbour',monk:'monastery',beggar:'church',guard:'arsenal'};
 for(let i=0;i<70;i++){const type=types[i%types.length],guest=i%11===2;add('resident:'+i,{group:'resident',type,job:type,work:work[type],guest,...(guest?{home:'inn'}:{}),hours:type==='guard'?[.65,1.24]:[.26+(i%8)*.008,.73+(i%7)*.015]});}
 for(const w of HK.RURAL_WORKERS||[])add('worker:'+w.site,{group:'worker',type:'citizen',job:w.site,work:w.site,home:w.site,point:[w.x,w.y],color:w.color,hours:[.27,.78]});
 for(let i=0;i<HK.WALL_PATROLS.length;i++)add('watch:'+i,{group:'watch',type:'guard',job:'guard',work:'arsenal',hours:[0,1]});
 for(let i=0;i<12;i++)add('freight:'+i,{group:'freight',type:'porter',job:'porter',work:'harbour',hours:[0,1]});
 for(const p of Object.values(P.people))HK.citizenAppearance(p);
 // Ordinary residents run errands across town; only actual market customers
 // use the stalls as their permanent daytime destination. Keep identities/homes.
 if((P.version||1)<3)for(const p of Object.values(P.people))if(p.group==='resident'&&p.type==='citizen'){
  p.work=['bakery','butcher','cooper','bathhouse','market','tavern','craftguild'][HK.citizenHash(p.id)%7];
 }
 P.version=3;
 return P;
};
HK.newGameHooks.push(HK.populationInit);HK.migrateHooks.push(HK.populationInit);
HK.citizenName=(st,p)=>p.contact?HK.personName(st,p.contact):p.name;
HK.citizenJob=p=>p.contact?(HK.PERSON[p.contact].title[HK.LANG]||HK.PERSON[p.contact].title.de):p.gender==='female'&&HK.LANG!=='en'&&HK.CITIZEN_JOBS_FEMALE[p.job]?HK.CITIZEN_JOBS_FEMALE[p.job]:HK.citizenText(HK.CITIZEN_JOBS[p.job]||HK.CITIZEN_JOBS.citizen);
HK.citizenStory=function(p){
 const stories=[['Hat das Handwerk in der Familie gelernt und möchte eine eigene kleine Werkstatt einrichten.','Learned the trade in the family and hopes to open a small workshop.'],['Spart auf eine ruhigere Wohnung und kennt die Nachbarn im Viertel gut.','Is saving for a quieter home and knows the neighbours well.'],['Kam wegen der Arbeit nach Sundhaven und möchte hier dauerhaft bleiben.','Came to Sundhaven for work and hopes to settle here.'],['Schätzt die frühen Stunden, wenn der Hafen erwacht und die Straßen noch ruhig sind.','Likes the early hours when the harbour wakes and the streets are still quiet.'],['Sammelt Geschichten von Reisenden und erzählt sie gern beim Abendessen weiter.','Collects travellers’ stories and shares them over supper.'],['Legt Wert auf verlässliche Absprachen und hofft auf bessere Geschäfte nach dem Winter.','Values reliable agreements and hopes for better business after winter.'],['Hilft oft in der Nachbarschaft und möchte eines Tages eine größere Familie versorgen können.','Often helps neighbours and hopes to support a larger family one day.'],['Mag Musik und besucht bei Gelegenheit die Spielleute am Hafen.','Enjoys music and visits the harbour musicians when possible.']];
 if(p.type==='child')return HK.citizenText(['Lernt Lesen und Rechnen. Nach dem Unterricht zieht es dieses Kind zu den Schiffen am Hafen.','Is learning to read and count, and likes watching the ships after school.']);
 if(p.lodging==='ship')return HK.citizenText(['Gehört zur Schiffsbesatzung, wohnt an Bord und reist mit dem Schiff weiter.','Is a member of the crew, lives aboard and leaves with the ship.']);
 if(p.guest)return HK.citizenText(['Ist für einige Tage in Sundhaven, um Kontakte zu knüpfen und die Stadt kennenzulernen. Übernachtet in der Herberge „Zum Wegweiser“.','Is visiting Sundhaven for a few days to meet people and explore, staying at the Signpost inn.']);
 return HK.citizenText(stories[p.story]);
};
// People embedded in ships, carts or buildings also receive a stable identity.
HK.serviceCitizen=function(st,key,type,work,color){
 const id='service:'+key,P=st.population.people;if(P[id])return P[id];
 const h=HK.citizenHash(key),first=['Claus','Anneke','Hermann','Grete','Johan','Mette','Arnd','Taleke'],last=['Holst','Ruge','Bode','Hagen','Kröger','Wulf','Kock','Voss','Lange','Rike','Sander','Grote'];
 const source=key.match(/^(visitor|caravan):(\d+):/),v=source&&(source[1]==='visitor'?st.ships:st.caravans).find(v=>v.id===+source[2]),visitor=!!source;
 const aboard=/^(visitor|own|rival):|^watchship:/.test(key);
 const home=aboard?'harbour':type==='monk'?'monastery':visitor?(source[1]==='visitor'?'harbour':'inn'):HK.BURGHER_HOUSES[h%HK.BURGHER_HOUSES.length].id;
 return P[id]=HK.citizenAppearance({id,name:first[h%first.length]+' '+last[Math.floor(h/8)%last.length],group:'service',type,job:aboard?'talk':HK.CITIZEN_JOBS[type]?type:'citizen',home,work:HK.citizenBuilding(work)?work:'harbour',age:24+h%35,story:h%8,color,skin:'#d2aa91',guest:visitor,serviceSource:source?[source[1],+source[2]]:null,lodging:aboard?'ship':null,origin:v?.origin||null,arrival:st.day,departure:v?st.day+v.daysLeft:null,history:[],met:null});
};

HK.servicePresent=(st,p)=>!p.serviceSource||(p.serviceSource[0]==='visitor'?st.ships:st.caravans).some(v=>v.id===p.serviceSource[1]);

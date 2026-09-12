/* Sprachen / Languages */
'use strict';

HK.LANG = 'de';
HK.I18N = {
  de: {
    title: 'Hanse-Kontor', subtitle: 'Eine Handelssimulation im Hansebund, anno 1370',
    newGame: 'Neues Spiel', continueGame: 'Spiel fortsetzen', save: 'Speichern', load: 'Laden', exportSave: 'Exportieren', importSave: 'Importieren',
    help: 'Hilfe', language: 'Sprache', saved: 'Spielstand gespeichert.', loaded: 'Spielstand geladen.', noSave: 'Kein Spielstand vorhanden.',
    importError: 'Die Datei konnte nicht gelesen werden.', confirmNewGame: 'Aktuelles Spiel verwerfen und neu beginnen?',
    playerName: 'Dein Name', homeCity: 'Heimatstadt', difficulty: 'Schwierigkeit', easy: 'Leicht', normal: 'Normal', hard: 'Schwer',
    start: 'Aufbrechen!', defaultName: 'Hinrich Castorp',
    diffHint_easy: '15.000 Mark, eine Kogge, seltene Ereignisse.', diffHint_normal: '8.000 Mark, eine Kogge.', diffHint_hard: '4.000 Mark, nur eine Schnigge, raue See.',
    day: 'Tag', money: 'Vermögen', rank: 'Rang', pause: 'Pause', speed1: 'Langsam', speed2: 'Normal', speed3: 'Schnell', stepDay: 'Einen Tag weiter',
    tabCity: 'Stadt', tabShips: 'Schiffe', tabKontors: 'Kontore', tabBank: 'Bank & Rat', tabLog: 'Chronik', tabStats: 'Statistik',
    population: 'Einwohner', reputation: 'Ansehen', market: 'Markt', good: 'Ware', stock: 'Vorrat', buy: 'Kaufen', sell: 'Verkaufen',
    buyPrice: 'Kauf', sellPrice: 'Verkauf', trend: 'Bedarf', shortage: 'Mangel', surplus: 'Überschuss', normalDemand: 'gedeckt',
    qty: 'Menge', all: 'Alles', max: 'Max', shipsHere: 'Schiffe im Hafen', noShipHere: 'Kein eigenes Schiff im Hafen.', selectShip: 'Handelndes Schiff',
    cargo: 'Ladung', capacity: 'Laderaum', free: 'frei', hull: 'Zustand', crew: 'Mannschaft', weapons: 'Bewaffnung', speed: 'Geschwindigkeit',
    sailTo: 'Segeln nach', depart: 'Ablegen', travelDays: '{days} Tage', arrivesIn: 'Ankunft in {days} Tagen', atSea: 'Auf See nach {city}', docked: 'Im Hafen von {city}',
    noShips: 'Du besitzt keine Schiffe.', shipyard: 'Werft', buildShip: 'Schiff bauen', repair: 'Reparieren', repairCost: 'Reparatur ({cost} Mark)',
    buyWeapons: 'Aufrüsten ({cost} Mark)', sellShip: 'Schiff verkaufen ({price} Mark)', rename: 'Umbenennen', newShipName: 'Name des Schiffes',
    noShipyard: 'In dieser Stadt gibt es keine Werft.', notEnoughMoney: 'Nicht genug Geld.', shipFull: 'Nicht genug Laderaum.', notEnoughStock: 'Die Stadt hat nicht genug Vorrat.',
    notEnoughCargo: 'Nicht genug Ladung.', bought: '{qty} Last {good} für {cost} Mark gekauft.', sold: '{qty} Last {good} für {cost} Mark verkauft.',
    kontor: 'Kontor', buildKontor: 'Kontor errichten ({cost} Mark)', kontorNeedsRep: 'Ein Kontor erfordert Ansehen von mindestens {rep}.', noKontor: 'Du hast hier kein Kontor.',
    storage: 'Lager', storageCap: 'Lagerplatz', expandStorage: 'Lager erweitern (+{qty} Last, {cost} Mark)', toKontor: 'Ins Kontor', toShip: 'Aufs Schiff',
    storageFull: 'Das Lager ist voll.', manager: 'Verwalter', managerHint: 'Der Verwalter handelt täglich bis zu {qty} Last je Ware zu deinen Grenzpreisen.',
    modeNone: '–', modeBuy: 'Kaufen unter', modeSell: 'Verkaufen über', limit: 'Grenzpreis', perDay: 'Last/Tag',
    buildings: 'Betriebe', build: 'Bauen', buildingCost: '{cost} Mark, Unterhalt {upkeep} Mark/Tag', produces: 'erzeugt {qty} Last {good}/Tag',
    consumes: 'verbraucht {qty} Last {good}/Tag', maxBuildings: 'Höchstens {n} Betriebe je Kontor.', demolish: 'Abreißen', noBuildingsHere: 'Hier kann kein Betrieb errichtet werden.',
    noInput: 'Rohstoff fehlt', built: '{building} in {city} errichtet.', kontorBuilt: 'Kontor in {city} errichtet.',
    donate: 'Spenden', donateChurch: 'Kirchenspende ({cost} Mark)', donatePoor: 'Armenspeisung ({cost} Mark)', donated: 'Das Ansehen in {city} steigt.',
    bank: 'Bank', loan: 'Darlehen', loanLimit: 'Kreditrahmen', takeLoan: 'Aufnehmen', repayLoan: 'Zurückzahlen', interest: 'Zins {pct} % pro Jahr',
    loanTaken: 'Darlehen über {amount} Mark aufgenommen.', loanRepaid: '{amount} Mark zurückgezahlt.', loanTooHigh: 'Der Kreditrahmen reicht nicht.',
    council: 'Rat der Hanse', rankReq: 'Voraussetzung für {rank}', netWorth: 'Reinvermögen', reqRep: 'Ansehen in {city}', reqKontors: 'Kontore', promoted: 'Du wurdest zum {rank} ernannt!',
    homeCityLabel: 'Heimatstadt', kontorCount: 'Kontore', shipCount: 'Schiffe', profitTotal: 'Handelsgewinn gesamt', tradeVolume: 'Umsatz gesamt', daysPlayed: 'Tage gespielt',
    chart: 'Reinvermögen im Verlauf', log: 'Chronik', noLog: 'Noch nichts geschehen.',
    ev_famine: 'Hungersnot in {city}! Getreide und Fisch sind gefragt.', ev_plague: 'Die Pest wütet in {city}.', ev_festival: 'Fest in {city} – Bier und Wein fließen.',
    ev_fire: 'Großbrand in {city}! Bauholz wird dringend gebraucht.', ev_goodHarvest: 'Reiche Ernte in {city}.', ev_fair: 'Jahrmarkt in {city} – Tuch und Pelze begehrt.',
    evn_famine: 'Hungersnot', evn_plague: 'Pest', evn_festival: 'Fest', evn_fire: 'Großbrand', evn_goodHarvest: 'Reiche Ernte', evn_fair: 'Jahrmarkt',
    arrived: '{ship} ist in {city} eingelaufen.', storm: 'Sturm! {ship} nimmt {dmg} % Schaden.', sunk: '{ship} ist mit Mann und Maus gesunken!', hullWarning: '{ship} ist schwer beschädigt – dringend in eine Werft!',
    piratesRepelled: '{ship} hat Piraten abgewehrt.', piratesLoot: 'Piraten haben {ship} geplündert und Ladung geraubt.', piratesRansom: '{ship} zahlt {amount} Mark Lösegeld an Piraten.',
    routeTrade: '{ship} in {city}: {sold} Last verkauft, {bought} Last gekauft.', bankrupt: 'Du bist bankrott. Die Gläubiger übernehmen dein Kontor.',
    won: 'Du bist Eldermann der Hanse! Dein Name wird in Lübeck in Stein gemeißelt.', continuePlay: 'Weiterspielen', gameOver: 'Spiel vorbei',
    managerSold: 'Verwalter in {city}: {qty} Last {good} verkauft.', managerBought: 'Verwalter in {city}: {qty} Last {good} gekauft.',
    route: 'Handelsroute', routeEdit: 'Route bearbeiten', routeStart: 'Route starten', routeStop: 'Route anhalten', routeActive: 'Route aktiv', routeNone: 'Keine Route',
    routeStops: 'Stationen', addStop: 'Station hinzufügen', removeStop: 'Entfernen', routeHint: 'An jeder Station wird zuerst verkauft/entladen, dann gekauft/geladen. Die Route wird endlos wiederholt.',
    modeUnload: 'Ins Kontor', modeLoad: 'Aus Kontor', maxPrice: 'max. Preis', minPrice: 'min. Preis', apply: 'Übernehmen', cancel: 'Abbrechen', close: 'Schließen', ok: 'OK',
    routeNeedsStops: 'Eine Route braucht mindestens zwei Stationen.', ship: 'Schiff', location: 'Ort', status: 'Zustand', value: 'Wert',
    weaponsLevel: 'Stufe {lvl}', maxWeapons: 'Bereits voll aufgerüstet.', shipSold: '{ship} für {price} Mark verkauft.', shipBuilt: '{ship} in {city} vom Stapel gelaufen.',
    cargoValue: 'Ladung (Basiswert)', selectCity: 'Wähle eine Stadt auf der Karte.', yes: 'Ja', no: 'Nein',
    unitLast: 'Last', mark: 'Mark', perLast: 'Mark/Last', helpTitle: 'Wie man Hansekaufmann wird',
    helpText: `<p><b>Ziel:</b> Werde Eldermann der Hanse. Dafür brauchst du ein Reinvermögen von 1.000.000 Mark, hohes Ansehen in deiner Heimatstadt und Kontore in sechs Städten.</p>
<p><b>Handel:</b> Klicke eine Stadt auf der Karte an. Liegt ein Schiff im Hafen, kannst du Waren kaufen und verkaufen. Städte erzeugen manche Waren günstig (Überschuss) und brauchen andere dringend (Mangel). Kaufe billig, segle, verkaufe teuer. Jeder Kauf treibt den Preis, jeder Verkauf senkt ihn.</p>
<p><b>Schiffe:</b> Wähle unter „Schiffe“ ein Ziel und lege ab. Schnelle Schiffe tragen weniger. Auf See drohen Stürme und Piraten – Bewaffnung hilft. Repariere beschädigte Schiffe in der Werft.</p>
<p><b>Kontore:</b> Mit genug Ansehen errichtest du in einer Stadt ein Kontor mit Lager. Ein Verwalter handelt dort täglich zu deinen Grenzpreisen. Betriebe erzeugen Waren direkt ins Lager.</p>
<p><b>Routen:</b> Gib einem Schiff eine Handelsroute mit Stationen und Aufträgen, dann fährt es von allein.</p>
<p><b>Ansehen:</b> Steigt, wenn du Mangelwaren lieferst oder spendest. Es senkt Einkaufspreise und öffnet höhere Ränge.</p>
<p><b>Bank:</b> Darlehen helfen beim Wachsen, kosten aber täglich Zinsen. Bist du 60 Tage lang zahlungsunfähig, ist das Spiel verloren.</p>
<p><b>Speichern:</b> Das Spiel speichert automatisch im Browser. Über „Exportieren“ sicherst du den Spielstand als Datei.</p>`,
    season: { 0: 'Winter', 1: 'Frühling', 2: 'Sommer', 3: 'Herbst' }, welcome: 'Willkommen in {city}, {name}! Deine {ship} liegt im Hafen. Viel Erfolg.',
    toastArrival: 'Ankunft', eventsHere: 'Ereignis', ships: 'Schiffe', cities: 'Städte', legend: 'Legende', legendCity: 'Stadt', legendKontor: 'Stadt mit Kontor', legendShip: 'Eigenes Schiff',
    confirmSellShip: 'Schiff {ship} wirklich verkaufen?', confirmDemolish: 'Betrieb wirklich abreißen?', noRouteStopsHint: 'Noch keine Stationen.', stop: 'Station',
    orders: 'Aufträge', capacityHint: '{used} / {cap} Last', dailyCost: 'Tägliche Kosten', wages: 'Heuer', upkeep: 'Unterhalt', interestCost: 'Zinsen',
    lastsDays: 'noch {days} Tage', shipTypeInfo: '{capacity} Last, {speed} km/Tag, {crew} Mann',
  },
  en: {
    title: 'Hanse-Kontor', subtitle: 'A trading simulation in the Hanseatic League, anno 1370',
    newGame: 'New game', continueGame: 'Continue', save: 'Save', load: 'Load', exportSave: 'Export', importSave: 'Import',
    help: 'Help', language: 'Language', saved: 'Game saved.', loaded: 'Game loaded.', noSave: 'No saved game found.',
    importError: 'The file could not be read.', confirmNewGame: 'Discard the current game and start over?',
    playerName: 'Your name', homeCity: 'Home city', difficulty: 'Difficulty', easy: 'Easy', normal: 'Normal', hard: 'Hard',
    start: 'Set sail!', defaultName: 'Hinrich Castorp',
    diffHint_easy: '15,000 marks, a cog, rare events.', diffHint_normal: '8,000 marks, a cog.', diffHint_hard: '4,000 marks, only a snekkja, rough seas.',
    day: 'Day', money: 'Funds', rank: 'Rank', pause: 'Pause', speed1: 'Slow', speed2: 'Normal', speed3: 'Fast', stepDay: 'Advance one day',
    tabCity: 'City', tabShips: 'Ships', tabKontors: 'Offices', tabBank: 'Bank & Council', tabLog: 'Chronicle', tabStats: 'Statistics',
    population: 'Population', reputation: 'Reputation', market: 'Market', good: 'Good', stock: 'Stock', buy: 'Buy', sell: 'Sell',
    buyPrice: 'Buy', sellPrice: 'Sell', trend: 'Demand', shortage: 'shortage', surplus: 'surplus', normalDemand: 'covered',
    qty: 'Quantity', all: 'All', max: 'Max', shipsHere: 'Ships in port', noShipHere: 'None of your ships is in port.', selectShip: 'Trading ship',
    cargo: 'Cargo', capacity: 'Hold', free: 'free', hull: 'Condition', crew: 'Crew', weapons: 'Armament', speed: 'Speed',
    sailTo: 'Sail to', depart: 'Depart', travelDays: '{days} days', arrivesIn: 'Arrives in {days} days', atSea: 'At sea to {city}', docked: 'In port at {city}',
    noShips: 'You own no ships.', shipyard: 'Shipyard', buildShip: 'Build ship', repair: 'Repair', repairCost: 'Repair ({cost} marks)',
    buyWeapons: 'Arm ship ({cost} marks)', sellShip: 'Sell ship ({price} marks)', rename: 'Rename', newShipName: 'Name of the ship',
    noShipyard: 'This city has no shipyard.', notEnoughMoney: 'Not enough money.', shipFull: 'Not enough hold space.', notEnoughStock: 'The city does not have enough stock.',
    notEnoughCargo: 'Not enough cargo.', bought: 'Bought {qty} lasts of {good} for {cost} marks.', sold: 'Sold {qty} lasts of {good} for {cost} marks.',
    kontor: 'Trading office', buildKontor: 'Establish office ({cost} marks)', kontorNeedsRep: 'An office requires a reputation of at least {rep}.', noKontor: 'You have no office here.',
    storage: 'Warehouse', storageCap: 'Storage', expandStorage: 'Expand warehouse (+{qty} lasts, {cost} marks)', toKontor: 'To warehouse', toShip: 'To ship',
    storageFull: 'The warehouse is full.', manager: 'Steward', managerHint: 'The steward trades up to {qty} lasts per good each day at your limit prices.',
    modeNone: '–', modeBuy: 'Buy below', modeSell: 'Sell above', limit: 'Limit price', perDay: 'lasts/day',
    buildings: 'Workshops', build: 'Build', buildingCost: '{cost} marks, upkeep {upkeep} marks/day', produces: 'produces {qty} lasts of {good}/day',
    consumes: 'consumes {qty} lasts of {good}/day', maxBuildings: 'At most {n} workshops per office.', demolish: 'Demolish', noBuildingsHere: 'No workshop can be built here.',
    noInput: 'missing input', built: '{building} built in {city}.', kontorBuilt: 'Office established in {city}.',
    donate: 'Donations', donateChurch: 'Donate to the church ({cost} marks)', donatePoor: 'Feed the poor ({cost} marks)', donated: 'Your reputation in {city} rises.',
    bank: 'Bank', loan: 'Loan', loanLimit: 'Credit limit', takeLoan: 'Borrow', repayLoan: 'Repay', interest: 'Interest {pct} % per year',
    loanTaken: 'Borrowed {amount} marks.', loanRepaid: 'Repaid {amount} marks.', loanTooHigh: 'Your credit limit is insufficient.',
    council: 'Hanseatic council', rankReq: 'Requirements for {rank}', netWorth: 'Net worth', reqRep: 'Reputation in {city}', reqKontors: 'Offices', promoted: 'You have been named {rank}!',
    homeCityLabel: 'Home city', kontorCount: 'Offices', shipCount: 'Ships', profitTotal: 'Total trading profit', tradeVolume: 'Total turnover', daysPlayed: 'Days played',
    chart: 'Net worth over time', log: 'Chronicle', noLog: 'Nothing has happened yet.',
    ev_famine: 'Famine in {city}! Grain and fish are in demand.', ev_plague: 'The plague rages in {city}.', ev_festival: 'Festival in {city} – beer and wine flow.',
    ev_fire: 'Great fire in {city}! Timber is urgently needed.', ev_goodHarvest: 'Rich harvest in {city}.', ev_fair: 'Fair in {city} – cloth and furs are sought after.',
    evn_famine: 'Famine', evn_plague: 'Plague', evn_festival: 'Festival', evn_fire: 'Great fire', evn_goodHarvest: 'Rich harvest', evn_fair: 'Fair',
    arrived: '{ship} has arrived in {city}.', storm: 'Storm! {ship} takes {dmg} % damage.', sunk: '{ship} has sunk with all hands!', hullWarning: '{ship} is badly damaged – head for a shipyard!',
    piratesRepelled: '{ship} has repelled pirates.', piratesLoot: 'Pirates have plundered {ship} and stolen cargo.', piratesRansom: '{ship} pays {amount} marks ransom to pirates.',
    routeTrade: '{ship} in {city}: sold {sold} lasts, bought {bought} lasts.', bankrupt: 'You are bankrupt. Your creditors seize your office.',
    won: 'You are Alderman of the Hansa! Your name is carved in stone in Lübeck.', continuePlay: 'Keep playing', gameOver: 'Game over',
    managerSold: 'Steward in {city}: sold {qty} lasts of {good}.', managerBought: 'Steward in {city}: bought {qty} lasts of {good}.',
    route: 'Trade route', routeEdit: 'Edit route', routeStart: 'Start route', routeStop: 'Stop route', routeActive: 'Route active', routeNone: 'No route',
    routeStops: 'Stops', addStop: 'Add stop', removeStop: 'Remove', routeHint: 'At each stop the ship first sells/unloads, then buys/loads. The route repeats forever.',
    modeUnload: 'To warehouse', modeLoad: 'From warehouse', maxPrice: 'max. price', minPrice: 'min. price', apply: 'Apply', cancel: 'Cancel', close: 'Close', ok: 'OK',
    routeNeedsStops: 'A route needs at least two stops.', ship: 'Ship', location: 'Location', status: 'Status', value: 'Value',
    weaponsLevel: 'Level {lvl}', maxWeapons: 'Already fully armed.', shipSold: 'Sold {ship} for {price} marks.', shipBuilt: '{ship} launched in {city}.',
    cargoValue: 'Cargo (base value)', selectCity: 'Select a city on the map.', yes: 'Yes', no: 'No',
    unitLast: 'lasts', mark: 'marks', perLast: 'marks/last', helpTitle: 'How to become a Hanseatic merchant',
    helpText: `<p><b>Goal:</b> Become Alderman of the Hansa. You need a net worth of 1,000,000 marks, high reputation in your home city and offices in six cities.</p>
<p><b>Trading:</b> Click a city on the map. If one of your ships is in port you can buy and sell goods. Cities produce some goods cheaply (surplus) and urgently need others (shortage). Buy low, sail, sell high. Every purchase raises the price, every sale lowers it.</p>
<p><b>Ships:</b> Pick a destination under "Ships" and depart. Fast ships carry less. Storms and pirates threaten at sea – armament helps. Repair damaged ships at a shipyard.</p>
<p><b>Offices:</b> With enough reputation you can establish a trading office with a warehouse. A steward trades there daily at your limit prices. Workshops produce goods straight into the warehouse.</p>
<p><b>Routes:</b> Give a ship a trade route with stops and orders and it will sail on its own.</p>
<p><b>Reputation:</b> Rises when you deliver goods in short supply or donate. It lowers purchase prices and unlocks higher ranks.</p>
<p><b>Bank:</b> Loans help you grow but cost interest daily. If you are insolvent for 60 days, the game is lost.</p>
<p><b>Saving:</b> The game autosaves in your browser. Use "Export" to save your game as a file.</p>`,
    season: { 0: 'Winter', 1: 'Spring', 2: 'Summer', 3: 'Autumn' }, welcome: 'Welcome to {city}, {name}! Your {ship} lies in port. Good luck.',
    toastArrival: 'Arrival', eventsHere: 'Event', ships: 'Ships', cities: 'Cities', legend: 'Legend', legendCity: 'City', legendKontor: 'City with office', legendShip: 'Your ship',
    confirmSellShip: 'Really sell the ship {ship}?', confirmDemolish: 'Really demolish this workshop?', noRouteStopsHint: 'No stops yet.', stop: 'Stop',
    orders: 'Orders', capacityHint: '{used} / {cap} lasts', dailyCost: 'Daily costs', wages: 'Wages', upkeep: 'Upkeep', interestCost: 'Interest',
    lastsDays: '{days} days left', shipTypeInfo: '{capacity} lasts, {speed} km/day, {crew} men',
  },
};

HK.t = function (key, vars) {
  let s = HK.I18N[HK.LANG][key];
  if (s === undefined) s = HK.I18N.de[key];
  if (s === undefined) return key;
  if (typeof s !== 'string') return s;
  if (vars) for (const k in vars) s = s.split('{' + k + '}').join(vars[k]);
  return s;
};
HK.name = function (obj) { return obj.name[HK.LANG] || obj.name.de; };
HK.goodName = function (id) { return HK.name(HK.GOOD[id]); };
HK.cityName = function (id) { return HK.name(HK.CITY[id]); };
HK.fmt = function (n) { return Math.round(n).toLocaleString(HK.LANG === 'de' ? 'de-DE' : 'en-GB'); };
HK.fmtDate = function (day) {
  const c = HK.CONST;
  const base = new Date(Date.UTC(2000, c.START_MONTH, c.START_DAY));
  base.setUTCDate(base.getUTCDate() + day);
  const year = c.START_YEAR + (base.getUTCFullYear() - 2000);
  const fmt = new Intl.DateTimeFormat(HK.LANG === 'de' ? 'de-DE' : 'en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' });
  return fmt.format(base) + ' ' + year;
};
HK.monthOf = function (day) {
  const c = HK.CONST;
  const base = new Date(Date.UTC(2000, c.START_MONTH, c.START_DAY));
  base.setUTCDate(base.getUTCDate() + day);
  return base.getUTCMonth();
};

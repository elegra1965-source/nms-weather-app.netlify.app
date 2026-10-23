// Wording for the push alerts in the 8 site languages (2026-10-23, Tony: "need more, varying
// ones each time or for weather type"). Each alert = a plain fact + one NMS-style line picked at
// random from a pool for that kind of weather, never the same line twice in a row.
// Names, places, numbers and expedition titles stay as they are.
import { WMO_I18N } from './wmo-i18n.mjs';

export const LANGS = ['en', 'es', 'de', 'nl', 'pl', 'fr', 'pt-BR', 'it'];
export const cleanLang = l => (LANGS.includes(l) ? l : 'en');

// "over Hartlepool" / "over your area": each language's way of saying where.
const ON = {
  en: p => 'over ' + p, es: p => 'en ' + p, de: p => 'in ' + p, nl: p => 'in ' + p, pl: p => 'w ' + p,
  fr: p => (p === 'ta zone' ? 'dans ta zone' : 'à ' + p),
  'pt-BR': p => (p === 'sua região' ? 'na sua região' : 'em ' + p),
  it: p => (p === 'la tua zona' ? 'nella tua zona' : 'a ' + p)
};
// The default place as it reads on its own (in a title).
const AREA_T = { en: 'your area', es: 'tu zona', de: 'deine Gegend', nl: 'jouw omgeving', pl: 'twoja okolica', fr: 'ta zone', 'pt-BR': 'sua região', it: 'la tua zona' };

const P = {
  en: {
    area: 'your area', hours: h => h + (h === 1 ? ' hour' : ' hours'),
    t: { rain: '◈ Rain starting within the hour', snow: '◈ Snow starting within the hour', severe: '⚠ Extreme weather approaching',
      gale: '⚠ Gale warning', heat: '⚠ Extreme heat', frost: '⚠ Hard frost', drop: '🌡 Temperature dropping', rise: '🌡 Temperature rising',
      morning: p => '☀ Morning briefing · ' + p, tomorrow: p => '🌙 Tomorrow · ' + p, survey: '◈ New planetary survey',
      expNew: '◈ New expedition is live', expEnd: h => '⏳ Expedition ends in ' + h, trend: r => 'Your system is #' + r + ' this week',
      theme: '◈ New in the Theme Pack' },
    b: { rain: (w, p, n) => w + ' likely ' + ON['en'](p) + ' (' + n + '% chance).', sevNow: (w, p) => w + ' ' + ON['en'](p) + ' now.',
      sevAt: (w, p, hh) => w + ' expected ' + ON['en'](p) + ' from ' + hh + ':00.', gale: (s, p) => 'Gusts up to ' + s + ' ' + ON['en'](p) + '.',
      at: (t, p) => t + ' ' + ON['en'](p) + '.', temp: (a, b, hh, p) => 'From ' + a + ' to ' + b + ' by ' + hh + ':00 ' + ON['en'](p) + '.',
      day: (w, hi, lo) => w + '. High ' + hi + ', low ' + lo + '.', pop: (n, snow) => n + '% chance of ' + (snow ? 'snow' : 'rain') + '.',
      wind: s => 'Windy, up to ' + s + '.', survey: 'Today’s 8 worlds are in. Tap to scan them.',
      expNew: n => n + ' has begun. Tap for milestones and tips.', expEnd: n => n + ' closes soon.',
      trend: (s, r) => s + ' is #' + r + ' on the Galactic Map’s trending list.', theme: 'New wallpapers and icons in the Theme Pack.' },
    l: {
      clear: ['Clear skies. Perfect scanning weather, Traveller.', 'No hazards detected. Enjoy the sun.', 'Sentinels report calm skies today.', 'A good day to explore, Traveller.', 'Visibility excellent. The Atlas approves.', 'Paradise planet conditions. Rare. Enjoy it.'],
      cloud: ['Grey skies, but no hazards to your exosuit.', 'Overcast. Still a fine day to explore.', 'Cloud cover detected. Life support stable.', 'No storms on the scanner, Traveller.', 'Dull skies. Your multi-tool won’t mind.', 'A quiet day in this star system.'],
      fog: ['Low visibility. Watch for Sentinels in the mist.', 'Fog rolling in. Keep your scanner close.', 'Visibility reduced. Travel carefully, Traveller.', 'Thick haze over the surface. Slow and steady.'],
      rain: ['Take a coat, Traveller.', 'Hazard protection won’t cover this one. Grab a coat.', 'Wet planet conditions. Umbrella advised.', 'Not toxic rain, but you’ll still get soaked.', 'Seek shelter or a good coat, Traveller.', 'Rain on the scanner. Keep your boots dry.'],
      snow: ['Frozen biome conditions. Wrap up, Traveller.', 'Cold planet incoming. Thermal layer advised.', 'Ice on the surface. Tread carefully.', 'Snow on the scanner. Hot drink recommended.', 'Frost biome detected. Hazard protection: gloves.'],
      storm: ['Storm detected. Seek shelter, Traveller.', 'Your exosuit would warn you, so I am.', 'Extreme weather event. Stay indoors if you can.', 'Storm conditions. Not a good day for a walk.', 'Batten down the hatches, Traveller.'],
      gale: ['Hold on to your hat, Traveller.', 'Strong winds. Secure anything loose.', 'Even a starship would struggle in this.'],
      heat: ['Scorched biome conditions. Stay hydrated.', 'Thermal protection draining. Find shade, Traveller.', 'Extreme heat. Keep out of the midday sun.'],
      frost: ['Hazard protection low. Wrap up warm.', 'Frozen surface. Watch your step.', 'Thermal layer advised, Traveller.'],
      cold: ['Grab an extra layer, Traveller.', 'Cooling fast. Thermal layer advised.', 'Temperature falling. Plan accordingly.'],
      warm: ['Warming up. Maybe lose a layer, Traveller.', 'Heat rising. Stay hydrated.', 'A warm spell is on its way.'],
      survey: ['Fresh coordinates from the Atlas.', 'New worlds await, Traveller.', 'The scanner has new readings.'],
      expNew: ['The Anomaly awaits, Traveller.', 'Rewards are waiting. Good luck out there.', 'A new journey begins.'],
      expEnd: ['Claim your rewards before it ends.', 'Last chance to finish your milestones.', 'Don’t leave rewards behind, Traveller.'],
      trend: ['Travellers are flocking to your world.', 'Your discovery is making waves.', 'The galaxy has noticed, Traveller.'],
      theme: ['Fresh looks for your device, Traveller.', 'Tap to see what’s new.', 'New gear for your home screen.']
    }
  },
  es: {
    area: 'tu zona', hours: h => h + (h === 1 ? ' hora' : ' horas'),
    t: { rain: '◈ Lluvia en menos de una hora', snow: '◈ Nieve en menos de una hora', severe: '⚠ Se acerca tiempo extremo',
      gale: '⚠ Aviso de vendaval', heat: '⚠ Calor extremo', frost: '⚠ Helada fuerte', drop: '🌡 La temperatura baja', rise: '🌡 La temperatura sube',
      morning: p => '☀ Parte matinal · ' + p, tomorrow: p => '🌙 Mañana · ' + p, survey: '◈ Nueva exploración planetaria',
      expNew: '◈ Nueva expedición en marcha', expEnd: h => '⏳ La expedición termina en ' + h, trend: r => 'Tu sistema es el n.º ' + r + ' esta semana',
      theme: '◈ Novedades en el Theme Pack' },
    b: { rain: (w, p, n) => w + ' probable ' + ON['es'](p) + ' (' + n + '% de probabilidad).', sevNow: (w, p) => w + ' ' + ON['es'](p) + ' ahora.',
      sevAt: (w, p, hh) => w + ' ' + ON['es'](p) + ' a partir de las ' + hh + ':00.', gale: (s, p) => 'Rachas de hasta ' + s + ' ' + ON['es'](p) + '.',
      at: (t, p) => t + ' ' + ON['es'](p) + '.', temp: (a, b, hh, p) => 'De ' + a + ' a ' + b + ' hacia las ' + hh + ':00 ' + ON['es'](p) + '.',
      day: (w, hi, lo) => w + '. Máx. ' + hi + ', mín. ' + lo + '.', pop: (n, snow) => n + '% de probabilidad de ' + (snow ? 'nieve' : 'lluvia') + '.',
      wind: s => 'Viento, hasta ' + s + '.', survey: 'Ya están los 8 mundos de hoy. Toca para escanearlos.',
      expNew: n => n + ' ha comenzado. Toca para ver hitos y consejos.', expEnd: n => n + ' termina pronto.',
      trend: (s, r) => s + ' es el n.º ' + r + ' en tendencias del Galactic Map.', theme: 'Nuevos fondos e iconos en el Theme Pack.' },
    l: {
      clear: ['Cielo despejado. Tiempo perfecto para escanear, viajero.', 'Sin peligros detectados. Disfruta del sol.', 'Los centinelas informan de cielos tranquilos.', 'Buen día para explorar, viajero.', 'Visibilidad excelente. El Atlas lo aprueba.', 'Condiciones de planeta paraíso. Poco común. Disfrútalo.'],
      cloud: ['Cielo gris, pero sin peligro para tu exotraje.', 'Cubierto. Aun así, buen día para explorar.', 'Nubes detectadas. Soporte vital estable.', 'Sin tormentas en el escáner, viajero.', 'Cielo apagado. A tu multiherramienta no le importa.', 'Un día tranquilo en este sistema estelar.'],
      fog: ['Poca visibilidad. Ojo con los centinelas entre la niebla.', 'Llega la niebla. Ten el escáner a mano.', 'Visibilidad reducida. Viaja con cuidado, viajero.', 'Bruma espesa en la superficie. Despacio y con calma.'],
      rain: ['Coge un abrigo, viajero.', 'La protección contra peligros no cubre esto. Coge un abrigo.', 'Condiciones de planeta húmedo. Se recomienda paraguas.', 'No es lluvia tóxica, pero te vas a empapar.', 'Busca refugio o un buen abrigo, viajero.', 'Lluvia en el escáner. Mantén las botas secas.'],
      snow: ['Condiciones de bioma helado. Abrígate, viajero.', 'Se acerca un planeta frío. Se recomienda capa térmica.', 'Hielo en la superficie. Pisa con cuidado.', 'Nieve en el escáner. Se recomienda bebida caliente.', 'Bioma helado detectado. Protección contra peligros: guantes.'],
      storm: ['Tormenta detectada. Busca refugio, viajero.', 'Tu exotraje te avisaría, así que te aviso yo.', 'Fenómeno meteorológico extremo. Quédate dentro si puedes.', 'Condiciones de tormenta. No es día para pasear.', 'Asegura las escotillas, viajero.'],
      gale: ['Sujétate el sombrero, viajero.', 'Viento fuerte. Asegura lo que esté suelto.', 'Hasta una nave estelar lo pasaría mal con esto.'],
      heat: ['Condiciones de bioma abrasador. Hidrátate.', 'La protección térmica se agota. Busca sombra, viajero.', 'Calor extremo. Evita el sol del mediodía.'],
      frost: ['Protección contra peligros baja. Abrígate bien.', 'Superficie helada. Mira dónde pisas.', 'Se recomienda capa térmica, viajero.'],
      cold: ['Ponte otra capa, viajero.', 'Se enfría rápido. Se recomienda capa térmica.', 'La temperatura cae. Prepárate.'],
      warm: ['Sube la temperatura. Quizá sobre una capa, viajero.', 'El calor aumenta. Hidrátate.', 'Se acerca un rato de calor.'],
      survey: ['Coordenadas nuevas del Atlas.', 'Nuevos mundos te esperan, viajero.', 'El escáner tiene lecturas nuevas.'],
      expNew: ['La Anomalía te espera, viajero.', 'Hay recompensas esperando. Suerte ahí fuera.', 'Comienza un nuevo viaje.'],
      expEnd: ['Reclama tus recompensas antes de que termine.', 'Última oportunidad para completar tus hitos.', 'No dejes recompensas atrás, viajero.'],
      trend: ['Los viajeros acuden en masa a tu mundo.', 'Tu descubrimiento está dando que hablar.', 'La galaxia se ha fijado, viajero.'],
      theme: ['Un nuevo look para tu dispositivo, viajero.', 'Toca para ver las novedades.', 'Equipo nuevo para tu pantalla de inicio.']
    }
  },
  de: {
    area: 'deiner Gegend', hours: h => h + (h === 1 ? ' Stunde' : ' Stunden'),
    t: { rain: '◈ Regen innerhalb der nächsten Stunde', snow: '◈ Schnee innerhalb der nächsten Stunde', severe: '⚠ Extremwetter im Anflug',
      gale: '⚠ Sturmwarnung', heat: '⚠ Extreme Hitze', frost: '⚠ Strenger Frost', drop: '🌡 Temperatur sinkt', rise: '🌡 Temperatur steigt',
      morning: p => '☀ Morgenbericht · ' + p, tomorrow: p => '🌙 Morgen · ' + p, survey: '◈ Neue Planetenvermessung',
      expNew: '◈ Neue Expedition gestartet', expEnd: h => '⏳ Expedition endet in ' + h, trend: r => 'Dein System ist diese Woche auf Platz ' + r,
      theme: '◈ Neu im Theme Pack' },
    b: { rain: (w, p, n) => w + ' wahrscheinlich ' + ON['de'](p) + ' (' + n + ' % Wahrscheinlichkeit).', sevNow: (w, p) => w + ' jetzt ' + ON['de'](p) + '.',
      sevAt: (w, p, hh) => w + ' ' + ON['de'](p) + ' ab ' + hh + ':00 erwartet.', gale: (s, p) => 'Böen bis ' + s + ' ' + ON['de'](p) + '.',
      at: (t, p) => t + ' ' + ON['de'](p) + '.', temp: (a, b, hh, p) => 'Von ' + a + ' auf ' + b + ' bis ' + hh + ':00 ' + ON['de'](p) + '.',
      day: (w, hi, lo) => w + '. Höchstwert ' + hi + ', Tiefstwert ' + lo + '.', pop: (n, snow) => n + ' % Wahrscheinlichkeit für ' + (snow ? 'Schnee' : 'Regen') + '.',
      wind: s => 'Windig, bis ' + s + '.', survey: 'Die 8 Welten von heute sind da. Tippe, um sie zu scannen.',
      expNew: n => n + ' hat begonnen. Tippe für Meilensteine und Tipps.', expEnd: n => n + ' endet bald.',
      trend: (s, r) => s + ' ist auf Platz ' + r + ' der Trends der Galactic Map.', theme: 'Neue Hintergründe und Icons im Theme Pack.' },
    l: {
      clear: ['Klarer Himmel. Perfektes Scanwetter, Reisender.', 'Keine Gefahren erkannt. Genieß die Sonne.', 'Die Sentinels melden ruhigen Himmel.', 'Ein guter Tag zum Erkunden, Reisender.', 'Ausgezeichnete Sicht. Der Atlas ist zufrieden.', 'Paradiesplaneten-Bedingungen. Selten. Genieß es.'],
      cloud: ['Grauer Himmel, aber keine Gefahr für deinen Exoanzug.', 'Bedeckt. Trotzdem ein guter Tag zum Erkunden.', 'Wolkendecke erkannt. Lebenserhaltung stabil.', 'Keine Stürme auf dem Scanner, Reisender.', 'Trüber Himmel. Deinem Multiwerkzeug ist das egal.', 'Ein ruhiger Tag in diesem Sternsystem.'],
      fog: ['Schlechte Sicht. Achte auf Sentinels im Nebel.', 'Nebel zieht auf. Halte den Scanner bereit.', 'Eingeschränkte Sicht. Reise vorsichtig, Reisender.', 'Dichter Dunst über der Oberfläche. Langsam und ruhig.'],
      rain: ['Nimm eine Jacke mit, Reisender.', 'Der Gefahrenschutz hilft hier nicht. Schnapp dir eine Jacke.', 'Nasser Planet. Regenschirm empfohlen.', 'Kein Giftregen, aber nass wirst du trotzdem.', 'Such Schutz oder eine gute Jacke, Reisender.', 'Regen auf dem Scanner. Halte die Stiefel trocken.'],
      snow: ['Gefrorenes Biom. Zieh dich warm an, Reisender.', 'Kalter Planet voraus. Wärmeschicht empfohlen.', 'Eis auf der Oberfläche. Vorsichtig gehen.', 'Schnee auf dem Scanner. Heißes Getränk empfohlen.', 'Frostbiom erkannt. Gefahrenschutz: Handschuhe.'],
      storm: ['Sturm erkannt. Such Schutz, Reisender.', 'Dein Exoanzug würde dich warnen, also tue ich es.', 'Extremwetter. Bleib drinnen, wenn du kannst.', 'Sturmbedingungen. Kein Tag für einen Spaziergang.', 'Luken dicht, Reisender.'],
      gale: ['Halt deinen Hut fest, Reisender.', 'Starker Wind. Sichere alles Lose.', 'Selbst ein Raumschiff hätte hier Mühe.'],
      heat: ['Glühendes Biom. Trink genug.', 'Hitzeschutz schwindet. Such Schatten, Reisender.', 'Extreme Hitze. Meide die Mittagssonne.'],
      frost: ['Gefahrenschutz niedrig. Zieh dich warm an.', 'Gefrorene Oberfläche. Pass auf, wo du hintrittst.', 'Wärmeschicht empfohlen, Reisender.'],
      cold: ['Zieh noch eine Schicht an, Reisender.', 'Es kühlt schnell ab. Wärmeschicht empfohlen.', 'Die Temperatur fällt. Plane entsprechend.'],
      warm: ['Es wird wärmer. Vielleicht eine Schicht weniger, Reisender.', 'Die Hitze steigt. Trink genug.', 'Eine warme Phase ist im Anflug.'],
      survey: ['Frische Koordinaten vom Atlas.', 'Neue Welten warten, Reisender.', 'Der Scanner hat neue Messwerte.'],
      expNew: ['Die Anomalie wartet, Reisender.', 'Belohnungen warten. Viel Glück da draußen.', 'Eine neue Reise beginnt.'],
      expEnd: ['Hol dir deine Belohnungen, bevor sie endet.', 'Letzte Chance für deine Meilensteine.', 'Lass keine Belohnungen liegen, Reisender.'],
      trend: ['Reisende strömen zu deiner Welt.', 'Deine Entdeckung schlägt Wellen.', 'Die Galaxie ist aufmerksam geworden, Reisender.'],
      theme: ['Ein frischer Look für dein Gerät, Reisender.', 'Tippe, um die Neuheiten zu sehen.', 'Neue Ausrüstung für deinen Startbildschirm.']
    }
  },
  nl: {
    area: 'jouw omgeving', hours: h => h + ' uur',
    t: { rain: '◈ Regen binnen het uur', snow: '◈ Sneeuw binnen het uur', severe: '⚠ Extreem weer op komst',
      gale: '⚠ Stormwaarschuwing', heat: '⚠ Extreme hitte', frost: '⚠ Strenge vorst', drop: '🌡 Temperatuur daalt', rise: '🌡 Temperatuur stijgt',
      morning: p => '☀ Ochtendbericht · ' + p, tomorrow: p => '🌙 Morgen · ' + p, survey: '◈ Nieuwe planeetverkenning',
      expNew: '◈ Nieuwe expeditie is live', expEnd: h => '⏳ Expeditie eindigt over ' + h, trend: r => 'Jouw systeem staat deze week op #' + r,
      theme: '◈ Nieuw in het Theme Pack' },
    b: { rain: (w, p, n) => w + ' waarschijnlijk ' + ON['nl'](p) + ' (' + n + '% kans).', sevNow: (w, p) => w + ' nu ' + ON['nl'](p) + '.',
      sevAt: (w, p, hh) => w + ' verwacht ' + ON['nl'](p) + ' vanaf ' + hh + ':00.', gale: (s, p) => 'Windstoten tot ' + s + ' ' + ON['nl'](p) + '.',
      at: (t, p) => t + ' ' + ON['nl'](p) + '.', temp: (a, b, hh, p) => 'Van ' + a + ' naar ' + b + ' om ' + hh + ':00 ' + ON['nl'](p) + '.',
      day: (w, hi, lo) => w + '. Max ' + hi + ', min ' + lo + '.', pop: (n, snow) => n + '% kans op ' + (snow ? 'sneeuw' : 'regen') + '.',
      wind: s => 'Winderig, tot ' + s + '.', survey: 'De 8 werelden van vandaag zijn binnen. Tik om ze te scannen.',
      expNew: n => n + ' is begonnen. Tik voor mijlpalen en tips.', expEnd: n => n + ' sluit binnenkort.',
      trend: (s, r) => s + ' staat op #' + r + ' in de trends van de Galactic Map.', theme: 'Nieuwe achtergronden en iconen in het Theme Pack.' },
    l: {
      clear: ['Heldere lucht. Perfect scanweer, Reiziger.', 'Geen gevaren gedetecteerd. Geniet van de zon.', 'Sentinels melden een rustige lucht.', 'Een goede dag om te verkennen, Reiziger.', 'Uitstekend zicht. De Atlas keurt het goed.', 'Paradijsplaneet-omstandigheden. Zeldzaam. Geniet ervan.'],
      cloud: ['Grijze lucht, maar geen gevaar voor je exopak.', 'Bewolkt. Toch een prima dag om te verkennen.', 'Bewolking gedetecteerd. Levensondersteuning stabiel.', 'Geen stormen op de scanner, Reiziger.', 'Saaie lucht. Je multitool vindt het best.', 'Een rustige dag in dit sterrenstelsel.'],
      fog: ['Slecht zicht. Let op Sentinels in de mist.', 'Er komt mist aan. Houd je scanner bij de hand.', 'Beperkt zicht. Reis voorzichtig, Reiziger.', 'Dikke nevel boven het oppervlak. Rustig aan.'],
      rain: ['Neem een jas mee, Reiziger.', 'Je gevarenbescherming helpt hier niet. Pak een jas.', 'Natte planeet. Paraplu aanbevolen.', 'Geen giftige regen, maar je wordt wel nat.', 'Zoek beschutting of een goede jas, Reiziger.', 'Regen op de scanner. Houd je laarzen droog.'],
      snow: ['Bevroren bioom. Kleed je warm aan, Reiziger.', 'Koude planeet in aantocht. Thermische laag aanbevolen.', 'IJs op het oppervlak. Loop voorzichtig.', 'Sneeuw op de scanner. Warme drank aanbevolen.', 'Vorstbioom gedetecteerd. Gevarenbescherming: handschoenen.'],
      storm: ['Storm gedetecteerd. Zoek beschutting, Reiziger.', 'Je exopak zou je waarschuwen, dus doe ik het.', 'Extreem weer. Blijf binnen als het kan.', 'Stormachtig. Geen dag voor een wandeling.', 'Luiken dicht, Reiziger.'],
      gale: ['Houd je hoed vast, Reiziger.', 'Harde wind. Zet losse spullen vast.', 'Zelfs een ruimteschip zou hier moeite mee hebben.'],
      heat: ['Verschroeid bioom. Drink genoeg.', 'Hittebescherming raakt op. Zoek schaduw, Reiziger.', 'Extreme hitte. Blijf uit de middagzon.'],
      frost: ['Gevarenbescherming laag. Kleed je warm aan.', 'Bevroren oppervlak. Let op waar je loopt.', 'Thermische laag aanbevolen, Reiziger.'],
      cold: ['Trek een extra laag aan, Reiziger.', 'Het koelt snel af. Thermische laag aanbevolen.', 'De temperatuur daalt. Houd er rekening mee.'],
      warm: ['Het wordt warmer. Misschien een laag minder, Reiziger.', 'De hitte stijgt. Drink genoeg.', 'Er komt een warme periode aan.'],
      survey: ['Verse coördinaten van de Atlas.', 'Nieuwe werelden wachten, Reiziger.', 'De scanner heeft nieuwe metingen.'],
      expNew: ['De Anomalie wacht, Reiziger.', 'Er wachten beloningen. Succes daarbuiten.', 'Een nieuwe reis begint.'],
      expEnd: ['Haal je beloningen op voordat het eindigt.', 'Laatste kans om je mijlpalen te halen.', 'Laat geen beloningen liggen, Reiziger.'],
      trend: ['Reizigers stromen naar jouw wereld.', 'Jouw ontdekking maakt furore.', 'De melkweg heeft het gezien, Reiziger.'],
      theme: ['Een frisse look voor je apparaat, Reiziger.', 'Tik om te zien wat er nieuw is.', 'Nieuwe uitrusting voor je startscherm.']
    }
  },
  pl: {
    area: 'twojej okolicy', hours: h => h + ' ' + (h === 1 ? 'godzinę' : (h % 10 >= 2 && h % 10 <= 4 && (h % 100 < 12 || h % 100 > 14)) ? 'godziny' : 'godzin'),
    t: { rain: '◈ Deszcz w ciągu godziny', snow: '◈ Śnieg w ciągu godziny', severe: '⚠ Nadciąga ekstremalna pogoda',
      gale: '⚠ Ostrzeżenie przed wichurą', heat: '⚠ Ekstremalny upał', frost: '⚠ Silny mróz', drop: '🌡 Temperatura spada', rise: '🌡 Temperatura rośnie',
      morning: p => '☀ Poranny raport · ' + p, tomorrow: p => '🌙 Jutro · ' + p, survey: '◈ Nowy przegląd planet',
      expNew: '◈ Nowa ekspedycja wystartowała', expEnd: h => '⏳ Ekspedycja kończy się za ' + h, trend: r => 'Twój system jest #' + r + ' w tym tygodniu',
      theme: '◈ Nowości w Theme Pack' },
    b: { rain: (w, p, n) => w + ' – prawdopodobnie ' + ON['pl'](p) + ' (' + n + '% szans).', sevNow: (w, p) => w + ' – teraz ' + ON['pl'](p) + '.',
      sevAt: (w, p, hh) => w + ' – ' + ON['pl'](p) + ' od ' + hh + ':00.', gale: (s, p) => 'Porywy do ' + s + ' ' + ON['pl'](p) + '.',
      at: (t, p) => t + ' ' + ON['pl'](p) + '.', temp: (a, b, hh, p) => 'Z ' + a + ' do ' + b + ' do ' + hh + ':00 ' + ON['pl'](p) + '.',
      day: (w, hi, lo) => w + '. Maks. ' + hi + ', min. ' + lo + '.', pop: (n, snow) => n + '% szans na ' + (snow ? 'śnieg' : 'deszcz') + '.',
      wind: s => 'Wietrznie, do ' + s + '.', survey: 'Dzisiejsze 8 światów już jest. Stuknij, by je zeskanować.',
      expNew: n => n + ' już trwa. Stuknij po kamienie milowe i porady.', expEnd: n => n + ' wkrótce się kończy.',
      trend: (s, r) => s + ' jest #' + r + ' na liście popularnych Galactic Map.', theme: 'Nowe tapety i ikony w Theme Pack.' },
    l: {
      clear: ['Czyste niebo. Idealna pogoda do skanowania, podróżniku.', 'Brak zagrożeń. Ciesz się słońcem.', 'Strażnicy meldują spokojne niebo.', 'Dobry dzień na eksplorację, podróżniku.', 'Doskonała widoczność. Atlas to pochwala.', 'Warunki rajskiej planety. Rzadkość. Korzystaj.'],
      cloud: ['Szare niebo, ale bez zagrożeń dla kombinezonu.', 'Pochmurno. Wciąż dobry dzień na eksplorację.', 'Wykryto zachmurzenie. Podtrzymywanie życia stabilne.', 'Brak burz na skanerze, podróżniku.', 'Ponuro. Twojemu multinarzędziu to nie przeszkadza.', 'Spokojny dzień w tym układzie gwiezdnym.'],
      fog: ['Słaba widoczność. Uważaj na Strażników we mgle.', 'Nadciąga mgła. Trzymaj skaner pod ręką.', 'Ograniczona widoczność. Podróżuj ostrożnie.', 'Gęsta mgła nad powierzchnią. Powoli i spokojnie.'],
      rain: ['Weź kurtkę, podróżniku.', 'Ochrona przed zagrożeniami tu nie pomoże. Weź kurtkę.', 'Mokra planeta. Zalecany parasol.', 'To nie toksyczny deszcz, ale i tak zmokniesz.', 'Znajdź schronienie albo dobrą kurtkę, podróżniku.', 'Deszcz na skanerze. Trzymaj buty w suchym miejscu.'],
      snow: ['Zamarznięty biom. Ubierz się ciepło, podróżniku.', 'Nadciąga zimna planeta. Zalecana warstwa termiczna.', 'Lód na powierzchni. Stąpaj ostrożnie.', 'Śnieg na skanerze. Zalecany ciepły napój.', 'Wykryto mroźny biom. Ochrona: rękawiczki.'],
      storm: ['Wykryto burzę. Szukaj schronienia, podróżniku.', 'Twój kombinezon by cię ostrzegł, więc ja to robię.', 'Ekstremalna pogoda. Zostań w środku, jeśli możesz.', 'Burzowo. To nie dzień na spacer.', 'Zabezpiecz włazy, podróżniku.'],
      gale: ['Trzymaj czapkę, podróżniku.', 'Silny wiatr. Zabezpiecz luźne rzeczy.', 'Nawet statek kosmiczny miałby z tym problem.'],
      heat: ['Spalony biom. Pij dużo wody.', 'Ochrona termiczna słabnie. Znajdź cień, podróżniku.', 'Ekstremalny upał. Unikaj południowego słońca.'],
      frost: ['Niska ochrona przed zagrożeniami. Ubierz się ciepło.', 'Zamarznięta powierzchnia. Uważaj, gdzie stąpasz.', 'Zalecana warstwa termiczna, podróżniku.'],
      cold: ['Załóż dodatkową warstwę, podróżniku.', 'Szybko się ochładza. Zalecana warstwa termiczna.', 'Temperatura spada. Zaplanuj to.'],
      warm: ['Robi się cieplej. Może zdejmij warstwę, podróżniku.', 'Upał rośnie. Pij dużo wody.', 'Nadchodzi ciepły okres.'],
      survey: ['Świeże współrzędne od Atlasa.', 'Nowe światy czekają, podróżniku.', 'Skaner ma nowe odczyty.'],
      expNew: ['Anomalia czeka, podróżniku.', 'Nagrody czekają. Powodzenia.', 'Zaczyna się nowa podróż.'],
      expEnd: ['Odbierz nagrody, zanim się skończy.', 'Ostatnia szansa na kamienie milowe.', 'Nie zostawiaj nagród, podróżniku.'],
      trend: ['Podróżnicy ściągają do twojego świata.', 'Twoje odkrycie robi wrażenie.', 'Galaktyka to zauważyła, podróżniku.'],
      theme: ['Świeży wygląd dla twojego urządzenia, podróżniku.', 'Stuknij, by zobaczyć nowości.', 'Nowy sprzęt na ekran główny.']
    }
  },
  fr: {
    area: 'ta zone', hours: h => h + (h === 1 ? ' heure' : ' heures'),
    t: { rain: '◈ Pluie d’ici une heure', snow: '◈ Neige d’ici une heure', severe: '⚠ Météo extrême en approche',
      gale: '⚠ Alerte coup de vent', heat: '⚠ Chaleur extrême', frost: '⚠ Fortes gelées', drop: '🌡 La température baisse', rise: '🌡 La température monte',
      morning: p => '☀ Bulletin du matin · ' + p, tomorrow: p => '🌙 Demain · ' + p, survey: '◈ Nouveau relevé planétaire',
      expNew: '◈ Nouvelle expédition en cours', expEnd: h => '⏳ L’expédition se termine dans ' + h, trend: r => 'Ton système est n° ' + r + ' cette semaine',
      theme: '◈ Nouveau dans le Theme Pack' },
    b: { rain: (w, p, n) => w + ' probable ' + ON['fr'](p) + ' (' + n + ' % de risque).', sevNow: (w, p) => w + ' ' + ON['fr'](p) + ' en ce moment.',
      sevAt: (w, p, hh) => w + ' ' + ON['fr'](p) + ' à partir de ' + hh + 'h.', gale: (s, p) => 'Rafales jusqu’à ' + s + ' ' + ON['fr'](p) + '.',
      at: (t, p) => t + ' ' + ON['fr'](p) + '.', temp: (a, b, hh, p) => 'De ' + a + ' à ' + b + ' d’ici ' + hh + 'h ' + ON['fr'](p) + '.',
      day: (w, hi, lo) => w + '. Max ' + hi + ', min ' + lo + '.', pop: (n, snow) => n + ' % de risque de ' + (snow ? 'neige' : 'pluie') + '.',
      wind: s => 'Venteux, jusqu’à ' + s + '.', survey: 'Les 8 mondes du jour sont là. Touche pour les scanner.',
      expNew: n => n + ' a commencé. Touche pour les étapes et les conseils.', expEnd: n => n + ' se termine bientôt.',
      trend: (s, r) => s + ' est n° ' + r + ' des tendances de la Galactic Map.', theme: 'Nouveaux fonds d’écran et icônes dans le Theme Pack.' },
    l: {
      clear: ['Ciel dégagé. Météo parfaite pour scanner, Voyageur.', 'Aucun danger détecté. Profite du soleil.', 'Les Sentinelles signalent un ciel calme.', 'Belle journée pour explorer, Voyageur.', 'Visibilité excellente. L’Atlas approuve.', 'Conditions de planète paradisiaque. Rare. Profites-en.'],
      cloud: ['Ciel gris, mais aucun danger pour ta combinaison.', 'Couvert. Toujours une bonne journée pour explorer.', 'Couverture nuageuse détectée. Survie stable.', 'Aucune tempête sur le scanner, Voyageur.', 'Ciel terne. Ton multi-outil s’en moque.', 'Une journée calme dans ce système stellaire.'],
      fog: ['Faible visibilité. Attention aux Sentinelles dans la brume.', 'Le brouillard arrive. Garde ton scanner à portée.', 'Visibilité réduite. Voyage prudemment, Voyageur.', 'Brume épaisse en surface. Doucement.'],
      rain: ['Prends un manteau, Voyageur.', 'Ta protection contre les dangers ne couvre pas ça. Prends un manteau.', 'Conditions de planète humide. Parapluie conseillé.', 'Ce n’est pas une pluie toxique, mais tu seras trempé.', 'Trouve un abri ou un bon manteau, Voyageur.', 'Pluie sur le scanner. Garde tes bottes au sec.'],
      snow: ['Biome gelé. Couvre-toi bien, Voyageur.', 'Planète froide en approche. Couche thermique conseillée.', 'Glace en surface. Marche prudemment.', 'Neige sur le scanner. Boisson chaude conseillée.', 'Biome glacial détecté. Protection : des gants.'],
      storm: ['Tempête détectée. Mets-toi à l’abri, Voyageur.', 'Ta combinaison te préviendrait, alors je le fais.', 'Événement météo extrême. Reste à l’intérieur si tu peux.', 'Conditions orageuses. Pas un jour pour se promener.', 'Ferme les écoutilles, Voyageur.'],
      gale: ['Tiens bien ton chapeau, Voyageur.', 'Vents forts. Attache ce qui traîne.', 'Même un vaisseau aurait du mal là-dedans.'],
      heat: ['Biome brûlant. Hydrate-toi.', 'Protection thermique en baisse. Trouve de l’ombre, Voyageur.', 'Chaleur extrême. Évite le soleil de midi.'],
      frost: ['Protection contre les dangers faible. Couvre-toi bien.', 'Surface gelée. Attention où tu marches.', 'Couche thermique conseillée, Voyageur.'],
      cold: ['Ajoute une couche, Voyageur.', 'Ça se refroidit vite. Couche thermique conseillée.', 'La température chute. Prévois en conséquence.'],
      warm: ['Ça se réchauffe. Une couche en moins, Voyageur ?', 'La chaleur monte. Hydrate-toi.', 'Un coup de chaud arrive.'],
      survey: ['Nouvelles coordonnées de l’Atlas.', 'De nouveaux mondes t’attendent, Voyageur.', 'Le scanner a de nouvelles données.'],
      expNew: ['L’Anomalie t’attend, Voyageur.', 'Des récompenses t’attendent. Bonne chance.', 'Un nouveau voyage commence.'],
      expEnd: ['Récupère tes récompenses avant la fin.', 'Dernière chance pour tes étapes.', 'Ne laisse pas de récompenses derrière toi, Voyageur.'],
      trend: ['Les voyageurs affluent vers ton monde.', 'Ta découverte fait parler d’elle.', 'La galaxie l’a remarqué, Voyageur.'],
      theme: ['Un nouveau look pour ton appareil, Voyageur.', 'Touche pour voir les nouveautés.', 'Du nouveau matériel pour ton écran d’accueil.']
    }
  },
  'pt-BR': {
    area: 'sua região', hours: h => h + (h === 1 ? ' hora' : ' horas'),
    t: { rain: '◈ Chuva em menos de uma hora', snow: '◈ Neve em menos de uma hora', severe: '⚠ Tempo extremo se aproximando',
      gale: '⚠ Alerta de ventania', heat: '⚠ Calor extremo', frost: '⚠ Geada forte', drop: '🌡 Temperatura caindo', rise: '🌡 Temperatura subindo',
      morning: p => '☀ Boletim da manhã · ' + p, tomorrow: p => '🌙 Amanhã · ' + p, survey: '◈ Nova pesquisa planetária',
      expNew: '◈ Nova expedição no ar', expEnd: h => '⏳ A expedição termina em ' + h, trend: r => 'Seu sistema é o nº ' + r + ' nesta semana',
      theme: '◈ Novidades no Theme Pack' },
    b: { rain: (w, p, n) => w + ' provável ' + ON['pt-BR'](p) + ' (' + n + '% de chance).', sevNow: (w, p) => w + ' ' + ON['pt-BR'](p) + ' agora.',
      sevAt: (w, p, hh) => w + ' ' + ON['pt-BR'](p) + ' a partir das ' + hh + ':00.', gale: (s, p) => 'Rajadas de até ' + s + ' ' + ON['pt-BR'](p) + '.',
      at: (t, p) => t + ' ' + ON['pt-BR'](p) + '.', temp: (a, b, hh, p) => 'De ' + a + ' para ' + b + ' até as ' + hh + ':00 ' + ON['pt-BR'](p) + '.',
      day: (w, hi, lo) => w + '. Máx. ' + hi + ', mín. ' + lo + '.', pop: (n, snow) => n + '% de chance de ' + (snow ? 'neve' : 'chuva') + '.',
      wind: s => 'Ventando, até ' + s + '.', survey: 'Os 8 mundos de hoje chegaram. Toque para escaneá-los.',
      expNew: n => n + ' começou. Toque para ver marcos e dicas.', expEnd: n => n + ' termina em breve.',
      trend: (s, r) => s + ' é o nº ' + r + ' nas tendências do Galactic Map.', theme: 'Novos papéis de parede e ícones no Theme Pack.' },
    l: {
      clear: ['Céu limpo. Tempo perfeito para escanear, Viajante.', 'Nenhum perigo detectado. Aproveite o sol.', 'As Sentinelas relatam céu calmo.', 'Um bom dia para explorar, Viajante.', 'Visibilidade excelente. O Atlas aprova.', 'Condições de planeta paraíso. Raro. Aproveite.'],
      cloud: ['Céu cinza, mas sem perigo para o seu exotraje.', 'Nublado. Ainda é um bom dia para explorar.', 'Nuvens detectadas. Suporte de vida estável.', 'Nenhuma tempestade no scanner, Viajante.', 'Céu sem graça. Sua multiferramenta não liga.', 'Um dia tranquilo neste sistema estelar.'],
      fog: ['Pouca visibilidade. Cuidado com Sentinelas na névoa.', 'A neblina está chegando. Deixe o scanner à mão.', 'Visibilidade reduzida. Viaje com cuidado, Viajante.', 'Névoa densa na superfície. Devagar e sempre.'],
      rain: ['Leve um casaco, Viajante.', 'A proteção contra perigos não cobre isso. Pegue um casaco.', 'Planeta molhado. Guarda-chuva recomendado.', 'Não é chuva tóxica, mas você vai se molhar.', 'Procure abrigo ou um bom casaco, Viajante.', 'Chuva no scanner. Mantenha as botas secas.'],
      snow: ['Bioma congelado. Agasalhe-se, Viajante.', 'Planeta frio à vista. Camada térmica recomendada.', 'Gelo na superfície. Pise com cuidado.', 'Neve no scanner. Bebida quente recomendada.', 'Bioma gelado detectado. Proteção: luvas.'],
      storm: ['Tempestade detectada. Procure abrigo, Viajante.', 'Seu exotraje avisaria, então eu aviso.', 'Evento climático extremo. Fique em casa se puder.', 'Condições de tempestade. Não é dia para passear.', 'Feche as escotilhas, Viajante.'],
      gale: ['Segure o chapéu, Viajante.', 'Ventos fortes. Prenda tudo que estiver solto.', 'Até uma nave estelar sofreria com isso.'],
      heat: ['Bioma escaldante. Mantenha-se hidratado.', 'Proteção térmica acabando. Procure sombra, Viajante.', 'Calor extremo. Evite o sol do meio-dia.'],
      frost: ['Proteção contra perigos baixa. Agasalhe-se bem.', 'Superfície congelada. Cuidado onde pisa.', 'Camada térmica recomendada, Viajante.'],
      cold: ['Coloque mais uma camada, Viajante.', 'Esfriando rápido. Camada térmica recomendada.', 'A temperatura está caindo. Planeje-se.'],
      warm: ['Esquentando. Talvez tire uma camada, Viajante.', 'O calor está subindo. Mantenha-se hidratado.', 'Uma onda de calor está chegando.'],
      survey: ['Novas coordenadas do Atlas.', 'Novos mundos esperam, Viajante.', 'O scanner tem novas leituras.'],
      expNew: ['A Anomalia espera, Viajante.', 'Recompensas esperando. Boa sorte lá fora.', 'Uma nova jornada começa.'],
      expEnd: ['Resgate suas recompensas antes que acabe.', 'Última chance de completar seus marcos.', 'Não deixe recompensas para trás, Viajante.'],
      trend: ['Viajantes estão indo em massa para o seu mundo.', 'Sua descoberta está fazendo sucesso.', 'A galáxia percebeu, Viajante.'],
      theme: ['Um visual novo para o seu aparelho, Viajante.', 'Toque para ver as novidades.', 'Equipamento novo para a sua tela inicial.']
    }
  },
  it: {
    area: 'la tua zona', hours: h => h + (h === 1 ? ' ora' : ' ore'),
    t: { rain: '◈ Pioggia entro un’ora', snow: '◈ Neve entro un’ora', severe: '⚠ Maltempo estremo in arrivo',
      gale: '⚠ Allerta burrasca', heat: '⚠ Caldo estremo', frost: '⚠ Gelata forte', drop: '🌡 La temperatura scende', rise: '🌡 La temperatura sale',
      morning: p => '☀ Bollettino del mattino · ' + p, tomorrow: p => '🌙 Domani · ' + p, survey: '◈ Nuovo rilevamento planetario',
      expNew: '◈ Nuova spedizione attiva', expEnd: h => '⏳ La spedizione finisce tra ' + h, trend: r => 'Il tuo sistema è n. ' + r + ' questa settimana',
      theme: '◈ Novità nel Theme Pack' },
    b: { rain: (w, p, n) => w + ' probabile ' + ON['it'](p) + ' (' + n + '% di probabilità).', sevNow: (w, p) => w + ' ' + ON['it'](p) + ' adesso.',
      sevAt: (w, p, hh) => w + ' ' + ON['it'](p) + ' dalle ' + hh + ':00.', gale: (s, p) => 'Raffiche fino a ' + s + ' ' + ON['it'](p) + '.',
      at: (t, p) => t + ' ' + ON['it'](p) + '.', temp: (a, b, hh, p) => 'Da ' + a + ' a ' + b + ' entro le ' + hh + ':00 ' + ON['it'](p) + '.',
      day: (w, hi, lo) => w + '. Max ' + hi + ', min ' + lo + '.', pop: (n, snow) => n + '% di probabilità di ' + (snow ? 'neve' : 'pioggia') + '.',
      wind: s => 'Ventoso, fino a ' + s + '.', survey: 'Gli 8 mondi di oggi sono arrivati. Tocca per scansionarli.',
      expNew: n => n + ' è iniziata. Tocca per traguardi e consigli.', expEnd: n => n + ' finisce presto.',
      trend: (s, r) => s + ' è n. ' + r + ' tra le tendenze della Galactic Map.', theme: 'Nuovi sfondi e icone nel Theme Pack.' },
    l: {
      clear: ['Cielo sereno. Tempo perfetto per scansionare, Viaggiatore.', 'Nessun pericolo rilevato. Goditi il sole.', 'Le Sentinelle segnalano cieli calmi.', 'Una bella giornata per esplorare, Viaggiatore.', 'Visibilità eccellente. L’Atlas approva.', 'Condizioni da pianeta paradiso. Rare. Goditele.'],
      cloud: ['Cielo grigio, ma nessun pericolo per la tua tuta.', 'Coperto. Comunque una buona giornata per esplorare.', 'Nuvole rilevate. Supporto vitale stabile.', 'Nessuna tempesta sullo scanner, Viaggiatore.', 'Cielo spento. Al tuo multiattrezzo non importa.', 'Una giornata tranquilla in questo sistema stellare.'],
      fog: ['Visibilità scarsa. Occhio alle Sentinelle nella nebbia.', 'Arriva la nebbia. Tieni lo scanner a portata.', 'Visibilità ridotta. Viaggia con prudenza, Viaggiatore.', 'Foschia fitta in superficie. Piano e con calma.'],
      rain: ['Prendi un cappotto, Viaggiatore.', 'La protezione dai pericoli non basta. Prendi un cappotto.', 'Pianeta bagnato. Consigliato l’ombrello.', 'Non è pioggia tossica, ma ti bagnerai lo stesso.', 'Cerca riparo o un buon cappotto, Viaggiatore.', 'Pioggia sullo scanner. Tieni gli stivali asciutti.'],
      snow: ['Bioma ghiacciato. Copriti bene, Viaggiatore.', 'Pianeta freddo in arrivo. Consigliato strato termico.', 'Ghiaccio in superficie. Cammina con attenzione.', 'Neve sullo scanner. Consigliata una bevanda calda.', 'Bioma gelido rilevato. Protezione: guanti.'],
      storm: ['Tempesta rilevata. Cerca riparo, Viaggiatore.', 'La tua tuta ti avviserebbe, quindi lo faccio io.', 'Evento meteo estremo. Resta al chiuso se puoi.', 'Condizioni di tempesta. Non è giornata per una passeggiata.', 'Chiudi i boccaporti, Viaggiatore.'],
      gale: ['Tieniti il cappello, Viaggiatore.', 'Vento forte. Fissa tutto ciò che è libero.', 'Perfino un’astronave faticherebbe con questo.'],
      heat: ['Bioma rovente. Bevi molto.', 'Protezione termica in calo. Cerca l’ombra, Viaggiatore.', 'Caldo estremo. Evita il sole di mezzogiorno.'],
      frost: ['Protezione dai pericoli bassa. Copriti bene.', 'Superficie ghiacciata. Attento a dove metti i piedi.', 'Consigliato strato termico, Viaggiatore.'],
      cold: ['Aggiungi uno strato, Viaggiatore.', 'Si raffredda in fretta. Consigliato strato termico.', 'La temperatura cala. Organizzati di conseguenza.'],
      warm: ['Si scalda. Forse togli uno strato, Viaggiatore.', 'Il caldo aumenta. Bevi molto.', 'Sta arrivando un periodo caldo.'],
      survey: ['Nuove coordinate dall’Atlas.', 'Nuovi mondi ti aspettano, Viaggiatore.', 'Lo scanner ha nuove letture.'],
      expNew: ['L’Anomalia ti aspetta, Viaggiatore.', 'Le ricompense ti aspettano. Buona fortuna.', 'Inizia un nuovo viaggio.'],
      expEnd: ['Riscatta le ricompense prima che finisca.', 'Ultima occasione per i tuoi traguardi.', 'Non lasciare ricompense indietro, Viaggiatore.'],
      trend: ['I viaggiatori accorrono nel tuo mondo.', 'La tua scoperta sta facendo parlare.', 'La galassia se n’è accorta, Viaggiatore.'],
      theme: ['Un look nuovo per il tuo dispositivo, Viaggiatore.', 'Tocca per vedere le novità.', 'Nuova attrezzatura per la tua schermata home.']
    }
  }
};

// Which pool of lines fits a weather code.
export function group(c) {
  if (c >= 95) return 'storm';
  if ((c >= 71 && c <= 77) || c === 85 || c === 86) return 'snow';
  if ((c >= 51 && c <= 67) || (c >= 80 && c <= 82)) return 'rain';
  if (c === 45 || c === 48) return 'fog';
  if (c <= 1) return 'clear';
  return 'cloud';
}

export function texts(lang) {
  const L = cleanLang(lang), x = P[L];
  return Object.assign({}, x, {
    lang: L,
    wmo: c => (L === 'en' ? null : (WMO_I18N[L] || {})[c]) || null,
    place: p => (!p || p === 'your area' ? x.area : p),
    placeT: p => (!p || p === 'your area' ? AREA_T[L] : p)
  });
}

// One line from a pool, never the same as last time (`last` = index used last time, or -1).
export function pickLine(lang, pool, last, rnd = Math.random) {
  const arr = (P[cleanLang(lang)].l[pool]) || P.en.l[pool] || [];
  if (!arr.length) return { text: '', idx: -1 };
  let i = Math.floor(rnd() * arr.length);
  if (arr.length > 1 && i === last) i = (i + 1 + Math.floor(rnd() * (arr.length - 1))) % arr.length;
  return { text: arr[i], idx: i };
}

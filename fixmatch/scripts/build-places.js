#!/usr/bin/env node
/**
 * Builds src/data/places.json: one entry per Danish postal town with approximate
 * coordinates, used for the manual location picker and as a geocoding fallback.
 *
 * Source: scripts/data/postnumre.csv (PostNord's postal code file, via the
 * dk-postals package, ISC). Coordinates are approximate town centres; towns
 * without their own entry below get their municipality's main town.
 *
 * Usage: node scripts/build-places.js
 */
const fs = require('node:fs');
const path = require('node:path');

/** Main town of each municipality, keyed by municipality number. */
const MUNICIPALITY_COORDS = {
  101: [55.6761, 12.5683], 147: [55.6786, 12.531], 151: [55.7317, 12.3633], 153: [55.648, 12.418],
  155: [55.5933, 12.6714], 157: [55.75, 12.545], 159: [55.7333, 12.4833], 161: [55.6667, 12.4],
  163: [55.7237, 12.44], 165: [55.6569, 12.3639], 167: [55.6572, 12.4736], 169: [55.6517, 12.2925],
  173: [55.7704, 12.5038], 175: [55.6806, 12.4537], 183: [55.6153, 12.3519], 185: [55.629, 12.6],
  187: [55.6236, 12.3846], 190: [55.8083, 12.3608], 201: [55.87, 12.36], 210: [55.975, 12.4044],
  217: [56.0361, 12.6136], 219: [55.9267, 12.3109], 223: [55.8806, 12.5013], 230: [55.8167, 12.4667],
  240: [55.77, 12.19], 250: [55.8396, 12.069], 253: [55.5833, 12.3], 259: [55.458, 12.1821],
  260: [55.9706, 12.0222], 265: [55.6415, 12.0803], 269: [55.5333, 12.2167], 270: [56.0225, 12.1972],
  306: [55.9247, 11.6713], 316: [55.7175, 11.7128], 320: [55.2556, 12.1194], 326: [55.6795, 11.0886],
  329: [55.4426, 11.7902], 330: [55.4028, 11.3546], 336: [55.3097, 12.387], 340: [55.4318, 11.5555],
  350: [55.6044, 11.975], 360: [54.776, 11.501], 370: [55.2299, 11.7609], 376: [54.7691, 11.8742],
  390: [55.008, 11.9105], 400: [55.1009, 14.7066], 410: [55.5059, 9.7309], 411: [55.32, 15.187],
  420: [55.27, 9.9], 430: [55.238, 10.479], 440: [55.4497, 10.6575], 450: [55.3127, 10.7897],
  461: [55.3959, 10.3883], 479: [55.0598, 10.6068], 480: [55.515, 10.398], 482: [54.9364, 10.7106],
  492: [54.888, 10.411], 510: [55.2497, 9.4876], 530: [55.73, 9.11], 540: [54.9138, 9.7922],
  550: [54.9333, 8.8667], 561: [55.4765, 8.4594], 563: [55.445, 8.405], 573: [55.62, 8.4806],
  575: [55.4813, 9.1376], 580: [55.0444, 9.4181], 607: [55.5657, 9.7526], 615: [55.8607, 9.8503],
  621: [55.4904, 9.4722], 630: [55.7113, 9.5357], 657: [56.1393, 8.9738], 661: [56.3601, 8.6161],
  665: [56.5486, 8.3102], 671: [56.49, 8.59], 706: [56.1944, 10.6803], 707: [56.4158, 10.8781],
  710: [56.327, 10.049], 727: [55.9734, 10.1525], 730: [56.4607, 10.0364], 740: [56.1697, 9.5451],
  741: [55.836, 10.603], 746: [56.0342, 9.93], 751: [56.1629, 10.2039], 756: [56.1386, 9.1577],
  760: [56.09, 8.244], 766: [55.77, 9.7], 773: [56.795, 8.86], 779: [56.5667, 9.0333],
  787: [56.9552, 8.6949], 791: [56.4532, 9.402], 810: [57.27, 9.94], 813: [57.4407, 10.5366],
  820: [56.803, 9.516], 825: [57.254, 11.0], 840: [56.885, 9.837], 846: [56.6383, 9.7926],
  849: [57.161, 9.732], 851: [57.0488, 9.9217], 860: [57.4642, 9.9823],
};

/** Towns with their own (more precise) coordinates. */
const TOWN_COORDS = {
  'København K': [55.6795, 12.58], 'København V': [55.67, 12.545], 'Frederiksberg C': [55.6786, 12.531],
  Frederiksberg: [55.68, 12.515], 'København Ø': [55.7075, 12.5774], Nordhavn: [55.718, 12.595],
  'København N': [55.6941, 12.5486], 'København S': [55.6603, 12.6], 'København NV': [55.705, 12.53],
  'København SV': [55.655, 12.535], Valby: [55.6619, 12.5156], Glostrup: [55.6667, 12.4],
  Brøndby: [55.648, 12.418], Rødovre: [55.6806, 12.4537], Albertslund: [55.6569, 12.3639],
  Vallensbæk: [55.6236, 12.3846], Taastrup: [55.6517, 12.2925], Ishøj: [55.6153, 12.3519],
  Hedehusene: [55.65, 12.195], Hvidovre: [55.6572, 12.4736], 'Brøndby Strand': [55.62, 12.42],
  'Vallensbæk Strand': [55.617, 12.39], Greve: [55.5833, 12.3], 'Solrød Strand': [55.5333, 12.2167],
  Karlslunde: [55.565, 12.235], Brønshøj: [55.7046, 12.4919], Vanløse: [55.687, 12.49],
  Herlev: [55.7237, 12.44], Skovlunde: [55.715, 12.4], Ballerup: [55.7317, 12.3633], Måløv: [55.75, 12.32],
  Smørum: [55.742, 12.3], Kastrup: [55.6333, 12.64], Dragør: [55.5933, 12.6714],
  'Kongens Lyngby': [55.7704, 12.5038], Gentofte: [55.75, 12.545], Virum: [55.795, 12.47],
  Holte: [55.8167, 12.4667], Nærum: [55.815, 12.53], Søborg: [55.7333, 12.5167], Dyssegård: [55.733, 12.533],
  Bagsværd: [55.76, 12.455], Hellerup: [55.7316, 12.5714], Charlottenlund: [55.752, 12.573],
  Klampenborg: [55.77, 12.59], Skodsborg: [55.825, 12.57], Vedbæk: [55.855, 12.565],
  'Rungsted Kyst': [55.884, 12.544], Hørsholm: [55.8806, 12.5013], Kokkedal: [55.905, 12.5], Nivå: [55.933, 12.507],
  Helsingør: [56.0361, 12.6136], Hillerød: [55.9267, 12.3109], Birkerød: [55.8476, 12.428],
  Farum: [55.8083, 12.3608], Værløse: [55.7826, 12.37], Allerød: [55.87, 12.36], Fredensborg: [55.975, 12.4044],
  Humlebæk: [55.962, 12.534], Espergærde: [56.0, 12.57], Gilleleje: [56.122, 12.311], Helsinge: [56.0225, 12.1972],
  Frederikssund: [55.8396, 12.069], Frederiksværk: [55.9706, 12.0222], Hundested: [55.965, 11.85],
  Ølstykke: [55.796, 12.16], Stenløse: [55.77, 12.19], Roskilde: [55.6415, 12.0803], Køge: [55.458, 12.1821],
  Holbæk: [55.7175, 11.7128], Ringsted: [55.4426, 11.7902], Sorø: [55.4318, 11.5555], Næstved: [55.2299, 11.7609],
  Slagelse: [55.4028, 11.3546], Kalundborg: [55.6795, 11.0886], Korsør: [55.33, 11.14],
  'Nykøbing Sj': [55.9247, 11.6713], Vordingborg: [55.008, 11.9105], 'Nykøbing F': [54.7691, 11.8742],
  Maribo: [54.776, 11.501], Nakskov: [54.8303, 11.1361], Faxe: [55.2556, 12.1194], Haslev: [55.323, 11.964],
  'Store Heddinge': [55.3097, 12.387], Lejre: [55.6044, 11.975],
  'Odense C': [55.3959, 10.3883], 'Odense V': [55.39, 10.34], 'Odense NV': [55.415, 10.355],
  'Odense SØ': [55.375, 10.44], 'Odense M': [55.38, 10.41], 'Odense NØ': [55.415, 10.43],
  'Odense SV': [55.37, 10.36], 'Odense S': [55.355, 10.395], 'Odense N': [55.435, 10.38],
  Svendborg: [55.0598, 10.6068], Nyborg: [55.3127, 10.7897], Middelfart: [55.5059, 9.7309], Assens: [55.27, 9.9],
  Faaborg: [55.0954, 10.2427], Kerteminde: [55.4497, 10.6575], Bogense: [55.5667, 10.0886], Ringe: [55.238, 10.479],
  Rudkøbing: [54.9364, 10.7106], Ærøskøbing: [54.888, 10.411], Marstal: [54.855, 10.517],
  Kolding: [55.4904, 9.4722], Vejle: [55.7113, 9.5357], Fredericia: [55.5657, 9.7526], Haderslev: [55.2497, 9.4876],
  Aabenraa: [55.0444, 9.4181], Sønderborg: [54.9138, 9.7922], Tønder: [54.9333, 8.8667], Esbjerg: [55.4765, 8.4594],
  'Esbjerg Ø': [55.48, 8.49], 'Esbjerg V': [55.47, 8.42], 'Esbjerg N': [55.5, 8.45], Varde: [55.62, 8.4806],
  Ribe: [55.328, 8.76], Vejen: [55.4813, 9.1376], Billund: [55.73, 9.11], Grindsted: [55.757, 8.923],
  'Aarhus C': [56.1567, 10.2108], 'Aarhus N': [56.19, 10.19], 'Aarhus V': [56.17, 10.16], Brabrand: [56.15, 10.11],
  Åbyhøj: [56.155, 10.155], Risskov: [56.19, 10.23], Egå: [56.21, 10.27], 'Viby J': [56.13, 10.16],
  Højbjerg: [56.12, 10.2], 'Tranbjerg J': [56.09, 10.135], Mårslet: [56.066, 10.16], Beder: [56.06, 10.21],
  Lystrup: [56.237, 10.238], Hjortshøj: [56.25, 10.26], Tilst: [56.185, 10.11], Hinnerup: [56.266, 10.061],
  'Harlev J': [56.144, 10.0], Skanderborg: [56.0342, 9.93], Silkeborg: [56.1697, 9.5451], Horsens: [55.8607, 9.8503],
  'Randers C': [56.4607, 10.0364], Viborg: [56.4532, 9.402], Herning: [56.1393, 8.9738], Holstebro: [56.3601, 8.6161],
  Skive: [56.5667, 9.0333], Ikast: [56.1386, 9.1577], Brande: [55.943, 9.128], Ringkøbing: [56.09, 8.244],
  Skjern: [55.95, 8.5], Lemvig: [56.5486, 8.3102], Struer: [56.49, 8.59], Odder: [55.9734, 10.1525],
  Grenaa: [56.4158, 10.8781], Ebeltoft: [56.1944, 10.6803], Hadsten: [56.327, 10.049], Hedensted: [55.77, 9.7],
  Juelsminde: [55.709, 10.017],
  Aalborg: [57.048, 9.9187], 'Aalborg SV': [57.02, 9.88], 'Aalborg SØ': [57.03, 9.96], 'Aalborg Øst': [57.04, 10.0],
  Klarup: [57.01, 10.05], Storvorde: [57.005, 10.1], Nørresundby: [57.059, 9.923], Vodskov: [57.105, 10.025],
  'Svenstrup J': [56.975, 9.85], Gistrup: [56.995, 9.995], Hjørring: [57.4642, 9.9823], Frederikshavn: [57.4407, 10.5366],
  Skagen: [57.7209, 10.5839], Brønderslev: [57.27, 9.94], Hobro: [56.6383, 9.7926], Thisted: [56.9552, 8.6949],
  'Nykøbing M': [56.795, 8.86], Aars: [56.803, 9.516], Støvring: [56.885, 9.837], Aabybro: [57.161, 9.732],
  Fjerritslev: [57.086, 9.265], Sæby: [57.334, 10.52],
  Rønne: [55.1009, 14.7066], Nexø: [55.06, 15.13], Aakirkeby: [55.07, 14.92], Allinge: [55.276, 14.8],
  Svaneke: [55.135, 15.14], Hasle: [55.183, 14.71],
};

function main() {
  const csvPath = path.join(__dirname, 'data', 'postnumre.csv');
  const outPath = path.join(__dirname, '..', 'src', 'data', 'places.json');
  const lines = fs.readFileSync(csvPath, 'utf8').replace(/^﻿/, '').trim().split(/\r?\n/);
  const header = lines.shift().split(';');
  const col = (name) => header.indexOf(name);

  const towns = new Map();
  for (const line of lines) {
    const cells = line.split(';');
    const code = Number(cells[col('POSTNR')]);
    if (!Number.isFinite(code) || code < 1000) continue; // < 1000 are company/PO box codes
    const name = cells[col('BYNAVN')].trim();
    const kommuneNr = Number(cells[col('KOMMUNE_NR')]);
    const kommune = cells[col('ADRESSERINGSNAVN_1')].trim();
    const town = towns.get(name) ?? { name, min: code, max: code, kommuner: new Map() };
    town.min = Math.min(town.min, code);
    town.max = Math.max(town.max, code);
    const key = `${kommuneNr}|${kommune}`;
    town.kommuner.set(key, (town.kommuner.get(key) ?? 0) + 1);
    towns.set(name, town);
  }

  const places = [];
  for (const town of towns.values()) {
    const [kommuneKey] = [...town.kommuner.entries()].sort((a, b) => b[1] - a[1])[0];
    const [kommuneNr, kommune] = kommuneKey.split('|');
    const own = TOWN_COORDS[town.name];
    const fallback = MUNICIPALITY_COORDS[Number(kommuneNr)];
    if (!own && !fallback) throw new Error(`Missing coordinates for municipality ${kommuneNr} (${kommune})`);
    const [lat, lon] = own ?? fallback;
    places.push({
      code: String(town.min).padStart(4, '0'),
      ...(town.max !== town.min ? { to: String(town.max).padStart(4, '0') } : {}),
      name: town.name,
      kommune,
      lat,
      lon,
      ...(own ? {} : { approx: true }),
    });
  }

  places.sort((a, b) => a.code.localeCompare(b.code));
  fs.writeFileSync(outPath, JSON.stringify(places) + '\n');
  const precise = places.filter((p) => !p.approx).length;
  console.log(`Wrote ${places.length} places (${precise} with town coordinates) to ${path.relative(process.cwd(), outPath)}`);
}

main();

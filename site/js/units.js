/**
 * units.js — Unit definitions and normalization to SI base units.
 *
 * Every measurement type has a canonical SI unit:
 *   weight → kg
 *   length → m
 *   area   → m²
 *   volume → m³
 *
 * Add new units here when scrapers encounter them.
 */

/** Map of unit string → { type, toSI } where toSI is the multiplier to the base SI unit */
const UNIT_TABLE = {
  // Weight (base: kg)
  kg: { type: 'weight', toSI: 1 },
  g: { type: 'weight', toSI: 1e-3 },
  mg: { type: 'weight', toSI: 1e-6 },
  µg: { type: 'weight', toSI: 1e-9 },
  ug: { type: 'weight', toSI: 1e-9 },
  ng: { type: 'weight', toSI: 1e-12 },
  pg: { type: 'weight', toSI: 1e-15 },
  fg: { type: 'weight', toSI: 1e-18 },       // femtogram
  ag: { type: 'weight', toSI: 1e-21 },       // attogram
  zg: { type: 'weight', toSI: 1e-24 },       // zeptogram
  yg: { type: 'weight', toSI: 1e-27 },       // yoctogram
  rg: { type: 'weight', toSI: 1e-30 },       // rontogram (2022 SI; e.g. electron mass ≈ 1 rg)
  qg: { type: 'weight', toSI: 1e-33 },       // quectogram (2022 SI)
  t: { type: 'weight', toSI: 1e3 },
  tonne: { type: 'weight', toSI: 1e3 },
  ton: { type: 'weight', toSI: 907.185 },    // US short ton
  lb: { type: 'weight', toSI: 0.453592 },
  lbs: { type: 'weight', toSI: 0.453592 },
  oz: { type: 'weight', toSI: 0.0283495 },
  st: { type: 'weight', toSI: 6.35029 },     // stone
  grain: { type: 'weight', toSI: 6.479891e-5 },
  carat: { type: 'weight', toSI: 2e-4 },
  Mt: { type: 'weight', toSI: 1e9 },         // megatonne
  Gt: { type: 'weight', toSI: 1e12 },        // gigatonne
  Tt: { type: 'weight', toSI: 1e15 },        // teratonne
  Rg: { type: 'weight', toSI: 1e24 },        // ronnagram (2022 SI; e.g. Earth mass ≈ 6 Rg)
  Qg: { type: 'weight', toSI: 1e27 },        // quettagram (2022 SI; e.g. Jupiter mass ≈ 2 Qg)
  Da: { type: 'weight', toSI: 1.66054e-27 }, // dalton
  u: { type: 'weight', toSI: 1.66054e-27 },  // atomic mass unit
  eV: { type: 'weight', toSI: 1.78266e-36 }, // eV/c² (mass-energy)

  // Length (base: m)
  m: { type: 'length', toSI: 1 },
  km: { type: 'length', toSI: 1e3 },
  cm: { type: 'length', toSI: 1e-2 },
  mm: { type: 'length', toSI: 1e-3 },
  µm: { type: 'length', toSI: 1e-6 },
  um: { type: 'length', toSI: 1e-6 },
  nm: { type: 'length', toSI: 1e-9 },
  pm: { type: 'length', toSI: 1e-12 },
  fm: { type: 'length', toSI: 1e-15 },
  am: { type: 'length', toSI: 1e-18 },
  zm: { type: 'length', toSI: 1e-21 },       // zeptometre
  ym: { type: 'length', toSI: 1e-24 },       // yoctometre
  rm: { type: 'length', toSI: 1e-27 },       // rontometre (2022 SI)
  qm: { type: 'length', toSI: 1e-30 },       // quectometre (2022 SI)
  Å: { type: 'length', toSI: 1e-10 },        // angstrom
  in: { type: 'length', toSI: 0.0254 },
  ft: { type: 'length', toSI: 0.3048 },
  yd: { type: 'length', toSI: 0.9144 },
  mi: { type: 'length', toSI: 1609.344 },
  nmi: { type: 'length', toSI: 1852 },       // nautical mile
  au: { type: 'length', toSI: 1.496e11 },    // astronomical unit
  AU: { type: 'length', toSI: 1.496e11 },
  ly: { type: 'length', toSI: 9.461e15 },    // light-year
  pc: { type: 'length', toSI: 3.086e16 },    // parsec
  kpc: { type: 'length', toSI: 3.086e19 },
  Mpc: { type: 'length', toSI: 3.086e22 },
  Gpc: { type: 'length', toSI: 3.086e25 },
  Mm: { type: 'length', toSI: 1e6 },         // megametre
  Gm: { type: 'length', toSI: 1e9 },         // gigametre
  Tm: { type: 'length', toSI: 1e12 },        // terametre
  Pm: { type: 'length', toSI: 1e15 },        // petametre
  Em: { type: 'length', toSI: 1e18 },        // exametre
  Zm: { type: 'length', toSI: 1e21 },        // zettametre
  Ym: { type: 'length', toSI: 1e24 },        // yottametre
  Rm: { type: 'length', toSI: 1e27 },        // ronnametre (2022 SI)
  Qm: { type: 'length', toSI: 1e30 },        // quettametre (2022 SI)

  // Area (base: m²)
  'm²': { type: 'area', toSI: 1 },
  'm2': { type: 'area', toSI: 1 },
  'km²': { type: 'area', toSI: 1e6 },
  'km2': { type: 'area', toSI: 1e6 },
  'cm²': { type: 'area', toSI: 1e-4 },
  'cm2': { type: 'area', toSI: 1e-4 },
  'mm²': { type: 'area', toSI: 1e-6 },
  'mm2': { type: 'area', toSI: 1e-6 },
  'µm²': { type: 'area', toSI: 1e-12 },
  'µm2': { type: 'area', toSI: 1e-12 },
  'nm²': { type: 'area', toSI: 1e-18 },
  'nm2': { type: 'area', toSI: 1e-18 },
  'pm²': { type: 'area', toSI: 1e-24 },
  'pm2': { type: 'area', toSI: 1e-24 },
  'fm²': { type: 'area', toSI: 1e-30 },
  'fm2': { type: 'area', toSI: 1e-30 },
  'am²': { type: 'area', toSI: 1e-36 },
  'am2': { type: 'area', toSI: 1e-36 },
  'zm²': { type: 'area', toSI: 1e-42 },
  'zm2': { type: 'area', toSI: 1e-42 },
  'ym²': { type: 'area', toSI: 1e-48 },
  'ym2': { type: 'area', toSI: 1e-48 },
  'rm²': { type: 'area', toSI: 1e-54 },
  'rm2': { type: 'area', toSI: 1e-54 },
  'qm²': { type: 'area', toSI: 1e-60 },
  'qm2': { type: 'area', toSI: 1e-60 },
  'Mm²': { type: 'area', toSI: 1e12 },
  'Mm2': { type: 'area', toSI: 1e12 },
  'Gm²': { type: 'area', toSI: 1e18 },
  'Gm2': { type: 'area', toSI: 1e18 },
  'Tm²': { type: 'area', toSI: 1e24 },
  'Tm2': { type: 'area', toSI: 1e24 },
  'Pm²': { type: 'area', toSI: 1e30 },
  'Pm2': { type: 'area', toSI: 1e30 },
  'Em²': { type: 'area', toSI: 1e36 },
  'Em2': { type: 'area', toSI: 1e36 },
  'Zm²': { type: 'area', toSI: 1e42 },
  'Zm2': { type: 'area', toSI: 1e42 },
  'Ym²': { type: 'area', toSI: 1e48 },
  'Ym2': { type: 'area', toSI: 1e48 },
  'Rm²': { type: 'area', toSI: 1e54 },
  'Rm2': { type: 'area', toSI: 1e54 },
  'Qm²': { type: 'area', toSI: 1e60 },
  'Qm2': { type: 'area', toSI: 1e60 },
  ha: { type: 'area', toSI: 1e4 },
  acre: { type: 'area', toSI: 4046.86 },
  acres: { type: 'area', toSI: 4046.86 },
  'sq mi': { type: 'area', toSI: 2.59e6 },
  'sq ft': { type: 'area', toSI: 0.092903 },
  'sq km': { type: 'area', toSI: 1e6 },
  'sq m': { type: 'area', toSI: 1 },
  barn: { type: 'area', toSI: 1e-28 },

  // Volume (base: m³)
  'm³': { type: 'volume', toSI: 1 },
  'm3': { type: 'volume', toSI: 1 },
  'km³': { type: 'volume', toSI: 1e9 },
  'km3': { type: 'volume', toSI: 1e9 },
  'cm³': { type: 'volume', toSI: 1e-6 },
  'cm3': { type: 'volume', toSI: 1e-6 },
  L: { type: 'volume', toSI: 1e-3 },
  l: { type: 'volume', toSI: 1e-3 },
  mL: { type: 'volume', toSI: 1e-6 },
  ml: { type: 'volume', toSI: 1e-6 },
  gal: { type: 'volume', toSI: 3.78541e-3 },   // US gallon
  qt: { type: 'volume', toSI: 9.46353e-4 },
  pt: { type: 'volume', toSI: 4.73176e-4 },
  'fl oz': { type: 'volume', toSI: 2.95735e-5 },
  cup: { type: 'volume', toSI: 2.36588e-4 },
  tbsp: { type: 'volume', toSI: 1.47868e-5 },
  tsp: { type: 'volume', toSI: 4.92892e-6 },
};

/**
 * Look up a unit string. Returns { type, toSI } or null.
 */
export function lookupUnit(unitStr) {
  if (!unitStr) return null;
  // Normalize Greek small letter mu (U+03BC) to SI Micro Sign (U+00B5)
  const cleaned = unitStr.trim().replace(/\u03bc/g, '\u00b5');
  return UNIT_TABLE[cleaned] || null;
}

/**
 * Convert a value from `fromUnit` to SI base.
 * Returns { valueSI, type } or null if unit is unknown.
 */
export function toSI(value, fromUnit) {
  const info = lookupUnit(fromUnit);
  if (!info) return null;
  return { valueSI: value * info.toSI, type: info.type };
}

/**
 * Get all known unit strings for a given type.
 */
export function unitsForType(type) {
  return Object.entries(UNIT_TABLE)
    .filter(([, v]) => v.type === type)
    .map(([k]) => k);
}

/**
 * Get the SI base unit label for a type.
 */
export function siLabel(type) {
  const map = { weight: 'kg', length: 'm', area: 'm²', volume: 'm³' };
  return map[type] || type;
}

export { UNIT_TABLE };

import { UNIT_TABLE } from './units.js';

'use strict';

const SI_LABELS = {
  weight: 'kg',
  length: 'm',
  area: 'm²',
  volume: 'm³'
};

const EMOJI_MAP = {
  celestial: '🌌',
  ship: '🚢',
  aircraft: '✈️',
  vehicle: '🚗',
  structure: '🏛️',
  'living thing': '🐾',
  geography: '🌍',
  object: '📦',
  country: '🗺️',
  various: '📐',
};

// Locale-aware number separators (computed once from the browser locale)
const _localeParts = new Intl.NumberFormat().formatToParts(1234.5);
const LOCALE_DECIMAL_SEP = _localeParts.find(p => p.type === 'decimal')?.value ?? '.';
const LOCALE_GROUP_SEP = _localeParts.find(p => p.type === 'group')?.value ?? ',';
console.debug(`[locale] decimal='${LOCALE_DECIMAL_SEP}', group='${LOCALE_GROUP_SEP}' (${navigator.language})`);

// State
let DATA = [];
let currentType = 'weight';

// DOM refs
const $valueInput = document.getElementById('value-input');
const $unitInput = document.getElementById('unit-input');
const $results = document.getElementById('results');
const $siValue = document.getElementById('si-value');
const $funSentence = document.getElementById('fun-sentence');
const $cards = document.getElementById('cards');
const $badge = document.getElementById('badge-count');
const radios = document.querySelectorAll('input[name="scale"]');

// Load data
async function loadData() {
  try {
    const resp = await fetch('data/all.json');

    DATA = await resp.json();

    if ($badge)
      $badge.textContent = DATA.length;

    console.log(`Loaded ${DATA.length} reference objects`);
  } catch (e) {
    console.error('Failed to load data:', e);
  }
}

// Scale radio handlers
radios.forEach(r => {
  r.addEventListener('change', () => {
    currentType = r.value;

    $unitInput.placeholder = SI_LABELS[currentType] || 'kg';

    update();
  });
});

function setScaleRadio(type) {
  const r = document.getElementById('scale-' + type);

  if (r && !r.checked) {
    r.checked = true;
    currentType = type;
  }
}

// Smart input: detect when user types a unit
// The value input and unit input work together:
// - User types "85" in value field → stays as number
// - User types "85 kg" or "85kg" → we detect "kg" and move focus to unit field
// - If user starts typing letters in value field → auto-move to unit field

let valueBuffer = '';

$valueInput.addEventListener('input', () => {
  const raw = $valueInput.value;

  // Check if the user typed something that ends with a letter sequence
  const match = raw.match(/^([0-9.,eE+\-\s×x^−]+)\s*([a-zA-Zµμ°Å²³].*)$/);

  if (match) {
    // Split: put the number back, move unit part to unit field
    $valueInput.value = match[1].trim();
    $unitInput.value = match[2].trim();
    $unitInput.focus();

    // Put cursor at end of unit input
    $unitInput.setSelectionRange($unitInput.value.length, $unitInput.value.length);
  }

  update();
});

// Auto-detect type from unit
$unitInput.addEventListener('input', () => {
  const unit = $unitInput.value.trim();
  const info = UNIT_TABLE[unit];

  if (info) {
    setScaleRadio(info.type);
  }

  update();
});

// Also update on Enter key
$valueInput.addEventListener('keydown', e => {
  if (e.key === 'Enter')
    update();
});
$unitInput.addEventListener('keydown', e => {
  if (e.key === 'Enter')
    update();
});

// Core update function
const $emptyState = document.getElementById('empty-state');

function update() {
  const rawVal = $valueInput.value.trim();
  const rawUnit = $unitInput.value.trim();

  if (!rawVal) {
    $results.classList.remove('visible');

    if ($emptyState)
      $emptyState.style.display = '';

    return;
  }
  if ($emptyState) $emptyState.style.display = 'none';

  // Parse number – normalise group/decimal separators using the browser locale
  const escapedGroup = LOCALE_GROUP_SEP.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedDecimal = LOCALE_DECIMAL_SEP.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const normalised = rawVal
    .replace(new RegExp(escapedGroup, 'g'), '')        // strip thousands separator
    .replace(new RegExp(escapedDecimal), '.')           // normalise decimal to '.'
    .replace(/×10\s*[\^]?\s*([−\-]?\d+)/g, 'e$1')
    .replace(/−/g, '-');
  let num = parseFloat(normalised);

  if (isNaN(num) || num === 0) {
    $results.classList.remove('visible');

    return;
  }

  // Get unit info
  const unit = rawUnit || SI_LABELS[currentType];
  const info = UNIT_TABLE[unit];

  let valueSI;

  if (info) {
    valueSI = num * info.toSI;

    if (info.type !== currentType) {
      setScaleRadio(info.type);
    }
  } else {
    // Assume it's already in SI base
    valueSI = num;
  }

  // Show SI value in a human-friendly unit
  if (info) {
    $siValue.innerHTML = formatWithUnit(valueSI, info.type);
  } else {
    $siValue.innerHTML = formatWithUnit(valueSI, currentType);
  }

  // Filter data by current type
  const pool = DATA.filter(d => d.type === currentType && d.valueSI > 0);

  if (pool.length === 0) {
    $funSentence.innerHTML = 'No reference data for this measurement type yet.';
    $cards.innerHTML = '';
    $results.classList.add('visible');

    return;
  }

  // Find closest matches (by log-distance)
  const scored = pool.map(d => ({
    ...d,
    logDist: Math.abs(Math.log10(valueSI) - Math.log10(d.valueSI)),
    ratio: valueSI / d.valueSI,
  }));

  scored.sort((a, b) => a.logDist - b.logDist);

  const closest = scored.slice(0, 8);

  // Fun sentence from the #1 closest
  const top = closest[0];

  $funSentence.innerHTML = buildFunSentence(num, unit, top, currentType);

  // Render cards
  $cards.innerHTML = closest.map((item, i) => renderCard(item, i === 0)).join('');

  $results.classList.add('visible');
}

// Render helpers
function renderCard(item, isClosest) {
  const emoji = EMOJI_MAP[item.category] || '📦';
  const factor = formatFactor(item.ratio);
  const closestBadge = isClosest
    ? `<div class="card-closest ${currentType}">Closest</div>`
    : '';

  const sourceHost = item.sourceUrl
    ? new URL(item.sourceUrl).hostname
      .replace('en.wikipedia.org', 'Wikipedia')
      .replace('restcountries.com', 'REST Countries')
    : item.source;

  return `
      <div class="card">
        ${closestBadge}
        <div class="card-icon">${emoji}</div>
        <div class="card-body">
          <div class="card-name">${escHtml(item.name)}</div>
          ${item.sourceUrl ? `<a class="card-source" href="${escHtml(item.sourceUrl)}" target="_blank" rel="noopener">↗ ${sourceHost}</a>` : ''}
        </div>
        <div class="card-right">
          <div class="card-factor">${factor}</div>
          <div class="card-desc">${formatWithUnit(item.valueSI, item.type)}</div>
        </div>
      </div>`;
}

function buildFunSentence(inputNum, inputUnit, closest, type) {
  const ratio = closest.ratio;
  const name = `<strong>${escHtml(closest.name)}</strong>`;

  if (ratio >= 0.95 && ratio <= 1.05) {
    return `That's almost exactly the ${type === 'weight' ? 'weight' : 'size'} of ${name}.`;
  } else if (ratio > 1) {
    const mult = formatFactor(ratio).replace('×', '').trim();

    return `That's about <strong>${mult}×</strong> the ${type === 'weight' ? 'weight' : 'size'} of ${name}.`;
  } else {
    const frac = formatFactor(ratio);

    return `That's about <strong>${frac}</strong> of ${name}.`;
  }
}

function formatFactor(ratio) {
  if (ratio >= 0.95 && ratio <= 1.05)
    return '≈ 1×';

  if (ratio >= 1) {
    if (ratio >= 1e6)
      return (ratio / 1e6).toFixed(1) + 'M ×';

    if (ratio >= 1e3)
      return (ratio / 1e3).toFixed(1) + 'K ×';

    if (ratio >= 100)
      return Math.round(ratio) + '×';

    if (ratio >= 10)
      return ratio.toFixed(1) + '×';

    return ratio.toFixed(2) + '×';
  } else {
    // Less than 1: show as fraction
    const inv = 1 / ratio;
    if (inv >= 1e6)
      return '1/' + (inv / 1e6).toFixed(1) + 'M';

    if (inv >= 1e3)
      return '1/' + (inv / 1e3).toFixed(1) + 'K';

    if (inv >= 100)
      return '1/' + Math.round(inv);

    if (inv >= 10)
      return '1/' + inv.toFixed(1);

    return ratio.toFixed(2) + '×';
  }
}

function formatSI(val) {
  if (val === 0)
    return '0';

  const abs = Math.abs(val);

  if (abs >= 1e15)
    return val.toExponential(2);

  if (abs >= 1e12)
    return (val / 1e12).toFixed(2) + ' T';

  if (abs >= 1e9)
    return (val / 1e9).toFixed(2) + ' G';

  if (abs >= 1e6)
    return (val / 1e6).toFixed(2) + ' M';

  if (abs >= 1e3)
    return (val / 1e3).toFixed(2) + ' K';

  if (abs >= 1)
    return val.toFixed(2);

  if (abs >= 1e-3)
    return (val * 1e3).toFixed(2) + ' m';

  if (abs >= 1e-6)
    return (val * 1e6).toFixed(2) + ' µ';

  if (abs >= 1e-9)
    return (val * 1e9).toFixed(2) + ' n';

  return val.toExponential(2);
}

const WEIGHT_SCALES = [
  { threshold: 1e12, divisor: 1e12, unit: 'Gt' },
  { threshold: 1e9, divisor: 1e9, unit: 'Mt' },
  { threshold: 1e6, divisor: 1e6, unit: 'kt' },
  { threshold: 1e3, divisor: 1e3, unit: 't' },
  { threshold: 1, divisor: 1, unit: 'kg' },
  { threshold: 1e-3, divisor: 1e-3, unit: 'g' },
  { threshold: 1e-6, divisor: 1e-6, unit: 'mg' },
  { threshold: 1e-9, divisor: 1e-9, unit: 'µg' },
  { threshold: 1e-12, divisor: 1e-12, unit: 'ng' },
];

function formatWithUnit(valueSI, type) {
  if (type === 'weight') {
    const abs = Math.abs(valueSI);

    for (const { threshold, divisor, unit } of WEIGHT_SCALES) {
      if (abs >= threshold)
        return (valueSI / divisor).toFixed(2) + ' ' + unit;
    }

    return valueSI.toExponential(2) + ' kg';
  }

  return formatSI(valueSI) + ' ' + SI_LABELS[type];
}

function escHtml(s) {
  const d = document.createElement('div');

  d.textContent = s;

  return d.innerHTML;
}

// Initialize
loadData().then(() => {
  // If there's already a value in the input (browser autofill), trigger update
  if ($valueInput.value)
    update();
});

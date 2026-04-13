/**
 * wikipedia-scraper.js — Scrapes Wikipedia "Orders of magnitude" pages.
 *
 * Targets:
 *   - Orders of magnitude (mass)
 *   - Orders of magnitude (length)
 *   - Orders of magnitude (area)
 *   - Orders of magnitude (volume)
 *
 * Strategy: fetch the page HTML via the MediaWiki parse API (returns JSON
 * with the rendered HTML), then use Cheerio to walk every <table class="wikitable">
 * and extract rows.
 */

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import BaseScraper from './base-scraper.js';
import { lookupUnit, toSI } from './units.js';

const PAGES = [
  {
    title: 'Orders_of_magnitude_(mass)',
    type: 'weight',
    defaultUnit: 'kg',
    category: 'various',
  },
  {
    title: 'Orders_of_magnitude_(length)',
    type: 'length',
    defaultUnit: 'm',
    category: 'various',
  },
  {
    title: 'Orders_of_magnitude_(area)',
    type: 'area',
    defaultUnit: 'm²',
    category: 'various',
  },
  {
    title: 'Orders_of_magnitude_(volume)',
    type: 'volume',
    defaultUnit: 'm³',
    category: 'various',
  },
];

const API_BASE = 'https://en.wikipedia.org/w/api.php';

/**
 * Parse a messy value string from Wikipedia into a number.
 * Handles: "1.5×10−3", "1.5e-3", "~150", comma separators, etc.
 */
function parseValue(raw) {
  if (!raw)
    return null;

  let s = raw.trim();

  // Remove leading ~ or ≈ or ≥ or ≤ or >
  s = s.replace(/^[~≈≥≤><]+\s*/, '');

  // Remove thousand separators (but keep decimal points)
  s = s.replace(/,/g, '');

  // Convert Wikipedia-style "×10−3" or "×10^−3" to "e-3"
  // Also handles "×10\u22123" (unicode minus)
  s = s.replace(/\s*[×x]\s*10\s*[\^]?\s*([−\-]?\d+)/g, 'e$1');
  // Fix unicode minus in exponent
  s = s.replace(/e\s*−/g, 'e-');

  // Handle superscript digits that may have been flattened
  // e.g. "10−3" without the × prefix
  s = s.replace(/\b10\s*[\^]?\s*([−\-]\d+)/g, '1e$1');

  // Try parsing
  const n = parseFloat(s);

  if (isNaN(n) || n === 0)
    return null;

  return n;
}

/**
 * Try to extract a unit from a value+unit string.
 * Returns { numStr, unitStr } or null.
 */
function splitValueUnit(text) {
  if (!text)
    return null;

  const t = text.trim();

  // Pattern: number followed by optional whitespace and a unit
  const m = t.match(/^([\d.,×x\s\^−\-eE+~≈≥≤><]+?)\s*([a-zA-Zµμ°Å²³]+[\d²³]*)$/);

  if (m) {
    return { numStr: m[1].trim(), unitStr: m[2].trim() };
  }

  // Might be just a number (unit in header)
  return { numStr: t, unitStr: null };
}

/**
 * Guess a category from the description text.
 */
function guessCategory(desc) {
  const d = (desc || '').toLowerCase();
  const rules = [
    [/\b(planet|sun|moon|earth|jupiter|saturn|mars|mercury|venus|neptune|uranus|pluto|star|galaxy|milky way|universe|solar|asteroid|comet|nebula)\b/, 'celestial'],
    [/\b(ship|vessel|tanker|carrier|boat|yacht|submarine|destroyer|cruiser|frigate|barge)\b/, 'ship'],
    [/\b(aircraft|airplane|plane|boeing|airbus|helicopter|jet)\b/, 'aircraft'],
    [/\b(car|truck|vehicle|automobile|suv|sedan|bus|locomotive|train)\b/, 'vehicle'],
    [/\b(building|tower|skyscraper|cathedral|church|mosque|temple|palace|castle|pyramid|monument|statue|wall|dam|bridge)\b/, 'structure'],
    [/\b(whale|elephant|horse|dog|cat|mouse|ant|bee|fly|bird|fish|shark|dinosaur|human|man|woman|person|baby|child|adult)\b/, 'living thing'],
    [/\b(country|continent|ocean|sea|lake|river|island|mountain|desert|forest|city|state|province)\b/, 'geography'],
    [/\b(coin|ball|grain|sand|cell|atom|proton|neutron|electron|molecule|protein|virus|bacteria)\b/, 'object'],
  ];

  for (const [re, cat] of rules) {
    if (re.test(d))
      return cat;
  }

  return 'various';
}

export default class WikipediaScraper extends BaseScraper {
  get name() {
    return 'WikipediaScraper';
  }

  async scrape() {
    const allEntries = [];

    for (const page of PAGES) {
      this.log(`Fetching ${page.title}...`);

      const entries = await this.scrapePage(page);

      this.log(`  → ${entries.length} entries`);

      allEntries.push(...entries);

      await this.sleep(1500); // be polite
    }

    this.log(`Total: ${allEntries.length} entries`);

    return allEntries;
  }

  async scrapePage({ title, type, defaultUnit, category }) {
    const url = `${API_BASE}?action=parse&page=${title}&format=json&prop=text&redirects=`;
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'HowBigIsBot/1.0 (educational project)' },
    });
    const json = await resp.json();
    const html = json?.parse?.text?.['*'];

    if (!html) {
      this.log(`  ⚠ No HTML returned for ${title}`);

      return [];
    }

    const $ = cheerio.load(html);
    const entries = [];

    // Walk every wikitable
    $('table.wikitable').each((_, table) => {
      const $table = $(table);
      const headers = [];

      // Get header labels
      $table.find('tr').first().find('th').each((_, th) => {
        headers.push($(th).text().trim().toLowerCase());
      });

      // Find which column is "value" and which is "item"
      let valIdx = headers.findIndex(h => h.startsWith('value'));
      let itmIdx = headers.findIndex(h => h.startsWith('item') || h.startsWith('object') || h.startsWith('example'));

      // Some tables don't label columns with "value"/"item"
      // Fall back: first column = value, second = item
      if (valIdx === -1)
        valIdx = 0;
      if (itmIdx === -1)
        itmIdx = Math.min(1, headers.length - 1);

      // Check if the header contains a unit hint like "Value (kg)"
      let headerUnit = null;

      if (headers[valIdx]) {
        const m = headers[valIdx].match(/\(([^)]+)\)/);

        if (m)
          headerUnit = m[1].trim();
      }

      // Walk data rows
      const numCols = headers.length;

      $table.find('tr').slice(1).each((_, row) => {
        const cells = $(row).find('td');

        if (cells.length < 2)
          return;

        // OoM tables often have a leading "factor" column (e.g. 10³) with
        // rowspan > 1.  Rows after the first in a group are missing that cell,
        // so their remaining cells are shifted left.  When valIdx > 0 we know
        // there is at least one leading column, so we compensate.
        const missingCols = valIdx > 0 ? Math.max(0, numCols - cells.length) : 0;
        const effectiveValIdx = valIdx - missingCols;
        const effectiveItmIdx = itmIdx - missingCols;

        if (effectiveValIdx < 0 || effectiveItmIdx < 0)
          return;

        if (effectiveValIdx >= cells.length || effectiveItmIdx >= cells.length)
          return;

        if (effectiveValIdx === effectiveItmIdx)
          return;

        const rawVal = $(cells[effectiveValIdx]).text().trim();
        const rawItem = $(cells[effectiveItmIdx]).text().trim();

        if (!rawVal || !rawItem)
          return;

        // Skip ranges like "10-100" or "50 to 100"
        if (/\d\s*(to|–|—)\s*\d/.test(rawVal) && !/[×x]10/.test(rawVal))
          return;

        // Try to split value and unit
        const split = splitValueUnit(rawVal);

        if (!split)
          return;

        const num = parseValue(split.numStr);

        if (num === null)
          return;

        // Determine unit
        const unitStr = split.unitStr || headerUnit || defaultUnit;
        const siResult = toSI(num, unitStr);

        // If we can't convert, still store with what we have
        const entry = {
          name: cleanDescription(rawItem),
          value: num,
          unit: unitStr,
          valueSI: siResult ? siResult.valueSI : num,
          type: siResult ? siResult.type : type,
          category: guessCategory(rawItem) || category,
          description: cleanDescription(rawItem),
          source: 'wikipedia-orders-of-magnitude',
          sourceUrl: `https://en.wikipedia.org/wiki/${title}`,
        };

        // Skip entries with absurd names or very short names
        if (entry.name.length < 3)
          return;

        // Skip celestial, as we use a different source for those
        if (entry.category === 'celestial')
          return;

        entries.push(entry);
      });
    });

    // If wikitables didn't work well, try parsing the bullet-point lists
    // (some OoM pages use <ul> lists instead of tables)
    if (entries.length < 10) {
      this.log(`  Few table entries (${entries.length}), also parsing list items...`);

      const listEntries = this.parseListItems($, type, defaultUnit, title);

      entries.push(...listEntries);
    }

    return entries;
  }

  /**
   * Some Orders of Magnitude pages structure data as bullet-point lists
   * with patterns like: "1.5 kg – description of the thing"
   */
  parseListItems($, type, defaultUnit, title) {
    const entries = [];

    $('li').each((_, li) => {
      const text = $(li).text().trim();

      if (!text || text.length < 10)
        return;

      // Pattern: "VALUE UNIT – DESCRIPTION" or "VALUE UNIT — DESCRIPTION"
      const m = text.match(/^([\d.,×x\s\^−\-eE+~≈]+?)\s*([a-zA-Zµμ°Å²³]+[\d²³]*)\s*[–—\-:]\s*(.+)/);
      if (!m)
        return;

      const num = parseValue(m[1]);
      if (num === null)
        return;

      const unitStr = m[2].trim() || defaultUnit;
      const desc = m[3].trim();
      const siResult = toSI(num, unitStr);

      if (desc.length < 3)
        return;

      const category = guessCategory(desc);

      // Skip celestial, as we use a different source for those
      if (category === 'celestial')
        return;

      entries.push({
        name: cleanDescription(desc),
        value: num,
        unit: unitStr,
        valueSI: siResult ? siResult.valueSI : num,
        type: siResult ? siResult.type : type,
        category: category,
        description: cleanDescription(desc),
        source: 'wikipedia-orders-of-magnitude',
        sourceUrl: `https://en.wikipedia.org/wiki/${title}`,
      });
    });

    return entries;
  }
}

/**
 * Clean up a description: strip reference markers [1][2], trim, truncate.
 */
function cleanDescription(s) {
  return s
    .replace(/\[\d+\]/g, '')        // remove [1] [2] refs
    .replace(/\[citation needed\]/gi, '')
    .replace(/\[note \d+\]/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 300);                  // cap length
}

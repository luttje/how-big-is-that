#!/usr/bin/env node
/**
 * scrape.js — Orchestrator: runs selected scrapers and writes JSON to data/
 *
 * Usage:
 *   node scrape.js                  # run all scrapers
 *   node scrape.js --source=wikipedia
 *   node scrape.js --source=countries
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import WikipediaScraper from './scrapers/wikipedia-scraper.js';
import CountriesScraper from './scrapers/countries-scraper.js';
import SolarSystemScraper from './scrapers/solar-system-scraper.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');

// Registry of all available scrapers
// To add a new scraper: import it above and add an entry here.
const SCRAPERS = {
  wikipedia: WikipediaScraper,
  countries: CountriesScraper,
  'solar-system': SolarSystemScraper,
};

// Parse CLI args
const args = process.argv.slice(2);
const sourceArg = args.find(a => a.startsWith('--source='));
const selectedSource = sourceArg ? sourceArg.split('=')[1] : null;

async function main() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  const toRun = selectedSource
    ? { [selectedSource]: SCRAPERS[selectedSource] }
    : SCRAPERS;

  if (selectedSource && !SCRAPERS[selectedSource]) {
    console.error(`Unknown source: "${selectedSource}". Available: ${Object.keys(SCRAPERS).join(', ')}`);
    process.exit(1);
  }

  const allEntries = [];

  for (const [key, ScraperClass] of Object.entries(toRun)) {
    console.log(`\n━━━ Running ${key} scraper ━━━`);
    const scraper = new ScraperClass();
    try {
      const entries = await scraper.scrape();

      // Write per-source file
      const outPath = path.join(DATA_DIR, `${key}.json`);
      fs.writeFileSync(outPath, JSON.stringify(entries, null, 2));
      console.log(`  → Wrote ${entries.length} entries to ${outPath}`);

      allEntries.push(...entries);
    } catch (err) {
      console.error(`  ⚠ ${key} scraper failed:`, err.message);
    }
  }

  // Write combined file
  if (Object.keys(toRun).length > 1 || !selectedSource) {
    // Deduplicate by name+type (keep first occurrence)
    const seen = new Set();
    const deduped = [];
    for (const e of allEntries) {
      const key = `${e.name.toLowerCase().trim()}|${e.type}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(e);
      }
    }

    // Sort each type by valueSI
    deduped.sort((a, b) => {
      if (a.type !== b.type) return a.type.localeCompare(b.type);
      return a.valueSI - b.valueSI;
    });

    const combinedPath = path.join(DATA_DIR, 'all.json');
    fs.writeFileSync(combinedPath, JSON.stringify(deduped, null, 2));
    console.log(`\n✓ Combined: ${deduped.length} unique entries → ${combinedPath}`);
  }

  // Write a summary
  const summary = {};
  for (const e of allEntries) {
    summary[e.type] = (summary[e.type] || 0) + 1;
  }
  console.log('\nSummary by type:', summary);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

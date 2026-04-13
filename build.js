#!/usr/bin/env node

/**
 * build.js — Static site builder.
 *
 * Reads data/*.json and assembles the final site/ directory
 * ready for GitHub Pages deployment.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const SITE_DIR = path.join(__dirname, 'site');
const SITE_DATA_DIR = path.join(SITE_DIR, 'data');

function main() {
  console.log('Building site...\n');

  // Ensure dirs exist
  fs.mkdirSync(SITE_DATA_DIR, { recursive: true });
  fs.mkdirSync(path.join(SITE_DIR, 'css'), { recursive: true });
  fs.mkdirSync(path.join(SITE_DIR, 'js'), { recursive: true });

  // Copy shared unit definitions into site/js/
  fs.copyFileSync(
    path.join(__dirname, 'scrapers', 'units.js'),
    path.join(SITE_DIR, 'js', 'units.js')
  );
  console.log('  Copied scrapers/units.js → site/js/units.js');

  // Copy data files into site/data/
  const dataFiles = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
  for (const f of dataFiles) {
    fs.copyFileSync(path.join(DATA_DIR, f), path.join(SITE_DATA_DIR, f));
    console.log(`  Copied data/${f} → site/data/${f}`);
  }

  // Count entries for the badge
  let totalEntries = 0;
  const allPath = path.join(DATA_DIR, 'all.json');
  if (fs.existsSync(allPath)) {
    const data = JSON.parse(fs.readFileSync(allPath, 'utf-8'));
    totalEntries = data.length;
  }

  console.log(`\n✓ Site ready in site/`);
  console.log(`  ${totalEntries} reference objects`);
  console.log(`  Open site/index.html in a browser or deploy to GitHub Pages`);
}

main();

/**
 * countries-scraper.js — Scrapes REST Countries API for country areas.
 *
 * Source: https://restcountries.com/v3.1/all
 * Provides: area (km²) for all ~250 countries/territories
 */

import fetch from 'node-fetch';
import BaseScraper from './base-scraper.js';

export default class CountriesScraper extends BaseScraper {
  get name() {
    return 'CountriesScraper';
  }

  async scrape() {
    this.log('Fetching REST Countries API...');

    const resp = await fetch('https://restcountries.com/v3.1/all?fields=name,area,flags,region,subregion', {
      headers: { 'User-Agent': 'HowBigIsBot/1.0 (educational project)' },
    });

    if (!resp.ok) {
      this.log(`⚠ HTTP ${resp.status}`);

      return [];
    }

    const countries = await resp.json();
    const entries = [];

    for (const c of countries) {
      const name = c.name?.common;
      const area = c.area; // in km²

      if (!name || !area || area <= 0)
        continue;

      entries.push({
        name: name,
        value: area,
        unit: 'km²',
        valueSI: area * 1e6,  // convert km² to m²
        type: 'area',
        category: 'country',
        description: `Total area of ${name}` + (c.region ? ` (${c.region})` : ''),
        source: 'restcountries-api',
        sourceUrl: `https://restcountries.com/v3.1/name/${encodeURIComponent(name)}`,
      });
    }

    // Sort by area descending
    entries.sort((a, b) => b.valueSI - a.valueSI);

    this.log(`Total: ${entries.length} countries`);

    return entries;
  }
}

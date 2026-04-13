/**
 * solar-system-scraper.js — Scrapes solar system body data from
 * https://api.le-systeme-solaire.net/rest/bodies
 *
 * Produces entries for:
 *   - mass   (kg)
 *   - radius (km → m)
 *   - volume (km³ → m³)
 */

import 'dotenv/config';
import fetch from 'node-fetch';
import BaseScraper from './base-scraper.js';
import { toSI } from './units.js';

const API_URL = 'https://api.le-systeme-solaire.net/rest/bodies';

export default class SolarSystemScraper extends BaseScraper {
  get name() {
    return 'SolarSystemScraper';
  }

  async scrape() {
    const apiKey = process.env.LE_SYSTEME_SOLAIRE_API_KEY;

    if (!apiKey)
      throw new Error('LE_SYSTEME_SOLAIRE_API_KEY is not set in .env');

    this.log(`Fetching ${API_URL} ...`);

    const resp = await fetch(API_URL, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'User-Agent': 'HowBigIsBot/1.0 (educational project)',
      },
    });

    if (!resp.ok) {
      throw new Error(`API responded ${resp.status} ${resp.statusText}`);
    }

    const { bodies } = await resp.json();

    if (!Array.isArray(bodies))
      throw new Error('Unexpected response shape — no "bodies" array');

    this.log(`  → ${bodies.length} bodies received`);

    const entries = [];

    for (const body of bodies) {
      const label = (body.englishName || body.name || body.id) + ` (${body.bodyType})`;

      if (!label)
        continue;

      const category = 'celestial';
      const sourceUrl = body.rel ?? `${API_URL}/${body.id}`;

      // Mass
      if (body.mass?.massValue && body.mass?.massExponent != null) {
        const valueSI = body.mass.massValue * Math.pow(10, body.mass.massExponent); // kg

        if (valueSI > 0) {
          entries.push({
            name: label,
            value: valueSI,
            unit: 'kg',
            valueSI,
            type: 'weight',
            category,
            description: `Mass of ${label}`,
            source: 'le-systeme-solaire',
            sourceUrl,
          });
        }
      }

      // Mean radius
      if (body.meanRadius > 0) {
        const siResult = toSI(body.meanRadius, 'km');

        entries.push({
          name: label,
          value: body.meanRadius,
          unit: 'km',
          valueSI: siResult ? siResult.valueSI : body.meanRadius * 1e3,
          type: 'length',
          category,
          description: `Mean radius of ${label}`,
          source: 'le-systeme-solaire',
          sourceUrl,
        });
      }

      // Volume
      if (body.vol?.volValue && body.vol?.volExponent != null) {
        const valueKm3 = body.vol.volValue * Math.pow(10, body.vol.volExponent); // km³
        const valueSI = valueKm3 * 1e9; // km³ → m³

        if (valueSI > 0) {
          entries.push({
            name: label,
            value: valueKm3,
            unit: 'km³',
            valueSI,
            type: 'volume',
            category,
            description: `Volume of ${label}`,
            source: 'le-systeme-solaire',
            sourceUrl,
          });
        }
      }
    }

    this.log(`  → ${entries.length} entries produced`);

    return entries;
  }
}

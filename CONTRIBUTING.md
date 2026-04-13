# Contributing

## How to add a new scraper

1. Create a file in `scrapers/`, e.g. `scrapers/my-scraper.js`
2. Extend `BaseScraper` and implement `scrape()`:

```js
import BaseScraper from './base-scraper.js';
import { toSI } from './units.js';

export default class MyScraper extends BaseScraper {
  get name() { return 'MyScraper'; }

  async scrape() {
    // Fetch your data source...
    const results = [];

    results.push({
      name: 'Boeing 747',
      value: 70.7,
      unit: 'm',
      valueSI: 70.7,          // or use toSI(70.7, 'm').valueSI
      type: 'length',
      category: 'aircraft',
      description: 'Length of a Boeing 747-8',
      source: 'my-source',
      sourceUrl: 'https://example.com',
    });

    return results;
  }
}
```

1. Register it in `scrape.js`:

```js
import MyScraper from './scrapers/my-scraper.js';

const SCRAPERS = {
  wikipedia: WikipediaScraper,
  countries: CountriesScraper,
  mine: MyScraper,  // ← add here
};
```

1. Run: `node scrape.js --source=mine`

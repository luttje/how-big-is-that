/**
 * base-scraper.js — The contract every scraper must follow.
 *
 * To add a new scraper:
 *   1. Create a file in scrapers/ that default-exports a class extending BaseScraper
 *   2. Implement the `scrape()` method — it must return an array of entries
 *   3. Register it in scrape.js
 *
 * Each entry in the returned array must match this shape:
 *
 *   {
 *     name:        String,   // Human-readable label, e.g. "Blue whale"
 *     value:       Number,   // Numeric value in the *original* unit
 *     unit:        String,   // Original unit string, e.g. "kg", "km"
 *     valueSI:     Number,   // Value normalised to SI base unit
 *     type:        String,   // "weight" | "length" | "area" | "volume"
 *     category:    String,   // Free-text grouping, e.g. "animal", "building"
 *     description: String,   // Longer description / context
 *     source:      String,   // Source identifier, e.g. "wikipedia-orders-of-magnitude"
 *     sourceUrl:   String,   // Direct URL to the source page
 *   }
 */

export default class BaseScraper {
  /** Human-readable name for logging */
  get name() {
    return this.constructor.name;
  }

  /**
   * Run the scraper.
   * @returns {Promise<Array<Object>>} Array of normalised entries
   */
  async scrape() {
    throw new Error(`${this.name}.scrape() not implemented`);
  }

  /** Utility: pause between requests to be polite */
  sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  /** Utility: log with scraper name prefix */
  log(...args) {
    console.log(`[${this.name}]`, ...args);
  }
}

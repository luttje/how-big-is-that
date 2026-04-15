# How Big Is That?

A modular data scraping toolkit + static website that converts any measurement into relatable real-world comparisons.

Enter **85 kg** → _"That's about the weight of an Adult human."_  
Enter **330 m** → _"That's about the size of the Eiffel Tower."_

## Quick start

```bash
npm install

# Run all scrapers and build the site:
npm run all

# Or run individually:
npm run scrape              # all scrapers
npm run scrape:wikipedia    # only Wikipedia
npm run scrape:countries    # only REST Countries
npm run scrape:solar-system # only Solar System
npm run build # build site from data/
```

> [!NOTE]
> When making a pull request we will run the scrapers and build the site, so you don't need to worry about that.
> If you do want to run the scrapers locally, please make sure to use the same Node version as specified in `.nvmrc` to avoid any unwanted differences in the generated data files.

## Data sources

| Source | Entries | What | License |
| -------- | --------- | ------ | ------- |
| [Wikipedia Orders of Magnitude](https://en.wikipedia.org/wiki/Category:Orders_of_magnitude) | ~718 | Mass, length, area, volume across all scales | [CC BY-SA](https://en.wikipedia.org/wiki/Wikipedia:Text_of_the_Creative_Commons_Attribution-ShareAlike_4.0_International_License) |
| [REST Countries API](https://restcountries.com) | ~250 | Country areas (km²) | [MPL 2.0](https://gitlab.com/restcountries/restcountries/-/blob/0dc4768f1372e334e7d304f13f79362bd624b5e7/LICENSE) |
| [Solar System OpenData](https://api.le-systeme-solaire.net) | ~674 | Celestial body mass, radius, volume | [CC BY-NC-SA 4.0](https://www.le-systeme-solaire.net/legal.html#corps) |

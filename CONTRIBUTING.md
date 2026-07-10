# Contributing

## Derived Scraper

This repo is a **derived scraper** — created from the [EPAM template](https://github.com/sebiboga/epam-systems-international-srl-nodejs-scraper) by the autonomous derivation algorithm.

### Company Identity

All company-specific configuration lives in `config/company.json`:

```json
{
  "cif": "43319098",
  "legalName": "METRO DIGITAL ROMANIA S.R.L.",
  "brand": "METRO DIGITAL",
  "website": "https://metro.digital",
  "careerUrl": "https://careers.metro.digital/jobs",
  "apiBase": "https://careers.metro.digital",
  "defaultLocation": "București",
  "scraperFile": "https://raw.githubusercontent.com/sebiboga/metro-digital-romania-srl-nodejs-scraper/main/.github/workflows/job-seeker-ro-spider.yml"
}
```

### Scraping Method

This scraper uses **HTML/cheerio** to parse the Metro Digital careers page at `https://careers.metro.digital/jobs`. The site is powered by SmartRecruiters Attrax and renders job listings server-side.

Key parsing logic in `index.js`:
- `fetchJobsPage(pageNum)` — fetches HTML page
- `parseHtmlJobs(html)` — parses `.attrax-vacancy-tile` elements
- `mapToJobModel()` — standardized job format
- `transformJobsForSOLR()` — Solr-compatible transformation

### Testing

```bash
npm test               # All tests
npm run test:unit      # Unit tests
npm run test:integration  # Live ANAF + SOLR
npm run test:e2e       # Real HTML scrape
npm run test:consistency  # Repo configuration
```

### Derived from EPAM Template

This scraper was derived using the algorithm documented in [ALGORITHM.md](https://github.com/sebiboga/AI-Factory-job-seeker-ro-spider/blob/main/ALGORITHM.md).

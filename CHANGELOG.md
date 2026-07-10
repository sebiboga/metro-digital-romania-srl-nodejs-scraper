# Changelog

## [1.0.0] - 2026-07-10

### Added
- Initial derivation from EPAM template (`sebiboga/epam-systems-international-srl-nodejs-scraper`)
- HTML/cheerio scraper for `https://careers.metro.digital/jobs`
- Attrax vacancy tile parsing (title, URL, city, work model, department)
- Pagination support for multi-page job listings
- ANOFM API integration for CIF-filtered job scraping
- Company validation via ANAF (CIF: 43319098)
- SOLR integration for job and company core storage
- GitHub Actions CI/CD (daily scrape + automation testing)
- GitHub Pages with live job board
- Full test suite (unit, integration, e2e, consistency)

### Company
- **Legal name:** METRO DIGITAL ROMANIA S.R.L.
- **CIF:** 43319098
- **Brand:** METRO DIGITAL
- **Career URL:** https://careers.metro.digital/jobs
- **Scraping method:** HTML/cheerio (Attrax/SmartRecruiters SSR)

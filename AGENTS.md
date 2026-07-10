# AGENTS.md — Rules for AI agents

## Project
METRO DIGITAL ROMANIA S.R.L. scraper for peviitor.ro (Node.js, ESM, Jest)

**Derived from:** `sebiboga/epam-systems-international-srl-nodejs-scraper`

## 🌱 This Repo Is a Derived Scraper
This repo was derived from the EPAM template. All company-specific identity lives in `config/company.json`.

When making changes:
- **All company-specific identity lives in `config/company.json`** (CIF, brand, legalName, URLs). Read from `config/company.js` in Node code, or via `jq` in workflows. Never hardcode in source files.
- **Only the HTML parsing logic in `index.js`** (`fetchJobsPage`, `parseHtmlJobs`) is Metro Digital-specific. The output shape (`mapToJobModel`, `transformJobsForSOLR`) must stay uniform.

## Critical Rules

### 0. Background tasks — always pass `--repo` explicitly to `gh`
**Always specify the repo explicitly:**
```bash
gh run view <RUN_ID> --repo sebiboga/metro-digital-romania-srl-nodejs-scraper --json status -q .status
```

### 1. Temporary Files
All temporary/scratch files MUST go in `tmp/` inside the project root.

### 2. Issues & GitHub
- Create a GitHub issue before implementing any change
- Commit messages must reference the issue they close
- Never commit credentials

### 3. Environment Variables
- `SOLR_AUTH` must be set in `.env.local` for SOLR tests (format: `user:password`)
- Consistency tests also need `GITHUB_REPOSITORY` and `GITHUB_TOKEN`

### 4. Testing
```bash
npm test               # All tests
npm run test:unit      # Unit tests (no env vars needed)
npm run test:integration  # Integration tests (ANAF public API, SOLR conditional)
npm run test:e2e       # E2E tests (real HTML scrape, SOLR conditional)
npm run test:consistency  # Repo configuration tests
```

### 5. ESM + Jest
- Use `jest.unstable_mockModule` (NOT `jest.mock`) for mocking ESM modules
- Run with `--experimental-vm-modules` flag
- SOLR tests use conditional `itIfSolr` helper

### 6. Module Structure
- `config/company.json` + `config/company.js` — single source of truth for company identity
- `src/anaf.js` — core ANAF library
- `src/markdown-generator.js` — generates `docs/jobs.md`
- `company.js` — company validation (ANAF + Peviitor + SOLR)
- `solr.js` — SOLR operations
- `index.js` — main scraper orchestrator

### 7. Scraping Method
- **HTML / cheerio** — fetches `https://careers.metro.digital/jobs` pages
- Parses `.attrax-vacancy-tile` elements for job data
- Extracts: title, URL, city, work model, department
- Handles pagination (multiple pages)

### 8. Auto-Heal Issues
When the `Automation Tests` workflow fails, a GitHub Issue is auto-created with label `auto-heal`.

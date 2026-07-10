# job_seeker_ro_spider

**job_seeker_ro_spider** — scraper pentru job-urile METRO DIGITAL ROMANIA S.R.L. din România.

Extrage anunțurile de pe [Metro Digital Careers](https://careers.metro.digital/jobs) și le publică în [peviitor.ro](https://peviitor.ro) prin API-ul SOLR.

## Identificare

Toate request-urile HTTP folosesc User-Agent-ul:

```
job_seeker_ro_spider
```

## Ce face

1. **Validează compania** — interoghează API-ul public ANAF ([demoanaf.ro](https://demoanaf.ro)) după CIF-ul 43319098 și verifică:
   - Denumirea oficială: METRO DIGITAL ROMANIA S.R.L.
   - Status: activ/inactiv/radiat
   - Adresa completă din registrul comerțului
2. **Cross-validează cu Peviitor** — verifică existența companiei în API-ul Peviitor
3. **Scrape-uiește job-urile** — extrage lista completă de job-uri de pe pagina HTML Metro Digital Careers (Attrax/SmartRecruiters SSR), cu paginare automată
4. **Transformă datele** — normalizează locațiile (doar orașe românești), tag-urile (lowercase), workmode-ul (remote/on-site/hybrid)
5. **Stochează în SOLR** — upsert în `job` core (job-urile) și `company` core (datele companiei cu adresa completă)
6. **Generează docs/jobs.md** — fișier markdown cu informații companie + toate job-urile curente, publicat pe GitHub Pages

## Structură proiect

```
├── config/company.json         # Sursa unică de adevăr (CIF, brand, URL-uri)
├── config/company.js           # Loader ESM pentru config/company.json
├── index.js                    # Orchestrator principal (HTML/cheerio scraping)
├── company.js                  # Validare companie (ANAF + Peviitor + SOLR)
├── src/anaf.js                 # Modul ANAF API
├── src/markdown-generator.js   # Generează docs/jobs.md
├── solr.js                     # Operații SOLR
├── company.json                # Cache ANAF (committed, TTL 7 zile)
├── ROBOTS.md                   # Analiză robots.txt
├── tests/
│   ├── unit/                   # Teste unitare
│   ├── integration/            # Teste de integrare (ANAF + SOLR live)
│   ├── e2e/                    # Teste end-to-end (HTML scrape real)
│   └── consistency/            # Teste config repo
└── .github/workflows/
    ├── job-seeker-ro-spider.yml     # Rulează zilnic la 6 AM UTC
    └── automation-testing.yml       # Teste automate la fiecare push/PR
```

## API-uri folosite

| API | URL | Autentificare |
|---|---|---|
| Metro Digital Careers | `https://careers.metro.digital/jobs` | Public (HTML) |
| ANAF (demoanaf) | `https://demoanaf.ro/api/...` | Public |
| ANOFM | `https://mediere.anofm.ro/api/entity/vw_public_job_posting` | Public |
| Peviitor | `https://api.peviitor.ro/v1/company/` | Public |
| SOLR (job core) | `https://solr.peviitor.ro/solr/job` | `SOLR_AUTH` |
| SOLR (company core) | `https://solr.peviitor.ro/solr/company` | `SOLR_AUTH` |

## Robots.txt

Metro Digital Careers [robots.txt](https://careers.metro.digital/robots.txt) permite `/jobs` (fără query params). Scraper-ul accesează doar `/jobs` direct cu rate limiting (1s delay între pagini).

Pentru analiza completă, vezi [ROBOTS.md](../ROBOTS.md).

## Testare

```bash
# Toate testele
npm test

# Doar unitare
npm run test:unit

# Doar integrare (ANAF live, SOLR conditional)
npm run test:integration

# Doar E2E (HTML scrape real + ANAF + SOLR)
npm run test:e2e
```

Testele SOLR folosesc `itIfSolr` — se auto-skip dacă variabila `SOLR_AUTH` nu e setată.

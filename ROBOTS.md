# Robots.txt Analysis — Metro Digital Careers

Source: https://careers.metro.digital/robots.txt

## Rules

```
User-agent: *
Allow: /
Disallow: /jobs?*
Disallow: /admin*
Disallow: /workflow*
Disallow: /snippettest*
Disallow: /register*
Disallow: /recruitersearch*
Disallow: /newprofile*
Disallow: /login*
Disallow: /editprofile*
Disallow: /candidateupdatecredentials*
Disallow: /candidateresetpassword*
Disallow: /candidatehome*
```

## Interpretation

| Path | Accessible? | Content |
|---|---|---|
| `/` (landing) | Yes | Main pages |
| `/jobs` (no query params) | Yes | Job listings page (SSR, Attrax) |
| `/jobs?*` (with query params) | No | Filtered/searched job pages |
| `/job/*` | Yes (not disallowed) | Individual job pages |
| `/admin*` | No | Admin pages |
| `/workflow*` | No | Workflow pages |
| `/login*` | No | Login pages |

## Recommendation

robots.txt is not legally binding but represents the site owner's intent.

- `/jobs` (without query params) is **allowed** — this is where we scrape from
- `/jobs?*` (with query params) is disallowed — we never use query params
- Scraper makes 1 request per page with 1s delay — polite behavior
- No API endpoints needed — pure HTML scraping

**Conclusion**: Minimal risk. We access only the allowed `/jobs` page, use standard User-Agent, and rate-limit requests.

import { jest } from '@jest/globals';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const HAS_SOLR = !!process.env.SOLR_AUTH;

function itIfSolr(name, fn, timeout) {
  if (HAS_SOLR) {
    return it(name, fn, timeout);
  }
  return it.skip(`${name} (skipped: SOLR_AUTH not set)`, fn, timeout);
}

let HAS_ANAF = false;

async function checkAnafAvailability() {
  try {
    const res = await fetch('https://demoanaf.ro/api/search?q=test', {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    });
    return res.ok;
  } catch {
    return false;
  }
}

function itIfAnaf(name, fn, timeout) {
  if (HAS_ANAF) {
    return it(name, fn, timeout);
  }
  return it.skip(`${name} (skipped: ANAF API unavailable)`, fn, timeout);
}

beforeAll(async () => {
  HAS_ANAF = await checkAnafAvailability();
  if (HAS_SOLR) {
    process.env.SOLR_AUTH = process.env.SOLR_AUTH;
  }
});

const TEST_CIF = '43319098';
const CAREER_URL = 'https://careers.metro.digital/jobs';
const ROMANIAN_CITIES = ['București', 'Cluj-Napoca', 'Bucharest', 'Timișoara'];

describe('E2E: Full Scraping Pipeline', () => {

  describe('Metro Digital Careers — Real HTML Fetch', () => {
    let html;

    beforeAll(async () => {
      const res = await fetch(CAREER_URL, {
        headers: {
          'User-Agent': 'job_seeker_ro_spider',
          'Accept': 'text/html'
        }
      });
      html = await res.text();
    }, 30000);

    it('should respond with valid HTML from Metro Digital Careers', () => {
      expect(html).toBeDefined();
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('attrax-vacancy-tile');
    }, 10000);

    it('should have job listings in the HTML', () => {
      expect(html).toContain('Result(s)');
      expect(html).toContain('attrax-vacancy-tile__title');
    });

    it('should have Romania jobs in the HTML', () => {
      expect(html).toContain('București');
    });
  });

  describe('Parse + Transform Pipeline', () => {
    let index;
    let html;

    beforeAll(async () => {
      index = await import('../../index.js');
      const res = await fetch(CAREER_URL, {
        headers: {
          'User-Agent': 'job_seeker_ro_spider',
          'Accept': 'text/html'
        }
      });
      html = await res.text();
    }, 30000);

    it('should parse real Metro Digital HTML into standardized format', () => {
      const result = index.parseHtmlJobs(html);

      expect(result).toHaveProperty('jobs');
      expect(result).toHaveProperty('total');
      expect(result.jobs.length).toBeGreaterThan(0);

      const parsed = result.jobs[0];
      expect(parsed).toHaveProperty('url');
      expect(parsed.url).toMatch(/^https:\/\/careers\.metro\.digital\//);
      expect(parsed).toHaveProperty('title');
      expect(parsed).toHaveProperty('workmode');
      expect(['remote', 'on-site', 'hybrid']).toContain(parsed.workmode);
      expect(parsed).toHaveProperty('location');
      expect(Array.isArray(parsed.location)).toBe(true);
    }, 15000);

    it('should map parsed jobs to job model', () => {
      const parsed = index.parseHtmlJobs(html);
      const model = index.mapToJobModel(parsed.jobs[0], TEST_CIF);

      expect(model).toHaveProperty('url');
      expect(model).toHaveProperty('title');
      expect(model).toHaveProperty('company');
      expect(model).toHaveProperty('cif', TEST_CIF);
      expect(model).toHaveProperty('status', 'scraped');
      expect(model).toHaveProperty('date');
      expect(model.url).toMatch(/^https:\/\/careers\.metro\.digital\//);
    });

    it('should transform jobs and filter to Romanian locations', () => {
      const parsed = index.parseHtmlJobs(html);
      const jobs = parsed.jobs.map(j => index.mapToJobModel(j, TEST_CIF));

      const payload = {
        source: 'careers.metro.digital',
        company: 'METRO DIGITAL ROMANIA S.R.L.',
        cif: TEST_CIF,
        jobs
      };

      const transformed = index.transformJobsForSOLR(payload);

      expect(transformed.company).toBe('METRO DIGITAL ROMANIA S.R.L.');
      expect(transformed.jobs.length).toBe(jobs.length);

      for (const job of transformed.jobs) {
        expect(job).toHaveProperty('location');
        expect(Array.isArray(job.location)).toBe(true);
        expect(job.location.length).toBeGreaterThan(0);
        expect(job.workmode).toMatch(/^(remote|on-site|hybrid)$/);
      }
    });

    it('should produce valid job URLs that are accessible', async () => {
      const parsed = index.parseHtmlJobs(html);

      for (const job of parsed.jobs.slice(0, 2)) {
        const res = await fetch(job.url, {
          method: 'HEAD',
          headers: { 'User-Agent': 'job_seeker_ro_spider' }
        });
        expect(res.ok).toBe(true);
      }
    }, 30000);
  });

  describe('Company Validation Path', () => {
    let anaf;
    let company;

    beforeAll(async () => {
      anaf = await import('../../src/anaf.js');
      company = await import('../../company.js');
    });

    itIfAnaf('should find METRO DIGITAL in ANAF and validate status', async () => {
      const results = await anaf.searchCompany('Metro Digital Romania');

      const metro = results.find(c =>
        c.name.toUpperCase().includes('METRO DIGITAL')
      );
      expect(metro).toBeDefined();

      const anafData = await anaf.getCompanyFromANAF(metro.cui.toString());
      expect(anafData).toBeDefined();
      expect(anafData.name).toBe('METRO DIGITAL ROMANIA S.R.L.');
    }, 30000);

    itIfSolr('should run full validation and report active status', async () => {
      const result = await company.validateAndGetCompany();

      expect(result.status).toBe('active');
      expect(result.company).toBe('METRO DIGITAL ROMANIA S.R.L.');
      expect(result.cif).toBe(TEST_CIF);
    }, 30000);
  });

  describe('SOLR Data Verification', () => {
    let solr;

    beforeAll(async () => {
      solr = await import('../../solr.js');
    });

    itIfSolr('should have METRO DIGITAL jobs in SOLR with correct company name', async () => {
      const result = await solr.querySOLR(TEST_CIF);

      if (result.numFound === 0) {
        console.log('No METRO DIGITAL jobs in Solr — skipping SOLR data verification');
        return;
      }

      for (const job of result.docs) {
        expect(job.company).toBe('METRO DIGITAL ROMANIA S.R.L.');
        expect(job.cif).toBe(TEST_CIF);
      }
    }, 15000);

    itIfSolr('should have METRO DIGITAL company core entry with required fields', async () => {
      const result = await solr.queryCompanySOLR(`id:${TEST_CIF}`);

      if (result.numFound === 0) {
        console.log('No METRO DIGITAL company in Solr yet — skipping');
        return;
      }

      const metro = result.docs[0];
      expect(metro.company).toBe('METRO DIGITAL ROMANIA S.R.L.');
      expect(metro.status).toBe('activ');
    }, 15000);
  });
});

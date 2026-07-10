import { jest } from '@jest/globals';

describe('index.js Component Tests', () => {
  let index;

  beforeAll(async () => {
    index = await import('../../index.js');
  });

  describe('transformJobsForSOLR', () => {
    it('should filter locations to only Romanian cities', () => {
      const payload = {
        jobs: [
          { url: 'https://test.com/1', title: 'Job 1', location: ['România'] },
          { url: 'https://test.com/2', title: 'Job 2', location: ['Bucharest'] },
          { url: 'https://test.com/3', title: 'Job 3', location: ['Germany'] },
          { url: 'https://test.com/4', title: 'Job 4', location: ['Cluj-Napoca'] },
          { url: 'https://test.com/5', title: 'Job 5', location: [] }
        ]
      };

      const result = index.transformJobsForSOLR(payload);

      expect(result.jobs[0].location).toEqual(['România']);
      expect(result.jobs[1].location).toEqual(['Bucharest']);
      expect(result.jobs[2].location).toEqual(['România']);
      expect(result.jobs[3].location).toEqual(['Cluj-Napoca']);
      expect(result.jobs[4].location).toEqual(['România']);
    });

    it('should keep company uppercase', () => {
      const payload = {
        source: 'careers.metro.digital',
        company: 'metro digital romania s.r.l.',
        cif: '43319098',
        jobs: [
          { url: 'https://test.com/1', title: 'Job 1', company: 'metro digital', cif: '43319098' }
        ]
      };

      const result = index.transformJobsForSOLR(payload);

      expect(result.company).toBe('METRO DIGITAL ROMANIA S.R.L.');
    });

    it('should normalize workmode values', () => {
      const payload = {
        jobs: [
          { url: 'https://test.com/1', title: 'Job 1', workmode: 'Remote' },
          { url: 'https://test.com/2', title: 'Job 2', workmode: 'ON-SITE' },
          { url: 'https://test.com/3', title: 'Job 3', workmode: 'Hybrid' },
          { url: 'https://test.com/4', title: 'Job 4', workmode: 'hybrid' }
        ]
      };

      const result = index.transformJobsForSOLR(payload);

      expect(result.jobs[0].workmode).toBe('remote');
      expect(result.jobs[1].workmode).toBe('on-site');
      expect(result.jobs[2].workmode).toBe('hybrid');
      expect(result.jobs[3].workmode).toBe('hybrid');
    });

    it('should handle empty jobs array', () => {
      const result = index.transformJobsForSOLR({ jobs: [] });
      expect(result.jobs).toEqual([]);
    });
  });

  describe('mapToJobModel', () => {
    it('should map raw job to job model format', () => {
      const rawJob = {
        url: 'https://careers.metro.digital/job/test-job-jid-123',
        title: 'Senior Developer',
        location: ['București'],
        tags: ['javascript', 'react'],
        workmode: 'hybrid'
      };

      const COMPANY_NAME = 'METRO DIGITAL ROMANIA S.R.L.';
      const COMPANY_CIF = '43319098';

      const result = index.mapToJobModel(rawJob, COMPANY_CIF, COMPANY_NAME);

      expect(result.url).toBe(rawJob.url);
      expect(result.title).toBe(rawJob.title);
      expect(result.company).toBe(COMPANY_NAME);
      expect(result.cif).toBe(COMPANY_CIF);
      expect(result.location).toEqual(rawJob.location);
      expect(result.tags).toEqual(rawJob.tags);
      expect(result.workmode).toBe(rawJob.workmode);
      expect(result.status).toBe('scraped');
      expect(result.date).toBeDefined();
    });

    it('should remove undefined fields', () => {
      const rawJob = {
        url: 'https://test.com/1',
        title: 'Job 1'
      };

      const result = index.mapToJobModel(rawJob, '43319098');

      expect(result.location).toBeUndefined();
      expect(result.tags).toBeUndefined();
      expect(result.workmode).toBeUndefined();
    });

    it('should handle missing title', () => {
      const rawJob = { url: 'https://test.com/1' };

      const result = index.mapToJobModel(rawJob, '43319098');

      expect(result.title).toBeUndefined();
      expect(result.url).toBe('https://test.com/1');
    });
  });

  describe('parseHtmlJobs', () => {
    it('should parse Metro Digital HTML with vacancy tiles', () => {
      const html = `
        <html>
        <body>
          <div>17 Result(s)</div>
          <div class="attrax-vacancy-tile">
            <a href="/job/platform-architect-procurement-in-soseaua-pipera-43-bucuresti-jid-29901" class="attrax-vacancy-tile__title">Platform Architect - Procurement</a>
            <div class="attrax-vacancy-tile__item">
              <span class="attrax-vacancy-tile__item-label">Location</span>
              <span class="attrax-vacancy-tile__item-value">București</span>
            </div>
            <div class="attrax-vacancy-tile__item">
              <span class="attrax-vacancy-tile__item-label">Work Model</span>
              <span class="attrax-vacancy-tile__item-value">Hybrid</span>
            </div>
          </div>
          <div class="attrax-vacancy-tile">
            <a href="/job/cloud-engineer-in-soseaua-pipera-43-bucuresti-jid-28656" class="attrax-vacancy-tile__title">Cloud Engineer</a>
            <div class="attrax-vacancy-tile__item">
              <span class="attrax-vacancy-tile__item-label">Location</span>
              <span class="attrax-vacancy-tile__item-value">București</span>
            </div>
            <div class="attrax-vacancy-tile__item">
              <span class="attrax-vacancy-tile__item-label">Work Model</span>
              <span class="attrax-vacancy-tile__item-value">Hybrid</span>
            </div>
          </div>
        </body>
        </html>
      `;

      const result = index.parseHtmlJobs(html);

      expect(result.jobs).toHaveLength(2);
      expect(result.total).toBe(17);
      expect(result.jobs[0].title).toBe('Platform Architect - Procurement');
      expect(result.jobs[0].url).toBe('https://careers.digital/job/platform-architect-procurement-in-soseaua-pipera-43-bucuresti-jid-29901');
      expect(result.jobs[0].city).toBe('București');
      expect(result.jobs[0].workmode).toBe('hybrid');
    });

    it('should handle empty HTML', () => {
      const result = index.parseHtmlJobs('<html><body></body></html>');
      expect(result.jobs).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should filter only Romanian city jobs', () => {
      const html = `
        <html><body>
          <div>5 Result(s)</div>
          <div class="attrax-vacancy-tile">
            <a href="/job/test-jid-1" class="attrax-vacancy-tile__title">Job Bucharest</a>
            <div class="attrax-vacancy-tile__item">
              <span class="attrax-vacancy-tile__item-label">Location</span>
              <span class="attrax-vacancy-tile__item-value">București</span>
            </div>
          </div>
          <div class="attrax-vacancy-tile">
            <a href="/job/test-jid-2" class="attrax-vacancy-tile__title">Job Germany</a>
            <div class="attrax-vacancy-tile__item">
              <span class="attrax-vacancy-tile__item-label">Location</span>
              <span class="attrax-vacancy-tile__item-value">Düsseldorf</span>
            </div>
          </div>
        </body></html>
      `;

      const result = index.parseHtmlJobs(html);
      expect(result.jobs).toHaveLength(2);
      expect(result.jobs[0].city).toBe('București');
      expect(result.jobs[1].city).toBe('Düsseldorf');
    });
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { familySearchDefaults } from '../domain/search-config.js';
import { parseDealerSitemapUrls } from './dealer-sitemap-source.js';

describe('parseDealerSitemapUrls', () => {
  it('keeps only search-relevant inventory pages when searches are supplied', () => {
    const urls = parseDealerSitemapUrls(
      `
        <urlset>
          <url><loc>https://www.i90motorstx.com/</loc></url>
          <url><loc>https://www.i90motorstx.com/toyota-sienna-for-sale-c648287</loc></url>
          <url><loc>https://www.i90motorstx.com/ford-f-150-for-sale-c137280</loc></url>
          <url><loc>https://www.i90motorstx.com/honda-cr-v-for-sale-c462624</loc></url>
        </urlset>
      `,
      [
        {
          id: familySearchDefaults.id,
          userId: familySearchDefaults.userId,
          name: familySearchDefaults.name,
          enabled: true,
          config: familySearchDefaults,
          createdAt: '2026-08-29T00:00:00.000Z',
          updatedAt: '2026-08-29T00:00:00.000Z'
        }
      ]
    );

    assert.deepEqual(urls, [
      'https://www.i90motorstx.com/toyota-sienna-for-sale-c648287',
      'https://www.i90motorstx.com/honda-cr-v-for-sale-c462624'
    ]);
  });

  it('falls back to broad inventory category pages without search context', () => {
    const urls = parseDealerSitemapUrls(`
      <urlset>
        <url><loc>https://www.i90motorstx.com/about</loc></url>
        <url><loc>https://www.i90motorstx.com/suvs-for-sale</loc></url>
      </urlset>
    `);

    assert.deepEqual(urls, ['https://www.i90motorstx.com/suvs-for-sale']);
  });
});

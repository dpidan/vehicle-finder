import type { CollectionContext, ListingCandidate, ListingSource, SavedSearch, SellerSeed } from '../domain/entities.js';
import { parseCarsforsaleInventory } from './carsforsale-source.js';

const source = { name: 'dealer sitemap', access: 'structured-web' } as const;

export const dealerSitemapSource: ListingSource = {
  name: source.name,
  access: source.access,
  collect: async (context) => {
    const seeds = context.sellerSeeds?.filter((seed) => seed.inventoryUrl) ?? [];
    const pages = (await Promise.all(seeds.map((seed) => collectRelevantPages(seed, context)))).flat();
    return pages.flatMap(({ seed, url, html }) =>
      parseCarsforsaleInventory(html, { ...seed, inventoryUrl: url }, context.collectedAt).map((candidate) => {
        const evidence = candidate.evidence?.map((item) => ({
          ...item,
          label: `${seed.name} sitemap-discovered vehicle listing`
        }));

        return {
          ...candidate,
          source,
          ...(evidence ? { evidence } : {})
        };
      })
    );
  }
};

export function parseDealerSitemapUrls(xml: string, searches: SavedSearch[] = []): string[] {
  const urls = Array.from(xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi), (match) => decodeXml(match[1] ?? ''));
  const desiredSlugs = desiredMakeModelSlugs(searches);

  return unique(
    urls.filter((url) => {
      const pathname = pathnameFor(url);
      return desiredSlugs.length === 0
        ? pathname.endsWith('-for-sale')
        : desiredSlugs.some((slug) => pathname.includes(`${slug}-for-sale-`));
    })
  );
}

async function collectRelevantPages(
  seed: SellerSeed,
  context: CollectionContext
): Promise<Array<{ seed: SellerSeed; url: string; html: string }>> {
  const sitemapUrl = seed.inventoryUrl;

  if (!sitemapUrl) {
    return [];
  }

  const sitemap = await fetchText(sitemapUrl);
  const pageUrls = parseDealerSitemapUrls(sitemap, context.searches);
  const boundedUrls = pageUrls.slice(0, context.searches?.length ? 24 : 8);

  return Promise.all(
    boundedUrls.map(async (url) => ({
      seed,
      url,
      html: await fetchText(url)
    }))
  );
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { 'user-agent': 'vehicle-finder/0.1 low-frequency family vehicle search' }
  });

  if (!response.ok) {
    console.warn(`Skipping ${url}: HTTP ${response.status}`);
    return '';
  }

  return response.text();
}

function desiredMakeModelSlugs(searches: SavedSearch[] = []): string[] {
  const pairs = searches.flatMap((search) => [
    ...search.config.preferences.modelPreferences.map((preference) => [preference.make, preference.model] as const),
    ...((search.config.filters.makes ?? []).flatMap((make) =>
      (search.config.filters.models ?? []).map((model) => [make, model] as const)
    ) ?? [])
  ]);

  return unique(pairs.map(([make, model]) => slugify(`${make} ${model}`)).filter(Boolean));
}

function pathnameFor(url: string): string {
  try {
    return new URL(url).pathname.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function decodeXml(value: string): string {
  return value.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

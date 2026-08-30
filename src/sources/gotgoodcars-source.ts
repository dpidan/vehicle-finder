import type { CollectionContext, ListingCandidate, ListingSource, SellerSeed } from '../domain/entities.js';

const source = { name: 'GotGoodCars dealer inventory', access: 'structured-web' } as const;
const maxPages = 5;

export const gotGoodCarsSource: ListingSource = {
  name: source.name,
  access: source.access,
  collect: async (context) => {
    const seeds = context.sellerSeeds?.filter((seed) => seed.inventoryUrl) ?? [];
    const pages = await Promise.all(seeds.map((seed) => fetchInventoryPages(seed)));

    return pages.flatMap(({ seed, htmlPages }) => {
      const seenUrls = new Set<string>();

      return htmlPages
        .flatMap((html) => parseGotGoodCarsInventory(html, seed, context.collectedAt))
        .filter((listing) => {
          if (seenUrls.has(listing.url)) {
            return false;
          }
          seenUrls.add(listing.url);
          return true;
        });
    });
  },
  enrichDetail: async (candidate) => {
    const html = await fetchInventoryHtml(candidate.url);
    return enrichGotGoodCarsListing(candidate, html);
  }
};

export function parseGotGoodCarsInventory(
  html: string,
  seed: SellerSeed,
  capturedAt: CollectionContext['collectedAt']
): ListingCandidate[] {
  return parseListingCards(html, seed.inventoryUrl ?? seed.websiteUrl ?? '').flatMap((card, index) => {
    const title = cleanText(stripTags(card.html.match(/<h4 class="vehicle-title">([\s\S]*?)<\/h4>/)?.[1] ?? ''));
    const stockId = cleanText(stripTags(card.html.match(/<p class="vehicle-stock">[\s\S]*?<span>Stock ID\s*:<\/span>[\s\S]*?<span>([\s\S]*?)<\/span>/)?.[1] ?? ''));
    const price = parsePrice(card.html);
    const mileage = parseMileage(card.html);
    const exteriorColor = parseExteriorColor(card.html);
    const photoUrls = parsePhotoUrls(card.html);

    if (!title || !card.url || (price === 0 && mileage === 0)) {
      return [];
    }

    return [
      {
        source,
        sourceListingId: stockId || `${seed.name}:${card.url}`,
        url: card.url,
        title,
        status: 'active',
        vehicle: parseVehicleTitle(title),
        seller: seed,
        ...(price > 0 ? { price: { amount: price, currency: 'USD' } } : {}),
        ...(mileage > 0 ? { mileage } : {}),
        ...(exteriorColor ? { exteriorColor } : {}),
        ...(photoUrls.length > 0 ? { photoUrls } : {}),
        ...(seed.location ? { location: seed.location } : {}),
        capturedAt,
        evidence: [{ label: `${seed.name} GotGoodCars listing`, url: card.url, confidence: 0.65 }]
      }
    ];
  });
}

export function maxVisibleGotGoodCarsPage(html: string): number {
  const pages = Array.from(html.matchAll(/[?&]paged=(\d+)/g), (match) => Number(match[1] ?? 0));
  return Math.max(1, ...pages.filter((page) => Number.isFinite(page)));
}

export function enrichGotGoodCarsListing(candidate: ListingCandidate, html: string): ListingCandidate {
  const facts = parseDetailFacts(html);
  const title = cleanText(stripTags(html.match(/<h1 class="title-vhs">([\s\S]*?)<\/h1>/)?.[1] ?? '')) ?? candidate.title;
  const price = parsePrice(html);
  const mileage = parseInteger(facts.Mileage?.match(/\d[\d,]*/)?.[0]);
  const vin = cleanText(html.match(/\bdata-vin="([^"]+)"/)?.[1] ?? facts.VIN)?.replace(/\s+/g, '').toUpperCase();
  const exteriorColor = facts['Exterior Color']?.split(' - ')[0]?.trim();

  return {
    ...candidate,
    title,
    vehicle: {
      ...candidate.vehicle,
      ...parseVehicleTitle(title),
      ...(vin ? { vin } : {})
    },
    ...(price > 0 ? { price: { amount: price, currency: 'USD' } } : {}),
    ...(mileage > 0 ? { mileage } : {}),
    ...(exteriorColor ? { exteriorColor } : {})
  };
}

async function fetchInventoryPages(seed: SellerSeed): Promise<{ seed: SellerSeed; htmlPages: string[] }> {
  const firstPageUrl = seed.inventoryUrl ?? '';
  const firstPage = await fetchInventoryHtml(firstPageUrl);
  const pageCount = Math.min(maxVisibleGotGoodCarsPage(firstPage), maxPages);
  const rest = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, index) => fetchInventoryHtml(urlWithPage(firstPageUrl, index + 2)))
  );

  return { seed, htmlPages: [firstPage, ...rest] };
}

async function fetchInventoryHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { 'user-agent': 'vehicle-finder/0.1 low-frequency family vehicle search' }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  return response.text();
}

function parseListingCards(html: string, baseUrl: string): Array<{ html: string; url: string }> {
  return Array.from(
    html.matchAll(/<div class="listing-vehicles-card[\s\S]*?(?=<div class="listing-vehicles-card|<div class="pagination"|$)/g)
  ).flatMap((match) => {
    const card = match[0] ?? '';
    const href =
      card.match(/<a\b[^>]*class="[^"]*\blisting-button\b[^"]*"[^>]*href="([^"]+)"/)?.[1] ??
      card.match(/<a\b[^>]*href="([^"]+)"[^>]*>\s*<div class="title-holder">/)?.[1];
    const url = href ? resolveUrl(decodeHtml(href), baseUrl) : '';

    return url ? [{ html: card, url }] : [];
  });
}

function parseVehicleTitle(title: string): ListingCandidate['vehicle'] {
  const [, year, make, ...modelParts] = title.match(/^((?:19|20)\d{2})\s+(\S+)\s+(.+)$/) ?? [];

  return {
    ...(year ? { year: Number(year) } : {}),
    ...(make ? { make } : {}),
    ...(modelParts.length > 0 ? { model: modelParts.join(' ') } : {})
  };
}

function parsePrice(html: string): number {
  return parseInteger(
    stripTags(html.match(/<p class="display-price">([\s\S]*?)<\/p>/)?.[1] ?? '').match(/\$(\d[\d,]+)/)?.[1] ??
      stripTags(html.match(/<div class="price-holder">([\s\S]*?)<\/div>/)?.[1] ?? '').match(/\$(\d[\d,]+)/)?.[1]
  );
}

function parseMileage(html: string): number {
  return parseInteger(stripTags(html).match(/\b(\d[\d,]+)\s*Mi\b/i)?.[1]);
}

function parseExteriorColor(html: string): string | undefined {
  return cleanText(stripTags(html.match(/inventory-factory-color-icon\.svg[\s\S]*?<span>([\s\S]*?)<\/span>/)?.[1] ?? ''))?.split(' - ')[0];
}

function parsePhotoUrls(html: string): string[] {
  return Array.from(html.matchAll(/<img\b[^>]*class="[^"]*\binventory-image\b[^"]*"[^>]*src="([^"]+)"/g), (match) =>
    decodeHtml(match[1] ?? '')
  ).filter(Boolean);
}

function parseDetailFacts(html: string): Record<string, string> {
  const facts: Record<string, string> = {};

  for (const match of html.matchAll(
    /<p class="title-data-vhs-info">([\s\S]*?)<\/p>\s*<p class="subtitle-data-vhs-info">([\s\S]*?)<\/p>/g
  )) {
    const label = cleanText(stripTags(match[1] ?? ''));
    const value = cleanText(stripTags(match[2] ?? ''));

    if (label && value) {
      facts[label] = value;
    }
  }

  return facts;
}

function urlWithPage(url: string, page: number): string {
  const parsed = new URL(url);
  parsed.searchParams.set('paged', String(page));
  return parsed.toString();
}

function resolveUrl(href: string, baseUrl: string): string {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return baseUrl || href;
  }
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, ' ');
}

function cleanText(value: string | undefined): string | undefined {
  return decodeHtml(value ?? '').replace(/\s+/g, ' ').trim() || undefined;
}

function decodeHtml(value: string): string {
  return value.replace(/&#8211;/g, '-').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'");
}

function parseInteger(value: string | undefined): number {
  return Number(value?.replace(/\D/g, '') ?? 0);
}

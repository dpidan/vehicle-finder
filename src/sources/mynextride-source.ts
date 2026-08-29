import type { CollectionContext, ListingCandidate, ListingSource, SellerSeed } from '../domain/entities.js';

const source = { name: 'MyNextRide dealer inventory', access: 'structured-web' } as const;
const maxPages = 8;

const multiWordMakes = ['Land Rover', 'Mercedes-Benz'];

export const mynextrideSource: ListingSource = {
  name: source.name,
  access: source.access,
  collect: async (context) => {
    const seeds = context.sellerSeeds?.filter((seed) => seed.inventoryUrl) ?? [];
    const pages = await Promise.all(seeds.map((seed) => fetchInventoryPages(seed)));

    return pages.flatMap(({ seed, htmlPages }) => {
      const seenUrls = new Set<string>();

      return htmlPages
        .flatMap((html) => parseMynextrideInventory(html, seed, context.collectedAt))
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
    return enrichMynextrideListing(candidate, html);
  }
};

export function parseMynextrideInventory(
  html: string,
  seed: SellerSeed,
  capturedAt: CollectionContext['collectedAt']
): ListingCandidate[] {
  return parseListingCards(html).flatMap((card) => {
    const title = cleanText(card.title);
    const vehicle = parseVehicleFacts(title);
    const sourceListingId = card.url.match(/\/cars-for-sale\/(\d+)\//)?.[1] ?? `${seed.name}:${card.url}`;
    const price = parsePrice(card.html);
    const mileage = parseMileage(card.html);

    if (!title || !card.url || !vehicle.year || !vehicle.make || !vehicle.model || (price === 0 && mileage === 0)) {
      return [];
    }

    return [
      {
        source,
        sourceListingId,
        url: card.url,
        title,
        status: 'active',
        vehicle,
        seller: seed,
        ...(price > 0 ? { price: { amount: price, currency: 'USD' } } : {}),
        ...(mileage > 0 ? { mileage } : {}),
        ...(seed.location ? { location: seed.location } : {}),
        capturedAt,
        evidence: [{ label: `${seed.name} MyNextRide listing`, url: card.url, confidence: 0.55 }]
      }
    ];
  });
}

export function maxVisibleMynextridePage(html: string): number {
  const pages = Array.from(html.matchAll(/wire:click="gotoPage\((\d+)\)"/g), (match) => Number(match[1] ?? 0));
  return Math.max(1, ...pages.filter((page) => Number.isFinite(page)));
}

export function enrichMynextrideListing(candidate: ListingCandidate, html: string): ListingCandidate {
  const facts = parseDetailFacts(html);
  const title = cleanText(stripTags(html.match(/<h3 class="vdp-title">([\s\S]*?)<\/h3>/)?.[1] ?? '')) ?? candidate.title;
  const year = parseInteger(facts.Year);
  const mileage = parseInteger(facts.Mileage);
  const price = parsePrice(html);
  const vin = facts.VIN?.replace(/\s+/g, '').toUpperCase();
  const exteriorColor = cleanText(facts['Exterior Color']);

  return {
    ...candidate,
    title,
    vehicle: {
      ...candidate.vehicle,
      ...(year > 0 ? { year } : {}),
      ...(facts.Make ? { make: facts.Make } : {}),
      ...(facts.Model ? { model: facts.Model } : {}),
      ...(facts.Trim ? { trim: facts.Trim } : {}),
      ...(vin ? { vin } : {})
    },
    ...(price > 0 ? { price: { amount: price, currency: 'USD' } } : {}),
    ...(mileage > 0 ? { mileage } : {}),
    ...(exteriorColor ? { exteriorColor } : {}),
    rawDescription: compactText(facts)
  };
}

async function fetchInventoryPages(seed: SellerSeed): Promise<{ seed: SellerSeed; htmlPages: string[] }> {
  const firstPageUrl = seed.inventoryUrl ?? '';
  const firstPage = await fetchInventoryHtml(firstPageUrl);
  const pageCount = Math.min(maxVisibleMynextridePage(firstPage), maxPages);

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

function parseListingCards(html: string): Array<{ html: string; title: string; url: string }> {
  const matches = Array.from(
    html.matchAll(
      /<div class="card search-car-card[\s\S]*?onclick="linkClick\('([^']+)'[\s\S]*?<p class="p-3 m-0 font-weight-bold title-md">([\s\S]*?)<\/p>[\s\S]*?(?=<div class="m-3"\s+wire:key=|<ul class="pagination|$)/g
    )
  );

  return matches.map((match) => ({
    html: match[0] ?? '',
    url: decodeHtml(match[1] ?? ''),
    title: decodeHtml(stripTags(match[2] ?? ''))
  }));
}

function parseVehicleFacts(title: string | undefined): ListingCandidate['vehicle'] {
  const parts = cleanText(title)?.split(' ') ?? [];
  const year = Number(parts[0] ?? 0);

  if (!year) {
    return {};
  }

  const makeWordCount = multiWordMakes.find((make) => parts.slice(1, 1 + make.split(' ').length).join(' ') === make)?.split(' ')
    .length ?? 1;
  const make = parts.slice(1, 1 + makeWordCount).join(' ');
  const model = parts[1 + makeWordCount];
  const trim = parts.slice(2 + makeWordCount).join(' ');

  return {
    year,
    ...(make ? { make } : {}),
    ...(model ? { model } : {}),
    ...(trim ? { trim } : {})
  };
}

function urlWithPage(url: string, page: number): string {
  const parsed = new URL(url);
  parsed.searchParams.set('page', String(page));
  return parsed.toString();
}

function parsePrice(html: string): number {
  return parseInteger(stripTags(html).match(/\$(\d[\d,]+)/)?.[1]);
}

function parseMileage(html: string): number {
  return parseInteger(stripTags(html).match(/\b(\d[\d,]+)\s*mi\b/i)?.[1]);
}

function parseDetailFacts(html: string): Record<string, string> {
  const facts: Record<string, string> = {};
  const rows = html.matchAll(
    /<p class="py-1 px-2 font-weight-bold m-1 d-flex align-items-center">[\s\S]*?<span class="pr-4 mr-auto">([\s\S]*?)<\/span>[\s\S]*?<span class="text-right text-white font-weight-normal">([\s\S]*?)<\/span>[\s\S]*?<\/p>/g
  );

  for (const row of rows) {
    const label = cleanText(stripTags(row[1] ?? ''));
    const value = cleanText(stripTags(row[2] ?? ''));

    if (label && value) {
      facts[label] = value;
    }
  }

  return facts;
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, ' ');
}

function cleanText(value: string | undefined): string | undefined {
  return value?.replace(/\s+/g, ' ').trim();
}

function compactText(facts: Record<string, string>): string {
  return Object.entries(facts)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');
}

function decodeHtml(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#x2F;/g, '/')
    .replace(/&#x27;/g, "'");
}

function parseInteger(value: string | undefined): number {
  return Number(value?.replace(/\D/g, '') ?? 0);
}

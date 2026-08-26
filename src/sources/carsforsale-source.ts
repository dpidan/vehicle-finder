import type { CollectionContext, ListingCandidate, ListingSource, SellerSeed } from '../domain/entities.js';

const source = { name: 'carsforsale seeded dealer', access: 'structured-web' } as const;

export const carsforsaleSource: ListingSource = {
  name: source.name,
  access: source.access,
  collect: async (context) => {
    const seeds = context.sellerSeeds?.filter((seed) => seed.inventoryUrl) ?? [];
    const pages = await Promise.all(
      seeds.map(async (seed) => ({
        seed,
        html: await fetchInventoryHtml(seed)
      }))
    );

    return pages.flatMap(({ seed, html }) => parseCarsforsaleInventory(html, seed, context.collectedAt));
  }
};

export function parseCarsforsaleInventory(
  html: string,
  seed: SellerSeed,
  capturedAt: CollectionContext['collectedAt']
): ListingCandidate[] {
  const text = htmlToText(html);
  const matches = [
    ...text.matchAll(
      /(?:^|\n)(?<title>(?:19|20)\d{2}\s+[A-Z][^\n]+)\n(?:[^\n]+\n){0,3}?Price\n\$(?<price>[\d,]+)\nMileage\n(?<mileage>[\d,]+)/g
    )
  ];

  return matches.map((match) => {
    const title = match.groups?.title?.trim() ?? 'Untitled listing';
    const vehicle = parseVehicleTitle(title);
    const url = seed.inventoryUrl ?? seed.websiteUrl ?? '';

    return {
      source,
      sourceListingId: `${seed.name}:${title}`,
      url,
      title,
      status: 'active',
      vehicle,
      seller: seed,
      price: { amount: parseInteger(match.groups?.price), currency: 'USD' },
      mileage: parseInteger(match.groups?.mileage),
      ...(seed.location ? { location: seed.location } : {}),
      capturedAt,
      evidence: [{ label: `${seed.name} inventory page`, url, confidence: 0.6 }]
    };
  });
}

async function fetchInventoryHtml(seed: SellerSeed): Promise<string> {
  if (!seed.inventoryUrl) {
    return '';
  }

  const response = await fetch(seed.inventoryUrl, {
    headers: { 'user-agent': 'vehicle-finder/0.1 low-frequency family vehicle search' }
  });

  if (!response.ok) {
    console.warn(`Skipping ${seed.inventoryUrl}: HTTP ${response.status}`);
    return '';
  }

  return response.text();
}

function htmlToText(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:a|div|h\d|li|p|span)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function parseVehicleTitle(title: string): ListingCandidate['vehicle'] {
  const [, year, make, ...modelParts] = title.match(/^((?:19|20)\d{2})\s+(\S+)\s+(.+)$/) ?? [];

  return {
    ...(year ? { year: Number(year) } : {}),
    ...(make ? { make } : {}),
    ...(modelParts.length > 0 ? { model: modelParts.join(' ') } : {})
  };
}

function parseInteger(value: string | undefined): number {
  return Number(value?.replace(/\D/g, '') ?? 0);
}

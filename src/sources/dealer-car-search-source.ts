import type { CollectionContext, ListingCandidate, ListingSource, SellerSeed } from '../domain/entities.js';

const source = { name: 'dealer car search seeded dealer', access: 'structured-web' } as const;

export const dealerCarSearchSource: ListingSource = {
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

    return pages.flatMap(({ seed, html }) => parseDealerCarSearchInventory(html, seed, context.collectedAt));
  }
};

export function parseDealerCarSearchInventory(
  html: string,
  seed: SellerSeed,
  capturedAt: CollectionContext['collectedAt']
): ListingCandidate[] {
  const fallbackUrl = seed.inventoryUrl ?? seed.websiteUrl ?? '';
  const cards = html.match(/<div class="[^"]*\bi17r-vehicle\b[\s\S]*?(?=<div class="[^"]*\bi17r-vehicle\b|$)/g) ?? [html];

  return cards.flatMap((card, index) => {
    const titleLink = parseTitleLink(card, fallbackUrl);
    const lines = htmlToText(card).split('\n');
    const title = titleLink?.title ?? lines.map(parseTitleLine).find(Boolean);

    if (!title) {
      return [];
    }

    const detail = lines.join('\n');
    const price = parsePrice(detail);
    const mileage = parseMileage(detail);
    const exteriorColor = parseExteriorColor(detail);
    const vin = parseVin(detail);
    const vehicle = parseVehicleTitle(title);
    const url = titleLink?.url ?? fallbackUrl;

    return {
      source,
      sourceListingId: vin ?? `${seed.name}:${index}:${title}`,
      url,
      title,
      status: 'active',
      vehicle: { ...vehicle, ...(vin ? { vin } : {}) },
      seller: seed,
      ...(price > 0 ? { price: { amount: price, currency: 'USD' } } : {}),
      ...(mileage > 0 ? { mileage } : {}),
      ...(exteriorColor ? { exteriorColor } : {}),
      ...(seed.location ? { location: seed.location } : {}),
      capturedAt,
      evidence: [{ label: `${seed.name} vehicle listing`, url, confidence: titleLink ? 0.75 : 0.65 }]
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
    .replace(/<\/(?:a|div|h\d|li|p|span|td|th)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function parseTitleLine(line: string): string | undefined {
  const title = line.match(/\b((?:19|20)\d{2}\s+[A-Z][^\n$|]+?)\s*$/)?.[1]?.trim();
  return title && !title.includes(' for Sale') ? title : undefined;
}

function parseTitleLink(html: string, baseUrl: string): { title: string; url: string } | undefined {
  const [, href, label] = html.match(/<a\b[^>]*href="([^"]+)"[^>]*>\s*((?:19|20)\d{2}[\s\S]*?)<\/a>/i) ?? [];
  const title = htmlToText(label ?? '').split('\n').map(parseTitleLine).find(Boolean);

  return href && title ? { title, url: new URL(href, baseUrl).toString() } : undefined;
}

function parseVehicleTitle(title: string): ListingCandidate['vehicle'] {
  const [, year, make, ...modelParts] = title.match(/^((?:19|20)\d{2})\s+(\S+)\s+(.+)$/) ?? [];

  return {
    ...(year ? { year: Number(year) } : {}),
    ...(make ? { make } : {}),
    ...(modelParts.length > 0 ? { model: modelParts.join(' ') } : {})
  };
}

function parsePrice(text: string): number {
  return parseInteger(text.match(/(?:Price\n)?\$(\d[\d,]+)/)?.[1]);
}

function parseMileage(text: string): number {
  return parseInteger(
    text.match(/Mileage:?\s*\n?(\d[\d,]+)/i)?.[1] ?? text.match(/\b(\d[\d,]+)\s*(?:mi\.?|miles)\b/i)?.[1]
  );
}

function parseVin(text: string): string | undefined {
  return text.match(/\b([A-HJ-NPR-Z0-9]{17})\b/i)?.[1]?.toUpperCase();
}

function parseExteriorColor(text: string): string | undefined {
  const color =
    text.match(/Exterior Color:?\s*\n?([^\n]+)/i)?.[1]?.trim() ?? text.match(/(?:^|\n)Color:?\s*\n?([^\n]+)/i)?.[1]?.trim();
  return color && /^(black|blue|brown|gold|gray|green|orange|red|silver|tan|white)$/i.test(color) ? titleCase(color) : undefined;
}

function titleCase(value: string): string {
  return value.slice(0, 1).toUpperCase() + value.slice(1).toLowerCase();
}

function parseInteger(value: string | undefined): number {
  return Number(value?.replace(/\D/g, '') ?? 0);
}

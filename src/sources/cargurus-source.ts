import type { CollectionContext, ListingCandidate, ListingSource, SellerSeed } from '../domain/entities.js';

const source = { name: 'cargurus seeded dealer profile', access: 'structured-web' } as const;

export const cargurusSource: ListingSource = {
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

    return pages.flatMap(({ seed, html }) => parseCargurusInventory(html, seed, context.collectedAt));
  }
};

export function parseCargurusInventory(
  html: string,
  seed: SellerSeed,
  capturedAt: CollectionContext['collectedAt']
): ListingCandidate[] {
  const fallbackUrl = seed.inventoryUrl ?? seed.websiteUrl ?? '';
  const listingIds = Array.from(html.matchAll(/listingId"?\s*:\s*(\d+)/g)).map((match) => match[1]);
  const lines = htmlToText(html).split('\n');

  return lines
    .flatMap((line, index) => (line.startsWith('Year: ') ? [{ line, index }] : []))
    .flatMap(({ line, index }, listingIndex) => {
      const vehicle = parseVehicleFacts(line);
      const vin = parseField(line, 'VIN')?.toUpperCase();
      const detail = lines.slice(index, index + 18).join('\n');
      const title = lines.slice(index + 1, index + 6).map(parseTitleLine).find(Boolean);
      const price = parsePrice(detail);
      const mileage = parseMileage(parseField(line, 'Mileage') ?? detail);
      const exteriorColor = parseExteriorColor(parseField(line, 'Exterior color'));
      const url = listingIds[listingIndex] ? `${fallbackUrl}?listingId=${listingIds[listingIndex]}` : fallbackUrl;

      if (!title || !vehicle.year || !vehicle.make || !vehicle.model || (!vin && price === 0 && mileage === 0)) {
        return [];
      }

      return [
        {
          source,
          sourceListingId: vin ?? `${seed.name}:${url}`,
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
          evidence: [{ label: `${seed.name} CarGurus listing`, url, confidence: 0.65 }]
        }
      ];
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
    .replace(/&#x27;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function parseVehicleFacts(line: string): ListingCandidate['vehicle'] {
  const year = Number(parseField(line, 'Year') ?? 0);
  const make = parseField(line, 'Make');
  const model = parseField(line, 'Model');

  return {
    ...(year > 0 ? { year } : {}),
    ...(make ? { make } : {}),
    ...(model ? { model } : {})
  };
}

function parseField(line: string, label: string): string | undefined {
  const labels = [
    'Year',
    'Make',
    'Model',
    'Body type',
    'Doors',
    'Drivetrain',
    'Engine',
    'Exterior color',
    'Combined gas mileage',
    'Fuel type',
    'Interior color',
    'Transmission',
    'Mileage',
    'Stock #',
    'VIN'
  ];
  const start = line.indexOf(`${label}:`);

  if (start === -1) {
    return undefined;
  }

  const valueStart = start + label.length + 1;
  const valueEnd =
    labels
      .filter((nextLabel) => nextLabel !== label)
      .map((nextLabel) => line.indexOf(` ${nextLabel}:`, valueStart))
      .filter((index) => index !== -1)
      .sort((a, b) => a - b)[0] ?? line.length;

  return line.slice(valueStart, valueEnd).trim();
}

function parseTitleLine(line: string): string | undefined {
  const title = line.match(/^((?:19|20)\d{2}\s+\S.+)$/)?.[1]?.trim();
  return title && !title.includes(' for Sale') ? title : undefined;
}

function parsePrice(text: string): number {
  return parseInteger(text.match(/\$(\d[\d,]+)/)?.[1]);
}

function parseMileage(text: string): number {
  return parseInteger(text.match(/\b(\d[\d,]+)\s*(?:mi\.?|miles)?\b/i)?.[1]);
}

function parseExteriorColor(value: string | undefined): string | undefined {
  return value?.split('(')[0]?.trim();
}

function parseInteger(value: string | undefined): number {
  return Number(value?.replace(/\D/g, '') ?? 0);
}

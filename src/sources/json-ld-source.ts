import type { CollectionContext, ListingCandidate, ListingSource, SellerSeed } from '../domain/entities.js';

const source = { name: 'generic JSON-LD vehicle page', access: 'structured-web' } as const;

interface VehicleJsonLd {
  '@type'?: string | string[];
  '@id'?: string;
  url?: string;
  name?: string;
  brand?: string | { name?: string };
  model?: string | { name?: string };
  vehicleModelDate?: string | number;
  vehicleIdentificationNumber?: string;
  mileageFromOdometer?: number | string | { value?: number | string };
  color?: string;
  image?: string | string[];
  offers?: {
    price?: number | string;
    priceCurrency?: string;
    availability?: string;
    url?: string;
  };
  sku?: string;
}

export const jsonLdSource: ListingSource = {
  name: source.name,
  access: source.access,
  collect: async (context) => {
    const seeds = context.sellerSeeds?.filter((seed) => seed.inventoryUrl) ?? [];
    const pages = await Promise.all(
      seeds.map(async (seed) => ({
        seed,
        html: await fetchHtml(seed)
      }))
    );

    return pages.flatMap(({ seed, html }) => parseJsonLdInventory(html, seed, context.collectedAt));
  }
};

export function parseJsonLdInventory(
  html: string,
  seed: SellerSeed,
  capturedAt: CollectionContext['collectedAt']
): ListingCandidate[] {
  const fallbackUrl = seed.inventoryUrl ?? seed.websiteUrl ?? '';

  return parseVehicleJsonLd(html).flatMap((vehicle) => {
    const title = cleanText(vehicle.name);
    const facts = parseVehicleFacts(vehicle);
    const vin = cleanText(vehicle.vehicleIdentificationNumber)?.toUpperCase();
    const price = parseInteger(vehicle.offers?.price);
    const mileage = parseInteger(
      typeof vehicle.mileageFromOdometer === 'object' ? vehicle.mileageFromOdometer.value : vehicle.mileageFromOdometer
    );
    const url = resolveUrl(vehicle.url ?? vehicle.offers?.url ?? fallbackUrl, fallbackUrl);
    const imageUrls = Array.isArray(vehicle.image) ? vehicle.image : vehicle.image ? [vehicle.image] : [];

    if (!title || !facts.year || !facts.make || !facts.model || (!vin && price === 0 && mileage === 0)) {
      return [];
    }

    return [
      {
        source,
        sourceListingId: vin ?? vehicle.sku ?? vehicle['@id'] ?? `${seed.name}:${url}`,
        url,
        title,
        status: vehicle.offers?.availability?.includes('InStock') ? 'active' : 'unknown',
        vehicle: { ...facts, ...(vin ? { vin } : {}) },
        seller: seed,
        ...(price > 0 ? { price: { amount: price, currency: 'USD' } } : {}),
        ...(mileage > 0 ? { mileage } : {}),
        ...(vehicle.color ? { exteriorColor: vehicle.color } : {}),
        ...(imageUrls.length ? { photoUrls: imageUrls.map((imageUrl) => resolveUrl(imageUrl, fallbackUrl)) } : {}),
        ...(seed.location ? { location: seed.location } : {}),
        capturedAt,
        evidence: [{ label: `${seed.name} JSON-LD vehicle data`, url, confidence: 0.6 }]
      }
    ];
  });
}

async function fetchHtml(seed: SellerSeed): Promise<string> {
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

function parseVehicleJsonLd(html: string): VehicleJsonLd[] {
  return Array.from(html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi))
    .flatMap((match) => flattenJsonLd(parseJson(decodeHtml(match[1] ?? ''))))
    .filter(isVehicleLike);
}

function flattenJsonLd(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value.flatMap(flattenJsonLd);
  }

  if (typeof value !== 'object' || value === null) {
    return [];
  }

  const record = value as { '@graph'?: unknown; itemListElement?: unknown };
  return [value, ...flattenJsonLd(record['@graph']), ...flattenJsonLd(record.itemListElement)];
}

function isVehicleLike(value: unknown): value is VehicleJsonLd {
  if (typeof value !== 'object' || value === null || !('@type' in value)) {
    return false;
  }

  const type = (value as VehicleJsonLd)['@type'];
  const types = Array.isArray(type) ? type : [type];
  return types.some((item) => item === 'Vehicle' || item === 'Car' || item === 'Product');
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function parseVehicleFacts(vehicle: VehicleJsonLd): ListingCandidate['vehicle'] {
  const title = cleanText(vehicle.name);
  const year = Number(vehicle.vehicleModelDate ?? title?.match(/\b((?:19|20)\d{2})\b/)?.[1] ?? 0);
  const make = typeof vehicle.brand === 'string' ? vehicle.brand : vehicle.brand?.name;
  const model = typeof vehicle.model === 'string' ? vehicle.model : vehicle.model?.name;

  return {
    ...(year > 0 ? { year } : {}),
    ...(make ? { make } : {}),
    ...(model ? { model } : {})
  };
}

function resolveUrl(url: string, baseUrl: string): string {
  try {
    return new URL(url, baseUrl).toString();
  } catch {
    return url || baseUrl;
  }
}

function cleanText(value: string | undefined): string | undefined {
  return value?.replace(/\s+/g, ' ').trim();
}

function decodeHtml(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#x2F;/g, '/')
    .replace(/&#x27;/g, "'");
}

function parseInteger(value: number | string | undefined): number {
  return typeof value === 'number' ? value : Number(value?.replace(/\D/g, '') ?? 0);
}

import type { CollectionContext, ListingCandidate, ListingSource, SellerSeed } from '../domain/entities.js';

const source = { name: 'iSeeCars dealer profile', access: 'structured-web' } as const;

interface IseecarsVehicleJsonLd {
  '@type'?: string;
  vehicleIdentificationNumber?: string;
  name?: string;
  brand?: string | { name?: string };
  model?: string;
  mileageFromOdometer?: number | string;
  color?: string;
  bodyType?: string;
  offers?: {
    price?: number | string;
    priceCurrency?: string;
    availability?: string;
  };
  sku?: string;
}

export const iseecarsSource: ListingSource = {
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

    return pages.flatMap(({ seed, html }) => parseIseecarsInventory(html, seed, context.collectedAt));
  }
};

export function parseIseecarsInventory(
  html: string,
  seed: SellerSeed,
  capturedAt: CollectionContext['collectedAt']
): ListingCandidate[] {
  const vehicleData = parseVehicleJsonLd(html);
  const listingUrls = parseListingUrls(html);
  const fallbackUrl = seed.inventoryUrl ?? seed.websiteUrl ?? '';

  return vehicleData.flatMap((vehicle, index) => {
    const title = cleanText(vehicle.name);
    const facts = parseVehicleFacts(vehicle);
    const vin = vehicle.vehicleIdentificationNumber?.toUpperCase();
    const price = parseInteger(vehicle.offers?.price);
    const mileage = parseInteger(vehicle.mileageFromOdometer);
    const url = listingUrls[index] ?? fallbackUrl;

    if (!title || !url || !facts.year || !facts.make || !facts.model || (!vin && price === 0 && mileage === 0)) {
      return [];
    }

    return [
      {
        source,
        sourceListingId: vin ?? vehicle.sku ?? `${seed.name}:${url}`,
        url,
        title,
        status: vehicle.offers?.availability?.includes('InStock') ? 'active' : 'unknown',
        vehicle: { ...facts, ...(vin ? { vin } : {}) },
        seller: seed,
        ...(price > 0 ? { price: { amount: price, currency: 'USD' } } : {}),
        ...(mileage > 0 ? { mileage } : {}),
        ...(vehicle.color ? { exteriorColor: vehicle.color } : {}),
        ...(seed.location ? { location: seed.location } : {}),
        capturedAt,
        evidence: [{ label: `${seed.name} iSeeCars listing`, url, confidence: 0.6 }]
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
    throw new Error(`HTTP ${response.status} for ${seed.inventoryUrl}`);
  }

  return response.text();
}

function parseVehicleJsonLd(html: string): IseecarsVehicleJsonLd[] {
  return Array.from(html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g))
    .map((match) => parseJsonLd(match[1] ?? ''))
    .flat()
    .filter(isVehicleJsonLd);
}

function parseJsonLd(raw: string): unknown[] {
  try {
    const parsed = JSON.parse(decodeHtml(raw));
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
}

function isVehicleJsonLd(item: unknown): item is IseecarsVehicleJsonLd {
  return typeof item === 'object' && item !== null && '@type' in item && item['@type'] === 'Vehicle';
}

function parseListingUrls(html: string): string[] {
  return Array.from(html.matchAll(/data-listing-url="([^"]+)"/g), (match) => decodeHtml(match[1] ?? '')).filter(Boolean);
}

function parseVehicleFacts(vehicle: IseecarsVehicleJsonLd): ListingCandidate['vehicle'] {
  const title = cleanText(vehicle.name);
  const year = Number(title?.match(/\b((?:19|20)\d{2})\b/)?.[1] ?? 0);
  const make = typeof vehicle.brand === 'string' ? vehicle.brand : vehicle.brand?.name;

  return {
    ...(year > 0 ? { year } : {}),
    ...(make ? { make } : {}),
    ...(vehicle.model ? { model: vehicle.model } : {})
  };
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

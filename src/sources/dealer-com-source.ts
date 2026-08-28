import type { CollectionContext, ListingCandidate, ListingSource, SellerSeed } from '../domain/entities.js';

const source = { name: 'dealer.com seeded dealer', access: 'structured-web' } as const;

interface DealerComVehicle {
  uuid?: string;
  vin?: string;
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  title?: string[];
  link?: string;
  status?: string;
  pricing?: { retailPrice?: string };
  trackingPricing?: { internetPrice?: string; salePrice?: string; msrp?: string };
  trackingAttributes?: Array<{ name?: string; value?: string; normalizedValue?: string }>;
}

export const dealerComSource: ListingSource = {
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

    return pages.flatMap(({ seed, html }) => parseDealerComInventory(html, seed, context.collectedAt));
  }
};

export function parseDealerComInventory(
  html: string,
  seed: SellerSeed,
  capturedAt: CollectionContext['collectedAt']
): ListingCandidate[] {
  const vehicles = extractVehicles(html);
  const baseUrl = seed.websiteUrl ?? originFromUrl(seed.inventoryUrl);

  return vehicles.flatMap((vehicle) => {
    const title = parseTitle(vehicle);
    const url = absoluteUrl(vehicle.link, baseUrl) ?? seed.inventoryUrl ?? seed.websiteUrl;
    const price = parsePrice(vehicle.trackingPricing?.salePrice ?? vehicle.trackingPricing?.internetPrice ?? vehicle.pricing?.retailPrice);
    const mileage = parseInteger(attribute(vehicle, 'odometer')?.value);
    const exteriorColor = attribute(vehicle, 'exteriorColor')?.value ?? attribute(vehicle, 'normalExteriorColor')?.normalizedValue;
    const vin = vehicle.vin?.toUpperCase();

    if (!title || !url || !vehicle.year || !vehicle.make || !vehicle.model || (!vin && price === 0 && mileage === 0)) {
      return [];
    }

    return [
      {
        source,
        sourceListingId: vin ?? vehicle.uuid ?? `${seed.name}:${url}`,
        url,
        title,
        status: vehicle.status === 'live' ? 'active' : 'unknown',
        vehicle: {
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
          ...(vehicle.trim ? { trim: vehicle.trim } : {}),
          ...(vin ? { vin } : {})
        },
        seller: seed,
        ...(price > 0 ? { price: { amount: price, currency: 'USD' } } : {}),
        ...(mileage > 0 ? { mileage } : {}),
        ...(exteriorColor ? { exteriorColor } : {}),
        ...(seed.location ? { location: seed.location } : {}),
        capturedAt,
        evidence: [{ label: `${seed.name} Dealer.com listing`, url, confidence: 0.75 }]
      }
    ];
  });
}

function extractVehicles(html: string): DealerComVehicle[] {
  const match = html.match(/DDC\.WS\.state\['ws-inv-data'\]\['inventory-data-bus\d+'\] = (\{[\s\S]*?\});/);

  if (!match?.[1]) {
    return [];
  }

  return (JSON.parse(match[1]) as { WIS?: { inventory?: DealerComVehicle[] } }).WIS?.inventory ?? [];
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

function parseTitle(vehicle: DealerComVehicle): string | undefined {
  return vehicle.title?.join(' ').replace(/\s+/g, ' ').trim();
}

function attribute(vehicle: DealerComVehicle, name: string) {
  return vehicle.trackingAttributes?.find((item) => item.name === name);
}

function absoluteUrl(path: string | undefined, baseUrl: string | undefined): string | undefined {
  if (!path || !baseUrl) {
    return undefined;
  }

  return new URL(path, baseUrl).toString();
}

function originFromUrl(url: string | undefined): string | undefined {
  return url ? new URL(url).origin : undefined;
}

function parsePrice(value: string | undefined): number {
  return parseInteger(value);
}

function parseInteger(value: string | undefined): number {
  return Number(value?.replace(/\D/g, '') ?? 0);
}

import type { CollectionContext, ListingCandidate, ListingSource, SellerSeed } from '../domain/entities.js';

const source = { name: 'dealer.com seeded dealer', access: 'structured-web' } as const;
const maxPagesPerSeed = 25;

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

interface DealerComPageInfo {
  totalCount?: number;
  pageSize?: number;
  pageStart?: number;
}

interface DealerComInventoryData {
  WIS?: {
    pageInfo?: DealerComPageInfo;
    inventory?: DealerComVehicle[];
  };
}

export interface DealerComInventoryAnalysis {
  parsedListingCount: number;
  reportedTotalCount?: number;
  pagesParsed: number;
  complete: boolean;
}

export const dealerComSource: ListingSource = {
  name: source.name,
  access: source.access,
  collect: async (context) => {
    const seeds = context.sellerSeeds?.filter((seed) => seed.inventoryUrl) ?? [];
    const pages = await Promise.all(seeds.map((seed) => collectSeedPages(seed)));

    return pages.flatMap(({ seed, html }) => parseDealerComInventory(html, seed, context.collectedAt));
  }
};

async function collectSeedPages(seed: SellerSeed): Promise<{ seed: SellerSeed; html: string }> {
  const firstPage = await fetchInventoryHtml(seed);
  const firstInfo = extractInventoryData(firstPage)?.WIS?.pageInfo;
  const pageSize = firstInfo?.pageSize ?? 0;
  const totalCount = firstInfo?.totalCount ?? 0;

  if (!seed.inventoryUrl || pageSize <= 0 || totalCount <= pageSize) {
    return { seed, html: firstPage };
  }

  const starts = [];
  for (let start = pageSize; start < totalCount && starts.length < maxPagesPerSeed - 1; start += pageSize) {
    starts.push(start);
  }

  const remainingPages = await Promise.all(starts.map((start) => fetchInventoryHtml(seed, start)));
  return { seed, html: [firstPage, ...remainingPages].join('\n') };
}

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

export function analyzeDealerComInventory(html: string): DealerComInventoryAnalysis {
  const pages = extractInventoryPages(html);
  const reportedTotalCount = pages[0]?.WIS?.pageInfo?.totalCount;
  const parsedListingCount = pages.reduce((sum, page) => sum + (page.WIS?.inventory?.length ?? 0), 0);

  return {
    parsedListingCount,
    ...(reportedTotalCount !== undefined ? { reportedTotalCount } : {}),
    pagesParsed: pages.length,
    complete: reportedTotalCount === undefined ? parsedListingCount > 0 : parsedListingCount >= reportedTotalCount
  };
}

function extractVehicles(html: string): DealerComVehicle[] {
  return extractInventoryPages(html).flatMap((page) => page.WIS?.inventory ?? []);
}

function extractInventoryPages(html: string): DealerComInventoryData[] {
  return Array.from(
    html.matchAll(/DDC\.WS\.state\['ws-inv-data'\]\['inventory-data-bus\d+'\] = (\{[\s\S]*?\});/g),
    (match) => JSON.parse(match[1] ?? '{}') as DealerComInventoryData
  );
}

function extractInventoryData(html: string): DealerComInventoryData | undefined {
  return extractInventoryPages(html)[0];
}

async function fetchInventoryHtml(seed: SellerSeed, start?: number): Promise<string> {
  if (!seed.inventoryUrl) {
    return '';
  }

  const url = new URL(seed.inventoryUrl);
  if (start !== undefined) {
    url.searchParams.set('start', String(start));
  }

  const response = await fetch(url, {
    headers: { 'user-agent': 'vehicle-finder/0.1 low-frequency family vehicle search' }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
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

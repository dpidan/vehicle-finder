import type { CollectionContext, ListingCandidate, ListingSource, SellerSeed } from '../domain/entities.js';
import type { SellerType, TitleStatus } from '../domain/search-config.js';
import { manualImportToCandidate } from './manual-import.js';

interface ListingImportInput {
  url?: string;
  title?: string;
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  vin?: string;
  price?: number;
  mileage?: number;
  exteriorColor?: string;
  photoUrls?: string[];
  titleStatus?: TitleStatus;
  sellerName?: string;
  sellerType?: SellerType;
  description?: string;
}

type CompleteListingImportInput = ListingImportInput & { url: string; title: string };

const jsonSource = { name: 'listing JSON import', access: 'manual-import' } as const;
const csvSource = { name: 'listing CSV import', access: 'manual-import' } as const;

export const listingJsonSource: ListingSource = {
  name: jsonSource.name,
  access: jsonSource.access,
  collect: async (context) => collectImportFeeds(context, parseJsonListings, jsonSource)
};

export const listingCsvSource: ListingSource = {
  name: csvSource.name,
  access: csvSource.access,
  collect: async (context) => collectImportFeeds(context, parseCsvListings, csvSource)
};

export function parseListingJsonImport(json: string, capturedAt: string): ListingCandidate[] {
  return toCandidates(parseJsonListings(json), capturedAt, jsonSource);
}

export function parseListingCsvImport(csv: string, capturedAt: string): ListingCandidate[] {
  return toCandidates(parseCsvListings(csv), capturedAt, csvSource);
}

async function collectImportFeeds(
  context: CollectionContext,
  parse: (text: string) => CompleteListingImportInput[],
  source: typeof jsonSource | typeof csvSource
): Promise<ListingCandidate[]> {
  const seeds = context.sellerSeeds?.filter((seed) => seed.inventoryUrl) ?? [];
  const pages = await Promise.all(
    seeds.map(async (seed) => ({
      seed,
      text: await fetchText(seed)
    }))
  );

  return pages.flatMap(({ seed, text }) =>
    toCandidates(
      parse(text).map((input) => ({
        ...input,
        url: input.url,
        title: input.title,
        sellerName: input.sellerName ?? seed.name,
        sellerType: input.sellerType ?? seed.type
      })),
      context.collectedAt,
      source
    )
  );
}

function toCandidates(
  inputs: CompleteListingImportInput[],
  capturedAt: string,
  source: typeof jsonSource | typeof csvSource
): ListingCandidate[] {
  return inputs.flatMap((input) => {
    try {
      const candidate = manualImportToCandidate(input, capturedAt);
      return [
        {
          ...candidate,
          source,
          ...(input.exteriorColor ? { exteriorColor: input.exteriorColor } : {}),
          evidence: [{ label: source.name, url: input.url, confidence: 0.7 }]
        }
      ];
    } catch {
      return [];
    }
  });
}

function parseJsonListings(json: string): CompleteListingImportInput[] {
  try {
    const parsed = JSON.parse(json) as unknown;
    return Array.isArray(parsed) ? parsed.map(normalizeRecord).filter(hasMinimumListingFields) : [];
  } catch {
    return [];
  }
}

function parseCsvListings(csv: string): CompleteListingImportInput[] {
  const [headerLine, ...lines] = csv.trim().split(/\r?\n/);

  if (!headerLine) {
    return [];
  }

  const headers = splitCsvLine(headerLine).map(normalizeHeader);
  return lines
    .map((line) => Object.fromEntries(splitCsvLine(line).map((value, index) => [headers[index], value])))
    .map(normalizeRecord)
    .filter(hasMinimumListingFields);
}

async function fetchText(seed: SellerSeed): Promise<string> {
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

function normalizeRecord(record: unknown): ListingImportInput {
  const value = record && typeof record === 'object' ? (record as Record<string, unknown>) : {};

  return definedProps({
    url: text(value.url),
    title: text(value.title),
    year: number(value.year),
    make: text(value.make),
    model: text(value.model),
    trim: text(value.trim),
    vin: text(value.vin)?.toUpperCase(),
    price: number(value.price),
    mileage: number(value.mileage),
    exteriorColor: text(value.exteriorcolor ?? value.exteriorColor),
    photoUrls: text(value.photourls ?? value.photoUrls)
      ?.split(/[|,]/)
      .map((url) => url.trim())
      .filter(Boolean),
    titleStatus: titleStatus(text(value.titlestatus ?? value.titleStatus)),
    sellerName: text(value.sellername ?? value.sellerName),
    sellerType: sellerType(text(value.sellertype ?? value.sellerType)),
    description: text(value.description)
  });
}

function hasMinimumListingFields(input: ListingImportInput): input is CompleteListingImportInput {
  return Boolean(input.url && input.title);
}

function splitCsvLine(line: string): string[] {
  const values: string[] = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      values.push(value.trim());
      value = '';
    } else {
      value += char;
    }
  }

  values.push(value.trim());
  return values;
}

function normalizeHeader(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function text(value: unknown): string | undefined {
  const trimmed = typeof value === 'string' ? value.trim() : value === undefined || value === null ? '' : String(value).trim();
  return trimmed || undefined;
}

function number(value: unknown): number | undefined {
  const parsed = Number(text(value)?.replace(/[$,]/g, ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function sellerType(value: string | undefined): SellerType | undefined {
  return value === 'dealer' || value === 'private' ? value : undefined;
}

function titleStatus(value: string | undefined): TitleStatus | undefined {
  return value === 'clean' || value === 'salvage' || value === 'rebuilt' || value === 'flood' || value === 'lemon-buyback' || value === 'odometer-discrepancy' || value === 'unknown'
    ? value
    : undefined;
}

function definedProps<T extends Record<string, unknown>>(record: T): { [K in keyof T]?: Exclude<T[K], undefined> } {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)) as {
    [K in keyof T]?: Exclude<T[K], undefined>;
  };
}

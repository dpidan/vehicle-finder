import type { ListingCandidate, VehicleCandidate } from '../domain/entities.js';
import type { SellerType, TitleStatus } from '../domain/search-config.js';

const manualImportSource = { name: 'manual import', access: 'manual-import' } as const;

export interface ManualImportInput {
  url: string;
  title: string;
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  vin?: string;
  price?: number;
  mileage?: number;
  photoUrls?: string[];
  titleStatus?: TitleStatus;
  sellerName?: string;
  sellerType?: SellerType;
  description?: string;
}

export function manualImportToCandidate(input: ManualImportInput, capturedAt: string): ListingCandidate {
  assertNonBlank(input.url, 'url');
  assertNonBlank(input.title, 'title');
  const rawDescription = blankToUndefined(input.description);
  const vehicle = compactVehicle({
    vin: blankToUndefined(input.vin),
    year: input.year,
    make: blankToUndefined(input.make),
    model: blankToUndefined(input.model),
    trim: blankToUndefined(input.trim)
  });

  return {
    source: manualImportSource,
    url: input.url,
    title: input.title,
    status: 'active',
    vehicle,
    ...(input.sellerName
      ? {
          seller: {
            name: input.sellerName,
            type: input.sellerType ?? 'private'
          }
        }
      : {}),
    ...(input.price === undefined ? {} : { price: { amount: input.price, currency: 'USD' } as const }),
    ...(input.mileage === undefined ? {} : { mileage: input.mileage }),
    ...(input.photoUrls?.length ? { photoUrls: input.photoUrls.filter((url) => url.trim()) } : {}),
    ...(input.titleStatus === undefined ? {} : { titleStatus: input.titleStatus }),
    ...(rawDescription === undefined ? {} : { rawDescription }),
    capturedAt,
    evidence: [{ label: 'manual import', url: input.url, confidence: 0.6 }]
  };
}

function compactVehicle(vehicle: {
  vin: string | undefined;
  year: number | undefined;
  make: string | undefined;
  model: string | undefined;
  trim: string | undefined;
}): VehicleCandidate {
  return {
    ...(vehicle.vin === undefined ? {} : { vin: vehicle.vin }),
    ...(vehicle.year === undefined ? {} : { year: vehicle.year }),
    ...(vehicle.make === undefined ? {} : { make: vehicle.make }),
    ...(vehicle.model === undefined ? {} : { model: vehicle.model }),
    ...(vehicle.trim === undefined ? {} : { trim: vehicle.trim })
  };
}

function assertNonBlank(value: string, field: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${field} is required`);
  }
}

function blankToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

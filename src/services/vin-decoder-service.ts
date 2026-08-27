export interface VinDecode {
  vin: string;
  modelYear?: number;
  make?: string;
  model?: string;
  trim?: string;
  bodyClass?: string;
  driveType?: string;
  engineCylinders?: string;
  fuelTypePrimary?: string;
  errorCode?: string;
  errorText?: string;
  raw: Record<string, unknown>;
  decodedAt: string;
}

export interface DecodeVinResult {
  source: 'cache' | 'live';
  decode: VinDecode;
}

interface VinDecodeRow {
  vin: string;
  model_year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  body_class: string | null;
  drive_type: string | null;
  engine_cylinders: string | null;
  fuel_type_primary: string | null;
  error_code: string | null;
  error_text: string | null;
  raw_json: string;
  decoded_at: string;
}

interface VpicResponse {
  Results?: Array<Record<string, unknown>>;
}

export async function decodeVin(
  db: D1Database,
  inputVin: string,
  modelYear: number | undefined,
  decodedAt: string,
  fetcher: typeof fetch = fetch
): Promise<DecodeVinResult> {
  const vin = normalizeVin(inputVin);
  const cached = await getCachedVinDecode(db, vin);

  if (cached) {
    return { source: 'cache', decode: cached };
  }

  const url = new URL(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}`);
  url.searchParams.set('format', 'json');
  if (modelYear !== undefined) {
    url.searchParams.set('modelyear', String(modelYear));
  }

  const response = await fetcher(url.toString());
  if (!response.ok) {
    throw new Error(`VIN decode failed with HTTP ${response.status}.`);
  }

  const body = (await response.json()) as VpicResponse;
  const raw = body.Results?.[0];
  if (!raw) {
    throw new Error('VIN decode returned no results.');
  }

  const decode = decodeFromRaw(vin, modelYear, raw, decodedAt);
  await putCachedVinDecode(db, decode);

  return { source: 'live', decode };
}

export function normalizeVin(vin: string): string {
  const normalized = vin.trim().toUpperCase();
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(normalized)) {
    throw new Error('VIN must be 17 characters and exclude I, O, and Q.');
  }
  return normalized;
}

async function getCachedVinDecode(db: D1Database, vin: string): Promise<VinDecode | undefined> {
  const row = await db.prepare(`SELECT * FROM vin_decodes WHERE vin = ?`).bind(vin).first<VinDecodeRow>();
  return row ? rowToDecode(row) : undefined;
}

async function putCachedVinDecode(db: D1Database, decode: VinDecode): Promise<void> {
  await db
    .prepare(
      `INSERT INTO vin_decodes
       (vin, model_year, make, model, trim, body_class, drive_type, engine_cylinders, fuel_type_primary, error_code, error_text, raw_json, decoded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(vin) DO UPDATE SET
         model_year = excluded.model_year,
         make = excluded.make,
         model = excluded.model,
         trim = excluded.trim,
         body_class = excluded.body_class,
         drive_type = excluded.drive_type,
         engine_cylinders = excluded.engine_cylinders,
         fuel_type_primary = excluded.fuel_type_primary,
         error_code = excluded.error_code,
         error_text = excluded.error_text,
         raw_json = excluded.raw_json,
         decoded_at = excluded.decoded_at`
    )
    .bind(
      decode.vin,
      decode.modelYear ?? null,
      decode.make ?? null,
      decode.model ?? null,
      decode.trim ?? null,
      decode.bodyClass ?? null,
      decode.driveType ?? null,
      decode.engineCylinders ?? null,
      decode.fuelTypePrimary ?? null,
      decode.errorCode ?? null,
      decode.errorText ?? null,
      JSON.stringify(decode.raw),
      decode.decodedAt
    )
    .run();
}

function decodeFromRaw(vin: string, modelYear: number | undefined, raw: Record<string, unknown>, decodedAt: string): VinDecode {
  return {
    vin,
    ...(modelYear !== undefined ? { modelYear } : {}),
    ...stringField(raw, 'Make', 'make'),
    ...stringField(raw, 'Model', 'model'),
    ...stringField(raw, 'Trim', 'trim'),
    ...stringField(raw, 'BodyClass', 'bodyClass'),
    ...stringField(raw, 'DriveType', 'driveType'),
    ...stringField(raw, 'EngineCylinders', 'engineCylinders'),
    ...stringField(raw, 'FuelTypePrimary', 'fuelTypePrimary'),
    ...stringField(raw, 'ErrorCode', 'errorCode'),
    ...stringField(raw, 'ErrorText', 'errorText'),
    raw,
    decodedAt
  };
}

function stringField<T extends string>(raw: Record<string, unknown>, sourceKey: string, targetKey: T): Partial<Record<T, string>> {
  const value = raw[sourceKey];
  return typeof value === 'string' && value.trim() ? { [targetKey]: value.trim() } as Partial<Record<T, string>> : {};
}

function rowToDecode(row: VinDecodeRow): VinDecode {
  return {
    vin: row.vin,
    ...(row.model_year !== null ? { modelYear: row.model_year } : {}),
    ...(row.make ? { make: row.make } : {}),
    ...(row.model ? { model: row.model } : {}),
    ...(row.trim ? { trim: row.trim } : {}),
    ...(row.body_class ? { bodyClass: row.body_class } : {}),
    ...(row.drive_type ? { driveType: row.drive_type } : {}),
    ...(row.engine_cylinders ? { engineCylinders: row.engine_cylinders } : {}),
    ...(row.fuel_type_primary ? { fuelTypePrimary: row.fuel_type_primary } : {}),
    ...(row.error_code ? { errorCode: row.error_code } : {}),
    ...(row.error_text ? { errorText: row.error_text } : {}),
    raw: JSON.parse(row.raw_json) as Record<string, unknown>,
    decodedAt: row.decoded_at
  };
}

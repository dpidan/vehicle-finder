export interface RecallRecord {
  campaignNumber?: string;
  component?: string;
  summary?: string;
  consequence?: string;
  remedy?: string;
  reportReceivedDate?: string;
  raw: Record<string, unknown>;
}

export interface RecallLookup {
  lookupKey: string;
  modelYear: number;
  make: string;
  model: string;
  recalls: RecallRecord[];
  checkedAt: string;
}

export interface RecallLookupResult {
  source: 'cache' | 'live';
  lookup: RecallLookup;
}

interface RecallLookupRow {
  lookup_key: string;
  model_year: number;
  make: string;
  model: string;
  recalls_json: string;
  checked_at: string;
}

interface NhtsaRecallResponse {
  results?: Array<Record<string, unknown>>;
  Results?: Array<Record<string, unknown>>;
}

export async function lookupRecalls(
  db: D1Database,
  modelYear: number,
  make: string,
  model: string,
  checkedAt: string,
  fetcher: typeof fetch = fetch
): Promise<RecallLookupResult> {
  const lookupKey = recallLookupKey(modelYear, make, model);
  const cached = await getCachedRecallLookup(db, lookupKey);

  if (cached) {
    return { source: 'cache', lookup: cached };
  }

  const url = new URL('https://api.nhtsa.gov/recalls/recallsByVehicle');
  url.searchParams.set('modelYear', String(modelYear));
  url.searchParams.set('make', make);
  url.searchParams.set('model', model);

  const response = await fetcher(url.toString());
  if (!response.ok) {
    throw new Error(`Recall lookup failed with HTTP ${response.status}.`);
  }

  const body = (await response.json()) as NhtsaRecallResponse;
  const recalls = (body.results ?? body.Results ?? []).map(toRecallRecord);
  const lookup = { lookupKey, modelYear, make: make.trim(), model: model.trim(), recalls, checkedAt };

  await putCachedRecallLookup(db, lookup);
  return { source: 'live', lookup };
}

export function recallLookupKey(modelYear: number, make: string, model: string): string {
  if (!Number.isInteger(modelYear) || modelYear < 1900 || modelYear > 2100) {
    throw new Error('Model year must be a valid integer year.');
  }
  if (!make.trim() || !model.trim()) {
    throw new Error('Make and model are required.');
  }
  return `${modelYear}:${make.trim().toLowerCase()}:${model.trim().toLowerCase()}`;
}

export async function getCachedRecallLookupForVehicle(
  db: D1Database,
  modelYear: number | null | undefined,
  make: string | null | undefined,
  model: string | null | undefined
): Promise<RecallLookup | undefined> {
  if (!modelYear || !make || !model) {
    return undefined;
  }

  return getCachedRecallLookup(db, recallLookupKey(modelYear, make, model));
}

async function getCachedRecallLookup(db: D1Database, lookupKey: string): Promise<RecallLookup | undefined> {
  const row = await db.prepare(`SELECT * FROM vehicle_recalls WHERE lookup_key = ?`).bind(lookupKey).first<RecallLookupRow>();
  return row ? rowToLookup(row) : undefined;
}

async function putCachedRecallLookup(db: D1Database, lookup: RecallLookup): Promise<void> {
  await db
    .prepare(
      `INSERT INTO vehicle_recalls
       (lookup_key, model_year, make, model, recalls_json, checked_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(lookup_key) DO UPDATE SET
         recalls_json = excluded.recalls_json,
         checked_at = excluded.checked_at`
    )
    .bind(lookup.lookupKey, lookup.modelYear, lookup.make, lookup.model, JSON.stringify(lookup.recalls), lookup.checkedAt)
    .run();
}

function toRecallRecord(raw: Record<string, unknown>): RecallRecord {
  return {
    ...stringField(raw, 'NHTSACampaignNumber', 'campaignNumber'),
    ...stringField(raw, 'Component', 'component'),
    ...stringField(raw, 'Summary', 'summary'),
    ...stringField(raw, 'Consequence', 'consequence'),
    ...stringField(raw, 'Remedy', 'remedy'),
    ...stringField(raw, 'ReportReceivedDate', 'reportReceivedDate'),
    raw
  };
}

function stringField<T extends string>(raw: Record<string, unknown>, sourceKey: string, targetKey: T): Partial<Record<T, string>> {
  const value = raw[sourceKey];
  return typeof value === 'string' && value.trim() ? { [targetKey]: value.trim() } as Partial<Record<T, string>> : {};
}

function rowToLookup(row: RecallLookupRow): RecallLookup {
  return {
    lookupKey: row.lookup_key,
    modelYear: row.model_year,
    make: row.make,
    model: row.model,
    recalls: JSON.parse(row.recalls_json) as RecallRecord[],
    checkedAt: row.checked_at
  };
}

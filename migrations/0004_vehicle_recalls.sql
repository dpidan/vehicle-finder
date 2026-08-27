CREATE TABLE vehicle_recalls (
  lookup_key TEXT PRIMARY KEY,
  model_year INTEGER NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  recalls_json TEXT NOT NULL,
  checked_at TEXT NOT NULL
);

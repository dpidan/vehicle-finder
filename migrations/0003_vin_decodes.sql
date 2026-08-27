CREATE TABLE vin_decodes (
  vin TEXT PRIMARY KEY,
  model_year INTEGER,
  make TEXT,
  model TEXT,
  trim TEXT,
  body_class TEXT,
  drive_type TEXT,
  engine_cylinders TEXT,
  fuel_type_primary TEXT,
  error_code TEXT,
  error_text TEXT,
  raw_json TEXT NOT NULL,
  decoded_at TEXT NOT NULL
);

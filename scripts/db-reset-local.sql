PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS vehicle_recalls;
DROP TABLE IF EXISTS vin_decodes;
DROP TABLE IF EXISTS model_year_risks;
DROP TABLE IF EXISTS attribute_values;
DROP TABLE IF EXISTS attribute_definitions;
DROP TABLE IF EXISTS listing_dispositions;
DROP TABLE IF EXISTS search_evaluations;
DROP TABLE IF EXISTS evidence_records;
DROP TABLE IF EXISTS listing_snapshots;
DROP TABLE IF EXISTS listings;
DROP TABLE IF EXISTS sellers;
DROP TABLE IF EXISTS vehicles;
DROP TABLE IF EXISTS saved_searches;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS d1_migrations;

PRAGMA foreign_keys = ON;

ALTER TABLE locations ADD COLUMN qr_code VARCHAR(255) UNIQUE;
CREATE INDEX idx_locations_qr_code ON locations(qr_code);
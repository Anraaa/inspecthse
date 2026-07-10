-- Replace APAR HSE parameters with HSE-F-15 aligned questions
DELETE FROM patrol_details WHERE hse_parameter_id IN (SELECT id FROM hse_parameters WHERE asset_category = 'APAR');
DELETE FROM hse_parameters WHERE asset_category = 'APAR';

INSERT INTO hse_parameters (asset_category, parameter_name, input_type, unit, options, check_type, sort_order, is_required) VALUES
('APAR', 'Tuas', 'boolean', '', '', 'fisik', 1, 1),
('APAR', 'Segel Tuas', 'boolean', '', '', 'fisik', 2, 1),
('APAR', 'Pin', 'boolean', '', '', 'fisik', 3, 1),
('APAR', 'Selang', 'boolean', '', '', 'fisik', 4, 1),
('APAR', 'Nozzle', 'boolean', '', '', 'fisik', 5, 1),
('APAR', 'Tekanan/Isi', 'boolean', '', '', 'fisik', 6, 1),
('APAR', 'Tabung', 'boolean', '', '', 'fisik', 7, 1),
('APAR', 'Label/Petunjuk', 'boolean', '', '', 'fisik', 8, 1),
('APAR', 'Akses', 'boolean', '', '', 'fisik', 9, 1),
('APAR', 'Kebersihan', 'boolean', '', '', 'fisik', 10, 1),
('APAR', 'Berat tabung (kg)', 'numeric', 'kg', '', 'fisik', 11, 0),
('APAR', 'Catatan tambahan', 'text', '', '', 'fisik', 12, 0);

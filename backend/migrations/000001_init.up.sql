CREATE TABLE IF NOT EXISTS sections (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS locations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shifts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    start_time VARCHAR(5) NOT NULL,
    end_time VARCHAR(5) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('SUPER_ADMIN', 'K3L', 'TIM_HSE') NOT NULL DEFAULT 'K3L',
    section_id BIGINT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS assets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    asset_category ENUM('APAR', 'HYDRANT', 'FIRE_ALARM') NOT NULL,
    serial_number VARCHAR(100),
    location_id BIGINT NOT NULL,
    pic_id BIGINT,
    section_id BIGINT,
    plant VARCHAR(100),
    size VARCHAR(50),
    expired_at DATE,
    qr_code VARCHAR(255) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES locations(id),
    FOREIGN KEY (pic_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS hse_parameters (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    asset_category ENUM('APAR', 'HYDRANT', 'FIRE_ALARM') NOT NULL,
    parameter_name VARCHAR(200) NOT NULL,
    input_type ENUM('boolean', 'numeric', 'text', 'option') NOT NULL,
    unit VARCHAR(50),
    options TEXT,
    check_type ENUM('fisik', 'fungsi') NOT NULL DEFAULT 'fisik',
    sort_order INT DEFAULT 0,
    is_required BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS patrols (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    asset_id BIGINT NOT NULL,
    shift_id BIGINT NOT NULL,
    status ENUM('draft', 'submitted', 'waiting_approval', 'approved', 'rejected') NOT NULL DEFAULT 'draft',
    client_uuid VARCHAR(36) NOT NULL UNIQUE,
    approved_by BIGINT,
    approved_at TIMESTAMP NULL,
    rejection_reason TEXT,
    submitted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (asset_id) REFERENCES assets(id),
    FOREIGN KEY (shift_id) REFERENCES shifts(id),
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS patrol_details (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patrol_id BIGINT NOT NULL,
    hse_parameter_id BIGINT NOT NULL,
    value TEXT,
    is_anomaly BOOLEAN DEFAULT FALSE,
    notes TEXT,
    FOREIGN KEY (patrol_id) REFERENCES patrols(id) ON DELETE CASCADE,
    FOREIGN KEY (hse_parameter_id) REFERENCES hse_parameters(id)
);

CREATE TABLE IF NOT EXISTS patrol_attachments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patrol_id BIGINT NOT NULL,
    patrol_detail_id BIGINT,
    file_path VARCHAR(500) NOT NULL,
    attachment_type VARCHAR(50) NOT NULL DEFAULT 'photo',
    is_live_capture BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patrol_id) REFERENCES patrols(id) ON DELETE CASCADE,
    FOREIGN KEY (patrol_detail_id) REFERENCES patrol_details(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS alerts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patrol_id BIGINT NOT NULL,
    asset_id BIGINT NOT NULL,
    pic_id BIGINT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patrol_id) REFERENCES patrols(id),
    FOREIGN KEY (asset_id) REFERENCES assets(id),
    FOREIGN KEY (pic_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS activity_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(50) NOT NULL,
    entity_id BIGINT NOT NULL,
    old_value JSON,
    new_value JSON,
    is_ghost BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

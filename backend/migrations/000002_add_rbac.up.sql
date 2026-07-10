CREATE TABLE IF NOT EXISTS roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

ALTER TABLE users MODIFY role VARCHAR(50) NOT NULL DEFAULT 'K3L';

INSERT IGNORE INTO roles (name, display_name, description, is_system) VALUES
('SUPER_ADMIN', 'Super Admin', 'Akses penuh ke seluruh sistem', TRUE),
('K3L', 'K3L', 'Petugas K3L lapangan', TRUE),
('TIM_HSE', 'Tim HSE', 'Tim HSE yang melakukan approval', TRUE);

INSERT IGNORE INTO permissions (name, display_name, module, description) VALUES
('dashboard.view', 'Lihat Dashboard', 'dashboard', 'Melihat halaman dashboard'),
('scan.view', 'Scan QR', 'scan', 'Memindai QR code aset'),
('inspeksi.lapangan', 'Inspeksi Lapangan', 'inspeksi', 'Melakukan inspeksi lapangan'),
('patrol.view', 'Lihat Patroli', 'patrol', 'Melihat daftar patroli'),
('patrol.create', 'Buat Patroli', 'patrol', 'Membuat patroli baru'),
('patrol.approve', 'Approve Patroli', 'patrol', 'Menyetujui patroli'),
('patrol.reject', 'Tolak Patroli', 'patrol', 'Menolak patroli'),
('master-data.view', 'Lihat Master Data', 'master-data', 'Melihat data master'),
('master-data.create', 'Tambah Master Data', 'master-data', 'Menambah data master'),
('master-data.edit', 'Edit Master Data', 'master-data', 'Mengubah data master'),
('master-data.delete', 'Hapus Master Data', 'master-data', 'Menghapus data master'),
('users.view', 'Lihat Users', 'users', 'Melihat daftar pengguna'),
('users.create', 'Tambah User', 'users', 'Menambah pengguna baru'),
('users.edit', 'Edit User', 'users', 'Mengubah data pengguna'),
('roles.view', 'Lihat Roles', 'roles', 'Melihat daftar peran'),
('roles.create', 'Tambah Role', 'roles', 'Menambah peran baru'),
('roles.edit', 'Edit Role', 'roles', 'Mengubah peran'),
('roles.delete', 'Hapus Role', 'roles', 'Menghapus peran'),
('export.view', 'Export HSE', 'export', 'Mengekspor data HSE'),
('import.assets', 'Import Aset', 'import', 'Mengimpor data aset');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'SUPER_ADMIN';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'K3L' AND p.name IN (
    'dashboard.view', 'scan.view', 'inspeksi.lapangan',
    'patrol.view', 'patrol.create'
);

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'TIM_HSE' AND p.name IN (
    'dashboard.view', 'scan.view',
    'patrol.view', 'patrol.approve', 'patrol.reject'
);

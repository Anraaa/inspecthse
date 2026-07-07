# Task 03: Repository Layer Implementation

## Deskripsi
Implementasi repository interface sebagai lapisan akses data ke MySQL menggunakan sqlx. Repository pattern memisahkan logika query dari service/bisnis logic.

## Subtasks

### 3.1 Implementasi Repository
Buat implementasi konkrit untuk setiap interface di `internal/repository/implementations/`:

| Repository | Method Utama |
|------------|-------------|
| **UserRepositoryImpl** | FindByID, FindByEmail (untuk login), Create, Update, List (pagination) |
| **AssetRepositoryImpl** | FindByID, FindByQRCode (untuk scan), Create, Update, Delete, List (dengan filter: category, location, section, search) |
| **LocationRepositoryImpl** | FindByID, Create, Update, Delete, List |
| **SectionRepositoryImpl** | FindByID, Create, Update, Delete, List |
| **ShiftRepositoryImpl** | FindByID, Create, Update, Delete, List |
| **HSEParameterRepositoryImpl** | FindByID, FindByAssetCategory (untuk dynamic form), Create, Update, Delete, List |
| **PatrolRepositoryImpl** | FindByID, Create (return ID), Update, List (filter: status, user, asset, date range), FindByClientUUID (cegah duplikasi) |
| **PatrolDetailRepositoryImpl** | CreateBatch (batch insert), ListByPatrolID |
| **PatrolAttachmentRepositoryImpl** | Create, ListByPatrolID |
| **AlertRepositoryImpl** | Create, ListByUserID (dengan filter is_read), MarkAsRead |
| **ActivityLogRepositoryImpl** | Create, List (filter: entity, entity_id) |

### 3.2 Query Best Practices
- Gunakan `sqlx.Named()` untuk dynamic where clause
- Implementasi pagination dengan `LIMIT ? OFFSET ?`
- Gunakan `sqlx.In()` untuk IN clause
- Implementasi soft delete pattern (is_active) untuk master data
- Gunakan `LastInsertId` untuk return ID setelah INSERT

### 3.3 Transaction Support
- Implementasi `WithTx` method untuk operasi yang memerlukan transaction (Create Patrol + Details + Attachments)

### 3.4 Unit Test
- Mock repository interface dengan testify/mock
- Unit test untuk setiap method repository

## Acceptance Criteria
- [ ] Semua query SELECT/INSERT/UPDATE/DELETE berfungsi
- [ ] Parameter binding menggunakan sqlx (bukan string concatenation)
- [ ] Pagination bekerja dengan benar (offset, limit, total count)
- [ ] Duplikasi client_uuid terdeteksi di PatrolRepository
- [ ] Transaction rollback jika batch insert gagal
- [ ] Unit test coverage > 80% untuk repository

## References
- `backend/internal/repository/interfaces.go`
- `backend/pkg/database/mysql.go`
- PRD Section 10: Entity Relationship

package mysql

import (
	"context"
	"fmt"

	"github.com/anomalyco/inspecthse/internal/model"
	"github.com/jmoiron/sqlx"
)

type LocationRepository struct {
	db *sqlx.DB
}

func NewLocationRepository(db *sqlx.DB) *LocationRepository {
	return &LocationRepository{db: db}
}

func (r *LocationRepository) FindByID(ctx context.Context, id int64) (*model.Location, error) {
	var l model.Location
	err := r.db.GetContext(ctx, &l, "SELECT * FROM locations WHERE id = ?", id)
	if err != nil {
		return nil, fmt.Errorf("location not found: %w", err)
	}
	return &l, nil
}

func (r *LocationRepository) FindByQRCode(ctx context.Context, qrCode string) (*model.Location, error) {
	var l model.Location
	err := r.db.GetContext(ctx, &l, "SELECT * FROM locations WHERE qr_code = ?", qrCode)
	if err != nil {
		return nil, fmt.Errorf("location not found by QR code: %w", err)
	}
	return &l, nil
}

func (r *LocationRepository) Create(ctx context.Context, location *model.Location) error {
	res, err := r.db.ExecContext(ctx, "INSERT INTO locations (name, description, qr_code) VALUES (?, ?, ?)",
		location.Name, location.Description, location.QRCode)
	if err != nil {
		return err
	}
	id, _ := res.LastInsertId()
	location.ID = id
	return nil
}

func (r *LocationRepository) Update(ctx context.Context, location *model.Location) error {
	_, err := r.db.ExecContext(ctx, "UPDATE locations SET name=?, description=?, qr_code=? WHERE id=?",
		location.Name, location.Description, location.QRCode, location.ID)
	return err
}

func (r *LocationRepository) Delete(ctx context.Context, id int64) error {
	_, err := r.db.ExecContext(ctx, "DELETE FROM locations WHERE id = ?", id)
	return err
}

func (r *LocationRepository) List(ctx context.Context) ([]model.Location, error) {
	var locations []model.Location
	err := r.db.SelectContext(ctx, &locations, "SELECT * FROM locations ORDER BY id")
	if err != nil {
		return nil, err
	}
	return locations, nil
}

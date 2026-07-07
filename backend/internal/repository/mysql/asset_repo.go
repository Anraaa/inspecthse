package mysql

import (
	"context"
	"fmt"
	"strings"

	"github.com/anomalyco/inspecthse/internal/model"
	"github.com/jmoiron/sqlx"
)

type AssetRepository struct {
	db *sqlx.DB
}

func NewAssetRepository(db *sqlx.DB) *AssetRepository {
	return &AssetRepository{db: db}
}

func (r *AssetRepository) FindByID(ctx context.Context, id int64) (*model.Asset, error) {
	var a model.Asset
	err := r.db.GetContext(ctx, &a, "SELECT * FROM assets WHERE id = ?", id)
	if err != nil {
		return nil, fmt.Errorf("asset not found: %w", err)
	}
	return &a, nil
}

func (r *AssetRepository) FindByQRCode(ctx context.Context, qrCode string) (*model.Asset, error) {
	var a model.Asset
	err := r.db.GetContext(ctx, &a, "SELECT * FROM assets WHERE qr_code = ?", qrCode)
	if err != nil {
		return nil, fmt.Errorf("asset not found: %w", err)
	}
	return &a, nil
}

func (r *AssetRepository) Create(ctx context.Context, asset *model.Asset) error {
	res, err := r.db.ExecContext(ctx, `
		INSERT INTO assets (name, asset_category, serial_number, location_id, pic_id, section_id, plant, size, expired_at, qr_code, is_active)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		asset.Name, asset.Category, asset.SerialNumber, asset.LocationID, asset.PICID, asset.SectionID,
		asset.Plant, asset.Size, asset.ExpiredAt, asset.QRCode, asset.IsActive,
	)
	if err != nil {
		return err
	}
	id, _ := res.LastInsertId()
	asset.ID = id
	return nil
}

func (r *AssetRepository) Update(ctx context.Context, asset *model.Asset) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE assets SET name=?, asset_category=?, serial_number=?, location_id=?, pic_id=?, section_id=?,
		                  plant=?, size=?, expired_at=?, qr_code=?, is_active=?
		WHERE id=?`,
		asset.Name, asset.Category, asset.SerialNumber, asset.LocationID, asset.PICID, asset.SectionID,
		asset.Plant, asset.Size, asset.ExpiredAt, asset.QRCode, asset.IsActive, asset.ID,
	)
	return err
}

func (r *AssetRepository) Delete(ctx context.Context, id int64) error {
	_, err := r.db.ExecContext(ctx, "DELETE FROM assets WHERE id = ?", id)
	return err
}

func (r *AssetRepository) List(ctx context.Context, filter map[string]interface{}, offset, limit int) ([]model.Asset, int, error) {
	where := "1=1"
	args := []interface{}{}

	if v, ok := filter["asset_category"]; ok {
		where += " AND asset_category = ?"
		args = append(args, v)
	}
	if v, ok := filter["location_id"]; ok {
		where += " AND location_id = ?"
		args = append(args, v)
	}
	if v, ok := filter["section_id"]; ok {
		where += " AND section_id = ?"
		args = append(args, v)
	}
	if v, ok := filter["search"]; ok {
		s := fmt.Sprintf("%%%s%%", strings.TrimSpace(v.(string)))
		where += " AND (name LIKE ? OR serial_number LIKE ?)"
		args = append(args, s, s)
	}

	var total int
	err := r.db.GetContext(ctx, &total, "SELECT COUNT(*) FROM assets WHERE "+where, args...)
	if err != nil {
		return nil, 0, err
	}

	var assets []model.Asset
	err = r.db.SelectContext(ctx, &assets, "SELECT * FROM assets WHERE "+where+" ORDER BY id LIMIT ? OFFSET ?",
		append(args, limit, offset)...)
	if err != nil {
		return nil, 0, err
	}
	return assets, total, nil
}

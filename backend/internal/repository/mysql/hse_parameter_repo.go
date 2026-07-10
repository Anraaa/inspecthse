package mysql

import (
	"context"
	"fmt"

	"github.com/anomalyco/inspecthse/internal/model"
	"github.com/jmoiron/sqlx"
)

type HSEParameterRepository struct {
	db *sqlx.DB
}

func NewHSEParameterRepository(db *sqlx.DB) *HSEParameterRepository {
	return &HSEParameterRepository{db: db}
}

func (r *HSEParameterRepository) FindByID(ctx context.Context, id int64) (*model.HSEParameter, error) {
	var p model.HSEParameter
	err := r.db.GetContext(ctx, &p, "SELECT * FROM hse_parameters WHERE id = ?", id)
	if err != nil {
		return nil, fmt.Errorf("parameter not found: %w", err)
	}
	return &p, nil
}

func (r *HSEParameterRepository) FindByAssetCategory(ctx context.Context, category model.AssetCategory) ([]model.HSEParameter, error) {
	var params []model.HSEParameter
	err := r.db.SelectContext(ctx, &params, "SELECT * FROM hse_parameters WHERE asset_category = ? AND is_active = true ORDER BY sort_order",
		category)
	if err != nil {
		return nil, err
	}
	return params, nil
}

func (r *HSEParameterRepository) Create(ctx context.Context, param *model.HSEParameter) error {
	res, err := r.db.ExecContext(ctx, `
		INSERT INTO hse_parameters (asset_category, parameter_name, input_type, unit, options, check_type, sort_order, is_required, is_active)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		param.AssetCategory, param.ParameterName, param.InputType, param.Unit,
		param.Options, param.CheckType, param.SortOrder, param.IsRequired, param.IsActive,
	)
	if err != nil {
		return err
	}
	id, _ := res.LastInsertId()
	param.ID = id
	return nil
}

func (r *HSEParameterRepository) Update(ctx context.Context, param *model.HSEParameter) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE hse_parameters SET asset_category=?, parameter_name=?, input_type=?, unit=?, options=?,
		                           check_type=?, sort_order=?, is_required=?, is_active=?
		WHERE id=?`,
		param.AssetCategory, param.ParameterName, param.InputType, param.Unit,
		param.Options, param.CheckType, param.SortOrder, param.IsRequired, param.IsActive, param.ID,
	)
	return err
}

func (r *HSEParameterRepository) Delete(ctx context.Context, id int64) error {
	_, err := r.db.ExecContext(ctx, "DELETE FROM hse_parameters WHERE id = ?", id)
	return err
}

func (r *HSEParameterRepository) List(ctx context.Context, offset, limit int) ([]model.HSEParameter, int, error) {
	var total int
	err := r.db.GetContext(ctx, &total, "SELECT COUNT(*) FROM hse_parameters")
	if err != nil {
		return nil, 0, err
	}

	var params []model.HSEParameter
	err = r.db.SelectContext(ctx, &params, "SELECT * FROM hse_parameters ORDER BY asset_category, sort_order LIMIT ? OFFSET ?", limit, offset)
	if err != nil {
		return nil, 0, err
	}
	return params, total, nil
}

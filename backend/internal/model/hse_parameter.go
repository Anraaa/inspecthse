package model

import "time"

type InputType string

const (
	InputTypeBoolean InputType = "boolean"
	InputTypeNumeric InputType = "numeric"
	InputTypeText    InputType = "text"
	InputTypeOption  InputType = "option"
)

type CheckType string

const (
	CheckTypeFisik  CheckType = "fisik"
	CheckTypeFungsi CheckType = "fungsi"
)

type HSEParameter struct {
	ID            int64         `db:"id" json:"id"`
	AssetCategory AssetCategory `db:"asset_category" json:"asset_category"`
	ParameterName string        `db:"parameter_name" json:"parameter_name"`
	InputType     InputType     `db:"input_type" json:"input_type"`
	Unit          string        `db:"unit" json:"unit"`
	Options       string        `db:"options" json:"options"`
	CheckType     CheckType     `db:"check_type" json:"check_type"`
	SortOrder     int           `db:"sort_order" json:"sort_order"`
	IsRequired    bool          `db:"is_required" json:"is_required"`
	IsActive      bool          `db:"is_active" json:"is_active"`
	CreatedAt     time.Time     `db:"created_at" json:"created_at"`
	UpdatedAt     time.Time     `db:"updated_at" json:"updated_at"`
}

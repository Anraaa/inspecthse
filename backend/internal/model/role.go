package model

import "time"

type RoleInfo struct {
	ID          int64     `db:"id" json:"id"`
	Name        string    `db:"name" json:"name"`
	DisplayName string    `db:"display_name" json:"display_name"`
	Description string    `db:"description" json:"description"`
	IsSystem    bool      `db:"is_system" json:"is_system"`
	CreatedAt   time.Time `db:"created_at" json:"created_at"`
	UpdatedAt   time.Time `db:"updated_at" json:"updated_at"`
}

type RoleWithPermissions struct {
	RoleInfo
	Permissions []Permission `json:"permissions"`
}

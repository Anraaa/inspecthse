package model

import "time"

type ActivityLog struct {
	ID        int64     `db:"id" json:"id"`
	UserID    int64     `db:"user_id" json:"user_id"`
	Action    string    `db:"action" json:"action"`
	Entity    string    `db:"entity" json:"entity"`
	EntityID  int64     `db:"entity_id" json:"entity_id"`
	OldValue  string    `db:"old_value" json:"old_value"`
	NewValue  string    `db:"new_value" json:"new_value"`
	IsGhost   bool      `db:"is_ghost" json:"is_ghost"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
}

package model

import "time"

type Shift struct {
	ID        int64     `db:"id" json:"id"`
	Name      string    `db:"name" json:"name"`
	StartTime string    `db:"start_time" json:"start_time"`
	EndTime   string    `db:"end_time" json:"end_time"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
}

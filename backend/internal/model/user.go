package model

import "time"

type Role string

const (
	RoleSuperAdmin Role = "SUPER_ADMIN"
	RoleK3L        Role = "K3L"
	RoleTimHSE     Role = "TIM_HSE"
)

type User struct {
	ID        int64     `db:"id" json:"id"`
	Name      string    `db:"name" json:"name"`
	NIP       string    `db:"nip" json:"nip"`
	Email     string    `db:"email" json:"email"`
	Password  string    `db:"password" json:"-"`
	Role      Role      `db:"role" json:"role"`
	SectionID *int64    `db:"section_id" json:"section_id"`
	IsActive  bool      `db:"is_active" json:"is_active"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
}

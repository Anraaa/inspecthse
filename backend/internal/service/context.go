package service

import (
	"context"

	"github.com/anomalyco/inspecthse/internal/middleware"
)

func getCurrentUserID(ctx context.Context) int64 {
	id, _ := ctx.Value(middleware.UserIDKey).(int64)
	return id
}

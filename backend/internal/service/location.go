package service

import (
	"bytes"
	"context"
	"fmt"
	"image/png"
	"time"

	"github.com/anomalyco/inspecthse/internal/model"
	"github.com/anomalyco/inspecthse/internal/repository"
	"github.com/boombuler/barcode"
	"github.com/boombuler/barcode/qr"
)

type locationService struct {
	repo   repository.LocationRepository
	logSvc ActivityLogService
}

func NewLocationService(repo repository.LocationRepository, logSvc ActivityLogService) LocationService {
	return &locationService{repo: repo, logSvc: logSvc}
}

func (s *locationService) Create(ctx context.Context, location *model.Location) error {
	err := s.repo.Create(ctx, location)
	if err != nil {
		return err
	}
	s.logSvc.Log(ctx, getCurrentUserID(ctx), "create", "location", location.ID, "", location.Name, false)
	return nil
}

func (s *locationService) Update(ctx context.Context, location *model.Location) error {
	old, _ := s.repo.FindByID(ctx, location.ID)
	err := s.repo.Update(ctx, location)
	if err != nil {
		return err
	}
	oldVal := ""
	if old != nil {
		oldVal = old.Name
	}
	s.logSvc.Log(ctx, getCurrentUserID(ctx), "update", "location", location.ID, oldVal, location.Name, false)
	return nil
}

func (s *locationService) Delete(ctx context.Context, id int64) error {
	old, _ := s.repo.FindByID(ctx, id)
	err := s.repo.Delete(ctx, id)
	if err != nil {
		return err
	}
	oldVal := ""
	if old != nil {
		oldVal = old.Name
	}
	s.logSvc.Log(ctx, getCurrentUserID(ctx), "delete", "location", id, oldVal, "", false)
	return nil
}

func (s *locationService) GetByID(ctx context.Context, id int64) (*model.Location, error) {
	return s.repo.FindByID(ctx, id)
}

func (s *locationService) GetByQRCode(ctx context.Context, qrCode string) (*model.Location, error) {
	return s.repo.FindByQRCode(ctx, qrCode)
}

func (s *locationService) GenerateQRCode(ctx context.Context, locationID int64, baseURL string) ([]byte, error) {
	location, err := s.repo.FindByID(ctx, locationID)
	if err != nil {
		return nil, err
	}

	if location.QRCode == nil || *location.QRCode == "" {
		code := fmt.Sprintf("LOC-%d-%d", location.ID, time.Now().Unix())
		location.QRCode = &code
		err = s.repo.Update(ctx, location)
		if err != nil {
			return nil, err
		}
	}

	fullURL := fmt.Sprintf("%s/scan/%s", baseURL, *location.QRCode)
	code, err := qr.Encode(fullURL, qr.M, qr.Auto)
	if err != nil {
		return nil, err
	}

	code, _ = barcode.Scale(code, 300, 300)

	var buf bytes.Buffer
	if err := png.Encode(&buf, code); err != nil {
		return nil, err
	}

	return buf.Bytes(), nil
}

func (s *locationService) List(ctx context.Context) ([]model.Location, error) {
	return s.repo.List(ctx)
}

package service

import (
	"bytes"
	"context"
	"fmt"
	"image/png"

	"github.com/anomalyco/inspecthse/internal/model"
	"github.com/anomalyco/inspecthse/internal/repository"
	"github.com/boombuler/barcode"
	"github.com/boombuler/barcode/qr"
)

type assetService struct {
	repo repository.AssetRepository
}

func NewAssetService(repo repository.AssetRepository) AssetService {
	return &assetService{repo: repo}
}

func (s *assetService) Create(ctx context.Context, asset *model.Asset) error {
	return s.repo.Create(ctx, asset)
}

func (s *assetService) Update(ctx context.Context, asset *model.Asset) error {
	return s.repo.Update(ctx, asset)
}

func (s *assetService) Delete(ctx context.Context, id int64) error {
	return s.repo.Delete(ctx, id)
}

func (s *assetService) GetByID(ctx context.Context, id int64) (*model.Asset, error) {
	return s.repo.FindByID(ctx, id)
}

func (s *assetService) GetByQRCode(ctx context.Context, qrCode string) (*model.Asset, error) {
	return s.repo.FindByQRCode(ctx, qrCode)
}

func (s *assetService) List(ctx context.Context, filter map[string]interface{}, offset, limit int) ([]model.Asset, int, error) {
	return s.repo.List(ctx, filter, offset, limit)
}

func (s *assetService) GenerateQRCode(ctx context.Context, assetID int64, baseURL string) ([]byte, error) {
	asset, err := s.repo.FindByID(ctx, assetID)
	if err != nil {
		return nil, err
	}

	fullURL := fmt.Sprintf("%s/scan/%s", baseURL, asset.QRCode)
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

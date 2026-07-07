package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"strconv"
	"time"

	"github.com/anomalyco/inspecthse/internal/config"
	"github.com/anomalyco/inspecthse/internal/model"
	"github.com/anomalyco/inspecthse/internal/repository"
	"github.com/golang-jwt/jwt/v5"
	"github.com/redis/go-redis/v9"
	"golang.org/x/crypto/bcrypt"
)

type authService struct {
	userRepo repository.UserRepository
	rdb      *redis.Client
	cfg      *config.Config
}

func NewAuthService(userRepo repository.UserRepository, rdb *redis.Client, cfg *config.Config) AuthService {
	return &authService{userRepo: userRepo, rdb: rdb, cfg: cfg}
}

func (s *authService) Login(ctx context.Context, email, password string) (string, string, error) {
	bg := context.Background()

	user, err := s.userRepo.FindByEmail(ctx, email)
	if err != nil {
		return "", "", errors.New("email atau password salah")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return "", "", errors.New("email atau password salah")
	}

	accessExpiry, _ := time.ParseDuration(s.cfg.JWTAccessExpiry)
	refreshExpiry, _ := time.ParseDuration(s.cfg.JWTRefreshExpiry)

	accessToken, err := s.generateJWT(user, accessExpiry)
	if err != nil {
		return "", "", err
	}

	refreshToken, err := s.generateJWT(user, refreshExpiry)
	if err != nil {
		return "", "", err
	}

	if err := s.rdb.Set(bg, "refresh:"+refreshToken, user.ID, refreshExpiry).Err(); err != nil {
		return "", "", err
	}

	return accessToken, refreshToken, nil
}

func (s *authService) RefreshToken(ctx context.Context, token string) (string, string, error) {
	bg := context.Background()

	key := "refresh:" + token

	// Get token value
	val, err := s.rdb.Get(bg, key).Result()
	if err != nil {
		return "", "", errors.New("refresh token tidak valid")
	}

	// Check if already used by looking for the used: marker
	usedKey := "used:" + token
	exists, _ := s.rdb.Exists(bg, usedKey).Result()
	if exists == 1 {
		return "", "", errors.New("refresh token tidak valid")
	}

	userID, _ := strconv.ParseInt(val, 10, 64)
	if userID == 0 {
		return "", "", errors.New("refresh token tidak valid")
	}

	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return "", "", errors.New("user tidak ditemukan")
	}

	accessExpiry, _ := time.ParseDuration(s.cfg.JWTAccessExpiry)
	refreshExpiry, _ := time.ParseDuration(s.cfg.JWTRefreshExpiry)

	newAccess, _ := s.generateJWT(user, accessExpiry)
	newRefresh, _ := s.generateJWT(user, refreshExpiry)

	// Atomically invalidate old, save new — via Lua script on TWO keys
	// KEYS[1] = used marker, KEYS[2] = new token, ARGV[1] = userID, ARGV[2] = ttl
	script := `
redis.call('SET', KEYS[1], '1')
redis.call('SET', KEYS[2], ARGV[1])
redis.call('EXPIRE', KEYS[1], ARGV[2])
redis.call('EXPIRE', KEYS[2], ARGV[2])
return 1
`
	if err := s.rdb.Eval(bg, script, []string{usedKey, "refresh:" + newRefresh}, user.ID, int(refreshExpiry.Seconds())).Err(); err != nil {
		return "", "", errors.New("gagal menyimpan token")
	}

	return newAccess, newRefresh, nil
}

func (s *authService) Logout(ctx context.Context, userID int64, refreshToken string) error {
	if refreshToken != "" {
		bg := context.Background()
		s.rdb.Del(bg, "refresh:"+refreshToken)
		s.rdb.Del(bg, "used:"+refreshToken)
	}
	return nil
}

func (s *authService) generateJWT(user *model.User, expiry time.Duration) (string, error) {
	b := make([]byte, 16)
	rand.Read(b)
	claims := jwt.MapClaims{
		"user_id": user.ID,
		"email":   user.Email,
		"role":    string(user.Role),
		"exp":     time.Now().Add(expiry).Unix(),
		"iat":     time.Now().Unix(),
		"jti":     hex.EncodeToString(b),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.cfg.JWTSecret))
}

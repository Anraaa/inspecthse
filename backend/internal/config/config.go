package config

import "os"

type Config struct {
	AppEnv     string
	ServerPort string

	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string

	RedisHost string
	RedisPort string

	JWTSecret        string
	JWTAccessExpiry  string
	JWTRefreshExpiry string

	UploadDir   string
	MaxFileSize int64
}

func Load() *Config {
	return &Config{
		AppEnv:           getEnv("APP_ENV", "development"),
		ServerPort:       getEnv("SERVER_PORT", "8080"),
		DBHost:           getEnv("DB_HOST", "localhost"),
		DBPort:           getEnv("DB_PORT", "3306"),
		DBUser:           getEnv("DB_USER", "inspecthse"),
		DBPassword:       getEnv("DB_PASSWORD", "inspecthsepass"),
		DBName:           getEnv("DB_NAME", "inspecthse"),
		RedisHost:        getEnv("REDIS_HOST", "localhost"),
		RedisPort:        getEnv("REDIS_PORT", "6379"),
		JWTSecret:        getEnv("JWT_SECRET", "super-secret-key-change-in-production"),
		JWTAccessExpiry:  getEnv("JWT_ACCESS_EXPIRY", "15m"),
		JWTRefreshExpiry: getEnv("JWT_REFRESH_EXPIRY", "168h"),
		UploadDir:        getEnv("UPLOAD_DIR", "./uploads"),
		MaxFileSize:      5 << 20,
	}
}

func (c *Config) MySQLDSN() string {
	return c.DBUser + ":" + c.DBPassword + "@tcp(" + c.DBHost + ":" + c.DBPort + ")/" + c.DBName + "?parseTime=true&charset=utf8mb4"
}

func (c *Config) RedisAddr() string {
	return c.RedisHost + ":" + c.RedisPort
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

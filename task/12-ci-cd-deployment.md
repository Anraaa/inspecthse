# Task 12: CI/CD & Deployment

## Deskripsi
Setup GitHub Actions untuk CI/CD pipeline (lint, test, build, deploy) dan konfigurasi deployment production.

## Subtasks

### 12.1 GitHub Actions — CI Pipeline
**`.github/workflows/ci.yml`**:

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  backend:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: rootpassword
          MYSQL_DATABASE: inspecthse_test
        ports:
          - 3306:3306
      redis:
        image: redis:7
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: '1.22'

      - name: Lint
        uses: golangci/golangci-lint-action@v6
        with:
          version: latest
          args: --timeout=5m

      - name: Test
        run: go test -v -race -coverprofile=coverage.txt -covermode=atomic ./...
        working-directory: ./backend

      - name: Upload Coverage
        uses: codecov/codecov-action@v4
        with:
          file: ./backend/coverage.txt

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install
        run: npm ci
        working-directory: ./frontend

      - name: Lint
        run: npm run lint
        working-directory: ./frontend

      - name: Type Check
        run: npx tsc --noEmit
        working-directory: ./frontend

      - name: Test
        run: npm run test -- --coverage
        working-directory: ./frontend

      - name: Build
        run: npm run build
        working-directory: ./frontend
```

### 12.2 GitHub Actions — CD Pipeline
**`.github/workflows/deploy.yml`**:
- Trigger: push ke branch `main`
- Build Docker image untuk backend & frontend
- Push ke Docker Hub / GitHub Container Registry
- SSH ke server → docker compose pull && docker compose up -d

### 12.3 Backend Linting Configuration
- `.golangci.yml`: enable govet, staticcheck, gofmt, bodyclose, errcheck, gosec
- Run: `golangci-lint run ./...`

### 12.4 Frontend Linting Configuration
- ESLint: TypeScript rules, React hooks rules
- Prettier: consistent formatting
- Pre-commit hooks (husky + lint-staged)

### 12.5 Production Docker Compose
- `docker-compose.prod.yml`:
  - Resource limits (CPU, memory)
  - Restart policy: always
  - Log rotation
  - Network: dedicated network
  - Secrets management (jangan hardcode env)
  - Healthcheck untuk setiap service
  - Backup volume (database dump cron)

### 12.6 Production Deployment Checklist
- [ ] Ganti semua secret/key default
- [ ] JWT secret → environment variable production
- [ ] Database password → strong random
- [ ] CORS configuration → specific origin
- [ ] HTTPS → Let's Encrypt + Certbot (atau Caddy auto HTTPS)
- [ ] Rate limiting middleware
- [ ] File upload size limit
- [ ] Database backup schedule
- [ ] Monitoring: healthcheck endpoint, logs aggregator (Loki/Promtail)
- [ ] Domain & DNS setup

## Acceptance Criteria
- [ ] CI pipeline: lint + test + build berhasil
- [ ] Golangci-lint: tidak ada error
- [ ] ESLint + Prettier: consistent code style
- [ ] Test coverage > 70% untuk backend & frontend
- [ ] Docker image build berhasil
- [ ] Deployment ke server production berjalan
- [ ] Healthcheck endpoint merespons 200
- [ ] HTTPS aktif (Let's Encrypt)
- [ ] Database backup terjadwal

## References
- `.github/workflows/ci.yml`
- `docker-compose.yml`
- PRD NFR-10: Code Quality
- PRD Section 14: Milestone & Timeline

# Quick Start Guide - Avanza Stock Finder

This guide will help you get the application running locally.

---

## 📋 Prerequisites

- **Docker** & **Docker Compose** installed
  - Docker Desktop (Mac/Windows): https://www.docker.com/products/docker-desktop
  - Docker Engine (Linux): https://docs.docker.com/engine/install/
- **Git** (to clone the repository)
- **8GB RAM minimum** (for all services)

---

## 🚀 Getting Started

### 1. Navigate to Project Directory

```bash
cd /path/to/VibeApp
```

### 2. Clean Up Old Containers (if any)

```bash
# Stop and remove old containers
docker compose down -v

# Or if using older docker-compose
docker-compose down -v
```

### 3. Build and Start Services

```bash
# Build and start all services
docker compose up -d --build

# Monitor the logs
docker compose logs -f
```

**Expected Services:**
- `avanza-stock-finder-db` - PostgreSQL database (port 5432)
- `avanza-stock-finder-redis` - Redis cache (port 6379)
- `avanza-stock-finder-backend` - FastAPI backend (port 8000)
- `avanza-stock-finder-frontend` - React frontend (port 3000)

### 4. Wait for Services to be Healthy

```bash
# Check service status
docker compose ps

# All services should show "healthy" status
# This usually takes 30-60 seconds
```

**Troubleshooting:** If services fail to start, check logs:
```bash
docker compose logs backend
docker compose logs db
docker compose logs redis
docker compose logs frontend
```

### 5. Verify Services

#### Test Backend API

```bash
# Health check
curl http://localhost:8000/health

# Expected response:
# {"status": "healthy"}
```

#### Test AI Endpoints

```bash
# AI health check
curl http://localhost:8000/api/ai/health

# Expected response:
# {
#   "status": "healthy",
#   "service": "AI API",
#   "endpoints_available": [...],
#   "message": "AI endpoints are ready (implementations in progress)"
# }
```

#### Test Frontend

Open browser and navigate to:
- **Frontend:** http://localhost:3000
- **Backend API Docs:** http://localhost:8000/docs
- **Alternative API Docs:** http://localhost:8000/redoc

You should see the "Avanza Stock Finder - Coming Soon" page.

### 6. Test Python AI Client

```bash
# Enter backend container
docker compose exec backend python

# In Python REPL:
>>> from app.ai_client import get_client
>>> client = get_client()
>>> health = client.health_check()
>>> print(health)
{'status': 'healthy'}
>>> exit()
```

---

## 🧪 Common Commands

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f db
docker compose logs -f redis
docker compose logs -f frontend
```

### Restart Services

```bash
# Restart all
docker compose restart

# Restart specific service
docker compose restart backend
```

### Stop Services

```bash
# Stop but keep data
docker compose stop

# Stop and remove containers (keeps volumes)
docker compose down

# Stop and remove everything including data
docker compose down -v
```

### Rebuild After Code Changes

```bash
# Backend changes
docker compose up -d --build backend

# Frontend changes
docker compose up -d --build frontend

# Rebuild everything
docker compose up -d --build
```

### Enter Container Shell

```bash
# Backend
docker compose exec backend bash

# Database
docker compose exec db psql -U stockfinder -d stockfinder_db

# Redis
docker compose exec redis redis-cli
```

---

## 🔍 Verification Checklist

After starting services, verify:

- [ ] **Database** is accessible: `docker compose exec db pg_isready -U stockfinder`
- [ ] **Redis** is accessible: `docker compose exec redis redis-cli ping` (should return "PONG")
- [ ] **Backend** is accessible: `curl http://localhost:8000/health`
- [ ] **AI Endpoints** are accessible: `curl http://localhost:8000/api/ai/health`
- [ ] **Frontend** loads in browser: http://localhost:3000
- [ ] **API Docs** load in browser: http://localhost:8000/docs
- [ ] **Python Client** works: See step 6 above

---

## 🐛 Troubleshooting

### Port Already in Use

If you see errors like "port 5432 already in use":

```bash
# Find what's using the port
lsof -i :5432  # Mac/Linux
netstat -ano | findstr :5432  # Windows

# Stop the conflicting service or change ports in docker-compose.yml
```

### Database Connection Failed

```bash
# Check if database is ready
docker compose logs db

# Wait for: "database system is ready to accept connections"

# Test connection
docker compose exec db psql -U stockfinder -d stockfinder_db -c "SELECT 1;"
```

### Backend Won't Start

```bash
# Check logs
docker compose logs backend

# Common issues:
# 1. Database not ready -> Wait longer, check db logs
# 2. Python errors -> Check if requirements.txt changed, rebuild
# 3. Port in use -> Change port in docker-compose.yml
```

### Frontend Won't Build

```bash
# Check logs
docker compose logs frontend

# Common issues:
# 1. Node modules issue -> Remove node_modules, rebuild
# 2. Vite errors -> Check frontend code syntax
# 3. Environment variables -> Check .env file
```

### Out of Memory

If services crash due to memory:

```bash
# Increase Docker memory limit (Docker Desktop)
# Settings > Resources > Memory > 8GB+

# Or run services separately
docker compose up -d db redis backend
# Frontend can run locally: cd frontend && npm run dev
```

---

## 🔧 Development Workflow

### Making Backend Changes

1. Edit code in `/backend/app/`
2. Changes auto-reload (if DEBUG=True)
3. No need to restart unless:
   - Changed requirements.txt → `docker compose up -d --build backend`
   - Changed Dockerfile → `docker compose up -d --build backend`

### Making Frontend Changes

1. Edit code in `/frontend/src/`
2. Changes auto-reload via Vite HMR
3. Browser refreshes automatically

### Database Migrations

```bash
# Create a new migration
docker compose exec backend alembic revision --autogenerate -m "Description"

# Apply migrations
docker compose exec backend alembic upgrade head

# Rollback
docker compose exec backend alembic downgrade -1
```

### Running Tests

```bash
# Backend tests
docker compose exec backend pytest

# With coverage
docker compose exec backend pytest --cov=app --cov-report=html

# Frontend tests (when added)
docker compose exec frontend npm test
```

---

## 📊 Database Access

### Using psql (PostgreSQL CLI)

```bash
# Connect to database
docker compose exec db psql -U stockfinder -d stockfinder_db

# In psql:
\dt                    # List tables
\d stocks             # Describe stocks table
SELECT * FROM stocks LIMIT 10;
\q                    # Quit
```

### Using Redis CLI

```bash
# Connect to Redis
docker compose exec redis redis-cli

# In redis-cli:
PING                  # Should return PONG
KEYS *               # List all keys
GET some_key         # Get value
EXIT                 # Quit
```

---

## 🌐 Access Points Summary

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | React web application |
| Backend API | http://localhost:8000 | FastAPI REST API |
| API Docs (Swagger) | http://localhost:8000/docs | Interactive API documentation |
| API Docs (ReDoc) | http://localhost:8000/redoc | Alternative API documentation |
| PostgreSQL | localhost:5432 | Database (user: stockfinder, db: stockfinder_db) |
| Redis | localhost:6379 | Cache server |

---

## 📚 Next Steps

Once services are running:

1. **Read AI_USAGE.md** - Learn how to use the AI client
2. **Read PROJECT_PLAN.md** - Understand the full architecture
3. **Explore API Docs** - http://localhost:8000/docs
4. **Test AI Client** - Follow AI_USAGE.md examples
5. **Review Code** - Explore `/backend/app/` and `/frontend/src/`

---

## 🆘 Need Help?

- Check **AI_USAGE.md** for AI client examples
- Check **PROJECT_PLAN.md** for architecture details
- View logs: `docker compose logs -f`
- Restart services: `docker compose restart`
- Clean slate: `docker compose down -v && docker compose up -d --build`

---

**Last Updated:** 2025-10-23
**Phase:** 0 - AI Infrastructure Complete
**Next Phase:** 1 - Data Foundation (Avanza Integration)

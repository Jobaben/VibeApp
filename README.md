# VibeApp

A modern social media application built with Python FastAPI backend and React frontend, following feature-based Clean Architecture principles.

## Project Structure

This project follows a feature-based architecture where each feature is self-contained with its own:
- Models (Entities)
- Schemas (DTOs)
- Commands & Queries (CQRS pattern)
- Services (Business logic)
- Repositories (Data access)
- Routes (API endpoints)

```
VibeApp/
├── backend/                 # Python FastAPI backend
│   ├── app/
│   │   ├── features/       # Feature modules
│   │   │   ├── vibes/      # Vibes feature (fully implemented)
│   │   │   ├── users/      # Users feature
│   │   │   ├── auth/       # Authentication feature
│   │   │   ├── social/     # Social interactions feature
│   │   │   ├── notifications/
│   │   │   └── media/
│   │   ├── shared/         # Shared utilities
│   │   │   ├── models/     # Base models
│   │   │   ├── exceptions/ # Custom exceptions
│   │   │   └── middleware/
│   │   └── infrastructure/ # Database & repositories
│   ├── tests/              # Test suite
│   └── main.py            # Application entry point
│
├── frontend/               # React + TypeScript frontend
│   ├── src/
│   │   ├── features/       # Feature components
│   │   ├── components/     # Shared components
│   │   ├── services/       # API services
│   │   ├── types/         # TypeScript types
│   │   └── hooks/         # Custom React hooks
│   └── public/
│
└── docs/                   # Documentation
```

## Features

- **Vibes** (✅ Implemented) - Create and share vibes (text, image, video, audio)
- **Users** - User management
- **Authentication** - JWT-based authentication
- **Social** - Follow/unfollow, like, comment
- **Notifications** - Real-time notifications
- **Media** - File upload and management

## Tech Stack

### Backend
- **Python 3.11**
- **FastAPI** - Modern async web framework
- **SQLAlchemy** - ORM for database operations
- **PostgreSQL** - Primary database
- **Pydantic** - Data validation
- **Alembic** - Database migrations
- **JWT** - Authentication

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **React Query** - Data fetching

## Getting Started

### Prerequisites

- Docker & Docker Compose (recommended)
- Or: Python 3.11+, Node.js 22+, PostgreSQL 16

### Quick Start with Docker

1. Clone the repository:
```bash
git clone <repository-url>
cd VibeApp
```

2. Start all services with Docker Compose:
```bash
docker compose up -d
```

3. Access the application:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

### Manual Setup (Without Docker)

#### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

5. Run the backend:
```bash
python main.py
# Or with uvicorn:
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env to set VITE_API_URL
```

4. Run the frontend:
```bash
npm run dev
```

## API Documentation

Once the backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Example API Endpoints

#### Vibes
- `POST /api/vibes/` - Create a new vibe
- `GET /api/vibes/{id}` - Get a vibe by ID
- `GET /api/vibes/user/{user_id}` - Get vibes by user
- `GET /api/vibes/trending/` - Get trending vibes

## Architecture Patterns

### CQRS (Command Query Responsibility Segregation)
- **Commands**: Write operations (Create, Update, Delete)
- **Queries**: Read operations (Get, List, Search)

### Repository Pattern
- Abstraction layer between business logic and data access
- Each feature has its own repository

### Result Pattern
- Consistent API responses
- Error handling with typed error states

### Feature-Based Organization
- Each feature is self-contained
- Easy to add, modify, or remove features
- Clear separation of concerns

## Development

### Running Tests

Backend tests:
```bash
cd backend
pytest
pytest --cov=app tests/  # With coverage
```

Frontend tests:
```bash
cd frontend
npm test
```

### Code Quality

Backend:
```bash
cd backend
black .           # Format code
flake8 .          # Lint code
mypy .            # Type checking
```

Frontend:
```bash
cd frontend
npm run lint      # ESLint
```

### Database Migrations

Create a new migration:
```bash
cd backend
alembic revision --autogenerate -m "Description"
```

Apply migrations:
```bash
alembic upgrade head
```

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://vibeapp:vibeapp123@localhost:5432/vibeapp_db
SECRET_KEY=your-secret-key-change-in-production
DEBUG=True
CORS_ORIGINS=http://localhost:3000
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:8000/api
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Write tests
4. Run linters and tests
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ using Python FastAPI & React

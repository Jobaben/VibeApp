# VibeApp - Project Structure Snapshot

**Generated:** 2025-10-22
**Architecture:** Feature-Based / Vertical Slice Architecture
**Framework:** .NET 8.0

---

## Complete Folder Structure

```
VibeApp/
├── .github/
│   └── workflows/
│       ├── ci.yml                              # Continuous Integration workflow
│       └── cd.yml                              # Continuous Deployment workflow
│
├── docs/                                        # Documentation
│   ├── architecture/
│   │   ├── overview.md                         # Architecture overview
│   │   └── feature-structure.md               # Feature-based structure guide
│   ├── features/                               # Feature documentation
│   │   ├── users.md                            # Users feature docs
│   │   ├── vibes.md                            # Vibes feature docs
│   │   └── authentication.md                  # Authentication docs
│   └── api/
│       └── endpoints.md                        # API endpoints documentation
│
├── scripts/                                     # Build & deployment scripts
│   ├── build.sh                                # Build script
│   ├── deploy.sh                               # Deployment script
│   └── seed-data.sql                           # Database seeding SQL
│
├── src/                                         # Source code
│   └── VibeApp.API/                            # Main API project
│       │
│       ├── Features/                            # ALL FEATURES (Self-contained)
│       │   │
│       │   ├── Users/                          # User management feature
│       │   │   ├── Entities/                   # User domain entities
│       │   │   ├── DTOs/                       # User DTOs (Request/Response)
│       │   │   ├── Commands/                   # CQRS Commands (Create, Update, Delete)
│       │   │   ├── Queries/                    # CQRS Queries (Get, List, Search)
│       │   │   ├── Validators/                 # FluentValidation validators
│       │   │   ├── Mappings/                   # AutoMapper profiles
│       │   │   ├── Services/                   # User-specific services
│       │   │   ├── UsersController.cs          # Users API endpoints
│       │   │   ├── IUserRepository.cs          # User repository interface
│       │   │   └── UserRepository.cs           # User repository implementation
│       │   │
│       │   ├── Authentication/                 # Authentication & authorization
│       │   │   ├── Entities/                   # Auth-related entities
│       │   │   ├── DTOs/                       # Login, Register DTOs
│       │   │   ├── Commands/                   # Login, Register, RefreshToken commands
│       │   │   ├── Queries/                    # Auth queries
│       │   │   ├── Validators/                 # Auth validators
│       │   │   ├── Mappings/                   # Auth mappings
│       │   │   ├── Services/                   # JWT service, password hasher, etc.
│       │   │   ├── AuthenticationController.cs # Auth API endpoints
│       │   │   └── AuthenticationExtensions.cs # Auth service extensions
│       │   │
│       │   ├── Vibes/                          # Core Vibe feature
│       │   │   ├── Entities/                   # Vibe domain entities
│       │   │   ├── DTOs/                       # Vibe DTOs
│       │   │   ├── Commands/                   # CreateVibe, UpdateVibe, DeleteVibe
│       │   │   ├── Queries/                    # GetVibe, ListVibes, SearchVibes
│       │   │   ├── Validators/                 # Vibe validators
│       │   │   ├── Mappings/                   # Vibe mappings
│       │   │   ├── Services/                   # Vibe-specific services
│       │   │   ├── VibesController.cs          # Vibes API endpoints
│       │   │   ├── IVibeRepository.cs          # Vibe repository interface
│       │   │   └── VibeRepository.cs           # Vibe repository implementation
│       │   │
│       │   ├── Social/                         # Social interactions (Follows, Likes, Comments)
│       │   │   ├── Entities/                   # Follow, Like, Comment entities
│       │   │   ├── DTOs/                       # Social DTOs
│       │   │   ├── Commands/                   # Follow, Unfollow, Like, Comment commands
│       │   │   ├── Queries/                    # Social queries
│       │   │   ├── Validators/                 # Social validators
│       │   │   ├── Mappings/                   # Social mappings
│       │   │   ├── Services/                   # Social-specific services
│       │   │   ├── SocialController.cs         # Social API endpoints
│       │   │   └── SocialRepository.cs         # Social repository
│       │   │
│       │   ├── Notifications/                  # Notification system
│       │   │   ├── Entities/                   # Notification entities
│       │   │   ├── DTOs/                       # Notification DTOs
│       │   │   ├── Commands/                   # SendNotification, MarkAsRead commands
│       │   │   ├── Queries/                    # GetNotifications queries
│       │   │   ├── Validators/                 # Notification validators
│       │   │   ├── Mappings/                   # Notification mappings
│       │   │   ├── Services/                   # Email service, Push notification service
│       │   │   ├── NotificationsController.cs  # Notifications API endpoints
│       │   │   └── NotificationRepository.cs   # Notification repository
│       │   │
│       │   └── Media/                          # File/media management
│       │       ├── Entities/                   # Media file entities
│       │       ├── DTOs/                       # Media DTOs
│       │       ├── Commands/                   # UploadMedia, DeleteMedia commands
│       │       ├── Queries/                    # GetMedia queries
│       │       ├── Validators/                 # Media validators
│       │       ├── Mappings/                   # Media mappings
│       │       ├── Services/                   # Storage service (Azure/AWS/local)
│       │       ├── MediaController.cs          # Media API endpoints
│       │       └── MediaRepository.cs          # Media repository
│       │
│       ├── Shared/                             # Shared across ALL features
│       │   │
│       │   ├── Common/                         # Common base classes & interfaces
│       │   │   ├── Interfaces/
│       │   │   │   ├── IEntity.cs              # Base entity interface
│       │   │   │   ├── IRepository.cs          # Generic repository interface
│       │   │   │   └── IUnitOfWork.cs          # Unit of work interface
│       │   │   ├── BaseEntity.cs               # Base entity class
│       │   │   ├── BaseController.cs           # Base controller class
│       │   │   └── Result.cs                   # Result pattern for responses
│       │   │
│       │   ├── Behaviors/                      # MediatR pipeline behaviors
│       │   │   ├── ValidationBehavior.cs       # Automatic validation
│       │   │   ├── LoggingBehavior.cs          # Request/response logging
│       │   │   └── TransactionBehavior.cs      # Transaction management
│       │   │
│       │   ├── Exceptions/                     # Global exception types
│       │   │   ├── NotFoundException.cs        # 404 exceptions
│       │   │   ├── ValidationException.cs      # Validation exceptions
│       │   │   └── UnauthorizedException.cs    # 401 exceptions
│       │   │
│       │   ├── Middleware/                     # Global middleware
│       │   │   ├── ExceptionMiddleware.cs      # Global exception handling
│       │   │   └── CorrelationIdMiddleware.cs  # Request correlation IDs
│       │   │
│       │   ├── Extensions/                     # Extension methods
│       │   │   ├── ServiceCollectionExtensions.cs  # DI extensions
│       │   │   └── ApplicationBuilderExtensions.cs # Middleware extensions
│       │   │
│       │   └── Constants/                      # Application-wide constants
│       │       ├── AppConstants.cs             # General constants
│       │       └── ErrorMessages.cs            # Error message constants
│       │
│       ├── Infrastructure/                     # Infrastructure concerns
│       │   ├── Data/                           # Database context & factory
│       │   │   ├── Migrations/                 # EF Core migrations
│       │   │   ├── ApplicationDbContext.cs     # Main DbContext
│       │   │   └── DbContextFactory.cs         # DbContext factory
│       │   │
│       │   ├── Configurations/                 # EF Core entity configurations
│       │   │   ├── UserConfiguration.cs        # User entity config
│       │   │   ├── VibeConfiguration.cs        # Vibe entity config
│       │   │   └── ...                         # Other entity configs
│       │   │
│       │   └── Seed/                           # Database seeding
│       │       └── DataSeeder.cs               # Seed data logic
│       │
│       ├── Program.cs                          # Application entry point
│       ├── appsettings.json                    # Configuration
│       ├── appsettings.Development.json        # Development config
│       └── VibeApp.API.csproj                  # Project file
│
├── tests/                                       # All test projects
│   │
│   ├── VibeApp.Tests.Unit/                    # Unit tests
│   │   ├── Features/                           # Mirror feature structure
│   │   │   ├── Users/
│   │   │   │   ├── Commands/                   # User command tests
│   │   │   │   └── Queries/                    # User query tests
│   │   │   ├── Vibes/
│   │   │   │   ├── Commands/                   # Vibe command tests
│   │   │   │   └── Queries/                    # Vibe query tests
│   │   │   └── Authentication/
│   │   │       ├── Commands/                   # Auth command tests
│   │   │       └── Queries/                    # Auth query tests
│   │   └── VibeApp.Tests.Unit.csproj           # Unit test project file
│   │
│   ├── VibeApp.Tests.Integration/             # Integration tests
│   │   ├── Features/
│   │   │   ├── Users/
│   │   │   │   ├── Commands/
│   │   │   │   └── Queries/
│   │   │   ├── Vibes/
│   │   │   │   ├── Commands/
│   │   │   │   └── Queries/
│   │   │   └── Authentication/
│   │   │       ├── Commands/
│   │   │       └── Queries/
│   │   ├── Infrastructure/                     # Infrastructure tests
│   │   └── VibeApp.Tests.Integration.csproj    # Integration test project file
│   │
│   └── VibeApp.Tests.Functional/              # E2E/API tests
│       ├── Features/
│       │   ├── Users/
│       │   │   ├── Commands/
│       │   │   └── Queries/
│       │   ├── Vibes/
│       │   │   ├── Commands/
│       │   │   └── Queries/
│       │   └── Authentication/
│       │       ├── Commands/
│       │       └── Queries/
│       └── VibeApp.Tests.Functional.csproj     # Functional test project file
│
├── .gitignore                                   # Git ignore rules
├── LICENSE                                      # Apache 2.0 License
├── README.md                                    # Project README
├── VibeApp.sln                                 # Solution file
├── global.json                                 # .NET SDK version
└── STRUCTURE_SNAPSHOT.md                       # This file

```

---

## Feature Pattern (Vertical Slice)

Each feature follows this **consistent pattern**:

```
Features/[FeatureName]/
├── Entities/           # Domain models/entities
├── DTOs/              # Data Transfer Objects (Request/Response models)
├── Commands/          # CQRS Write operations
│   ├── Create[Entity]Command.cs
│   ├── Create[Entity]CommandHandler.cs
│   ├── Update[Entity]Command.cs
│   ├── Update[Entity]CommandHandler.cs
│   ├── Delete[Entity]Command.cs
│   └── Delete[Entity]CommandHandler.cs
├── Queries/           # CQRS Read operations
│   ├── Get[Entity]Query.cs
│   ├── Get[Entity]QueryHandler.cs
│   ├── List[Entity]Query.cs
│   └── List[Entity]QueryHandler.cs
├── Validators/        # FluentValidation validators
├── Mappings/          # AutoMapper mapping profiles
├── Services/          # Feature-specific business logic services
├── [FeatureName]Controller.cs      # API endpoints
├── I[FeatureName]Repository.cs     # Repository interface
└── [FeatureName]Repository.cs      # Repository implementation
```

---

## Key Architecture Principles

### 1. Feature Independence
- Each feature is **self-contained** with all its layers
- Features can be developed, tested, and deployed **independently**
- Minimal coupling between features

### 2. CQRS Pattern
- **Commands**: Write operations (Create, Update, Delete)
- **Queries**: Read operations (Get, List, Search)
- Clear separation of concerns

### 3. Dependency Flow
```
Controller → MediatR → Command/Query Handler → Repository → DbContext
```

### 4. Shared Components
- Common base classes and interfaces in `Shared/Common/`
- MediatR behaviors for cross-cutting concerns
- Global middleware for request/response handling
- Exception types for error handling

### 5. Infrastructure Layer
- `ApplicationDbContext`: Single DbContext for all features
- Entity configurations in separate files
- Migrations managed centrally
- Seeding logic for development/testing

---

## Technology Stack

- **.NET 8.0**: Framework
- **ASP.NET Core Web API**: API layer
- **Entity Framework Core**: ORM
- **MediatR**: CQRS implementation
- **FluentValidation**: Request validation
- **AutoMapper**: Object-to-object mapping
- **Serilog**: Logging (to be configured)

---

## Project References

```
VibeApp.Tests.Unit          → VibeApp.API
VibeApp.Tests.Integration   → VibeApp.API
VibeApp.Tests.Functional    → VibeApp.API
```

---

## Feature Dependencies (Conceptual)

```
Authentication
    ↓
Users ← Social
    ↓      ↓
  Vibes ← Notifications
    ↑
  Media
```

---

## Current Features

1. **Users**: User management (profile, settings)
2. **Authentication**: Login, register, JWT tokens
3. **Vibes**: Core vibe creation and management
4. **Social**: Follows, likes, comments
5. **Notifications**: Email, push, in-app notifications
6. **Media**: File upload, storage, retrieval

---

## Guidelines for Development

### When Adding a New Feature:
1. Create folder under `src/VibeApp.API/Features/[FeatureName]/`
2. Follow the feature pattern structure
3. Create entities in `Entities/`
4. Create DTOs in `DTOs/`
5. Create commands in `Commands/` with handlers
6. Create queries in `Queries/` with handlers
7. Add validators in `Validators/`
8. Add mappings in `Mappings/`
9. Create controller in root of feature folder
10. Create repository interface and implementation
11. Add entity configuration in `Infrastructure/Configurations/`
12. Create corresponding tests in `tests/` folders

### When Adding Shared Functionality:
- Base classes → `Shared/Common/`
- MediatR behaviors → `Shared/Behaviors/`
- Exceptions → `Shared/Exceptions/`
- Middleware → `Shared/Middleware/`
- Extensions → `Shared/Extensions/`
- Constants → `Shared/Constants/`

### When Modifying Infrastructure:
- DbContext changes → `Infrastructure/Data/ApplicationDbContext.cs`
- Entity configs → `Infrastructure/Configurations/`
- Migrations → `Infrastructure/Data/Migrations/`
- Seeding → `Infrastructure/Seed/`

---

## Notes

- All features use **MediatR** for CQRS
- All validation uses **FluentValidation**
- All mapping uses **AutoMapper**
- Repository pattern is used for data access
- Controllers are thin and delegate to MediatR handlers
- Business logic lives in Command/Query handlers
- Unit of Work pattern is available via `IUnitOfWork`

---

**End of Structure Snapshot**

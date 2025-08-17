# Docker Setup for SlyFox Studios

This guide explains how to set up and run the SlyFox Studios application using Docker, enabling seamless development across Intel and Apple Silicon devices via Dropbox synchronization.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose (included with Docker Desktop)
- Dropbox synchronization for cross-device development

## Quick Start

### Development Mode

```bash
# Start the full development environment
npm run docker:dev

# Initialize database schema (first time only)
docker exec sfweb-app npm run db:push

# Or manually:
docker-compose up --build
```

This will start:
- PostgreSQL database on port 5432
- SlyFox Studios app on port 5000 (with hot reload)
- Adminer database management on port 8080

### Production Mode

```bash
# Start production environment
npm run docker:prod

# Or manually:
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build
```

## Available Docker Commands

```bash
# Development
npm run docker:dev          # Start development environment
npm run docker:db           # Start only database and adminer
npm run docker:logs         # View application logs
npm run docker:shell        # Access container shell

# Management
npm run docker:down         # Stop all containers
npm run docker:clean        # Stop containers and clean up volumes/images
npm run docker:build        # Build application image only

# Production
npm run docker:prod         # Start production environment
```

## Environment Configuration

### Required Environment Variables

Create a `.env` file in the project root with:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres_password@postgres:5432/slyfox_studios

# Supabase Configuration
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Optional: Node Environment
NODE_ENV=development
```

### Development vs Production

**Development Mode:**
- Hot reload enabled
- Source code mounted as volume
- Adminer database interface available
- Development dependencies included

**Production Mode:**
- Optimized build
- No source code mounting
- No development tools
- Smaller container footprint

## Cross-Platform Compatibility

The Docker setup is specifically configured for cross-platform development:

### Architecture Support
- **Intel (x86_64)**: Native support
- **Apple Silicon (ARM64)**: Native support via multi-platform builds
- **Platform specification**: `linux/amd64` ensures consistency across devices

### Dropbox Synchronization
- All source code changes are synchronized via Dropbox
- Docker volumes handle `node_modules` and build artifacts
- Database data persists in Docker volumes (not synchronized)

## Database Management

### Accessing the Database

**Via Adminer (Development):**
- URL: http://localhost:8080
- System: PostgreSQL
- Server: postgres
- Username: postgres
- Password: postgres_password
- Database: slyfox_studios

**Via Command Line:**
```bash
# Access PostgreSQL directly
docker-compose exec postgres psql -U postgres -d slyfox_studios

# Run database migrations
docker-compose exec app npm run db:push
```

### Database Persistence
- Database data is stored in a Docker volume `postgres_data`
- Data persists between container restarts
- Use `npm run docker:clean` to reset database (destructive)

## Development Workflow

### Starting Development
1. Sync project via Dropbox to your device
2. Run `npm run docker:dev`
3. Access application at http://localhost:3000
4. Make code changes (automatically reloaded)

### Switching Devices
1. Ensure Dropbox sync is complete
2. On new device: `npm run docker:dev`
3. Continue development seamlessly

### Troubleshooting

**Port Conflicts:**
```bash
# Check what's using ports
lsof -i :5000
lsof -i :5432
lsof -i :8080

# Stop containers and restart
npm run docker:down
npm run docker:dev
```

**Build Issues:**
```bash
# Clean everything and rebuild
npm run docker:clean
npm run docker:dev
```

**Platform Issues (Apple Silicon):**
```bash
# Force platform specification
docker-compose up --build --platform linux/amd64
```

**Volume Issues:**
```bash
# Reset all data (destructive)
npm run docker:clean

# Or manually remove volumes
docker volume ls
docker volume rm sfweb_postgres_data
```

## File Structure

```
sfweb/
├── Dockerfile                 # Multi-stage application build
├── docker-compose.yml         # Development environment
├── docker-compose.prod.yml    # Production overrides
├── .dockerignore              # Files excluded from build
├── .env                       # Environment variables (create this)
└── DOCKER_SETUP.md           # This guide
```

## Advanced Usage

### Custom Network
The setup creates a custom network `sfweb-network` for service communication.

### Health Checks
PostgreSQL includes health checks to ensure proper startup ordering.

### Volume Mounting
- Development: Source code mounted for hot reload
- Production: Code copied into container
- Database: Persistent volume for data storage

### Multi-Platform Builds
```bash
# Build for specific platform
docker buildx build --platform linux/amd64,linux/arm64 -t sfweb .

# Check platform
docker image inspect sfweb | grep Architecture
```

## Security Considerations

- Default passwords are for development only
- Change all credentials for production deployment
- Environment variables should be properly secured
- Database port exposure is for development convenience

## Performance Tips

1. **Development:**
   - Use volume mounting for fast iteration
   - Enable Docker BuildKit for faster builds
   - Consider using Docker Desktop's file sharing optimization

2. **Production:**
   - Use multi-stage builds to minimize image size
   - Leverage Docker layer caching
   - Consider using a production database service

## Monitoring and Logs

```bash
# View all logs
docker-compose logs

# Follow app logs
npm run docker:logs

# View specific service logs
docker-compose logs postgres
docker-compose logs app

# View container stats
docker stats
```
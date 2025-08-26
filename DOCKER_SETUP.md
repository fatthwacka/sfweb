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

## VPS Production Deployment

The application is deployed on a VPS at **vps.netfox.co.za (168.231.86.89)** alongside other services.

### Production Environment Details

**VPS Configuration:**
- **IP**: 168.231.86.89
- **Hostname**: vps.netfox.co.za
- **OS**: Ubuntu 24.04 LTS
- **Resources**: 3.8GB RAM, 1 CPU core, 48GB storage

**Application Stack:**
- **SlyFox Studios**: http://168.231.86.89:3000
- **N8N Automation**: http://168.231.86.89:5678
- **Traefik Proxy**: Ports 80/443 (SSL termination)
- **PostgreSQL**: Port 5432 (SlyFox database)

### Production Deployment Commands

```bash
# Deploy to VPS (from local development)
# 1. Sync code to VPS via git or file transfer
# 2. Connect to VPS
ssh root@168.231.86.89

# 3. Navigate to application directory
cd /opt/sfweb

# 4. Deploy/update application
docker-compose down
docker-compose up -d --build

# Monitor deployment
docker logs sfweb-app --tail 50 -f
```

### Production File Structure on VPS

```
/opt/sfweb/                    # SlyFox application
├── docker-compose.yml         # Production Docker setup
├── Dockerfile                 # Application container
├── .env                      # Production environment variables
├── package.json              # Dependencies
├── client/                   # React frontend
├── server/                   # Express backend
├── shared/                   # Shared types
└── public/                   # Static assets

/root/                        # System services
├── docker-compose.yml        # Traefik + N8N
├── .env                      # N8N configuration
└── traefik-certs.yml         # SSL configuration
```

### Production Monitoring

```bash
# Check all running containers
docker ps

# Monitor resource usage
docker stats --no-stream

# View application logs
docker logs sfweb-app --tail 20
docker logs sfweb-postgres --tail 20

# Check system resources
free -h
df -h

# Test application connectivity
curl -I http://localhost:3000
curl -I http://168.231.86.89:3000
```

### Production vs Development Differences

| Aspect | Development | Production |
|--------|-------------|------------|
| **Location** | Local (Dropbox sync) | VPS (/opt/sfweb) |
| **Access** | http://localhost:3000 | http://168.231.86.89:3000 |
| **Database** | Local PostgreSQL | VPS PostgreSQL |
| **SSL** | None | Traefik + Let's Encrypt |
| **Environment** | .env (local) | .env (production) |
| **Hot Reload** | Enabled | Disabled |
| **Volume Mounting** | Source code mounted | Code copied to container |

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

### File Synchronization
- Source code synchronized via Dropbox (see DEV_SERVER_STARTUP.md for complete file structure)
- Docker volumes handle `node_modules` and build artifacts locally
- Database data persists in Docker volumes (device-specific)

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
1. Ensure Dropbox sync is complete (see DEV_SERVER_STARTUP.md for platform-specific paths)
2. Run `npm run docker:dev`
3. Access application at http://localhost:3000
4. Make code changes (automatically reloaded)

### Switching Devices
1. Ensure Dropbox sync is complete
2. On new device: `npm run docker:dev` (rebuilds containers automatically)
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
# 🛒 Shopping List App – CI/CD with Docker Compose

A complete CI/CD pipeline for a professionally developed web service: a "Shopping List App" with FastAPI backend, Next.js frontend, and MongoDB authentication, deployed via Docker Compose.

## 🎯 Project Overview

This application demonstrates:

- **DevOps Skills**: CI/CD, Docker Compose, Automated Deployment
- **Full-Stack Development**: FastAPI + Next.js
- **Database**: MongoDB with JWT Authentication
- **Containerization**: Docker
- **Best Practices**: Automated deployment, Security, Health checks

## 🏗️ Architecture

```
                User
                 ↓
         Cloud Server (Docker Host)
             ↙       ↓       ↘
        MongoDB   FastAPI   Next.js
       (Database)  (API)   (Frontend)
                     ↓
                 JWT Auth
                (Sessions)
```

## 🚀 Quick Start (Local Development)

### Prerequisites

- Docker Desktop
- Node.js 18+ (for local development)
- Python 3.9+ (for local development)
- Git

### Local Setup

```bash
# 1. Start local development (MongoDB, Backend, Frontend)
docker-compose up -d

# 2. Access the application
# Frontend: http://localhost:3135
# Backend API: http://localhost:8185
# API Docs: http://localhost:8185/docs
# MongoDB: localhost:27888
```

### 🔐 Admin Login Credentials

```
Username: mjshp
Password: 125C4A$A978#D1D502041A551ED7FCA7BAEF
```

**⚠️ Important**: These credentials are configured via environment variables for security!

## 📁 Project Structure

```
.
├── backend/               # FastAPI App
│   ├── main.py           # Main API with authentication
│   ├── auth.py           # JWT authentication logic
│   ├── database.py       # MongoDB connection
│   ├── models.py         # Pydantic models
│   └── requirements.txt
├── frontend/              # Next.js App
│   ├── app/              # App routes
│   │   ├── page.tsx     # Main shopping list
│   │   ├── login/       # Login page
│   │   └── admin/       # Admin dashboard
│   ├── contexts/         # Auth context
│   └── lib/              # Auth utilities
├── docker-compose.yml     # Local development
├── docker-compose.prod.yml # Production deployment
├── .github/workflows/     # GitHub Actions CI/CD
└── README.md
```

## 🛠️ Technology Stack

- **Backend**: FastAPI (Python) with JWT Authentication
- **Frontend**: Next.js 14 (React)
- **Database**: MongoDB 7
- **Containerization**: Docker & Docker Compose
- **CI/CD**: GitHub Actions
- **Authentication**: JWT tokens with bcrypt password hashing
- **Container Registry**: Docker Hub

## 🌐 Deployment

### Local Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Deployment (Automated via CI/CD)

The application automatically deploys to your cloud server when you push to the `main` or `compose` branch.

#### Required GitHub Secrets

Configure these secrets in your GitHub repository (Settings → Secrets and variables → Actions):

**Docker Hub Credentials:**

- `DOCKER_HUB_USERNAME` - Your Docker Hub username
- `DOCKER_HUB_PASSWORD` - Your Docker Hub password/token

**Server Connection:**

- `SERVER_HOST` - Your cloud server IP or hostname
- `SERVER_USERNAME` - SSH username (e.g., root, ubuntu)
- `SERVER_SSH_KEY` - Private SSH key for server access
- `SERVER_PORT` - SSH port (default: 22)

**Application Secrets:**

- `MONGODB_ROOT_PASSWORD` - MongoDB admin password (45ABB#DBD9!C42A9C78286B25BCE8FBCAB)
- `JWT_SECRET_KEY` - Secret key for JWT token generation
- `ADMIN_USERNAME` - Admin username (mjshp)
- `ADMIN_PASSWORD` - Admin password (125C4A$A978#D1D502041A551ED7FCA7BAEF)
- `S3_BUCKET` - (Optional) S3 bucket name for backups

#### CI/CD Pipeline Flow

1. **Build Stage**: Builds Docker images for backend and frontend
2. **Push Stage**: Pushes images to Docker Hub
3. **Deploy Stage**:
   - Copies docker-compose.prod.yml to server
   - Pulls latest images
   - Stops old containers
   - Starts new containers
   - Verifies deployment

#### Manual Deployment (One Command)

If you need to deploy manually:

```bash
# On your cloud server
cd /opt/shopping-list
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

## 📚 API Endpoints

### Authentication

- `POST /auth/login` - User login (returns JWT token)
- `GET /auth/me` - Get current user info

### Admin (requires admin role)

- `GET /admin/users` - List all users
- `POST /admin/users` - Create new user
- `PUT /admin/users/{user_id}` - Update user (password, admin status)
- `DELETE /admin/users/{user_id}` - Delete user

### Shopping Lists (requires authentication)

- `GET /api/lists` - Get all user's shopping lists
- `POST /api/lists` - Create new shopping list
- `GET /api/list` - Get items from a list
- `POST /api/add` - Add item to list
- `PUT /api/toggle/{item_id}` - Toggle item completion
- `DELETE /api/remove/{item_id}` - Remove item
- `GET /api/defaults` - Get default items

## 🔐 Authentication & User Management

### User Roles

1. **Admin**: Can access admin dashboard to create/manage users
2. **User**: Can only manage their own shopping lists

### Admin Dashboard

Access the admin dashboard at `/admin` (admin login required):

- Create new users with username/password
- Toggle admin privileges
- Reset user passwords
- Delete users
- View all registered users

### User Features

Each user has:

- Private shopping lists (isolated from other users)
- Secure password storage (bcrypt hashing)
- JWT-based session management
- Automatic logout on token expiration

## 🔍 Monitoring & Health Checks

All services include health checks:

- **MongoDB**: Responds to ping command
- **Backend**: Health endpoint at `/health`
- **Frontend**: HTTP health check on port 3135

View service status:

```bash
# On your server
cd /opt/shopping-list
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f
```

## 🧹 Cleanup

### Local Development

```bash
# Stop and remove containers
docker-compose down

# Remove volumes (optional - will delete all data including MongoDB)
docker-compose down -v

# Remove images (optional)
docker rmi shopping-list-test-backend shopping-list-test-frontend mongo:7
```

### Production Cleanup

```bash
# On your cloud server
cd /opt/shopping-list
docker-compose -f docker-compose.prod.yml down

# Remove volumes and all data (optional)
docker-compose -f docker-compose.prod.yml down -v

# Clean up old images
docker image prune -a
```

## 🔧 Configuration

### Environment Variables

**Backend:**

- `MONGODB_URL` - MongoDB connection string
- `JWT_SECRET_KEY` - Secret key for JWT tokens
- `JWT_ALGORITHM` - Algorithm for JWT (default: HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES` - Token expiration time
- `S3_BUCKET` - S3 bucket for backups
- `PORT` - Backend port (default: 8185)

**Frontend:**

- `NEXT_PUBLIC_API_URL` - Backend API URL
- `PORT` - Frontend port (default: 3135)

**MongoDB:**

- `MONGO_INITDB_ROOT_USERNAME` - Admin username
- `MONGO_INITDB_ROOT_PASSWORD` - Admin password
- `MONGO_INITDB_DATABASE` - Initial database name

### Port Configuration

- **Frontend**: 3135
- **Backend**: 8185
- **MongoDB**: 27888 (external), 27017 (internal)

## 🚀 CI/CD Features

- ✅ Automated build on every push
- ✅ Docker image caching for faster builds
- ✅ Automatic deployment to production server
- ✅ Health checks and deployment verification
- ✅ Zero-downtime deployments
- ✅ Automatic cleanup of old images
- ✅ PR comments with deployment status
- ✅ Build summaries in GitHub Actions

## 📝 License

MIT License

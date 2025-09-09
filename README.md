# MenuShield - Production Ready

MenuShield is a comprehensive restaurant menu management system with allergen filtering capabilities. Built with React, Express.js, Prisma ORM, and MySQL, containerized with Docker.

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- pnpm (for local development)

### Production Deployment with Docker

1. Clone and start all services:

```bash
git clone <your-repo>
cd menushield
docker-compose up -d
```

2. The application will be available at:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000
   - MySQL: localhost:3306

### Local Development

1. Start database only:

```bash
docker-compose up -d mysql
```

2. Install dependencies:

```bash
# Frontend
pnpm install

# Backend
cd backend
pnpm install
```

3. Setup database:

```bash
cd backend
npx prisma migrate dev
npx prisma generate
pnpm run db:seed
```

4. Start development servers:

```bash
# Terminal 1: Backend
cd backend
pnpm run dev

# Terminal 2: Frontend
pnpm run dev
```

## 🏗️ Architecture

### Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Express.js, Prisma ORM, JWT Authentication
- **Database**: MySQL 8.0
- **Container**: Docker & Docker Compose
- **Web Server**: Nginx (for production frontend)

### Project Structure

```
menushield/
├── src/                    # Frontend React app
├── backend/
│   ├── server.js          # Express server with Prisma
│   ├── prisma/
│   │   ├── schema.prisma  # Database schema
│   │   └── seed.js        # Sample data
│   └── Dockerfile         # Backend container
├── docker-compose.yml     # Multi-service setup
├── Dockerfile.frontend    # Frontend container
├── nginx.conf            # Nginx configuration
└── Makefile              # Development commands
```

## 🔧 Available Commands

Use the Makefile for easy development:

```bash
make help          # Show all available commands
make install       # Install all dependencies
make dev           # Instructions for development setup
make build         # Build for production
make up            # Start all Docker services
make down          # Stop all Docker services
make seed          # Seed database with sample data
make migrate       # Run database migrations
make studio        # Open Prisma Studio
```

## 🌐 API Endpoints

### Public Endpoints

- `GET /api/menu` - Get menu for guests (filtered)
- `GET /api/restaurant` - Get restaurant information
- `POST /api/login` - Admin login
- `POST /api/signup` - Admin registration

### Admin Endpoints (require JWT token)

- `GET /api/admin/menu` - Get full menu with admin details
- `POST /api/admin/menu` - Create new dish
- `PUT /api/admin/menu/:id` - Update dish
- `DELETE /api/admin/menu/:id` - Delete dish

## 🔐 Authentication

Default admin credentials:

- Email: `admin@example.com`
- Password: `supersecret`

## 📊 Database Management

```bash
# Open Prisma Studio
make studio

# Seed with sample data
make seed

# Reset and reseed
make reset-db
```

},
})

```

```

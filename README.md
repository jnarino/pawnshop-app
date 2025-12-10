# Pawnshop Management Application

A desktop application for managing pawnshop operations, built with Electron, React, and Node.js.

## Architecture

- **Client**: Electron + React + TypeScript + Vite
- **Server**: Node.js + Express + TypeScript
- **Database**: PostgreSQL
- **Cache**: Redis

## Prerequisites

- Node.js (v18 or higher)
- Docker Desktop (running)
- PostgreSQL database (running on port 5432)

## Quick Start

### 1. Install All Dependencies

Run this command once to install dependencies for root, client, and server:

```bash
npm run install:all
```

This will:
- Install root dependencies
- Install client dependencies
- Install server dependencies

### 2. Start the Application

Start the entire application stack with a single command:

```bash
npm start
```

This will:
- Start Redis container via Docker Compose
- Start the backend server (Express API)
- Start the Electron desktop application

## Available Scripts

### Installation

- `npm run install:all` - Install dependencies for all packages (root, client, server)

### Running the Application

- `npm start` - Start the complete application (Docker + Server + Client)
- `npm run start:server` - Start only the backend server
- `npm run start:client` - Start only the Electron client

### Docker Management

- `npm run docker:up` - Start Docker services (Redis)
- `npm run docker:down` - Stop Docker services
- `npm run docker:logs` - View Docker container logs

## Manual Setup

If you prefer to start components individually:

### 1. Start Redis

```bash
docker-compose up -d
```

### 2. Start Server

```bash
cd server
npm run dev
```

The server will run on `http://localhost:3000` (or configured port).

### 3. Start Client

```bash
cd client
npm run start:dev
```

This will:
- Start Vite dev server on `http://localhost:5173`
- Build and launch the Electron application

## Project Structure

```
pawnshop-app/
├── client/              # Electron + React frontend
│   ├── src/            # React source code
│   ├── dist-electron/  # Compiled Electron code
│   └── package.json    # Client dependencies
├── server/             # Express backend
│   ├── src/           # Server source code
│   └── package.json   # Server dependencies
├── docker-compose.yml  # Docker services configuration
├── package.json       # Root scripts and shared dependencies
└── README.md          # This file
```

## Development

### Client Development

The client uses:
- **Electron** for desktop application
- **React 19** for UI
- **TypeScript** for type safety
- **Vite** for fast development
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components

Client scripts:
- `npm run start:react` - Start only Vite dev server (no Electron)
- `npm run start:electron` - Start only Electron
- `npm run build` - Build for production

### Server Development

The server uses:
- **Express** for REST API
- **TypeScript** for type safety
- **PostgreSQL** for database
- **Redis** for caching

Server scripts:
- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript
- `npm run db:migrate` - Run database migrations

## Environment Variables

### Server (.env)

Create a `.env` file in the `server` directory:

```env
# Database
DATABASE_URL=postgresql://postgres:123456@localhost:5432/pawnshop

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your-secret-key
```

## Database Setup

Make sure you have a PostgreSQL database named `pawnshop`:

```bash
# Connect to existing PostgreSQL container
docker exec -it shoesx-postgres-db-1 psql -U postgres -c "CREATE DATABASE pawnshop;"
```

Run migrations:

```bash
cd server
npm run db:migrate
```

## Troubleshooting

### Docker not running

If you see "Cannot connect to the Docker daemon":
- Start Docker Desktop
- Wait until it shows "Docker Desktop is running"

### Port already in use

If ports 3000, 5173, or 6379 are in use:
- Stop other applications using these ports
- Or modify the port configuration in the respective config files

### Redis connection failed

Check if Redis is running:
```bash
docker ps | grep redis
```

If not running:
```bash
npm run docker:up
```

### Database connection failed

Verify PostgreSQL is running and the database exists:
```bash
docker exec -it shoesx-postgres-db-1 psql -U postgres -l
```

## Building for Production

### Build Client

```bash
cd client
npm run build
```

This creates:
- `dist/` - Compiled React app
- `dist-electron/` - Compiled Electron main process

### Build Server

```bash
cd server
npm run build
```

This creates:
- `dist/` - Compiled server code

## License

ISC

# Pawnshop Management Application

A desktop application for managing pawnshop operations, built with Electron, React, and Node.js.

## 🚀 Admin Tool (Primary Workflow)

The **Admin Tool** is the central hub for this project. It handles:
1.  **Database Migration**: Moving data from legacy SQL Server to PostgreSQL (Docker).
2.  **Installer Generation**: Building the standalone `.exe` installer.
3.  **Environment Configuration**: managing `.env` files.

### Starting the Admin Tool

**Windows:**
Double-click `AdminTool.bat` in the root directory.

**Linux / macOS:**
Run the following terminal command:
```bash
./AdminTool.sh
```

---

## 📋 Requirements

Before starting, ensure you have:
-   **Node.js**: v18 or higher (v20+ recommended).
-   **Docker Desktop**: Must be installed and **Running**.
-   **Visual Studio Build Tools** (Windows only): Required for native module compilation (e.g., `bcrypt`, `sqlite`).

---

## ⚙️ Environment Variables

The application is configured via two main `.env` files.

### 1. Server Configuration (`server/.env`)
Controls the backend API and database connections.

```env
# Node Environment
NODE_ENV=development
PORT=3300           # The port the backend server runs on

# Docker / Database Ports
DB_PORT=54330       # External port for PostgreSQL container
POSTGRES_PORT=54330 # Internal port mapping

# Legacy SQL Server (Source for Migration)
SQLSERVER_HOST=localhost
SQLSERVER_PORT=14330
SQLSERVER_DB=PawnMaster_v2
SQLSERVER_USER=sa
SQLSERVER_PASSWORD=YourStrong!Passw0rd
```

### 2. Client Configuration (`client/.env`)
Controls the frontend and build settings.

```env
# API Connection
VITE_API_BASE_URL=http://localhost
VITE_API_PORT=3300 # Must match server PORT

# Store Information (Displayed in App)
VITE_STORE_NAME="LARRY'S ESTATE JEWELRY & PAWN"
VITE_STORE_ADDRESS1="3316 CLEVELAND AVE."
```

---

## 🛠️ Migration & Build Guide (Step-by-Step)

Follow these steps to set up the application from scratch using the Admin Tool.

### Step 1: Start Docker
Ensure Docker Desktop is running. The Admin Tool will automatically spin up the required containers (`pawnshop_postgres_prod` and `pawnshop_sqlserver_prod`).

### Step 2: Open Admin Tool
Run `AdminTool.bat` (or `./AdminTool.sh`). This will open a web interface in your browser (usually `http://localhost:3000`).

### Step 3: Run Migration
1.  Navigate to the **Migration** tab.
2.  Follow the wizard steps to connect to your legacy SQL Server.
3.  The tool will migrate users, inventory, and transactions to the new PostgreSQL database.
4.  **Note**: This process creates a specialized "bcrypt-compatible" Docker image for the database.

### Step 4: Generate Installer
1.  Navigate to the **Build / Generator** tab (or "Tools" section).
2.  Click **"Build Application"**.
3.  The tool will:
    *   Compile the Server (TypeScript -> JS).
    *   Compile the Client (React -> Static Files).
    *   Package everything into a standalone `.exe`.
4.  Once complete, click **"Open Release Folder"** to find your installer (e.g., `Pawnshop App Setup 1.0.0.exe`).

---

## 💻 Development (Manual)

If you prefer to run the project manually for development:

### 0. Install All Dependencies
```bash
npm run install:all
```

### 1. Start Database
```bash
npm run docker:up
```

### 2. Start Backend
```bash
npm run start:server
# Runs on http://localhost:3300
```

### 3. Start Frontend
```bash
npm run start:client
# Runs on http://localhost:5173 (Proxies /api -> localhost:3300)
```

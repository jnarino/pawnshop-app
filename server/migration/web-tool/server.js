const express = require('express');
const fs = require('fs');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');

// Load environment from server root
const SERVER_ROOT = path.resolve(__dirname, '../../');
require('dotenv').config({ path: path.join(SERVER_ROOT, '.env') });

const { checkDependencies } = require('./lib/dependencies');
const { runFullMigration, restoreSqlServer } = require('./lib/migration');
const { createAdmin } = require('./lib/admin');
const { installApplication } = require('./lib/install');
const {
    checkDockerRunning,
    getAllContainersStatus,
    setupContainers,
    startContainer,
    CONTAINER_NAMES
} = require('./lib/docker');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Admin Tool runs on its own port (9000) to allow Backend (3300) to run simultaneously
const ADMIN_PORT = 9000;
// We still read the APP PORT from .env for configuration purposes
const APP_PORT = process.env.PORT || 3300;

const BUILD_ROOT_DIR = path.resolve(__dirname, '../../../client');
const RESOURCES_DIR = path.join(BUILD_ROOT_DIR, 'resources');

global.isBuilding = false;

// Serve static UI
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Logger that emits to socket
const log = (msg, type = 'info') => {
    console.log(`[${type.toUpperCase()}] ${msg}`);
    io.emit('log', { message: msg, type });
};

// Override console.log/error to stream to UI
// (Optional: safer to just use explicit logging helper)

// API: Check Dependencies
app.get('/api/dependencies', async (req, res) => {
    log('Checking dependencies...');
    try {
        const results = await checkDependencies();
        res.json(results);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// API: Check Docker Status
app.get('/api/docker/status', async (req, res) => {
    try {
        const running = await checkDockerRunning();
        res.json({ running });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// API: Get All Containers Status
app.get('/api/containers', async (req, res) => {
    try {
        const status = await getAllContainersStatus();
        res.json(status);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// API: Setup Production Containers
app.post('/api/containers/setup', async (req, res) => {
    const { setupType } = req.body;
    log(`Setting up containers (Production) (${setupType})...`, 'step');
    try {
        const success = await setupContainers(setupType);
        if (success) {
            log('Containers ready!', 'success');
            res.json({ success: true });
        } else {
            log('Failed to setup containers', 'error');
            res.status(500).json({ error: 'Setup failed' });
        }
    } catch (e) {
        log(e.message, 'error');
        res.status(500).json({ error: e.message });
    }
});

// API: Start Container
app.post('/api/containers/start', async (req, res) => {
    const { containerName } = req.body;
    try {
        const success = await startContainer(containerName);
        res.json({ success });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// API: List Backups
app.get('/api/backups', (req, res) => {
    const fs = require('fs');

    // Look in installer root and migration folder
    const dirs = [__dirname, path.resolve(__dirname, '../backup')];
    let files = [];

    dirs.forEach(d => {
        if (fs.existsSync(d)) {
            const f = fs.readdirSync(d).filter(x => x.endsWith('.dat') || x.endsWith('.zip') || x.endsWith('.bak'));
            files = [...files, ...f.map(name => ({ name, path: path.join(d, name) }))];
        }
    });

    res.json(files);
});

const multer = require('multer');

// Configure Multer
const upload = multer({ dest: path.join(__dirname, 'uploads/') });

// API: Run Migration (Handle File Upload)
app.post('/api/migrate', upload.single('backupFile'), async (req, res) => {
    log(`Starting migration process for Production...`, 'step');

    let backupPath;

    // Check if file was uploaded
    if (req.file) {
        backupPath = req.file.path;
        log(`Backup file uploaded: ${req.file.originalname}`);
    } else if (req.body.backupPath) {
        // Fallback for existing file selection (if we keep it)
        backupPath = req.body.backupPath;
    } else {
        log('No backup file provided.', 'error');
        return res.status(400).json({ error: 'No backup file provided' });
    }

    log(`Using backup file at: ${backupPath} (User provided: ${req.file ? req.file.originalname : path.basename(backupPath)})`);

    try {
        // 1. Restore
        log('Restoring SQL Server...', 'step');
        const restoreSuccess = await restoreSqlServer(backupPath);
        if (!restoreSuccess) throw new Error('Restore Failed');
        log('SQL Server Restored.', 'success');

        // 2. Migrate
        log('Running Python Migrations...', 'step');
        const migrateSuccess = await runFullMigration();
        if (!migrateSuccess) throw new Error('Migration Scripts Failed');

        log('Migration Complete!', 'success');
        res.json({ success: true });

    } catch (e) {
        log(e.message, 'error');
        res.status(500).json({ error: e.message });
    } finally {
        // Cleanup uploaded file
        if (req.file) {
            try {
                if (fs.existsSync(backupPath)) {
                    fs.unlinkSync(backupPath);
                    log('Cleaned up uploaded file.', 'info');
                }
            } catch (e) {
                log(`Failed to delete uploaded file ${backupPath}: ${e.message}`, 'warn');
            }
        }
    }
});

// Fresh Install (no migration)
app.post('/api/fresh-install', async (req, res) => {
    log(`Starting fresh installation for Production (no migration)`);

    try {
        // Just apply the schema to PostgreSQL
        const path = require('path');
        const execa = require('execa');

        const PG_CONTAINER = CONTAINER_NAMES.postgres;
        const schemaPath = path.resolve(__dirname, '../pawnshop-express/src/infrastructure/db/migrations/0001_11072025_initial.sql');

        log(`Applying PostgreSQL schema to ${PG_CONTAINER}...`);

        // Apply schema via Docker
        const dockerExec = execa('docker', ['exec', '-i', PG_CONTAINER, 'psql', '-U', 'postgres', '-d', 'pawnshop'], {
            stdio: ['pipe', 'inherit', 'inherit']
        });
        const fs = require('fs');
        const stream = fs.createReadStream(schemaPath);
        stream.pipe(dockerExec.stdin);
        await dockerExec;

        log('Schema applied successfully!', 'success');
        res.json({ success: true });
    } catch (e) {
        log(`Fresh install failed: ${e.message}`, 'error');
        res.json({ success: false, error: e.message });
    }
});

// API: Create Admin
app.post('/api/admin', async (req, res) => {
    const { username, password } = req.body;
    log(`Creating admin user: ${username}`);
    const success = await createAdmin(username, password, 'prod');
    if (success) {
        log('Admin user created.', 'success');
        res.json({ success: true });
    } else {
        log('Failed to create admin.', 'error');
        res.status(500).json({ error: 'Failed' });
    }
});

// API: Install App
app.post('/api/install', async (req, res) => {
    log('Installing backend application...', 'step');
    const success = await installApplication('prod');
    if (success) {
        log('Application installed & backend shortcuts created.', 'success');
        res.json({ success: true });
    } else {
        log('Installation failed.', 'error');
        res.status(500).json({ error: 'Failed' });
    }
});

// API: Start Build (Generator)
app.post('/api/build', async (req, res) => {
    const { mode, serverUrl, env } = req.body;

    if (global.isBuilding) {
        return res.status(409).json({ error: 'Build already in progress' });
    }

    global.isBuilding = true;
    // Helper to log specifically for build
    const buildLog = (msg, type = 'info') => {
        log(`[BUILD] ${msg}`, type);
    };

    buildLog('Starting build process...', 'step');

    try {
        // 1. Write config.json
        buildLog('Configuring application mode...', 'step');
        if (!fs.existsSync(RESOURCES_DIR)) {
            fs.mkdirSync(RESOURCES_DIR, { recursive: true });
        }

        // Generate config.json for the client
        // This ensures the client knows which port to connect to (defined in server/.env)
        const config = {
            mode: mode, // 'server' or 'client'
            serverUrl: serverUrl || `http://localhost:${APP_PORT}`
        };

        console.log(`[BUILD] Generating client config with Server URL: ${config.serverUrl}`);
        fs.writeFileSync(path.join(RESOURCES_DIR, 'config.json'), JSON.stringify(config, null, 2));
        buildLog(`Created config.json: ${JSON.stringify(config)}`, 'success');

        // 2. Run Build
        buildLog('Running electron-builder...', 'step');
        buildLog('This may take several minutes. Please wait...');

        const args = ['run', 'package', '--'];
        if (req.body.platform === 'win') {
            args.push('--win');
        } else if (req.body.platform === 'mac') {
            args.push('--mac');
        }

        buildLog(`Executing: npm ${args.join(' ')}`, 'step');

        const execa = require('execa'); // Ensure execa is available here
        const buildProcess = execa('npm', args, {
            cwd: BUILD_ROOT_DIR,
            env: {
                ...process.env,
                ...env // Inject user provided env vars
            },
            all: true
        });

        // Stream logs
        buildProcess.all.on('data', (chunk) => {
            const lines = chunk.toString().split('\n');
            lines.forEach(line => {
                if (line.trim()) buildLog(line.trim());
            });
        });

        await buildProcess;

        buildLog('Build completed successfully!', 'success');
        global.isBuilding = false;
        res.json({ success: true });

    } catch (e) {
        buildLog(`Build failed: ${e.message}`, 'error');
        global.isBuilding = false;
        res.status(500).json({ error: e.message });
    }
});

// API: Open Output Directory
app.post('/api/open-dist', async (req, res) => {
    const distPath = path.join(BUILD_ROOT_DIR, 'release');
    try {
        const open = (await import('open')).default;
        await open(distPath);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

server.listen(ADMIN_PORT, async () => {
    console.log('\n==================================================');
    console.log(`   Admin Tool Running at: http://localhost:${ADMIN_PORT}`);
    console.log('==================================================\n');
    console.log('Attempting to open browser...');

    try {
        // Open browser (dynamic import for ESM package compatibility)
        const open = (await import('open')).default;
        await open(`http://localhost:${ADMIN_PORT}`);
    } catch (e) {
        console.error('\n[WARN] Failed to open browser automatically.');
        console.error(`Please open http://localhost:${ADMIN_PORT} in your browser manually.\n`);
        console.error(`Error details: ${e.message}`);
    }
});

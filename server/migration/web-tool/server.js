const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');
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

const PORT = 3000;

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
    const { env, setupType } = req.body;
    log(`Setting up containers for ${env} (${setupType})...`, 'step');
    try {
        const success = await setupContainers(env, setupType);
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
    const env = req.query.env || 'prod';
    log(`Starting migration process for ${env}...`, 'step');

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

    // 1. Restore
    try {
        log('Restoring SQL Server...', 'step');
        const restoreSuccess = await restoreSqlServer(backupPath, env);
        if (!restoreSuccess) throw new Error('Restore Failed');
        log('SQL Server Restored.', 'success');

        // 2. Migrate
        log('Running Python Migrations...', 'step');
        const migrateSuccess = await runFullMigration(env);
        if (!migrateSuccess) throw new Error('Migration Scripts Failed');

        log('Migration Complete!', 'success');

        // Cleanup uploaded file
        if (req.file) {
            try { fs.unlinkSync(backupPath); } catch (e) {
                log(`Failed to delete uploaded file ${backupPath}: ${e.message}`, 'warn');
            }
        }

        res.json({ success: true });
    } catch (e) {
        log(e.message, 'error');
        res.status(500).json({ error: e.message });
    }
});

// Fresh Install (no migration)
app.post('/api/fresh-install', async (req, res) => {
    const { env } = req.body;
    log(`Starting fresh installation for ${env} (no migration)`);

    try {
        // Just apply the schema to PostgreSQL
        const path = require('path');
        const execa = require('execa');

        const PG_CONTAINER = CONTAINER_NAMES[env].postgres;
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
    const { username, password, env } = req.body;
    log(`Creating admin user: ${username}`);
    const success = await createAdmin(username, password, env);
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
    const { env } = req.body;
    log('Installing backend application...', 'step');
    const success = await installApplication(env);
    if (success) {
        log('Application installed & backend shortcuts created.', 'success');
        res.json({ success: true });
    } else {
        log('Installation failed.', 'error');
        res.status(500).json({ error: 'Failed' });
    }
});

server.listen(PORT, async () => {
    console.log(`Installer running on http://localhost:${PORT}`);
    // Open browser (dynamic import for ESM package compatibility)
    const open = (await import('open')).default;
    await open(`http://localhost:${PORT}`);
});

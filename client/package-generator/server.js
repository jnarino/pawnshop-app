const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');
const fs = require('fs');
const execa = require('execa');
const open = require('open');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3002;

// Serve public directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const ROOT_DIR = path.resolve(__dirname, '../'); // pawnshop-app/client
const RESOURCES_DIR = path.join(ROOT_DIR, 'resources');

// Logger
const log = (msg, type = 'info') => {
    console.log(`[${type.toUpperCase()}] ${msg}`);
    io.emit('log', { message: msg, type });
};

// API: Start Build
app.post('/api/build', async (req, res) => {
    const { mode, serverUrl, env } = req.body;

    if (global.isBuilding) {
        return res.status(409).json({ error: 'Build already in progress' });
    }

    global.isBuilding = true;
    log('Starting build process...', 'step');

    try {
        // 1. Write config.json
        log('Configuring application mode...', 'step');
        if (!fs.existsSync(RESOURCES_DIR)) {
            fs.mkdirSync(RESOURCES_DIR, { recursive: true });
        }

        const config = {
            mode: mode, // 'server' or 'client'
            serverUrl: serverUrl || 'http://localhost:3000'
        };

        fs.writeFileSync(path.join(RESOURCES_DIR, 'config.json'), JSON.stringify(config, null, 2));
        log(`Created config.json: ${JSON.stringify(config)}`, 'success');

        // 2. Run Build
        log('Running electron-builder...', 'step');
        log('This may take several minutes. Please wait...');

        // Ensure install first? Maybe assume        // We run 'npm run package' from the client directory
        const args = ['run', 'package', '--'];
        if (req.body.platform === 'win') {
            args.push('--win');
        } else if (req.body.platform === 'mac') {
            args.push('--mac');
        }

        log(`Executing: npm ${args.join(' ')}`, 'step');

        const buildProcess = execa('npm', args, {
            cwd: ROOT_DIR,
            env: {
                ...process.env,
                ...env // Inject user provided env vars
            },
            all: true
        });

        buildProcess.all.on('data', (chunk) => {
            const lines = chunk.toString().split('\n');
            lines.forEach(line => {
                if (line.trim()) io.emit('log', { message: line.trim() });
            });
        });

        await buildProcess;

        log('Build completed successfully!', 'success');
        global.isBuilding = false;
        res.json({ success: true });

    } catch (e) {
        log(`Build failed: ${e.message}`, 'error');
        global.isBuilding = false;
        res.status(500).json({ error: e.message });
    }
});

// API: Open Output Directory
app.post('/api/open-dist', async (req, res) => {
    const distPath = path.join(ROOT_DIR, 'release');
    try {
        await open(distPath);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

server.listen(PORT, async () => {
    console.log(`Package Generator running on http://localhost:${PORT}`);
    await open(`http://localhost:${PORT}`);
});

const execa = require('execa');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');


const ROOT_DIR = path.resolve(__dirname, '../../../../');
const EXPRESS_DIR = path.resolve(__dirname, '../../..');
const TOOL_DIR = path.resolve(__dirname, '../');

async function installNpmDependencies(dir, name) {
    console.log(chalk.blue(`Installing dependencies for ${name}...`));
    try {
        await execa('npm', ['install'], { cwd: dir, stdio: 'inherit' });
        return true;
    } catch (e) {
        console.error(`Failed to install dependencies for ${name}:`, e.message);
        return false;
    }
}

async function createStartupScript(env = 'prod') {
    console.log(chalk.blue('Creating startup script...'));

    // Read PORT from .env file directly to ensure it matches configuration
    let PORT = env === 'prod' ? 3300 : 3301; // Fallback
    try {
        const envPath = path.join(EXPRESS_DIR, '.env');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const match = envContent.match(/^PORT=(\d+)/m);
            if (match && match[1]) {
                PORT = parseInt(match[1]);
                console.log(chalk.gray(`Found PORT=${PORT} in .env`));
            }
        }
    } catch (e) {
        console.warn('Could not read .env for PORT, using default:', PORT);
    }
    const NODE_ENV = env === 'prod' ? 'production' : 'development';

    const isWin = process.platform === 'win32';
    const ext = isWin ? '.bat' : '.sh';
    const fileName = `start_pawnshop_backend_${env}${ext}`;
    // Save startup script in pawnshop-express root for easy access
    const targetPath = path.join(EXPRESS_DIR, fileName);

    let scriptContent = '';

    if (isWin) {
        scriptContent = `@echo off
echo Starting Pawnshop Backend (${env.toUpperCase()})...
cd "${EXPRESS_DIR}"
set PORT=${PORT}
set NODE_ENV=${NODE_ENV}
npm run start
pause
`;
    } else {
        scriptContent = `#!/bin/bash
# Start API (${env.toUpperCase()})
echo "Starting Pawnshop Backend (${env})..."
cd "${EXPRESS_DIR}"
export PORT=${PORT}
export NODE_ENV=${NODE_ENV}
npm run start
`;
    }

    fs.writeFileSync(targetPath, scriptContent);
    if (!isWin) {
        await execa('chmod', ['+x', targetPath]);
    }

    return targetPath;
}

async function installApplication(env = 'prod') {
    // 1. Install & Build Express
    if (!await installNpmDependencies(EXPRESS_DIR, 'Backend API')) return false;

    // Explicitly run build to compile TypeScript -> dist/
    console.log(chalk.blue('Building Backend API (TypeScript)...'));
    try {
        await execa('npm', ['run', 'build'], { cwd: EXPRESS_DIR, stdio: 'inherit' });
    } catch (e) {
        console.error('Failed to build backend:', e.message);
        return false;
    }

    // 2. Create Startup Script
    const scriptPath = await createStartupScript(env);
    console.log(chalk.green(`Startup script created at: ${scriptPath}`));

    return true;
}

module.exports = { installApplication };

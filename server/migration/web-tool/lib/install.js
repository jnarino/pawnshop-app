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

    const PORT = env === 'prod' ? 3000 : 3001;
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
    // 1. Install & Build Express (Build might not be needed if just running node src/server.js, but let's assume 'build' compiles TS if present or does cleanup)
    if (!await installNpmDependencies(EXPRESS_DIR, 'Backend API')) return false;

    // 2. Create Startup Script
    const scriptPath = await createStartupScript(env);
    console.log(chalk.green(`Startup script created at: ${scriptPath}`));

    return true;
}

module.exports = { installApplication };

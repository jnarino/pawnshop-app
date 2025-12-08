const execa = require('execa');
const path = require('path');
const fs = require('fs');

async function createAdmin(username, password, env = 'prod') {
    console.log(`Configuring admin user: ${username} (${env})`);

    const EXPRESS_DIR = path.resolve(__dirname, '../../..');
    const nodeEnv = env === 'prod' ? 'production' : 'development';

    try {
        // Ensure dependencies are installed
        if (!fs.existsSync(path.join(EXPRESS_DIR, 'node_modules'))) {
            console.log('Installing dependencies for admin creation...');
            await execa('npm', ['install'], { cwd: EXPRESS_DIR, stdio: 'inherit' });
        }

        // Execute the Node script
        await execa('node', ['scripts/create-admin.js', username, password], {
            cwd: EXPRESS_DIR,
            stdio: 'inherit',
            env: { ...process.env, NODE_ENV: nodeEnv }
        });

        return true;
    } catch (e) {
        console.error('Failed to create admin user:', e.message);
        return false;
    }
}

module.exports = { createAdmin };

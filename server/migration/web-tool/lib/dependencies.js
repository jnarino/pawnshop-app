const execa = require('execa');
const chalk = require('chalk');

async function checkCommand(command, args = ['--version']) {
    try {
        const { stdout } = await execa(command, args);
        return { installed: true, version: stdout.trim() };
    } catch (e) {
        return { installed: false, error: e.message };
    }
}

async function checkDependencies() {
    console.log(chalk.bold('\nChecking System Dependencies...'));
    const results = {};

    // Check Node.js
    results.node = await checkCommand('node', ['--version']);

    // Check Python (try python3 first, then python)
    results.python = await checkCommand('python3', ['--version']);
    if (!results.python.installed) {
        results.python = await checkCommand('python', ['--version']);
    }

    // Check Docker (Required for all database operations)
    results.docker = await checkCommand('docker', ['--version']);

    // Check Docker Compose
    results.dockerCompose = await checkCommand('docker-compose', ['--version']);

    return results;
}

module.exports = { checkDependencies };

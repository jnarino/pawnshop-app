const execa = require('execa');
const chalk = require('chalk');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

/**
 * Docker Management Module
 * Handles container lifecycle, image management, and environment separation
 */

const IMAGES = {
    sqlserver: 'mcr.microsoft.com/mssql/server:2022-latest',
    postgres: 'postgres:15'
};

const CONTAINER_NAMES = {
    sqlserver: process.env.CONTAINER_NAME_SQL || 'pawnshop_sqlserver_prod',
    postgres: process.env.CONTAINER_NAME_PG || 'pawnshop_postgres_prod'
};

const PORTS = {
    sqlserver: process.env.SQLSERVER_PORT || '14330', // Host Port
    postgres: process.env.DB_PORT || process.env.POSTGRES_PORT || '54330' // Host Port
};

const NETWORK_NAME = process.env.DOCKER_NETWORK || 'pawnshop-app_default';

/**
 * Check if Docker daemon is running
 */
async function checkDockerRunning() {
    try {
        await execa('docker', ['info']);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Check if a Docker image exists locally
 */
async function checkImageExists(imageName) {
    try {
        const { stdout } = await execa('docker', ['images', '-q', imageName]);
        return stdout.trim().length > 0;
    } catch (e) {
        return false;
    }
}

/**
 * Pull a Docker image
 */
async function pullImage(imageName) {
    console.log(chalk.blue(`Pulling image: ${imageName}...`));
    try {
        await execa('docker', ['pull', imageName], { stdio: 'inherit' });
        console.log(chalk.green(`✓ Image pulled: ${imageName}`));
        return true;
    } catch (e) {
        console.error(chalk.red(`Failed to pull image: ${imageName}`), e.message);
        return false;
    }
}

/**
 * Check if a container exists (running or stopped)
 */
async function checkContainerExists(containerName) {
    try {
        const { stdout } = await execa('docker', ['ps', '-a', '--filter', `name=^${containerName}$`, '--format', '{{.Names}}']);
        return stdout.trim() === containerName;
    } catch (e) {
        return false;
    }
}

/**
 * Check if a container is running
 */
async function checkContainerRunning(containerName) {
    try {
        const { stdout } = await execa('docker', ['ps', '--filter', `name=^${containerName}$`, '--format', '{{.Names}}']);
        return stdout.trim() === containerName;
    } catch (e) {
        return false;
    }
}

/**
 * Get container status
 */
async function getContainerStatus(containerName) {
    const exists = await checkContainerExists(containerName);
    if (!exists) return 'missing';

    const running = await checkContainerRunning(containerName);
    return running ? 'running' : 'stopped';
}

/**
 * Start a stopped container
 */
async function startContainer(containerName) {
    console.log(chalk.blue(`Starting container: ${containerName}...`));
    try {
        await execa('docker', ['start', containerName], { stdio: 'inherit' });
        console.log(chalk.green(`✓ Container started: ${containerName}`));
        return true;
    } catch (e) {
        console.error(chalk.red(`Failed to start container: ${containerName}`), e.message);
        return false;
    }
}

/**
 * Create SQL Server container
 */
/**
 * Ensure Docker network exists
 */
async function ensureNetworkExists(networkName) {
    try {
        const { stdout } = await execa('docker', ['network', 'ls', '--filter', `name=^${networkName}$`, '--format', '{{.Name}}']);
        if (stdout.trim() === networkName) {
            return true;
        }

        console.log(chalk.blue(`Creating network: ${networkName}...`));
        await execa('docker', ['network', 'create', networkName]);
        console.log(chalk.green(`✓ Network created: ${networkName}`));
        return true;
    } catch (e) {
        console.error(chalk.red(`Failed to create network: ${networkName}`), e.message);
        return false;
    }
}

/**
 * Ensure Docker network exists
 */
async function ensureNetworkExists(networkName = NETWORK_NAME) {
    try {
        const { stdout } = await execa('docker', ['network', 'ls', '--filter', `name=^${networkName}$`, '--format', '{{.Name}}']);
        if (stdout.trim() === networkName) {
            return true;
        }

        console.log(chalk.blue(`Creating network: ${networkName}...`));
        await execa('docker', ['network', 'create', networkName]);
        console.log(chalk.green(`✓ Network created: ${networkName}`));
        return true;
    } catch (e) {
        console.error(chalk.red(`Failed to create network: ${networkName}`), e.message);
        return false;
    }
}

/**
 * Create SQL Server container
 */
async function createSqlServerContainer() {
    const containerName = CONTAINER_NAMES.sqlserver;
    const port = PORTS.sqlserver;

    console.log(chalk.blue(`Creating SQL Server container: ${containerName}...`));

    try {
        await execa('docker', [
            'run',
            '-d',
            '--name', containerName,
            '--network', NETWORK_NAME,
            '-e', 'ACCEPT_EULA=Y',
            '-e', 'SA_PASSWORD=YourStrong!Passw0rd',
            '-p', `${port}:1433`,
            '-v', `${containerName}_data:/var/opt/mssql`,
            IMAGES.sqlserver
        ], { stdio: 'inherit' });

        console.log(chalk.green(`✓ SQL Server container created: ${containerName}`));
        console.log(chalk.yellow(`  Waiting for SQL Server to be ready...`));

        // Wait for SQL Server to be ready
        await new Promise(resolve => setTimeout(resolve, 10000));

        return true;
    } catch (e) {
        console.error(chalk.red(`Failed to create SQL Server container`), e.message);
        return false;
    }
}

/**
 * Create PostgreSQL container
 */
async function createPostgresContainer() {
    const containerName = CONTAINER_NAMES.postgres;
    const port = PORTS.postgres;

    console.log(chalk.blue(`Creating PostgreSQL container: ${containerName}...`));

    try {
        await execa('docker', [
            'run',
            '-d',
            '--name', containerName,
            '--network', NETWORK_NAME,
            '-e', 'POSTGRES_PASSWORD=postgres',
            '-e', 'POSTGRES_DB=pawnshop',
            '-p', `${port}:5432`,
            '-v', `${containerName}_data:/var/lib/postgresql/data`,
            IMAGES.postgres
        ], { stdio: 'inherit' });

        console.log(chalk.green(`✓ PostgreSQL container created: ${containerName}`));
        console.log(chalk.yellow(`  Waiting for PostgreSQL to be ready...`));

        // Wait for PostgreSQL to be ready
        await new Promise(resolve => setTimeout(resolve, 5000));

        return true;
    } catch (e) {
        console.error(chalk.red(`Failed to create PostgreSQL container`), e.message);
        return false;
    }
}

/**
 * Ensure database exists in PostgreSQL container
 */
async function ensurePostgresDatabase(containerName, dbName) {
    try {
        // Check if database exists
        const { stdout } = await execa('docker', [
            'exec', containerName,
            'psql', '-U', 'postgres', '-lqt'
        ]);

        if (stdout.includes(dbName)) {
            console.log(chalk.green(`✓ Database ${dbName} already exists`));
            return true;
        }

        // Create database
        console.log(chalk.blue(`Creating database: ${dbName}...`));
        await execa('docker', [
            'exec', containerName,
            'psql', '-U', 'postgres', '-c', `CREATE DATABASE ${dbName};`
        ]);

        console.log(chalk.green(`✓ Database created: ${dbName}`));
        return true;
    } catch (e) {
        console.error(chalk.red(`Failed to ensure database exists`), e.message);
        return false;
    }
}

/**
 * Setup all production containers
 */
async function setupContainers(setupType = 'migrate') {
    console.log(chalk.bold(`\n=== Setting Up Production Containers ===\n`));

    // Check Docker is running
    if (!await checkDockerRunning()) {
        console.error(chalk.red('Docker is not running. Please start Docker Desktop.'));
        return false;
    }

    // Pull images if needed
    for (const [name, image] of Object.entries(IMAGES)) {
        if (!await checkImageExists(image)) {
            if (!await pullImage(image)) return false;
        } else {
            console.log(chalk.gray(`✓ Image already exists: ${image}`));
        }
    }

    // Ensure Network Exists
    if (!await ensureNetworkExists(NETWORK_NAME)) {
        return false;
    }

    // Create SQL Server container (Only if migrating)
    if (setupType === 'migrate') {
        const sqlServerName = CONTAINER_NAMES.sqlserver;
        const sqlServerStatus = await getContainerStatus(sqlServerName);

        if (sqlServerStatus === 'missing') {
            if (!await createSqlServerContainer()) return false;
        } else if (sqlServerStatus === 'stopped') {
            if (!await startContainer(sqlServerName)) return false;
        } else {
            console.log(chalk.green(`✓ SQL Server container already running: ${sqlServerName}`));
        }
    }

    // Create PostgreSQL container
    const postgresName = CONTAINER_NAMES.postgres;
    const postgresStatus = await getContainerStatus(postgresName);

    if (postgresStatus === 'missing') {
        if (!await createPostgresContainer()) return false;
    } else if (postgresStatus === 'stopped') {
        if (!await startContainer(postgresName)) return false;
    } else {
        console.log(chalk.green(`✓ PostgreSQL container already running: ${postgresName}`));
    }

    // Ensure pawnshop database exists
    await ensurePostgresDatabase(postgresName, 'pawnshop');

    console.log(chalk.bold.green(`\n✅ Production containers ready!\n`));
    return true;
}

/**
 * Get status of all containers
 */
async function getAllContainersStatus() {
    const status = {
        prod: {
            sqlserver: await getContainerStatus(CONTAINER_NAMES.sqlserver),
            postgres: await getContainerStatus(CONTAINER_NAMES.postgres)
        }
    };

    return status;
}

module.exports = {
    checkDockerRunning,
    checkImageExists,
    pullImage,
    checkContainerExists,
    checkContainerRunning,
    getContainerStatus,
    startContainer,
    createSqlServerContainer,
    createPostgresContainer,
    ensurePostgresDatabase,
    setupContainers,
    getAllContainersStatus,
    CONTAINER_NAMES,
    PORTS,
    IMAGES
};

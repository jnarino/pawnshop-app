const execa = require('execa');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const { CONTAINER_NAMES } = require('./docker');

const NETWORK_NAME = process.env.DOCKER_NETWORK || 'pawnshop-app_default';
const PG_CONTAINER = process.env.CONTAINER_NAME_PG || 'pawnshop_postgres_prod';
const SQL_CONTAINER = process.env.CONTAINER_NAME_SQL || 'pawnshop_sqlserver_prod';

const MIGRATION_DIR = path.resolve(__dirname, '../../sql-server-to-postgresql');

// Use production containers for installation
// Container constants removed in favor of dynamic lookup

async function runPythonScript(scriptName, args = []) {
    // Note: We might want to pass explicit env vars here if needed, 
    // but the python script relies on the .env file being correct (handled in runFullMigration)
    console.log(`Executing: python3 ${scriptName} ${args.join(' ')}`);

    // Build migration Docker image if it doesn't exist
    const imageName = 'pawnshop-migration:latest';

    try {
        // Check if image exists
        // Always attempt to build/update the image to ensure requirements.txt is fresh.
        // Docker layer caching will make this fast if nothing changed.
        console.log(chalk.blue('Building/Updating migration container image...'));
        await execa('docker', [
            'build',
            '-f', path.resolve(__dirname, '../Dockerfile.migration'),
            '-t', imageName,
            path.resolve(__dirname, '../../..')
        ], { stdio: 'inherit' });

        // Determine .env file to mount
        // runFullMigration copies the correct env to .env, so we just mount that.
        // Or we could mount .env.production directly if we knew.
        // For consistency, we'll keep mounting the main .env file which we prep before running.

        const dockerArgs = [
            'run',
            '--rm',
            '--network', NETWORK_NAME,
            '-e', 'AUTO_CONFIRM=true',
            '-e', `POSTGRES_HOST=${PG_CONTAINER}`,
            '-e', `SQLSERVER_HOST=${SQL_CONTAINER}`,
            '-e', 'POSTGRES_PORT=5432', // Fixed internal port
            '-e', 'SQLSERVER_PORT=1433', // Fixed internal port
            '-v', `${path.resolve(__dirname, '../../../.env')}:/migration/.env:ro`,
            '-v', `${MIGRATION_DIR}:/migration`,
            imageName,
            'python3', scriptName, ...args
        ];

        await execa('docker', dockerArgs, { stdio: 'inherit' });
        return true;
    } catch (e) {
        console.error(`Error running ${scriptName}:`, e.message);
        return false;
    }
}

async function restoreSqlServer(backupFile) {
    const SQL_CONTAINER = CONTAINER_NAMES.sqlserver;

    console.log(`\n--- Restoring SQL Server Backup (Production) ---`);
    console.log(`Target Container: ${SQL_CONTAINER}`);
    console.log(`Source File: ${backupFile}`);

    // Check if container is running
    try {
        const { stdout } = await execa('docker', ['ps', '--filter', `name=^${SQL_CONTAINER}$`, '--format', '{{.Names}}']);
        if (!stdout.trim()) {
            console.error(chalk.red(`Container ${SQL_CONTAINER} is not running. Please run Docker Setup first.`));
            return false;
        }
    } catch (e) {
        console.error(chalk.red('Docker check failed:'), e.message);
        return false;
    }

    // 1. Copy backup to container
    const containerFileName = 'restore_backup.dat';
    const targetPath = `/var/opt/mssql/backup/${containerFileName}`;

    console.log(chalk.blue('Copying backup file to container...'));
    try {
        // Create backup dir if not exists
        await execa('docker', ['exec', SQL_CONTAINER, 'mkdir', '-p', '/var/opt/mssql/backup']);

        // cp localPath container:targetPath
        await execa('docker', ['cp', backupFile, `${SQL_CONTAINER}:${targetPath}`]);
    } catch (e) {
        console.error(chalk.red('Failed to copy file to container:'), e.message);
        return false;
    }

    // 2. Initial SQL (Drop DB if exists)
    const dbName = 'PawnMaster_v2';
    console.log(chalk.blue(`Dropping existing database ${dbName}...`));
    const dropSql = `
        USE master;
        IF EXISTS(SELECT * FROM sys.databases WHERE name = '${dbName}')
        BEGIN
            ALTER DATABASE ${dbName} SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
            DROP DATABASE ${dbName};
        END
    `;

    try {
        await exec_sql_cmd(SQL_CONTAINER, dropSql);
    } catch (e) {
        console.warn(chalk.yellow('Warning during DROP DB:'), e.message);
    }

    // 3. RESTORE DATABASE
    console.log(chalk.blue('Restoring database...'));
    let moveClause = '';
    // Hardcoded MOVE for typical setup to insure it works on Linux Docker
    moveClause = `
        MOVE 'PawnMaster' TO '/var/opt/mssql/data/${dbName}.mdf',
        MOVE 'PawnMaster_log' TO '/var/opt/mssql/data/${dbName}.ldf'
    `;

    const restoreSql = `
        RESTORE DATABASE ${dbName}
        FROM DISK = '${targetPath}'
        WITH REPLACE,
        ${moveClause}
    `;

    try {
        const { stdout, stderr } = await exec_sql_cmd(SQL_CONTAINER, restoreSql, true);

        if (stderr && (stderr.includes('Msg') || stderr.includes('Error'))) {
            console.error(chalk.red('Restore failed:'), stderr);
            return false;
        }

        console.log(chalk.green('Database restored successfully!'));
        return true;
    } catch (e) {
        console.error(chalk.red('Restore failed:'), e.message);
        return false;
    }
}

async function exec_sql_cmd(container, query, capture = false) {
    const args = [
        'exec',
        container,
        '/opt/mssql-tools18/bin/sqlcmd',
        '-S', 'localhost',
        '-U', 'sa',
        '-P', 'YourStrong!Passw0rd',
        '-C',
        '-Q', query
    ];

    if (capture) {
        const result = await execa('docker', args);
        return { stdout: result.stdout, stderr: result.stderr };
    } else {
        const result = await execa('docker', args, { stdio: 'inherit' });
        return { stdout: result.stdout || '', stderr: result.stderr || '' };
    }
}

async function runFullMigration() {
    const PG_CONTAINER = CONTAINER_NAMES.postgres;
    const SQL_CONTAINER = CONTAINER_NAMES.sqlserver;

    console.log(`\n--- Configuring Production Environment ---`);
    const envSource = '.env.production';
    const envSourcePath = path.resolve(MIGRATION_DIR, `../../${envSource}`);
    const envDestPath = path.resolve(MIGRATION_DIR, '../../.env');

    try {
        console.log(`Checking env path: ${envSourcePath}`);
        if (fs.existsSync(envSourcePath)) {
            fs.copyFileSync(envSourcePath, envDestPath);
            console.log(chalk.green(`✓ Copied ${envSource} to .env`));
        } else {
            console.warn(chalk.yellow(`⚠ No ${envSource} found. Using existing .env`));
        }
    } catch (e) {
        console.warn(chalk.yellow('Warning: Could not setup environment file:'), e.message);
    }

    // 1. Clean Postgres
    console.log('\n--- Cleaning PostgreSQL ---');
    const success = await runPythonScript('clean_postgres_db.py', []);
    if (!success) {
        console.error('Failed to clean database:', chalk.red('Command failed'));
        return false;
    }

    // 2. Apply Schema
    console.log('\n--- Applying Schema ---');
    const schemaPath = path.resolve(MIGRATION_DIR, '../../src/infrastructure/db/migrations/0001_11072025_initial.sql');
    console.log(chalk.blue(`Applying schema to ${PG_CONTAINER}...`));

    try {
        const dockerExec = execa('docker', ['exec', '-i', PG_CONTAINER, 'psql', '-U', 'postgres', '-d', 'pawnshop'], {
            stdio: ['pipe', 'inherit', 'inherit']
        });
        const stream = fs.createReadStream(schemaPath);
        stream.pipe(dockerExec.stdin);
        await dockerExec;
        console.log(chalk.green('✓ Schema applied successfully'));
    } catch (e) {
        console.error("Failed to apply schema:", e.message);
        return false;
    }

    // 3. Wait for SQL Server
    console.log('\n--- Verifying SQL Server Connection ---');
    let sqlReady = false;
    for (let i = 0; i < 12; i++) {
        try {
            await execa('docker', [
                'exec', SQL_CONTAINER,
                '/opt/mssql-tools18/bin/sqlcmd',
                '-S', 'localhost',
                '-U', 'sa',
                '-P', 'YourStrong!Passw0rd',
                '-C',
                '-Q', 'SELECT 1'
            ]);
            sqlReady = true;
            console.log(chalk.green('✓ SQL Server is ready'));
            break;
        } catch (e) {
            console.log(chalk.yellow(`  Attempt ${i + 1}/12 - waiting...`));
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }

    if (!sqlReady) {
        console.error(chalk.red('SQL Server failed to become ready'));
        return false;
    }

    // 4. Run Data Migration
    console.log('\n--- Running Data Migration ---');
    return await runPythonScript('scripts/migrate_all.py', []);
}

module.exports = { runFullMigration, restoreSqlServer, runPythonScript };


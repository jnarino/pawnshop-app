const esbuild = require('esbuild');
const path = require('path');

console.info('📦 Bundling Server for Electron...');

esbuild.build({
    entryPoints: [path.resolve(__dirname, '../../server/src/server.ts')],
    bundle: true,
    platform: 'node',
    target: 'node18',
    format: 'cjs',
    outfile: path.resolve(__dirname, '../dist-electron/server.cjs'),
    external: [
        'argon2',
        'electron',
        'swagger-ui-express'
    ],
    loader: { '.ts': 'ts' },
}).then(() => {
    const fs = require('fs');
    const srcDir = path.resolve(__dirname, '../../server/src/infrastructure/db/sql');
    const destDir = path.resolve(__dirname, '../dist-electron/sql');

    if (fs.existsSync(srcDir)) {
        console.info('📂 Copying SQL files...');
        fs.cpSync(srcDir, destDir, { recursive: true });
        console.info('✅ SQL files copied.');
    } else {
        console.warn('⚠️ SQL folder not found at:', srcDir);
    }

    const migrationsSrc = path.resolve(__dirname, '../../server/src/infrastructure/db/migrations');
    const migrationsDest = path.resolve(__dirname, '../dist-electron/migrations');

    if (fs.existsSync(migrationsSrc)) {
        console.info('📂 Copying Migration files...');
        fs.cpSync(migrationsSrc, migrationsDest, { recursive: true });
        console.info('✅ Migration files copied.');
    } else {
        console.warn('⚠️ Migrations folder not found at:', migrationsSrc);
    }

    if (fs.existsSync(migrationsSrc)) {
        console.info('📂 Copying Migration files...');
        fs.cpSync(migrationsSrc, migrationsDest, { recursive: true });
        console.info('✅ Migration files copied.');
    } else {
        console.warn('⚠️ Migrations folder not found at:', migrationsSrc);
    }

    // Copy .env for bundled app
    const envSrc = path.resolve(__dirname, '../../server/.env');
    const envDest = path.resolve(__dirname, '../dist-electron/.env');

    if (fs.existsSync(envSrc)) {
        console.info('📂 Copying .env...');
        fs.copyFileSync(envSrc, envDest);
        console.info('✅ .env copied.');
    } else {
        console.warn('⚠️ .env not found at:', envSrc);
    }

    // Generate Swagger JSON for bundled app
    console.info('📄 Generating Swagger JSON...');
    const { execSync } = require('child_process');
    try {
        const genScript = path.resolve(__dirname, '../../server/scripts/generate-swagger.ts');
        const swaggerDest = path.resolve(__dirname, '../dist-electron/swagger.json');

        // Run ts-node from server directory context
        const serverDir = path.resolve(__dirname, '../../server');
        // Command: npx ts-node scripts/generate-swagger.ts > [dest]
        // process.cwd() is client/scripts or client/

        execSync(`npx ts-node "${genScript}" > "${swaggerDest}"`, {
            cwd: serverDir,
            stdio: ['ignore', 'ignore', 'pipe'] // Capture stderr if needed, but we redirect stdout via > in shell? No, execSync returns stdout buffer usually.
            // Wait, ">" redirection in execSync works if shell: true (default).
        });
        // Actually, let's catch stdout and write it manually to be safer cross-platform
        const swaggerJson = execSync(`npx ts-node "${genScript}"`, { cwd: serverDir }).toString();
        fs.writeFileSync(swaggerDest, swaggerJson);

        console.info('✅ Swagger JSON generated an copied.');
    } catch (err) {
        console.error('❌ Failed to generate Swagger JSON:', err.message);
        if (err.stderr) console.error(err.stderr.toString());
        // Don't fail build, just warn?
    }

    console.info('✅ Server bundled to dist-electron/server.cjs');
}).catch(() => process.exit(1));

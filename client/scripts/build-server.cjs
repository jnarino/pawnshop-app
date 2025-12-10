const esbuild = require('esbuild');
const path = require('path');

console.log('📦 Bundling Server for Electron...');

esbuild.build({
    entryPoints: [path.resolve(__dirname, '../../server/src/server.ts')],
    bundle: true,
    platform: 'node',
    target: 'node18',
    format: 'cjs',
    outfile: path.resolve(__dirname, '../dist-electron/server.cjs'),
    external: [
        'argon2',
        'electron' // In case it's referenced
    ],
    loader: { '.ts': 'ts' },
}).then(() => {
    const fs = require('fs');
    const srcDir = path.resolve(__dirname, '../../server/src/infrastructure/db/sql');
    const destDir = path.resolve(__dirname, '../dist-electron/sql');

    if (fs.existsSync(srcDir)) {
        console.log('📂 Copying SQL files...');
        fs.cpSync(srcDir, destDir, { recursive: true });
        console.log('✅ SQL files copied.');
    } else {
        console.warn('⚠️ SQL folder not found at:', srcDir);
    }

    const migrationsSrc = path.resolve(__dirname, '../../server/src/infrastructure/db/migrations');
    const migrationsDest = path.resolve(__dirname, '../dist-electron/migrations');

    if (fs.existsSync(migrationsSrc)) {
        console.log('📂 Copying Migration files...');
        fs.cpSync(migrationsSrc, migrationsDest, { recursive: true });
        console.log('✅ Migration files copied.');
    } else {
        console.warn('⚠️ Migrations folder not found at:', migrationsSrc);
    }

    if (fs.existsSync(migrationsSrc)) {
        console.log('📂 Copying Migration files...');
        fs.cpSync(migrationsSrc, migrationsDest, { recursive: true });
        console.log('✅ Migration files copied.');
    } else {
        console.warn('⚠️ Migrations folder not found at:', migrationsSrc);
    }

    // Copy .env.production for bundled app
    const envSrc = path.resolve(__dirname, '../../server/.env.production');
    const envDest = path.resolve(__dirname, '../dist-electron/.env.production');

    if (fs.existsSync(envSrc)) {
        console.log('📂 Copying .env.production...');
        fs.copyFileSync(envSrc, envDest);
        console.log('✅ .env.production copied.');
    } else {
        console.warn('⚠️ .env.production not found at:', envSrc);
    }

    console.log('✅ Server bundled to dist-electron/server.cjs');
}).catch(() => process.exit(1));

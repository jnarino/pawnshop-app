import { execa } from 'execa';
import fixPath from 'fix-path';

// Fix PATH for macOS GUI apps to find docker binary
fixPath();

const IMAGES = {
    postgres: 'postgres:15'
};

const CONTAINER_NAMES = {
    dev: {
        postgres: 'pawnshop_postgres_dev'
    },
    prod: {
        postgres: 'pawnshop_postgres_prod'
    }
};

const PORTS = {
    dev: {
        postgres: '54331'
    },
    prod: {
        postgres: '54330'
    }
};

export class DockerManager {

    static async checkDockerRunning(): Promise<boolean> {
        try {
            await execa('docker', ['info']);
            return true;
        } catch (e) {
            console.error('[DockerManager] Docker not running:', e);
            return false;
        }
    }

    static async containerExists(name: string): Promise<boolean> {
        try {
            const { stdout } = await execa('docker', ['ps', '-a', '--filter', `name=^${name}$`, '--format', '{{.Names}}']);
            return stdout.trim() === name;
        } catch (e) {
            return false;
        }
    }

    static async containerRunning(name: string): Promise<boolean> {
        try {
            const { stdout } = await execa('docker', ['ps', '--filter', `name=^${name}$`, '--format', '{{.Names}}']);
            return stdout.trim() === name;
        } catch (e) {
            return false;
        }
    }

    static async startContainer(name: string): Promise<boolean> {
        try {
            console.log(`[DockerManager] Starting container ${name}...`);
            await execa('docker', ['start', name]);
            return true;
        } catch (e) {
            console.error(`[DockerManager] Failed to start ${name}:`, e);
            return false;
        }
    }

    static async createPostgresContainer(env: 'dev' | 'prod'): Promise<boolean> {
        const name = CONTAINER_NAMES[env].postgres;
        const port = PORTS[env].postgres;
        const image = IMAGES.postgres;

        try {
            console.log(`[DockerManager] Creating container ${name} on port ${port}...`);
            // Check if image exists
            try {
                await execa('docker', ['image', 'inspect', image]);
            } catch {
                console.log(`[DockerManager] Pulling image ${image}...`);
                await execa('docker', ['pull', image]);
            }

            await execa('docker', [
                'run', '-d',
                '--name', name,
                '-e', 'POSTGRES_PASSWORD=postgres', // Matching .env.production
                '-e', 'POSTGRES_DB=pawnshop',
                '-p', `${port}:5432`,
                '-v', `${name}_data:/var/lib/postgresql/data`,
                image
            ]);

            // Wait for DB to be ready
            await new Promise(r => setTimeout(r, 5000));

            return true;
        } catch (e) {
            console.error(`[DockerManager] Failed to create ${name}:`, e);
            return false;
        }
    }

    static async ensureDatabase(env: 'dev' | 'prod' = 'prod'): Promise<{ success: boolean; message?: string }> {
        // 1. Check if Docker is running
        let isRunning = await this.checkDockerRunning();

        // 2. If not, try to start it
        if (!isRunning) {
            console.log('[DockerManager] Docker is not running. Starting it...');

            // 3. Poll for Docker API readiness (up to 60s)
            console.log('[DockerManager] Waiting for Docker to be ready...');
            let attempts = 0;
            while (!isRunning && attempts < 10) { // 30 * 2s = 60s
                await new Promise(r => setTimeout(r, 2000));
                isRunning = await this.checkDockerRunning();
                attempts++;
                if (isRunning) console.log('[DockerManager] Docker is now ready!');
            }

            if (!isRunning) {
                return { success: false, message: 'Timed out waiting for Docker Desktop to start. Please try again manually.' };
            }
        }

        const containerName = CONTAINER_NAMES[env].postgres;

        const exists = await this.containerExists(containerName);
        if (exists) {
            const running = await this.containerRunning(containerName);
            if (!running) {
                const started = await this.startContainer(containerName);
                if (!started) return { success: false, message: `Failed to start ${containerName}` };
                // Give it a moment
                await new Promise(r => setTimeout(r, 2000));
            }
            return { success: true };
        } else {
            // Create it
            const created = await this.createPostgresContainer(env);
            if (!created) return { success: false, message: `Failed to create ${containerName}` };
            return { success: true };
        }
    }
}

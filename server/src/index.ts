import { app } from './server';
import { logger } from './infrastructure/log/logger';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    logger.info('server_started', { port: PORT });
    console.log(`🚀 Server running on port ${PORT}`);
});
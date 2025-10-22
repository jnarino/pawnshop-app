"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryCacheService = void 0;
const redis_1 = require("redis");
class CategoryCacheService {
    constructor(repo) {
        this.repo = repo;
        this.redisClient = null;
        this.CACHE_KEY = 'categories:all';
        this.CACHE_TTL = 60 * 60; // 1 hour in seconds
        this.isConnecting = false;
    }
    async ensureRedisConnection() {
        if (this.redisClient?.isOpen) {
            return this.redisClient;
        }
        if (this.isConnecting) {
            // Wait for connection to complete
            await new Promise(resolve => setTimeout(resolve, 100));
            return this.ensureRedisConnection();
        }
        this.isConnecting = true;
        try {
            this.redisClient = (0, redis_1.createClient)({
                url: process.env.REDIS_URL || 'redis://localhost:6379',
                socket: {
                    reconnectStrategy: (retries) => {
                        if (retries > 10) {
                            console.error('[CategoryCache] Too many Redis reconnection attempts');
                            return new Error('Too many retries');
                        }
                        return Math.min(retries * 100, 3000);
                    }
                }
            });
            this.redisClient.on('error', (err) => {
                console.error('[CategoryCache] Redis error:', err);
            });
            this.redisClient.on('connect', () => {
                console.log('[CategoryCache] Redis connected');
            });
            this.redisClient.on('reconnecting', () => {
                console.log('[CategoryCache] Redis reconnecting...');
            });
            await this.redisClient.connect();
            this.isConnecting = false;
            return this.redisClient;
        }
        catch (error) {
            this.isConnecting = false;
            console.error('[CategoryCache] Failed to connect to Redis:', error);
            throw error;
        }
    }
    async getCategories() {
        try {
            const client = await this.ensureRedisConnection();
            const cached = await client.get(this.CACHE_KEY);
            if (cached) {
                console.log('[CategoryCache] Retrieved from Redis cache');
                const data = JSON.parse(cached);
                console.log(`[CategoryCache] Returning ${data.length} categories from cache`);
                return data;
            }
            console.log('[CategoryCache] Cache miss - loading from database');
        }
        catch (error) {
            console.error('[CategoryCache] Redis read failed, loading from database:', error);
        }
        return this.refreshCache();
    }
    async refreshCache() {
        console.log('[CategoryCache] Loading categories from database...');
        try {
            const categories = await this.repo.listFlat();
            console.log(`[CategoryCache] Loaded ${categories.length} categories from database`);
            try {
                const client = await this.ensureRedisConnection();
                await client.setEx(this.CACHE_KEY, this.CACHE_TTL, JSON.stringify(categories));
                console.log(`[CategoryCache] Cached ${categories.length} categories in Redis with TTL ${this.CACHE_TTL}s`);
            }
            catch (redisError) {
                console.error('[CategoryCache] Failed to store in Redis, continuing with DB data:', redisError);
            }
            return categories;
        }
        catch (error) {
            console.error('[CategoryCache] Failed to load categories from database:', error);
            throw error;
        }
    }
    async invalidate() {
        try {
            const client = await this.ensureRedisConnection();
            await client.del(this.CACHE_KEY);
            console.log('[CategoryCache] Redis cache invalidated');
        }
        catch (error) {
            console.error('[CategoryCache] Failed to invalidate cache:', error);
        }
    }
    async getStats() {
        try {
            const client = await this.ensureRedisConnection();
            const cached = await client.get(this.CACHE_KEY);
            const ttl = cached ? await client.ttl(this.CACHE_KEY) : -2;
            return {
                cached: cached !== null,
                count: cached ? JSON.parse(cached).length : 0,
                ttl: ttl,
                expiresIn: ttl > 0 ? `${Math.floor(ttl / 60)} minutes` : 'N/A',
                redisConnected: this.redisClient?.isOpen || false
            };
        }
        catch (error) {
            return {
                cached: false,
                count: 0,
                ttl: -2,
                expiresIn: 'N/A',
                redisConnected: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async disconnect() {
        if (this.redisClient?.isOpen) {
            await this.redisClient.quit();
            console.log('[CategoryCache] Redis connection closed');
        }
    }
}
exports.CategoryCacheService = CategoryCacheService;

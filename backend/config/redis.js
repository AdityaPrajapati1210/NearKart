const Redis = require("ioredis");

const redis = new Redis({
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT) || 6379,

    maxRetriesPerRequest: 3,

    retryStrategy(times) {
        const delay = Math.min(times * 100, 2000);
        return delay;
    }
});

// --------------------------------------------------
// Redis connection events
// --------------------------------------------------

redis.on("connect", () => {
    console.log("Redis connecting...");
});

redis.on("ready", () => {
    console.log("Redis connected successfully");
});

redis.on("error", (err) => {
    console.error("Redis error:", err.message);
});

redis.on("close", () => {
    console.log("Redis connection closed");
});

module.exports = redis;
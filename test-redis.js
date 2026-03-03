const Redis = require('ioredis');
console.log('Testing Redis connection...');
const redis = new Redis({
    host: 'localhost',
    port: 6379,
    connectTimeout: 2000,
    retryStrategy: () => null
});

redis.set('test', 'ok').then(() => {
    console.log('Redis SET works');
    process.exit(0);
}).catch(err => {
    console.log('Redis error (expected if no redis):', err.message);
    process.exit(0);
});

setTimeout(() => {
    console.log('Timed out');
    process.exit(0);
}, 3000);

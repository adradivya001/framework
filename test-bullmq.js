const { Queue } = require('bullmq');
console.log('Testing BullMQ Queue...');
const myQueue = new Queue('test_queue', {
    connection: {
        host: 'localhost',
        port: 6379
    }
});

myQueue.add('test_job', { foo: 'bar' }).then(() => {
    console.log('BullMQ ADD works');
    process.exit(0);
}).catch(err => {
    console.log('BullMQ error:', err.message);
    process.exit(0);
});

setTimeout(() => {
    console.log('Timed out');
    process.exit(0);
}, 3000);

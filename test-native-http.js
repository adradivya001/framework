const http = require('http');
const server = http.createServer((req, res) => {
    res.end('ok');
});
console.log('Starting native HTTP server...');
server.listen(4000, () => {
    console.log('Native HTTP server running on http://localhost:4000');
    process.exit(0);
});

setTimeout(() => {
    console.log('Timed out');
    process.exit(0);
}, 5000);

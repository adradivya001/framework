const express = require('express');
const app = express();
app.get('/test', (req, res) => {
    res.send('ok');
});
console.log('Starting ultra simple Express server...');
app.listen(4001, () => {
    console.log('Ultra simple Express server running on http://localhost:4001');
    process.exit(0);
});

setTimeout(() => {
    console.log('Timed out');
    process.exit(0);
}, 5000);

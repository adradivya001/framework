const express = require('express');
const app = express();
app.use(express.json());

app.post('/thread/init', (req, res) => {
    console.log('Received thread/init', req.body);
    res.json({ id: 'mock-express-thread-id', domain: req.body.domain });
});

app.listen(3002, () => {
    console.log('Express test server running on http://localhost:3002');
});

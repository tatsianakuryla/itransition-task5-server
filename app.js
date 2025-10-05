const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (request, response) => {
    response.json({ message: 'Hello World' });
});

app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}/`);
});
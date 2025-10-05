const express = require('express');
const { Api } = require('./api/api');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (request, response) => {
    response.json({
        status: 'success',
        time: new Intl.DateTimeFormat('en-US', {
            month: '2-digit',
            year: 'numeric',
            day: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour: '2-digit',
        }).format(new Date()),
    });
});

app.get('/users', Api.getUsers);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}/`);
});
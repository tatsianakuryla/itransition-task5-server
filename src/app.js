require('dotenv').config();
const express = require('express');
const { usersRouter } = require('./router/users.router');
const { prisma } = require('./db/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/users', usersRouter);

app.get('/', (request, response) => {
    return response.json({ status: 'ok'});
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}/`);
});

app.use((error, request, response, next) => {
    console.error(error);
    response.status(error.status || 500).json({ error: error.message || 'Server error' });
});

process.on('SIGINT', async () => {
    console.log('Shutting down...');
    await prisma.$disconnect();
    process.exit(0);
});
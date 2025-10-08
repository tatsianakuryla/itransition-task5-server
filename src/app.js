require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { usersRouter } = require('./router/users.router');
const { prisma } = require('./db/db');

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
    'http://localhost:5173',
    'https://site--itransition-task5-client--kfjltdjcwqvn.code.run'
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

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
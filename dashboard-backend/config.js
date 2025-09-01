require('dotenv').config();

module.exports = {
    port: process.env.PORT || 3300,
    frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
    databaseUrl: process.env.DATABASE_URL,
};
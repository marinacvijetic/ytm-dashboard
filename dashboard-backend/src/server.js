// Creating server, listening for incoming requests, handling errors
require('dotenv').config();
const { port, frontendOrigin } = require('../config');
const app = require('./app');
const server = require('http').createServer(app);
const PORT = process.env.PORT || 3300;

const HOST = '0.0.0.0';
app.listen(port, HOST, () => {
  const shownHost = HOST === '0.0.0.0' ? 'localhost' : HOST;
  console.log(`✅ Server is running at http://${shownHost}:${port}`);
});
// Responsible for defining routes, middleware, application-level functionality
const express = require('express');
const app = express();
const clientRoutes = require('./routes/client.routes');
const cors = require('cors');

// Allow all origins during development
app.use(cors());
app.use(express.json());
app.use('/api', clientRoutes);

app.get('/', (req, res) => {
  res.send('Homepage is working!');
});

module.exports = app;


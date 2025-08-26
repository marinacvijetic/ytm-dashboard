// Responsible for defining routes, middleware, application-level functionality
const express = require('express');
const app = express();
const clientRoutes = require('./routes/client.routes');
const statisticsRoutes = require('./routes/statistics.routes');
const cors = require('cors');

// Allow all origins during development
app.use(cors());
app.use(express.json());
app.use('/api', clientRoutes, statisticsRoutes);

app.get('/', (req, res) => {
  res.send('Homepage is working!');
});

const errorHandler = require('./middlewares/errorHandler');

app.use(errorHandler);

module.exports = app;


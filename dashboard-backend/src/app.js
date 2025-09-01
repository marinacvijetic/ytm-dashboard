// Responsible for defining routes, middleware, application-level functionality
const express = require('express');
const cors = require('cors');
const { frontendOrigin } = require('../config');

const app = express();

// Dev: Allow all origins. Prod: Allow only frontend origin
const corsOptions = process.env.NODE_ENV === 'development' 
  ? { origin: true, credentials: false }
  : { origin: frontendOrigin, credentials: false };

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());

// Routes
const clientRoutes = require('./routes/client.routes');
const statisticsRoutes = require('./routes/statistics.routes');
app.use('/api', clientRoutes, statisticsRoutes);

app.get('/', (req, res) => {
  res.send('Homepage is working!');
});

const errorHandler = require('./middlewares/errorHandler');

app.use(errorHandler);

module.exports = app;


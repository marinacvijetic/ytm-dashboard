const express = require('express');
const router = express.Router();
const clientController = require('../controllers/client.controller');

router.get('/clients', clientController.getPaginatedClients);

router.get('/all-clients', clientController.getAllClients);

router.post('/register-app', clientController.registerApp);

router.post('/heartbeat', clientController.heartbeat);

router.put('/clients/:clientId/services/:serviceId/setMain',clientController.setMainService);

module.exports = router;
const express = require('express');
const router = express.Router();
const clientController = require('../controllers/client.controller');

router.get('/clients', clientController.getPaginatedClients);

router.get('/all-clients', clientController.getAllClients);

router.get('/app-info/sync', clientController.syncAllAppInfo)

router.post('/register-app', clientController.registerApp);

module.exports = router;
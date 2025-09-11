const express = require('express');
const router = express.Router();
const clientController = require('../controllers/client.controller');

router.get('/clients', clientController.getAllClients);

router.get('/app-info/sync/:appId', clientController.syncAppInfo)

router.post('/register-app', clientController.registerApp);

module.exports = router;
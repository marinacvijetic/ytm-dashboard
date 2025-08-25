const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statistics.controller');

router.post('/statistics', statisticsController.receiveStatisticsInfo);
router.get('/statistics', statisticsController.getAllLogs);
router.get('/statistics/apps', statisticsController.getAppIds);
router.get('/statistics/:appId/latest', statisticsController.getLatestLogByAppId);

module.exports = router;
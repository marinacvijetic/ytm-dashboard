const express = require('express');
const router = express.Router();
const eventBus = require('../utils/eventBus');

router.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders && res.flushHeaders();

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const onClientUpdate = (payload) => sendEvent('client_update', payload);
  const onStatsUpdate = (payload) => sendEvent('stats_update', payload);

  eventBus.on('client_update', onClientUpdate);
  eventBus.on('stats_update', onStatsUpdate);

  req.on('close', () => {
    eventBus.off('client_update', onClientUpdate);
    eventBus.off('stats_update', onStatsUpdate);
  });
});

module.exports = router;
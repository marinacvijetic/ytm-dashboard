const express = require("express");
const router = express.Router();
const eventBus = require("../utils/eventBus");

router.get("/events", (req, res) => {
  res.status(200);
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");

  const origin = req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Credentials", "false");

  if (res.flushHeaders) res.flushHeaders();

  res.write(`: connected\n\n`);

  const heartbeatInterval = setInterval(() => {
    res.write(`event: ping\ndata: {}\n\n`);
  }, 15000);

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const onClientUpdate = (payload) => sendEvent("client_update", payload);
  const onStatsUpdate = (payload) => sendEvent("stats_update", payload);

  eventBus.on("client_update", onClientUpdate);
  eventBus.on("stats_update", onStatsUpdate);

  const close = () => {
    clearInterval(heartbeatInterval);
    eventBus.off("client_update", onClientUpdate);
    eventBus.off("stats_update", onStatsUpdate);
    try {
      res.end();
    } catch (_) {}
  };

  req.on("close", close);
  req.on("end", close);
});

module.exports = router;

const express = require("express");
const router = express.Router();
const eventBus = require("../utils/eventBus");

router.get("/events", (req, res) => {
  res.status(200);
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");

  res.setHeader("X-Accel-Buffering", "no");     //disable proxy buffering
  res.setHeader("Content-Encoding", "identity"); //SSE must not be compressed

  const origin = req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Credentials", "false");

  if (res.flushHeaders) res.flushHeaders();

   // Browser how fast to auto-retry if disconnected
  res.write(`retry: 15000\n\n`);

  const onClientUpdate = (payload) =>
    res.write(`event: client_update\ndata: ${JSON.stringify(payload)}\n\n`);
  const onStatsUpdate = (payload) =>
    res.write(`event: stats_update\ndata: ${JSON.stringify(payload)}\n\n`);

  // Heartbeat every 15s so proxies don't assume the connection is idle
  const heartbeatInterval = setInterval(() => {
    res.write(`event: ping\ndata: {"t":"${new Date().toISOString()}"}\n\n`);
  }, 15000);

  eventBus.on("client_update", onClientUpdate);
  eventBus.on("stats_update", onStatsUpdate);

  const close = () => {
    clearInterval(heartbeatInterval);
    eventBus.off("client_update", onClientUpdate);
    eventBus.off("stats_update", onStatsUpdate);
    try { res.end(); } catch (_) {}
  };

  req.on("close", close);
});

module.exports = router;

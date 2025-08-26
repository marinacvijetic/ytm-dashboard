module.exports = (err, req, res, next) => {
  const status = err.status || 500;
  const payload = {
    status: "error",
    error: {
      type: err.type || "ApplicationError",
      message: err.message || "Internal Server Error",
      code: err.code || String(status),
      request: { method: req.method, url: req.originalUrl, timestamp: new Date().toISOString() }
    }
  };
  if (process.env.NODE_ENV !== "production" && err.stack) {
    payload.error.stack = err.stack;
  }
  res.status(status).json(payload);
};

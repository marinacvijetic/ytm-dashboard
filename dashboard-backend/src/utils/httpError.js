function classifyAxiosError(err, { method, url, appId }) {
  const req = { method, url, appId, timestamp: new Date().toISOString() };

  const code = err.code || (err.response && String(err.response.status)) || "UNKNOWN";

  if (err.response) {
    const status = err.response.status;
    let body = err.response.data;
    if (typeof body === 'object') {
      try { body = JSON.stringify(body); } catch { body = String(body); }
    } else if (typeof body !== 'string') {
      body = String(body);
    }
    body = (body || '').slice(0, 300);

    return {
      status: "error",
      error: {
        type: "HTTPError",
        message: `HTTP ${status} while calling ${url}`,
        code: String(status),
        request: req,
        response: { status, body }
      }
    };
  }

  const map = {
    ECONNREFUSED:            { type: "NetworkError",      msg: "Connection refused (service down or port blocked)" },
    ENOTFOUND:               { type: "DNSResolutionError",msg: "Host not found (DNS error)" },
    ETIMEDOUT:               { type: "TimeoutError",      msg: "Connection timed out" },
    ESOCKETTIMEDOUT:         { type: "TimeoutError",      msg: "Socket timed out" },
    ECONNABORTED:            { type: "TimeoutError",      msg: "Request timeout exceeded" },
    ERR_TLS_CERT_ALTNAME_INVALID: { type: "TLSCertificateError", msg: "TLS certificate mismatch" }
  };
  const known = map[code];

  return {
    status: "error",
    error: {
      type: known?.type || "UnknownError",
      message: known?.msg || (err.message || "Unknown error"),
      code,
      request: req
    }
  };
}

module.exports = { classifyAxiosError };

const statisticsModel = require("../models/statistics.model");
const health = require("../models/health.model");
const clientModel = require("../models/client.model");
const eventBus = require('../utils/eventBus');
const { Prisma } = require("@prisma/client");

exports.receiveStatisticsInfo = async (req, res) => {
  const statsPayload = req.body;
  try {
    if (!statsPayload.id) return res.status(400).json({ error: "Missing id" });
    if (!statsPayload.recordedAt)
      return res.status(400).json({ error: "Missing recordedAt" });
    if (!statsPayload.appId)
      return res.status(400).json({ error: "Missing appId" });

    const created = await statisticsModel.createStatisticsLog(statsPayload);

    await health.markStatsJob(statsPayload.appId, true);

    const clientApp = await clientModel.findClientByAppId(statsPayload.appId);
    if (clientApp) {
      const flagged = {
        ...clientApp, status_flags: health.computeHealthFlags(clientApp),
      };
      eventBus.emit('client_update', flagged);
    }

    eventBus.emit('stats_update', created);

    return res.status(200).json(created);
  } catch (err) {
    console.error("Failed to create statistics_log:", err);

    if (statsPayload && statsPayload.appId) {
      try {
        await health.markStatsJob(statsPayload.appId, false);
        const clientApp = await clientModel.findClientByAppId(statsPayload.appId);
        if (clientApp) {
          const flagged = {
            ...clientApp, status_flags: health.computeHealthFlags(clientApp),
          };
          eventBus.emit('client_update', flagged);
        }
      } catch (err){
        console.error("Failed to markStatsJob:", err);
      }
    }

    return res
      .status(err instanceof Prisma.PrismaClientValidationError ? 400 : 500)
      .json({ error: err.message });
  }
};

exports.getAllLogs = async function getAllLogs(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page ?? "1", 10), 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit ?? "20", 10), 1),
      200
    );
    const appId = String(req.query.appId || "").trim();

    if (!appId) {
      return res.json({ data: [], page, totalPages: 1, totalCount: 0 });
    }

    const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
    const ymdStart = (y) =>
      ISO_DATE_RE.test(y)
        ? new Date(
            Number(y.slice(0, 4)),
            Number(y.slice(5, 7)) - 1,
            Number(y.slice(8, 10)),
            0,
            0,
            0,
            0
          )
        : null;
    const addDays = (d, n) => {
      const x = new Date(d);
      x.setDate(x.getDate() + n);
      return x;
    };

    const fromY = req.query.from ? String(req.query.from) : null;
    const toY = req.query.to ? String(req.query.to) : null;

    let from = fromY ? ymdStart(fromY) : null;
    let to = toY ? ymdStart(toY) : null;
    if (from && to && from > to) [from, to] = [to, from];

    const upperExclusive = to ? addDays(to, 1) : null;

    // ⬇️ use the imported model
    const out = await statisticsModel.list({
      page,
      limit,
      appId,
      from,
      to: upperExclusive,
    });
    return res.json(out);
  } catch (err) {
    console.error("GET /statistics failed:", err);
    return res
      .status(500)
      .json({ error: "STATISTICS_LIST_FAILED", message: err.message });
  }
};

exports.getAppIds = async (_req, res) => {
  try {
    const apps = await statisticsModel.findDistinctAppIds();
    res.json(apps);
  } catch (err) {
    console.error("Error in getAppIds:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getLatestLogByAppId = async (req, res) => {
  try {
    const appId = req.params.appId;
    const log = await statisticsModel.findLatestLogByAppId(appId);
    if (!log) {
      return res.status(404).json({ error: "Not Found" });
    }
    res.json(log);
  } catch (err) {
    console.error("Error in getLatestLogByAppId:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Returns JS Date at local midnight for YYYY-MM-DD (no TZ drift issues
// on the DB because we query [gte: from, lt: to+1day]).
function parseYmdStart(ymd) {
  if (!ISO_DATE_RE.test(ymd)) return null;
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0); // local midnight
}

// add N days (used to make the upper bound exclusive)
function addDays(d, n) {
  const dt = new Date(d.getTime());
  dt.setDate(dt.getDate() + n);
  return dt;
}

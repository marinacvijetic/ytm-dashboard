
const statisticsModel = require('../models/statistics.model');

exports.receiveStatisticsInfo = async (req, res) => {
  try {
    const statsPayload = req.body;

    if(!statsPayload.id) return res.status(400).json({ error: 'Missing id' });
    if(!statsPayload.recordedAt) return res.status(400).json({ error: 'Missing recordedAt' });
    if(!statsPayload.appId) return res.status(400).json({ error: 'Missing appId' });

    const created = await statisticsModel.createStatisticsLog(statsPayload);
    return res.status(201).json(created);
  } catch (err) {
    console.error("Failed to create statistics_log:", err);
    return res
      .status(err instanceof prisma.Prisma.PrismaClientValidationError ? 400 : 500)
      .json({ error: err.message });
  }
};

// GET /statistics
exports.getAllLogs = async (req, res) => {
  const page = parseInt(req.query.page || "1", 10);
  const limit = parseInt(req.query.limit || "6", 10);

  const safePage = isNaN(page) || page < 1 ? 1 : page;
  const safeLimit = isNaN(limit) || limit < 1 ? 6 : limit;
  const skip = (safePage - 1) * safeLimit;

  try {
    const [data, totalCount] = await Promise.all([
      statisticsModel.findLogsPage(skip, safeLimit, appId), 
      statisticsModel.countLogs(appId),
    ]);

    const totalPages = Math.ceil(totalCount / safeLimit);

    res.json({
      data,
    page: safePage,
      totalPages,
      totalCount,
      pageSize: safeLimit,
    });
  } catch (err) {
    console.error("Error in getStatisticsLogs:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getAppIds = async (_req, res) => {
  try {
    const appIds = await statisticsModel.findDistinctAppIds();
    res.json(appIds);
  } catch (err) {
    console.error("Error in getAppIds:", err);
    res.status(500).json({ error: "Internal Server Error"});
  }
};

exports.getLatestLogByAppId = async (req, res) => {
  try{
    const appId = req.params.appId;
    const log = await statisticsModel.findLatestLogByAppId(appId);
    if(!log) {
      return res.status(404).json({ error: "Not Found"});
    }
    res.json(log);
  } catch(err) {
    console.error("Error in getLatestLogByAppId:", err);
    res.status(500).json({ error: "Internal Server Error"});
  }
}
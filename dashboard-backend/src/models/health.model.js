const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.markReachability = async (app_id, ok) => {
  if (!app_id) return;
  await prisma.clientApplication.update({
    where: { app_id },
    data: {
      last_reachability_check_at: new Date(),
      last_reachability_ok: !!ok,
    },
  });
};

exports.markManualSyncSuccess = async (app_id) => {
  if (!app_id) return;
  await prisma.clientApplication.update({
    where: { app_id },
    data: {
      last_manual_sync_at: new Date(),
      last_update: new Date(),
    },
  });
};

exports.markAppInfoJob = async (app_id, ok) => {
  if (!app_id) return;
  await prisma.clientApplication.update({
    where: { app_id },
    data: {
      last_appinfo_job_at: new Date(),
      last_appinfo_job_ok: !!ok,
      ...(ok ? { last_update: new Date() } : {}), 
    },
  });
};

exports.markStatsJob = async (app_id, ok) => {
  if (!app_id) return;
  await prisma.clientApplication.update({
    where: { app_id },
    data: {
      last_stats_job_at: new Date(),
      last_stats_job_ok: !!ok,
    },
  });
};

// Utility to compute flags (use from controllers)
exports.computeHealthFlags = (row) => {
  const now = Date.now();
  const H  = 60 * 60 * 1000;
  const H24 = 24 * H;
  const D7  = 7 * 24 * H;
  const GRACE = H; // 1h

  const toMs = (d) => (d ? new Date(d).getTime() : 0);
  const freshest = Math.max(
    toMs(row.last_manual_sync_at),
    toMs(row.last_appinfo_job_at),
    toMs(row.last_stats_job_at),
    toMs(row.last_update) // legacy
  );

  const flags = {
    down: (row.last_reachability_check_at && (now - toMs(row.last_reachability_check_at) <= H24))
            ? row.last_reachability_ok === false
            : false,
    outdated: freshest ? (now - freshest > 25 * H) : true, // 25h rule
    appinfo_job_late: row.last_appinfo_job_at
            ? ((now - toMs(row.last_appinfo_job_at) > (H24 + GRACE)) || row.last_appinfo_job_ok === false)
            : true,
    stats_job_late: row.last_stats_job_at
            ? ((now - toMs(row.last_stats_job_at) > (D7 + GRACE)) || row.last_stats_job_ok === false)
            : true,
  };

  return flags;
};

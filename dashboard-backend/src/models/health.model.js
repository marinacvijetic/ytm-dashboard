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


exports.computeHealthFlags = (row) => {
  const now = Date.now();
  const H  = 60 * 60 * 1000;
  const H24 = 24 * H;
  const D7  = 7 * 24 * H;
  const GRACE = H; // 1h

  const toMs = (d) => (d ? new Date(d).getTime() : 0);

  // --- helpers for Monday alignment (0=Sun, 1=Mon)
  const MON = 1;
  const startOfDay = (t) => { const d = new Date(t); d.setHours(0,0,0,0); return d; };
  const endOfDayMs = (t) => { const d = new Date(t); d.setHours(23,59,59,999); return +d; };
  const nextMondayOnOrAfter = (t) => {
    const d = startOfDay(t);
    const dow = d.getDay();
    const delta = (MON - dow + 7) % 7; // 0 if already Monday
    d.setDate(d.getDate() + delta);
    return d; // Monday 00:00
  };

  const freshest = Math.max(
    toMs(row.last_manual_sync_at),
    toMs(row.last_appinfo_job_at),
    toMs(row.last_stats_job_at),
    toMs(row.last_update)
  );

  

  //DOWN logic: failed reachability AND no later success
  const reachMs = toMs(row.last_reachability_check_at);
  const hasRecentFailedReach =
    reachMs &&
    (now - reachMs <= H24) &&
    row.last_reachability_ok === false;

  // Any success AFTER the failed reachability? (manual pull OR appinfo push)
  const successAfterFail =
    Math.max(
      toMs(row.last_manual_sync_at),
      toMs(row.last_appinfo_job_at), 
      toMs(row.last_stats_job_at)
    ) > reachMs;

  const down = hasRecentFailedReach && !successAfterFail;

  const outdated = freshest ? (now - freshest > 25 * H) : true;

  const appinfo_job_late = row.last_appinfo_job_at
    ? ((now - toMs(row.last_appinfo_job_at) > (H24 + GRACE)) || row.last_appinfo_job_ok === false)
    : true;

  // stats_job_late calculates "first Monday after created_at" 
  const createdMs = toMs(row.created_at);
  let stats_job_late;
  if (row.last_stats_job_at) {
    // normal weekly cadence: older than 7d + grace, or last attempt failed
    stats_job_late = ((now - toMs(row.last_stats_job_at) > (D7 + GRACE)) || row.last_stats_job_ok === false);
  } else if (createdMs) {
    // no stats yet → give grace until END of first Monday on/after created_at
    const firstMondayDueEnd = endOfDayMs(nextMondayOnOrAfter(createdMs));
    stats_job_late = now > (firstMondayDueEnd + GRACE);
  } else {
    // if created_at is somehow missing, be conservative (do not mark late)
    stats_job_late = false;
  }

  const never_synced = !(row.last_manual_sync_at || row.last_appinfo_job_at || row.last_stats_job_at);

  return {
    down,
    outdated,
    appinfo_job_late,
    stats_job_late,
    never_synced,
  };
};

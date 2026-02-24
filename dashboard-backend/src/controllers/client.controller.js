const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const axios = require("axios");
const clientModel = require("../models/client.model");
const health = require("../models/health.model");
const { classifyAxiosError } = require("../utils/httpError");
const eventBus = require("../utils/eventBus");

// add each row non-exclusive flags
const withFlags = (rows) =>
  rows.map((r) => ({ ...r, status_flags: health.computeHealthFlags(r) }));

exports.getAllClients = async (req, res) => {
  try {
    const clients = await prisma.clientApplication.findMany({
      include: { services: true },
    });
    res.json(withFlags(clients));
  } catch (err) {
    console.error("Error in getAllClients:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getPaginatedClients = async (req, res) => {
  const page = parseInt(req.query.page || "1", 10);
  const limit = parseInt(req.query.limit || "5", 10);
  const sortField = req.query.sortField || "app_title";
  const sortOrder = req.query.sortOrder === "desc" ? "desc" : "asc";

  // existing filters
  const app_id = req.query.app_id || "";
  const last_update = req.query.last_update || "";

  // boolean filters
  const parseBool = (v) =>
    v === "true" ? true : v === "false" ? false : undefined;
  const proctor_edu = parseBool(req.query.proctor_edu);
  const proctorio = parseBool(req.query.proctorio);
  const superset_apache = parseBool(req.query.superset_apache);
  const rest_api = parseBool(req.query.rest_api);
  const ecommerce = parseBool(req.query.ecommerce);
  const sso = parseBool(req.query.sso);
  const open_ai = parseBool(req.query.open_ai);
  const green_house = parseBool(req.query.green_house);
  const lti = parseBool(req.query.lti);
  const billing_enabled = parseBool(req.query.billing_enabled);

  const safePage = isNaN(page) || page < 1 ? 1 : page;
  const safeLimit = isNaN(limit) || limit < 1 ? 5 : limit;
  const skip = (safePage - 1) * safeLimit;

  try {
    const filters = {
      app_id,
      last_update,
      proctor_edu,
      proctorio,
      superset_apache,
      rest_api,
      ecommerce,
      sso,
      open_ai,
      green_house,
      lti,
      billing_enabled,
    };

    const [data, totalCount] = await Promise.all([
      clientModel.findClientsPage(
        skip,
        safeLimit,
        filters,
        sortField,
        sortOrder,
      ),
      clientModel.countClientsFiltered(filters),
    ]);

    const totalPages = Math.ceil(totalCount / safeLimit);

    return res.json({
      data: withFlags(data),
      page: safePage,
      totalPages,
      totalCount,
      pageSize: safeLimit,
    });
  } catch (err) {
    console.error("Error in getPaginatedClients:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.registerApp = async (req, res) => {
  const payload = req.body || {};
  const appId = payload.appId || payload.app_id;

  try {
    const {
      appId,
      title,
      version,
      url,
      apiUrl,
      proctorEdu,
      proctorio,
      superset,
      restApi,
      ecommerce,
      sso,
      openAi,
      greenHouse,
      lti,
      billingEnabled,
      billingRemainingCredit,
      services,
    } = req.body;

    if (!appId) {
      return res.status(400).json({ error: "Invalid request payload" });
    }

    // 1) Update/insert client application
    let clientApp = await clientModel.findClientByAppId(appId);
    if (!clientApp) {
      clientApp = await clientModel.createClient(
        appId,
        title,
        version,
        url,
        apiUrl,
        proctorEdu,
        proctorio,
        superset,
        restApi,
        ecommerce,
        sso,
        openAi,
        greenHouse,
        lti,
        billingEnabled,
        billingRemainingCredit
      );
    } else {
      clientApp = await clientModel.updateClient(
        appId,
        title,
        version,
        url,
        apiUrl,
        proctorEdu,
        proctorio,
        superset,
        restApi,
        ecommerce,
        sso,
        openAi,
        greenHouse,
        lti,
        billingEnabled,
        billingRemainingCredit
      );
    }

    if (Array.isArray(services)) {
      for (const svc of services) {
        await prisma.services.upsert({
          where: { id: svc.id },
          create: {
            id: svc.id,
            appId: svc.app_id,
            type: svc.type,
            client_applications: { connect: { app_id: clientApp.app_id } },
          },
          update: {
            // in case type changed
            type: svc.type,
          },
        });
      }
    }
    // Mark registration as a successful ping and active app
    await clientModel.updatePingStatus(appId, true);
    try {
      await health.markAppInfoJob(appId, true);
    } catch {}
    clientApp = await clientModel.findClientByAppId(appId);

    // 4) Emit event and respond
    eventBus.emit("app_registered", {
      clientId: clientApp.client_id,
      appId,
    });

    res.status(200).json({ message: "App registered successfully", clientApp });
  } catch (err) {
    console.error("Register App Error:", err);
    // mark job failure if we know the app id
    if (req?.body?.appId) {
      try {
        await health.markAppInfoJob(req.body.appId, false);
      } catch {}
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.syncAppInfo = async (req, res) => {
  const { appId } = req.params;

  try {
    const client = await prisma.clientApplication.findUnique({
      where: { app_id: appId },
      include: { services: true },
    });

    if (!client) {
      return res.status(404).json({ error: "Client application not found" });
    }

    const baseUrl = (client.url || "").replace(/\/$/, "");
    if (!baseUrl) {
      return res
        .status(400)
        .json({ error: "Client has no API URL configured" });
    }

    const servletUrl = `${baseUrl}/app/info`;
    try {
      const { data: appInfo } = await axios.get(servletUrl, {
        headers: "application/json",
      });

      if (!appInfo || typeof appInfo !== "object" || !appInfo.title) {
        return res.status(502).json({
          status: "error",
          error: {
            type: "InvalidResponse",
            message: "Invalid response payload from target application",
            code: "INVALID_RESPONSE",
            request: {
              method: "GET",
              url: servletUrl,
              appId: client.app_id,
              timestamp: new Date().toISOString(),
            },
            response: { status: 200, body: JSON.stringify(appInfo) },
          },
        });
      }

      await clientModel.updateClient(
        client.app_id,
        appInfo.title,
        appInfo.version,
        appInfo.url,
        appInfo.apiUrl,
        appInfo.proctorEdu,
        appInfo.proctorio,
        appInfo.superset,
        appInfo.restApi,
        appInfo.ecommerce,
        appInfo.sso,
        appInfo.openAi,
        appInfo.greenHouse,
        appInfo.lti,
        appInfo.billingEnabled,
        appInfo.billingRemainingCredit
      );

      if (Array.isArray(appInfo.services)) {
        for (const svc of appInfo.services) {
          await prisma.services.upsert({
            where: { id: svc.id },
            create: {
              id: svc.id,
              app_id: svc.app_id,
              type: svc.type,
              client_applications: { connect: { app_id: client.app_id } },
            },
            update: {
              // in case type changed
              type: svc.type,
            },
          });
        }
      }

      await clientModel.updatePingStatus(client.app_id, true);
      await Promise.all([
        health.markManualSyncSuccess(client.app_id),
        health.markReachability(client.app_id, true),
      ]);

      const finalClient = await clientModel.findClientByAppId(client.app_id);
      const finalWithFlags = {
        ...finalClient,
        status_flags: health.computeHealthFlags(finalClient),
      };
      return res.json(finalWithFlags);
    } catch (e) {
      console.error(`Failed to sync app info for ${client.app_id}:`, e.message);
      await clientModel.updatePingStatus(client.app_id, false, false);

      try {
        await health.markReachability(client.app_id, false);
      } catch {}

      const failedClient = await clientModel.findClientByAppId(client.app_id);
      const classified = classifyAxiosError(e, {
        method: "GET",
        url: servletUrl,
        appId: client.app_id,
      });

      // include current flags so the row can update immediately in UI
      classified.client = {
        ...failedClient,
        status_flags: health.computeHealthFlags(failedClient),
      };

      const statusCode = /^\d+$/.test(classified?.error?.code || "")
        ? Number(classified.error.code)
        : 503;
      return res.status(statusCode).json(classified);
    }
  } catch (e) {
    console.error("Application information sync failed", e);
    return res.status(500).json({
      status: "error",
      error: {
        type: "ApplicationError",
        message: "Sync failed",
        code: "INTERNAL_ERROR",
        details: e.message,
      },
    });
  }
};

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const axios = require("axios");
const clientModel = require("../models/client.model");
const eventBus = require("../utils/eventBus");
const { classifyAxiosError } = require("../utils/httpError");

exports.getAllClients = async (req, res) => {
  try {
    const clients = await prisma.clientApplication.findMany({
      include: { services: true },
    });
    res.json(clients);
  } catch (err) {
    console.error("Error in getAllClients:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getPaginatedClients = async (req, res) => {
  // Parse `page` and `limit` from the query string (defaults: page=1, limit=10)
  const page = parseInt(req.query.page || "1", 10);
  const limit = parseInt(req.query.limit || "6", 10);

  // If invalid page/limit, force sensible defaults
  const safePage = isNaN(page) || page < 1 ? 1 : page;
  const safeLimit = isNaN(limit) || limit < 1 ? 6 : limit;

  // Compute how many rows to skip (0-based)
  const skip = (safePage - 1) * safeLimit;

  try {
    // 2) Use your Prisma helpers—no raw SQL here
    const [data, totalCount] = await Promise.all([
      clientModel.findClientsPage(skip, safeLimit),
      clientModel.countClients(),
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
    console.error("Error in getPaginatedClients:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.registerApp = async (req, res) => {
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
        superset
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
        superset
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
    clientApp = await clientModel.findClientByAppId(appId);

    // 4) Emit event and respond
    eventBus.emit("app_registered", {
      clientId: clientApp.client_id,
      appId,
    });

    res.status(200).json({ message: "App registered successfully", clientApp });
  } catch (err) {
    console.error("Register App Error:", err);
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

    const baseUrl = ('http://localhost:8085/ytm.webview/' || "").replace(/\/$/, "");
    // const baseUrl = (client.url || "").replace(/\/$/, "");
    if (!baseUrl) {
      return res
        .status(400)
        .json({ error: "Client has no API URL configured" });
    }

    const servletUrl = `${baseUrl}/app/info`;
    try {
      const { data: appInfo } = await axios.get(servletUrl, {
        headers: { "Accept": "application/json", "User-Agent": "ytm-dashboard/1.0" }
      });

            if (!appInfo || typeof appInfo !== "object" || !appInfo.title) {
        return res.status(502).json({
          status: "error",
          error: {
            type: "InvalidResponse",
            message: "Invalid response payload from target application",
            code: "INVALID_RESPONSE",
            request: { method: "GET", url: servletUrl, appId: client.app_id, timestamp: new Date().toISOString() },
            response: { status: 200, body: JSON.stringify(appInfo) }
          }
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
        appInfo.superset
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
      const finalClient = await clientModel.findClientByAppId(client.app_id);
      return res.json(finalClient);
    } catch (e) {
      console.error(`Failed to sync app info for ${client.app_id}:`, e.message);
      await clientModel.updatePingStatus(client.app_id, false);
      const failedClient = await clientModel.findClientByAppId(client.app_id);
      const classified = classifyAxiosError(e, { method: 'GET', url: servletUrl, appId: client.app_id });
      classified.client = failedClient;
      
      const statusCode = (/^\d+$/.test(classified?.error?.code || '') ? Number(classified.error.code) : 503);
      return res.status(statusCode).json(classified);

    }
  } catch (e) {
    console.error("Application information sync failed", e);
    return res.status(500).json({ 
      status: "error", 
      error: {type: "ApplicationError", message: "Sync failed", code: "INTERNAL_ERROR", details: e.message} 
    });
  }
};

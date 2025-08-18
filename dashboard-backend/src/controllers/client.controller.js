const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const axios = require('axios');
const clientModel = require("../models/client.model");
const eventBus = require("../utils/eventBus");

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
    console.error("Error in getAllClients:", err.message);
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
            client_applications: { connect: { app_id: clientApp.app_id },
            },
          },
          update: {
            // in case type changed
            type: svc.type,
          },
        });
      }
    }

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

exports.syncAllAppInfo = async (req, res) => {
    try {
      const clients = await prisma.clientApplication.findMany({
      include: { services: true },
    });

      const results = await Promise.all(clients.map(async (client) => {
        const baseUrl = ('http://localhost:8085/ytm.webview/' || '').replace(/\/+$/, '');
        if(!baseUrl) {
          return { appId: client.app_id, status: 'skipped', reason: 'no URL'};
        }

        const servletUrl = `${baseUrl}/app/info`;
        try {
          const { data: appInfo } = await axios.get(servletUrl, {timeout: 10_000});
          await clientModel.updateClient(
            client.app_id,
            appInfo.title,
            appInfo.version,
            appInfo.url,
            appInfo.api_url,
            appInfo.proctor_edu,
            appInfo.proctorio,
            appInfo.superset_apache
          );

          if(Array.isArray(appInfo.services)) {
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
          return { appId: client.app_id, status: 'updated'};
        }catch (e) {
          console.error(`Failed to sync app info for ${client.app_id}:`, e.message);
          return { appId: client.app_id, status: 'error', reason: e.message };
        }

      }));

      return res.json(results);

    } catch (e) {
      console.error('Application information sync failed', e);
      return res.status(500).json({ error: 'Sync all failed', details: e.message });
    }
  }

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const clientModel = require('../models/client.model');
const eventBus = require('../utils/eventBus');

// exports.getAllClients = async (req, res) => {
//   try {
//     const clients = await prisma.clientApplication.findMany({
//       include: {
//         servers: {
//           select: {
//             server_id:      true,
//             server_name:    true,
//             ip_address:     true,
//             status:         true,
//             is_main:        true,
//             melody:         true,
//             system_info:    true,
//           },
//         },
//       },
//     });
//     // The JSON key will be "servers", so in front-end we use `client.services = data.services`
//     // (or map servers → services if needed).
//     res.json(
//       clients.map((c) => ({
//         client_id: c.client_id,
//         app_id:    c.app_id,
//         app_name:  c.app_name,
//         version:   c.version,
//         url:       c.url,
//         services:  c.services,  // rename key here if you want exact “services”
//       }))
//     );
//   } catch (err) {
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };
exports.getAllClients = async (req, res) => {
 try {
    const clients = await prisma.clientApplication.findMany({
      include: { services: true },
    });
    res.json(clients);
  } catch (err) {
    console.error("Error in getAllClients:", err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }

}


exports.getPaginatedClients = async (req, res) => {
  
  // Parse `page` and `limit` from the query string (defaults: page=1, limit=10)
  const page  = parseInt(req.query.page  || "1", 10);
  const limit = parseInt(req.query.limit || "6", 10);

  // If invalid page/limit, force sensible defaults
  const safePage  = isNaN(page)  || page < 1 ? 1 : page;
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
      page:       safePage,
      totalPages,
      totalCount,
      pageSize: safeLimit,
    });
  } catch (err) {
    console.error("Error in getAllClients:", err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.registerApp = async (req, res) => {
  try {
    const { app_id, app_name, version, url, services } = req.body;

    if (!app_id || !app_name || !version || !url || !Array.isArray(services)) {
      return res.status(400).json({ error: 'Invalid request payload' });
    }

    // 1) Update/insert client application
    let clientApp = await clientModel.findClientByAppId(app_id);
    if (!clientApp) {
      clientApp = await clientModel.createClient(
        app_id,
        app_name,
        version,
        url
      );
    } else {
      clientApp = await clientModel.updateClient(
        app_id,
        app_name,
        version,
        url
      );
    }

    // 2) Main-service election: check if any service already marked main
    const existingMain = await clientModel.findMainService(clientApp.client_id);
    let hasMain = Boolean(existingMain);

    // 3) Process each incoming service
    for (const srv of services) {
      const { service_name, ip_address, status } = srv;
      const existing = await clientModel.findService(
        clientApp.client_id,
        service_name
      );

      if (existing) {
        // just update
        await clientModel.updateService(
          clientApp.client_id,
          service_name,
          ip_address,
          status
        );
      } else {
        // new service: elect as main if none exists yet
        const isMain = !hasMain;
        await clientModel.createService(
          clientApp.client_id,
          service_name,
          ip_address,
          status,
          isMain
        );
        if (isMain) hasMain = true;
      }
    }

    // 4) Emit event and respond
    eventBus.emit('app_registered', {
      clientId: clientApp.client_id,
      app_id,
      serviceCount: services.length,
    });

    res.status(200).json({ message: 'App registered successfully' });
  } catch (err) {
    console.error('Register App Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.heartbeat = async (req, res) => {
  try {
    const { app_id, service_name, status, melody, system_info } = req.body;
    if (!app_id || !service_name || !status) {
      return res.status(400).json({ error: 'app_id, service_name and status required' });
    }
    // find client
    const clientApp = await clientModel.findClientByAppId(app_id);
    if (!clientApp) {
      return res.status(404).json({ error: 'Unknown app_id' });
    }
    // update existing service
    await clientModel.updateHeartbeat(
      clientApp.client_id,
      service_name,
      status,
      melody ?? null,
      system_info ?? null
    );
    res.json({ message: 'Heartbeat updated' });
  } catch (err) {
    console.error('Heartbeat Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.setMainService = async (req, res) => {
  const clientId  = parseInt(req.params.clientId, 10);
  const serviceId = parseInt(req.params.serviceId, 10);
  console.log(`[client.controller] setMainService called with clientId=${clientId}, serviceId=${serviceId}`);
  try {
    // 1) Unset existing main (if any)
    await clientModel.unsetMainService(clientId);
    // 2) Set the new one
    await clientModel.setMainService(serviceId);
    res.json({ message: 'Main service updated' });
  } catch (err) {
    console.error(err);
    console.error(`[client.controller] Error in setMainService:`, err);
    res.status(500).json({ error: 'Could not set main service' });
  }
};

// exports.registerApp = async (req, res) => {
//   try {
//     const { app_id, app_name, version, url, servers } = req.body;

//     if (!app_id || !app_name || !version || !url || !Array.isArray(servers)) {
//       return res.status(400).json({ error: 'Invalid request payload' });
//     }

//     let clientApp = await clientModel.findClientByAppId(app_id);

//     if (!clientApp) {
//       const nextId = await clientModel.getNextClientId();
//       clientApp = await clientModel.createClient(nextId, app_id, app_name, version, url);
//     } else {
//       clientApp = await clientModel.updateClient(app_id, app_name, version, url);
//     }

//     for (const server of servers) {
//       const { server_name, ip_address, status } = server;
//       const existing = await clientModel.findServer(clientApp.client_id, server_name);

//       if (existing) {
//         await clientModel.updateServer(clientApp.client_id, server_name, ip_address, status);
//       } else {
//         const nextServerId = await clientModel.getNextServerId();
//         await clientModel.createServer(nextServerId, clientApp.client_id, server_name, ip_address, status);
//       }
//     }

//     eventBus.emit('app_registered', {
//       clientId: clientApp.client_id,
//       app_id,
//       serverCount: servers.length,
//     });

//     res.status(200).json({ message: 'App registered successfully' });
//   } catch (err) {
//     console.error('Register App Error:', err.message);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// };
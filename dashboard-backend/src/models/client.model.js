const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


exports.findClientByAppId = async (app_id) => {
  return await prisma.clientApplication.findUnique({
    where: { app_id },
  });
};

exports.createClient = async (app_id, app_title, version, url, api_url, proctor_edu, proctorio, superset_apache) => {
  return await prisma.clientApplication.create({
    data: {
      app_id,
      app_title,
      version,
      url,
      api_url,
      created_at: new Date(),
      last_update: new Date(),
      last_ping_successful: true,
      is_active: true,
      proctor_edu,
      proctorio,
      superset_apache,
    },
  });
};

exports.updateClient = async (app_id, app_title, version, url, api_url, proctor_edu, proctorio, superset_apache, last_ping_successful, is_active) => {
  return await prisma.clientApplication.update({
    where: { app_id },
    data: {
      app_title,
      version,
      url,
      api_url,
      last_update: new Date(),
      last_ping_successful: true,
      is_active: true,
      proctor_edu,
      proctorio,
      superset_apache,
    },
  });
};

exports.updatePingStatus = async (app_id, success) => {
  return await prisma.clientApplication.update({
    where: {app_id},
    data: {
      last_update: new Date(),
      last_ping_successful: success,
      is_active: success,
    },
  });
};

exports.findService = async (app_id, type) => {
  return await prisma.services.findUnique({
    where: {
      app_id_service_type: {
        app_id,
        type,
      },
    },
  });
};

exports.createService = async (app_id, type, last_ping, status) => {
  return await prisma.services.create({
    data: {
      app_id,
      type,
      last_ping,
      status
    },
  });
};
exports.updateService = async (app_id, type, last_ping, status) => {
  return await prisma.services.update({
    where: {
      app_id_service_type: {
        app_id,
        type,
      },
    },
    data: {
      last_ping,
      status
    },
  });
};

// Returns the total number of clients in the table.
exports.countClients = async () => {
  try {
    return await prisma.clientApplication.count();
  } catch (err) {
    console.error("[client.model] countClients error:", err);
    throw err;
  }
};

exports.findClientsPage = async (skip, take) => {
  try {
    const clients = await prisma.clientApplication.findMany({
      skip: skip,
      take: take,
      // include: {services: true},
    });

    // Map into the exact shape your front‐end expects:
    return clients;
  } catch (err) {
    console.error("[client.model] findClientsPage error:", err);
    throw err;
  }
};

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.findClientByAppId = async (app_id) => {
  return await prisma.clientApplication.findUnique({
    where: { app_id },
  });
};

exports.createClient = async (
  app_id,
  app_title,
  version,
  url,
  api_url,
  proctor_edu,
  proctorio,
  superset_apache
) => {
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


exports.updateClient = async (
  app_id,
  app_title,
  version,
  url,
  api_url,
  proctor_edu,
  proctorio,
  superset_apache,
  last_ping_successful,
  is_active
) => {
  const data = {
    app_title,
    version,
    url,
    api_url,
    last_update: new Date(),
    proctor_edu,
    proctorio,
    superset_apache,
  };
  if (typeof last_ping_successful === 'boolean') data.last_ping_successful = last_ping_successful;
  if (typeof is_active === 'boolean') data.is_active = is_active;

  return await prisma.clientApplication.update({
    where: { app_id },
    data,
  });
};


exports.updatePingStatus = async (app_id, success, updateLastUpdate = true) => {
  const data = {
    last_ping_successful: success,
    is_active: success,
  };
  if (updateLastUpdate) {
    data.last_update = new Date();
  }
  return await prisma.clientApplication.update({
    where: { app_id },
    data,
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
      status,
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
      status,
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

exports.findClientsPage = async (skip, take, filters, sortField, sortOrder) => {
  try {
    const where = {};
    if (filters.app_id) {
      where.app_id = { contains: filters.app_id, mode: "insensitive" };
    }
    if (filters.last_update) {
      const date = new Date(filters.last_update);
      if (!isNaN(date.getTime())) {
        const start = new Date(date.setHours(0, 0, 0, 0));
        const end = new Date(date.setHours(23, 59, 59, 999));
        where.last_update = { gte: start, lte: end };
      }
    }
    if (typeof filters.proctor_edu === "boolean") {
      where.proctor_edu = filters.proctor_edu;
    }
    if (typeof filters.proctorio === "boolean") {
      where.proctorio = filters.proctorio;
    }
    if (typeof filters.superset_apache === "boolean") {
      where.superset_apache = filters.superset_apache;
    }

    const clients = await prisma.clientApplication.findMany({
      skip,
      take,
      where: Object.keys(where).length ? where : undefined,
      orderBy: { [sortField]: sortOrder },
    });
    return clients;
  } catch (err) {
    console.error("[client.model] findClientsPage error:", err);
    throw err;
  }
};

exports.countClientsFiltered = async (filters) => {
  try {
    const where = {};
    if (filters.app_id) {
      where.app_id = { contains: filters.app_id, mode: "insensitive" };
    }
    if (filters.last_update) {
      const date = new Date(filters.last_update);
      if (!isNaN(date.getTime())) {
        const start = new Date(date.setHours(0, 0, 0, 0));
        const end = new Date(date.setHours(23, 59, 59, 999));
        where.last_update = { gte: start, lte: end };
      }
    }
    if (typeof filters.proctor_edu === "boolean") {
      where.proctor_edu = filters.proctor_edu;
    }
    if (typeof filters.proctorio === "boolean") {
      where.proctorio = filters.proctorio;
    }
    if (typeof filters.superset_apache === "boolean") {
      where.superset_apache = filters.superset_apache;
    }

    return await prisma.clientApplication.count({
      where: Object.keys(where).length ? where : undefined,
    });
  } catch (err) {
    console.error("[client.model] countClientsFiltered error:", err);
    throw err;
  }
};


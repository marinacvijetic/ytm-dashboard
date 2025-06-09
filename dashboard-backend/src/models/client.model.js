const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


exports.findClientByAppId = async (app_id) => {
  return await prisma.clientApplication.findUnique({
    where: { app_id },
  });
};

exports.createClient = async (app_id, app_name, version, url) => {
  return await prisma.clientApplication.create({
    data: {
      app_id,
      app_name,
      version,
      url,
      created_at: new Date(),
      last_update: new Date(),
    },
  });
};

exports.updateClient = async (app_id, app_name, version, url) => {
  return await prisma.clientApplication.update({
    where: { app_id },
    data: {
      app_name,
      version,
      url,
      last_update: new Date(),
    },
  });
};

exports.findService = async (client_id, service_name) => {
  return await prisma.clientAppService.findUnique({
    where: {
      client_id_service_name: {
        client_id,
        service_name,
      },
    },
  });
};

exports.findMainService = async (client_id) => {
  return await prisma.clientAppService.findFirst({
    where: {client_id, is_main: true },
  });
};


exports.createService = async (client_id, service_name, ip_address, status, is_main = false, melody, system_info) => {
  return await prisma.clientAppService.create({
    data: {
      client_id,
      service_name,
      ip_address,
      status,
      last_heartbeat: new Date(),
      is_main,
      melody,
      system_info
    },
  });
};

exports.updateService = async (client_id, service_name, ip_address, status, melody, system_info) => {
  return await prisma.clientAppService.update({
    where: {
      client_id_service_name: {client_id, service_name},
    },
    data: {
      ip_address,
      status,
      last_heartbeat: new Date(),
      melody,
      system_info
    },
  });
};

exports.setMainService = async (service_id) => {
  return prisma.clientAppService.updateMany({
    where: {
      service_id: service_id,   
    },
    data: {
      is_main: true,            
    },
  });
};

exports.unsetMainService = async (client_id) => {
  console.log(`[client.model] → unsetMainService(${client_id})`);
  try {
    const result = await prisma.clientAppService.updateMany({
      where: {
        client_id: client_id,
        is_main:   true,
      },
      data: {
        is_main: false,
      },
    });
    console.log(`[client.model] unsetMainService result =`, result);
    return result;
  } catch (err) {
    console.error(`[client.model] Error in unsetMainService:`, err);
    throw err;
  }
};

exports.updateHeartbeat = async (client_id, service_name, status, melody = null, system_info = null) => {
  return prisma.clientAppService.update({
    where: { client_id_service_name: { client_id, service_name } },
    data: {
      status,
      last_heartbeat: new Date(),
      // only update these if provided
      ...(melody        !== null && { melody }),
      ...(system_info   !== null && { system_info }),
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
      include: {services: true},
    });

    // Map into the exact shape your front‐end expects:
    return clients;
  } catch (err) {
    console.error("[client.model] findClientsPage error:", err);
    throw err;
  }
};

# -------- BUILD STAGE --------
FROM node:22.15.1-slim AS build

WORKDIR /app

RUN apt-get update -y && \
    apt-get install -y openssl libssl-dev curl && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install   # installs dev + prod (needed for prisma)

COPY . .

RUN npx prisma generate

# -------- PRODUCTION STAGE --------
FROM node:22.15.1-slim AS prod

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev # only ship production deps

COPY --from=build /app/node_modules/.prisma /app/node_modules/.prisma
COPY --from=build /app/node_modules/@prisma /app/node_modules/@prisma

COPY . .

EXPOSE 3300

CMD ["npm", "start"]

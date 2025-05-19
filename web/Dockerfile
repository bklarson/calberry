# Base stage (shared between dev and prod)
FROM node:22-slim AS base

WORKDIR /app
COPY package*.json ./
EXPOSE 3000

FROM base AS dev
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]

FROM base AS prod
RUN npm install --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]

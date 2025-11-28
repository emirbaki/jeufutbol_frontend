# 1. Build stage
FROM node:lts-slim AS build
WORKDIR /src

RUN npm install -g @angular/cli

COPY package*.json ./
RUN npm ci

COPY . .
RUN ng build --configuration=production

# 2. Serve stage
FROM node:lts-slim

WORKDIR /app

# Copy the built application
COPY --from=build /src/dist/frontend /app/dist/frontend

# Expose the port the server listens on
EXPOSE 4000

# Run the server
CMD ["node", "dist/frontend/server/server.mjs"]

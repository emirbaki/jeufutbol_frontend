FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build  # Bu script SSR build yapıyor olmalı

EXPOSE 4200

CMD node dist/frontend/server/main.js
  # Node.js SSR serverını başlat

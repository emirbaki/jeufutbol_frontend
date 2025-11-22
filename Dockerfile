# 1. Build stage
FROM node:lts-slim AS build
WORKDIR /src

RUN npm install -g @angular/cli

COPY package*.json ./
RUN npm ci

COPY . .
RUN ng build --configuration=production

# 2. Serve stage
FROM nginx:alpine

EXPOSE 80   
# <-- FIXED (not 4200)

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /src/dist/frontend/browser /usr/share/nginx/html

CMD ["nginx", "-g", "daemon off;"]

# 1. Build stage
FROM node:lts-slim AS build

WORKDIR /src

RUN npm install -g @angular/cli

COPY package*.json ./
RUN npm ci

COPY . .
RUN ng build --configuration=production

# 2. Serve stage
FROM nginx:stable

EXPOSE 80 443

# İstersen custom nginx.conf kopyala, yoksa bu satırı kaldırabilirsin
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Build sonucu dosyaları kopyala (buradaki yolu build çıktına göre kontrol et!)
COPY --from=build /src/dist/frontend/browser /usr/share/nginx/html

CMD ["nginx", "-g", "daemon off;"]

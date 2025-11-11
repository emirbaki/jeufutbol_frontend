# 1. Aşama: Angular app build
FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build --prod

# 2. Aşama: Nginx ile servis et
FROM nginx:stable

COPY nginx.conf /etc/nginx/conf.d/default.conf

# Burada builder aşamasından build dosyalarını kopyala
COPY --from=builder /app/dist/frontend /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

FROM node:20 as builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build --prod # Bu script SSR build yapıyor olmalı

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist/frontend /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

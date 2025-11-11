# 1️⃣ Build Angular app
FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build --prod

# 2️⃣ Serve with Nginx
FROM nginx:stable-alpine

# Copy built Angular files
COPY --from=builder /app/dist/frontend /usr/share/nginx/html

# Copy nginx.conf only if it exists in the build context
# Using a shell script entrypoint workaround to detect and copy nginx.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

CMD ["/docker-entrypoint.sh"]

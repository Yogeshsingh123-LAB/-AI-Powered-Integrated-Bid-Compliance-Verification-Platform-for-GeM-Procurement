# Multi-stage Dockerfile for React/Vite Frontend (GeM Bid Compliance Platform)

# Stage 1: Build static web assets using Node.js
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source files and build for production
COPY . .
RUN npm run build

# Stage 2: Serve production assets via Nginx
FROM nginx:alpine

# Copy custom Nginx SPA configuration
RUN echo $'server {\n\
    listen 80;\n\
    server_name localhost;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
\n\
    error_page 500 502 503 504 /50x.html;\n\
    location = /50x.html {\n\
        root /usr/share/nginx/html;\n\
    }\n\
}' > /etc/nginx/conf.d/default.conf

# Copy compiled frontend assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

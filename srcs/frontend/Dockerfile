# Stage 1: build
FROM node:18 AS build
WORKDIR /app

# Copy package files for better layer caching
COPY package*.json ./

# Install dependencies
RUN npm install
# # Install a better static server that handles MIME types correctly
# RUN npm install -g http-server

# Copy configuration files
COPY tsconfig.json ./

# Copy source code
COPY src/ ./src/
COPY public/ ./public/

# Create output directory
RUN mkdir -p ./public/js

# Compile TypeScript
RUN npx tsc

# Debug: Show what files were created
RUN echo "=== Files in public/ ===" && ls -la ./public/ && echo "=== Files in public/js/ ===" && ls -la ./public/js/ 2>/dev/null || echo "No js directory found"

# Expose port 3000 (matches your docker-compose)
# EXPOSE 3000

# Use http-server instead of serve (better MIME type handling)
# CMD ["http-server", "./public", "-p", "3000", "-a", "0.0.0.0", "--cors", "-c-1"]


# Stage 2: serve
FROM nginx:alpine

# Install OpenSSL (needed to generate certs)
RUN apk add --no-cache openssl

# Create and copy SSL dir
RUN mkdir -p /etc/nginx/ssl
COPY ssl /etc/nginx/ssl

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy frontend files
COPY --from=build /app/public /usr/share/nginx/html

EXPOSE 443 80
ENTRYPOINT ["nginx", "-g", "daemon off;"]


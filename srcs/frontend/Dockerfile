# Stage 1: build
FROM node:18 AS build
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including Vite as dev dependency)
RUN npm install

# Copy configuration files
COPY tsconfig.json ./
COPY vite.config.ts ./
# COPY src/postcss.config.js ./postcss.config.js
# COPY src/tailwind.config.js ./tailwind.config.js

COPY src/postcss.config.cjs ./postcss.config.cjs
COPY src/tailwind.config.cjs ./tailwind.config.cjs

# Copy source code
COPY src/ ./src/
COPY public/ ./public/

# Build Tailwind CSS
RUN npx tailwindcss -i ./src/input.css -o ./public/styles/tailwind.css --minify

# Build with Vite (this bundles Babylon.js properly)
RUN npx vite build

# Debug: Show what was built
RUN echo "=== Built files ===" && ls -la ./dist/

# Stage 2: serve
FROM nginx:alpine
 
# Install OpenSSL
RUN apk add --no-cache openssl

# Create SSL directory
RUN mkdir -p /etc/nginx/ssl
COPY ssl /etc/nginx/ssl
# Generate a self-signed certificate if none was provided
RUN if [ ! -f /etc/nginx/ssl/nginx.crt ] || [ ! -f /etc/nginx/ssl/nginx.key ]; then \
      openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/ssl/nginx.key \
        -out /etc/nginx/ssl/nginx.crt \
        -subj "/CN=localhost"; \
    fi

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from Vite (dist folder, not public)
COPY --from=build /app/dist /usr/share/nginx/html

# Copy styles (temp fix since game and tournament are not in tailwind yet)
COPY --from=build /app/public/styles /usr/share/nginx/html/styles

EXPOSE 443 80
ENTRYPOINT ["nginx", "-g", "daemon off;"]
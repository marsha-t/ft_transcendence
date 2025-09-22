FROM nginx:alpine

# Install OpenSSL (needed to generate certs)
RUN apk add --no-cache openssl

# Create and copy SSL dir
RUN mkdir -p /etc/nginx/ssl
COPY srcs/nginx/ssl /etc/nginx/ssl

# Copy nginx config
COPY srcs/nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Copy frontend files
COPY srcs/frontend/public /usr/share/nginx/html/

EXPOSE 443 80
ENTRYPOINT ["nginx", "-g", "daemon off;"]

    

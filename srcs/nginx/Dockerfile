FROM nginx:alpine

# Install OpenSSL (needed to generate certs)
RUN apk add --no-cache openssl

# Create SSL dir
RUN mkdir -p /etc/nginx/ssl

# Generate self-signed certificate (valid 1 year)
RUN openssl req -x509 -nodes -days 365 \
    -subj "/C=US/ST=Denial/L=Springfield/O=Dis/CN=localhost" \
    -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/nginx.key \
    -out /etc/nginx/ssl/nginx.crt

# Copy nginx config
COPY srcs/nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY srcs/nginx/start_nginx.sh /start_nginx.sh
RUN chmod +x /start_nginx.sh

# Copy frontend build
COPY srcs/frontend/public /usr/share/nginx/html/
# CMD sh
EXPOSE 443 80
ENTRYPOINT ["sh", "/start_nginx.sh"]
# ENTRYPOINT ["sh", "nginx -g \"daemon off;\""]

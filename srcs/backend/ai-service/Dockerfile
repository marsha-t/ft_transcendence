FROM node:20-alpine3.18

# Install OpenSSL 1.1 compatibility (pulls in libcrypto1.1 + libssl1.1 automatically)
RUN apk add --no-cache openssl1.1-compat

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
COPY prisma/schema.prisma ./prisma/schema.prisma

# Generate Prisma client
RUN npx prisma generate

EXPOSE 5007

CMD ["node", "server.js"]
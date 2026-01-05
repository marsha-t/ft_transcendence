FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

RUN mkdir -p /app/prisma/data
RUN npx prisma generate

# Auth and Profile need uploads directory
RUN mkdir -p /app/uploads/avatars

EXPOSE 5001

CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]

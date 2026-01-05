FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

RUN mkdir -p /app/prisma/data
RUN npx prisma generate


# RUN mkdir -p /app/uploads/avatars

EXPOSE 5005

CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]

FROM node:20-alpine

WORKDIR /app


COPY package.json package-lock.json ./

RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 5003

CMD ["node", "server.js"]

FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

RUN mkdir -p /app/prisma/data
RUN npx prisma generate

# Auth and Profile need uploads directory
RUN mkdir -p /app/uploads/avatars

EXPOSE 5002

CMD ["sh", "-c", "sleep 5 && node server.js"] 
#waits data migration in the auth-service to complete
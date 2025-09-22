# Use Node base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install
COPY package.json ./
RUN npm install

# Copy rest of app
COPY . .

# Expose port
EXPOSE 5001

# Run Prisma generate during build
RUN npx prisma generate

# Apply migrations at container startup
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]

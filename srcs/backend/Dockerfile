# Use Node base image
FROM node:20

# Set working directory
WORKDIR /app

# Copy package files and install
COPY package.json ./
RUN npm install

# Copy rest of app
COPY . .

# Expose port
EXPOSE 5000

# Run Prisma migrate + generate during build
RUN npx prisma migrate deploy
RUN npx prisma generate

# Start server
CMD ["npm", "start"]

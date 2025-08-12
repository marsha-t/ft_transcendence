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

# Start server
CMD ["npm", "start"]

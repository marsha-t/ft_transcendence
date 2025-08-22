# Use Node 18
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if exists) and install dependencies
COPY package*.json ./
RUN npm install

# Copy all source code
COPY . .

# Compile TypeScript into public/
RUN npx tsc

# Expose port for lite-server
EXPOSE 3000

# Start lite-server serving public/
CMD ["npx", "lite-server", "--baseDir=./public", "--no-ui", "--no-open"]

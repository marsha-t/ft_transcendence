# Use a Node.js base image
FROM node:18

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json and install dependencies
COPY package*.json ./
RUN npm install

# Clean the output directory to prevent old files from persisting
RUN rm -rf ./public
RUN mkdir ./public

# Copy all application source code
COPY . .

# List source files to debug
RUN ls -la /app/src /app/src/components /app/src/pages || echo "Source directories missing"

# Build the TypeScript and check for errors
RUN npx tsc --diagnostics || { echo "TypeScript compilation failed"; exit 1; }

# Copy CSS files to public directory
# RUN mkdir -p /app/public/pages/Register && cp /app/src/pages/Register/Register.css /app/public/pages/Register/Register.css || echo "Failed to copy Register.css"
# Copy CSS files from pages to public
RUN find /app/src/pages -name "*.css" | while read file; do \
      dest="/app/public/$(echo $file | sed 's|/app/src/||')"; \
      mkdir -p "$(dirname "$dest")"; \
      cp "$file" "$dest"; \
    done

# Copy CSS files from components to public
RUN find /app/src/components -name "*.css" | while read file; do \
      dest="/app/public/$(echo $file | sed 's|/app/src/||')"; \
      mkdir -p "$(dirname "$dest")"; \
      cp "$file" "$dest"; \
    done

# Verify CSS files copied
RUN ls -la /app/public/pages/Register || echo "Register directory empty"


# List compiled files to verify output
RUN ls -la /app/public || echo "Public directory empty"

# Inspect main.js content
RUN cat /app/public/main.js || echo "main.js not found"

# Expose the port for the web server
EXPOSE 3000

# Start the application server
CMD ["npx", "serve", "./public", "-p", "3000", "--single"]
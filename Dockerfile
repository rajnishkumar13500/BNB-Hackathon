# Hardhat + Backend Tools Container
FROM node:20-alpine
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy project files
COPY hardhat.config.js ./
COPY contracts/ ./contracts/
COPY scripts/ ./scripts/
COPY test/ ./test/
COPY backend/ ./backend/

# Default: compile contracts (override with docker compose run)
CMD ["npx", "hardhat", "compile"]

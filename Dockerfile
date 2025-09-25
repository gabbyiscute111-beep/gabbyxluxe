# Use a lightweight Node image
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install dependencies based on lockfile for reproducibility
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Environment (Fly will inject DISCORD_TOKEN via secrets)
ENV NODE_ENV=production

# The bot does not listen on HTTP; it runs as a long-lived process
CMD ["npm", "start"]
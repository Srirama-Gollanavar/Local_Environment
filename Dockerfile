# Use official Node.js runtime as base image
FROM node:18-alpine

# Set working directory in container
WORKDIR /app

# Copy package.json and package-lock.json (if exists)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY env.js ./
COPY agent.js ./
COPY grader.js ./
COPY main.js ./
COPY openenv.yaml ./
COPY README.md ./

# Set environment variable for reproducibility
ENV NODE_ENV=production
ENV RANDOM_SEED=42

# Default command to run simulation
CMD ["node", "main.js"]

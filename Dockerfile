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
COPY simulation.js ./
COPY app.js ./
COPY openenv.yaml ./
COPY README.md ./

# Set environment variable for reproducibility
ENV NODE_ENV=production
ENV RANDOM_SEED=42
ENV PORT=7860

EXPOSE 7860

# Default command for Hugging Face Space
CMD ["node", "app.js"]

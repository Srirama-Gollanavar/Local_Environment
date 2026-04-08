# Use official Node.js runtime as base image
FROM node:18-alpine

# Set working directory in container
WORKDIR /app

# The validator executes `python inference.py`, so the image must provide a
# `python` binary in addition to Node.js.
RUN apk add --no-cache python3 py3-pip \
    && ln -sf /usr/bin/python3 /usr/bin/python

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
COPY inference.py ./
COPY pyproject.toml ./
COPY uv.lock ./
COPY openenv.yaml ./
COPY README.md ./
COPY server ./server

# Set environment variable for reproducibility
ENV NODE_ENV=production
ENV RANDOM_SEED=42
ENV PYTHONUNBUFFERED=1
ENV PORT=7860

EXPOSE 7860

# Default command for Hugging Face Space
CMD ["node", "app.js"]

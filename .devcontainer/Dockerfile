FROM mcr.microsoft.com/devcontainers/javascript-node:20

# Install pnpm
RUN npm install -g pnpm@8

# Install Playwright system dependencies
RUN npx playwright install-deps

# Set shell to bash
SHELL ["/bin/bash", "-c"]

# Set working directory
WORKDIR /workspace

# Switch to node user
USER node

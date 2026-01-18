FROM mcr.microsoft.com/devcontainers/javascript-node:20

# Install pnpm
RUN npm install -g pnpm@8

# Install Playwright system dependencies
RUN npx playwright install-deps

# Install GitHub CLI
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
    && chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
    && apt-get update \
    && apt-get install -y gh \
    && rm -rf /var/lib/apt/lists/*

# Set shell to bash
SHELL ["/bin/bash", "-c"]

# Set working directory
WORKDIR /workspace

# Switch to node user
USER node

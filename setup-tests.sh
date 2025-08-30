#!/bin/bash
# Setup script to run Puppeteer tests as the non-root tester user.
# Puppeteer requires a non-root environment to launch Chromium.

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Create the tester user if it doesn't exist
if ! id -u tester >/dev/null 2>&1; then
  useradd -m tester
fi

# Install required system dependencies for Chromium
apt-get update
apt-get install -y \
  nodejs \
  npm \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libxkbcommon0 \
  libx11-xcb1 \
  libxcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  libgbm1 \
  libnss3 \
  libgtk-3-0 \
  libxss1

# Install the Chromium browser required by Puppeteer
su -s /bin/bash tester -c "cd \"$PROJECT_DIR\" && npx puppeteer browsers install chrome"

# Run the Puppeteer tests as the tester user
su -s /bin/bash tester -c "cd \"$PROJECT_DIR\" && npm test"

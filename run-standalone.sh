#!/bin/bash

#
# This script will run the Copilot configured to work with the simulator.
#

if [ ! -d node_modules ]; then
  echo "Running: npm install"
  echo ""
  npm install
fi

export COPILOT_IP=127.0.0.1 \
COPILOT_PORT=44000 \
HTTP_PORT=8183 \

node index.js

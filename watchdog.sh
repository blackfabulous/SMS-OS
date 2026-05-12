#!/bin/bash
export NODE_OPTIONS="--max-old-space-size=4096"
while true; do
  if ! ss -tlnp | grep -q ":3000 "; then
    pkill -f "next-server" 2>/dev/null
    sleep 3
    cd /home/z/my-project && node node_modules/next/dist/bin/next dev -p 3000 --webpack >> dev.log 2>&1 &
    sleep 10
  fi
  sleep 10
done

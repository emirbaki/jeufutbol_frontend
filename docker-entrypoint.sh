#!/bin/sh

if [ -f /app/nginx.conf ]; then
  echo "Custom nginx.conf found — using it"
  cp /app/nginx.conf /etc/nginx/conf.d/default.conf
else
  echo "No custom nginx.conf found — using default config"
fi

exec nginx -g 'daemon off;'

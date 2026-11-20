#!/bin/sh
set -e

# Render, Vercel and other hosts inject PORT. Fall back to 80 for local Docker.
PORT="${PORT:-80}"
sed -i "s/__PORT__/${PORT}/g" /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'

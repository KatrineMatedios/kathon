#!/bin/sh
set -e

# Force the self-contained database (overrides any stale host env vars)
export DB_CONNECTION=mysql
export DB_HOST=127.0.0.1
export DB_PORT=3306
export DB_DATABASE=campus_lost_found
export DB_USERNAME=root
export DB_PASSWORD=
export SESSION_DRIVER=file
export SESSION_DOMAIN=

# ---- Start MariaDB ----
mkdir -p /run/mysqld
chown mysql:mysql /run/mysqld
mysqld --user=mysql --datadir=/var/lib/mysql --bind-address=127.0.0.1 > /var/log/mysql.log 2>&1 &

echo "Waiting for MariaDB..."
i=0
until mysqladmin ping --silent 2>/dev/null; do
    i=$((i + 1))
    if [ "$i" -gt 60 ]; then
        echo "MariaDB failed to start"
        cat /var/log/mysql.log || true
        exit 1
    fi
    sleep 1
done

# Root over TCP with no password (matches backend/.env defaults).
mysql -u root <<'SQL' 2>/dev/null || true
CREATE DATABASE IF NOT EXISTS campus_lost_found;
CREATE USER IF NOT EXISTS 'root'@'127.0.0.1' IDENTIFIED BY '';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'127.0.0.1' WITH GRANT OPTION;
FLUSH PRIVILEGES;
SQL

# ---- App key ----
if [ -n "${APP_KEY:-}" ]; then
    sed -i "s|^APP_KEY=.*|APP_KEY=${APP_KEY}|" .env
elif ! grep -q '^APP_KEY=base64:' .env 2>/dev/null; then
    php artisan key:generate --force
fi

# ---- Host / origin (auto-detect on Render) ----
if [ -n "${RENDER_EXTERNAL_URL:-}" ]; then
    HOST=$(printf '%s' "$RENDER_EXTERNAL_URL" | sed -E 's#^https?://##; s#[/:].*$##')
    sed -i "s|^APP_URL=.*|APP_URL=${RENDER_EXTERNAL_URL}|" .env
    grep -q '^SANCTUM_STATEFUL_DOMAINS=' .env 2>/dev/null \
        && sed -i "s|^SANCTUM_STATEFUL_DOMAINS=.*|SANCTUM_STATEFUL_DOMAINS=${HOST}|" .env \
        || printf 'SANCTUM_STATEFUL_DOMAINS=%s\n' "$HOST" >> .env
    grep -q '^CORS_ALLOWED_ORIGINS=' .env 2>/dev/null \
        && sed -i "s|^CORS_ALLOWED_ORIGINS=.*|CORS_ALLOWED_ORIGINS=${RENDER_EXTERNAL_URL}|" .env \
        || printf 'CORS_ALLOWED_ORIGINS=%s\n' "$RENDER_EXTERNAL_URL" >> .env
    export SESSION_SECURE_COOKIE=true
    export SESSION_SAME_SITE=lax
fi

# ---- Database ----
php artisan migrate --force

COUNT=$(php -r '
    try {
        $pdo = new PDO("mysql:host=127.0.0.1;port=3306;dbname=campus_lost_found", "root", "");
        echo $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
    } catch (Exception $e) { echo "0"; }
' 2>/dev/null || echo "0")

if [ "$COUNT" = "0" ]; then
    echo "Seeding demo data..."
    php artisan db:seed --force
fi

php artisan storage:link --force > /dev/null 2>&1 || true
php artisan config:clear > /dev/null 2>&1 || true

echo "CampusFind is ready."

exec apache2-foreground

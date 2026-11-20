#!/bin/sh
set -e

cd /var/www/html

CONNECTION="${DB_CONNECTION:-mysql}"
DB_PORT="${DB_PORT:-3306}"
[ "$CONNECTION" = "pgsql" ] && DB_PORT="${DB_PORT:-5432}"

# Use the APP_KEY supplied by the host (compose/secret), otherwise generate one.
if [ -n "${APP_KEY:-}" ]; then
    sed -i "s|^APP_KEY=.*|APP_KEY=${APP_KEY}|" .env
elif ! grep -q '^APP_KEY=base64:' .env 2>/dev/null; then
    php artisan key:generate --force
fi

# Build a DSN for the readiness check (no database name needed yet).
if [ "$CONNECTION" = "pgsql" ]; then
    DSN="pgsql:host=${DB_HOST};port=${DB_PORT}"
else
    DSN="mysql:host=${DB_HOST};port=${DB_PORT}"
fi

echo "Waiting for database (${CONNECTION}) at ${DB_HOST}:${DB_PORT} ..."
export DB_DSN="$DSN"
until php -r '
    $dsn = getenv("DB_DSN");
    try {
        new PDO($dsn, getenv("DB_USERNAME") ?: "root", getenv("DB_PASSWORD") ?: "");
        exit(0);
    } catch (Exception $e) {
        exit(1);
    }
' 2>/dev/null; do
    sleep 2
done
echo "Database is ready."

php artisan migrate --force

# Seed demo accounts once, on an empty users table.
DSN_FULL="${DSN};dbname=${DB_DATABASE}"
COUNT=$(DB_DSN="$DSN_FULL" php -r '
    try {
        $pdo = new PDO(getenv("DB_DSN"), getenv("DB_USERNAME") ?: "root", getenv("DB_PASSWORD") ?: "");
        echo $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
    } catch (Exception $e) {
        echo "0";
    }
' 2>/dev/null || echo "0")

if [ "$COUNT" = "0" ]; then
    echo "Seeding demo data..."
    php artisan db:seed --force
fi

php artisan storage:link --force >/dev/null 2>&1 || true
php artisan config:clear >/dev/null 2>&1 || true

echo "CampusFind is ready."

exec "$@"

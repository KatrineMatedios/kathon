#!/bin/sh
set -e

cd /var/www/html

# Use the APP_KEY supplied by the host (compose/secret), otherwise generate one.
if [ -n "${APP_KEY:-}" ]; then
    sed -i "s|^APP_KEY=.*|APP_KEY=${APP_KEY}|" .env
elif ! grep -q '^APP_KEY=base64:' .env 2>/dev/null; then
    php artisan key:generate --force
fi

# Wait until MySQL/MariaDB accepts connections.
echo "Waiting for database at ${DB_HOST}:${DB_PORT:-3306} ..."
until php -r '
    $host = getenv("DB_HOST") ?: "127.0.0.1";
    $port = getenv("DB_PORT") ?: "3306";
    try {
        new PDO("mysql:host={$host};port={$port}", getenv("DB_USERNAME") ?: "root", getenv("DB_PASSWORD") ?: "");
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
COUNT=$(php -r '
    $pdo = new PDO(
        "mysql:host=" . (getenv("DB_HOST") ?: "127.0.0.1") .
        ";port=" . (getenv("DB_PORT") ?: "3306") .
        ";dbname=" . (getenv("DB_DATABASE") ?: "campus_lost_found"),
        getenv("DB_USERNAME") ?: "root",
        getenv("DB_PASSWORD") ?: ""
    );
    echo $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
' 2>/dev/null || echo "0")

if [ "$COUNT" = "0" ]; then
    echo "Seeding demo data..."
    php artisan db:seed --force
fi

php artisan storage:link --force >/dev/null 2>&1 || true
php artisan config:clear >/dev/null 2>&1 || true

echo "CampusFind is ready."

exec "$@"

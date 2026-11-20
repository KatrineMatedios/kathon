# syntax=docker/dockerfile:1
# Self-contained CampusFind: React UI + Laravel API + MariaDB in one container.
# Build context: repository root

# ---- Stage 1: build the React app ----
FROM node:22-alpine AS frontend
WORKDIR /build
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
ENV VITE_API_URL=/api
RUN npm run build

# ---- Stage 2: PHP + Apache + MariaDB ----
FROM php:8.2-apache

RUN a2enmod rewrite headers \
 && apt-get update && apt-get install -y --no-install-recommends \
      mariadb-server \
      libzip-dev libpng-dev libjpeg62-turbo-dev libfreetype6-dev \
      libicu-dev libxml2-dev \
 && docker-php-ext-configure gd --with-freetype --with-jpeg \
 && docker-php-ext-install -j"$(nproc)" \
      pdo_mysql zip gd intl mbstring dom xml bcmath \
 && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

RUN printf '%s\n' \
    '<VirtualHost *:80>' \
    '    DocumentRoot /var/www/html/public' \
    '    <Directory /var/www/html/public>' \
    '        AllowOverride All' \
    '        Require all granted' \
    '    </Directory>' \
    '    ErrorLog ${APACHE_LOG_DIR}/error.log' \
    '    CustomLog ${APACHE_LOG_DIR}/access.log combined' \
    '</VirtualHost>' \
    > /etc/apache2/sites-available/000-default.conf

WORKDIR /var/www/html

COPY backend/ ./

RUN composer install --no-dev --prefer-dist --no-interaction --optimize-autoloader \
 && cp -n .env.example .env \
 && sed -i 's|^DB_HOST=.*|DB_HOST=127.0.0.1|' .env \
 && sed -i 's|^DB_DATABASE=.*|DB_DATABASE=campus_lost_found|' .env \
 && sed -i 's|^DB_USERNAME=.*|DB_USERNAME=root|' .env \
 && sed -i 's|^DB_PASSWORD=.*|DB_PASSWORD=|' .env \
 && sed -i 's|^SESSION_DOMAIN=.*|SESSION_DOMAIN=|' .env \
 && mkdir -p storage/framework/cache/data storage/framework/sessions \
            storage/framework/views storage/logs bootstrap/cache /run/mysqld \
 && chown -R www-data:www-data storage bootstrap/cache \
 && chown -R mysql:mysql /var/lib/mysql /run/mysqld \
 && mariadb-install-db --user=mysql --datadir=/var/lib/mysql > /dev/null

COPY --from=frontend /build/dist ./public/

COPY start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

EXPOSE 80

ENTRYPOINT ["/usr/local/bin/start.sh"]

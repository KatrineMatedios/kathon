# syntax=docker/dockerfile:1

# Build context is the REPO ROOT:
#   docker build -f backend/Dockerfile -t campusfind .

# ---- Stage 1: build the React app ----
FROM node:22-alpine AS frontend
WORKDIR /build

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# ---- Stage 2: Laravel + Apache serving both /api and the React UI ----
FROM php:8.2-apache

RUN a2enmod rewrite headers

RUN apt-get update && apt-get install -y --no-install-recommends \
        libzip-dev \
        libpng-dev \
        libjpeg62-turbo-dev \
        libfreetype6-dev \
        libicu-dev \
        libxml2-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" \
        pdo_mysql zip gd intl mbstring dom xml bcmath \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Laravel's public/ is the document root; its .htaccess handles SPA fallback.
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

RUN composer install \
        --no-dev \
        --prefer-dist \
        --no-interaction \
        --optimize-autoloader \
    && cp -n .env.example .env \
    && mkdir -p storage/framework/cache/data storage/framework/sessions \
               storage/framework/views storage/logs bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

# The React build is served by Laravel from public/ (single origin: UI + /api).
COPY --from=frontend /build/dist ./public/

COPY backend/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["apache2-foreground"]

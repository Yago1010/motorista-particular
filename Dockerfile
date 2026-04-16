FROM php:7.1-apache-buster

RUN sed -i 's/deb.debian.org/archive.debian.org/g' /etc/apt/sources.list \
    && sed -i 's/security.debian.org/archive.debian.org/g' /etc/apt/sources.list \
    && sed -i '/buster-updates/d' /etc/apt/sources.list

RUN apt-get update && apt-get install -y --no-install-recommends \
    libmcrypt-dev \
    libpng-dev \
    libjpeg62-turbo-dev \
    libfreetype6-dev \
    libzip-dev \
    unzip \
    && docker-php-ext-configure gd --with-freetype-dir=/usr/include/ --with-jpeg-dir=/usr/include/ \
    && docker-php-ext-install -j$(nproc) gd mysqli pdo_mysql zip \
    && pecl install mcrypt-1.0.0 \
    && docker-php-ext-enable mcrypt \
    && a2enmod rewrite headers \
    && rm -rf /var/lib/apt/lists/*

# Laravel 4 + PHP 7.1 can throw deprecated warnings as exceptions.
# Ignore deprecated notices so legacy mcrypt calls do not crash requests.
RUN { \
      echo "error_reporting=E_ALL & ~E_DEPRECATED & ~E_USER_DEPRECATED"; \
      echo "display_errors=Off"; \
      echo "log_errors=On"; \
    } > /usr/local/etc/php/conf.d/99-legacy-compat.ini

COPY docker/apache-vhost.conf /etc/apache2/sites-available/000-default.conf
COPY docker/entrypoint.sh /usr/local/bin/uber-entrypoint.sh
RUN chmod +x /usr/local/bin/uber-entrypoint.sh

WORKDIR /var/www/html

EXPOSE 80

ENTRYPOINT ["/usr/local/bin/uber-entrypoint.sh"]

#!/bin/bash
set -e
mkdir -p app/storage/logs app/storage/sessions app/storage/views app/storage/cache app/storage/meta
chmod -R 777 app/storage
exec apache2-foreground

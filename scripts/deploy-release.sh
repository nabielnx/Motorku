#!/usr/bin/env bash
set -euo pipefail
root=$(realpath "$1")
incoming=$(realpath "$2")
case "$root" in /|/var|/var/www|/home|/srv) echo 'Unsafe deployment path'; exit 1;; esac
case "$incoming" in "$root"/.incoming-*) ;; *) echo 'Invalid incoming release path'; exit 1;; esac
test -f "$root/.env" && test -d "$root/storage" && test -f "$incoming/artisan"
command -v rsync >/dev/null
command -v mysqldump >/dev/null
php -r 'exit(extension_loaded("gd") && (gd_info()["WebP Support"] ?? false) ? 0 : 1);'
umask 077
backup="$root/.deploy-backups/$(date -u +%Y%m%dT%H%M%SZ)-${incoming##*/}"
mkdir -p "$root/.deploy-backups"
chmod 700 "$root/.deploy-backups"
cd "$root"
php artisan down
# Any failure leaves maintenance enabled; restoring the database needs review.
trap 'echo "Deployment failed. Maintenance remains enabled. Backup: $backup" >&2' ERR
php "$incoming/scripts/backup-database.php" "$root" "$backup.sql"
tar --exclude=bootstrap/cache --exclude=public/storage -czf "$backup-code.tgz" \
    app bootstrap config database public resources routes artisan composer.json composer.lock vendor
umask 022
for directory in app bootstrap config database public resources routes vendor scripts; do
    mkdir -p "$root/$directory"
    rsync -a --delete --exclude=/storage --exclude=/cache "$incoming/$directory/" "$root/$directory/"
done
for file in artisan composer.json composer.lock; do cp "$incoming/$file" "$root/$file"; done
# Old provider manifests may reference packages removed in this release.
rm -f bootstrap/cache/packages.php bootstrap/cache/services.php bootstrap/cache/config.php bootstrap/cache/events.php bootstrap/cache/routes-v7.php
php artisan optimize:clear
php artisan migrate --force
if [ ! -L public/storage ]; then php artisan storage:link; fi
php artisan app:check-deployment
php artisan optimize
php artisan queue:restart
php artisan up
echo "Deployment complete. Backup: $backup"

#!/usr/bin/env bash
set -euo pipefail
root=$(realpath "$1")
incoming=$(realpath "$2")
mode=${3:-update}
case "$mode" in update|--first-install) ;; *) echo 'Unknown deployment mode'; exit 1;; esac
case "$root" in /|/var|/var/www|/home|/srv) echo 'Unsafe deployment path'; exit 1;; esac
case "$incoming" in "$root"/.incoming-*) ;; *) echo 'Invalid incoming release path'; exit 1;; esac
test -f "$root/.env" && test -d "$root/storage" && test -f "$incoming/artisan"
exec 9>"$root/.deploy.lock"
flock -n 9 || { echo 'Another deployment or cleanup is active' >&2; exit 1; }
command -v rsync >/dev/null
command -v mysqldump >/dev/null
php -r 'exit(extension_loaded("gd") && (gd_info()["WebP Support"] ?? false) ? 0 : 1);'
umask 077
backup="$root/.deploy-backups/$(date -u +%Y%m%dT%H%M%SZ)-${incoming##*/}"
mkdir -p "$root/.deploy-backups"
chmod 700 "$root/.deploy-backups"
cd "$root"
if [ "$mode" = --first-install ]; then
    test ! -e artisan
    test ! -L "$root/.env"
    test ! -L "$root/storage"
    test -z "$(find "$root" -mindepth 1 -maxdepth 1 ! -name .env ! -name storage ! -name .deploy.lock ! -name "${incoming##*/}" ! -name .deploy-backups -print -quit)"
    test -z "$(find "$root/storage" -type l -print -quit)"
    test -z "$(find "$root/storage" -type f ! -name .gitignore -print -quit)"
else
    php artisan down
    # Any failure leaves maintenance enabled; restoring the database needs review.
    trap 'echo "Deployment failed. Maintenance remains enabled. Backup: $backup" >&2' ERR
    php "$incoming/scripts/backup-database.php" "$root" "$backup.sql"
    tar --exclude=bootstrap/cache --exclude=public/storage -czf "$backup-code.tgz" \
        app bootstrap config database public resources routes artisan composer.json composer.lock vendor
fi
umask 022
for directory in app bootstrap config database public resources routes vendor scripts; do
    mkdir -p "$root/$directory"
    rsync -a --delete --exclude=/storage --exclude=/cache "$incoming/$directory/" "$root/$directory/"
done
for file in artisan composer.json composer.lock; do cp "$incoming/$file" "$root/$file"; done
mkdir -p bootstrap/cache storage/app/private storage/app/public storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs
# Static asset requests may use a different web-server user on shared hosting.
# Protect private trees before allowing traversal to public uploads.
chmod o-rwx storage/app/private storage/framework storage/logs
chmod o+x "$root" storage storage/app storage/app/public
# Old provider manifests may reference packages removed in this release.
rm -f bootstrap/cache/packages.php bootstrap/cache/services.php bootstrap/cache/config.php bootstrap/cache/events.php bootstrap/cache/routes-v7.php
if [ "$mode" = --first-install ]; then
    php artisan down
    # The database name is read privately from Laravel configuration, not shell env.
    database=$(php -r 'require "vendor/autoload.php"; $app=require "bootstrap/app.php"; $app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap(); echo Illuminate\Support\Facades\DB::connection()->getDatabaseName();')
    php artisan app:initialize-production "$database"
    php artisan optimize:clear
else
    php artisan optimize:clear
    php artisan migrate --force
fi
if [ -L public/storage ]; then
    test "$(realpath -e public/storage)" = "$(realpath -e storage/app/public)"
else
    test ! -e public/storage
    ln -s "$root/storage/app/public" public/storage
fi
if [ "$mode" = --first-install ]; then
    php artisan app:check-deployment --allow-empty-installation
else
    if ! php artisan app:check-deployment; then
        # A self-service installation can still be awaiting its first owner.
        # This repeats every host check and requires all operational data empty.
        php artisan app:check-deployment --allow-empty-installation
    fi
fi
php artisan optimize
php artisan queue:restart
php artisan up
if [ "$mode" = --first-install ]; then
    echo 'First installation complete. No existing database or code was overwritten.'
else
    echo "Deployment complete. Backup: $backup"
fi

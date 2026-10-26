#!/usr/bin/env bash
set -euo pipefail
repo=$(cd "$(dirname "$0")/../.." && pwd)
fixture=$(mktemp -d)
trap 'rm -rf -- "$fixture"' EXIT
mkdir "$fixture/bin"
cat > "$fixture/bin/php" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
if [ "$1" = -r ]; then
    case "$2" in *getDatabaseName*) echo empty_install_test;; esac
    exit 0
fi
printf '%s\n' "$*" >> "$INSTALL_TEST_LOG"
case "$*" in
    'artisan app:initialize-production empty_install_test') exit "${INSTALL_TEST_FAIL:-0}";;
    'artisan storage:link') ln -s "$PWD/storage/app/public" "$PWD/public/storage";;
esac
MOCK
cat > "$fixture/bin/rsync" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
source=${@: -2:1}
target=${@: -1}
cp -a "${source}." "$target"
MOCK
printf '#!/usr/bin/env bash\nexit 0\n' > "$fixture/bin/mysqldump"
chmod +x "$fixture/bin/"*
export PATH="$fixture/bin:$PATH"
export INSTALL_TEST_LOG="$fixture/commands"

prepare() {
    root="$fixture/$1"
    incoming="$root/.incoming-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    mkdir -p "$root/storage" "$incoming"
    touch "$root/.env" "$incoming/artisan" "$incoming/composer.json" "$incoming/composer.lock"
    for directory in app bootstrap config database public resources routes vendor scripts; do mkdir "$incoming/$directory"; done
    : > "$INSTALL_TEST_LOG"
}

prepare successful
bash "$repo/scripts/deploy-release.sh" "$root" "$incoming" --first-install
grep -qx 'artisan app:initialize-production empty_install_test' "$INSTALL_TEST_LOG"
grep -qx 'artisan app:check-deployment --allow-empty-installation' "$INSTALL_TEST_LOG"
grep -qx 'artisan up' "$INSTALL_TEST_LOG"
test -L "$root/public/storage"
if grep -Eq 'backup-database|artisan migrate --force|db:wipe|migrate:fresh' "$INSTALL_TEST_LOG"; then exit 1; fi
echo 'PASS: first install initializes empty database, verifies registration readiness, and skips update/backup commands'

prepare failed
if INSTALL_TEST_FAIL=1 bash "$repo/scripts/deploy-release.sh" "$root" "$incoming" --first-install; then exit 1; fi
grep -qx 'artisan down' "$INSTALL_TEST_LOG"
if grep -qx 'artisan up' "$INSTALL_TEST_LOG"; then exit 1; fi
echo 'PASS: initialization failure never brings application up'

prepare existing
touch "$root/artisan"
if bash "$repo/scripts/deploy-release.sh" "$root" "$incoming" --first-install; then exit 1; fi
test ! -s "$INSTALL_TEST_LOG"
echo 'PASS: existing installation is refused before application commands'

prepare uploads
mkdir -p "$root/storage/app/public"
echo 'keep' > "$root/storage/app/public/existing.jpg"
if bash "$repo/scripts/deploy-release.sh" "$root" "$incoming" --first-install; then exit 1; fi
grep -qx keep "$root/storage/app/public/existing.jpg"
test ! -s "$INSTALL_TEST_LOG"
echo 'PASS: existing storage data blocks first installation and remains intact'

prepare unexpected
touch "$root/customer-data.sql"
if bash "$repo/scripts/deploy-release.sh" "$root" "$incoming" --first-install; then exit 1; fi
test ! -s "$INSTALL_TEST_LOG"
echo 'PASS: unexpected files block first installation'

prepare symlink
mkdir -p "$fixture/shared"
ln -s "$fixture/shared" "$root/storage/shared"
if bash "$repo/scripts/deploy-release.sh" "$root" "$incoming" --first-install; then exit 1; fi
test ! -s "$INSTALL_TEST_LOG"
echo 'PASS: linked storage is refused before application commands'

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
    'artisan storage:link') echo 'PHP symlink/exec are disabled' >&2; exit 99;;
    'artisan app:check-deployment') exit "${INSTALL_TEST_OWNER_MISSING:-0}";;
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
    chmod 750 "$root" "$root/storage"
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
test "$(stat -c %a "$root")" = 751
test "$(stat -c %a "$root/storage")" = 751
for directory in storage/app/private storage/framework storage/logs; do
    mode=$(stat -c %a "$root/$directory")
    test "$((8#$mode & 7))" -eq 0
done
if grep -Eq 'backup-database|artisan migrate --force|artisan storage:link|db:wipe|migrate:fresh' "$INSTALL_TEST_LOG"; then exit 1; fi
echo 'PASS: first install initializes empty database, verifies registration readiness, and skips update/backup commands'
echo 'PASS: public uploads are traversable while private trees remain protected'

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

prepare unexpected_public_storage
mkdir "$incoming/public/storage"
echo keep > "$incoming/public/storage/file.txt"
if bash "$repo/scripts/deploy-release.sh" "$root" "$incoming" --first-install; then exit 1; fi
grep -qx keep "$root/public/storage/file.txt"
if grep -qx 'artisan up' "$INSTALL_TEST_LOG"; then exit 1; fi
echo 'PASS: existing public storage directory is preserved and never overwritten'

prepare ownerless_update
for directory in app bootstrap config database public resources routes vendor scripts; do cp -a "$incoming/$directory" "$root/$directory"; done
cp "$incoming/artisan" "$root/artisan"
cp "$incoming/composer.json" "$root/composer.json"
cp "$incoming/composer.lock" "$root/composer.lock"
INSTALL_TEST_OWNER_MISSING=1 bash "$repo/scripts/deploy-release.sh" "$root" "$incoming"
grep -qx 'artisan app:check-deployment' "$INSTALL_TEST_LOG"
grep -qx 'artisan app:check-deployment --allow-empty-installation' "$INSTALL_TEST_LOG"
grep -qx 'artisan up' "$INSTALL_TEST_LOG"
echo 'PASS: update before first registration requires full empty-installation validation'

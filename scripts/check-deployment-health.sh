#!/usr/bin/env bash
set -euo pipefail

app_url=${1:?Usage: check-deployment-health.sh https://application.example}
if [[ ! "$app_url" =~ ^https://[^/?#@[:space:]]+(/[^?#[:space:]]*)?$ ]]; then
    echo 'Health check requires an HTTPS application URL without credentials, query, or fragment.' >&2
    exit 1
fi
app_url=${app_url%/}
work=$(mktemp -d)
trap 'rm -f -- "$work/headers" "$work/body"; rmdir -- "$work"' EXIT

probe() {
    curl_exit=0
    http_code=$(curl --disable --silent --show-error --location --max-redirs 3 \
        --proto '=https' --proto-redir '=https' --connect-timeout 10 --max-time 25 \
        --max-filesize 1048576 --user-agent 'TokoM-Deployment-Health/1.0' \
        --header 'Cache-Control: no-cache' --dump-header "$work/headers" \
        --output "$work/body" --write-out '%{http_code}' "$1") || curl_exit=$?
}

for attempt in 1 2 3 4; do
    target="$app_url/up"
    probe "$target"
    if [ "$curl_exit" -eq 0 ] && [ "$http_code" = 200 ] && grep -q 'Application up' "$work/body"; then
        # Laravel exempts /up from maintenance; also verify the actual storefront is available.
        target="$app_url/"
        probe "$target"
        if [ "$curl_exit" -eq 0 ] && [ "$http_code" = 200 ]; then
            echo 'Health check passed: Laravel /up and storefront both returned HTTP 200.'
            exit 0
        fi
    fi

    echo "Health check attempt $attempt/4 failed: $target (HTTP $http_code, curl exit $curl_exit)." >&2
    # Keep request IDs for hosting support, without logging cookies or application response bodies.
    if [ -f "$work/headers" ]; then
        grep -Ei '^(HTTP/|server:|content-type:|x-hcdn-request-id:|cf-ray:|retry-after:)' "$work/headers" >&2 || true
    fi
    case "$http_code" in
        000|200|403|408|425|429|5[0-9][0-9]) ;; # Includes transient CDN rejection and maintenance.
        *) break ;;
    esac
    if [ "$attempt" -lt 4 ]; then sleep 5; fi
done

echo 'Health check failed; deployment is not approved. For persistent 403, review hosting/CDN rules using the request ID above.' >&2
exit 1

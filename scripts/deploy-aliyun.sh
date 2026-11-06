#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REMOTE="${TYPEX_REMOTE:-root@8.130.37.52}"
RELEASE="$(date -u +%Y%m%dT%H%M%SZ)"
STAGE="$(mktemp -d /tmp/typex-deploy.XXXXXX)"
trap 'rm -rf "$STAGE"' EXIT
cd "$ROOT_DIR"
npm test
npm run build
COPYFILE_DISABLE=1 tar --no-xattrs -czf "$STAGE/release.tgz" -C dist .
scp -o BatchMode=yes "$STAGE/release.tgz" "$REMOTE:/tmp/typex-$RELEASE.tgz"
scp -o BatchMode=yes deploy/typex.nginx.conf "$REMOTE:/tmp/typex-$RELEASE.nginx.conf"
ssh -o BatchMode=yes "$REMOTE" "bash -s -- '$RELEASE'" <<'REMOTE_SCRIPT'
set -euo pipefail
release="$1"
archive="/tmp/typex-$release.tgz"
config="/tmp/typex-$release.nginx.conf"
vhost=/usr/local/nginx/conf/vhost/typex.conf
nginx=/usr/local/nginx/sbin/nginx
trap 'rm -f "$archive" "$config"' EXIT
install -d -m 755 /opt/typex/releases /var/www/certbot
install -d -m 755 "/opt/typex/releases/$release"
tar -xzf "$archive" -C "/opt/typex/releases/$release"
chmod -R u=rwX,go=rX "/opt/typex/releases/$release"
test -s "/opt/typex/releases/$release/index.html"
if [ ! -e /etc/letsencrypt/live/typex.mushayu.com/fullchain.pem ]; then
  if [ -e "$vhost" ]; then cp -p "$vhost" "$vhost.before-$release"; fi
  cat > "$vhost" <<'ACME'
server {
    listen 80;
    server_name typex.mushayu.com;
    location ^~ /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 503; }
}
ACME
  "$nginx" -t
  systemctl reload nginx
  certbot certonly --webroot -w /var/www/certbot -d typex.mushayu.com --non-interactive --agree-tos </dev/null
fi
old_release="$(readlink /opt/typex/current || true)"
if [ -e "$vhost" ]; then cp -p "$vhost" "$vhost.before-$release"; fi
install -m 644 "$config" "$vhost"
if ! "$nginx" -t; then
  if [ -e "$vhost.before-$release" ]; then mv "$vhost.before-$release" "$vhost"; else rm -f "$vhost"; fi
  exit 1
fi
ln -s "/opt/typex/releases/$release" /opt/typex/current.next
mv -Tf /opt/typex/current.next /opt/typex/current
if ! systemctl reload nginx; then
  if [ -n "$old_release" ]; then ln -s "$old_release" /opt/typex/current.rollback; mv -Tf /opt/typex/current.rollback /opt/typex/current; fi
  if [ -e "$vhost.before-$release" ]; then cp -p "$vhost.before-$release" "$vhost"; fi
  exit 1
fi
if [ -n "$old_release" ]; then ln -sfn "$old_release" /opt/typex/previous; fi
systemctl is-active --quiet certbot.timer
printf 'Active release: %s\n' "$release"
REMOTE_SCRIPT
curl --fail --silent --show-error --retry 5 --retry-all-errors --retry-delay 2 --max-time 30 "https://typex.mushayu.com/?release=$RELEASE" -o "$STAGE/remote-index.html"
cmp dist/index.html "$STAGE/remote-index.html"
printf 'Deployed and verified: https://typex.mushayu.com (release %s)\n' "$RELEASE"

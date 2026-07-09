---
name: binghewebdeploy
description: Deploy and verify the bingheweb site on the remote Ubuntu server using Node.js, PM2, Nginx reverse proxy, and Let's Encrypt.
---

# Bingheweb Deploy

Use this skill when the user asks to deploy, restart, verify, or troubleshoot the `bingheweb` website.

## Current Architecture

- Local workspace: `/Users/byai/Documents/bingheweb`
- Public site: `https://binghexx.com/`
- Canonical domain: `binghexx.com`
- `www.binghexx.com` redirects to `https://binghexx.com/`
- Remote server: `ubuntu@122.51.217.28`
- SSH key: `~/.ssh/binghewebnew.pem`
- Remote app directory: `/var/www/bingheweb`
- Old static backup pattern: `/var/www/bingheweb-static-backup-YYYYMMDDHHMMSS`
- Runtime: Node.js service bound to `127.0.0.1:8080`
- Process manager: PM2 service named `bingheweb`
- Web entry: Nginx reverse proxy to `http://127.0.0.1:8080`
- Nginx config: `/etc/nginx/sites-enabled/bingheweb`
- TLS cert: `/etc/letsencrypt/live/binghexx.com/fullchain.pem`
- TLS key: `/etc/letsencrypt/live/binghexx.com/privkey.pem`

## Security Rules

- Do not print real `.env` values, DingTalk webhook URLs, DingTalk signing secrets, session secrets, or API signing secrets in chat or logs.
- Treat any value in `.env` as secret. Show only key names or redacted lengths.
- Do not commit `.env` unless the user explicitly asks and understands the security risk.
- Default deploy should not overwrite production `.env`. Update `.env` separately only when the user asks to change production configuration.
- If `.env` was exposed on GitHub, rotate the DingTalk webhook token/signing secret and app signing/session secrets.
- Keep Git author email on the GitHub noreply address, not a private work email.

## Preflight Checks

Run from `/Users/byai/Documents/bingheweb`:

```bash
git status --short --branch
node --check server.js
node --check api/lead.js
node --check assets/js/main.js
node --check assets/js/register.js
```

If frontend assets were changed and users report broken layout after deploy, add or bump query versions on CSS/JS links in HTML, for example:

```html
assets/css/styles.css?v=YYYYMMDD-N
assets/js/main.js?v=YYYYMMDD-N
```

This avoids stale browser cache from older static Nginx deployments.

## Deploy Updated Code

Prefer a tar upload from local to remote because remote GitHub access has previously failed with TLS/network errors.

Default safe upload excludes Git metadata, local COS output, and `.env`:

```bash
tar --exclude='./.git' \
  --exclude='./coscli_output' \
  --exclude='./.env' \
  -czf - . \
| ssh -i ~/.ssh/binghewebnew.pem ubuntu@122.51.217.28 '
  set -e
  tmp_dir=/tmp/bingheweb-deploy-$(date +%Y%m%d%H%M%S)
  mkdir -p "$tmp_dir"
  tar -xzf - -C "$tmp_dir"
  sudo rsync -a --delete --exclude=.env "$tmp_dir"/ /var/www/bingheweb/
  rm -rf "$tmp_dir"
'
```

If this is the first deploy or a deliberate full replacement, back up the current remote directory first:

```bash
ssh -i ~/.ssh/binghewebnew.pem ubuntu@122.51.217.28 '
  set -e
  if [ -d /var/www/bingheweb ]; then
    sudo mv /var/www/bingheweb /var/www/bingheweb-static-backup-$(date +%Y%m%d%H%M%S)
  fi
  sudo mkdir -p /var/www/bingheweb
  sudo chown ubuntu:ubuntu /var/www/bingheweb
'
```

When production `.env` must be updated, upload it explicitly after confirming the user intended to update secrets:

```bash
scp -i ~/.ssh/binghewebnew.pem .env ubuntu@122.51.217.28:/tmp/bingheweb.env
ssh -i ~/.ssh/binghewebnew.pem ubuntu@122.51.217.28 '
  set -e
  sudo install -m 600 -o ubuntu -g ubuntu /tmp/bingheweb.env /var/www/bingheweb/.env
  rm -f /tmp/bingheweb.env
'
```

## Start Or Restart Backend

On the remote server:

```bash
ssh -i ~/.ssh/binghewebnew.pem ubuntu@122.51.217.28 '
  set -e
  cd /var/www/bingheweb
  node --check server.js
  node --check api/lead.js
  pm2 start server.js --name bingheweb --cwd /var/www/bingheweb 2>/dev/null || pm2 restart bingheweb --update-env
  pm2 save
  sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu >/dev/null || true
  pm2 list
'
```

Expected PM2 state:

- process name: `bingheweb`
- status: `online`
- listening address: `127.0.0.1:8080`

Verify remote local service:

```bash
ssh -i ~/.ssh/binghewebnew.pem ubuntu@122.51.217.28 '
  set -e
  ss -lntp | grep 8080 || true
  curl -I --max-time 5 http://127.0.0.1:8080/
  curl -i --max-time 5 http://127.0.0.1:8080/api/lead
'
```

Expected:

- `/` returns `200 OK` and sets `bh_session`
- `GET /api/lead` returns `405` JSON with generic message, not HTML

## Nginx Reverse Proxy

The production Nginx config should proxy all HTTPS traffic to Node so the backend can issue `bh_session` cookies for HTML responses.

Expected `/etc/nginx/sites-enabled/bingheweb`:

```nginx
server {
    listen 80 default_server;
    server_name binghexx.com www.binghexx.com _;
    root /var/www/bingheweb;

    location ^~ /.well-known/acme-challenge/ {
        root /var/www/bingheweb;
        try_files $uri =404;
    }

    location / {
        return 301 https://binghexx.com$request_uri;
    }
}

server {
    listen 443 ssl default_server;
    server_name binghexx.com www.binghexx.com _;

    ssl_certificate /etc/letsencrypt/live/binghexx.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/binghexx.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    if ($host != binghexx.com) {
        return 301 https://binghexx.com$request_uri;
    }

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Do not store backup config files inside `/etc/nginx/sites-enabled`, because Nginx will load them and can fail with duplicate `default_server`. Put backups in `/etc/nginx/site-backups`.

After changes:

```bash
ssh -i ~/.ssh/binghewebnew.pem ubuntu@122.51.217.28 '
  set -e
  sudo nginx -t
  sudo systemctl reload nginx
'
```

## TLS Certificate

Both `binghexx.com` and `www.binghexx.com` should be included in the same Let's Encrypt certificate.

Check:

```bash
ssh -i ~/.ssh/binghewebnew.pem ubuntu@122.51.217.28 'sudo certbot certificates'
```

Renew or expand if `www.binghexx.com` is missing:

```bash
ssh -i ~/.ssh/binghewebnew.pem ubuntu@122.51.217.28 '
  sudo certbot certonly --webroot \
    -w /var/www/bingheweb \
    -d binghexx.com \
    -d www.binghexx.com \
    --cert-name binghexx.com \
    --expand \
    --non-interactive
  sudo nginx -t
  sudo systemctl reload nginx
'
```

## Public Verification

Run after every deploy:

```bash
curl -I --max-time 8 https://binghexx.com/
curl -i --max-time 8 https://binghexx.com/api/lead
curl -I --max-time 8 https://www.binghexx.com/
```

Expected:

- `https://binghexx.com/` returns `200 OK`
- response includes `Set-Cookie: bh_session=...`
- `GET /api/lead` returns `405` JSON, not HTML
- `https://www.binghexx.com/` returns `301` to `https://binghexx.com/`

Verify token endpoint with a browser-like Referer and cookie:

```bash
cookie_jar=$(mktemp)
curl -sS -o /tmp/binghe-home.html -c "$cookie_jar" --max-time 8 https://binghexx.com/
curl -sS -i -b "$cookie_jar" -e https://binghexx.com/ --max-time 8 https://binghexx.com/api/lead-token
rm -f "$cookie_jar"
```

Expected: `200 OK` and JSON with `ok: true`, `timestamp`, `nonce`, and `signature`.

Do not submit a real lead form unless the user explicitly asks, because it sends a DingTalk group message. To smoke-test POST without sending DingTalk, use the honeypot field:

```bash
node - <<'NODE'
const base = 'https://binghexx.com';
const home = await fetch(base + '/');
const cookie = home.headers.get('set-cookie')?.split(';')[0];
if (!cookie) throw new Error('missing session cookie');
const tokenResponse = await fetch(base + '/api/lead-token', {
  headers: { cookie, referer: base + '/' }
});
const token = await tokenResponse.json();
if (!tokenResponse.ok || !token.ok) throw new Error('token failed');
const submitResponse = await fetch(base + '/api/lead', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    cookie,
    referer: base + '/',
    'x-lead-timestamp': String(token.timestamp),
    'x-lead-nonce': token.nonce,
    'x-lead-signature': token.signature
  },
  body: JSON.stringify({ website: 'bot-check' })
});
console.log(submitResponse.status, await submitResponse.text());
NODE
```

Expected: `200 {"ok":true}`.

## Common Issues

### Page layout looks broken after deploy

Likely stale CSS/JS cache from old static Nginx headers. Bump query versions on CSS/JS links, deploy HTML, restart PM2, and recheck in Chrome.

### `/api/lead` returns HTML

Nginx is still serving static files instead of proxying to Node. Restore the reverse proxy config above and reload Nginx.

### `/api/lead-token` returns 403 in curl

This is expected if curl has no session cookie or no `Referer`/`Origin`. Recheck using the cookie jar command above.

### `www.binghexx.com` has certificate error

The certificate likely includes only `binghexx.com`. Use the certbot expand command above.

### GitHub push fails

Network to GitHub has previously timed out. Retry later. SSH push may fail unless a GitHub key is configured. Deployment does not require GitHub because tar upload is the preferred path.

## Final Response Checklist

When reporting deployment completion, include:

- public URL
- whether PM2 is online
- whether Nginx reloaded successfully
- whether `/`, `/api/lead`, `/api/lead-token`, and `www` redirect were verified
- whether a real DingTalk message was avoided or intentionally sent
- any GitHub push status if commits were involved
